// ABOUTME: Serves the /DESIGN.md agent artifact — Steel's brand design language.
// ABOUTME: Returned as raw markdown so the YAML token block stays machine-readable.
import { DESIGN_MD } from '@/lib/design-md';

export const revalidate = false;

export async function GET() {
  return new Response(DESIGN_MD, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
