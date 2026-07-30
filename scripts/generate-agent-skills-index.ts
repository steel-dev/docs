#!/usr/bin/env bun
// ABOUTME: Generates the Agent Skills discovery index and complete skill archives.
// ABOUTME: Reads one commit-pinned steel-dev/skills snapshot and fails the build on errors.
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { gzipSync } from 'node:zlib';
import matter from 'gray-matter';

/** Discovery schema this index conforms to: cloudflare/agent-skills-discovery-rfc. */
export const AGENT_SKILLS_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

const SKILLS_REPO = 'steel-dev/skills';
const OUTPUT_DIR = path.join(process.cwd(), 'public', '.well-known', 'agent-skills');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'index.json');

// Limits from the discovery schema, enforced here so a bad catalog entry fails
// the build rather than publishing an index clients will reject.
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;

// Ceiling on uncompressed content per skill archive. gzipSync buffers the whole
// archive in memory, so an unbounded upstream skill could bloat or OOM a deploy.
export const MAX_SKILL_ARCHIVE_CONTENT_BYTES = 5 * 1024 * 1024;

export type SkillArtifact = {
  name: string;
  description: string;
  content: Buffer;
};

export type AgentSkillsIndex = {
  $schema: string;
  skills: Array<{
    name: string;
    type: 'archive';
    description: string;
    url: string;
    digest: string;
  }>;
};

type Manifest = {
  skills: Record<string, { path: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateSkillName(name: string): void {
  if (name.length < 1 || name.length > MAX_NAME_LENGTH || !NAME_PATTERN.test(name)) {
    throw new Error(`Skill name "${name}" is not a valid discovery name`);
  }
}

function validateDescription(name: string, description: unknown): asserts description is string {
  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new Error(`Skill "${name}" must have a non-empty string description`);
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(
      `Skill "${name}" has a description longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    );
  }
}

function normalizeArchiveEntry(entryPath: string): string {
  const unixPath = entryPath.replaceAll('\\', '/').replace(/^\.\/+/, '');
  const normalized = path.posix.normalize(unixPath);

  if (
    path.posix.isAbsolute(unixPath) ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    unixPath.split('/').includes('..')
  ) {
    throw new Error(`Repository archive contains unsafe path "${entryPath}"`);
  }

  return normalized;
}

function normalizeSkillPath(skillName: string, skillPath: unknown): string {
  if (typeof skillPath !== 'string' || skillPath.trim().length === 0) {
    throw new Error(`Skill "${skillName}" has an invalid manifest path`);
  }

  const unixPath = skillPath.replaceAll('\\', '/');
  const segments = unixPath.split('/');
  const normalized = path.posix.normalize(unixPath);

  if (
    path.posix.isAbsolute(unixPath) ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    segments.some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error(`Skill "${skillName}" has unsafe manifest path "${skillPath}"`);
  }

  return normalized;
}

function parseManifest(source: string): Manifest {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('Repository manifest.json is not valid JSON');
  }

  if (!isRecord(parsed) || !isRecord(parsed.skills)) {
    throw new Error('Repository manifest.json must contain a skills object');
  }

  if (Object.keys(parsed.skills).length === 0) {
    throw new Error('No skills found in the catalog; refusing to publish an empty index');
  }

  return parsed as Manifest;
}

function normalizeTarHeaders(tarBytes: Buffer): Buffer {
  let offset = 0;

  while (offset + 512 <= tarBytes.length) {
    const header = tarBytes.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;

    const rawSize = header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
    const size = rawSize ? Number.parseInt(rawSize, 8) : 0;
    if (!Number.isFinite(size)) {
      throw new Error('Could not create skill archive: Bun produced an invalid tar size');
    }

    // Bun.Archive writes the current time into each tar header. Normalize it
    // and recompute the checksum so a fixed upstream commit has a fixed digest.
    header.write('00000000000\0', 136, 12, 'ascii');
    header.fill(0x20, 148, 156);
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    header.write(checksum.toString(8).padStart(6, '0'), 148, 6, 'ascii');
    header[154] = 0;
    header[155] = 0x20;

    offset += 512 + Math.ceil(size / 512) * 512;
  }

  return tarBytes;
}

async function createDeterministicArchive(files: Record<string, Blob>): Promise<Buffer> {
  const tarBytes = normalizeTarHeaders(Buffer.from(await new Bun.Archive(files).bytes()));
  const archiveBytes = gzipSync(tarBytes, { level: 9 });

  // zlib already writes a zero timestamp. Normalize the OS marker too so
  // archives produced on local macOS and Linux deploy builders stay identical.
  archiveBytes.fill(0, 4, 8);
  archiveBytes[9] = 0xff;
  return archiveBytes;
}

/** Builds the discovery index from complete archive artifacts. */
export function buildAgentSkillsIndex(artifacts: SkillArtifact[]): AgentSkillsIndex {
  if (artifacts.length === 0) {
    throw new Error('No skills found in the catalog; refusing to publish an empty index');
  }

  return {
    $schema: AGENT_SKILLS_SCHEMA,
    skills: artifacts.map((artifact) => {
      validateSkillName(artifact.name);
      validateDescription(artifact.name, artifact.description);

      return {
        name: artifact.name,
        type: 'archive' as const,
        description: artifact.description,
        url: `/.well-known/agent-skills/${artifact.name}.tar.gz`,
        digest: `sha256:${createHash('sha256').update(artifact.content).digest('hex')}`,
      };
    }),
  };
}

/**
 * Converts one GitHub repository snapshot into complete, root-layout skill archives.
 * The manifest and every supporting file therefore come from the same commit.
 */
export async function buildSkillArtifactsFromRepositoryArchive(
  repositoryBytes: Buffer,
): Promise<SkillArtifact[]> {
  const repositoryFiles = await new Bun.Archive(repositoryBytes).files();
  const normalizedFiles = new Map<string, File>();

  for (const [entryPath, file] of repositoryFiles) {
    const normalizedPath = normalizeArchiveEntry(entryPath);
    if (normalizedFiles.has(normalizedPath)) {
      throw new Error(`Repository archive contains duplicate path "${normalizedPath}"`);
    }
    normalizedFiles.set(normalizedPath, file);
  }

  const manifestCandidates = [...normalizedFiles.entries()].filter(([entryPath]) => {
    const segments = entryPath.split('/');
    return segments.length === 2 && segments[1] === 'manifest.json';
  });

  if (manifestCandidates.length !== 1) {
    throw new Error(
      `Repository archive must contain exactly one wrapper-level manifest.json; found ${manifestCandidates.length}`,
    );
  }

  const [manifestPath, manifestFile] = manifestCandidates[0] as [string, File];
  const wrapper = manifestPath.slice(0, -'/manifest.json'.length);
  const manifest = parseManifest(await manifestFile.text());
  const artifacts: SkillArtifact[] = [];

  for (const [skillName, manifestSkill] of Object.entries(manifest.skills)) {
    validateSkillName(skillName);
    if (!isRecord(manifestSkill)) {
      throw new Error(`Skill "${skillName}" has an invalid manifest entry`);
    }

    // Upstream treats path as optional and resolves `meta.path ?? name`; match
    // that so a legal upstream manifest cannot fail the docs build.
    const skillPath = normalizeSkillPath(skillName, manifestSkill.path ?? skillName);
    const archivePrefix = `${wrapper}/${skillPath}/`;
    // The upstream repository has no .gitignore, so hidden entries (.env.local,
    // .DS_Store) may exist in a snapshot and must never be republished.
    const skillFiles = [...normalizedFiles.entries()]
      .filter(([entryPath]) => entryPath.startsWith(archivePrefix))
      .map(([entryPath, file]) => [entryPath.slice(archivePrefix.length), file] as const)
      .filter(([entryPath]) => entryPath.length > 0)
      .filter(([entryPath]) => !entryPath.split('/').some((segment) => segment.startsWith('.')))
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    const skillMarkdown = skillFiles.find(([entryPath]) => entryPath === 'SKILL.md')?.[1];

    if (!skillMarkdown) {
      throw new Error(`Skill "${skillName}" is missing SKILL.md at its archive root`);
    }

    const contentBytes = skillFiles.reduce((total, [, file]) => total + file.size, 0);
    if (contentBytes > MAX_SKILL_ARCHIVE_CONTENT_BYTES) {
      throw new Error(
        `Skill "${skillName}" content is ${contentBytes} bytes, over the ${MAX_SKILL_ARCHIVE_CONTENT_BYTES} byte archive limit`,
      );
    }

    let metadata: Record<string, unknown>;
    try {
      metadata = matter(await skillMarkdown.text()).data as Record<string, unknown>;
    } catch (error) {
      throw new Error(
        `Skill "${skillName}" has SKILL.md frontmatter that is not valid YAML: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (typeof metadata.name !== 'string' || metadata.name !== skillName) {
      throw new Error(`Skill "${skillName}" frontmatter name must exactly match its manifest name`);
    }
    validateDescription(skillName, metadata.description);

    const archiveInput: Record<string, Blob> = {};
    for (const [entryPath, file] of skillFiles) {
      archiveInput[entryPath] = file;
    }

    artifacts.push({
      name: skillName,
      description: metadata.description,
      content: await createDeterministicArchive(archiveInput),
    });
  }

  return artifacts;
}

function githubAuthorizationHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function githubApiHeaders(): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...githubAuthorizationHeaders(),
  };
}

function githubRequestError(action: string, response: Response): Error {
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');
  let guidance = '';

  if (response.status === 401) {
    guidance = '; check that GITHUB_TOKEN is valid';
  } else if (response.status === 403 && remaining === '0') {
    const resetAt =
      reset && Number.isFinite(Number(reset))
        ? new Date(Number(reset) * 1000).toISOString()
        : 'the time reported by GitHub';
    guidance = `; GitHub API rate limit exhausted until ${resetAt}, set GITHUB_TOKEN`;
  }

  return new Error(`${action}: GitHub returned ${response.status}${guidance}`);
}

async function resolveHeadCommit(): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${SKILLS_REPO}/commits/main`, {
    headers: githubApiHeaders(),
  });

  if (!response.ok) {
    throw githubRequestError(`Could not resolve ${SKILLS_REPO}@main`, response);
  }

  const payload = (await response.json()) as { sha?: unknown };
  if (typeof payload.sha !== 'string' || !COMMIT_PATTERN.test(payload.sha)) {
    throw new Error(`Could not resolve ${SKILLS_REPO}@main: GitHub returned an invalid SHA`);
  }

  return payload.sha;
}

async function fetchRepositoryArchive(commit: string): Promise<Buffer> {
  const url = `https://codeload.github.com/${SKILLS_REPO}/tar.gz/${commit}`;
  const response = await fetch(url, { headers: githubAuthorizationHeaders() });

  if (!response.ok) {
    throw githubRequestError(`Could not fetch ${SKILLS_REPO}@${commit}`, response);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main(): Promise<void> {
  const commit = await resolveHeadCommit();
  const repositoryBytes = await fetchRepositoryArchive(commit);
  const artifacts = await buildSkillArtifactsFromRepositoryArchive(repositoryBytes);
  const index = buildAgentSkillsIndex(artifacts);

  // Build and validate everything before replacing the generated directory.
  // Any later filesystem error remains fatal, so partial output cannot deploy.
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all(
    artifacts.map((artifact) =>
      fs.writeFile(path.join(OUTPUT_DIR, `${artifact.name}.tar.gz`), artifact.content),
    ),
  );
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(index, null, 2)}\n`);

  console.log(
    `✔️ Wrote ${index.skills.length} skill archives to ${OUTPUT_DIR} at ${commit.slice(0, 8)}`,
  );
}

if (import.meta.main) {
  await main();
}
