'use client';

import { Check, Copy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface Props {
  // CLI-facing identifier (basename of registry.yaml's `path`, e.g.
  // `playwright-ts`). Mirrors the cli's cli_slug helper; cookbook's
  // verify_registry.py guarantees uniqueness so we can use it directly.
  slug: string;
}

// Terminal-styled "scaffold this recipe" card placed at the top of every
// recipe page (or per-language tab on multi-variant concepts). Visually
// echoes the install card in steel/apps/web (apps/web/src/pages/quickstart
// /components/cli-instruction-card.tsx) so the cookbook scaffold flow
// looks like a natural continuation of the install flow on steel.dev.
//
// The CLI's HEAD fallback covers the case where this docs build
// advertises a slug that the user's pinned CLI doesn't know yet, so the
// command stays valid even when the two repos drift.
export function RecipeQuickstart({ slug }: Props) {
  const command = `steel forge ${slug}`;
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    void navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex h-10 items-center gap-2 border-b border-border px-4">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        </div>
        <span className="ml-1 text-xs text-muted-foreground">Terminal</span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Copied' : 'Copy command'}
          className="group flex cursor-pointer items-center justify-between gap-4 rounded-md bg-neutral-100 px-4 py-3 text-left font-mono transition-colors hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600"
        >
          <span className="text-sm text-foreground">
            <span className="mr-2 text-muted-foreground">$</span>
            {command}
          </span>
          <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              // Mirror lucide's Copy (front: bottom-right, back: top-left) so
              // it matches the install card on steel/apps/web, where the
              // copy glyph has its front square on the bottom-LEFT.
              <Copy className="h-4 w-4 -scale-x-100" />
            )}
          </span>
        </button>
        <p className="text-xs text-muted-foreground">
          Scaffolds a starter project locally. Requires the{' '}
          <Link
            href="/overview/steel-cli"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Steel CLI
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
