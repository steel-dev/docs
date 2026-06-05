import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { appendMarkdownVaryHeader, shouldServeMarkdown } from '@/lib/markdown-negotiation';

const EXCLUDED_EXACT_PATHS = new Set([
  '/.well-known/llms.txt',
  '/favicon.ico',
  '/llms-full.txt',
  '/llms.txt',
  '/overview/llms-full.txt',
  '/robots.txt',
  '/sitemap.xml',
]);

const EXCLUDED_PATH_PREFIXES = ['/_next', '/api', '/llms.mdx', '/og'];
const EXCLUDED_ASSET_EXTENSIONS = new Set([
  '.avif',
  '.css',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.map',
  '.otf',
  '.pdf',
  '.png',
  '.svg',
  '.ttf',
  '.txt',
  '.webp',
  '.woff',
  '.woff2',
  '.xml',
  '.zip',
]);

function isProgrammaticClient(request: NextRequest): boolean {
  // Browsers always send Sec-Fetch-Dest; curl/WebFetch/python-requests do not
  return !request.headers.has('sec-fetch-dest');
}

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function hasExcludedAssetExtension(pathname: string): boolean {
  const extension = pathname.match(/\.[^./]+$/)?.[0]?.toLowerCase();
  return extension ? EXCLUDED_ASSET_EXTENSIONS.has(extension) : false;
}

function isNegotiableDocsPath(pathname: string): boolean {
  if (EXCLUDED_EXACT_PATHS.has(pathname)) return false;
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => matchesPathPrefix(pathname, prefix))) return false;

  return !hasExcludedAssetExtension(pathname);
}

function isNegotiableMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD';
}

function withMarkdownVary(response: NextResponse): NextResponse {
  appendMarkdownVaryHeader(response.headers);
  return response;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isNegotiableMethod(request.method)) {
    return NextResponse.next();
  }

  const wantsMarkdown = shouldServeMarkdown(request.headers);

  if (pathname === '/' && (wantsMarkdown || isProgrammaticClient(request))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/llms.txt';
    return withMarkdownVary(NextResponse.redirect(redirectUrl));
  }

  if (!isNegotiableDocsPath(pathname)) {
    return NextResponse.next();
  }

  if (wantsMarkdown) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/llms.mdx${pathname}`;
    return withMarkdownVary(NextResponse.rewrite(rewriteUrl));
  }

  return withMarkdownVary(NextResponse.next());
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, API routes, and static files
    '/((?!_next|api/).*)', // This excludes /api/ but includes /apis/
  ],
};
