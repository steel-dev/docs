'use client';

import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

const CLI_INSTALL_COMMAND = 'curl -LsSf https://setup.steel.dev | sh';

export function CLIInstallCard() {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="relative block rounded-lg bg-border p-[1.5px]">
      <div className="h-full space-y-4 rounded-[calc(0.5rem-1.5px)] bg-card p-5">
        <div className="space-y-1">
          <h3 className="text-lg">Get Started with CLI + Agent Skill</h3>
          <p className="text-muted-foreground text-sm text-stone-500">
            Install Steel CLI and the steel-browser skill so your agent can control a browser.
          </p>
        </div>
        <button
          type="button"
          aria-label={`Copy command: ${CLI_INSTALL_COMMAND}`}
          className={cn(
            'flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-[7px]',
            'font-mono text-[12.5px] text-foreground transition-colors',
            copied
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-background hover:border-primary/30 hover:bg-accent/30',
          )}
          onClick={() => {
            navigator.clipboard.writeText(CLI_INSTALL_COMMAND);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          <span className="select-none text-muted-foreground/50">$</span>
          <span className="min-w-0 flex-1 overflow-x-auto text-left whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {CLI_INSTALL_COMMAND}
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
