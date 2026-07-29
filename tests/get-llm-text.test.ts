// ABOUTME: Tests for getLLMText, which renders a page as LLM-facing markdown
// ABOUTME: with an absolute URL and an optional llms.txt index pointer.
import { describe, expect, test } from 'bun:test';
import { getLLMText, LLMS_INDEX_POINTER } from '../lib/get-llm-text';

// Minimal stand-in for a fumadocs page; typed any since building a real
// InferPageType requires the full fumadocs loader.
function fakePage(overrides: Record<string, unknown> = {}): any {
  return {
    url: '/overview/steel-cli',
    data: {
      title: 'Steel CLI',
      content: 'Run browser automation from the terminal.',
      ...overrides,
    },
  };
}

describe('getLLMText', () => {
  test('renders the title and an absolute URL', async () => {
    const text = await getLLMText(fakePage());
    expect(text).toStartWith('# Steel CLI\n');
    expect(text).toContain('URL: https://docs.steel.dev/overview/steel-cli');
  });

  test('omits the index pointer by default', async () => {
    const text = await getLLMText(fakePage());
    expect(text).not.toContain('Full docs index');
  });

  test('prepends the index pointer exactly once when requested', async () => {
    const text = await getLLMText(fakePage(), { indexPointer: true });
    expect(text).toStartWith(`${LLMS_INDEX_POINTER}\n\n# Steel CLI\n`);
    expect(text.split('Full docs index').length).toBe(2);
  });

  test('the pointer is a blockquote linking to llms.txt', () => {
    expect(LLMS_INDEX_POINTER).toBe('> Full docs index: https://docs.steel.dev/llms.txt');
  });
});
