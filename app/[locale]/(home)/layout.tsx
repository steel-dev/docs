import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
// import { HomeLayout } from '@/components/layouts/home';
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout {...baseOptions} tree={source.pageTree}>
      {children}
    </DocsLayout>
  );
}
