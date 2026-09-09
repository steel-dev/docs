import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';

describe('docs public path boundary', () => {
  for (const prefix of ['', '/docs']) {
    test(`preserves URLs in ${prefix || 'root'} mode`, () => {
      const script = `import { docsPath, stripDocsPath, docsUrl } from './lib/docs-path';
        const paths = ['/', '/overview/steel-cli', '/api/search?q=steel', '/images/a.png', '/docs/a', '/a#heading', 'https://example.com/a', '//example.com/a', '#heading'];
        console.log(JSON.stringify({paths: paths.map(docsPath), stripped: stripDocsPath('/docs/a'), url: docsUrl('/overview/steel-cli')}));`;
      const result = spawnSync(process.execPath, ['-e', script], {
        cwd: `${import.meta.dir}/..`,
        env: {
          ...process.env,
          NEXT_PUBLIC_DOCS_PATH_PREFIX: prefix,
          NEXT_PUBLIC_DOCS_ORIGIN: 'https://steel.dev',
        },
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      const value = JSON.parse(result.stdout);
      expect(value.paths).toEqual([
        prefix || '/',
        `${prefix}/overview/steel-cli`,
        `${prefix}/api/search?q=steel`,
        `${prefix}/images/a.png`,
        '/docs/a',
        `${prefix}/a#heading`,
        'https://example.com/a',
        '//example.com/a',
        '#heading',
      ]);
      expect(value.stripped).toBe(prefix ? '/a' : '/docs/a');
      expect(value.url).toBe(`https://steel.dev${prefix}/overview/steel-cli`);
    });
  }
});
