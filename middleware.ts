import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // Allow the request to continue without any i18n processing
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
