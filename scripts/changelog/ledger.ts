// ABOUTME: Builds the per-run changelog evidence ledger recording every source group the filter
// ABOUTME: dropped, redacted by repository visibility, and renders its PR body review section.
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  CHANGELOG_AUDIT_DIRECTORY,
  CHANGELOG_REPOSITORIES,
  type ChangelogRepositoryVisibility,
  NEEDS_REVIEW_PR_BODY_LIMIT,
} from './config';
import type {
  ChangeGroup,
  EligibilityReason,
  ExcludedChangeGroup,
  WindowSelection,
} from './source';

export type ExclusionReason = Exclude<EligibilityReason, 'eligible'>;

/**
 * `heuristic` reasons come from regexes, commit types, or missing data, so a real change can hide
 * behind them and a reviewer has to confirm each one. `structural` reasons follow from what a
 * group is rather than what it says, so they can be read in bulk.
 */
export type ExclusionConfidence = 'heuristic' | 'structural';

const HEURISTIC_EXCLUSION_REASONS: ExclusionReason[] = [
  'benchmark_maintenance',
  'internal_only',
  // A group with no changed files was dropped for lost evidence, not for being uninteresting.
  'missing_changed_files',
  'non_material_docs',
  'non_recipe_change',
  'routine_maintenance',
];

export interface LedgerCommit {
  shortSha: string;
  url: string;
  subject: string | null;
}

export interface LedgerPullRequest {
  number: number;
  url: string;
  title: string | null;
}

export interface LedgerExclusion {
  reason: ExclusionReason;
  confidence: ExclusionConfidence;
  key: string;
  repo: string;
  visibility: ChangelogRepositoryVisibility;
  redacted: boolean;
  pullRequest: LedgerPullRequest | null;
  commits: LedgerCommit[];
  changedFileCount: number;
  changedFiles: string[] | null;
}

export interface LedgerAuthorSkip {
  repo: string;
  sha: string;
  url: string;
  author: string;
}

export interface LedgerModelDiscard {
  text: string | null;
  reason: string;
  redacted: boolean;
  references: Array<{ label: string; url: string }>;
}

export interface LedgerReconciliation {
  commitsCollected: number;
  authorSkippedCommits: number;
  logicalChanges: number;
  eligible: number;
  excluded: number;
  unaccounted: number;
}

export interface EvidenceLedger {
  changelogNumber: number;
  window: WindowSelection;
  reconciliation: LedgerReconciliation;
  exclusions: LedgerExclusion[];
  authorSkipped: LedgerAuthorSkip[];
  modelDiscarded: LedgerModelDiscard[];
}

export interface DiscardedItemInput {
  text: string;
  reason: string;
  references: Array<{ label: string; url: string }>;
}

export function getExclusionConfidence(reason: ExclusionReason): ExclusionConfidence {
  return HEURISTIC_EXCLUSION_REASONS.includes(reason) ? 'heuristic' : 'structural';
}

/**
 * An unconfigured repository is treated as private so a newly monitored source cannot leak its
 * commit prose into the public PR body before someone declares its visibility.
 */
export function getRepositoryVisibility(
  owner: string,
  repo: string,
): ChangelogRepositoryVisibility {
  const configured = CHANGELOG_REPOSITORIES.find(
    (repository) => repository.owner === owner && repository.repo === repo,
  );

  return configured?.visibility || 'private';
}

function isPublicRepositoryUrl(url: string): boolean {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)/.exec(url);

  if (!match) {
    return false;
  }

  return getRepositoryVisibility(match[1], match[2]) === 'public';
}

function buildExclusion(excluded: ExcludedChangeGroup): LedgerExclusion {
  const { group, reason } = excluded;
  const visibility = getRepositoryVisibility(group.owner, group.repo);
  const redacted = visibility === 'private';

  return {
    reason,
    confidence: getExclusionConfidence(reason),
    key: group.key,
    repo: `${group.owner}/${group.repo}`,
    visibility,
    redacted,
    pullRequest: group.pullRequest
      ? {
          number: group.pullRequest.number,
          url: group.pullRequest.url,
          title: redacted ? null : group.pullRequest.title,
        }
      : null,
    commits: group.commits.map((commit) => ({
      shortSha: commit.shortSha,
      url: commit.url,
      subject: redacted ? null : commit.subject,
    })),
    changedFileCount: group.changedFiles.length,
    changedFiles: redacted ? null : group.changedFiles.map((file) => file.filename),
  };
}

function buildModelDiscard(item: DiscardedItemInput): LedgerModelDiscard {
  // The model writes this prose from the evidence it was given, so it can only stay when every
  // commit behind it is public.
  const redacted =
    item.references.length === 0 ||
    !item.references.every((reference) => isPublicRepositoryUrl(reference.url));

  return {
    text: redacted ? null : item.text,
    reason: item.reason,
    redacted,
    references: item.references,
  };
}

export function buildEvidenceLedger(input: {
  changelogNumber: number;
  windowSelection: WindowSelection;
  commitsCollected: number;
  authorSkipped: LedgerAuthorSkip[];
  logicalChanges: number;
  eligibleGroups: ChangeGroup[];
  excludedGroups: ExcludedChangeGroup[];
  discardedItems: DiscardedItemInput[];
}): EvidenceLedger {
  const exclusions = input.excludedGroups.map(buildExclusion);

  return {
    changelogNumber: input.changelogNumber,
    window: input.windowSelection,
    reconciliation: {
      commitsCollected: input.commitsCollected,
      authorSkippedCommits: input.authorSkipped.length,
      logicalChanges: input.logicalChanges,
      eligible: input.eligibleGroups.length,
      excluded: exclusions.length,
      unaccounted: input.logicalChanges - input.eligibleGroups.length - exclusions.length,
    },
    exclusions,
    authorSkipped: input.authorSkipped,
    modelDiscarded: input.discardedItems.map(buildModelDiscard),
  };
}

export function getEvidenceLedgerPath(changelogNumber: number): string {
  return path.posix.join(
    CHANGELOG_AUDIT_DIRECTORY,
    `${String(changelogNumber).padStart(3, '0')}.json`,
  );
}

/** Writes the ledger under `rootDirectory` and returns its repository-relative path. */
export async function writeEvidenceLedger(
  rootDirectory: string,
  ledger: EvidenceLedger,
): Promise<string> {
  const relativePath = getEvidenceLedgerPath(ledger.changelogNumber);
  const absolutePath = path.join(rootDirectory, relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, `${JSON.stringify(ledger, null, 2)}\n`);

  return relativePath;
}

function renderExclusionLine(entry: LedgerExclusion): string {
  const pullRequest = entry.pullRequest
    ? ` [#${entry.pullRequest.number}](${entry.pullRequest.url})`
    : ` [${entry.commits[0]?.shortSha || entry.key}](${entry.commits[0]?.url || ''})`;
  const headline = entry.pullRequest?.title || entry.commits[0]?.subject;
  const scale = `${entry.commits.length} commit${entry.commits.length === 1 ? '' : 's'}, ${entry.changedFileCount} file${entry.changedFileCount === 1 ? '' : 's'}`;

  return `- \`${entry.reason}\` ${entry.repo}${pullRequest}${headline ? `: ${headline}` : ''} (${scale})`;
}

export function renderSourceFilteringSection(ledger: EvidenceLedger): string[] {
  const { reconciliation } = ledger;
  const authorSkipNote =
    reconciliation.authorSkippedCommits > 0
      ? ` (${reconciliation.authorSkippedCommits} skipped as an automated author before grouping)`
      : '';
  const lines = [
    '## Source filtering',
    '',
    `- Commits collected: ${reconciliation.commitsCollected}${authorSkipNote}`,
    `- Logical changes: ${reconciliation.logicalChanges} (${reconciliation.eligible} eligible, ${reconciliation.excluded} excluded, ${reconciliation.unaccounted} unaccounted)`,
    `- Full ledger: \`${getEvidenceLedgerPath(ledger.changelogNumber)}\` in this pull request`,
    '- Private sources keep their links and SHAs here but not their titles, subjects, or paths.',
  ];

  const needsReview = ledger.exclusions.filter((entry) => entry.confidence === 'heuristic');
  const structural = ledger.exclusions.filter((entry) => entry.confidence === 'structural');

  if (needsReview.length > 0) {
    lines.push(
      '',
      `### Needs review (${needsReview.length})`,
      '',
      'A heuristic rule dropped each of these. Confirm none of them belongs in the changelog.',
      '',
      ...needsReview.slice(0, NEEDS_REVIEW_PR_BODY_LIMIT).map(renderExclusionLine),
    );

    if (needsReview.length > NEEDS_REVIEW_PR_BODY_LIMIT) {
      lines.push(
        '',
        `${needsReview.length - NEEDS_REVIEW_PR_BODY_LIMIT} more heuristic exclusions are in the ledger.`,
      );
    }
  }

  if (structural.length > 0) {
    lines.push(
      '',
      '<details>',
      `<summary>Structurally excluded (${structural.length})</summary>`,
      '',
      ...structural.map(renderExclusionLine),
      '',
      '</details>',
    );
  }

  if (ledger.modelDiscarded.length > 0) {
    lines.push(
      '',
      '<details>',
      `<summary>Discarded while drafting (${ledger.modelDiscarded.length})</summary>`,
      '',
      ...ledger.modelDiscarded.map((item) => {
        const references = item.references
          .map((reference) => `[${reference.label}](${reference.url})`)
          .join(' ');
        const text = item.text || '_private source_';

        return `- ${text} (${item.reason})${references ? ` ${references}` : ''}`;
      }),
      '',
      '</details>',
    );
  }

  return lines;
}
