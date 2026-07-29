// ABOUTME: Tests for the llm-markdown transforms that strip MDX noise (frontmatter,
// ABOUTME: CodeHike fence flags, directive fences, JSX components) from LLM-served markdown.
import { describe, expect, test } from 'bun:test';
import {
  cleanCodeFences,
  cleanMdxForLLM,
  collapseBlankLines,
  stripDirectiveFences,
  stripFrontmatter,
  stripJsxComponents,
  stripMediaElements,
  stripModuleStatements,
} from '../lib/llm-markdown';

describe('stripFrontmatter', () => {
  test('removes a leading frontmatter block', () => {
    const input = '---\ntitle: Quickstart\nsidebarTitle: Quickstart\n---\n\n### Overview\n';
    expect(stripFrontmatter(input)).toBe('### Overview\n');
  });

  test('keeps a thematic break in the document body', () => {
    const input = 'Intro.\n\n---\n\nAfter the break.';
    expect(stripFrontmatter(input)).toBe(input);
  });

  test('passes through content without frontmatter', () => {
    const input = '# Title\n\nProse.';
    expect(stripFrontmatter(input)).toBe(input);
  });
});

describe('stripModuleStatements', () => {
  test('strips top-level ESM imports but keeps prose', () => {
    const out = stripModuleStatements("import Image from 'next/image';\n\nProse.");
    expect(out).not.toContain('import Image');
    expect(out).toContain('Prose.');
  });

  test('strips named and semicolon-less import forms', () => {
    expect(stripModuleStatements("import { Foo } from 'bar'\nProse.").trim()).toBe('Prose.');
  });

  test('strips top-level ESM exports but keeps prose', () => {
    const out = stripModuleStatements('export const x = 1;\nProse.');
    expect(out).not.toContain('export const');
    expect(out).toContain('Prose.');
    expect(stripModuleStatements('export default App;\nProse.')).not.toContain('export default');
  });

  test('does not strip Python imports inside code fences', () => {
    const input = '```python\nimport os\nimport requests\n```\nProse.';
    expect(stripModuleStatements(input)).toBe(input);
  });

  test('does not strip bare Python-style imports outside fences', () => {
    // No quoted module specifier, so not an ESM import; left untouched.
    expect(stripModuleStatements('import os\nProse.')).toBe('import os\nProse.');
  });

  test('ignores the word import in prose', () => {
    expect(stripModuleStatements("We import 'style' here.\nMore.")).toBe(
      "We import 'style' here.\nMore.",
    );
  });
});

describe('stripMediaElements', () => {
  test('drops a self-contained video tag but keeps surrounding prose', () => {
    const out = stripMediaElements('Before.\n<video src="/x.mp4" controls></video>\nAfter.');
    expect(out).toContain('Before.');
    expect(out).toContain('After.');
    expect(out).not.toContain('<video');
  });

  test('drops a self-closing video tag', () => {
    expect(stripMediaElements('<video src="/x.mp4" />\nAfter.')).not.toContain('<video');
  });

  test('drops a multi-line video block', () => {
    const out = stripMediaElements('<video controls>\ncaption\n</video>\nAfter.');
    expect(out).not.toContain('<video');
    expect(out).not.toContain('caption');
    expect(out).toContain('After.');
  });

  test('ignores video tags inside code fences', () => {
    const input = '```html\n<video src="x.mp4"></video>\n```';
    expect(stripMediaElements(input)).toBe(input);
  });
});

describe('cleanCodeFences', () => {
  test('reduces a CodeHike info string to the language', () => {
    const input = '```typescript Typescript -wcn -f steel-client.ts\nconst a = 1;\n```';
    expect(cleanCodeFences(input)).toBe('```typescript\nconst a = 1;\n```');
  });

  test('handles title and flag variants', () => {
    expect(cleanCodeFences('```bash Terminal -wc\nls\n```')).toBe('```bash\nls\n```');
    expect(cleanCodeFences('```typescript !! Typescript -wcn\nx\n```')).toBe(
      '```typescript\nx\n```',
    );
    expect(cleanCodeFences('```bash .env -wcn\nKEY=1\n```')).toBe('```bash\nKEY=1\n```');
  });

  test('leaves bare language fences unchanged', () => {
    const input = '```ts\nconst a = 1;\n```\n\n```\nplain\n```';
    expect(cleanCodeFences(input)).toBe(input);
  });

  test('converts package-install fences to npm install commands', () => {
    const input = '```package-install\nsteel-sdk playwright\n```';
    expect(cleanCodeFences(input)).toBe('```bash\nnpm install steel-sdk playwright\n```');
  });

  test('does not touch fence-like lines inside a longer fence', () => {
    const input = '````md\n```typescript Typescript -wcn\ninner\n```\n````';
    expect(cleanCodeFences(input)).toBe(input);
  });

  test('preserves indentation of indented fences', () => {
    const input = '  ```bash Terminal -wc\n  ls\n  ```';
    expect(cleanCodeFences(input)).toBe('  ```bash\n  ls\n  ```');
  });
});

describe('stripDirectiveFences', () => {
  // Adapted from the stripFaqFences suite this module absorbs.
  test('removes faq fences but keeps questions and answers', () => {
    const input = '## FAQ\n\n:::faq\n### A question?\n\nAn answer.\n:::\n\nAfter.';
    expect(stripDirectiveFences(input)).toBe('## FAQ\n\n### A question?\n\nAn answer.\n\nAfter.');
  });

  test('unwraps a callout and drops its type line', () => {
    const input = ':::callout\ntype: tip\nBe careful.\n:::\n';
    expect(stripDirectiveFences(input)).toBe('Be careful.\n');
  });

  test('drops a type line separated by a blank line', () => {
    const input = ':::callout\n\ntype: warn\n\nBody.\n:::';
    const output = stripDirectiveFences(input);
    expect(output).not.toContain('type: warn');
    expect(output).toContain('Body.');
  });

  test('keeps a callout title heading', () => {
    const input = ':::callout\ntype: info\n### Heads up\nDetails.\n:::';
    expect(stripDirectiveFences(input)).toBe('### Heads up\nDetails.');
  });

  test('unwraps directives nested inside a faq block', () => {
    const input = ':::faq\n### Q?\n\n:::callout\ntype: info\nNote.\n:::\n\nMore answer.\n:::\n';
    expect(stripDirectiveFences(input)).toBe('### Q?\n\nNote.\n\nMore answer.\n');
  });

  test('handles four-colon nesting by fence length', () => {
    const input = '::::callout\ntype: warn\nOuter.\n\n:::callout\nInner.\n:::\n\nMore.\n::::';
    const output = stripDirectiveFences(input);
    expect(output).toContain('Outer.');
    expect(output).toContain('Inner.');
    expect(output).toContain('More.');
    expect(output).not.toContain(':::');
    expect(output).not.toContain('type: warn');
  });

  test('labels objectives, prerequisites, and next-steps', () => {
    expect(stripDirectiveFences(':::objectives\n- Learn X\n:::')).toBe(
      "**What you'll learn:**\n- Learn X",
    );
    expect(stripDirectiveFences(':::prerequisites\n- Know Y\n:::')).toBe(
      '**Prerequisites:**\n- Know Y',
    );
    expect(stripDirectiveFences(':::next-steps\n- [Go](/go): There\n:::')).toBe(
      '**Next steps:**\n- [Go](/go): There',
    );
  });

  test('unwraps unknown directives', () => {
    expect(stripDirectiveFences(':::mystery\nKept.\n:::')).toBe('Kept.');
  });

  test('ignores directive markers inside code fences', () => {
    const input = '```bash\n:::callout\ntype: tip\n:::\n```';
    expect(stripDirectiveFences(input)).toBe(input);
  });

  test('ignores ::: in prose and stray closers', () => {
    const prose = 'Just prose with ::: in a sentence? No.';
    expect(stripDirectiveFences(prose)).toBe(prose);
    expect(stripDirectiveFences('No open fence.\n:::\nStill here.')).toBe(
      'No open fence.\n:::\nStill here.',
    );
  });

  test('keeps the body of an unterminated directive', () => {
    expect(stripDirectiveFences(':::callout\nBody at EOF')).toBe('Body at EOF');
  });
});

describe('stripJsxComponents', () => {
  test('converts Tabs/Tab wrappers to bold labels', () => {
    const input = [
      '<Tabs items={["TypeScript", "Python"]} groupId="lang" persist>',
      '<Tab id="typescript" className="cookbook-concept-tab">',
      'TS content.',
      '</Tab>',
      '<Tab id="python" className="cookbook-concept-tab">',
      'Py content.',
      '</Tab>',
      '</Tabs>',
    ].join('\n');
    const output = stripJsxComponents(input);
    expect(output).toContain('**TypeScript**');
    expect(output).toContain('**Python**');
    expect(output).toContain('TS content.');
    expect(output).toContain('Py content.');
    expect(output).not.toContain('<Tab');
    expect(output).not.toContain('</Tab');
  });

  test('drops single-line self-closing metadata components', () => {
    const input = 'Before.\n<RecipeMeta slug="playwright" />\n<RecipeJsonLd slug="x" />\nAfter.';
    const output = stripJsxComponents(input);
    expect(output).toContain('Before.');
    expect(output).toContain('After.');
    expect(output).not.toContain('Recipe');
  });

  test('drops a multi-line component with embedded JSON', () => {
    const input = [
      'Intro.',
      '<RecipeSearch recipes={[',
      '  {',
      '    "slug": "playwright",',
      '    "title": "A > B",',
      '  },',
      ']} />',
      'Outro.',
    ].join('\n');
    const output = stripJsxComponents(input);
    expect(output).toContain('Intro.');
    expect(output).toContain('Outro.');
    expect(output).not.toContain('RecipeSearch');
    expect(output).not.toContain('"slug"');
  });

  test('converts RecipeCard to a markdown link line', () => {
    const input =
      '<RecipeCard slug="playwright" title="Automate with Playwright" description="Use Steel with Playwright." />';
    expect(stripJsxComponents(input)).toBe(
      '- [Automate with Playwright](/cookbook/playwright): Use Steel with Playwright.',
    );
  });

  test('converts RecipeCard with JSON-brace attributes', () => {
    const input =
      '<RecipeCard slug="rod" title={"Automate with Rod"} description={"Rod\'s API."} />';
    expect(stripJsxComponents(input)).toBe("- [Automate with Rod](/cookbook/rod): Rod's API.");
  });

  test('converts a multi-line Card to a markdown link line', () => {
    const input = [
      '<Card',
      '  title="Live Sessions"',
      '  href="/overview/x"',
      '  description="Embed live sessions."',
      '/>',
    ].join('\n');
    expect(stripJsxComponents(input)).toBe('- [Live Sessions](/overview/x): Embed live sessions.');
  });

  test('unwraps grid wrappers and unknown components', () => {
    const input = '<RecipeGrid>\n<Steps>\nStep one.\n</Steps>\n</RecipeGrid>';
    expect(stripJsxComponents(input)).toBe('Step one.');
  });

  test('converts inline bold spans and strips plain inline spans', () => {
    expect(
      stripJsxComponents('Reach out on the <span className="font-bold">#help</span> channel.'),
    ).toBe('Reach out on the **#help** channel.');
    expect(stripJsxComponents('A <span className="muted">plain</span> span.')).toBe(
      'A plain span.',
    );
  });

  test('ignores JSX inside code fences', () => {
    const input = '```tsx\n<Tabs items={["A"]}>\n<Tab id="a">x</Tab>\n</Tabs>\n```';
    expect(stripJsxComponents(input)).toBe(input);
  });

  test('ignores generics and lowercase tags in prose', () => {
    const input = 'Vec<Story> is a type.\n<br /> is HTML.';
    expect(stripJsxComponents(input)).toBe(input);
  });
});

describe('collapseBlankLines', () => {
  test('collapses runs of blank lines to one', () => {
    expect(collapseBlankLines('a\n\n\n\nb')).toBe('a\n\nb');
  });

  test('preserves blank runs inside code fences', () => {
    const input = '```\nx\n\n\n\ny\n```';
    expect(collapseBlankLines(input)).toBe(input);
  });
});

describe('cleanMdxForLLM', () => {
  test('cleans a distilled real page end to end', () => {
    const input = [
      '---',
      'title: Automate with Playwright',
      'description: Use Steel with Playwright.',
      '---',
      '',
      '<RecipeJsonLd slug="playwright" />',
      '',
      ':::callout',
      'type: tip',
      'Sessions time out after 5 minutes.',
      ':::',
      '',
      '<Tabs items={["TypeScript"]} groupId="lang">',
      '<Tab id="typescript" className="cookbook-concept-tab">',
      '',
      '```typescript Typescript -wcn -f main.ts',
      "import Steel from 'steel-sdk';",
      '```',
      '',
      '</Tab>',
      '</Tabs>',
    ].join('\n');
    const output = cleanMdxForLLM(input);

    expect(output).not.toContain('title: Automate');
    expect(output).not.toContain('RecipeJsonLd');
    expect(output).not.toContain(':::');
    expect(output).not.toContain('type: tip');
    expect(output).not.toContain('<Tab');
    expect(output).toContain('Sessions time out after 5 minutes.');
    expect(output).toContain('**TypeScript**');
    expect(output).toContain('```typescript\nimport Steel from');
    expect(output).not.toContain('-wcn');
    expect(output).not.toContain('\n\n\n');
  });
});
