// ABOUTME: Tests for resolveMarkdownPath, which maps .md-suffixed docs URLs
// ABOUTME: to their canonical path so middleware can serve the markdown version.
import { describe, expect, test } from 'bun:test';
import { resolveMarkdownPath } from '../lib/markdown-negotiation';

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

  test('returns null when the stripped path is under an excluded prefix', () => {
    expect(resolveMarkdownPath('/llms.mdx/overview.md')).toBeNull();
    expect(resolveMarkdownPath('/api/search.md')).toBeNull();
  });

  test('returns null when the stripped path is a static asset', () => {
    expect(resolveMarkdownPath('/images/logo.png.md')).toBeNull();
  });
});
