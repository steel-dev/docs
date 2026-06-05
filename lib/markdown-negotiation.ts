const MARKDOWN_ACCEPT_TYPES = new Set([
  'application/markdown',
  'text/markdown',
  'text/x-markdown',
  'text/vnd.daringfireball.markdown',
]);

export const EXACT_MARKDOWN_USER_AGENTS = [
  'anthropic-ai',
  'chatgpt-user',
  'claudebot',
  'gptbot',
  'oai-searchbot',
  'perplexitybot',
];

export const MARKDOWN_USER_AGENT_SUBSTRINGS = [
  'anthropic',
  'chatgpt',
  'claude',
  'copilot',
  'cursor',
  'gemini',
  'gptbot',
  'mistral',
  'oai-searchbot',
  'openai',
  'perplexity',
];

const MARKDOWN_VARY_HEADERS = ['Accept', 'User-Agent'];

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
