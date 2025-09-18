import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { DocsLayout } from '@/components/layouts/docs';
import { source } from '@/lib/source';
// import { HomeLayout } from "fumadocs-ui/layouts/home";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout {...baseOptions} tree={source.pageTree}>
      {children}
    </DocsLayout>
  );
}
