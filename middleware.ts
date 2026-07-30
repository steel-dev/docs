import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  appendMarkdownVaryHeader,
  isNegotiableDocsPath,
  resolveMarkdownPath,
  shouldServeMarkdown,
} from '@/lib/markdown-negotiation';

function isProgrammaticClient(request: NextRequest): boolean {
  // Browsers always send Sec-Fetch-Dest; curl/WebFetch/python-requests do not
  return !request.headers.has('sec-fetch-dest');
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

  // An explicit .md request gets markdown unconditionally, no header sniffing
  const markdownPath = resolveMarkdownPath(pathname);
  if (markdownPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/llms.mdx${markdownPath}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  const wantsMarkdown = shouldServeMarkdown(request.headers);

  // The homepage has no MDX page behind it, so markdown clients get the agent
  // guide, which opens with a pointer to the /llms.txt index. Serving it in
  // place keeps negotiation on the requested URL instead of redirecting away.
  if (pathname === '/' && (wantsMarkdown || isProgrammaticClient(request))) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = '/AGENTS.md';
    return withMarkdownVary(NextResponse.rewrite(rewriteUrl));
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
