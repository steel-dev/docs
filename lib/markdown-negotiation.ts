const MARKDOWN_ACCEPT_TYPES = new Set([
  'application/markdown',
  'text/markdown',
  'text/x-markdown',
  'text/vnd.daringfireball.markdown',
]);

export const EXACT_MARKDOWN_USER_AGENTS = ['chatgpt-user', 'claude-user', 'perplexity-user'];

export const MARKDOWN_USER_AGENT_SUBSTRINGS = [
  'anthropic',
  'chatgpt',
  'claude',
  'copilot',
  'cursor',
  'gemini',
  'mistral',
  'openai',
  'perplexity',
];

const HTML_CRAWLER_USER_AGENT_SUBSTRINGS = [
  'anthropic-ai',
  'claudebot',
  'claude-searchbot',
  'gptbot',
  'oai-adsbot',
  'oai-searchbot',
  'perplexitybot',
];

const MARKDOWN_VARY_HEADERS = ['Accept', 'User-Agent'];

const EXCLUDED_EXACT_PATHS = new Set([
  '/AGENTS',
  '/AGENTS.md',
  '/favicon.ico',
  '/llms-full.txt',
  '/llms.txt',
  '/overview',
  '/overview/',
  '/overview/llms-full.txt',
  '/robots.txt',
  '/sitemap.xml',
]);

// Everything under the RFC 8615 /.well-known namespace is already
// machine-readable, so none of it should ever be content-negotiated.
const EXCLUDED_PATH_PREFIXES = ['/.well-known', '/_next', '/api', '/llms.mdx', '/og'];
const EXCLUDED_ASSET_EXTENSIONS = new Set([
  '.avif',
  '.css',
  '.gif',
  '.gz',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.map',
  '.otf',
  '.pdf',
  '.png',
  '.svg',
  '.tar',
  '.tgz',
  '.ttf',
  '.txt',
  '.webp',
  '.woff',
  '.woff2',
  '.xml',
  '.zip',
]);

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function hasExcludedAssetExtension(pathname: string): boolean {
  const extension = pathname.match(/\.[^./]+$/)?.[0]?.toLowerCase();
  return extension ? EXCLUDED_ASSET_EXTENSIONS.has(extension) : false;
}

export function isNegotiableDocsPath(pathname: string): boolean {
  if (EXCLUDED_EXACT_PATHS.has(pathname)) return false;
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => matchesPathPrefix(pathname, prefix))) return false;

  return !hasExcludedAssetExtension(pathname);
}

export function resolveMarkdownPath(pathname: string): string | null {
  if (!pathname.endsWith('.md')) return null;

  const stripped = pathname.slice(0, -'.md'.length);
  if (!stripped || stripped === '/') return null;

  return isNegotiableDocsPath(stripped) ? stripped : null;
}

function acceptsMarkdownType(mediaType: string): boolean {
  return MARKDOWN_ACCEPT_TYPES.has(mediaType) || mediaType.endsWith('+markdown');
}

function hasNonZeroQuality(params: string[]): boolean {
  const qualityParam = params.find((param) => param.toLowerCase().startsWith('q='));
  if (!qualityParam) return true;

  const quality = Number.parseFloat(qualityParam.slice(2));
  return Number.isNaN(quality) || quality > 0;
}

export function acceptsMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  return acceptHeader.split(',').some((entry) => {
    const [rawMediaType, ...rawParams] = entry.split(';').map((part) => part.trim());
    const mediaType = rawMediaType.toLowerCase();

    return acceptsMarkdownType(mediaType) && hasNonZeroQuality(rawParams);
  });
}

function normalizeUserAgent(userAgent: string): string {
  return userAgent.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isMarkdownUserAgent(userAgentHeader: string | null): boolean {
  if (!userAgentHeader) return false;

  const userAgent = normalizeUserAgent(userAgentHeader);

  // Canonical crawler requests need indexable HTML. Explicit Markdown Accept
  // headers are handled separately in shouldServeMarkdown and still take priority.
  if (HTML_CRAWLER_USER_AGENT_SUBSTRINGS.some((match) => userAgent.includes(match))) {
    return false;
  }

  return (
    EXACT_MARKDOWN_USER_AGENTS.includes(userAgent) ||
    MARKDOWN_USER_AGENT_SUBSTRINGS.some((match) => userAgent.includes(match))
  );
}

export function shouldServeMarkdown(headers: Headers): boolean {
  return acceptsMarkdown(headers.get('accept')) || isMarkdownUserAgent(headers.get('user-agent'));
}

export function appendMarkdownVaryHeader(headers: Headers) {
  const existingValues = new Set(
    (headers.get('Vary') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );

  for (const value of MARKDOWN_VARY_HEADERS) {
    existingValues.add(value);
  }

  headers.set('Vary', [...existingValues].join(', '));
}
