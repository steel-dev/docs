#!/usr/bin/env bun

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  CHANGELOG_APPLICATION_REPOSITORY,
  CHANGELOG_CONTEXT_FILES,
  CHANGELOG_PLACEHOLDER_IMAGE,
  CHANGELOG_PROMPT_FILE,
  CHANGELOG_REPOSITORIES,
  CHANGELOG_SUBMODULE_SOURCES,
  CHANGELOG_TIMEZONE,
  type ChangelogRepository,
  COMMIT_BODY_CHAR_LIMIT,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENAI_REASONING_EFFORT,
  PROMPT_CHANGELOG_CHAR_LIMIT,
  PROMPT_CONTEXT_CHAR_LIMIT,
  RECENT_CHANGELOG_EXAMPLE_COUNT,
  SKIP_AUTHORS,
} from './changelog/config';
import { type CoverResult, generateChangelogCover } from './changelog/cover';
import {
  type ChangedFile,
  type ChangeGroup,
  type CommitCandidate,
  type ExcludedChangeGroup,
  type ExclusionSummary,
  filterEligibleChangeGroups,
  formatChangeGroupForPrompt,
  groupCommitsByPullRequest,
  isTimestampInWindow,
  parseCommitType,
  resolvePreviewWindow,
  resolveSubmoduleRange,
  resolveWindow,
  selectAssociatedPullRequest,
  summarizeExcludedChangeGroups,
  type WindowSelection,
} from './changelog/source';

interface GitHubCommitAuthor {
  login?: string;
}

interface GitHubListCommit {
  sha: string;
  html_url: string;
  author?: GitHubCommitAuthor | null;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
    committer?: {
      date: string;
    };
  };
}

interface GitHubCommitDetails extends GitHubListCommit {
  parents: Array<{ sha: string }>;
  files?: ChangedFile[];
}

interface GitHubPullRequest {
  number: number;
  html_url: string;
  title: string;
  body: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
}

interface GitHubCompareResponse {
  status: 'ahead' | 'behind' | 'diverged' | 'identical';
  total_commits: number;
  commits: GitHubListCommit[];
}

interface GitHubBranch {
  commit: {
    sha: string;
  };
}

interface GitHubRepositoryContent {
  sha: string;
}

interface DraftReference {
  label: string;
  url: string;
}

interface DraftEntry {
  kind: 'bullet' | 'feature';
  title: string | null;
  text: string;
  references: DraftReference[];
}

interface DraftSection {
  heading: '⭐ New' | '🐛 Bug Fixes' | '🔧 Improvements';
  entries: DraftEntry[];
}

interface DiscardedItem {
  text: string;
  reason: string;
  references: DraftReference[];
}

interface DraftResult {
  introduction: string;
  sections: DraftSection[];
  discardedItems: DiscardedItem[];
  coverMotif: string;
}

interface OpenAiResponse {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

export interface CliOptions {
  preview: boolean;
  number?: number;
  since?: string;
  until?: string;
  applicationReleaseBaseSha?: string;
  applicationReleaseHeadSha?: string;
}

interface ChangelogState {
  changelogNumber: number;
  until: string;
  applicationReleaseSha: string;
}

const CHANGELOG_DIR = path.join(process.cwd(), 'content/docs/changelog');
const CHANGELOG_META_PATH = path.join(CHANGELOG_DIR, 'meta.json');
const CHANGELOG_LLMS_PATH = path.join(process.cwd(), 'public/changelog/llms.txt');
const CHANGELOG_STATE_PATH = path.join(process.cwd(), 'scripts/changelog/state.json');
const DRAFT_SECTION_ORDER: DraftSection['heading'][] = [
  '⭐ New',
  '🔧 Improvements',
  '🐛 Bug Fixes',
];

function requireOptionValue(argv: string[], index: number, option: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${option}.`);
  }

  return value;
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { preview: false };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--preview') {
      options.preview = true;
      continue;
    }

    if (value === '--number') {
      const number = Number(requireOptionValue(argv, index, value));
      if (!Number.isInteger(number) || number < 0) {
        throw new Error(`Invalid changelog number: ${argv[index + 1]}`);
      }

      options.number = number;
      index += 1;
      continue;
    }

    if (value === '--since') {
      options.since = requireOptionValue(argv, index, value);
      index += 1;
      continue;
    }

    if (value === '--until') {
      options.until = requireOptionValue(argv, index, value);
      index += 1;
      continue;
    }

    if (value === '--application-release-base-sha' || value === '--application-release-head-sha') {
      const sha = requireOptionValue(argv, index, value);
      if (!/^[0-9a-f]{40}$/i.test(sha)) {
        throw new Error(`Invalid SHA for ${value}: ${sha}`);
      }

      if (value === '--application-release-base-sha') {
        options.applicationReleaseBaseSha = sha;
      } else {
        options.applicationReleaseHeadSha = sha;
      }
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  if (options.preview) {
    if (
      options.number === undefined ||
      !options.since ||
      !options.until ||
      !options.applicationReleaseBaseSha ||
      !options.applicationReleaseHeadSha
    ) {
      throw new Error(
        'Preview mode requires --number, --since, --until, --application-release-base-sha, and --application-release-head-sha.',
      );
    }
  } else if (
    options.number !== undefined ||
    options.applicationReleaseBaseSha ||
    options.applicationReleaseHeadSha
  ) {
    throw new Error(
      '--number, --application-release-base-sha, and --application-release-head-sha can only be used with --preview.',
    );
  }

  return options;
}

function formatChangelogNumber(number: number): string {
  return String(number).padStart(3, '0');
}

function buildChangelogLlmsContent(changelogNumbers: number[]): string {
  const lines = ['# Documentation', '', '## Pages', ''];

  for (const number of changelogNumbers) {
    const slug = `changelog-${formatChangelogNumber(number)}`;
    lines.push(`- [${slug}](https://docs.steel.dev/changelog/${slug})`);
  }

  return `${lines.join('\n')}\n`;
}

async function getExistingChangelogNumbers(): Promise<number[]> {
  const entries = await fs.readdir(CHANGELOG_DIR);

  return entries
    .map((entry) => entry.match(/^changelog-(\d+)\.mdx$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number.parseInt(value, 10))
    .sort((left, right) => left - right);
}

async function readChangelogState(): Promise<ChangelogState> {
  const state = JSON.parse(
    await fs.readFile(CHANGELOG_STATE_PATH, 'utf8'),
  ) as Partial<ChangelogState>;

  if (
    !Number.isInteger(state.changelogNumber) ||
    typeof state.until !== 'string' ||
    !state.until ||
    typeof state.applicationReleaseSha !== 'string' ||
    !/^[0-9a-f]{40}$/i.test(state.applicationReleaseSha)
  ) {
    throw new Error(`Invalid changelog state in ${CHANGELOG_STATE_PATH}`);
  }

  return state as ChangelogState;
}

async function selectWindow(options: CliOptions, state: ChangelogState): Promise<WindowSelection> {
  const untilInput = options.until || process.env.CHANGELOG_UNTIL || new Date().toISOString();
  const explicitSince = options.since || process.env.CHANGELOG_SINCE;

  return resolveWindow({
    explicitSince,
    until: untilInput,
    stateUntil: state.until,
  });
}

function getGithubToken(): string {
  const token = process.env.CHANGELOG_GITHUB_TOKEN || process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error(
      'Missing GitHub token. Set CHANGELOG_GITHUB_TOKEN or GITHUB_TOKEN before running.',
    );
  }

  return token;
}

function getOpenAiToken(): string {
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }

  return token;
}

type OpenAiReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

function getOpenAiReasoningEffort(): OpenAiReasoningEffort {
  const value = process.env.CHANGELOG_OPENAI_REASONING_EFFORT || DEFAULT_OPENAI_REASONING_EFFORT;
  const allowed: OpenAiReasoningEffort[] = ['none', 'low', 'medium', 'high', 'xhigh', 'max'];

  if (!allowed.includes(value as OpenAiReasoningEffort)) {
    throw new Error(`Invalid CHANGELOG_OPENAI_REASONING_EFFORT value: ${value}`);
  }

  return value as OpenAiReasoningEffort;
}

async function fetchGithubJson<T>(url: URL, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'steel-docs-changelog-generator',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}) for ${url.toString()}`);
  }

  return (await response.json()) as T;
}

function shouldSkipCommitAuthor(commit: GitHubListCommit): boolean {
  const author = commit.author?.login || commit.commit.author.name || '';
  const normalizedAuthor = author.toLowerCase();

  return SKIP_AUTHORS.some((skipAuthor) => normalizedAuthor.includes(skipAuthor.toLowerCase()));
}

function truncateText(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).trimEnd()}\n...[truncated]`;
}

function normalizeCommit(
  repoConfig: ChangelogRepository,
  commit: GitHubListCommit,
): CommitCandidate {
  const lines = commit.commit.message.split('\n');
  const subject = lines[0]?.trim() || commit.sha;
  const body = truncateText(lines.slice(1).join('\n').trim(), COMMIT_BODY_CHAR_LIMIT);
  const author = commit.author?.login || commit.commit.author.name || 'unknown';

  return {
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    branch: repoConfig.branch,
    sourceKind: repoConfig.kind,
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    url: commit.html_url,
    author,
    committedAt: commit.commit.committer?.date || commit.commit.author.date,
    subject,
    body,
    commitType: parseCommitType(subject),
    parents: [],
    changedFiles: [],
    pullRequest: null,
    releasedVia: null,
  };
}

async function fetchRepositoryCommits(
  repoConfig: ChangelogRepository,
  token: string,
  since: string,
  until: string,
): Promise<CommitCandidate[]> {
  const commits: CommitCandidate[] = [];

  for (let page = 1; page <= 10; page += 1) {
    const url = new URL(
      `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/commits`,
    );
    url.searchParams.set('sha', repoConfig.branch);
    url.searchParams.set('since', since);
    url.searchParams.set('until', until);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));

    const response = await fetchGithubJson<GitHubListCommit[]>(url, token);

    for (const commit of response) {
      if (shouldSkipCommitAuthor(commit)) {
        continue;
      }

      const normalized = normalizeCommit(repoConfig, commit);
      if (!isTimestampInWindow(normalized.committedAt, { since, until, source: 'manual' })) {
        continue;
      }

      commits.push(normalized);
    }

    if (response.length < 100) {
      break;
    }
  }

  return commits;
}

async function fetchCommitDetails(
  repoConfig: ChangelogRepository,
  sha: string,
  token: string,
): Promise<{ parents: string[]; files: ChangedFile[] }> {
  const files: ChangedFile[] = [];
  let parents: string[] = [];

  for (let page = 1; page <= 30; page += 1) {
    const url = new URL(
      `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/commits/${sha}`,
    );
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));

    const response = await fetchGithubJson<GitHubCommitDetails>(url, token);
    if (page === 1) {
      parents = response.parents.map((parent) => parent.sha);
    }

    const pageFiles = response.files || [];
    files.push(...pageFiles);

    if (pageFiles.length < 100) {
      return { parents, files };
    }
  }

  throw new Error(`Commit ${repoConfig.owner}/${repoConfig.repo}@${sha} exceeds 3,000 files.`);
}

async function fetchAssociatedPullRequest(
  repoConfig: ChangelogRepository,
  sha: string,
  token: string,
) {
  const url = new URL(
    `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/commits/${sha}/pulls`,
  );
  url.searchParams.set('per_page', '100');

  const pullRequests = await fetchGithubJson<GitHubPullRequest[]>(url, token);
  return selectAssociatedPullRequest(pullRequests, sha);
}

async function enrichCommitCandidate(
  repoConfig: ChangelogRepository,
  commit: CommitCandidate,
  token: string,
): Promise<CommitCandidate> {
  try {
    const [details, pullRequest] = await Promise.all([
      fetchCommitDetails(repoConfig, commit.sha, token),
      fetchAssociatedPullRequest(repoConfig, commit.sha, token).catch(() => {
        console.warn(
          `PR metadata unavailable for ${repoConfig.owner}/${repoConfig.repo}; using commit evidence.`,
        );
        return null;
      }),
    ]);

    return {
      ...commit,
      parents: details.parents,
      changedFiles: details.files,
      pullRequest,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to enrich ${repoConfig.owner}/${repoConfig.repo}@${commit.shortSha}: ${message}`,
    );
  }
}

async function enrichCommitCandidates(
  repoConfig: ChangelogRepository,
  commits: CommitCandidate[],
  token: string,
): Promise<CommitCandidate[]> {
  const enriched: CommitCandidate[] = [];

  for (let index = 0; index < commits.length; index += 6) {
    const batch = commits.slice(index, index + 6);
    enriched.push(
      ...(await Promise.all(
        batch.map((commit) => enrichCommitCandidate(repoConfig, commit, token)),
      )),
    );
  }

  return enriched;
}

async function fetchBranchHead(repoConfig: ChangelogRepository, token: string): Promise<string> {
  const branch = encodeURIComponent(repoConfig.branch);
  const url = new URL(
    `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/branches/${branch}`,
  );
  const response = await fetchGithubJson<GitHubBranch>(url, token);

  return response.commit.sha;
}

async function fetchBranchHeadAtOrBefore(
  repoConfig: ChangelogRepository,
  token: string,
  until: string,
): Promise<string> {
  const url = new URL(
    `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/commits`,
  );
  url.searchParams.set('sha', repoConfig.branch);
  url.searchParams.set('until', until);
  url.searchParams.set('per_page', '1');

  const commits = await fetchGithubJson<GitHubListCommit[]>(url, token);
  const commit = commits[0];
  if (!commit) {
    throw new Error(
      `No ${repoConfig.owner}/${repoConfig.repo}@${repoConfig.branch} commit found at or before ${until}.`,
    );
  }

  return commit.sha;
}

export async function fetchApplicationReleaseHead(
  explicitUntil: string | undefined,
  token: string,
): Promise<string> {
  if (explicitUntil) {
    return fetchBranchHeadAtOrBefore(CHANGELOG_APPLICATION_REPOSITORY, token, explicitUntil);
  }

  return fetchBranchHead(CHANGELOG_APPLICATION_REPOSITORY, token);
}

async function fetchSubmoduleShaAtRef(
  repoConfig: ChangelogRepository,
  submodulePath: string,
  ref: string,
  token: string,
): Promise<string> {
  const encodedPath = submodulePath.split('/').map(encodeURIComponent).join('/');
  const url = new URL(
    `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${encodedPath}`,
  );
  url.searchParams.set('ref', ref);
  const response = await fetchGithubJson<GitHubRepositoryContent>(url, token);

  return response.sha;
}

class NonAheadCompareError extends Error {
  readonly status: GitHubCompareResponse['status'];

  constructor(
    repoConfig: ChangelogRepository,
    baseSha: string,
    headSha: string,
    status: GitHubCompareResponse['status'],
  ) {
    super(
      `Expected an ahead range for ${repoConfig.owner}/${repoConfig.repo}, received ${status} for ${baseSha}...${headSha}.`,
    );
    this.status = status;
  }
}

async function fetchComparedCommits(
  repoConfig: ChangelogRepository,
  baseSha: string,
  headSha: string,
  token: string,
): Promise<GitHubListCommit[]> {
  const commits: GitHubListCommit[] = [];
  let totalCommits: number | null = null;

  for (let page = 1; ; page += 1) {
    const url = new URL(
      `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/compare/${baseSha}...${headSha}`,
    );
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));

    const response = await fetchGithubJson<GitHubCompareResponse>(url, token);
    if (response.status === 'identical') {
      return [];
    }

    if (response.status !== 'ahead') {
      throw new NonAheadCompareError(repoConfig, baseSha, headSha, response.status);
    }

    totalCommits ??= response.total_commits;
    commits.push(...response.commits);

    if (commits.length >= totalCommits) {
      return commits;
    }

    if (response.commits.length === 0) {
      break;
    }
  }

  throw new Error(
    `${repoConfig.owner}/${repoConfig.repo} comparison ${baseSha}...${headSha} returned ${commits.length} of ${totalCommits ?? 0} commits.`,
  );
}

export async function fetchApplicationReleaseCommits(
  baseSha: string,
  headSha: string,
  token: string,
): Promise<CommitCandidate[]> {
  const commits = await fetchComparedCommits(
    CHANGELOG_APPLICATION_REPOSITORY,
    baseSha,
    headSha,
    token,
  );

  return commits
    .filter((commit) => !shouldSkipCommitAuthor(commit))
    .map((commit) => normalizeCommit(CHANGELOG_APPLICATION_REPOSITORY, commit));
}

export async function expandReleasedBrowserCommits(
  integrationCommits: CommitCandidate[],
  token: string,
): Promise<CommitCandidate[]> {
  const derivedCommits = new Map<string, { repo: ChangelogRepository; commit: CommitCandidate }>();

  for (const source of CHANGELOG_SUBMODULE_SOURCES) {
    const hostCommits = integrationCommits.filter(
      (commit) =>
        commit.owner === source.integrationRepository.owner &&
        commit.repo === source.integrationRepository.repo,
    );
    hostCommits.sort((left, right) => left.committedAt.localeCompare(right.committedAt));

    for (const hostCommit of hostCommits) {
      const submoduleFile = hostCommit.changedFiles.find((file) => file.filename === source.path);
      if (!submoduleFile) {
        continue;
      }

      const range = await resolveSubmoduleRange(submoduleFile.patch, async () => {
        const parentSha = hostCommit.parents[0];
        if (!parentSha) {
          throw new Error(
            `Could not find a parent for ${hostCommit.owner}/${hostCommit.repo}@${hostCommit.shortSha}.`,
          );
        }

        const [baseSha, headSha] = await Promise.all([
          fetchSubmoduleShaAtRef(source.integrationRepository, source.path, parentSha, token),
          fetchSubmoduleShaAtRef(source.integrationRepository, source.path, hostCommit.sha, token),
        ]);

        return { baseSha, headSha };
      });

      let comparedCommits: GitHubListCommit[];
      try {
        comparedCommits = await fetchComparedCommits(
          source.repository,
          range.baseSha,
          range.headSha,
          token,
        );
      } catch (error) {
        // A pure rollback contains no newly released browser commits. Diverged ranges may contain
        // head-only commits, so they must fail instead of silently dropping release evidence.
        if (error instanceof NonAheadCompareError && error.status === 'behind') {
          console.warn(
            `Skipping submodule expansion for ${hostCommit.owner}/${hostCommit.repo}@${hostCommit.shortSha}: ${error.message}`,
          );
          continue;
        }

        throw error;
      }

      for (const comparedCommit of comparedCommits) {
        if (shouldSkipCommitAuthor(comparedCommit)) {
          continue;
        }

        const normalized = normalizeCommit(source.repository, comparedCommit);
        normalized.releasedVia = {
          owner: hostCommit.owner,
          repo: hostCommit.repo,
          sha: hostCommit.sha,
          url: hostCommit.url,
          path: source.path,
        };
        if (!derivedCommits.has(normalized.sha)) {
          derivedCommits.set(normalized.sha, {
            repo: source.repository,
            commit: normalized,
          });
        }
      }
    }
  }

  const byRepository = new Map<ChangelogRepository, CommitCandidate[]>();
  for (const { repo, commit } of derivedCommits.values()) {
    const commits = byRepository.get(repo) || [];
    commits.push(commit);
    byRepository.set(repo, commits);
  }

  const enriched: CommitCandidate[] = [];
  for (const [repo, commits] of byRepository) {
    enriched.push(...(await enrichCommitCandidates(repo, commits, token)));
  }

  return enriched;
}

function cleanMdxForPrompt(content: string): string {
  let cleaned = content;

  if (cleaned.startsWith('---')) {
    const frontmatterMatch = cleaned.match(/^---\n[\s\S]*?\n---\n?/);
    if (frontmatterMatch) {
      cleaned = cleaned.slice(frontmatterMatch[0].length);
    }
  }

  cleaned = cleaned.replace(/^import .+;\n?/gm, '');
  cleaned = cleaned.replace(/<Image[\s\S]*?\/>\n?/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

async function loadFileForPrompt(filePath: string, charLimit: number): Promise<string> {
  const absolutePath = path.join(process.cwd(), filePath);
  const raw = await fs.readFile(absolutePath, 'utf8');
  return truncateText(cleanMdxForPrompt(raw), charLimit);
}

export function selectRecentChangelogNumbers(
  changelogNumbers: number[],
  beforeNumber: number,
): number[] {
  return changelogNumbers
    .filter((number) => number < beforeNumber)
    .slice(-RECENT_CHANGELOG_EXAMPLE_COUNT)
    .reverse();
}

async function loadPromptContext(beforeNumber: number): Promise<string> {
  const sections: string[] = [];

  for (const contextFile of CHANGELOG_CONTEXT_FILES) {
    const content = await loadFileForPrompt(contextFile.path, PROMPT_CONTEXT_CHAR_LIMIT);
    sections.push(`## ${contextFile.label}\nPath: ${contextFile.path}\n\n${content}`);
  }

  const changelogNumbers = await getExistingChangelogNumbers();
  const recentNumbers = selectRecentChangelogNumbers(changelogNumbers, beforeNumber);

  for (const number of recentNumbers) {
    const slug = `changelog-${formatChangelogNumber(number)}`;
    const filePath = path.posix.join('content/docs/changelog', `${slug}.mdx`);
    const content = await loadFileForPrompt(filePath, PROMPT_CHANGELOG_CHAR_LIMIT);
    sections.push(`## Recent changelog example: ${slug}\nPath: ${filePath}\n\n${content}`);
  }

  return sections.join('\n\n');
}

function formatRepoListForPrBody(): string {
  return CHANGELOG_REPOSITORIES.filter((repo) => repo.mode !== 'excluded')
    .map((repo) => {
      const mode = repo.mode === 'derived' ? 'derived from the application release' : 'direct';
      return `- \`${repo.owner}/${repo.repo}@${repo.branch}\` (${mode})`;
    })
    .join('\n');
}

function getUniqueReferences(references: DraftReference[]): DraftReference[] {
  const seen = new Set<string>();
  const unique: DraftReference[] = [];

  for (const reference of references) {
    const key = `${reference.label}|${reference.url}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(reference);
  }

  return unique;
}

function renderReferenceLinks(references: DraftReference[]): string {
  const uniqueReferences = getUniqueReferences(references);
  if (uniqueReferences.length === 0) {
    return '';
  }

  return uniqueReferences.map((reference) => `[${reference.label}](${reference.url})`).join(' ');
}

function getOrderedDraftSections(draft: DraftResult): DraftSection[] {
  return [...draft.sections].sort((left, right) => {
    const leftIndex = DRAFT_SECTION_ORDER.indexOf(left.heading);
    const rightIndex = DRAFT_SECTION_ORDER.indexOf(right.heading);

    return leftIndex - rightIndex;
  });
}

function renderDraftBody(draft: DraftResult): string {
  const blocks: string[] = [draft.introduction.trim()];
  const orderedSections = getOrderedDraftSections(draft);

  for (const section of orderedSections) {
    if (section.entries.length === 0) {
      continue;
    }

    blocks.push(`### ${section.heading}`);

    for (const entry of section.entries) {
      const text = entry.text.trim();

      if (entry.kind === 'feature' && entry.title?.trim()) {
        blocks.push(`#### ${entry.title.trim()}`);
        blocks.push(text);
      } else {
        blocks.push(`*   ${text}`);
      }
    }
  }

  return blocks.join('\n\n').trim();
}

export function buildMdxDocument(
  number: number,
  draft: DraftResult,
  publishedAt: string,
  coverSrc?: string,
): string {
  const numberLabel = formatChangelogNumber(number);
  const imageAlt = `Announcing Changelog #${numberLabel}`;
  const imageSrc = coverSrc || CHANGELOG_PLACEHOLDER_IMAGE.src;
  const frontmatter = [
    '---',
    `title: "Changelog #${numberLabel}"`,
    `sidebarTitle: "Changelog #${numberLabel}"`,
    'llm: true',
    `image: "${imageSrc}"`,
    `imageAlt: "${imageAlt}"`,
    `publishedAt: "${publishedAt}"`,
    '---',
    "import Image from 'next/image';",
    '',
    '<Image',
    `  src="${imageSrc}"`,
    `  alt="${imageAlt}"`,
    `  width={${CHANGELOG_PLACEHOLDER_IMAGE.width}}`,
    `  height={${CHANGELOG_PLACEHOLDER_IMAGE.height}}`,
    '/>',
    '',
  ].join('\n');

  return `${frontmatter}${renderDraftBody(draft)}\n`;
}

function renderEntryReviewLine(entry: DraftEntry): string {
  const prefix =
    entry.kind === 'feature' && entry.title?.trim()
      ? `**${entry.title.trim()}**: ${entry.text.trim()}`
      : entry.text.trim();
  const refs = renderReferenceLinks(entry.references);

  return `- ${prefix}${refs ? ` ${refs}` : ''}`;
}

function buildPrBody(
  number: number,
  draftPath: string,
  windowSelection: WindowSelection,
  draft: DraftResult,
  sourceExclusions: ExclusionSummary[],
  cover: CoverResult | null = null,
): string {
  const sections = [
    `# docs: draft changelog #${formatChangelogNumber(number)}`,
    '',
    `Generated \`${draftPath}\`.`,
    '',
    `- Window: \`${windowSelection.since}\` to \`${windowSelection.until}\``,
    `- Window source: \`${windowSelection.source}\``,
    `- Timezone reference: \`${CHANGELOG_TIMEZONE}\``,
    '- The MDX draft is intentionally clean. Commit references for kept items are listed below for review.',
    cover
      ? `- Cover image: \`${cover.src}\` (the undithered original is in the run artifacts for palette retries)`
      : `- Placeholder image: \`${CHANGELOG_PLACEHOLDER_IMAGE.src}\` (no cover was generated; see the run log)`,
    ...(draft.coverMotif ? [`- Cover motif: ${draft.coverMotif}`] : []),
    '',
    '## Monitored repositories',
    '',
    formatRepoListForPrBody(),
  ];
  const orderedSections = getOrderedDraftSections(draft);

  if (orderedSections.length > 0) {
    sections.push('', '## Included items', '');
    for (const section of orderedSections) {
      if (section.entries.length === 0) {
        continue;
      }

      sections.push(`### ${section.heading}`, '');
      for (const entry of section.entries) {
        sections.push(renderEntryReviewLine(entry));
      }
      sections.push('');
    }
  }

  if (sourceExclusions.length > 0 || draft.discardedItems.length > 0) {
    sections.push(
      '## Source filtering',
      '',
      'Only aggregate counts are shown here so excluded internal source details are not copied into this public PR.',
      '',
    );
    for (const item of sourceExclusions) {
      sections.push(`- \`${item.reason}\`: ${item.count}`);
    }

    if (draft.discardedItems.length > 0) {
      sections.push(`- \`model_discarded\`: ${draft.discardedItems.length}`);
    }
  }

  return sections.join('\n').trimEnd() + '\n';
}

function extractJsonObject(content: string): string {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error('Model output did not contain a JSON object.');
  }

  return withoutFence.slice(firstBrace, lastBrace + 1);
}

export function extractOpenAiResponseText(response: OpenAiResponse): string | undefined {
  for (const output of response.output || []) {
    if (output.type !== 'message') {
      continue;
    }

    for (const content of output.content || []) {
      if (content.type === 'output_text' && content.text) {
        return content.text;
      }
    }
  }

  return undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function sanitizeReferences(value: unknown): DraftReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((reference) => {
      if (
        !reference ||
        typeof reference !== 'object' ||
        !isNonEmptyString((reference as DraftReference).label) ||
        !isNonEmptyString((reference as DraftReference).url)
      ) {
        return null;
      }

      return {
        label: (reference as DraftReference).label.trim(),
        url: (reference as DraftReference).url.trim(),
      };
    })
    .filter((reference): reference is DraftReference => Boolean(reference));
}

export function parseDraftResult(rawContent: string): DraftResult {
  const json = JSON.parse(extractJsonObject(rawContent)) as Record<string, unknown>;
  const introduction = isNonEmptyString(json.introduction) ? json.introduction.trim() : '';

  const sections = Array.isArray(json.sections)
    ? json.sections
        .map((section) => {
          if (!section || typeof section !== 'object') {
            return null;
          }

          const heading = (section as DraftSection).heading;
          const entries = Array.isArray((section as DraftSection).entries)
            ? (section as DraftSection).entries
                .map((entry) => {
                  if (!entry || typeof entry !== 'object') {
                    return null;
                  }

                  const kind = (entry as DraftEntry).kind;
                  const text = (entry as DraftEntry).text;
                  const title = (entry as DraftEntry).title;
                  const references = sanitizeReferences((entry as DraftEntry).references);

                  if (
                    (kind !== 'bullet' && kind !== 'feature') ||
                    !isNonEmptyString(text) ||
                    references.length === 0
                  ) {
                    return null;
                  }

                  return {
                    kind,
                    title: isNonEmptyString(title) ? title.trim() : null,
                    text: text.trim(),
                    references,
                  } satisfies DraftEntry;
                })
                .filter((entry): entry is DraftEntry => Boolean(entry))
            : [];

          if (heading !== '⭐ New' && heading !== '🐛 Bug Fixes' && heading !== '🔧 Improvements') {
            return null;
          }

          if (entries.length === 0) {
            return null;
          }

          return {
            heading,
            entries,
          } satisfies DraftSection;
        })
        .filter((section): section is DraftSection => Boolean(section))
    : [];

  if (sections.length > 0 && !introduction) {
    throw new Error('Model output was missing a valid introduction.');
  }

  const discardedItems = Array.isArray(json.discardedItems)
    ? json.discardedItems
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const text = (item as DiscardedItem).text;
          const reason = (item as DiscardedItem).reason;

          if (!isNonEmptyString(text) || !isNonEmptyString(reason)) {
            return null;
          }

          return {
            text: text.trim(),
            reason: reason.trim(),
            references: sanitizeReferences((item as DiscardedItem).references),
          } satisfies DiscardedItem;
        })
        .filter((item): item is DiscardedItem => Boolean(item))
    : [];

  return {
    introduction,
    sections,
    discardedItems,
    coverMotif: isNonEmptyString(json.coverMotif) ? json.coverMotif.trim() : '',
  };
}

function validateDraftReferences(draft: DraftResult, groups: ChangeGroup[]) {
  const allowedUrls = new Set<string>();
  for (const group of groups) {
    if (group.pullRequest) {
      allowedUrls.add(group.pullRequest.url);
    }

    for (const commit of group.commits) {
      allowedUrls.add(commit.url);
      if (commit.releasedVia) {
        allowedUrls.add(commit.releasedVia.url);
      }
    }
  }

  const references = [
    ...draft.sections.flatMap((section) => section.entries.flatMap((entry) => entry.references)),
    ...draft.discardedItems.flatMap((item) => item.references),
  ];

  for (const reference of references) {
    if (!allowedUrls.has(reference.url)) {
      throw new Error(`Model output referenced an unknown source URL: ${reference.url}`);
    }
  }
}

async function requestDraftFromModel(
  groups: ChangeGroup[],
  number: number,
  windowSelection: WindowSelection,
  openAiToken: string,
): Promise<DraftResult> {
  const systemPrompt = await fs.readFile(path.join(process.cwd(), CHANGELOG_PROMPT_FILE), 'utf8');
  const docsContext = await loadPromptContext(number);
  const sourcePayload = `[\n${groups.map(formatChangeGroupForPrompt).join(',\n')}\n]`;
  const model = process.env.CHANGELOG_OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const reasoningEffort = getOpenAiReasoningEffort();

  const userPrompt = [
    `Generate changelog #${formatChangelogNumber(number)}.`,
    `Source window: ${windowSelection.since} to ${windowSelection.until}.`,
    '',
    'Return JSON only with this shape:',
    '{',
    '  "introduction": "string",',
    '  "sections": [',
    '    {',
    '      "heading": "⭐ New | 🐛 Bug Fixes | 🔧 Improvements",',
    '      "entries": [',
    '        {',
    '          "kind": "feature | bullet",',
    '          "title": "string | null",',
    '          "text": "string",',
    '          "references": [{ "label": "repo sha", "url": "https://..." }]',
    '        }',
    '      ]',
    '    }',
    '  ],',
    '  "discardedItems": [',
    '    {',
    '      "text": "string",',
    '      "reason": "string",',
    '      "references": [{ "label": "repo sha", "url": "https://..." }]',
    '    }',
    '  ],',
    '  "coverMotif": "string"',
    '}',
    '',
    'If none of the facts support a public changelog entry, return an empty introduction and empty sections.',
    '',
    '## Product and style context',
    docsContext,
    '',
    '## Eligible source facts grouped by logical pull request',
    sourcePayload,
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiToken}`,
    },
    body: JSON.stringify({
      model,
      instructions: systemPrompt,
      input: userPrompt,
      reasoning: { effort: reasoningEffort },
      text: { format: { type: 'json_object' } },
      store: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as OpenAiResponse;
  const content = extractOpenAiResponseText(payload);

  if (!content) {
    throw new Error('OpenAI response did not include output text.');
  }

  const draft = parseDraftResult(content);
  validateDraftReferences(draft, groups);
  return draft;
}

async function updateChangelogMeta(slug: string) {
  const current = JSON.parse(await fs.readFile(CHANGELOG_META_PATH, 'utf8')) as {
    title: string;
    root: boolean;
    pages: string[];
  };

  const pages = current.pages.filter((page) => page !== slug);
  const separatorIndex = pages.indexOf('---Changelog---');

  if (separatorIndex >= 0) {
    pages.splice(separatorIndex + 1, 0, slug);
  } else {
    pages.unshift(slug);
  }

  current.pages = pages;
  await fs.writeFile(CHANGELOG_META_PATH, `${JSON.stringify(current, null, 2)}\n`);
}

async function updateChangelogLlms() {
  const changelogNumbers = await getExistingChangelogNumbers();
  const content = buildChangelogLlmsContent(changelogNumbers);
  await fs.mkdir(path.dirname(CHANGELOG_LLMS_PATH), { recursive: true });
  await fs.writeFile(CHANGELOG_LLMS_PATH, content);
}

async function updateChangelogState(
  changelogNumber: number,
  until: string,
  applicationReleaseSha: string,
) {
  const state: ChangelogState = {
    changelogNumber,
    until,
    applicationReleaseSha,
  };
  await fs.writeFile(CHANGELOG_STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

async function appendGithubOutput(key: string, value: string) {
  const outputFile = process.env.GITHUB_OUTPUT;

  if (!outputFile) {
    return;
  }

  const normalized = value.replace(/\n/g, '%0A');
  await fs.appendFile(outputFile, `${key}=${normalized}\n`);
}

function createBranchName(number: number, until: string): string {
  const dateLabel = until.slice(0, 10);
  return `automation/changelog-${formatChangelogNumber(number)}-${dateLabel}`;
}

interface PreviewWorkspace {
  directory: string;
  draftFilename: string;
}

export async function createPreviewWorkspace(input: {
  number: number;
  windowSelection: WindowSelection;
  applicationReleaseBaseSha: string;
  applicationReleaseHeadSha: string;
  eligibleGroups: ChangeGroup[];
  excludedGroups: ExcludedChangeGroup[];
}): Promise<PreviewWorkspace> {
  const numberLabel = formatChangelogNumber(input.number);
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), `steel-changelog-${numberLabel}-preview-`),
  );
  const draftFilename = `changelog-${numberLabel}-preview.mdx`;
  const sourceFacts = `[\n${input.eligibleGroups.map(formatChangeGroupForPrompt).join(',\n')}\n]\n`;
  // Excluded details stay out of the public PR body; this local file is the audit trail for them.
  const excludedGroups = input.excludedGroups.map((item) => ({
    reason: item.reason,
    key: item.group.key,
    pullRequest: item.group.pullRequest,
    commits: item.group.commits.map((commit) => ({
      sha: commit.sha,
      url: commit.url,
      subject: commit.subject,
    })),
  }));
  const manifest = {
    changelogNumber: input.number,
    window: input.windowSelection,
    applicationRelease: {
      baseSha: input.applicationReleaseBaseSha,
      headSha: input.applicationReleaseHeadSha,
    },
    model: process.env.CHANGELOG_OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    reasoningEffort: getOpenAiReasoningEffort(),
  };

  await Promise.all([
    fs.writeFile(path.join(directory, 'source-facts.json'), sourceFacts),
    fs.writeFile(
      path.join(directory, 'excluded-groups.json'),
      `${JSON.stringify(excludedGroups, null, 2)}\n`,
    ),
    fs.writeFile(path.join(directory, 'run.json'), `${JSON.stringify(manifest, null, 2)}\n`),
  ]);

  return { directory, draftFilename };
}

async function writePreviewDraftArtifacts(input: {
  workspace: PreviewWorkspace;
  number: number;
  windowSelection: WindowSelection;
  draft: DraftResult;
  mdx: string;
  exclusionSummary: ExclusionSummary[];
}) {
  const review = buildPrBody(
    input.number,
    input.workspace.draftFilename,
    input.windowSelection,
    input.draft,
    input.exclusionSummary,
  );

  await Promise.all([
    fs.writeFile(path.join(input.workspace.directory, input.workspace.draftFilename), input.mdx),
    fs.writeFile(path.join(input.workspace.directory, 'review.md'), review),
    fs.writeFile(
      path.join(input.workspace.directory, 'model-output.json'),
      `${JSON.stringify(input.draft, null, 2)}\n`,
    ),
  ]);
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const githubToken = getGithubToken();
  let nextNumber: number;
  let windowSelection: WindowSelection;
  let applicationReleaseBaseSha: string;
  let applicationReleaseSha: string;

  if (options.preview) {
    nextNumber = options.number as number;
    windowSelection = resolvePreviewWindow({
      since: options.since as string,
      until: options.until as string,
    });
    applicationReleaseBaseSha = options.applicationReleaseBaseSha as string;
    applicationReleaseSha = options.applicationReleaseHeadSha as string;
  } else {
    const state = await readChangelogState();
    windowSelection = await selectWindow(options, state);
    const changelogNumbers = await getExistingChangelogNumbers();
    const latestNumber = changelogNumbers.at(-1) ?? -1;
    nextNumber = latestNumber + 1;

    if (state.changelogNumber !== latestNumber) {
      throw new Error(
        `Changelog state points to #${formatChangelogNumber(state.changelogNumber)}, but the latest file is #${formatChangelogNumber(latestNumber)}.`,
      );
    }

    applicationReleaseBaseSha = state.applicationReleaseSha;
    const explicitUntil = options.until || process.env.CHANGELOG_UNTIL;
    applicationReleaseSha = await fetchApplicationReleaseHead(
      explicitUntil ? windowSelection.until : undefined,
      githubToken,
    );
  }

  const slug = `changelog-${formatChangelogNumber(nextNumber)}`;
  const draftPath = path.posix.join('content/docs/changelog', `${slug}.mdx`);

  const commits: CommitCandidate[] = [];
  const directRepositories = CHANGELOG_REPOSITORIES.filter((repo) => repo.mode === 'direct');

  for (const repoConfig of directRepositories) {
    try {
      const repoCommits =
        repoConfig.kind === 'application'
          ? await fetchApplicationReleaseCommits(
              applicationReleaseBaseSha,
              applicationReleaseSha,
              githubToken,
            )
          : await fetchRepositoryCommits(
              repoConfig,
              githubToken,
              windowSelection.since,
              windowSelection.until,
            );
      commits.push(...(await enrichCommitCandidates(repoConfig, repoCommits, githubToken)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to collect ${repoConfig.owner}/${repoConfig.repo}@${repoConfig.branch}: ${message}`,
      );
    }
  }

  const browserCommits = await expandReleasedBrowserCommits(commits, githubToken);
  commits.push(...browserCommits);
  commits.sort((left, right) => {
    if (left.repo === right.repo) {
      return left.committedAt.localeCompare(right.committedAt);
    }

    return left.repo.localeCompare(right.repo);
  });

  // The cursor advances only with a published changelog, so a later draft keeps the full
  // cumulative window after one or more quiet weeks.
  if (commits.length === 0) {
    console.log(
      `No source activity found between ${windowSelection.since} and ${windowSelection.until}.`,
    );
    if (!options.preview) {
      await appendGithubOutput('has_changes', 'false');
    }
    return;
  }

  const groups = groupCommitsByPullRequest(commits);
  const { eligible, excluded } = filterEligibleChangeGroups(groups);
  const exclusionSummary = summarizeExcludedChangeGroups(excluded);

  console.log(
    `Collected ${commits.length} commits as ${groups.length} logical changes; ${eligible.length} are eligible.`,
  );
  if (exclusionSummary.length > 0) {
    console.log(
      `Excluded changes: ${exclusionSummary
        .map(({ reason, count }) => `${reason}=${count}`)
        .join(', ')}`,
    );
  }

  const previewWorkspace = options.preview
    ? await createPreviewWorkspace({
        number: nextNumber,
        windowSelection,
        applicationReleaseBaseSha,
        applicationReleaseHeadSha: applicationReleaseSha,
        eligibleGroups: eligible,
        excludedGroups: excluded,
      })
    : null;
  if (previewWorkspace) {
    console.log(`Prepared isolated preview evidence at ${previewWorkspace.directory}`);
  }

  if (eligible.length === 0) {
    console.log(
      'The source window contains no public changelog facts. Treating it as a quiet week.',
    );
    if (!options.preview) {
      await appendGithubOutput('has_changes', 'false');
    }
    return;
  }

  const openAiToken = getOpenAiToken();
  const draft = await requestDraftFromModel(eligible, nextNumber, windowSelection, openAiToken);
  if (!draft.sections.some((section) => section.entries.length > 0)) {
    console.log('The model found no publishable changelog entries. Treating it as a quiet week.');
    if (!options.preview) {
      await appendGithubOutput('has_changes', 'false');
    }
    return;
  }

  const publishedAt = windowSelection.until.slice(0, 10);
  if (previewWorkspace) {
    // Preview stays free of image generation; the motif lands in model-output.json for review.
    await writePreviewDraftArtifacts({
      workspace: previewWorkspace,
      number: nextNumber,
      windowSelection,
      draft,
      mdx: buildMdxDocument(nextNumber, draft, publishedAt),
      exclusionSummary,
    });
    console.log(`Generated isolated preview at ${previewWorkspace.directory}`);
    return;
  }

  let cover: CoverResult | null = null;
  if (draft.coverMotif) {
    try {
      cover = await generateChangelogCover({
        number: nextNumber,
        motif: draft.coverMotif,
        publishedAt,
        log: (message) => console.log(message),
      });
      console.log(`Generated cover image at ${cover.publicPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Cover generation failed; keeping the placeholder image: ${message}`);
    }
  } else {
    console.warn('The model returned no cover motif; keeping the placeholder image.');
  }

  const mdx = buildMdxDocument(nextNumber, draft, publishedAt, cover?.src);
  await fs.writeFile(path.join(process.cwd(), draftPath), mdx);
  await updateChangelogMeta(slug);
  await updateChangelogLlms();
  await updateChangelogState(nextNumber, windowSelection.until, applicationReleaseSha);

  const prBody = buildPrBody(
    nextNumber,
    draftPath,
    windowSelection,
    draft,
    exclusionSummary,
    cover,
  );
  const prBodyPath =
    process.env.CHANGELOG_PR_BODY_PATH ||
    path.join(os.tmpdir(), `steel-changelog-pr-body-${slug}.md`);
  await fs.writeFile(prBodyPath, prBody);

  const prTitle = `docs: draft changelog #${formatChangelogNumber(nextNumber)}`;
  await appendGithubOutput('has_changes', 'true');
  await appendGithubOutput('branch_name', createBranchName(nextNumber, windowSelection.until));
  await appendGithubOutput('pr_title', prTitle);
  await appendGithubOutput('commit_message', prTitle);
  await appendGithubOutput('pr_body_path', prBodyPath);
  await appendGithubOutput('draft_path', draftPath);
  if (cover) {
    await appendGithubOutput('cover_workdir', cover.workdir);
  }

  console.log(`Generated ${draftPath}`);
  console.log(`Prepared PR body at ${prBodyPath}`);
}

if (import.meta.main) {
  await main();
}
