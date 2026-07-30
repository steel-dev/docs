import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
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
