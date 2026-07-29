// ABOUTME: Guards the LLM-visibility contract for generated cookbook hub pages:
// ABOUTME: author pages are excluded from agent surfaces, topic pages are kept.

import { describe, expect, test } from 'bun:test';
import { Glob } from 'bun';
import matter from 'gray-matter';

async function frontmatter(file: string): Promise<Record<string, unknown>> {
  return matter(await Bun.file(file).text()).data;
}

const authors = [
  ...new Glob('*.mdx').scanSync({ cwd: 'content/docs/cookbook/authors', absolute: true }),
];
const topics = [
  ...new Glob('*.mdx').scanSync({ cwd: 'content/docs/cookbook/topics', absolute: true }),
];

describe('cookbook hub LLM visibility', () => {
  test('every author page is excluded from LLM surfaces', async () => {
    expect(authors.length).toBeGreaterThan(0);
    for (const file of authors) {
      expect((await frontmatter(file)).llm).toBe(false);
    }
  });

  test('topic pages remain visible to LLMs', async () => {
    expect(topics.length).toBeGreaterThan(0);
    for (const file of topics) {
      expect((await frontmatter(file)).llm).not.toBe(false);
    }
  });
});
