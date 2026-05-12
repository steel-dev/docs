import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { DocsLayout } from '@/components/layouts/docs';
import { getSteelBrowserStars } from '@/lib/github-stars';
import { source } from '@/lib/source';

export default async function Layout({ children }: { children: ReactNode }) {
  const stars = await getSteelBrowserStars();
  return (
    <DocsLayout {...baseOptions} tree={source.pageTree} stars={stars}>
      {children}
    </DocsLayout>
  );
}
