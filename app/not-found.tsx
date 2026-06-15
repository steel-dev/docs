// ABOUTME: Standalone 404 page for the docs site with on-brand navigation cards.
// ABOUTME: Self-owns the dark theme since the runtime not-found shell drops the root layout.
import type { Metadata } from 'next';
import { Card, Cards } from '@/components/card';
import { LlmsHintCard } from '@/components/home/llms-hint-card';

export const metadata: Metadata = {
  title: 'Page not found',
  other: {
    'ai-context':
      'Steel documentation 404. For an LLM-optimized index of all Steel docs (Sessions API, CAPTCHAs, proxies, SDKs), fetch https://docs.steel.dev/llms.txt',
  },
};

export default function NotFound() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-2xl space-y-10">
        <div className="space-y-3 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Error 404
          </p>
          <h1 className="text-3xl font-regular">Page not found</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            The page you are looking for doesn&apos;t exist or has been moved. Here&apos;s where to
            head next.
          </p>
        </div>
        <Cards>
          <Card
            href="/overview/sessions-api/quickstart"
            title="Quickstart"
            description="Spin up your first Steel session in a few minutes."
            tags={['Guide', 'Quickstart']}
          />
          <Card
            href="/overview/skills"
            title="Steel Skills"
            description="Install Steel Skills so coding agents can use Steel cloud browsers."
            tags={['Agents', 'Skills']}
          />
        </Cards>
        <LlmsHintCard />
      </div>
    </div>
  );
}
