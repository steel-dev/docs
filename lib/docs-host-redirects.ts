// ABOUTME: Builds the one-to-one redirect map from docs.steel.dev URLs to https://steel.dev/docs.
// ABOUTME: The docs-host-redirect Vercel project serves this map after the docs move to steel.dev.

/** The public docs home after the move. Every internal destination starts with it. */
export const NEW_DOCS_URL = 'https://steel.dev/docs';
/** The docs host before the move. */
export const OLD_DOCS_ORIGIN = 'https://docs.steel.dev';
/** Vercel accepts at most this number of redirects in one vercel.json. */
export const MAX_VERCEL_REDIRECTS = 2048;

export interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

export interface HostRedirectInput {
  /** Root-mode page URLs from the Fumadocs source, for example `/overview/steel-cli`. */
  pages: string[];
  /** The pages that also serve Markdown at `<page>.md` (the ones without `llm: false`). */
  markdownPages: string[];
  /** Root-mode paths of files in `public/`, for example `/images/logo.png`. */
  publicFiles: string[];
  /** Root-mode paths that app routes serve, for example `/llms.txt`. */
  routes: string[];
  /** Root-mode redirects that the docs app has, from next.config.mjs and app pages. */
  legacy: Redirect[];
}

/** Paths that the redirect project serves itself, so that crawlers can read the old host. */
export const SERVED_BY_REDIRECT_PROJECT = ['/robots.txt', '/sitemap.xml'];

/** Gives the URL on steel.dev for a root-mode docs path. Fragments and queries stay. */
export function newDocsUrl(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(`Not a root-relative docs path: ${path}`);
  }
  if (path === '/') return NEW_DOCS_URL;
  if (path.startsWith('/#') || path.startsWith('/?')) return `${NEW_DOCS_URL}${path.slice(1)}`;
  return `${NEW_DOCS_URL}${path}`;
}

/**
 * Escapes a literal path for a Vercel redirect `source`. Vercel reads `source` as a
 * path-to-regexp pattern, so these characters would otherwise start a parameter or group.
 */
export function escapeSource(path: string): string {
  return path.replace(/[:()*+?{}\\]/g, (character) => `\\${character}`);
}

function pathOnly(url: string): string {
  return url.replace(/[?#].*$/, '');
}

/** Follows internal redirect chains so that each old URL needs one hop only. */
function resolveLegacy(legacy: Redirect[]): Map<string, Redirect> {
  const bySource = new Map(legacy.map((redirect) => [redirect.source, redirect]));
  const resolved = new Map<string, Redirect>();
  for (const redirect of legacy) {
    let destination = redirect.destination;
    let permanent = redirect.permanent;
    const seen = new Set([redirect.source]);
    while (destination.startsWith('/')) {
      const next = bySource.get(pathOnly(destination));
      if (!next) break;
      if (seen.has(next.source)) throw new Error(`Redirect loop at ${redirect.source}`);
      seen.add(next.source);
      destination = next.destination;
      permanent = permanent && next.permanent;
    }
    resolved.set(redirect.source, {
      source: redirect.source,
      destination: destination.startsWith('/') ? newDocsUrl(destination) : destination,
      permanent,
    });
  }
  return resolved;
}

/**
 * Builds the complete map. Each page gets its HTML URL and its Open Graph image URL, and
 * each Markdown page also gets its `.md` URL. Each public file and app route keeps its path under `/docs`. Old redirects go
 * straight to their final destination, and they win over a page at the same path, as the
 * redirects in next.config.mjs do. The output is sorted by source.
 */
export function buildHostRedirects(input: HostRedirectInput): Redirect[] {
  const map = new Map<string, Redirect>();
  for (const redirect of resolveLegacy(input.legacy).values()) {
    map.set(redirect.source, redirect);
  }
  const keep = (path: string) => {
    if (!map.has(path))
      map.set(path, { source: path, destination: newDocsUrl(path), permanent: true });
  };

  keep('/');
  for (const page of input.pages) {
    if (page === '/') continue;
    keep(page);
    keep(`/og${page}`);
  }
  for (const page of input.markdownPages) {
    // A page that an old redirect hides has no Markdown URL, but it keeps its image.
    if (page !== '/' && !input.legacy.some((redirect) => redirect.source === page)) {
      keep(`${page}.md`);
    }
  }
  for (const file of input.publicFiles) {
    if (!SERVED_BY_REDIRECT_PROJECT.includes(file)) keep(file);
  }
  for (const route of input.routes) {
    if (!SERVED_BY_REDIRECT_PROJECT.includes(route)) keep(route);
  }

  const redirects = [...map.values()].sort((a, b) =>
    a.source < b.source ? -1 : a.source > b.source ? 1 : 0,
  );
  if (redirects.length > MAX_VERCEL_REDIRECTS) {
    throw new Error(
      `${redirects.length} redirects exceed the Vercel limit of ${MAX_VERCEL_REDIRECTS}`,
    );
  }
  return redirects;
}

/** Gives the vercel.json of the redirect project. */
export function renderVercelJson(redirects: Redirect[]): string {
  const config = {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    framework: null,
    installCommand: '',
    buildCommand: '',
    outputDirectory: 'public',
    trailingSlash: false,
    // Build only when this directory changes; other docs commits do not change the map.
    ignoreCommand: 'git diff --quiet HEAD^ HEAD -- .',
    redirects: redirects.map((redirect) => ({
      source: escapeSource(redirect.source),
      destination: redirect.destination,
      permanent: redirect.permanent,
    })),
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

/** Gives the old-host sitemap: every old page URL, sorted, so that crawlers find each redirect. */
export function renderOldSitemap(pages: string[]): string {
  const urls = ['/', ...pages.filter((page) => page !== '/').sort()]
    .map((page) => `<url><loc>${OLD_DOCS_ORIGIN}${page === '/' ? '/' : page}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Gives the old-host robots.txt. Crawlers must be able to fetch old URLs to see the redirects. */
export function renderOldRobots(): string {
  return [
    '# docs.steel.dev moved to https://steel.dev/docs. Each old URL redirects there.',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${OLD_DOCS_ORIGIN}/sitemap.xml`,
    `Sitemap: ${NEW_DOCS_URL}/sitemap.xml`,
    '',
  ].join('\n');
}
