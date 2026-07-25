export type ChangelogSourceKind =
  | 'application'
  | 'browser'
  | 'infra'
  | 'docs'
  | 'cookbook'
  | 'leaderboard'
  | 'ecosystem'
  | 'cli'
  | 'inactive';

export type ChangelogSourceMode = 'direct' | 'derived' | 'excluded';

export interface ChangelogRepository {
  owner: string;
  repo: string;
  branch: string;
  kind: ChangelogSourceKind;
  mode: ChangelogSourceMode;
}

export interface ChangelogSubmoduleSource {
  repository: ChangelogRepository;
  integrationRepository: ChangelogRepository;
  path: string;
}

export interface PromptContextFile {
  path: string;
  label: string;
}

export interface PlaceholderImageConfig {
  src: string;
  width: number;
  height: number;
}

export const CHANGELOG_APPLICATION_REPOSITORY: ChangelogRepository = {
  owner: '0xnenlabs',
  repo: 'steel',
  branch: 'release',
  kind: 'application',
  mode: 'direct',
};

export const CHANGELOG_BROWSER_REPOSITORY: ChangelogRepository = {
  owner: 'steel-dev',
  repo: 'steel-browser',
  branch: 'main',
  kind: 'browser',
  mode: 'derived',
};

export const CHANGELOG_REPOSITORIES: ChangelogRepository[] = [
  CHANGELOG_APPLICATION_REPOSITORY,
  CHANGELOG_BROWSER_REPOSITORY,
  {
    owner: 'steel-dev',
    repo: 'infra',
    branch: 'main',
    kind: 'infra',
    mode: 'excluded',
  },
  {
    owner: 'steel-dev',
    repo: 'surf.new',
    branch: 'main',
    kind: 'inactive',
    mode: 'excluded',
  },
  {
    owner: 'steel-dev',
    repo: 'steel-cookbook',
    branch: 'main',
    kind: 'cookbook',
    mode: 'direct',
  },
  {
    owner: 'steel-dev',
    repo: 'steel-mcp-server',
    branch: 'main',
    kind: 'inactive',
    mode: 'excluded',
  },
  {
    owner: 'steel-dev',
    repo: 'leaderboard',
    branch: 'main',
    kind: 'leaderboard',
    mode: 'direct',
  },
  {
    owner: 'steel-dev',
    repo: 'awesome-web-agents',
    branch: 'main',
    kind: 'ecosystem',
    mode: 'excluded',
  },
  {
    owner: 'steel-dev',
    repo: 'cli',
    branch: 'main',
    kind: 'cli',
    mode: 'direct',
  },
  {
    owner: 'steel-dev',
    repo: 'docs',
    branch: 'main',
    kind: 'docs',
    mode: 'direct',
  },
];

export const CHANGELOG_SUBMODULE_SOURCES: ChangelogSubmoduleSource[] = [
  {
    repository: CHANGELOG_BROWSER_REPOSITORY,
    integrationRepository: CHANGELOG_APPLICATION_REPOSITORY,
    path: 'apps/steel-browser',
  },
];

export const SKIP_AUTHORS = [
  'github-actions[bot]',
  'dependabot[bot]',
  'renovate[bot]',
  'argocd-image-updater',
];

export const CHANGELOG_PLACEHOLDER_IMAGE: PlaceholderImageConfig = {
  src: '/images/changelog-placeholder-white.jpeg',
  width: 800,
  height: 400,
};

export const CHANGELOG_PROMPT_FILE = 'scripts/changelog/prompt.md';

export const CHANGELOG_CONTEXT_FILES: PromptContextFile[] = [
  {
    path: 'content/docs/overview/intro-to-steel.mdx',
    label: 'Intro To Steel',
  },
  {
    path: 'content/docs/overview/sessions-api/overview.mdx',
    label: 'Sessions API Overview',
  },
  {
    path: 'content/docs/overview/sessions-api/quickstart.mdx',
    label: 'Sessions API Quickstart',
  },
];

export const RECENT_CHANGELOG_EXAMPLE_COUNT = 4;
export const PROMPT_CONTEXT_CHAR_LIMIT = 8_000;
export const PROMPT_CHANGELOG_CHAR_LIMIT = 6_000;
export const COMMIT_BODY_CHAR_LIMIT = 1_200;
export const PULL_REQUEST_BODY_CHAR_LIMIT = 2_000;
export const CHANGED_FILES_PROMPT_LIMIT = 40;
export const DEFAULT_OPENAI_MODEL = 'gpt-5.6-sol';
export const DEFAULT_OPENAI_REASONING_EFFORT = 'low';
export const CHANGELOG_TIMEZONE = 'America/Toronto';
