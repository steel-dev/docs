import type { InferPageType } from 'fumadocs-core/source';
import matter from 'gray-matter';
import { source } from '@/lib/source';
import { stripFaqFences } from '@/lib/strip-faq-fences';

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

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = stripFaqFences(page.data.content);

  return `# ${page.data.title}
URL: ${page.url}

${processed}`;
}
