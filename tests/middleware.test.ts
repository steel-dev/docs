// ABOUTME: Integration tests for docs middleware Markdown rewrites and canonical
// ABOUTME: HTML routing.
import { describe, expect, test } from 'bun:test';
import { NextRequest } from 'next/server';
import middleware from '../middleware';

function browserRequest(url: string): NextRequest {
  return new NextRequest(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'sec-fetch-dest': 'document',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    },
  });
}

function varyTokens(response: Response): string[] {
  return (response.headers.get('Vary') ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

describe('middleware .md suffix handling', () => {
  test('rewrites a .md-suffixed docs URL to the llms.mdx route', () => {
    const response = middleware(browserRequest('http://localhost/overview/steel-cli.md'));
    const rewrite = response.headers.get('x-middleware-rewrite');
    expect(rewrite).not.toBeNull();
    expect(new URL(rewrite as string).pathname).toBe('/llms.mdx/overview/steel-cli');
  });

  test('rewrites .md URLs even for markdown user agents', () => {
    const request = new NextRequest('http://localhost/cookbook/playwright.md', {
      headers: { 'user-agent': 'claude-code/1.0' },
    });
    const response = middleware(request);
    const rewrite = response.headers.get('x-middleware-rewrite');
    expect(rewrite).not.toBeNull();
    expect(new URL(rewrite as string).pathname).toBe('/llms.mdx/cookbook/playwright');
  });

  test('leaves canonical docs URLs from browsers untouched', () => {
    const response = middleware(browserRequest('http://localhost/overview/steel-cli'));
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });

  test.each([
    { accept: 'text/html', 'user-agent': 'ChatGPT-User/1.0' },
    { accept: 'text/markdown', 'user-agent': 'curl/8.7.1' },
  ])('keeps the HTML-only overview landing page out of negotiation', (headers) => {
    for (const pathname of ['/overview', '/overview/']) {
      const response = middleware(
        new NextRequest(`http://localhost${pathname}`, {
          headers,
        }),
      );
      expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    }
  });

  test('does not rewrite excluded .md paths', () => {
    const response = middleware(browserRequest('http://localhost/llms-full.txt.md'));
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });

  test.each([
    { accept: 'text/markdown', 'user-agent': 'curl/8.7.1' },
    { accept: 'text/html', 'user-agent': 'claude-code/1.0' },
    { accept: 'text/html', 'user-agent': 'Googlebot/2.1' },
    { accept: 'text/html', 'user-agent': 'GPTBot/1.2' },
    { accept: 'text/html', 'user-agent': 'OAI-SearchBot/1.0' },
    { accept: 'text/html', 'user-agent': 'ClaudeBot/1.0' },
    { accept: 'text/html', 'user-agent': 'PerplexityBot/1.0' },
  ])('passes the invariant HTML homepage through for $user-agent', (headers) => {
    const response = middleware(
      new NextRequest('http://localhost/', {
        headers,
      }),
    );
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(varyTokens(response)).not.toEqual(expect.arrayContaining(['accept', 'user-agent']));
  });

  test('passes browser navigation at the homepage through', () => {
    const response = middleware(browserRequest('http://localhost/'));
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  test('does not rewrite /AGENTS.md, even for markdown user agents', () => {
    const browser = middleware(browserRequest('http://localhost/AGENTS.md'));
    expect(browser.headers.get('x-middleware-rewrite')).toBeNull();
    const agent = middleware(
      new NextRequest('http://localhost/AGENTS.md', {
        headers: { 'user-agent': 'claude-code/1.0' },
      }),
    );
    expect(agent.headers.get('x-middleware-rewrite')).toBeNull();
  });
});
