import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DOCS_ORIGIN, DOCS_PATH_PREFIX } from '@/lib/docs-path';

export const dynamic = 'force-static';

/** Path-mode version of the existing catalog; keep its root-mode source intact. */
export async function GET() {
  const catalog = await readFile(join(process.cwd(), 'public/.well-known/api-catalog'), 'utf8');
  return new Response(
    catalog.replaceAll('https://docs.steel.dev', `${DOCS_ORIGIN}${DOCS_PATH_PREFIX}`),
    {
      headers: {
        'Content-Type':
          'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      },
    },
  );
}
