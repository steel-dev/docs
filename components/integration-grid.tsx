import Link from 'fumadocs-core/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  BashIcon,
  BrowserUseIcon,
  ClaudeIcon,
  Cloud,
  Container,
  GeminiIcon,
  KeyIcon,
  MagicIcon,
  OpenAIIcon,
  PlaywrightIcon,
  PuppeteerIcon,
  SeleniumIcon,
} from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { source } from '@/lib/source';

interface IntegrationMeta {
  icon: ReactNode;
  tag: string;
}

const INTEGRATION_META: Record<string, IntegrationMeta> = {
  agentkit: { icon: <Container />, tag: 'Agent Framework' },
  agno: { icon: <Container />, tag: 'Agent Framework' },
  'ai-sdk': { icon: <Container />, tag: 'Agent Framework' },
  'browser-use': { icon: <BrowserUseIcon />, tag: 'Browser Agent' },
  'claude-code': { icon: <ClaudeIcon />, tag: 'Coding Agent' },
  'claude-computer-use': { icon: <ClaudeIcon />, tag: 'Computer Use' },
  codex: { icon: <OpenAIIcon />, tag: 'Coding Agent' },
  crewai: { icon: <Cloud />, tag: 'Multi-Agent' },
  'gemini-computer-use': { icon: <GeminiIcon />, tag: 'Computer Use' },
  'hermes-agent': { icon: <BashIcon />, tag: 'Coding Agent' },
  magnitude: { icon: <Container />, tag: 'Browser Agent' },
  notte: { icon: <Container />, tag: 'Browser Agent' },
  'openai-agents-sdk': { icon: <OpenAIIcon />, tag: 'Agent Framework' },
  'openai-computer-use': { icon: <OpenAIIcon />, tag: 'Computer Use' },
  openclaw: { icon: <BashIcon />, tag: 'Coding Agent' },
  'pi-agent': { icon: <BashIcon />, tag: 'Coding Agent' },
  playwright: { icon: <PlaywrightIcon />, tag: 'Browser Library' },
  puppeteer: { icon: <PuppeteerIcon />, tag: 'Browser Library' },
  replit: { icon: <Cloud />, tag: 'Platform' },
  selenium: { icon: <SeleniumIcon />, tag: 'Browser Library' },
  'stackblitz-bolt.new': { icon: <Cloud />, tag: 'Platform' },
  stagehand: { icon: <MagicIcon />, tag: 'Browser Agent' },
  x402: { icon: <KeyIcon />, tag: 'Protocol' },
};

export function IntegrationGrid() {
  const pages = source
    .getPages()
    .filter((p) => {
      const segs = p.url.split('/').filter(Boolean);
      return segs[0] === 'integrations' && segs.length === 2;
    })
    .sort((a, b) => (a.data.title ?? '').localeCompare(b.data.title ?? ''));

  return (
    <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {pages.map((p) => {
        const slug = p.url.split('/').pop() ?? p.url;
        const meta = INTEGRATION_META[slug];
        const title = p.data.title ?? slug;
        const description = p.data.description ?? '';

        return (
          <Link
            key={p.url}
            href={p.url}
            className="not-prose group relative block rounded-lg p-6 transition-all duration-200 ease-in-out hover:bg-card"
          >
            <div className="flex items-start gap-4">
              {meta?.icon && (
                <div className="shrink-0 w-fit rounded-md bg-neutral-150 dark:bg-neutral-700 group-hover:bg-white dark:group-hover:bg-neutral-950 p-2.5 text-muted-foreground transition-colors duration-200 [&_svg]:size-5">
                  {meta.icon}
                </div>
              )}
              <h3 className="flex-1 min-w-0 font-normal leading-tight text-card-foreground">
                {title}
              </h3>
              {meta?.tag && (
                <Badge
                  variant="outline"
                  className={cn(
                    'uppercase rounded-md transition-colors h-fit',
                    'text-card-foreground bg-accent border border-border shadow-md',
                  )}
                >
                  {meta.tag}
                </Badge>
              )}
            </div>
            {description && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
