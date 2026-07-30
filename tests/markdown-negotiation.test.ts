// ABOUTME: Tests Markdown content negotiation, path eligibility, and explicit
// ABOUTME: .md URL mapping for the docs middleware.
import { describe, expect, test } from 'bun:test';
import {
  isNegotiableDocsPath,
  resolveMarkdownPath,
  shouldServeMarkdown,
} from '../lib/markdown-negotiation';

describe('resolveMarkdownPath', () => {
  test('strips .md from a docs page path', () => {
    expect(resolveMarkdownPath('/overview/sessions-api/quickstart.md')).toBe(
      '/overview/sessions-api/quickstart',
    );
  });

  test('strips .md from a top-level section path', () => {
    expect(resolveMarkdownPath('/cookbook.md')).toBe('/cookbook');
  });

  test('returns null for paths without the .md suffix', () => {
    expect(resolveMarkdownPath('/overview/sessions-api/quickstart')).toBeNull();
    expect(resolveMarkdownPath('/')).toBeNull();
  });

  test('returns null for a bare /.md', () => {
    expect(resolveMarkdownPath('/.md')).toBeNull();
  });

  test('returns null when the stripped path is an excluded exact path', () => {
    expect(resolveMarkdownPath('/llms-full.txt.md')).toBeNull();
    expect(resolveMarkdownPath('/llms.txt.md')).toBeNull();
  });

  test('returns null for /AGENTS.md so its route handler owns the request', () => {
    expect(resolveMarkdownPath('/AGENTS.md')).toBeNull();
  });

  test('returns null for /overview.md while the React landing page has no Markdown source', () => {
    expect(resolveMarkdownPath('/overview.md')).toBeNull();
  });

  test('returns null when the stripped path is under an excluded prefix', () => {
    expect(resolveMarkdownPath('/llms.mdx/overview.md')).toBeNull();
    expect(resolveMarkdownPath('/api/search.md')).toBeNull();
    expect(resolveMarkdownPath('/.well-known/agent-skills/steel-browser.tar.gz.md')).toBeNull();
  });

  test('returns null when the stripped path is a static asset', () => {
    expect(resolveMarkdownPath('/images/logo.png.md')).toBeNull();
  });
});

describe('isNegotiableDocsPath', () => {
  test('keeps the React overview landing page HTML-only', () => {
    expect(isNegotiableDocsPath('/overview')).toBe(false);
    expect(isNegotiableDocsPath('/overview/')).toBe(false);
  });

  test('excludes Agent Skills discovery artifacts from markdown rewrites', () => {
    expect(isNegotiableDocsPath('/.well-known/agent-skills/index.json')).toBe(false);
    expect(isNegotiableDocsPath('/.well-known/agent-skills/steel-browser.tar.gz')).toBe(false);
  });

  test('excludes the entire /.well-known namespace, including future artifacts', () => {
    expect(isNegotiableDocsPath('/.well-known/api-catalog')).toBe(false);
    expect(isNegotiableDocsPath('/.well-known/llms.txt')).toBe(false);
    expect(isNegotiableDocsPath('/.well-known/agents')).toBe(false);
    expect(isNegotiableDocsPath('/.well-known/security.txt')).toBe(false);
    expect(isNegotiableDocsPath('/.well-known/mcp.json')).toBe(false);
  });

  test('excludes archive assets wherever they live', () => {
    expect(isNegotiableDocsPath('/downloads/starter.tar.gz')).toBe(false);
    expect(isNegotiableDocsPath('/downloads/starter.tgz')).toBe(false);
    expect(isNegotiableDocsPath('/downloads/starter.tar')).toBe(false);
    expect(isNegotiableDocsPath('/downloads/starter.zip')).toBe(false);
  });
});

describe('shouldServeMarkdown', () => {
  test.each([
    'anthropic-ai',
    'ClaudeBot/1.0',
    'Claude-SearchBot/1.0',
    'Mozilla/5.0 AppleWebKit/537.36; compatible; GPTBot/1.4; +https://openai.com/gptbot',
    'Mozilla/5.0 AppleWebKit/537.36; compatible; OAI-AdsBot/1.0; +https://openai.com/adsbot',
    'Mozilla/5.0 AppleWebKit/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot',
    'Mozilla/5.0 AppleWebKit/537.36; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot',
  ])('defaults the %s crawler to canonical HTML', (userAgent) => {
    const headers = new Headers({ accept: 'text/html', 'user-agent': userAgent });
    expect(shouldServeMarkdown(headers)).toBe(false);
  });

  test.each(['ChatGPT-User/1.0', 'Claude-User/1.0', 'Perplexity-User/1.0', 'claude-code/1.0'])(
    'serves Markdown to the user-directed client %s',
    (userAgent) => {
      const headers = new Headers({ accept: 'text/html', 'user-agent': userAgent });
      expect(shouldServeMarkdown(headers)).toBe(true);
    },
  );

  test('honors an explicit Markdown Accept header from any client', () => {
    const headers = new Headers({
      accept: 'text/markdown',
      'user-agent': 'OAI-SearchBot/1.0',
    });
    expect(shouldServeMarkdown(headers)).toBe(true);
  });

  test('ignores a zero-quality Markdown Accept value for a crawler', () => {
    const headers = new Headers({
      accept: 'text/markdown;q=0, text/html',
      'user-agent': 'OAI-SearchBot/1.4',
    });
    expect(shouldServeMarkdown(headers)).toBe(false);
  });
});
