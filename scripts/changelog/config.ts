export interface ChangelogRepository {
  owner: string;
  repo: string;
  branch: string;
}

export interface PromptContextFile {
  path: string;
  label: string;
}

export interface PlaceholderImageConfig {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const CHANGELOG_REPOSITORIES: ChangelogRepository[] = [
  { owner: 'steel-dev', repo: 'steel-browser', branch: 'main' },
  { owner: '0xnenlabs', repo: 'steel', branch: 'release' },
  { owner: 'steel-dev', repo: 'infra', branch: 'main' },
  { owner: 'steel-dev', repo: 'surf.new', branch: 'main' },
  { owner: 'steel-dev', repo: 'steel-cookbook', branch: 'main' },
  { owner: 'steel-dev', repo: 'steel-mcp-server', branch: 'main' },
  { owner: 'steel-dev', repo: 'leaderboard', branch: 'main' },
  { owner: 'steel-dev', repo: 'awesome-web-agents', branch: 'main' },
  { owner: 'steel-dev', repo: 'cli', branch: 'main' },
  { owner: 'steel-dev', repo: 'docs', branch: 'main' },
];

export const SKIP_AUTHORS = [
  'github-actions[bot]',
  'dependabot[bot]',
  'renovate[bot]',
];

export const CHANGELOG_PLACEHOLDER_IMAGE: PlaceholderImageConfig = {
  src: '/images/changelog-placeholder-white.jpeg',
  alt: 'White placeholder image for changelog drafts',
  width: 400,
  height: 300,
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
export const DEFAULT_LOOKBACK_DAYS = 7;
export const PROMPT_CONTEXT_CHAR_LIMIT = 8_000;
export const PROMPT_CHANGELOG_CHAR_LIMIT = 6_000;
export const COMMIT_BODY_CHAR_LIMIT = 1_200;
export const DEFAULT_OPENAI_MODEL = 'gpt-5.4';
export const CHANGELOG_TIMEZONE = 'America/Toronto';
