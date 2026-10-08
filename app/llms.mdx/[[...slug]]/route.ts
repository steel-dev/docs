import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText, shouldIncludeLLMPage } from '@/lib/get-llm-text';
import { appendMarkdownVaryHeader } from '@/lib/markdown-negotiation';
import { source } from '@/lib/source';

export const revalidate = false;

const MARKDOWN_NOT_FOUND = `# Page not found

The requested Steel documentation page does not exist or is unavailable in this representation.

- [Documentation home](/)
- [Documentation index](/llms.txt)
- [Sitemap](/sitemap.xml)
- [API catalog](/.well-known/api-catalog)
`;

function getPage(slug?: string[]) {
  let page = source.getPage(slug);
  if (!page && slug?.[0] !== 'en') {
    page = source.getPage(['en', ...(slug ?? [])]);
  }

  return page;
}

function getMarkdownHeaders(): Headers {
  const headers = new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    'X-Robots-Tag': 'noindex',
  });
  appendMarkdownVaryHeader(headers);
  return headers;
}

function getNotFoundResponse(): NextResponse {
  return new NextResponse(MARKDOWN_NOT_FOUND, {
    status: 404,
    headers: getMarkdownHeaders(),
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return getNotFoundResponse();

  // Pages opted out of LLM surfaces (llm: false) are not served as markdown.
  if (!shouldIncludeLLMPage(page)) return getNotFoundResponse();

  // This markdown duplicates the canonical HTML page, so keep it out of search
  // results. Crawlers may still fetch it: noindex only suppresses indexing.
  return new NextResponse(await getLLMText(page, { indexPointer: true }), {
    headers: getMarkdownHeaders(),
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
