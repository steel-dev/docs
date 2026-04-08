import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MARKDOWN_TYPES = ['text/markdown', 'text/x-markdown', 'text/plain'];

function isMarkdownPreferred(request: NextRequest): boolean {
  const accept = request.headers.get('accept') ?? '';
  return MARKDOWN_TYPES.some((type) => accept.includes(type));
}

function isProgrammaticClient(request: NextRequest): boolean {
  // Browsers always send Sec-Fetch-Dest; curl/WebFetch/python-requests do not
  return !request.headers.has('sec-fetch-dest');
}

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' && isProgrammaticClient(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/llms.txt';
    return NextResponse.redirect(redirectUrl);
  }

  if (isMarkdownPreferred(request) && !pathname.startsWith('/llms') && !pathname.endsWith('.mdx')) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/llms.mdx${pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match .md files
    '/(.*).md',
    '/docs/(.*).md',
    // Match all paths except Next.js internals, API routes, and static files
    '/((?!_next|api/).*)', // This excludes /api/ but includes /apis/
  ],
};
