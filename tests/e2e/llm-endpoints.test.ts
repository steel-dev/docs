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

describe('.md suffix end-to-end', () => {
  beforeAll(async () => {
    server = Bun.spawn(['bunx', 'next', 'dev', '--turbopack', '-p', String(PORT)], {
      cwd: PROJECT_ROOT,
      stdout: 'ignore',
      stderr: 'ignore',
    });
    await waitForServer();
  });

  afterAll(async () => {
    // Wait for the process to fully exit so the dev server's CPU and port
    // are released before later test files (Chromium renders) start.
    server?.kill();
    await server?.exited;
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

  test('keeps the homepage indexable when it negotiates markdown', async () => {
    const response = await fetch(BASE_URL, { headers: { accept: 'text/markdown' } });
    expect(response.headers.get('content-type')).toStartWith('text/markdown');
    expect(response.headers.get('x-robots-tag')).toBeNull();
  });

  test('llms-full.txt does not repeat the index pointer', async () => {
    const response = await fetch(`${BASE_URL}/llms-full.txt`, { headers: BROWSER_HEADERS });
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain('Full docs index');
  });

  test('negotiates markdown at the homepage without redirecting', async () => {
    const response = await fetch(BASE_URL, {
      headers: { accept: 'text/markdown' },
      redirect: 'manual',
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toStartWith('text/markdown');
    expect(varyTokens(response)).toEqual(expect.arrayContaining(['accept', 'user-agent']));
    expect(await response.text()).toStartWith('> Full docs index: https://docs.steel.dev/llms.txt');
  });

  test('serves canonical HTML without noindex to AI crawlers', async () => {
    for (const userAgent of HTML_CRAWLER_USER_AGENTS) {
      for (const path of ['/overview', '/overview/sessions-api/quickstart']) {
        const response = await fetch(`${BASE_URL}${path}`, {
          headers: { accept: 'text/html', 'user-agent': userAgent },
        });
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toStartWith('text/html');
        expect(response.headers.get('x-robots-tag')).toBeNull();
      }
    }
  });

  test('keeps the HTML-only overview available to Markdown clients', async () => {
    const headersToTest = [
      ...MARKDOWN_USER_AGENTS.map((userAgent) => ({
        accept: 'text/html',
        'user-agent': userAgent,
      })),
      { accept: 'text/markdown', 'user-agent': 'curl/8.7.1' },
    ];

    for (const headers of headersToTest) {
      const response = await fetch(`${BASE_URL}/overview`, { headers });
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

  test('redirects crawler and generic root requests to the HTML overview', async () => {
    for (const userAgent of ['curl/8.7.1', ...HTML_CRAWLER_USER_AGENTS]) {
      const response = await fetch(BASE_URL, {
        headers: { accept: 'text/html', 'user-agent': userAgent },
        redirect: 'manual',
      });
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get('location') as string, BASE_URL).pathname).toBe(
        '/overview',
      );
      expect(response.headers.get('content-type')).not.toStartWith('text/markdown');
      expect(varyTokens(response)).toEqual(expect.arrayContaining(['accept', 'user-agent']));
    }
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
  });
});
