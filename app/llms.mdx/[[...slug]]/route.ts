import { notFound } from 'next/navigation';
import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText } from '@/lib/get-llm-text';
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

  const headers = new Headers({ 'Content-Type': 'text/markdown; charset=utf-8' });
  appendMarkdownVaryHeader(headers);

  return new NextResponse(await getLLMText(page), {
    headers,
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
