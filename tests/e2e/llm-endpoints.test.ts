// ABOUTME: End-to-end tests that boot the Next.js dev server and verify the
// ABOUTME: LLM-facing endpoints: .md-suffixed URLs, index pointer, llms-full.txt.
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

let server: ReturnType<typeof Bun.spawn>;

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
    expect(await response.text()).toStartWith('> Full docs index: https://docs.steel.dev/llms.txt');
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
