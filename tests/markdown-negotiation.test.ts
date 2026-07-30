// ABOUTME: Tests for resolveMarkdownPath, which maps .md-suffixed docs URLs
// ABOUTME: to their canonical path so middleware can serve the markdown version.
import { describe, expect, test } from 'bun:test';
import { isNegotiableDocsPath, resolveMarkdownPath } from '../lib/markdown-negotiation';

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
