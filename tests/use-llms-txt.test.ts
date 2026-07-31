// ABOUTME: Tests the public markdown share URL built for the LLM share UI:
// ABOUTME: page path + .md suffix, with the docs root pointing at /llms.txt.
import { describe, expect, test } from 'bun:test';
import { getPublicMarkdownUrl } from '../hooks/use-llms-txt';

const ORIGIN = 'https://docs.steel.dev';

describe('getPublicMarkdownUrl', () => {
  test('appends .md to the page path', () => {
    expect(getPublicMarkdownUrl('/overview/sessions-api/quickstart', ORIGIN)).toBe(
      'https://docs.steel.dev/overview/sessions-api/quickstart.md',
    );
  });

  test('never exposes the internal /llms.mdx rewrite target', () => {
    expect(getPublicMarkdownUrl('/overview/intro', ORIGIN)).not.toContain('/llms.mdx');
  });

  test('strips a legacy /docs prefix before appending .md', () => {
    expect(getPublicMarkdownUrl('/docs/overview/intro', ORIGIN)).toBe(
      'https://docs.steel.dev/overview/intro.md',
    );
  });

  test('points the docs root at the llms.txt index', () => {
    expect(getPublicMarkdownUrl('/', ORIGIN)).toBe('https://docs.steel.dev/llms.txt');
  });

  test('returns an empty string without a pathname', () => {
    expect(getPublicMarkdownUrl(null, ORIGIN)).toBe('');
  });
});
