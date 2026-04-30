'use client';

import type { PageTree } from 'fumadocs-core/server';
import { TreeContextProvider } from 'fumadocs-ui/contexts/tree';
import { ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { baseOptions } from '@/app/layout.config';
import { Sidebar } from '@/components/layouts/docs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DocsLogo } from '@/components/ui/icon';
import { isActive } from '@/lib/is-active';
import { cn } from '@/lib/utils';
import { SearchToggle } from '../layout/search-toggle';

interface MobileNavigationProps {
  isOpen?: boolean;
  onClose?: () => void;
  tree?: PageTree.Root;
}

export function MobileNavigation({ isOpen = false, onClose, tree }: MobileNavigationProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const pathname = usePathname();

  const isInDocsContext = !!tree;

  if (!isOpen) return null;

  const handleClose = () => {
    setActiveSubmenu(null);
    onClose?.();
  };

  const renderMainLinks = () => (
    <>
      {baseOptions.links
        ?.filter((item) => {
          if (!('url' in item) || !item.url) return true;

          const activeMode =
            'active' in item ? (item.active ?? 'url') : item.type === 'menu' ? 'nested-url' : 'url';
          if (activeMode === 'none') return true;

          return !isActive(item.url, pathname, activeMode === 'nested-url');
        })
        .map((item, index) => (
          <div key={index}>
            {item.type === 'menu' ? (
              <button
                type="button"
                className="w-full flex items-center justify-between px-2 py-2 text-[0.75rem] leading-none tracking-wide font-mono font-bold hover:bg-accent transition-colors text-left"
                onClick={() => setActiveSubmenu(String(item.text))}
              >
                <span className="text-muted-foreground">{item.text}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : (
              'url' in item && (
                <Link
                  href={item.url as string}
                  onClick={handleClose}
                  className="flex items-center justify-between px-2 py-2 text-[0.75rem] leading-none tracking-wide font-mono font-bold hover:bg-accent transition-colors"
                >
                  {item.text}
                </Link>
              )
            )}
          </div>
        ))}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-200"
        onClick={handleClose}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
        tabIndex={-1}
      />

      <div className="fixed inset-0 bg-background transition-transform duration-200">
        <div className="flex items-center justify-between p-3 bg-background">
          <button
            type="button"
            onClick={handleClose}
            className="h-8 w-8 flex items-center justify-center"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 flex justify-center">
            {activeSubmenu ? (
              <Breadcrumb className="text-lg">
                <BreadcrumbList className="gap-1">
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      asChild
                      className="text-muted-foreground hover:text-primary cursor-pointer !font-mono !text-base"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubmenu(null);
                        }}
                      >
                        ..
                      </button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-muted-foreground">/</BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-primary !font-mono !text-base">
                      {activeSubmenu}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            ) : (
              <Link href="/" onClick={handleClose}>
                <DocsLogo />
              </Link>
            )}
          </div>
          <SearchToggle />
        </div>

        <nav className="overflow-y-auto h-[calc(100dvh-64px)] bg-background px-3">
          <div className="py-2">
            {activeSubmenu ? (
              (
                baseOptions.links?.find(
                  (item: any) => item.text === activeSubmenu && item.type === 'menu',
                ) as any
              )?.items?.map((subItem: any) => {
                if (subItem.type === 'custom' || !('url' in subItem) || !subItem.url) return null;

                return (
                  <Link
                    key={subItem.url}
                    href={subItem.url}
                    onClick={handleClose}
                    className={cn(
                      'flex items-center justify-between px-2 py-3 text-lg hover:bg-accent transition-colors',
                      subItem.isNew && 'gap-3 justify-start',
                    )}
                  >
                    <span className="font-mono text-muted-foreground">{subItem.text}</span>
                    {subItem.isNew && (
                      <span className="font-regular text-[10px] px-1 py-0.5 rounded uppercase bg-orange-500 dark:bg-brand-orange text-neutral-950 border-none">
                        New
                      </span>
                    )}
                  </Link>
                );
              })
            ) : (
              <>
                {renderMainLinks()}

                {isInDocsContext ? (
                  <TreeContextProvider tree={tree}>
                    <div className="bg-background pt-2">
                      <div className="[&_aside]:!relative [&_aside]:!top-auto [&_aside]:!w-full [&_aside]:!h-auto [&_aside]:!visible [&_aside]:!px-0 [&_aside]:!pt-0 [&_aside]:!pb-10">
                        <Sidebar />
                      </div>
                    </div>
                  </TreeContextProvider>
                ) : null}
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
