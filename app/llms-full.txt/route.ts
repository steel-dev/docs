import { AGENT_INSTRUCTIONS } from '@/lib/agent-instructions';
import { getLLMText, shouldIncludeLLMPage } from '@/lib/get-llm-text';
import { source } from '@/lib/source';

// cached forever
export const revalidate = false;

export async function GET() {
  const scan = source
    .getPages()
    .filter((page) => !page.url.includes('/changelog/') && shouldIncludeLLMPage(page))
    .map((page) => getLLMText(page));
  const scanned = await Promise.all(scan);

  return new Response(AGENT_INSTRUCTIONS + scanned.join('\n\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
