import type { ChangelogSourceKind } from '../../scripts/changelog/config';
import type {
  ChangedFile,
  CommitCandidate,
  PullRequestContext,
} from '../../scripts/changelog/source';

export const PREVIOUS_CHANGELOG_CUTOFF = '2026-07-24T13:35:35.621Z';
export const APPLICATION_RELEASE_SHA_AT_035 = '4cc44305bae19df7135edda12a602841ad90ffe7';

export const BROWSER_SUBMODULE_PATCH = [
  '@@ -1 +1 @@',
  '-Subproject commit 42b785bd554b73c09f75164a8f1e7b3c9f9d435d',
  '+Subproject commit 5880b48c1af107219ff3d904edbb8f6b76bea9b6',
].join('\n');

export function changedFile(filename: string, status = 'modified', patch?: string): ChangedFile {
  return {
    filename,
    status,
    additions: status === 'added' ? 10 : 1,
    deletions: status === 'removed' ? 10 : 1,
    changes: status === 'modified' ? 2 : 10,
    patch,
  };
}

export function commitFixture(
  sourceKind: ChangelogSourceKind,
  overrides: Partial<CommitCandidate> = {},
): CommitCandidate {
  const sha = overrides.sha || `${sourceKind.padEnd(40, '0').slice(0, 40)}`;

  return {
    owner: 'steel-dev',
    repo: sourceKind,
    branch: 'main',
    sourceKind,
    sha,
    shortSha: sha.slice(0, 7),
    url: `https://github.com/steel-dev/${sourceKind}/commit/${sha}`,
    author: 'engineer',
    committedAt: '2026-07-24T15:00:00.000Z',
    subject: 'fix: improve user-facing behavior',
    body: '',
    commitType: 'fix',
    parents: [],
    changedFiles: [changedFile('src/index.ts')],
    pullRequest: null,
    releasedVia: null,
    ...overrides,
  };
}

const leaderboardPullRequest: PullRequestContext = {
  number: 46,
  url: 'https://github.com/steel-dev/leaderboard/pull/46',
  title: 'Add OSWorld 2.0 benchmark',
  body: 'Adds OSWorld 2.0 for long-horizon computer use.',
};

export const LEADERBOARD_PR_46_COMMITS: CommitCandidate[] = [
  commitFixture('leaderboard', {
    repo: 'leaderboard',
    sha: '80d1a9cedb3166e66d965dd4f62b51de2911bb2d',
    shortSha: '80d1a9c',
    subject: 'Merge pull request #46 from steel-dev/niko/osworld-v2',
    commitType: null,
    pullRequest: leaderboardPullRequest,
    changedFiles: [changedFile('src/data/osworld2.json', 'added')],
  }),
  commitFixture('leaderboard', {
    repo: 'leaderboard',
    sha: '923c78a1dfd33a3d27d29fb38e1e1aa2fc429dcd',
    shortSha: '923c78a',
    subject: 'feat(leaderboard): add OSWorld 2.0 benchmark for long-horizon computer use',
    commitType: 'feat',
    pullRequest: leaderboardPullRequest,
    changedFiles: [
      changedFile('src/data/osworld2.json', 'added'),
      changedFile('src/data/index.ts'),
    ],
  }),
  commitFixture('leaderboard', {
    repo: 'leaderboard',
    sha: 'f364739195de3347615f315876e1c0e7cbba35a3',
    shortSha: 'f364739',
    subject: 'feat(leaderboard): move GPT-5.6 Sol to OSWorld 2.0',
    commitType: 'feat',
    pullRequest: leaderboardPullRequest,
    changedFiles: [changedFile('src/data/osworld.json')],
  }),
];

export const POLICY_FIXTURES: Array<{
  label: string;
  commit: CommitCandidate;
  eligible: boolean;
  reason: string;
}> = [
  {
    label: 'application feature',
    commit: commitFixture('application', {
      owner: '0xnenlabs',
      repo: 'steel',
      changedFiles: [changedFile('apps/api/src/modules/sessions/sessions.service.ts')],
    }),
    eligible: true,
    reason: 'eligible',
  },
  {
    label: 'mixed application feature and dependency update',
    commit: commitFixture('application', {
      owner: '0xnenlabs',
      repo: 'steel',
      subject: 'feat(api): add session control and update dependencies',
      changedFiles: [
        changedFile('apps/api/src/modules/sessions/sessions.service.ts'),
        changedFile('package.json'),
        changedFile('bun.lock'),
      ],
    }),
    eligible: true,
    reason: 'eligible',
  },
  {
    label: 'dependency-only maintenance',
    commit: commitFixture('application', {
      owner: '0xnenlabs',
      repo: 'steel',
      subject: 'chore: update dependencies',
      commitType: 'chore',
      changedFiles: [changedFile('package.json'), changedFile('bun.lock')],
    }),
    eligible: false,
    reason: 'routine_maintenance',
  },
  {
    label: 'internal application plumbing',
    commit: commitFixture('application', {
      owner: '0xnenlabs',
      repo: 'steel',
      subject: 'fix(api): improve session reliability',
      body: 'Handles ambiguous JetStream publish timeouts inside PuppetMaster.',
      changedFiles: [
        changedFile('apps/api/src/external/puppet-master/puppet-master-routing.test.ts'),
        changedFile('apps/api/src/external/puppet-master/puppet-master.ts'),
      ],
    }),
    eligible: false,
    reason: 'internal_only',
  },
  {
    label: 'released browser fix',
    commit: commitFixture('browser', {
      repo: 'steel-browser',
      sha: '5880b48c1af107219ff3d904edbb8f6b76bea9b6',
      shortSha: '5880b48',
      subject: 'fix(cdp): capture network requests from dedicated web workers',
      changedFiles: [changedFile('api/src/services/cdp/instrumentation/target-manager.ts')],
      releasedVia: {
        owner: '0xnenlabs',
        repo: 'steel',
        sha: '12d54db736181ac2bce0e553ea3d425da0ce786b',
        url: 'https://github.com/0xnenlabs/steel/commit/12d54db736181ac2bce0e553ea3d425da0ce786b',
        path: 'apps/steel-browser',
      },
    }),
    eligible: true,
    reason: 'eligible',
  },
  {
    label: 'released browser chore',
    commit: commitFixture('browser', {
      repo: 'steel-browser',
      sha: 'c0f226b8e3b16d0bc2c76a222863d4db6f1aa8f2',
      shortSha: 'c0f226b',
      subject: "chore: avoid modifying request headers, as it's no longer useful",
      commitType: 'chore',
      changedFiles: [
        changedFile('api/src/services/cdp/instrumentation/browser-interaction-script.ts'),
      ],
    }),
    eligible: false,
    reason: 'routine_maintenance',
  },
  {
    label: 'internal infrastructure',
    commit: commitFixture('infra', {
      repo: 'infra',
      changedFiles: [changedFile('nomad/steel.hcl')],
    }),
    eligible: false,
    reason: 'disabled_source',
  },
  {
    label: 'ecosystem listing',
    commit: commitFixture('ecosystem', {
      repo: 'awesome-web-agents',
      changedFiles: [changedFile('README.md')],
    }),
    eligible: false,
    reason: 'ecosystem_listing',
  },
  {
    label: 'generated changelog',
    commit: commitFixture('docs', {
      repo: 'docs',
      subject: 'docs: publish changelog #035',
      changedFiles: [changedFile('content/docs/changelog/changelog-035.mdx', 'added')],
    }),
    eligible: false,
    reason: 'self_generated',
  },
  {
    label: 'SEO docs work',
    commit: commitFixture('docs', {
      repo: 'docs',
      subject: 'docs(seo): cross-link topic hubs',
      changedFiles: [changedFile('content/docs/guides/browser.mdx')],
    }),
    eligible: false,
    reason: 'non_material_docs',
  },
  {
    label: 'new reader-facing guide',
    commit: commitFixture('docs', {
      repo: 'docs',
      subject: 'docs: add guide for file downloads',
      changedFiles: [changedFile('content/docs/guides/file-downloads.mdx', 'added')],
    }),
    eligible: true,
    reason: 'eligible',
  },
  {
    label: 'new cookbook recipe',
    commit: commitFixture('cookbook', {
      repo: 'steel-cookbook',
      subject: 'feat: add Stripe Projects web agent recipe',
      changedFiles: [
        changedFile('examples/stripe-projects-web-agent/README.md', 'added'),
        changedFile('registry.yaml'),
      ],
    }),
    eligible: true,
    reason: 'eligible',
  },
  {
    label: 'new leaderboard benchmark',
    commit: LEADERBOARD_PR_46_COMMITS[1],
    eligible: true,
    reason: 'eligible',
  },
  {
    label: 'leaderboard rank refresh',
    commit: commitFixture('leaderboard', {
      repo: 'leaderboard',
      subject: 'feat(leaderboard): refresh model scores and ranks',
      changedFiles: [changedFile('src/data/browsecomp.json')],
    }),
    eligible: false,
    reason: 'benchmark_maintenance',
  },
  {
    label: 'CLI feature',
    commit: commitFixture('cli', {
      repo: 'cli',
      subject: 'feat: add session inspect command',
      commitType: 'feat',
      changedFiles: [changedFile('src/commands/session-inspect.ts', 'added')],
    }),
    eligible: true,
    reason: 'eligible',
  },
  {
    label: 'browser pointer only',
    commit: commitFixture('application', {
      owner: '0xnenlabs',
      repo: 'steel',
      subject: 'chore(apps): update steel-browser submodule',
      commitType: 'chore',
      changedFiles: [changedFile('apps/steel-browser', 'modified', BROWSER_SUBMODULE_PATCH)],
    }),
    eligible: false,
    reason: 'submodule_pointer_only',
  },
];

export const QUIET_WEEK_COMMITS: CommitCandidate[] = [
  ...POLICY_FIXTURES.filter((fixture) => !fixture.eligible).map((fixture) => fixture.commit),
];
