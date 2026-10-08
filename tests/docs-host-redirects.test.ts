// ABOUTME: Tests the docs.steel.dev redirect map: the pure builder and the checked-in project files.
// ABOUTME: The coverage tests fail when a page, a public file or an old redirect has no entry.
import { describe, expect, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  buildHostRedirects,
  escapeSource,
  MAX_VERCEL_REDIRECTS,
  NEW_DOCS_URL,
  newDocsUrl,
  renderOldRobots,
  renderOldSitemap,
} from '@/lib/docs-host-redirects';
import {
  APP_PAGE_REDIRECTS,
  APP_ROUTES,
  nextConfigRedirects,
  rootMarkdownPageUrls,
  rootPageUrls,
} from '@/scripts/generate-docs-host-redirects';
import { locationProblem } from '@/scripts/verify-docs-host-redirect';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (path: string) => readFileSync(`${ROOT}${path}`, 'utf8');

interface VercelRedirect {
  source: string;
  destination: string;
  permanent: boolean;
}

const vercelJson = JSON.parse(read('docs-host-redirect/vercel.json')) as {
  redirects: VercelRedirect[];
  trailingSlash: boolean;
  outputDirectory: string;
};
const unescapeSource = (source: string) => source.replace(/\\(.)/g, '$1');
const checkedIn = new Map(
  vercelJson.redirects.map((redirect) => [unescapeSource(redirect.source), redirect]),
);

describe('newDocsUrl', () => {
  test('maps the docs home without a trailing slash', () => {
    expect(newDocsUrl('/')).toBe('https://steel.dev/docs');
  });

  test('keeps the path, the query and the fragment', () => {
    expect(newDocsUrl('/overview/steel-cli')).toBe('https://steel.dev/docs/overview/steel-cli');
    expect(newDocsUrl('/cookbook/playwright#python')).toBe(
      'https://steel.dev/docs/cookbook/playwright#python',
    );
    expect(newDocsUrl('/#top')).toBe('https://steel.dev/docs#top');
  });

  test('refuses URLs that are not root-relative paths', () => {
    expect(() => newDocsUrl('https://example.com/a')).toThrow();
    expect(() => newDocsUrl('//example.com/a')).toThrow();
  });
});

describe('escapeSource', () => {
  test('escapes path-to-regexp syntax and keeps other characters', () => {
    expect(escapeSource('/a:b(c)*+?{d}')).toBe('/a\\:b\\(c\\)\\*\\+\\?\\{d\\}');
    expect(escapeSource('/images/a_b-c.png')).toBe('/images/a_b-c.png');
  });
});

describe('buildHostRedirects', () => {
  const build = (legacy = APP_PAGE_REDIRECTS) =>
    buildHostRedirects({
      pages: ['/overview/steel-cli', '/overview', '/cookbook/authors/a'],
      markdownPages: ['/overview/steel-cli', '/overview'],
      publicFiles: ['/images/logo.png', '/robots.txt'],
      routes: ['/llms.txt', '/sitemap.xml'],
      legacy,
    });

  test('gives each page its HTML and Open Graph URLs, and Markdown pages their .md URL', () => {
    const sources = build().map((redirect) => redirect.source);
    expect(sources).toContain('/overview/steel-cli');
    expect(sources).toContain('/overview/steel-cli.md');
    expect(sources).toContain('/og/overview/steel-cli');
    expect(sources).toContain('/og/cookbook/authors/a');
    expect(sources).not.toContain('/cookbook/authors/a.md');
  });

  test('lets an old redirect win over a page at the same path', () => {
    const redirects = build();
    const overview = redirects.find((redirect) => redirect.source === '/overview');
    expect(overview?.destination).toBe(NEW_DOCS_URL);
    const sources = redirects.map((redirect) => redirect.source);
    expect(sources).not.toContain('/overview.md');
    expect(sources).toContain('/og/overview');
  });

  test('leaves robots.txt and sitemap.xml to the redirect project', () => {
    const sources = build().map((redirect) => redirect.source);
    expect(sources).not.toContain('/robots.txt');
    expect(sources).not.toContain('/sitemap.xml');
  });

  test('follows chains to the final destination in one hop', () => {
    const redirects = build([
      { source: '/a', destination: '/b', permanent: true },
      { source: '/b', destination: '/c#x', permanent: true },
      { source: '/t', destination: '/a', permanent: false },
      { source: '/out', destination: 'https://example.com/', permanent: true },
    ]);
    const bySource = new Map(redirects.map((redirect) => [redirect.source, redirect]));
    expect(bySource.get('/a')?.destination).toBe(`${NEW_DOCS_URL}/c#x`);
    expect(bySource.get('/t')).toEqual({
      source: '/t',
      destination: `${NEW_DOCS_URL}/c#x`,
      permanent: false,
    });
    expect(bySource.get('/out')?.destination).toBe('https://example.com/');
  });

  test('refuses a redirect loop', () => {
    expect(() =>
      build([
        { source: '/a', destination: '/b', permanent: true },
        { source: '/b', destination: '/a', permanent: true },
      ]),
    ).toThrow('Redirect loop');
  });
});

describe('checked-in docs-host-redirect project', () => {
  test('stays inside the Vercel redirect limit and has no duplicate sources', () => {
    expect(vercelJson.redirects.length).toBeLessThanOrEqual(MAX_VERCEL_REDIRECTS);
    expect(checkedIn.size).toBe(vercelJson.redirects.length);
    expect(vercelJson.trailingSlash).toBe(false);
    expect(vercelJson.outputDirectory).toBe('public');
  });

  test('sends every internal destination to steel.dev/docs and nowhere on the old host', () => {
    for (const redirect of vercelJson.redirects) {
      expect(redirect.destination.startsWith('https://')).toBe(true);
      expect(redirect.destination).not.toContain('docs.steel.dev');
      expect(redirect.destination).not.toContain('/docs/docs');
    }
  });

  test('covers every page, tracked public file, app route and old redirect', async () => {
    const trackedPublic = execFileSync('git', ['ls-files', 'public'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
      .map((file) => file.replace(/^public/, ''));
    const expected = buildHostRedirects({
      pages: rootPageUrls(),
      markdownPages: rootMarkdownPageUrls(),
      publicFiles: trackedPublic,
      routes: APP_ROUTES,
      legacy: [...(await nextConfigRedirects()), ...APP_PAGE_REDIRECTS],
    });
    const missing = expected.filter(
      (redirect) =>
        checkedIn.get(redirect.source)?.destination !== redirect.destination ||
        checkedIn.get(redirect.source)?.permanent !== redirect.permanent,
    );
    expect(missing.map((redirect) => redirect.source)).toEqual([]);
  });

  test('covers every docs.steel.dev URL that the sitemap and Search Console showed', () => {
    const known = read('tests/fixtures/docs-host-known-urls.txt')
      .split('\n')
      .filter((line) => line && !line.startsWith('#'));
    const servedHere = ['/robots.txt', '/sitemap.xml'];
    const uncovered = known.filter((path) => !checkedIn.has(path) && !servedHere.includes(path));
    expect(uncovered).toEqual([]);
  });

  test('serves robots.txt and an old-URL sitemap that the generator wrote', () => {
    expect(read('docs-host-redirect/public/robots.txt')).toBe(renderOldRobots());
    const sitemap = read('docs-host-redirect/public/sitemap.xml');
    expect(sitemap).toContain('<loc>https://docs.steel.dev/</loc>');
    expect(sitemap).toContain('<loc>https://docs.steel.dev/overview/stealth/captcha-solving</loc>');
    expect(sitemap).not.toContain('steel.dev/docs');
    expect(renderOldSitemap(['/a'])).toContain('<loc>https://docs.steel.dev/a</loc>');
  });
});

describe('locationProblem', () => {
  const query = 'utm_source=redirect-check';

  test('accepts the destination with the request query, before the fragment', () => {
    expect(
      locationProblem(
        'https://steel.dev/docs/cookbook/playwright?utm_source=redirect-check#python',
        'https://steel.dev/docs/cookbook/playwright#python',
        query,
      ),
    ).toBeNull();
    expect(
      locationProblem(
        'https://render.com/deploy?image=steeldev%2Fsteel&utm_source=redirect-check',
        'https://render.com/deploy?image=steeldev/steel',
        query,
      ),
    ).toBeNull();
  });

  test('finds a lost query, a lost fragment and a wrong path', () => {
    expect(
      locationProblem('https://steel.dev/docs/a', 'https://steel.dev/docs/a', query),
    ).toContain('lost');
    expect(
      locationProblem(
        'https://steel.dev/docs/a?utm_source=redirect-check',
        'https://steel.dev/docs/a#b',
        query,
      ),
    ).toContain('fragment');
    expect(locationProblem('https://steel.dev/b', 'https://steel.dev/docs/a', query)).toContain(
      'is not',
    );
    expect(locationProblem(null, 'https://steel.dev/docs/a', query)).toBe('no Location header');
  });
});
