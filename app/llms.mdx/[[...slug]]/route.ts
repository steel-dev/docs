import { notFound } from 'next/navigation';
import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText, shouldIncludeLLMPage } from '@/lib/get-llm-text';
import { appendMarkdownVaryHeader } from '@/lib/markdown-negotiation';
import { source } from '@/lib/source';

export const revalidate = false;

function getPage(slug?: string[]) {
  let page = source.getPage(slug);
  if (!page && slug?.[0] !== 'en') {
    page = source.getPage(['en', ...(slug ?? [])]);
  }

  return page;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();

  // Pages opted out of LLM surfaces (llm: false) are not served as markdown.
  if (!shouldIncludeLLMPage(page)) notFound();

  // This markdown duplicates the canonical HTML page, so keep it out of search
  // results. Crawlers may still fetch it: noindex only suppresses indexing.
  const headers = new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    'X-Robots-Tag': 'noindex',
  });
  appendMarkdownVaryHeader(headers);

  return new NextResponse(await getLLMText(page, { indexPointer: true }), {
    headers,
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
