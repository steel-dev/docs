import { Github } from 'lucide-react';
import Link from 'next/link';

interface Props {
  href: string;
  path: string;
}

// Small "open this recipe on GitHub" badge rendered at the top of each
// recipe page (or inside each language tab on merged concept pages). The
// path (e.g., `examples/playwright-ts`) matches the folder in the
// steel-cookbook repo, so readers can jump straight to runnable source.
export function SourceLink({ href, path }: Props) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="not-prose my-4 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-primary"
    >
      <Github className="h-3.5 w-3.5" aria-hidden />
      {path}
    </Link>
  );
}
