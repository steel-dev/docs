import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DOCS_PATH_PREFIX, stripDocsPath } from '@/lib/docs-path';
import {
  appendMarkdownVaryHeader,
  isNegotiableDocsPath,
  resolveMarkdownPath,
  shouldServeMarkdown,
} from '@/lib/markdown-negotiation';

function isNegotiableMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD';
}

function withMarkdownVary(response: NextResponse): NextResponse {
  appendMarkdownVaryHeader(response.headers);
  if (DOCS_PATH_PREFIX) {
    // Negotiated HTML/Markdown must not share a CDN cache entry. Keep Next's
    // router Vary tokens; do not assume Vary alone configures Vercel's cache.
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  }
  return response;
}

export default function middleware(request: NextRequest) {
  const pathname = stripDocsPath(request.nextUrl.pathname);

  if (!isNegotiableMethod(request.method)) {
    return NextResponse.next();
  }

  // An explicit .md request gets markdown unconditionally, no header sniffing
  const markdownPath = resolveMarkdownPath(pathname);
  if (markdownPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/llms.mdx${markdownPath}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  const wantsMarkdown = shouldServeMarkdown(request.headers);

  if (pathname === '/') {
    if (wantsMarkdown) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = '/AGENTS.md';
      return withMarkdownVary(NextResponse.rewrite(rewriteUrl));
    }

    return withMarkdownVary(NextResponse.next());
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
