// ABOUTME: End-to-end tests that boot the Next.js dev server and verify
// ABOUTME: .md-suffixed docs URLs serve markdown while canonical URLs stay HTML.
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

  afterAll(() => {
    server?.kill();
  });

  test('serves markdown at a .md-suffixed docs URL', async () => {
    const response = await fetch(`${BASE_URL}/overview/sessions-api/quickstart.md`, {
      headers: BROWSER_HEADERS,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toStartWith('text/markdown');
    expect(await response.text()).toStartWith('# Quickstart');
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
