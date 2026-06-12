// ABOUTME: Tests for stripFaqFences, which removes :::faq fences from raw MDX
// ABOUTME: before it is served to LLM crawlers via getLLMText.

import { describe, expect, test } from 'bun:test';
import { stripFaqFences } from '../lib/strip-faq-fences';

describe('stripFaqFences', () => {
  test('removes faq fences but keeps questions and answers', () => {
    const input = '## FAQ\n\n:::faq\n### A question?\n\nAn answer.\n:::\n\nAfter.';
    expect(stripFaqFences(input)).toBe('## FAQ\n\n### A question?\n\nAn answer.\n\nAfter.');
  });

  test('leaves other directives untouched', () => {
    const input = ':::callout\ntype: tip\nBe careful.\n:::\n';
    expect(stripFaqFences(input)).toBe(input);
  });

  test('keeps a directive nested inside a faq block intact', () => {
    const input = ':::faq\n### Q?\n\n:::callout\ntype: info\nNote.\n:::\n\nMore answer.\n:::\n';
    expect(stripFaqFences(input)).toBe(
      '### Q?\n\n:::callout\ntype: info\nNote.\n:::\n\nMore answer.\n',
    );
  });

  test('passes through content with no faq blocks unchanged', () => {
    const input = '# Title\n\nJust prose with ::: in a sentence? No.';
    expect(stripFaqFences(input)).toBe(input);
  });
});
