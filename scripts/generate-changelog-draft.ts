#!/usr/bin/env bun

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  CHANGELOG_CONTEXT_FILES,
  CHANGELOG_PLACEHOLDER_IMAGE,
  CHANGELOG_PROMPT_FILE,
  CHANGELOG_REPOSITORIES,
  CHANGELOG_TIMEZONE,
  COMMIT_BODY_CHAR_LIMIT,
  DEFAULT_LOOKBACK_DAYS,
  DEFAULT_OPENAI_MODEL,
  PROMPT_CHANGELOG_CHAR_LIMIT,
  PROMPT_CONTEXT_CHAR_LIMIT,
  RECENT_CHANGELOG_EXAMPLE_COUNT,
  SKIP_AUTHORS,
  type ChangelogRepository,
} from './changelog/config';

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
  };
}

interface CommitCandidate {
  owner: string;
  repo: string;
  branch: string;
  sha: string;
  shortSha: string;
  url: string;
  author: string;
  committedAt: string;
  subject: string;
  body: string;
  commitType: string | null;
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
  heading: '⭐ New' | '🐛 Bug Fixes' | '🔧 Improvements' | '🏡 Housekeeping';
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
}

interface CliOptions {
  since?: string;
  until?: string;
}

interface WindowSelection {
  since: string;
  until: string;
  source: 'manual' | 'git' | 'fallback' | 'bootstrap';
}

const CHANGELOG_DIR = path.join(process.cwd(), 'content/docs/changelog');
const CHANGELOG_META_PATH = path.join(CHANGELOG_DIR, 'meta.json');

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--since') {
      options.since = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === '--until') {
      options.until = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

function formatChangelogNumber(number: number): string {
  return String(number).padStart(3, '0');
}

async function getExistingChangelogNumbers(): Promise<number[]> {
  const entries = await fs.readdir(CHANGELOG_DIR);

  return entries
    .map((entry) => entry.match(/^changelog-(\d+)\.mdx$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number.parseInt(value, 10))
    .sort((left, right) => left - right);
}

function getGitTimestampForAddedFile(relativeFilePath: string): string | null {
  try {
    const output = execFileSync(
      'git',
      ['log', '--diff-filter=A', '-1', '--format=%cI', '--', relativeFilePath],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      },
    ).trim();

    return output || null;
  } catch {
    return null;
  }
}

function subtractDays(isoTimestamp: string, days: number): string {
  const date = new Date(isoTimestamp);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function validateIsoDate(value: string, label: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label} value: ${value}`);
  }

  return parsed.toISOString();
}

function applyBootstrapSince(
  since: string,
  until: string,
  source: WindowSelection['source'],
): WindowSelection {
  const bootstrapSince = process.env.CHANGELOG_BOOTSTRAP_SINCE;

  if (!bootstrapSince) {
    return { since, until, source };
  }

  const normalizedBootstrap = validateIsoDate(bootstrapSince, 'bootstrap since');

  if (new Date(normalizedBootstrap) >= new Date(until)) {
    throw new Error(
      `Expected CHANGELOG_BOOTSTRAP_SINCE < until, received bootstrap=${normalizedBootstrap} until=${until}`,
    );
  }

  if (new Date(since) < new Date(normalizedBootstrap)) {
    return {
      since: normalizedBootstrap,
      until,
      source: 'bootstrap',
    };
  }

  return { since, until, source };
}

async function selectWindow(options: CliOptions): Promise<WindowSelection> {
  const untilInput = options.until || process.env.CHANGELOG_UNTIL || new Date().toISOString();
  const until = validateIsoDate(untilInput, 'until');

  const explicitSince = options.since || process.env.CHANGELOG_SINCE;
  if (explicitSince) {
    const since = validateIsoDate(explicitSince, 'since');
    if (new Date(since) >= new Date(until)) {
      throw new Error(`Expected since < until, received since=${since} until=${until}`);
    }

    return { since, until, source: 'manual' };
  }

  const changelogNumbers = await getExistingChangelogNumbers();
  const latestNumber = changelogNumbers.at(-1);

  if (latestNumber !== undefined) {
    const relativePath = path.posix.join(
      'content/docs/changelog',
      `changelog-${formatChangelogNumber(latestNumber)}.mdx`,
    );
    const addedAt = getGitTimestampForAddedFile(relativePath);

    if (addedAt) {
      const since = validateIsoDate(addedAt, 'since');
      if (new Date(since) < new Date(until)) {
        return applyBootstrapSince(since, until, 'git');
      }
    }
  }

  return applyBootstrapSince(subtractDays(until, DEFAULT_LOOKBACK_DAYS), until, 'fallback');
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

function parseCommitType(subject: string): string | null {
  const match = subject.toLowerCase().match(/^([a-z]+)(\([^)]*\))?:\s+/);
  return match?.[1] || null;
}

function truncateText(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).trimEnd()}\n...[truncated]`;
}

function normalizeCommit(repoConfig: ChangelogRepository, commit: GitHubListCommit): CommitCandidate {
  const lines = commit.commit.message.split('\n');
  const subject = lines[0]?.trim() || commit.sha;
  const body = truncateText(lines.slice(1).join('\n').trim(), COMMIT_BODY_CHAR_LIMIT);
  const author = commit.author?.login || commit.commit.author.name || 'unknown';

  return {
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    branch: repoConfig.branch,
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    url: commit.html_url,
    author,
    committedAt: commit.commit.author.date,
    subject,
    body,
    commitType: parseCommitType(subject),
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
      if (/^merge (branch|pull request)/i.test(normalized.subject)) {
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

async function loadPromptContext(): Promise<string> {
  const sections: string[] = [];

  for (const contextFile of CHANGELOG_CONTEXT_FILES) {
    const content = await loadFileForPrompt(contextFile.path, PROMPT_CONTEXT_CHAR_LIMIT);
    sections.push(`## ${contextFile.label}\nPath: ${contextFile.path}\n\n${content}`);
  }

  const changelogNumbers = await getExistingChangelogNumbers();
  const recentNumbers = changelogNumbers.slice(-RECENT_CHANGELOG_EXAMPLE_COUNT).reverse();

  for (const number of recentNumbers) {
    const slug = `changelog-${formatChangelogNumber(number)}`;
    const filePath = path.posix.join('content/docs/changelog', `${slug}.mdx`);
    const content = await loadFileForPrompt(filePath, PROMPT_CHANGELOG_CHAR_LIMIT);
    sections.push(`## Recent changelog example: ${slug}\nPath: ${filePath}\n\n${content}`);
  }

  return sections.join('\n\n');
}

function formatCommitForPrompt(commit: CommitCandidate): string {
  const lines = [
    `- repo: ${commit.owner}/${commit.repo}`,
    `  branch: ${commit.branch}`,
    `  sha: ${commit.sha}`,
    `  url: ${commit.url}`,
    `  author: ${commit.author}`,
    `  committedAt: ${commit.committedAt}`,
    `  commitType: ${commit.commitType ?? 'unknown'}`,
    `  subject: ${commit.subject}`,
  ];

  if (commit.body) {
    lines.push('  body: |');
    for (const bodyLine of commit.body.split('\n')) {
      lines.push(`    ${bodyLine}`);
    }
  } else {
    lines.push('  body: <none>');
  }

  return lines.join('\n');
}

function formatRepoListForPrBody(): string {
  return CHANGELOG_REPOSITORIES.map((repo) => `- \`${repo.owner}/${repo.repo}@${repo.branch}\``).join('\n');
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

function renderDraftBody(draft: DraftResult): string {
  const blocks: string[] = [draft.introduction.trim()];

  for (const section of draft.sections) {
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

function buildMdxDocument(number: number, draft: DraftResult): string {
  const numberLabel = formatChangelogNumber(number);
  const frontmatter = [
    '---',
    `title: "Changelog #${numberLabel}"`,
    `sidebarTitle: "Changelog #${numberLabel}"`,
    'llm: true',
    `image: "${CHANGELOG_PLACEHOLDER_IMAGE.src}"`,
    `imageAlt: "${CHANGELOG_PLACEHOLDER_IMAGE.alt}"`,
    `imageWidth: ${CHANGELOG_PLACEHOLDER_IMAGE.width}`,
    `imageHeight: ${CHANGELOG_PLACEHOLDER_IMAGE.height}`,
    '---',
    "import Image from 'next/image';",
    '',
    '<Image',
    `  src="${CHANGELOG_PLACEHOLDER_IMAGE.src}"`,
    `  alt="${CHANGELOG_PLACEHOLDER_IMAGE.alt}"`,
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
  discardedItems: DiscardedItem[],
  warnings: string[],
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
    `- Placeholder image: \`${CHANGELOG_PLACEHOLDER_IMAGE.src}\``,
    '',
    '## Monitored repositories',
    '',
    formatRepoListForPrBody(),
  ];

  if (draft.sections.length > 0) {
    sections.push('', '## Included items', '');
    for (const section of draft.sections) {
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

  if (discardedItems.length > 0) {
    sections.push('## Discarded items', '');
    for (const item of discardedItems) {
      const refs = renderReferenceLinks(item.references);
      const line = `- ${item.text.trim()} — ${item.reason.trim()}${refs ? ` ${refs}` : ''}`;
      sections.push(line);
    }
    sections.push('');
  }

  if (warnings.length > 0) {
    sections.push('## Warnings', '');
    for (const warning of warnings) {
      sections.push(`- ${warning}`);
    }
  }

  return sections.join('\n').trimEnd() + '\n';
}

function extractJsonObject(content: string): string {
  const trimmed = content.trim();
  const withoutFence = trimmed.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error('Model output did not contain a JSON object.');
  }

  return withoutFence.slice(firstBrace, lastBrace + 1);
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

function parseDraftResult(rawContent: string): DraftResult {
  const json = JSON.parse(extractJsonObject(rawContent)) as Record<string, unknown>;
  const introduction = isNonEmptyString(json.introduction) ? json.introduction.trim() : '';

  if (!introduction) {
    throw new Error('Model output was missing a valid introduction.');
  }

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

          if (
            heading !== '⭐ New' &&
            heading !== '🐛 Bug Fixes' &&
            heading !== '🔧 Improvements' &&
            heading !== '🏡 Housekeeping'
          ) {
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

  if (sections.length === 0) {
    throw new Error('Model output did not contain any valid changelog sections.');
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
  };
}

async function requestDraftFromModel(
  commits: CommitCandidate[],
  number: number,
  windowSelection: WindowSelection,
  openAiToken: string,
): Promise<DraftResult> {
  const systemPrompt = await fs.readFile(path.join(process.cwd(), CHANGELOG_PROMPT_FILE), 'utf8');
  const docsContext = await loadPromptContext();
  const commitPayload = commits.map(formatCommitForPrompt).join('\n\n');
  const model = process.env.CHANGELOG_OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  const userPrompt = [
    `Generate changelog #${formatChangelogNumber(number)}.`,
    `Commit window: ${windowSelection.since} to ${windowSelection.until}.`,
    '',
    'Return JSON only with this shape:',
    '{',
    '  "introduction": "string",',
    '  "sections": [',
    '    {',
    '      "heading": "⭐ New | 🐛 Bug Fixes | 🔧 Improvements | 🏡 Housekeeping",',
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
    '  ]',
    '}',
    '',
    '## Product and style context',
    docsContext,
    '',
    '## Weekly commit data',
    commitPayload,
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiToken}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI response did not include message content.');
  }

  return parseDraftResult(content);
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const windowSelection = await selectWindow(options);
  const changelogNumbers = await getExistingChangelogNumbers();
  const nextNumber = (changelogNumbers.at(-1) ?? -1) + 1;
  const slug = `changelog-${formatChangelogNumber(nextNumber)}`;
  const draftPath = path.posix.join('content/docs/changelog', `${slug}.mdx`);
  const githubToken = getGithubToken();
  const openAiToken = getOpenAiToken();

  const warnings: string[] = [];
  const commits: CommitCandidate[] = [];

  for (const repoConfig of CHANGELOG_REPOSITORIES) {
    try {
      const repoCommits = await fetchRepositoryCommits(
        repoConfig,
        githubToken,
        windowSelection.since,
        windowSelection.until,
      );
      commits.push(...repoCommits);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed to fetch commits for ${repoConfig.owner}/${repoConfig.repo}: ${message}`);
    }
  }

  commits.sort((left, right) => {
    if (left.repo === right.repo) {
      return left.committedAt.localeCompare(right.committedAt);
    }

    return left.repo.localeCompare(right.repo);
  });

  if (commits.length === 0) {
    console.log(
      `No commits found between ${windowSelection.since} and ${windowSelection.until}. Nothing to draft.`,
    );
    await appendGithubOutput('has_changes', 'false');
    return;
  }

  console.log(`Fetched ${commits.length} candidate commits across monitored repositories.`);

  const draft = await requestDraftFromModel(commits, nextNumber, windowSelection, openAiToken);
  const mdx = buildMdxDocument(nextNumber, draft);
  await fs.writeFile(path.join(process.cwd(), draftPath), mdx);
  await updateChangelogMeta(slug);

  const prBody = buildPrBody(
    nextNumber,
    draftPath,
    windowSelection,
    draft,
    draft.discardedItems,
    warnings,
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

  console.log(`Generated ${draftPath}`);
  console.log(`Prepared PR body at ${prBodyPath}`);
}

await main();
