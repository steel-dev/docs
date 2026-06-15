// ABOUTME: Card that points AI agents to the llms-full.txt index with a copyable URL.
// ABOUTME: Mirrors CLIInstallCard styling; used on the 404 page to onboard agents.
'use client';

import { Check, Copy, Sparkles } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

const LLMS_URL = 'https://docs.steel.dev/llms-full.txt';

export function LlmsHintCard() {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="relative block rounded-lg bg-border p-[1.5px]">
      <div className="h-full space-y-4 rounded-[calc(0.5rem-1.5px)] bg-card p-5">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Building with an AI agent?
          </h3>
          <p className="text-muted-foreground text-sm text-stone-500">
            Point your coding agent to docs.steel.dev/llms-full.txt for a fast start with Steel.
          </p>
        </div>
        <button
          type="button"
          aria-label={`Copy URL: ${LLMS_URL}`}
          className={cn(
            'flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-[7px]',
            'font-mono text-[12.5px] text-foreground transition-colors',
            copied
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-background hover:border-primary/30 hover:bg-accent/30',
          )}
          onClick={() => {
            navigator.clipboard.writeText(LLMS_URL);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          <span className="select-none text-muted-foreground/50">$</span>
          <span className="min-w-0 flex-1 overflow-x-auto text-left whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            curl {LLMS_URL} and save it for future reference
          </span>
          {copied ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
