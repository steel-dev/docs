// ABOUTME: Tests for public/robots.txt, covering the Content Signals declaration
// ABOUTME: that states how AI crawlers may use the docs, plus the crawl directives.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROBOTS = readFileSync(
  fileURLToPath(new URL('../public/robots.txt', import.meta.url)),
  'utf8',
);

/** Splits robots.txt into its User-agent groups, keyed by agent name. */
function parseGroups(source: string): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  let activeAgents: string[] = [];
  let groupHasDirectives = false;

  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [rawKey, ...rawValue] = trimmed.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.join(':').trim();

    if (key === 'user-agent') {
      activeAgents = groupHasDirectives ? [value] : [...activeAgents, value];
      groupHasDirectives = false;
      if (!groups.has(value)) groups.set(value, []);
    } else if (activeAgents.length > 0) {
      groupHasDirectives = true;
      for (const agent of activeAgents) {
        groups.get(agent)?.push(trimmed);
      }
    }
  }

  return groups;
}

describe('parseGroups', () => {
  const fixtureGroups = parseGroups(`User-agent: Agent-A
User-agent: Agent-B
Allow: /

User-agent: Agent-A
Disallow: /private
`);

  test('shares directives across stacked agents and combines repeated groups', () => {
    expect(fixtureGroups.get('Agent-A')).toEqual(['Allow: /', 'Disallow: /private']);
    expect(fixtureGroups.get('Agent-B')).toEqual(['Allow: /']);
  });
});

const groups = parseGroups(ROBOTS);

describe('robots.txt content signals', () => {
  test('declares a Content-Signal in every User-agent group', () => {
    // A crawler matching a specific group ignores the wildcard group entirely,
    // so the declaration has to be repeated rather than stated once.
    expect(groups.size).toBeGreaterThan(0);

    for (const [agent, directives] of groups) {
      const signal = directives.find((directive) =>
        directive.toLowerCase().startsWith('content-signal:'),
      );
      expect(signal, `${agent} is missing a Content-Signal directive`).toBeDefined();
    }
  });

  test('declares all three signals with valid values', () => {
    for (const [agent, directives] of groups) {
      const signal = directives.find((directive) =>
        directive.toLowerCase().startsWith('content-signal:'),
      );
      const declared = new Map(
        (signal ?? '')
          .slice('content-signal:'.length)
          .split(',')
          .map((entry) => entry.trim().split('=') as [string, string]),
      );

      for (const name of ['search', 'ai-input', 'ai-train']) {
        expect([...declared.keys()], `${agent} is missing the ${name} signal`).toContain(name);
        expect(['yes', 'no'], `${agent} declares an invalid ${name} value`).toContain(
          declared.get(name) ?? '',
        );
      }
    }
  });

  test('keeps the crawl directives and sitemap', () => {
    expect(groups.get('*')).toContain('Allow: /');
    expect(groups.get('ClaudeBot')).toContain('Allow: /');
    expect(ROBOTS).toContain('Sitemap: https://docs.steel.dev/sitemap.xml');
  });

  test('contains no Disallow directives in any group', () => {
    // The docs are fully public; a blanket Disallow would silently deindex the site.
    for (const [agent, directives] of groups) {
      const disallows = directives.filter((directive) =>
        directive.toLowerCase().startsWith('disallow:'),
      );
      expect(disallows, `${agent} blocks crawling with ${disallows.join(', ')}`).toEqual([]);
    }
  });
});
