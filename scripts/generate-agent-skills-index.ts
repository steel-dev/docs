#!/usr/bin/env bun
// ABOUTME: Generates the Agent Skills discovery index at public/.well-known/agent-skills/index.json.
// ABOUTME: Reads the steel-dev/skills catalog, pins each SKILL.md to a commit and digests its bytes.
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/** Discovery schema this index conforms to: cloudflare/agent-skills-discovery-rfc. */
export const AGENT_SKILLS_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

const SKILLS_REPO = 'steel-dev/skills';
const OUTPUT_PATH = path.join(process.cwd(), 'public', '.well-known', 'agent-skills', 'index.json');

// Limits from the discovery schema, enforced here so a bad catalog entry fails
// the build rather than publishing an index clients will reject.
const NAME_PATTERN = /^[a-z0-9-]{1,64}$/;
const MAX_DESCRIPTION_LENGTH = 1024;

export type SkillArtifact = {
  name: string;
  path: string;
  description: string;
  content: Buffer;
};

export type AgentSkillsIndex = {
  $schema: string;
  skills: Array<{
    name: string;
    type: 'skill-md';
    description: string;
    url: string;
    digest: string;
  }>;
};

/** Builds the discovery index for skill artifacts read at a single commit. */
export function buildAgentSkillsIndex(
  commit: string,
  artifacts: SkillArtifact[],
): AgentSkillsIndex {
  if (artifacts.length === 0) {
    throw new Error('No skills found in the catalog; refusing to publish an empty index');
  }

  return {
    $schema: AGENT_SKILLS_SCHEMA,
    skills: artifacts.map((artifact) => {
      if (!NAME_PATTERN.test(artifact.name)) {
        throw new Error(`Skill name "${artifact.name}" is not a valid discovery name`);
      }

      if (artifact.description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(
          `Skill "${artifact.name}" has a description longer than ${MAX_DESCRIPTION_LENGTH} characters`,
        );
      }

      return {
        name: artifact.name,
        type: 'skill-md' as const,
        description: artifact.description,
        // Pinned to a commit so the URL and digest keep agreeing after an
        // upstream edit; the next build re-pins to whatever main holds then.
        url: `https://raw.githubusercontent.com/${SKILLS_REPO}/${commit}/${artifact.path}/SKILL.md`,
        digest: `sha256:${createHash('sha256').update(artifact.content).digest('hex')}`,
      };
    }),
  };
}

function githubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function resolveHeadCommit(): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${SKILLS_REPO}/commits/main`, {
    headers: { Accept: 'application/vnd.github+json', ...githubHeaders() },
  });

  if (!response.ok) {
    throw new Error(`Could not resolve ${SKILLS_REPO}@main: ${response.status}`);
  }

  return ((await response.json()) as { sha: string }).sha;
}

async function fetchRaw(commit: string, filePath: string): Promise<Buffer> {
  const url = `https://raw.githubusercontent.com/${SKILLS_REPO}/${commit}/${filePath}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not fetch ${url}: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

type Manifest = {
  skills: Record<string, { description: string; path: string }>;
};

async function readCatalog(commit: string): Promise<SkillArtifact[]> {
  const manifest = JSON.parse(
    (await fetchRaw(commit, 'manifest.json')).toString('utf8'),
  ) as Manifest;

  return Promise.all(
    Object.entries(manifest.skills).map(async ([name, skill]) => ({
      name,
      path: skill.path,
      description: skill.description,
      content: await fetchRaw(commit, `${skill.path}/SKILL.md`),
    })),
  );
}

async function main() {
  const commit = await resolveHeadCommit();
  const index = buildAgentSkillsIndex(commit, await readCatalog(commit));

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(index, null, 2)}\n`);

  console.log(`✔️ Wrote ${index.skills.length} skills to ${OUTPUT_PATH} at ${commit.slice(0, 8)}`);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    // A docs deploy should not hinge on GitHub being reachable. Skipping leaves
    // the index absent, which is honest, rather than stale or unverifiable.
    console.warn(`⚠️ Skipped the Agent Skills index: ${(error as Error).message}`);
  }
}
