import { Github, Globe } from 'lucide-react';
import Link from 'next/link';

interface Props {
  handle: string;
  name: string;
  avatar: string;
  website?: string;
}

function prettyHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Banner shown at the top of each /cookbook/authors/<handle> page.
// Mirrors the avatar source used by RecipeMeta (authors.yaml override or
// the GitHub avatar redirect) and surfaces the handle's GitHub profile
// plus an optional website pulled from authors.yaml.
export function AuthorProfile({ handle, name, avatar, website }: Props) {
  return (
    <div className="not-prose my-6 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatar}
        alt=""
        width={64}
        height={64}
        className="h-16 w-16 rounded-full bg-background"
      />
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-xl font-medium leading-tight">{name}</h2>
          <p className="text-sm text-muted-foreground">@{handle}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <Link
            href={`https://github.com/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-primary"
          >
            <Github className="h-3.5 w-3.5" aria-hidden />
            github.com/{handle}
          </Link>
          {website && (
            <Link
              href={website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-primary"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden />
              {prettyHost(website)}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
