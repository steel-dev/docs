// ABOUTME: Serves the /AGENTS.md agent guide as markdown.
// ABOUTME: Content is the shared AGENT_INSTRUCTIONS block with the llms.txt index pointer.
import { AGENT_INSTRUCTIONS } from '@/lib/agent-instructions';
import { LLMS_INDEX_POINTER } from '@/lib/get-llm-text';

export const revalidate = false;

export async function GET() {
  return new Response(`${LLMS_INDEX_POINTER}\n\n${AGENT_INSTRUCTIONS}`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
