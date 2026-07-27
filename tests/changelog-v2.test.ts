import { describe, expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  CHANGELOG_REPOSITORIES,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENAI_REASONING_EFFORT,
} from '../scripts/changelog/config';
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
  createPreviewWorkspace,
  expandReleasedBrowserCommits,
  extractOpenAiResponseText,
  fetchApplicationReleaseCommits,
  fetchApplicationReleaseHead,
  parseArgs,
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
      ]),
    ).toEqual({
      preview: true,
      number: 35,
      since: '2026-07-17T15:58:38.000Z',
      until: PREVIOUS_CHANGELOG_CUTOFF,
    });
    expect(() => parseArgs(['--preview', '--number', '35'])).toThrow(
      'Preview mode requires --number, --since, and --until',
    );
    expect(() => parseArgs(['--preveiw'])).toThrow('Unknown argument');
    expect(() => parseArgs(['--number', '35'])).toThrow('--number can only be used with --preview');
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
  test('skips submodule expansion when the released range is not ahead', async () => {
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

  test('preview workspace records excluded groups for local audit', async () => {
    const { excluded } = filterEligibleChangeGroups(groupCommitsByPullRequest(QUIET_WEEK_COMMITS));
    const workspace = await createPreviewWorkspace({
      number: 35,
      windowSelection: resolvePreviewWindow({
        since: '2026-07-17T15:58:38.000Z',
        until: PREVIOUS_CHANGELOG_CUTOFF,
      }),
      applicationReleaseBaseSha: 'a'.repeat(40),
      applicationReleaseHeadSha: 'b'.repeat(40),
      eligibleGroups: [],
      excludedGroups: excluded,
    });

    try {
      const raw = await fs.readFile(path.join(workspace.directory, 'excluded-groups.json'), 'utf8');
      const parsed = JSON.parse(raw) as Array<{ reason: string; key: string }>;

      expect(parsed).toHaveLength(excluded.length);
      expect(parsed.every((item) => item.reason && item.key)).toBe(true);
    } finally {
      await fs.rm(workspace.directory, { recursive: true, force: true });
    }
  });
});
