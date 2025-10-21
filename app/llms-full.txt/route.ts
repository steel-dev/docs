import { getLLMText } from '@/lib/get-llm-text';
import { source } from '@/lib/source';

// cached forever
export const revalidate = false;

export async function GET() {
  const scan = source
    .getPages()
    .filter((page) => !page.url.includes("/changelog/"))
    .map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}
