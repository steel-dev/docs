// ABOUTME: Tests for getLLMText, which renders a page as LLM-facing markdown
// ABOUTME: with an absolute URL and an optional llms.txt index pointer.
import { describe, expect, test } from 'bun:test';
import { getLLMText, LLMS_INDEX_POINTER, shouldIncludeLLMPage } from '../lib/get-llm-text';

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

describe('shouldIncludeLLMPage', () => {
  test('includes pages by default', () => {
    expect(shouldIncludeLLMPage(fakePage())).toBe(true);
  });

  test('excludes pages with llm: false in page data', () => {
    expect(shouldIncludeLLMPage(fakePage({ llm: false }))).toBe(false);
  });

  test('excludes pages with llm: false in raw frontmatter', () => {
    const content = ['---', 'title: Hidden', 'llm: false', '---', '', 'Body.'].join('\n');
    expect(shouldIncludeLLMPage(fakePage({ content }))).toBe(false);
  });

  test('keeps pages whose frontmatter sets llm: true', () => {
    const content = ['---', 'title: Visible', 'llm: true', '---', '', 'Body.'].join('\n');
    expect(shouldIncludeLLMPage(fakePage({ content }))).toBe(true);
  });
});

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

  test('strips frontmatter and MDX artifacts from page content', async () => {
    const content = [
      '---',
      'title: Quickstart',
      'description: Get going.',
      '---',
      '',
      '<RecipeJsonLd slug="quickstart" />',
      '',
      ':::callout',
      'type: tip',
      'Mind the gap.',
      ':::',
      '',
      '```typescript Typescript -wcn -f main.ts',
      "import Steel from 'steel-sdk';",
      'const s = new Steel();',
      '```',
      '',
      '<Tabs items={["TypeScript"]} groupId="lang">',
      '<Tab id="typescript" className="cookbook-concept-tab">',
      'Drive the browser.',
      '</Tab>',
      '</Tabs>',
    ].join('\n');
    const text = await getLLMText(fakePage({ content }), { indexPointer: true });
    const body = text.split('\n\n').slice(1).join('\n\n');

    expect(body).not.toContain('title: Quickstart');
    expect(body).not.toContain('RecipeJsonLd');
    expect(body).not.toContain(':::');
    expect(body).not.toContain('type: tip');
    expect(body).not.toContain('<Tab');
    expect(body).toContain('Mind the gap.');
    expect(body).toContain('```typescript\nimport Steel');
    expect(body).toContain('const s = new Steel();');
    expect(body).not.toContain('-wcn');
    expect(body).toContain('**TypeScript**');
    expect(body).toContain('Drive the browser.');
  });
});
