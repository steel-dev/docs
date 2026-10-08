// ABOUTME: Tests docsPath, stripDocsPath and docsUrl in root mode and in /docs path mode.
// ABOUTME: Each case runs in a child process so that the prefix environment variable applies.
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

  const evaluate = (prefix: string, expression: string) =>
    spawnSync(
      process.execPath,
      ['-e', `import * as p from './lib/docs-path'; console.log(JSON.stringify(${expression}));`],
      {
        cwd: `${import.meta.dir}/..`,
        env: {
          ...process.env,
          NEXT_PUBLIC_DOCS_PATH_PREFIX: prefix,
          NEXT_PUBLIC_DOCS_ORIGIN: 'https://steel.dev',
        },
        encoding: 'utf8',
      },
    );

  test('gives the docs home without a trailing slash in path mode', () => {
    const result = evaluate('/docs', "[p.docsUrl('/'), p.docsPath('/'), p.stripDocsPath('/docs')]");
    expect(JSON.parse(result.stdout)).toEqual(['https://steel.dev/docs', '/docs', '/']);
  });

  test('moves absolute old-host links under the prefix in path mode only', () => {
    const link = "p.docsPath('https://docs.steel.dev/overview/steel-cli?x=1#a')";
    expect(JSON.parse(evaluate('/docs', link).stdout)).toBe('/docs/overview/steel-cli?x=1#a');
    expect(JSON.parse(evaluate('', link).stdout)).toBe(
      'https://docs.steel.dev/overview/steel-cli?x=1#a',
    );
  });

  test('refuses a prefix other than /docs', () => {
    const result = evaluate('/documentation', "p.docsPath('/')");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('NEXT_PUBLIC_DOCS_PATH_PREFIX must be empty or /docs');
  });
});
