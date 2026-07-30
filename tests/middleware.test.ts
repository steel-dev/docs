// ABOUTME: Integration tests for the docs middleware, verifying .md-suffixed
// ABOUTME: URLs rewrite to the /llms.mdx markdown route and others pass through.
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

  test('does not rewrite excluded .md paths', () => {
    const response = middleware(browserRequest('http://localhost/llms-full.txt.md'));
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });

  test('serves the homepage as markdown in place, without a redirect', () => {
    const response = middleware(
      new NextRequest('http://localhost/', { headers: { accept: 'text/markdown' } }),
    );
    const rewrite = response.headers.get('x-middleware-rewrite');
    expect(rewrite).not.toBeNull();
    expect(new URL(rewrite as string).pathname).toBe('/AGENTS.md');
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('Vary')).toContain('Accept');
  });

  test('serves the homepage as markdown to programmatic clients', () => {
    const response = middleware(
      new NextRequest('http://localhost/', {
        headers: { accept: 'text/html', 'user-agent': 'curl/8.7.1' },
      }),
    );
    const rewrite = response.headers.get('x-middleware-rewrite');
    expect(rewrite).not.toBeNull();
    expect(new URL(rewrite as string).pathname).toBe('/AGENTS.md');
  });

  test('leaves the homepage untouched for browsers', () => {
    const response = middleware(browserRequest('http://localhost/'));
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
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
