import {
  CHANGED_FILES_PROMPT_LIMIT,
  type ChangelogSourceKind,
  PULL_REQUEST_BODY_CHAR_LIMIT,
  SKIP_AUTHORS,
} from './config';

export interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface PullRequestContext {
  number: number;
  url: string;
  title: string;
  body: string;
}

export interface ReleaseContext {
  owner: string;
  repo: string;
  sha: string;
  url: string;
  path: string;
}

export interface CommitCandidate {
  owner: string;
  repo: string;
  branch: string;
  sourceKind: ChangelogSourceKind;
  sha: string;
  shortSha: string;
  url: string;
  author: string;
  committedAt: string;
  subject: string;
  body: string;
  commitType: string | null;
  parents: string[];
  changedFiles: ChangedFile[];
  pullRequest: PullRequestContext | null;
  releasedVia: ReleaseContext | null;
}

export interface ChangeGroup {
  key: string;
  owner: string;
  repo: string;
  branch: string;
  sourceKind: ChangelogSourceKind;
  commits: CommitCandidate[];
  pullRequest: PullRequestContext | null;
  changedFiles: ChangedFile[];
}

export interface GitHubAssociatedPullRequest {
  number: number;
  html_url: string;
  title: string;
  body: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
}

export type EligibilityReason =
  | 'automated_author'
  | 'benchmark_maintenance'
  | 'disabled_source'
  | 'eligible'
  | 'ecosystem_listing'
  | 'ignored_files_only'
  | 'internal_only'
  | 'missing_changed_files'
  | 'non_material_docs'
  | 'non_recipe_change'
  | 'routine_maintenance'
  | 'self_generated'
  | 'submodule_pointer_only';

export interface ExcludedChangeGroup {
  group: ChangeGroup;
  reason: Exclude<EligibilityReason, 'eligible'>;
}

export interface ExclusionSummary {
  reason: Exclude<EligibilityReason, 'eligible'>;
  count: number;
}

export interface WindowSelection {
  since: string;
  until: string;
  source: 'manual' | 'preview' | 'state';
}

const COMMON_IGNORED_FILE_PATTERNS = [
  /^\.github\//,
  /^\.changeset\//,
  /^\.claude\//,
  /^ci\//,
  /(^|\/)(bun|pnpm|yarn)\.lockb?$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)cargo\.lock$/i,
  /(^|\/)dockerfile$/i,
  /(^|\/)\.dockerignore$/,
];

function truncateText(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).trimEnd()}\n...[truncated]`;
}

function normalizeComparisonText(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cleanCommitBody(body: string): string {
  return body
    .split('\n')
    .filter((line) => !/^(co-authored-by|signed-off-by|reviewed-by):/i.test(line.trim()))
    .join('\n')
    .trim();
}

export function cleanPullRequestBody(title: string, body: string | null): string {
  if (!body) {
    return '';
  }

  const cleaned = body
    .replace(/\r\n/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .filter((line) => !/^\s*[-*]\s+\[[ xX]\]\s*/.test(line))
    .filter((line) => !/^(co-authored-by|signed-off-by|reviewed-by):/i.test(line.trim()))
    .filter(
      (line) =>
        !/^#{1,6}\s+(description|type of change|related issues|changes made|testing|documentation|code quality|breaking changes|screenshots(?: \(if applicable\))?|additional notes|reviewer checklist)\s*$/i.test(
          line.trim(),
        ),
    )
    .filter(
      (line) =>
        !/^(brief description of the changes in this pr\.?|closes #\(issue number\)|related to #\(issue number\)|if this is a breaking change, please describe:|[123]\. (what breaks|how users should migrate|why this change is necessary):|include screenshots or gifs for ui changes\.?|any additional information, concerns, or context for reviewers\.?|---)$/i.test(
          line.trim(),
        ),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned || normalizeComparisonText(cleaned) === normalizeComparisonText(title)) {
    return '';
  }

  if (/^https?:\/\/\S+$/i.test(cleaned)) {
    return '';
  }

  if (/^(ticket|issue|linear):?\s+https?:\/\/\S+$/i.test(cleaned)) {
    return '';
  }

  const normalized = normalizeComparisonText(cleaned);
  const templateOnly =
    /^(describe (your|the) changes|what does this pr do|summary|description|related (issue|ticket)s?)$/.test(
      normalized,
    );

  return templateOnly ? '' : truncateText(cleaned, PULL_REQUEST_BODY_CHAR_LIMIT);
}

export function selectAssociatedPullRequest(
  pullRequests: GitHubAssociatedPullRequest[],
  commitSha: string,
): PullRequestContext | null {
  const mergedPullRequests = pullRequests.filter((pullRequest) => pullRequest.merged_at);
  const exactMerge = mergedPullRequests.find(
    (pullRequest) => pullRequest.merge_commit_sha === commitSha,
  );
  const selected =
    exactMerge ||
    [...mergedPullRequests].sort((left, right) =>
      (right.merged_at || '').localeCompare(left.merged_at || ''),
    )[0];

  if (!selected) {
    return null;
  }

  return {
    number: selected.number,
    url: selected.html_url,
    title: selected.title.trim(),
    body: cleanPullRequestBody(selected.title, selected.body),
  };
}

export function parseCommitType(subject: string): string | null {
  const match = subject.toLowerCase().match(/^([a-z]+)(\([^)]*\))?!?:\s+/);
  return match?.[1] || null;
}

export function parseSubmodulePatch(patch: string): { baseSha: string; headSha: string } | null {
  const baseSha = patch.match(/^-Subproject commit ([0-9a-f]{40})$/im)?.[1];
  const headSha = patch.match(/^\+Subproject commit ([0-9a-f]{40})$/im)?.[1];

  if (!baseSha || !headSha || baseSha === headSha) {
    return null;
  }

  return { baseSha, headSha };
}

export async function resolveSubmoduleRange(
  patch: string | undefined,
  fallback: () => Promise<{ baseSha: string; headSha: string }>,
): Promise<{ baseSha: string; headSha: string }> {
  const range = patch ? parseSubmodulePatch(patch) : null;
  const resolved = range || (await fallback());
  const isFullSha = (value: string) => /^[0-9a-f]{40}$/i.test(value);

  if (
    !isFullSha(resolved.baseSha) ||
    !isFullSha(resolved.headSha) ||
    resolved.baseSha === resolved.headSha
  ) {
    throw new Error('Could not resolve a valid submodule commit range.');
  }

  return resolved;
}

function mergeChangedFiles(commits: CommitCandidate[]): ChangedFile[] {
  const files = new Map<string, ChangedFile>();

  for (const commit of commits) {
    for (const file of commit.changedFiles) {
      files.set(file.filename, file);
    }
  }

  return [...files.values()].sort((left, right) => left.filename.localeCompare(right.filename));
}

export function groupCommitsByPullRequest(commits: CommitCandidate[]): ChangeGroup[] {
  const uniqueCommits = new Map<string, CommitCandidate>();

  for (const commit of commits) {
    uniqueCommits.set(`${commit.owner}/${commit.repo}@${commit.sha}`, commit);
  }

  const groups = new Map<string, CommitCandidate[]>();

  for (const commit of uniqueCommits.values()) {
    const key = commit.pullRequest
      ? `${commit.owner}/${commit.repo}#${commit.pullRequest.number}`
      : `${commit.owner}/${commit.repo}@${commit.sha}`;
    const groupedCommits = groups.get(key) || [];
    groupedCommits.push(commit);
    groups.set(key, groupedCommits);
  }

  return [...groups.entries()]
    .map(([key, groupedCommits]) => {
      groupedCommits.sort((left, right) => left.committedAt.localeCompare(right.committedAt));
      const first = groupedCommits[0];

      return {
        key,
        owner: first.owner,
        repo: first.repo,
        branch: first.branch,
        sourceKind: first.sourceKind,
        commits: groupedCommits,
        pullRequest: groupedCommits.find((commit) => commit.pullRequest)?.pullRequest || null,
        changedFiles: mergeChangedFiles(groupedCommits),
      } satisfies ChangeGroup;
    })
    .sort((left, right) => left.key.localeCompare(right.key));
}

function getGroupText(group: ChangeGroup): string {
  return [
    group.pullRequest?.title,
    group.pullRequest?.body,
    ...group.commits.flatMap((commit) => [commit.subject, cleanCommitBody(commit.body)]),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
}

function getGroupHeadlineText(group: ChangeGroup): string {
  return [group.pullRequest?.title, ...group.commits.map((commit) => commit.subject)]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
}

function allFilesMatch(group: ChangeGroup, predicate: (filename: string) => boolean): boolean {
  return group.changedFiles.every((file) => predicate(file.filename));
}

function fileWasAdded(group: ChangeGroup, filename: string): boolean {
  return group.commits.some((commit) =>
    commit.changedFiles.some((file) => file.filename === filename && file.status === 'added'),
  );
}

function isCommonlyIgnoredFile(filename: string): boolean {
  return COMMON_IGNORED_FILE_PATTERNS.some((pattern) => pattern.test(filename));
}

function allFilesAreCommonlyIgnored(group: ChangeGroup): boolean {
  return allFilesMatch(group, isCommonlyIgnoredFile);
}

function isDependencyMaintenanceFile(filename: string): boolean {
  return (
    isCommonlyIgnoredFile(filename) ||
    /(^|\/)(package\.json|cargo\.toml|go\.(mod|sum)|pyproject\.toml|requirements[^/]*\.txt|uv\.lock)$/i.test(
      filename,
    )
  );
}

function isAutomatedGroup(group: ChangeGroup): boolean {
  return group.commits.every((commit) => {
    const author = commit.author.toLowerCase();
    return SKIP_AUTHORS.some((skipAuthor) => author.includes(skipAuthor.toLowerCase()));
  });
}

function classifyGroup(group: ChangeGroup): EligibilityReason {
  if (group.sourceKind === 'infra' || group.sourceKind === 'inactive') {
    return 'disabled_source';
  }

  if (group.sourceKind === 'ecosystem') {
    return 'ecosystem_listing';
  }

  if (isAutomatedGroup(group)) {
    return 'automated_author';
  }

  if (group.changedFiles.length === 0) {
    return 'missing_changed_files';
  }

  if (allFilesAreCommonlyIgnored(group)) {
    return 'ignored_files_only';
  }

  const text = getGroupText(group);
  const headlineText = getGroupHeadlineText(group);
  const maintenanceHeadline =
    /\b(dependenc(y|ies)|deps)\b/.test(headlineText) ||
    /\b(bump|prepare|publish)\b.{0,30}\b(version|release)\b/.test(headlineText);
  if (maintenanceHeadline && allFilesMatch(group, isDependencyMaintenanceFile)) {
    return 'routine_maintenance';
  }

  if (group.sourceKind === 'application') {
    if (allFilesMatch(group, (filename) => filename === 'apps/steel-browser')) {
      return 'submodule_pointer_only';
    }

    if (
      /\b(jetstream|nats|puppet[- ]?master|fleet controller|nomad|gcp teardown)\b/.test(
        headlineText,
      )
    ) {
      return 'internal_only';
    }

    const internalPaths =
      /^(deploy|deployment|infra|nomad|terraform|charts?)\/|^apps\/api\/src\/external\/puppet-master\//;
    return allFilesMatch(group, (filename) => internalPaths.test(filename))
      ? 'internal_only'
      : 'eligible';
  }

  if (group.sourceKind === 'browser') {
    const allCommitsAreRoutine = group.commits.every((commit) =>
      ['build', 'chore', 'ci', 'docs', 'test'].includes(commit.commitType || ''),
    );
    if (allCommitsAreRoutine && !/\b(allow|enable|fix|prevent|support|user)\b/.test(text)) {
      return 'routine_maintenance';
    }

    const productPath = /^(api|apps|crates|packages|repl|src|ui)\//;
    const hasProductPath = group.changedFiles.some((file) => productPath.test(file.filename));
    const hasProductCommit = group.commits.some((commit) =>
      ['feat', 'fix', 'perf', 'refactor'].includes(commit.commitType || ''),
    );

    return hasProductPath || hasProductCommit ? 'eligible' : 'routine_maintenance';
  }

  if (group.sourceKind === 'docs') {
    const readerFacingFiles = group.changedFiles.filter((file) =>
      file.filename.startsWith('content/docs/'),
    );

    if (readerFacingFiles.length === 0) {
      return 'non_material_docs';
    }

    if (readerFacingFiles.every((file) => file.filename.startsWith('content/docs/changelog/'))) {
      return 'self_generated';
    }

    const materialFiles = readerFacingFiles.filter(
      (file) => !/(^|\/)meta\.json$/.test(file.filename),
    );
    if (materialFiles.some((file) => fileWasAdded(group, file.filename))) {
      return 'eligible';
    }

    if (
      /\b(seo|cross[- ]?link|breadcrumb|sitemap|meta title|sidebar|navigation|typo|copy edit)\b/.test(
        headlineText,
      )
    ) {
      return 'non_material_docs';
    }

    return materialFiles.length > 0 ? 'eligible' : 'non_material_docs';
  }

  if (group.sourceKind === 'cookbook') {
    const recipeFiles = group.changedFiles.filter((file) =>
      /^(examples|recipes)\//.test(file.filename),
    );
    const addsRecipe =
      recipeFiles.some((file) => fileWasAdded(group, file.filename)) ||
      (/\b(add|added|new|introduc(e|ed|es|ing))\b/.test(text) &&
        group.changedFiles.some((file) => file.filename === 'registry.yaml'));

    return addsRecipe ? 'eligible' : 'non_recipe_change';
  }

  if (group.sourceKind === 'leaderboard') {
    const addsBenchmark =
      /\b(add|added|new|launch(ed)?|introduc(e|ed|es|ing)|expand(ed)?)\b.{0,40}\bbenchmark\b/.test(
        text,
      ) ||
      group.changedFiles.some(
        (file) =>
          fileWasAdded(group, file.filename) &&
          /(^|\/)benchmarks?\//.test(file.filename.toLowerCase()),
      );

    if (addsBenchmark) {
      return 'eligible';
    }

    return 'benchmark_maintenance';
  }

  if (group.sourceKind === 'cli') {
    const userFacingPath = /^(src|docs)\//;
    const hasUserFacingFile = group.changedFiles.some(
      (file) =>
        userFacingPath.test(file.filename) || ['README.md', 'install.sh'].includes(file.filename),
    );

    return hasUserFacingFile ? 'eligible' : 'routine_maintenance';
  }

  return 'routine_maintenance';
}

export function filterEligibleChangeGroups(groups: ChangeGroup[]): {
  eligible: ChangeGroup[];
  excluded: ExcludedChangeGroup[];
} {
  const eligible: ChangeGroup[] = [];
  const excluded: ExcludedChangeGroup[] = [];

  for (const group of groups) {
    const reason = classifyGroup(group);
    if (reason === 'eligible') {
      eligible.push(group);
    } else {
      excluded.push({ group, reason });
    }
  }

  return { eligible, excluded };
}

export function summarizeExcludedChangeGroups(excluded: ExcludedChangeGroup[]): ExclusionSummary[] {
  const counts = new Map<ExclusionSummary['reason'], number>();

  for (const item of excluded) {
    counts.set(item.reason, (counts.get(item.reason) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((left, right) => left.reason.localeCompare(right.reason));
}

export function formatChangeGroupForPrompt(group: ChangeGroup): string {
  const hasNarrativeContext =
    Boolean(group.pullRequest?.body) ||
    group.commits.some((commit) => Boolean(cleanCommitBody(commit.body)));
  const changedFiles = group.changedFiles
    .slice(0, CHANGED_FILES_PROMPT_LIMIT)
    .map((file, index) => ({
      path: file.filename,
      status: file.status,
      patchExcerpt:
        !hasNarrativeContext && index < 5 && file.patch ? truncateText(file.patch, 600) : undefined,
    }));

  return JSON.stringify(
    {
      id: group.key,
      repository: `${group.owner}/${group.repo}`,
      branch: group.branch,
      sourceKind: group.sourceKind,
      pullRequest: group.pullRequest,
      changedFileCount: group.changedFiles.length,
      changedFiles,
      omittedChangedFileCount: Math.max(0, group.changedFiles.length - changedFiles.length),
      commits: group.commits.map((commit) => ({
        sha: commit.sha,
        url: commit.url,
        author: commit.author,
        committedAt: commit.committedAt,
        type: commit.commitType,
        subject: commit.subject,
        body: cleanCommitBody(commit.body) || null,
        releasedVia: commit.releasedVia,
      })),
    },
    null,
    2,
  );
}

function validateTimestamp(value: string, label: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label} value: ${value}`);
  }

  return parsed.toISOString();
}

export function resolveWindow(input: {
  explicitSince?: string;
  until: string;
  stateUntil: string;
}): WindowSelection {
  const until = validateTimestamp(input.until, 'until');
  const stateUntil = validateTimestamp(input.stateUntil, 'state until');
  const since = validateTimestamp(input.explicitSince || stateUntil, 'since');

  if (new Date(until) <= new Date(stateUntil)) {
    throw new Error(`Expected until > state until, received state=${stateUntil} until=${until}`);
  }

  if (input.explicitSince && new Date(since) > new Date(stateUntil)) {
    throw new Error(
      `Explicit since cannot be later than state until, received since=${since} state=${stateUntil}`,
    );
  }

  if (new Date(since) >= new Date(until)) {
    throw new Error(`Expected since < until, received since=${since} until=${until}`);
  }

  return {
    since,
    until,
    source: input.explicitSince ? 'manual' : 'state',
  };
}

export function resolvePreviewWindow(input: { since: string; until: string }): WindowSelection {
  const since = validateTimestamp(input.since, 'since');
  const until = validateTimestamp(input.until, 'until');

  if (new Date(since) >= new Date(until)) {
    throw new Error(`Expected since < until, received since=${since} until=${until}`);
  }

  return {
    since,
    until,
    source: 'preview',
  };
}

export function isTimestampInWindow(timestamp: string, window: WindowSelection): boolean {
  const value = new Date(validateTimestamp(timestamp, 'commit timestamp')).getTime();
  return value > new Date(window.since).getTime() && value <= new Date(window.until).getTime();
}
