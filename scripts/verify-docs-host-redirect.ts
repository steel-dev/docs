#!/usr/bin/env bun
// ABOUTME: Checks a deployment of the docs-host-redirect project against its vercel.json map.
// ABOUTME: Usage: bun scripts/verify-docs-host-redirect.ts <base-url>, before and after the domain move.
import { readFileSync } from 'node:fs';
import * as path from 'node:path';

interface MapEntry {
  source: string;
  destination: string;
  permanent: boolean;
}

/** A query that each request carries, to prove that redirects keep the query string. */
export const PROBE_QUERY = 'utm_source=redirect-check';

/**
 * Gives the problem with a redirect `Location`, or null. The location must have the
 * destination's origin, path and fragment, and every query parameter of the destination
 * and of the request.
 */
export function locationProblem(
  location: string | null,
  destination: string,
  query: string,
): string | null {
  if (!location) return 'no Location header';
  const actual = new URL(location);
  const expected = new URL(destination);
  if (`${actual.origin}${actual.pathname}` !== `${expected.origin}${expected.pathname}`) {
    return `Location ${location} is not ${destination}`;
  }
  if (actual.hash !== expected.hash) return `fragment ${actual.hash} is not ${expected.hash}`;
  const wanted = new URLSearchParams(expected.search);
  for (const [key, value] of new URLSearchParams(query)) wanted.append(key, value);
  for (const [key, value] of wanted) {
    if (!actual.searchParams.getAll(key).includes(value)) return `query ${key}=${value} lost`;
  }
  return null;
}

async function main(baseUrl: string) {
  const file = path.join(import.meta.dir, '..', 'docs-host-redirect', 'vercel.json');
  const { redirects } = JSON.parse(readFileSync(file, 'utf8')) as { redirects: MapEntry[] };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const headers: Record<string, string> = bypass ? { 'x-vercel-protection-bypass': bypass } : {};
  const get = (pathname: string) =>
    fetch(new URL(pathname, baseUrl), { headers, redirect: 'manual' });
  const failures: string[] = [];

  const queue = [...redirects];
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let entry = queue.shift(); entry; entry = queue.shift()) {
        const source = entry.source.replace(/\\(.)/g, '$1');
        const response = await get(`${source}?${PROBE_QUERY}`);
        const status = entry.permanent ? 308 : 307;
        if (response.status !== status) {
          failures.push(`${source}: expected ${status}, got ${response.status}`);
          continue;
        }
        const problem = locationProblem(
          response.headers.get('location'),
          entry.destination,
          PROBE_QUERY,
        );
        if (problem) failures.push(`${source}: ${problem}`);
      }
    }),
  );

  const slash = await get('/overview/steel-cli/');
  if (slash.status !== 308 || slash.headers.get('location') !== '/overview/steel-cli') {
    failures.push(`/overview/steel-cli/: ${slash.status} ${slash.headers.get('location')}`);
  }
  for (const unknown of ['/migration-definitely-missing', '/docs/overview/steel-cli']) {
    const response = await get(unknown);
    if (response.status !== 404) failures.push(`${unknown}: expected 404, got ${response.status}`);
  }
  const robots = await get('/robots.txt');
  if (robots.status !== 200 || !(await robots.text()).includes('Allow: /')) {
    failures.push(`/robots.txt: ${robots.status}`);
  }
  const sitemap = await get('/sitemap.xml');
  if (sitemap.status !== 200 || !(await sitemap.text()).includes('https://docs.steel.dev/')) {
    failures.push(`/sitemap.xml: ${sitemap.status}`);
  }

  if (failures.length > 0) {
    for (const failure of failures.sort()) console.error(failure);
    console.error(`docs-host-redirect verification failed: ${failures.length} findings`);
    process.exit(1);
  }
  console.log(`docs-host-redirect verified: ${redirects.length} redirects, 404s, robots, sitemap.`);
}

if (import.meta.main) {
  const baseUrl = process.argv[2];
  if (!baseUrl) throw new Error('Usage: bun scripts/verify-docs-host-redirect.ts <base-url>');
  await main(baseUrl);
}
