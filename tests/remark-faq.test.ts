// ABOUTME: Tests for the :::faq directive transform in lib/remark-custom-directives.ts.
// ABOUTME: Verifies FAQ/FAQItem JSX output, FAQPage JSON-LD attribute, and failure on malformed input.

import { describe, expect, test } from 'bun:test';
import remarkDirective from 'remark-directive';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { remarkCustomDirectives } from '../lib/remark-custom-directives';

async function transform(md: string) {
  const processor = unified().use(remarkParse).use(remarkDirective).use(remarkCustomDirectives);
  const tree = processor.parse(md);
  return processor.run(tree);
}

const SAMPLE = `
:::faq
### How long can a session stay alive?

Up to 24 hours on the Pro plan — see [pricing](/overview/pricinglimits).

### Does Steel solve CAPTCHAs automatically?

Yes — set \`solveCaptcha: true\` when creating a session.

It runs transparently below the CDP layer.
:::
`;

describe(':::faq directive', () => {
  test('transforms into FAQ element with FAQItem children', async () => {
    const tree: any = await transform(SAMPLE);
    const faq = tree.children.find((n: any) => n.name === 'FAQ');
    expect(faq).toBeDefined();
    expect(faq.type).toBe('mdxJsxFlowElement');

    const items = faq.children.filter((n: any) => n.name === 'FAQItem');
    expect(items).toHaveLength(2);

    const q1 = items[0].attributes.find((a: any) => a.name === 'question');
    expect(q1.value).toBe('How long can a session stay alive?');
    // question headings with inline code keep the code text
    const q2 = items[1].attributes.find((a: any) => a.name === 'question');
    expect(q2.value).toBe('Does Steel solve CAPTCHAs automatically?');

    // answers stay as mdast children so links/inline code render as MDX
    expect(items[0].children).toHaveLength(1);
    expect(items[0].children[0].type).toBe('paragraph');
    expect(items[1].children).toHaveLength(2);
  });

  test('emits valid FAQPage JSON-LD with plain-text answers', async () => {
    const tree: any = await transform(SAMPLE);
    const faq = tree.children.find((n: any) => n.name === 'FAQ');
    const attr = faq.attributes.find((a: any) => a.name === 'jsonLd');
    expect(attr).toBeDefined();

    const data = JSON.parse(attr.value);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(2);
    expect(data.mainEntity[0]['@type']).toBe('Question');
    expect(data.mainEntity[0].name).toBe('How long can a session stay alive?');
    // link text and inline code flattened to plain text
    expect(data.mainEntity[0].acceptedAnswer.text).toBe(
      'Up to 24 hours on the Pro plan — see pricing.',
    );
    expect(data.mainEntity[1].acceptedAnswer.text).toBe(
      'Yes — set solveCaptcha: true when creating a session. It runs transparently below the CDP layer.',
    );
  });

  test('keeps question headings with inline code intact', async () => {
    const tree: any = await transform(
      ':::faq\n### Why reuse `browser.contexts()[0]`?\n\nBecause Steel pre-opens a context.\n:::\n',
    );
    const faq = tree.children.find((n: any) => n.name === 'FAQ');
    const q = faq.children[0].attributes.find((a: any) => a.name === 'question');
    expect(q.value).toBe('Why reuse browser.contexts()[0]?');
  });

  test('fails on a faq directive without question headings', async () => {
    await expect(transform(':::faq\nJust a paragraph, no headings.\n:::\n')).rejects.toThrow(
      /faq directive/,
    );
  });
});
