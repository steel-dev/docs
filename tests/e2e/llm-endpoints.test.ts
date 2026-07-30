// ABOUTME: End-to-end tests that boot the Next.js dev server and verify the agent-facing
// ABOUTME: endpoints: .md URLs, index pointer, llms-full.txt, api-catalog, openapi redirect.
import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

// The dev server compiles the middleware and markdown route on first request.
setDefaultTimeout(120000);

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PORT = 3300 + Math.floor(Math.random() * 300);
const BASE_URL = `http://localhost:${PORT}`;

const BROWSER_HEADERS = {
  accept: 'text/html,application/xhtml+xml',
  'sec-fetch-dest': 'document',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
};

const HTML_CRAWLER_USER_AGENTS = [
  'Mozilla/5.0 AppleWebKit/537.36; compatible; GPTBot/1.4; +https://openai.com/gptbot',
  'Mozilla/5.0 AppleWebKit/537.36; compatible; OAI-AdsBot/1.0; +https://openai.com/adsbot',
  'Mozilla/5.0 AppleWebKit/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot',
  'ClaudeBot/1.0',
  'Claude-SearchBot/1.0',
  'Mozilla/5.0 AppleWebKit/537.36; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot',
];

const MARKDOWN_USER_AGENTS = [
  'ChatGPT-User/1.0',
  'Claude-User/1.0',
  'Perplexity-User/1.0',
  'claude-code/1.0',
];

let server: ReturnType<typeof Bun.spawn>;

function varyTokens(response: Response): string[] {
  return (response.headers.get('Vary') ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function hasLinkRelation(response: Response, target: string, relation: string): boolean {
  return (response.headers.get('Link') ?? '')
    .split(',')
    .map((value) => value.trim())
    .some((value) => {
      const [rawTarget, ...rawParameters] = value.split(';');
      if (rawTarget.trim() !== `<${target}>`) return false;

      const relationParameter = rawParameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.toLowerCase().startsWith('rel='));
      if (!relationParameter) return false;

      const relations = relationParameter.slice('rel='.length).replace(/^"|"$/g, '').split(/\s+/);
      return relations.includes(relation);
    });
}

function hasActiveNavLink(body: string, href: string): boolean {
  return [...body.matchAll(/<a\b[^>]*>/g)].some(
    ([tag]) => tag.includes(`href="${href}"`) && tag.includes('data-nav-active="true"'),
  );
}

function getJsonLdNodes(body: string): Array<Record<string, unknown>> {
  const scripts = [...body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attributes]) => /type="application\/ld\+json"/.test(attributes))
    .map(([, , contents]) => JSON.parse(contents) as Record<string, unknown>);

  return scripts.flatMap((script) =>
    Array.isArray(script['@graph'])
      ? (script['@graph'] as Array<Record<string, unknown>>)
      : [script],
  );
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    try {
      // Any HTTP response means the server is up; fetch throws until the
      // port accepts connections. Don't probe generated files like
      // /llms.txt, which don't exist in CI when tests run.
      await fetch(BASE_URL, { headers: BROWSER_HEADERS });
      return;
    } catch {
      // Server not accepting connections yet
    }
    await Bun.sleep(1000);
  }
  throw new Error(`Dev server did not become ready on port ${PORT}`);
}

function killProcessGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {}
  }
}

describe('.md suffix end-to-end', () => {
  beforeAll(async () => {
    server = Bun.spawn(['bunx', 'next', 'dev', '--turbopack', '-p', String(PORT)], {
      cwd: PROJECT_ROOT,
      stdout: 'ignore',
      stderr: 'ignore',
      // detached puts the dev server at the head of its own process group, so
      // teardown can signal the whole tree (next-server, Turbopack workers),
      // not just the direct bunx child.
      detached: true,
    });
    await waitForServer();
  });

  afterAll(async () => {
    // Tear down the whole process group so the dev server's CPU and port are
    // released before later test files (Chromium renders) start. The awaited
    // exit is bounded and escalates to SIGKILL, so a child that ignores or
    // defers SIGTERM can never hang the hook past its timeout.
    const pid = server?.pid;
    if (!pid) return;
    killProcessGroup(pid, 'SIGTERM');
    const stopped = await Promise.race([
      server.exited.then(() => true),
      Bun.sleep(3000).then(() => false),
    ]);
    if (!stopped) {
      killProcessGroup(pid, 'SIGKILL');
      await Promise.race([server.exited, Bun.sleep(2000)]);
    }
  });

  test('serves markdown with the index pointer at a .md-suffixed docs URL', async () => {
    const response = await fetch(`${BASE_URL}/overview/sessions-api/quickstart.md`, {
      headers: BROWSER_HEADERS,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toStartWith('text/markdown');
    const body = await response.text();
    expect(body).toStartWith('> Full docs index: https://docs.steel.dev/llms.txt');
    expect(body).toContain('# Quickstart');
    expect(body).not.toContain('```package-install');
    expect(body).not.toContain('-wcn');
    expect(body).not.toContain('<Tabs');
  });

  test('llms-full.txt is free of MDX artifacts', async () => {
    const response = await fetch(`${BASE_URL}/llms-full.txt`, { headers: BROWSER_HEADERS });
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).not.toContain('<Tabs');
    expect(body).not.toContain('<Recipe');
    expect(body).not.toContain(':::callout');
  });

  test('serves /AGENTS.md as markdown with install, auth, and the index pointer', async () => {
    const response = await fetch(`${BASE_URL}/AGENTS.md`, { headers: BROWSER_HEADERS });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toStartWith('text/markdown');
    const body = await response.text();
    expect(body).toStartWith('> Full docs index: https://docs.steel.dev/llms.txt');
    expect(body).toContain('npm install steel-sdk');
    expect(body).toContain('STEEL_API_KEY');
  });

  test('redirects /.well-known/agents.md to /AGENTS.md', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/agents.md`, {
      headers: BROWSER_HEADERS,
      redirect: 'manual',
    });
    // Next.js renders permanent config redirects as 308.
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('/AGENTS.md');
  });

  test('marks a .md docs URL noindex while its canonical HTML page stays indexable', async () => {
    const markdown = await fetch(`${BASE_URL}/overview/sessions-api/quickstart.md`, {
      headers: BROWSER_HEADERS,
    });
    expect(markdown.headers.get('x-robots-tag')).toContain('noindex');

    const html = await fetch(`${BASE_URL}/overview/sessions-api/quickstart`, {
      headers: BROWSER_HEADERS,
    });
    expect(html.headers.get('x-robots-tag')).toBeNull();
  });

  test('marks the plain-text agent endpoints noindex', async () => {
    // Status is not asserted: /llms.txt is generated into public/ at build
    // time, so it is absent when tests run. The header comes from the route
    // config either way, which is what matters for crawlers.
    for (const path of ['/llms.txt', '/llms-full.txt', '/AGENTS.md']) {
      const response = await fetch(`${BASE_URL}${path}`, { headers: BROWSER_HEADERS });
      expect(response.headers.get('x-robots-tag')).toContain('noindex');
    }
  });

  test('keeps the canonical HTML homepage indexable for Markdown requests', async () => {
    const response = await fetch(BASE_URL, { headers: { accept: 'text/markdown' } });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toStartWith('text/html');
    expect(response.headers.get('x-robots-tag')).toBeNull();
  });

  test('llms-full.txt does not repeat the index pointer', async () => {
    const response = await fetch(`${BASE_URL}/llms-full.txt`, { headers: BROWSER_HEADERS });
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain('Full docs index');
  });

  test('serves canonical HTML without noindex to AI crawlers', async () => {
    for (const userAgent of HTML_CRAWLER_USER_AGENTS) {
      for (const path of ['/', '/overview/sessions-api/quickstart']) {
        const response = await fetch(`${BASE_URL}${path}`, {
          headers: { accept: 'text/html', 'user-agent': userAgent },
        });
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toStartWith('text/html');
        expect(response.headers.get('x-robots-tag')).toBeNull();
      }
    }
  });

  test('keeps the canonical homepage HTML-only for Markdown clients', async () => {
    const headersToTest = [
      ...MARKDOWN_USER_AGENTS.map((userAgent) => ({
        accept: 'text/html',
        'user-agent': userAgent,
      })),
      { accept: 'text/markdown', 'user-agent': 'curl/8.7.1' },
    ];

    for (const headers of headersToTest) {
      const response = await fetch(BASE_URL, { headers });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toStartWith('text/html');
      expect(response.headers.get('x-robots-tag')).toBeNull();
    }
  });

  test('keeps Markdown negotiation for user-directed clients on regular docs', async () => {
    for (const userAgent of MARKDOWN_USER_AGENTS) {
      const response = await fetch(`${BASE_URL}/overview/sessions-api/quickstart`, {
        headers: { accept: 'text/html', 'user-agent': userAgent },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toStartWith('text/markdown');
      expect(response.headers.get('x-robots-tag')).toContain('noindex');
    }
  });

  test('serves crawler and generic root requests as canonical HTML', async () => {
    for (const userAgent of ['curl/8.7.1', ...HTML_CRAWLER_USER_AGENTS]) {
      const response = await fetch(BASE_URL, {
        headers: { accept: 'text/html', 'user-agent': userAgent },
        redirect: 'manual',
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.get('content-type')).toStartWith('text/html');
      expect(varyTokens(response)).not.toEqual(expect.arrayContaining(['accept', 'user-agent']));
    }
  });

  test('permanently redirects only the exact legacy overview path', async () => {
    const response = await fetch(`${BASE_URL}/overview`, {
      headers: BROWSER_HEADERS,
      redirect: 'manual',
    });
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('/');

    const nested = await fetch(`${BASE_URL}/overview/sessions-api/quickstart`, {
      headers: BROWSER_HEADERS,
      redirect: 'manual',
    });
    expect(nested.status).toBe(200);
  });

  test('publishes root metadata, navigation, sidebar, and sitemap signals', async () => {
    const metadataResponse = await fetch(BASE_URL, {
      headers: { ...BROWSER_HEADERS, 'user-agent': 'facebookexternalhit/1.1' },
    });
    const metadataBody = await metadataResponse.text();
    expect(metadataBody).toContain('<link rel="canonical" href="https://docs.steel.dev"/>');
    expect(metadataBody).toContain(
      '<link rel="alternate" type="text/plain" href="https://docs.steel.dev/llms.txt"/>',
    );

    const root = await fetch(BASE_URL, { headers: BROWSER_HEADERS });
    const body = await root.text();
    expect(body).toContain('href="/overview/sessions-api/overview"');
    expect(hasActiveNavLink(body, '/')).toBe(true);

    const nestedOverview = await fetch(`${BASE_URL}/overview/sessions-api/quickstart`, {
      headers: BROWSER_HEADERS,
    });
    expect(hasActiveNavLink(await nestedOverview.text(), '/')).toBe(true);

    const integrations = await fetch(`${BASE_URL}/integrations`, { headers: BROWSER_HEADERS });
    expect(hasActiveNavLink(await integrations.text(), '/')).toBe(false);

    const sitemap = await fetch(`${BASE_URL}/sitemap.xml`, { headers: BROWSER_HEADERS });
    expect(sitemap.status).toBe(200);
    const sitemapBody = await sitemap.text();
    expect(sitemapBody.match(/<loc>https:\/\/docs\.steel\.dev\/<\/loc>/g)).toHaveLength(1);
    expect(sitemapBody).not.toContain('<loc>https://docs.steel.dev/overview</loc>');
  });

  test('renders answerable homepage semantics without changing its visual hierarchy', async () => {
    const response = await fetch(BASE_URL, {
      headers: { ...BROWSER_HEADERS, 'user-agent': 'facebookexternalhit/1.1' },
    });
    const body = await response.text();
    const animatedLogo = [...body.matchAll(/<div\b[^>]*>/g)]
      .map(([tag]) => tag)
      .find((tag) => tag.includes('height:188px') && tag.includes('width:188px'));

    expect(body.match(/<h1\b/g)).toHaveLength(1);
    expect(body).toContain('<h1 class="text-3xl">Steel Documentation</h1>');
    expect(animatedLogo).toContain('class="shrink-0"');
    expect(body).toContain(
      'Steel is an open-source browser API for AI agents and automation. Use these docs to create cloud browser sessions, connect your automation tools, and configure proxies, CAPTCHA solving, credentials, and files.',
    );
    expect(body).toContain(
      '<section class="space-y-5" aria-labelledby="getting-started-and-apis">',
    );
    expect(body).toContain(
      '<h2 id="getting-started-and-apis" class="sr-only">Getting started and APIs</h2>',
    );

    for (const id of ['getting-started-and-apis', 'integrations', 'sdks', 'resources']) {
      expect(body.match(new RegExp(`id="${id}"`, 'g'))).toHaveLength(1);
    }
    expect(body).not.toContain('id="explore-by-category"');
  });

  test('publishes a connected, page-aware structured data graph', async () => {
    const rootResponse = await fetch(BASE_URL, {
      headers: { ...BROWSER_HEADERS, 'user-agent': 'facebookexternalhit/1.1' },
    });
    const rootBody = await rootResponse.text();
    const rootNodes = getJsonLdNodes(rootBody);
    const organization = rootNodes.find((node) => node['@type'] === 'Organization');
    const website = rootNodes.find((node) => node['@type'] === 'WebSite');
    const homepage = rootNodes.find((node) => node['@type'] === 'WebPage');

    expect(organization).toMatchObject({
      '@id': 'https://docs.steel.dev/#organization',
      name: 'Steel',
      url: 'https://steel.dev/',
      sameAs: ['https://github.com/steel-dev', 'https://x.com/steeldotdev'],
    });
    expect(website).toMatchObject({
      '@id': 'https://docs.steel.dev/#website',
      publisher: { '@id': 'https://docs.steel.dev/#organization' },
    });
    expect(homepage).toMatchObject({
      '@id': 'https://docs.steel.dev/#webpage',
      url: 'https://docs.steel.dev/',
      name: 'Steel Documentation',
      isPartOf: { '@id': 'https://docs.steel.dev/#website' },
      about: { '@id': 'https://docs.steel.dev/#organization' },
      publisher: { '@id': 'https://docs.steel.dev/#organization' },
    });
    expect(homepage).not.toHaveProperty('datePublished');
    expect(homepage).not.toHaveProperty('dateModified');
    expect(rootBody).toContain('<meta name="twitter:site" content="@steeldotdev"/>');
    expect(rootBody).toContain('<meta name="twitter:creator" content="@steeldotdev"/>');

    const ordinaryBody = await (
      await fetch(`${BASE_URL}/overview/sessions-api/quickstart`, {
        headers: BROWSER_HEADERS,
      })
    ).text();
    const ordinaryNodes = getJsonLdNodes(ordinaryBody);
    expect(
      ordinaryNodes.find(
        (node) => node['@id'] === 'https://docs.steel.dev/overview/sessions-api/quickstart#webpage',
      ),
    ).toMatchObject({ '@type': 'WebPage', name: 'Quickstart' });
    expect(ordinaryNodes.some((node) => node['@type'] === 'BreadcrumbList')).toBe(true);
    expect(ordinaryNodes.some((node) => node['@type'] === 'TechArticle')).toBe(false);

    const integrationBody = await (
      await fetch(`${BASE_URL}/integrations/playwright`, { headers: BROWSER_HEADERS })
    ).text();
    const integrationNodes = getJsonLdNodes(integrationBody);
    const integrationPage = integrationNodes.find(
      (node) => node['@id'] === 'https://docs.steel.dev/integrations/playwright#webpage',
    );
    const integrationArticle = integrationNodes.find((node) => node['@type'] === 'TechArticle');
    expect(integrationPage).toMatchObject({ '@type': 'WebPage' });
    expect(integrationArticle).toMatchObject({
      mainEntityOfPage: {
        '@id': 'https://docs.steel.dev/integrations/playwright#webpage',
      },
      author: { '@id': 'https://docs.steel.dev/#organization' },
      publisher: { '@id': 'https://docs.steel.dev/#organization' },
    });
    if (integrationArticle?.dateModified) {
      expect(integrationArticle.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }

    const recipeBody = await (
      await fetch(`${BASE_URL}/cookbook/playwright`, { headers: BROWSER_HEADERS })
    ).text();
    const recipeNodes = getJsonLdNodes(recipeBody);
    const recipeArticle = recipeNodes.find((node) => node['@type'] === 'TechArticle');
    expect(recipeArticle).toMatchObject({
      mainEntityOfPage: {
        '@id': 'https://docs.steel.dev/cookbook/playwright#webpage',
      },
      publisher: { '@id': 'https://docs.steel.dev/#organization' },
    });
    expect(recipeArticle?.author).toBeArray();

    const authorBody = await (
      await fetch(`${BASE_URL}/cookbook/authors/hussufo`, { headers: BROWSER_HEADERS })
    ).text();
    const authorNodes = getJsonLdNodes(authorBody);
    expect(authorNodes.some((node) => node['@type'] === 'ProfilePage')).toBe(true);
    expect(authorNodes.some((node) => node['@type'] === 'WebPage')).toBe(false);
  });

  test('serves the API catalog as a linkset', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/api-catalog`, {
      headers: { accept: 'application/linkset+json' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toStartWith('application/linkset+json');
    const catalog = (await response.json()) as { linkset: Array<{ anchor: string }> };
    expect(catalog.linkset.length).toBeGreaterThan(0);
  });

  test('advertises the API catalog relation on HEAD', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/api-catalog`, {
      method: 'HEAD',
      redirect: 'manual',
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toStartWith('application/linkset+json');
    expect(hasLinkRelation(response, '/.well-known/api-catalog', 'api-catalog')).toBe(true);
  });

  test('serves the API catalog to markdown clients too, without rewriting it', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/api-catalog`, {
      headers: { accept: 'text/markdown', 'user-agent': 'claude-code/1.0' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toStartWith('application/linkset+json');
  });

  test('redirects /openapi.json to the canonical spec', async () => {
    const response = await fetch(`${BASE_URL}/openapi.json`, { redirect: 'manual' });
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://api.steel.dev/sdk-openapi.json');
  });

  test('returns 404 for a .md URL with no matching page', async () => {
    const response = await fetch(`${BASE_URL}/nonexistent-page.md`, {
      headers: BROWSER_HEADERS,
    });
    expect(response.status).toBe(404);
  });

  test('still serves HTML at the canonical URL for browsers', async () => {
    const response = await fetch(`${BASE_URL}/overview/sessions-api/quickstart`, {
      headers: BROWSER_HEADERS,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toStartWith('text/html');
    expect(hasLinkRelation(response, '/.well-known/api-catalog', 'api-catalog')).toBe(true);
    expect(hasLinkRelation(response, '/llms.txt', 'alternate')).toBe(true);
    expect(hasLinkRelation(response, '/llms-full.txt', 'alternate')).toBe(true);
  });
});
