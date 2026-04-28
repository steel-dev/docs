import { Github } from 'lucide-react';
import Link from 'next/link';

interface AuthorMeta {
  handle: string;
  name: string;
  avatar: string;
}

interface Props {
  href: string;
  path: string;
  authors: AuthorMeta[];
  updated?: string;
}

// Render a registry date (YYYY-MM-DD) as "Apr 23, 2026". Falls back to the
// raw string if the input doesn't parse.
function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// Compact metadata strip shown at the top of every recipe page (or inside
// each language tab on merged concept pages). Combines the GitHub source
// link, stacked author avatars + credits, and the last-updated date for
// the variant. Cards show the stable "created" date separately, so
// "Updated" here is unambiguous.
export function RecipeMeta({ href, path, authors, updated }: Props) {
  return (
    <div className="not-prose my-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <Link
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 font-mono transition-colors hover:border-muted-foreground hover:text-primary"
      >
        <Github className="h-3.5 w-3.5" aria-hidden />
        {path}
      </Link>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {authors.length > 0 && (
          <span className="inline-flex items-center gap-2">
            <span className="sr-only">Contributors: </span>
            <span className="flex -space-x-1.5">
              {authors.map((author) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={author.handle}
                  src={author.avatar}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full border-2 border-background bg-card"
                />
              ))}
            </span>
            <span>{authors.map((a) => a.name).join(', ')}</span>
          </span>
        )}
        {updated && (
          <span>
            Updated <time dateTime={updated}>{formatDate(updated)}</time>
          </span>
        )}
      </div>
    </div>
  );
}
