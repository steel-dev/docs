/** Public URL boundary; an empty prefix preserves the existing subdomain build. */
export const DOCS_PATH_PREFIX = process.env.NEXT_PUBLIC_DOCS_PATH_PREFIX || '';
if (DOCS_PATH_PREFIX !== '' && DOCS_PATH_PREFIX !== '/docs') {
  throw new Error('NEXT_PUBLIC_DOCS_PATH_PREFIX must be empty or /docs');
}
export const DOCS_ORIGIN = process.env.NEXT_PUBLIC_DOCS_ORIGIN || 'https://docs.steel.dev';
if (new URL(DOCS_ORIGIN).origin !== DOCS_ORIGIN) {
  throw new Error('NEXT_PUBLIC_DOCS_ORIGIN must be an origin without a path');
}

export function docsPath(path: string): string {
  if (DOCS_PATH_PREFIX && /^https:\/\/docs\.steel\.dev(?:[/?#]|$)/.test(path)) {
    const url = new URL(path);
    path = `${url.pathname}${url.search}${url.hash}`;
  }
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  if (
    !DOCS_PATH_PREFIX ||
    path === DOCS_PATH_PREFIX ||
    path.startsWith(`${DOCS_PATH_PREFIX}/`) ||
    path.startsWith(`${DOCS_PATH_PREFIX}?`) ||
    path.startsWith(`${DOCS_PATH_PREFIX}#`)
  )
    return path;
  return `${DOCS_PATH_PREFIX}${path === '/' ? '' : path}`;
}

export function stripDocsPath(path: string): string {
  if (DOCS_PATH_PREFIX && path === DOCS_PATH_PREFIX) return '/';
  return DOCS_PATH_PREFIX && path.startsWith(`${DOCS_PATH_PREFIX}/`)
    ? path.slice(DOCS_PATH_PREFIX.length)
    : path;
}

export function docsUrl(path = '/'): string {
  return new URL(docsPath(path), DOCS_ORIGIN).href;
}
