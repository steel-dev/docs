import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';

function run(script: string, prefix = '/docs', origin = 'https://preview.example.com') {
  return spawnSync(process.execPath, ['-e', script], {
    cwd: `${import.meta.dir}/..`,
    env: { ...process.env, NEXT_PUBLIC_DOCS_PATH_PREFIX: prefix, NEXT_PUBLIC_DOCS_ORIGIN: origin },
    encoding: 'utf8',
  });
}

describe('docs migration transforms', () => {
  test('rewrites MDX links, media, definitions and JSX without changing code or external URLs', () => {
    const result = run(`
      import { remarkDocsPath } from './lib/remark-docs-path';
      const tree = {type:'root',children:[
        {type:'link',url:'/guide#anchor',children:[]},
        {type:'image',url:'/images/a.png'},
        {type:'definition',url:'https://docs.steel.dev/guide?q=1'},
        {type:'link',url:'https://external.example/guide',children:[]},
        {type:'code',value:'[Guide](/guide)'},
        {type:'mdxJsxFlowElement',name:'Card',attributes:[{type:'mdxJsxAttribute',name:'href',value:'/guide'}],children:[]},
        {type:'mdxJsxTextElement',name:'img',attributes:[{type:'mdxJsxAttribute',name:'src',value:'/images/b.png'}],children:[]}
      ]};remarkDocsPath()(tree);console.log(JSON.stringify(tree.children));
    `);
    expect(result.status).toBe(0);
    const nodes = JSON.parse(result.stdout);
    expect(nodes.map((n: { url?: string }) => n.url).slice(0, 4)).toEqual([
      '/docs/guide#anchor',
      '/docs/images/a.png',
      '/docs/guide?q=1',
      'https://external.example/guide',
    ]);
    expect(nodes[4].value).toBe('[Guide](/guide)');
    expect(nodes[5].attributes[0].value).toBe('/docs/guide');
    expect(nodes[6].attributes[0].value).toBe('/docs/images/b.png');
  });

  test('rewrites Markdown link destinations while preserving titles, fences and inline code', () => {
    const input =
      '[Guide](/guide "Title")\n[Owned](https://docs.steel.dev/guide#h)\n[Other](https://example.com)\n[ref]: /guide "Title"\n`[Code](/guide)`\n```md\n[Code](/guide)\n```';
    const result = run(
      `import {mapMarkdownLinks} from './lib/llm-markdown';import {docsPath} from './lib/docs-path';console.log(JSON.stringify(mapMarkdownLinks(${JSON.stringify(input)},docsPath)));`,
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toBe(
      '[Guide](/docs/guide "Title")\n[Owned](/docs/guide#h)\n[Other](https://example.com)\n[ref]: /docs/guide "Title"\n`[Code](/guide)`\n```md\n[Code](/guide)\n```',
    );
  });

  test('root-mode rendering transforms are unchanged', () => {
    const result = run(
      `import {docsPath} from './lib/docs-path';console.log(JSON.stringify(['/guide','https://docs.steel.dev/guide'].map(docsPath)));`,
      '',
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(['/guide', 'https://docs.steel.dev/guide']);
  });

  for (const [prefix, origin] of [
    ['/bad', 'https://example.com'],
    ['/docs', 'https://example.com/path'],
    ['/docs', 'https://user:pass@example.com'],
  ]) {
    test(`rejects invalid URL configuration ${prefix} ${origin}`, () => {
      expect(run("import './lib/docs-path'", prefix, origin).status).not.toBe(0);
    });
  }
});
