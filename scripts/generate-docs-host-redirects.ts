#!/usr/bin/env bun
// ABOUTME: Writes the docs-host-redirect project: vercel.json redirects, robots.txt and sitemap.xml.
// ABOUTME: Run after `bun run generate`; `--check` fails when the files in the repository are stale.
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildHostRedirects,
  type Redirect,
  renderOldRobots,
  renderOldSitemap,
  renderVercelJson,
} from '../lib/docs-host-redirects';
import { DOCS_PATH_PREFIX } from '../lib/docs-path';
import { shouldIncludeLLMPage } from '../lib/get-llm-text';
import { source } from '../lib/source';

const ROOT = path.join(import.meta.dir, '..');
const OUTPUT = path.join(ROOT, 'docs-host-redirect');

/** Paths that app routes serve. Files in `public/` are found on disk. */
export const APP_ROUTES = [
  '/AGENTS.md',
  '/DESIGN.md',
  '/api/search',
  '/changelog',
  '/llms-full.txt',
  '/llms.txt',
];

/** Redirects that app pages make, which next.config.mjs does not list. */
export const APP_PAGE_REDIRECTS: Redirect[] = [
  // app/(home)/overview/page.tsx
  { source: '/overview', destination: '/', permanent: true },
];

const rootUrl = (url: string) => url.replace(/^\/en(\/|$)/, '/');

export function rootPageUrls(): string[] {
  return source.getPages().map((page) => rootUrl(page.url));
}

/** Pages that serve Markdown at `<page>.md`, as app/llms.mdx does. */
export function rootMarkdownPageUrls(): string[] {
  return source
    .getPages()
    .filter(shouldIncludeLLMPage)
    .map((page) => rootUrl(page.url));
}

export function listPublicFiles(directory = path.join(ROOT, 'public')): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else files.push(`/${path.relative(directory, absolute).split(path.sep).join('/')}`);
    }
  };
  walk(directory);
  return files.sort();
}

export async function nextConfigRedirects(): Promise<Redirect[]> {
  const config = (await import('../next.config.mjs')).default;
  const redirects: { source: string; destination: string; permanent?: boolean }[] =
    (await config.redirects?.()) ?? [];
  return redirects.map(({ source, destination, permanent }) => ({
    source,
    destination,
    permanent: permanent ?? false,
  }));
}

async function main() {
  if (DOCS_PATH_PREFIX) {
    throw new Error('Run this script in root mode: unset NEXT_PUBLIC_DOCS_PATH_PREFIX');
  }
  const publicFiles = listPublicFiles();
  if (!publicFiles.includes('/llms.txt')) {
    throw new Error('public/llms.txt is missing. Run `bun run generate` first.');
  }
  const pages = rootPageUrls();
  const legacy = [...(await nextConfigRedirects()), ...APP_PAGE_REDIRECTS];
  const redirects = buildHostRedirects({
    pages,
    markdownPages: rootMarkdownPageUrls(),
    publicFiles,
    routes: APP_ROUTES,
    legacy,
  });
  // A page that an old redirect hides is not a page on the old host.
  const legacySources = new Set(legacy.map((redirect) => redirect.source));
  const oldPages = pages.filter((page) => !legacySources.has(page));

  const outputs: [string, string][] = [
    [path.join(OUTPUT, 'vercel.json'), renderVercelJson(redirects)],
    [path.join(OUTPUT, 'public', 'robots.txt'), renderOldRobots()],
    [path.join(OUTPUT, 'public', 'sitemap.xml'), renderOldSitemap(oldPages)],
  ];

  if (process.argv.includes('--check')) {
    const stale = outputs.filter(
      ([file, content]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content,
    );
    for (const [file] of stale) console.error(`Stale: ${path.relative(ROOT, file)}`);
    if (stale.length > 0) process.exit(1);
    console.log(`docs-host-redirect is current: ${redirects.length} redirects`);
    return;
  }

  for (const [file, content] of outputs) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  console.log(`Wrote docs-host-redirect: ${redirects.length} redirects, ${oldPages.length} pages`);
}

if (import.meta.main) {
  await main();
}
