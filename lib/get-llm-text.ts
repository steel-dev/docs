import type { InferPageType } from 'fumadocs-core/source';
import matter from 'gray-matter';
import { DOCS_ORIGIN, DOCS_PATH_PREFIX, docsPath, stripDocsPath } from '@/lib/docs-path';
import { cleanMdxForLLM, mapMarkdownLinks } from '@/lib/llm-markdown';
import { source } from '@/lib/source';

export function shouldIncludeLLMPage(page: InferPageType<typeof source>) {
  if (page.data.llm === false) return false;

  const rawContent = page.data.content;
  if (typeof rawContent !== 'string') return true;

  try {
    return matter(rawContent).data.llm !== false;
  } catch {
    return true;
  }
}

const SITE_URL = (process.env.LLMS_BASE_URL || `${DOCS_ORIGIN}${DOCS_PATH_PREFIX}`).replace(
  /\/$/,
  '',
);

export const LLMS_INDEX_POINTER = `> Full docs index: ${SITE_URL}/llms.txt`;

export async function getLLMText(
  page: InferPageType<typeof source>,
  options: { indexPointer?: boolean } = {},
) {
  const processed = mapMarkdownLinks(cleanMdxForLLM(page.data.content), docsPath);
  const pointer = options.indexPointer ? `${LLMS_INDEX_POINTER}\n\n` : '';

  return `${pointer}# ${page.data.title}
URL: ${SITE_URL}${stripDocsPath(page.url)}

${processed}`;
}
