import { describe, expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import sharp from 'sharp';
import {
  CHANGELOG_PLACEHOLDER_IMAGE,
  CHANGELOG_REPOSITORIES,
  COVER_MOTIF_CHAR_LIMIT,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENAI_REASONING_EFFORT,
  NEEDS_REVIEW_PR_BODY_LIMIT,
} from '../scripts/changelog/config';
import { generateChangelogCover } from '../scripts/changelog/cover';
import {
  buildEvidenceLedger,
  getEvidenceLedgerPath,
  getExclusionConfidence,
  getRepositoryVisibility,
  renderSourceFilteringSection,
  writeEvidenceLedger,
} from '../scripts/changelog/ledger';
import {
  cleanPullRequestBody,
  filterEligibleChangeGroups,
  formatChangeGroupForPrompt,
  groupCommitsByPullRequest,
  isTimestampInWindow,
  parseSubmodulePatch,
  resolvePreviewWindow,
  resolveSubmoduleRange,
  resolveWindow,
  selectAssociatedPullRequest,
  summarizeExcludedChangeGroups,
} from '../scripts/changelog/source';
import changelogState from '../scripts/changelog/state.json';
import {
  buildMdxDocument,
  createPreviewWorkspace,
  expandReleasedBrowserCommits,
  extractOpenAiResponseText,
  fetchApplicationReleaseCommits,
  fetchApplicationReleaseHead,
  main,
  parseArgs,
  parseDraftResult,
  selectRecentChangelogNumbers,
} from '../scripts/generate-changelog-draft';
import {
  APPLICATION_RELEASE_SHA_AT_035,
  BROWSER_SUBMODULE_PATCH,
  changedFile,
  commitFixture,
  LEADERBOARD_PR_46_COMMITS,
  POLICY_FIXTURES,
  PREVIOUS_CHANGELOG_CUTOFF,
  QUIET_WEEK_COMMITS,
} from './fixtures/changelog-v2';

const QUIET_WEEK_WINDOW = resolvePreviewWindow({
  since: '2026-07-17T15:58:38.000Z',
  until: PREVIOUS_CHANGELOG_CUTOFF,
});

function quietWeekLedger(changelogNumber = 36) {
  const groups = groupCommitsByPullRequest(QUIET_WEEK_COMMITS);
  const { eligible, excluded } = filterEligibleChangeGroups(groups);

  return buildEvidenceLedger({
    changelogNumber,
    windowSelection: QUIET_WEEK_WINDOW,
    commitsCollected: QUIET_WEEK_COMMITS.length,
    authorSkipped: [],
    logicalChanges: groups.length,
    eligibleGroups: eligible,
    excludedGroups: excluded,
    discardedItems: [],
  });
}

describe('changelog v2 source evidence', () => {
  test('groups merge and constituent commits into one logical pull request', () => {
    const groups = groupCommitsByPullRequest([
      ...LEADERBOARD_PR_46_COMMITS,
      LEADERBOARD_PR_46_COMMITS[1],
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('steel-dev/leaderboard#46');
    expect(groups[0].commits).toHaveLength(3);
    expect(groups[0].changedFiles.map((file) => file.filename)).toEqual([
      'src/data/index.ts',
      'src/data/osworld.json',
      'src/data/osworld2.json',
    ]);
    expect(formatChangeGroupForPrompt(groups[0])).toContain('"title": "Add OSWorld 2.0 benchmark"');
  });

  test('preserves added-file evidence across later commits in the same pull request', () => {
    const pullRequest = {
      number: 51,
      url: 'https://github.com/steel-dev/steel-cookbook/pull/51',
      title: 'Stripe Projects web agent workflow',
      body: '',
    };
    const groups = groupCommitsByPullRequest([
      commitFixture('cookbook', {
        repo: 'steel-cookbook',
        sha: 'a'.repeat(40),
        committedAt: '2026-07-24T15:00:00.000Z',
        subject: 'feat: Stripe Projects web agent workflow',
        pullRequest,
        changedFiles: [changedFile('examples/stripe-projects-web-agent/index.ts', 'added')],
      }),
      commitFixture('cookbook', {
        repo: 'steel-cookbook',
        sha: 'b'.repeat(40),
        committedAt: '2026-07-24T16:00:00.000Z',
        subject: 'refactor: simplify the workflow',
        pullRequest,
        changedFiles: [changedFile('examples/stripe-projects-web-agent/index.ts')],
      }),
    ]);

    expect(groups[0].changedFiles[0].status).toBe('modified');
    expect(filterEligibleChangeGroups(groups).eligible).toHaveLength(1);
  });

  test('selects the exact merge pull request and cleans sparse bodies', () => {
    const selected = selectAssociatedPullRequest(
      [
        {
          number: 12,
          html_url: 'https://github.com/steel-dev/repo/pull/12',
          title: 'Older exact merge',
          body: '<!-- template -->\nActual user-facing context.\n- [ ] checklist',
          merged_at: '2026-07-24T15:00:00Z',
          merge_commit_sha: 'abc123',
        },
        {
          number: 13,
          html_url: 'https://github.com/steel-dev/repo/pull/13',
          title: 'Newer associated pull request',
          body: 'Different context',
          merged_at: '2026-07-25T15:00:00Z',
          merge_commit_sha: 'def456',
        },
      ],
      'abc123',
    );

    expect(selected?.number).toBe(12);
    expect(selected?.body).toBe('Actual user-facing context.');
    expect(cleanPullRequestBody('Same title', 'Same title')).toBe('');
    expect(cleanPullRequestBody('Ticket only', 'https://linear.app/steel/issue/STL-123')).toBe('');
    expect(
      cleanPullRequestBody('Ticket label', 'Ticket: https://linear.app/steel/issue/STL-123'),
    ).toBe('');
    expect(
      cleanPullRequestBody(
        'Untouched template',
        [
          '## Description',
          'Brief description of the changes in this PR.',
          '## Changes Made',
          '- [ ] List specific changes made',
          '## Additional Notes',
          'Any additional information, concerns, or context for reviewers.',
        ].join('\n'),
      ),
    ).toBe('');
  });

  test('extracts the released browser range from a canonical gitlink patch', () => {
    expect(parseSubmodulePatch(BROWSER_SUBMODULE_PATCH)).toEqual({
      baseSha: '42b785bd554b73c09f75164a8f1e7b3c9f9d435d',
      headSha: '5880b48c1af107219ff3d904edbb8f6b76bea9b6',
    });
    expect(parseSubmodulePatch('ordinary file patch')).toBeNull();
  });

  test('falls back to repository content when a gitlink patch is unavailable', async () => {
    let fallbackCalls = 0;
    const range = await resolveSubmoduleRange(undefined, async () => {
      fallbackCalls += 1;
      return {
        baseSha: '42b785bd554b73c09f75164a8f1e7b3c9f9d435d',
        headSha: '5880b48c1af107219ff3d904edbb8f6b76bea9b6',
      };
    });

    expect(fallbackCalls).toBe(1);
    expect(range.headSha).toBe('5880b48c1af107219ff3d904edbb8f6b76bea9b6');
  });

  test('keeps changed files and commit-body context when no pull request exists', () => {
    const commit = commitFixture('application', {
      body: 'Explains the observable behavior.\nCo-authored-by: Example <example@steel.dev>',
      changedFiles: [
        {
          filename: 'apps/api/src/modules/sessions/sessions.service.ts',
          status: 'modified',
          additions: 4,
          deletions: 1,
          changes: 5,
        },
      ],
    });
    const promptFact = formatChangeGroupForPrompt(groupCommitsByPullRequest([commit])[0]);

    expect(promptFact).toContain('Explains the observable behavior.');
    expect(promptFact).toContain('apps/api/src/modules/sessions/sessions.service.ts');
    expect(promptFact).not.toContain('Co-authored-by');
  });

  test('includes a bounded patch fallback when richer narrative context is absent', () => {
    const commit = commitFixture('application', {
      body: '',
      changedFiles: [
        {
          filename: 'apps/api/src/modules/sessions/sessions.service.ts',
          status: 'modified',
          additions: 1,
          deletions: 1,
          changes: 2,
          patch: '-return oldBehavior;\n+return newBehavior;',
        },
      ],
    });

    expect(formatChangeGroupForPrompt(groupCommitsByPullRequest([commit])[0])).toContain(
      '-return oldBehavior;\\n+return newBehavior;',
    );
  });
});

describe('changelog v2 eligibility', () => {
  test('keeps the repository source modes explicit', () => {
    expect(
      Object.fromEntries(
        CHANGELOG_REPOSITORIES.map((repository) => [
          `${repository.owner}/${repository.repo}`,
          repository.mode,
        ]),
      ),
    ).toEqual({
      '0xnenlabs/steel': 'direct',
      'steel-dev/steel-browser': 'derived',
      'steel-dev/infra': 'excluded',
      'steel-dev/surf.new': 'excluded',
      'steel-dev/steel-cookbook': 'direct',
      'steel-dev/steel-mcp-server': 'excluded',
      'steel-dev/leaderboard': 'direct',
      'steel-dev/awesome-web-agents': 'excluded',
      'steel-dev/cli': 'direct',
      'steel-dev/docs': 'direct',
    });
  });

  test('keeps the repository visibility explicit', () => {
    expect(
      Object.fromEntries(
        CHANGELOG_REPOSITORIES.map((repository) => [
          `${repository.owner}/${repository.repo}`,
          repository.visibility,
        ]),
      ),
    ).toEqual({
      '0xnenlabs/steel': 'private',
      'steel-dev/steel-browser': 'public',
      'steel-dev/infra': 'private',
      'steel-dev/surf.new': 'public',
      'steel-dev/steel-cookbook': 'public',
      'steel-dev/steel-mcp-server': 'public',
      'steel-dev/leaderboard': 'public',
      'steel-dev/awesome-web-agents': 'public',
      'steel-dev/cli': 'public',
      'steel-dev/docs': 'public',
    });
  });

  for (const fixture of POLICY_FIXTURES) {
    test(`${fixture.label}: ${fixture.reason}`, () => {
      const groups = groupCommitsByPullRequest([fixture.commit]);
      const result = filterEligibleChangeGroups(groups);

      expect(result.eligible.length === 1).toBe(fixture.eligible);
      expect(result.eligible[0] ? 'eligible' : result.excluded[0]?.reason).toBe(fixture.reason);
    });
  }

  test('an all-ineligible source window is a quiet week', () => {
    const groups = groupCommitsByPullRequest(QUIET_WEEK_COMMITS);
    const result = filterEligibleChangeGroups(groups);

    expect(groups.length).toBeGreaterThan(0);
    expect(result.eligible).toEqual([]);
    expect(result.excluded.length).toBe(groups.length);
  });

  test('summarizes exclusions without exposing source titles or URLs', () => {
    const result = filterEligibleChangeGroups(groupCommitsByPullRequest(QUIET_WEEK_COMMITS));
    const summary = summarizeExcludedChangeGroups(result.excluded);
    const serialized = JSON.stringify(summary);

    expect(summary.length).toBeGreaterThan(0);
    expect(serialized).not.toContain('JetStream');
    expect(serialized).not.toContain('github.com');
  });

  test('keeps release-promoted application commits even when their commit date is older', () => {
    const promoted = commitFixture('application', {
      owner: '0xnenlabs',
      repo: 'steel',
      committedAt: '2026-07-23T10:00:00.000Z',
      changedFiles: [changedFile('apps/api/src/modules/sessions/sessions.service.ts')],
    });
    const window = resolveWindow({
      until: '2026-07-31T13:00:00.000Z',
      stateUntil: PREVIOUS_CHANGELOG_CUTOFF,
    });

    expect(isTimestampInWindow(promoted.committedAt, window)).toBe(false);
    expect(filterEligibleChangeGroups(groupCommitsByPullRequest([promoted])).eligible).toHaveLength(
      1,
    );
  });

  test('collects application release promotions by SHA instead of commit timestamp', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          status: 'ahead',
          total_commits: 1,
          commits: [
            {
              sha: '1111111111111111111111111111111111111111',
              html_url:
                'https://github.com/0xnenlabs/steel/commit/1111111111111111111111111111111111111111',
              author: { login: 'engineer' },
              commit: {
                message: 'feat(api): add promoted session capability',
                author: {
                  name: 'Engineer',
                  date: '2026-07-20T10:00:00.000Z',
                },
                committer: {
                  date: '2026-07-20T10:00:00.000Z',
                },
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )) as unknown as typeof fetch;

    try {
      const commits = await fetchApplicationReleaseCommits(
        APPLICATION_RELEASE_SHA_AT_035,
        '2222222222222222222222222222222222222222',
        'test-token',
      );

      expect(commits).toHaveLength(1);
      expect(commits[0].committedAt).toBe('2026-07-20T10:00:00.000Z');
      expect(commits[0].sourceKind).toBe('application');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('changelog v2 evidence ledger', () => {
  test('records every excluded group with a reason and a review confidence', () => {
    const { excluded } = filterEligibleChangeGroups(groupCommitsByPullRequest(QUIET_WEEK_COMMITS));
    const ledger = quietWeekLedger();

    expect(ledger.exclusions).toHaveLength(excluded.length);
    expect(ledger.exclusions.every((entry) => entry.reason && entry.repo)).toBe(true);
    expect(new Set(ledger.exclusions.map((entry) => entry.confidence))).toEqual(
      new Set(['heuristic', 'structural']),
    );
  });

  test('separates rules worth re-reading from structural ones', () => {
    // Regex and commit-type rules are where a real change can be lost, so they
    // are the ones a reviewer has to confirm by hand.
    expect(getExclusionConfidence('non_material_docs')).toBe('heuristic');
    expect(getExclusionConfidence('routine_maintenance')).toBe('heuristic');
    expect(getExclusionConfidence('internal_only')).toBe('heuristic');
    expect(getExclusionConfidence('benchmark_maintenance')).toBe('heuristic');
    expect(getExclusionConfidence('non_recipe_change')).toBe('heuristic');
    // Lost changed-file evidence is structural but still needs eyes, because the
    // group was dropped for missing data rather than for being uninteresting.
    expect(getExclusionConfidence('missing_changed_files')).toBe('heuristic');

    expect(getExclusionConfidence('self_generated')).toBe('structural');
    expect(getExclusionConfidence('automated_author')).toBe('structural');
    expect(getExclusionConfidence('disabled_source')).toBe('structural');
    expect(getExclusionConfidence('ecosystem_listing')).toBe('structural');
    expect(getExclusionConfidence('ignored_files_only')).toBe('structural');
    expect(getExclusionConfidence('submodule_pointer_only')).toBe('structural');
  });

  test('redacts private repository prose while keeping a clickable trail', () => {
    const ledger = quietWeekLedger();
    const privateEntries = ledger.exclusions.filter((entry) => entry.visibility === 'private');
    const serialized = JSON.stringify(privateEntries);

    expect(privateEntries.length).toBeGreaterThan(0);
    expect(privateEntries.every((entry) => entry.redacted)).toBe(true);
    expect(serialized).not.toContain('JetStream');
    expect(serialized).not.toContain('update dependencies');
    expect(serialized).not.toContain('improve session reliability');
    expect(serialized).not.toContain('package.json');
    expect(serialized).toContain('0xnenlabs/steel');
    expect(privateEntries.every((entry) => entry.commits.every((commit) => commit.url))).toBe(true);
    expect(privateEntries.every((entry) => entry.changedFileCount > 0)).toBe(true);
  });

  test('keeps public repository detail intact', () => {
    const ledger = quietWeekLedger();
    const docsEntry = ledger.exclusions.find((entry) => entry.reason === 'non_material_docs');

    expect(docsEntry?.repo).toBe('steel-dev/docs');
    expect(docsEntry?.redacted).toBe(false);
    expect(docsEntry?.commits[0]?.subject).toBe('docs(seo): cross-link topic hubs');
    expect(docsEntry?.changedFiles).toContain('content/docs/guides/browser.mdx');
  });

  test('treats an unconfigured repository as private', () => {
    expect(getRepositoryVisibility('steel-dev', 'docs')).toBe('public');
    expect(getRepositoryVisibility('0xnenlabs', 'steel')).toBe('private');
    expect(getRepositoryVisibility('steel-dev', 'not-yet-monitored')).toBe('private');
  });

  test('reconciles collected commits against eligible and excluded groups', () => {
    const ledger = quietWeekLedger();

    expect(ledger.reconciliation.commitsCollected).toBe(QUIET_WEEK_COMMITS.length);
    expect(ledger.reconciliation.eligible).toBe(0);
    expect(ledger.reconciliation.excluded).toBe(ledger.exclusions.length);
    expect(ledger.reconciliation.logicalChanges).toBe(ledger.reconciliation.excluded);
    expect(ledger.reconciliation.unaccounted).toBe(0);
  });

  test('surfaces groups that vanished between grouping and classification', () => {
    const groups = groupCommitsByPullRequest(QUIET_WEEK_COMMITS);
    const { eligible, excluded } = filterEligibleChangeGroups(groups);
    const ledger = buildEvidenceLedger({
      changelogNumber: 36,
      windowSelection: QUIET_WEEK_WINDOW,
      commitsCollected: QUIET_WEEK_COMMITS.length,
      authorSkipped: [],
      logicalChanges: groups.length + 2,
      eligibleGroups: eligible,
      excludedGroups: excluded,
      discardedItems: [],
    });

    expect(ledger.reconciliation.unaccounted).toBe(2);
    expect(renderSourceFilteringSection(ledger).join('\n')).toContain('2 unaccounted');
  });

  test('records commits dropped by author before they reach a group', () => {
    const groups = groupCommitsByPullRequest(QUIET_WEEK_COMMITS);
    const { eligible, excluded } = filterEligibleChangeGroups(groups);
    const ledger = buildEvidenceLedger({
      changelogNumber: 36,
      windowSelection: QUIET_WEEK_WINDOW,
      commitsCollected: QUIET_WEEK_COMMITS.length,
      authorSkipped: [
        {
          repo: 'steel-dev/docs',
          sha: 'e'.repeat(40),
          url: `https://github.com/steel-dev/docs/commit/${'e'.repeat(40)}`,
          author: 'github-actions[bot]',
        },
      ],
      logicalChanges: groups.length,
      eligibleGroups: eligible,
      excludedGroups: excluded,
      discardedItems: [],
    });

    expect(ledger.reconciliation.authorSkippedCommits).toBe(1);
    expect(ledger.authorSkipped[0].author).toBe('github-actions[bot]');
    expect(renderSourceFilteringSection(ledger).join('\n')).toContain(
      '1 skipped as an automated author before grouping',
    );
  });

  test('carries the model discard list with its stated reasons', () => {
    const groups = groupCommitsByPullRequest(QUIET_WEEK_COMMITS);
    const { eligible, excluded } = filterEligibleChangeGroups(groups);
    const ledger = buildEvidenceLedger({
      changelogNumber: 36,
      windowSelection: QUIET_WEEK_WINDOW,
      commitsCollected: QUIET_WEEK_COMMITS.length,
      authorSkipped: [],
      logicalChanges: groups.length,
      eligibleGroups: eligible,
      excludedGroups: excluded,
      discardedItems: [
        {
          text: 'Renamed an internal helper.',
          reason: 'No user-facing effect.',
          references: [
            { label: 'docs d8dd806', url: 'https://github.com/steel-dev/docs/commit/d8dd806' },
          ],
        },
      ],
    });
    const rendered = renderSourceFilteringSection(ledger).join('\n');

    expect(ledger.modelDiscarded).toHaveLength(1);
    expect(ledger.modelDiscarded[0].reason).toBe('No user-facing effect.');
    expect(rendered).toContain('No user-facing effect.');
  });

  test('drops model discard prose that leans on private evidence', () => {
    const groups = groupCommitsByPullRequest(QUIET_WEEK_COMMITS);
    const { eligible, excluded } = filterEligibleChangeGroups(groups);
    const ledger = buildEvidenceLedger({
      changelogNumber: 36,
      windowSelection: QUIET_WEEK_WINDOW,
      commitsCollected: QUIET_WEEK_COMMITS.length,
      authorSkipped: [],
      logicalChanges: groups.length,
      eligibleGroups: eligible,
      excludedGroups: excluded,
      discardedItems: [
        {
          text: 'Reworked the PuppetMaster fleet controller.',
          reason: 'Internal plumbing.',
          references: [
            { label: 'steel 12d54db', url: 'https://github.com/0xnenlabs/steel/commit/12d54db' },
          ],
        },
      ],
    });

    expect(ledger.modelDiscarded[0].redacted).toBe(true);
    expect(ledger.modelDiscarded[0].text).toBeNull();
    expect(ledger.modelDiscarded[0].reason).toBe('Internal plumbing.');
    expect(JSON.stringify(ledger)).not.toContain('PuppetMaster fleet controller');
  });

  test('puts heuristic exclusions in an open list and structural ones behind a fold', () => {
    const rendered = renderSourceFilteringSection(quietWeekLedger()).join('\n');
    const foldIndex = rendered.indexOf('<details>');

    expect(foldIndex).toBeGreaterThan(-1);
    expect(rendered).toContain('### Needs review');
    expect(rendered.slice(0, foldIndex)).toContain('`non_material_docs`');
    expect(rendered.slice(foldIndex)).toContain('`ecosystem_listing`');
    expect(rendered).not.toContain('Only aggregate counts are shown here');
  });

  test('caps the needs-review list and says how many it left out', () => {
    const overflow = Array.from({ length: NEEDS_REVIEW_PR_BODY_LIMIT + 3 }, (_, index) =>
      commitFixture('docs', {
        repo: 'docs',
        sha: `${index}`.padStart(40, 'a'),
        shortSha: `${index}`.padStart(7, 'a'),
        subject: `docs(seo): cross-link topic hub ${index}`,
        changedFiles: [changedFile(`content/docs/guides/hub-${index}.mdx`)],
      }),
    );
    const groups = groupCommitsByPullRequest(overflow);
    const { eligible, excluded } = filterEligibleChangeGroups(groups);
    const ledger = buildEvidenceLedger({
      changelogNumber: 36,
      windowSelection: QUIET_WEEK_WINDOW,
      commitsCollected: overflow.length,
      authorSkipped: [],
      logicalChanges: groups.length,
      eligibleGroups: eligible,
      excludedGroups: excluded,
      discardedItems: [],
    });
    const rendered = renderSourceFilteringSection(ledger).join('\n');

    expect(excluded).toHaveLength(NEEDS_REVIEW_PR_BODY_LIMIT + 3);
    expect(ledger.exclusions).toHaveLength(NEEDS_REVIEW_PR_BODY_LIMIT + 3);
    expect(rendered).toContain(`3 more heuristic exclusions are in the ledger`);
  });

  test('points at a committed ledger path per changelog number', () => {
    expect(getEvidenceLedgerPath(36)).toBe('scripts/changelog/audit/036.json');
    expect(renderSourceFilteringSection(quietWeekLedger()).join('\n')).toContain(
      'scripts/changelog/audit/036.json',
    );
  });
});

describe('changelog v2 window and model defaults', () => {
  test('starts #036 at the exact #035 generation cutoff', () => {
    const window = resolveWindow({
      until: '2026-07-31T13:00:00.000Z',
      stateUntil: PREVIOUS_CHANGELOG_CUTOFF,
    });

    expect(window).toEqual({
      since: PREVIOUS_CHANGELOG_CUTOFF,
      until: '2026-07-31T13:00:00.000Z',
      source: 'state',
    });
    expect(isTimestampInWindow(PREVIOUS_CHANGELOG_CUTOFF, window)).toBe(false);
    expect(isTimestampInWindow('2026-07-24T13:35:35.622Z', window)).toBe(true);
    expect(isTimestampInWindow(window.until, window)).toBe(true);
    expect(isTimestampInWindow('2026-07-31T13:00:00.001Z', window)).toBe(false);
  });

  test('keeps live state aligned with the latest changelog', () => {
    const latestChangelogNumber = Math.max(
      ...readdirSync('content/docs/changelog')
        .map((filename) => filename.match(/^changelog-(\d+)\.mdx$/)?.[1])
        .filter((number): number is string => Boolean(number))
        .map(Number),
    );

    expect(changelogState.changelogNumber).toBe(latestChangelogNumber);
    expect(Number.isNaN(new Date(changelogState.until).getTime())).toBe(false);
    expect(changelogState.applicationReleaseSha).toMatch(/^[0-9a-f]{40}$/);
  });

  test('allows an explicit recovery window without changing the default cutoff source', () => {
    const window = resolveWindow({
      explicitSince: '2026-07-23T13:00:00Z',
      until: '2026-07-31T13:00:00Z',
      stateUntil: PREVIOUS_CHANGELOG_CUTOFF,
    });

    expect(window.source).toBe('manual');
    expect(window.since).toBe('2026-07-23T13:00:00.000Z');
  });

  test('rejects manual windows that would skip or regress the stored cursor', () => {
    expect(() =>
      resolveWindow({
        explicitSince: '2026-07-25T00:00:00Z',
        until: '2026-07-31T13:00:00Z',
        stateUntil: PREVIOUS_CHANGELOG_CUTOFF,
      }),
    ).toThrow('Explicit since cannot be later than state until');

    expect(() =>
      resolveWindow({
        until: '2026-07-24T12:00:00Z',
        stateUntil: PREVIOUS_CHANGELOG_CUTOFF,
      }),
    ).toThrow('Expected until > state until');
  });

  test('allows an isolated historical preview at the stored cutoff', () => {
    const window = resolvePreviewWindow({
      since: '2026-07-17T15:58:38.000Z',
      until: PREVIOUS_CHANGELOG_CUTOFF,
    });

    expect(window).toEqual({
      since: '2026-07-17T15:58:38.000Z',
      until: PREVIOUS_CHANGELOG_CUTOFF,
      source: 'preview',
    });
    expect(isTimestampInWindow(window.since, window)).toBe(false);
    expect(isTimestampInWindow(window.until, window)).toBe(true);
  });

  test('requires a complete, explicit preview window and rejects unknown arguments', () => {
    expect(
      parseArgs([
        '--preview',
        '--number',
        '35',
        '--since',
        '2026-07-17T15:58:38.000Z',
        '--until',
        PREVIOUS_CHANGELOG_CUTOFF,
        '--application-release-base-sha',
        'a'.repeat(40),
        '--application-release-head-sha',
        APPLICATION_RELEASE_SHA_AT_035,
      ]),
    ).toEqual({
      preview: true,
      number: 35,
      since: '2026-07-17T15:58:38.000Z',
      until: PREVIOUS_CHANGELOG_CUTOFF,
      applicationReleaseBaseSha: 'a'.repeat(40),
      applicationReleaseHeadSha: APPLICATION_RELEASE_SHA_AT_035,
    });
    expect(() => parseArgs(['--preview', '--number', '35'])).toThrow(
      'Preview mode requires --number, --since, --until, --application-release-base-sha, and --application-release-head-sha',
    );
    expect(() => parseArgs(['--preview', '--application-release-base-sha', 'short-sha'])).toThrow(
      'Invalid SHA',
    );
    expect(() => parseArgs(['--preveiw'])).toThrow('Unknown argument');
    expect(() => parseArgs(['--number', '35'])).toThrow('can only be used with --preview');
  });

  test('does not leak the replay target or later changelogs into prompt examples', () => {
    expect(selectRecentChangelogNumbers([30, 31, 32, 33, 34, 35, 36], 35)).toEqual([
      34, 33, 32, 31,
    ]);
  });

  test('extracts JSON text from a Responses API message', () => {
    expect(
      extractOpenAiResponseText({
        output: [
          { type: 'reasoning' },
          {
            type: 'message',
            content: [{ type: 'output_text', text: '{"introduction":"Ready"}' }],
          },
        ],
      }),
    ).toBe('{"introduction":"Ready"}');
  });

  test('uses the selected GPT-5.6 model at low reasoning', () => {
    expect(DEFAULT_OPENAI_MODEL).toBe('gpt-5.6-sol');
    expect(DEFAULT_OPENAI_REASONING_EFFORT).toBe('low');
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const BROWSER_FIX_SHA = '5880b48c1af107219ff3d904edbb8f6b76bea9b6';
const BROWSER_FIX_LIST_COMMIT = {
  sha: BROWSER_FIX_SHA,
  html_url: `https://github.com/steel-dev/steel-browser/commit/${BROWSER_FIX_SHA}`,
  author: { login: 'engineer' },
  commit: {
    message: 'fix(cdp): capture network requests from dedicated web workers',
    author: { name: 'Engineer', date: '2026-07-23T10:00:00.000Z' },
    committer: { date: '2026-07-23T10:00:00.000Z' },
  },
};

function submodulePointerHostCommit() {
  return commitFixture('application', {
    owner: '0xnenlabs',
    repo: 'steel',
    sha: '12d54db736181ac2bce0e553ea3d425da0ce786b',
    shortSha: '12d54db',
    subject: 'chore(apps): update steel-browser submodule',
    commitType: 'chore',
    changedFiles: [changedFile('apps/steel-browser', 'modified', BROWSER_SUBMODULE_PATCH)],
  });
}

describe('changelog v2 release evidence recovery', () => {
  test('skips submodule expansion when the released range is behind', async () => {
    const originalFetch = globalThis.fetch;
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (message: string) => warnings.push(message);
    globalThis.fetch = (async () =>
      jsonResponse({ status: 'behind', total_commits: 0, commits: [] })) as unknown as typeof fetch;

    try {
      const derived = await expandReleasedBrowserCommits([submodulePointerHostCommit()], 'token');

      expect(derived).toEqual([]);
      expect(warnings.join('\n')).toContain('Skipping submodule expansion');
    } finally {
      globalThis.fetch = originalFetch;
      console.warn = originalWarn;
    }
  });

  test('fails when the released browser range has diverged', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      jsonResponse({
        status: 'diverged',
        total_commits: 1,
        commits: [BROWSER_FIX_LIST_COMMIT],
      })) as unknown as typeof fetch;

    try {
      await expect(
        expandReleasedBrowserCommits([submodulePointerHostCommit()], 'token'),
      ).rejects.toThrow('received diverged');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('expands an ahead released range into enriched browser commits', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/compare/')) {
        return jsonResponse({
          status: 'ahead',
          total_commits: 1,
          commits: [BROWSER_FIX_LIST_COMMIT],
        });
      }

      if (url.includes('/pulls')) {
        return jsonResponse([]);
      }

      return jsonResponse({
        ...BROWSER_FIX_LIST_COMMIT,
        parents: [{ sha: '42b785bd554b73c09f75164a8f1e7b3c9f9d435d' }],
        files: [changedFile('api/src/services/cdp/instrumentation/target-manager.ts')],
      });
    }) as unknown as typeof fetch;

    try {
      const hostCommit = submodulePointerHostCommit();
      const derived = await expandReleasedBrowserCommits([hostCommit], 'token');

      expect(derived).toHaveLength(1);
      expect(derived[0].sourceKind).toBe('browser');
      expect(derived[0].releasedVia?.sha).toBe(hostCommit.sha);
      expect(derived[0].changedFiles.map((file) => file.filename)).toEqual([
        'api/src/services/cdp/instrumentation/target-manager.ts',
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('fails loudly when the application release range is not ahead', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      jsonResponse({
        status: 'diverged',
        total_commits: 0,
        commits: [],
      })) as unknown as typeof fetch;

    try {
      await expect(
        fetchApplicationReleaseCommits(
          APPLICATION_RELEASE_SHA_AT_035,
          '2222222222222222222222222222222222222222',
          'token',
        ),
      ).rejects.toThrow('Expected an ahead range');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('paginates application release comparisons past 300 commits', async () => {
    const originalFetch = globalThis.fetch;
    const requestedPages: number[] = [];
    const commits = Array.from({ length: 301 }, (_, index) => {
      const sha = index.toString(16).padStart(40, '0');
      return {
        sha,
        html_url: `https://github.com/0xnenlabs/steel/commit/${sha}`,
        author: { login: 'engineer' },
        commit: {
          message: `chore: release commit ${index}`,
          author: { name: 'Engineer', date: '2026-07-24T15:00:00.000Z' },
          committer: { date: '2026-07-24T15:00:00.000Z' },
        },
      };
    });
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const page = Number(url.searchParams.get('page'));
      requestedPages.push(page);
      const offset = (page - 1) * 100;

      return jsonResponse({
        status: 'ahead',
        total_commits: commits.length,
        commits: commits.slice(offset, offset + 100),
      });
    }) as unknown as typeof fetch;

    try {
      const collected = await fetchApplicationReleaseCommits(
        APPLICATION_RELEASE_SHA_AT_035,
        'f'.repeat(40),
        'token',
      );

      expect(collected).toHaveLength(301);
      expect(requestedPages).toEqual([1, 2, 3, 4]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('bounds the application release head when an explicit until is provided', async () => {
    const originalFetch = globalThis.fetch;
    const requestedUrls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('/branches/')) {
        return jsonResponse({ commit: { sha: 'b'.repeat(40) } });
      }

      return jsonResponse([{ sha: 'a'.repeat(40) }]);
    }) as unknown as typeof fetch;

    try {
      const boundedHead = await fetchApplicationReleaseHead(PREVIOUS_CHANGELOG_CUTOFF, 'token');
      const currentHead = await fetchApplicationReleaseHead(undefined, 'token');

      expect(boundedHead).toBe('a'.repeat(40));
      expect(requestedUrls[0]).toContain(`until=${encodeURIComponent(PREVIOUS_CHANGELOG_CUTOFF)}`);
      expect(currentHead).toBe('b'.repeat(40));
      expect(requestedUrls[1]).toContain('/branches/release');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('preview workspace records the evidence ledger for local audit', async () => {
    const groups = groupCommitsByPullRequest(QUIET_WEEK_COMMITS);
    const { eligible, excluded } = filterEligibleChangeGroups(groups);
    const windowSelection = resolvePreviewWindow({
      since: '2026-07-17T15:58:38.000Z',
      until: PREVIOUS_CHANGELOG_CUTOFF,
    });
    const workspace = await createPreviewWorkspace({
      number: 35,
      windowSelection,
      applicationReleaseBaseSha: 'a'.repeat(40),
      applicationReleaseHeadSha: 'b'.repeat(40),
      eligibleGroups: [],
      ledger: buildEvidenceLedger({
        changelogNumber: 35,
        windowSelection,
        commitsCollected: QUIET_WEEK_COMMITS.length,
        authorSkipped: [],
        logicalChanges: groups.length,
        eligibleGroups: eligible,
        excludedGroups: excluded,
        discardedItems: [],
      }),
    });

    try {
      const raw = await fs.readFile(path.join(workspace.directory, 'ledger.json'), 'utf8');
      const parsed = JSON.parse(raw) as {
        exclusions: Array<{ reason: string; key: string }>;
      };

      expect(parsed.exclusions).toHaveLength(excluded.length);
      expect(parsed.exclusions.every((item) => item.reason && item.key)).toBe(true);
    } finally {
      await fs.rm(workspace.directory, { recursive: true, force: true });
    }
  });

  test('writes the ledger under the audit directory for a production run', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'steel-changelog-audit-'));

    try {
      const written = await writeEvidenceLedger(root, quietWeekLedger(36));
      const parsed = JSON.parse(await fs.readFile(path.join(root, written), 'utf8')) as {
        changelogNumber: number;
      };

      expect(written).toBe('scripts/changelog/audit/036.json');
      expect(parsed.changelogNumber).toBe(36);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  test('preview CLI writes the ledger before returning for a quiet week', async () => {
    const originalFetch = globalThis.fetch;
    const originalLog = console.log;
    const originalGithubToken = process.env.CHANGELOG_GITHUB_TOKEN;
    const originalOpenAiToken = process.env.OPENAI_API_KEY;
    const logs: string[] = [];
    const commitSha = 'c'.repeat(40);
    const botSha = 'f'.repeat(40);
    const listCommit = {
      sha: commitSha,
      html_url: `https://github.com/0xnenlabs/steel/commit/${commitSha}`,
      author: { login: 'engineer' },
      commit: {
        message: 'chore: update dependencies',
        author: { name: 'Engineer', date: '2026-07-24T16:32:50.500Z' },
        committer: { date: '2026-07-24T16:32:50.500Z' },
      },
    };
    // Author-skipped commits are dropped before grouping, so only the ledger can account for them.
    const botCommit = {
      sha: botSha,
      html_url: `https://github.com/0xnenlabs/steel/commit/${botSha}`,
      author: { login: 'github-actions[bot]' },
      commit: {
        message: 'chore: sync generated clients',
        author: { name: 'github-actions[bot]', date: '2026-07-24T16:32:50.600Z' },
        committer: { date: '2026-07-24T16:32:50.600Z' },
      },
    };
    let workspaceDirectory: string | undefined;

    process.env.CHANGELOG_GITHUB_TOKEN = 'test-token';
    delete process.env.OPENAI_API_KEY;
    console.log = (message?: unknown) => logs.push(String(message));
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.pathname.includes('/repos/0xnenlabs/steel/compare/')) {
        return jsonResponse({
          status: 'ahead',
          total_commits: 2,
          commits: [listCommit, botCommit],
        });
      }

      if (url.pathname === `/repos/0xnenlabs/steel/commits/${commitSha}/pulls`) {
        return jsonResponse([]);
      }

      if (url.pathname === `/repos/0xnenlabs/steel/commits/${commitSha}`) {
        return jsonResponse({
          ...listCommit,
          parents: [{ sha: 'd'.repeat(40) }],
          files: [changedFile('package.json'), changedFile('bun.lock')],
        });
      }

      if (url.pathname.endsWith('/commits')) {
        return jsonResponse([]);
      }

      throw new Error(`Unexpected request: ${url.toString()}`);
    }) as unknown as typeof fetch;

    try {
      await main([
        '--preview',
        '--number',
        '36',
        '--since',
        '2026-07-24T16:32:50.000Z',
        '--until',
        '2026-07-24T16:32:51.000Z',
        '--application-release-base-sha',
        'a'.repeat(40),
        '--application-release-head-sha',
        'b'.repeat(40),
      ]);

      const workspaceLog = logs.find((line) =>
        line.startsWith('Prepared isolated preview evidence at '),
      );
      expect(workspaceLog).toBeDefined();
      workspaceDirectory = workspaceLog?.replace('Prepared isolated preview evidence at ', '');

      const ledger = JSON.parse(
        await fs.readFile(path.join(workspaceDirectory as string, 'ledger.json'), 'utf8'),
      ) as {
        exclusions: Array<{ reason: string; redacted: boolean }>;
        authorSkipped: Array<{ repo: string; sha: string; url: string; author: string }>;
        reconciliation: {
          commitsCollected: number;
          authorSkippedCommits: number;
          unaccounted: number;
        };
      };
      const sourceFacts = JSON.parse(
        await fs.readFile(path.join(workspaceDirectory as string, 'source-facts.json'), 'utf8'),
      ) as unknown[];

      expect(ledger.exclusions.map((item) => item.reason)).toEqual(['routine_maintenance']);
      expect(ledger.exclusions[0].redacted).toBe(true);
      expect(ledger.reconciliation).toMatchObject({
        commitsCollected: 1,
        authorSkippedCommits: 1,
        unaccounted: 0,
      });
      expect(ledger.authorSkipped).toEqual([
        {
          repo: '0xnenlabs/steel',
          sha: botSha,
          url: `https://github.com/0xnenlabs/steel/commit/${botSha}`,
          author: 'github-actions[bot]',
        },
      ]);
      expect(sourceFacts).toEqual([]);
      expect(logs).toContain(
        'The source window contains no public changelog facts. Treating it as a quiet week.',
      );
    } finally {
      globalThis.fetch = originalFetch;
      console.log = originalLog;
      if (originalGithubToken === undefined) {
        delete process.env.CHANGELOG_GITHUB_TOKEN;
      } else {
        process.env.CHANGELOG_GITHUB_TOKEN = originalGithubToken;
      }
      if (originalOpenAiToken === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalOpenAiToken;
      }
      if (workspaceDirectory) {
        await fs.rm(workspaceDirectory, { recursive: true, force: true });
      }
    }
  });
});

/** Stands in for gpt-image-2: a gradient at the size that was asked for. */
async function fakeCoverBackground({ size }: { prompt: string; size: string }): Promise<Buffer> {
  const [width, height] = size.split('x').map(Number) as [number, number];
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      data[i] = Math.round((255 * x) / (width - 1));
      data[i + 1] = Math.round((255 * y) / (height - 1));
      data[i + 2] = 100;
    }
  }
  return sharp(data, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}

describe('changelog v2 cover', () => {
  const minimalDraft = {
    introduction: 'A quiet but productive week.',
    sections: [
      {
        heading: '⭐ New' as const,
        entries: [
          {
            kind: 'bullet' as const,
            title: null,
            text: 'Added a thing.',
            references: [{ label: 'steel abc1234', url: 'https://github.com/x/y/commit/abc1234' }],
          },
        ],
      },
    ],
    discardedItems: [],
    coverMotif: 'A lighthouse switching on over a small harbour at dusk.',
  };

  test('parses and trims the cover motif from model output', () => {
    const draft = parseDraftResult(
      JSON.stringify({
        introduction: 'Intro.',
        sections: [],
        discardedItems: [],
        coverMotif: '  A drawbridge lowering over a canal at dawn.  ',
      }),
    );

    expect(draft.coverMotif).toBe('A drawbridge lowering over a canal at dawn.');
  });

  test('treats a missing or blank cover motif as empty', () => {
    const missing = parseDraftResult(
      JSON.stringify({ introduction: 'Intro.', sections: [], discardedItems: [] }),
    );
    const blank = parseDraftResult(
      JSON.stringify({ introduction: 'Intro.', sections: [], discardedItems: [], coverMotif: ' ' }),
    );

    expect(missing.coverMotif).toBe('');
    expect(blank.coverMotif).toBe('');
  });

  test('builds the MDX with the generated cover when one exists', () => {
    const mdx = buildMdxDocument(36, minimalDraft, '2026-07-31', '/images/changelog/36.png');

    expect(mdx).toContain('image: "/images/changelog/36.png"');
    expect(mdx).toContain('src="/images/changelog/36.png"');
    expect(mdx).not.toContain(CHANGELOG_PLACEHOLDER_IMAGE.src);
  });

  test('falls back to the placeholder image without a cover', () => {
    const mdx = buildMdxDocument(36, minimalDraft, '2026-07-31');

    expect(mdx).toContain(`image: "${CHANGELOG_PLACEHOLDER_IMAGE.src}"`);
    expect(mdx).toContain(`src="${CHANGELOG_PLACEHOLDER_IMAGE.src}"`);
  });

  test('renders, quantizes and installs the cover under public/images/changelog', async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'changelog-cover-root-'));

    try {
      const result = await generateChangelogCover({
        number: 99,
        motif: minimalDraft.coverMotif,
        publishedAt: '2026-07-31',
        repoRoot,
        deps: { generate: fakeCoverBackground },
      });

      expect(result.src).toBe('/images/changelog/99.png');
      expect(result.publicPath).toBe('public/images/changelog/99.png');

      const bytes = await fs.readFile(path.join(repoRoot, result.publicPath));
      // PNG IHDR colour type 3 means the committed cover is palette (PNG-8) encoded.
      expect(bytes[25]).toBe(3);

      const { width, height } = await sharp(bytes).metadata();
      expect(width).toBe(1420);
      expect(height).toBe(800);

      // The working directory keeps the undithered original for palette retries.
      const workdirFiles = await fs.readdir(result.workdir);
      expect(workdirFiles).toContain('changelog-99-source.png');
      expect(workdirFiles).toContain('changelog-99.json');
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });
});

describe('changelog v2 cover motif hygiene', () => {
  test('collapses a multi-line motif onto one line', () => {
    const draft = parseDraftResult(
      JSON.stringify({
        introduction: 'Intro.',
        sections: [],
        discardedItems: [],
        coverMotif: 'A harbour at first light.\n\nFive boats  tied to one pier.',
      }),
    );

    // The motif is rendered as a single bullet in the public PR body, so an
    // embedded newline would break out of the list.
    expect(draft.coverMotif).toBe('A harbour at first light. Five boats tied to one pier.');
  });

  test('caps an overlong motif', () => {
    const draft = parseDraftResult(
      JSON.stringify({
        introduction: 'Intro.',
        sections: [],
        discardedItems: [],
        coverMotif: `A field of flowers. ${'very long '.repeat(200)}`,
      }),
    );

    expect(draft.coverMotif.length).toBeLessThanOrEqual(COVER_MOTIF_CHAR_LIMIT);
    expect(draft.coverMotif.startsWith('A field of flowers.')).toBe(true);
  });
});
