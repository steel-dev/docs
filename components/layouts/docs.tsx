"use client";

import { cva } from "class-variance-authority";
import { usePathname } from "fumadocs-core/framework";
import Link from "fumadocs-core/link";
import type { PageTree } from "fumadocs-core/server";
import { useSidebar } from "fumadocs-ui/contexts/sidebar";
import { TreeContextProvider, useTreeContext } from "fumadocs-ui/contexts/tree";
import { CopyLLMSButton } from "components/llmsbutton";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  SidebarIcon,
} from "lucide-react";
import React, {
  type ButtonHTMLAttributes,
  type ReactNode,
  useMemo,
} from "react";
import { MobileMenuProvider } from "@/contexts/mobile-menu";
import { useLocalizedNavigation } from "@/hooks/use-localized-navigation";
import { cn } from "@/lib/utils";
import { MobileMenuButton } from "../layout/mobile-menu-button";
import { SearchToggle } from "../layout/search-toggle";
// import { ThemeToggle } from "../layout/theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { DocsLogo, Github, Discord } from "../ui/icon";
import { NavigationMenu, NavigationMenuList } from "../ui/navigation-menu";
import { renderNavItem } from "./links";

export interface DocsLayoutProps {
  tree: PageTree.Root;
  children: ReactNode;
}

export function DocsLayout({ tree, children }: DocsLayoutProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  // const { registerShortcut } = useKeyboardShortcuts();
  const { collapsed } = useSidebar();
  const localizedLinks = useLocalizedNavigation();
  const pathname = usePathname();

  const menuWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [underline, setUnderline] = React.useState<{
    left: number;
    width: number;
    visible: boolean;
  }>({
    left: 0,
    width: 0,
    visible: false,
  });
  const [stars, setStars] = React.useState<number>(5.5);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 45);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const updateUnderline = () => {
      const wrapper = menuWrapperRef.current;
      if (!wrapper) return;
      const activeEl = wrapper.querySelector<HTMLElement>('[data-nav-active="true"]');
      if (!activeEl) {
        setUnderline((prev) => ({ ...prev, visible: false }));
        return;
      }
      const activeRect = activeEl.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const left = Math.max(0, activeRect.left - wrapperRect.left);
      const width = Math.max(0, activeRect.width);

      setUnderline({ left, width, visible: width > 0 });
    };

    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    const id = window.setTimeout(updateUnderline, 0);
    return () => {
      window.removeEventListener('resize', updateUnderline);
      window.clearTimeout(id);
    };
  }, [pathname, localizedLinks]);

  React.useEffect(() => {
    fetch(`https://api.github.com/repos/steel-dev/steel-browser`)
      .then((res) => res.json())
      .then((data) => setStars((Math.round(data.stargazers_count / 100) * 100) / 1000));
  }, []);

  return (
    <MobileMenuProvider>
      <TreeContextProvider tree={tree}>
        <header
          className={cn(
            'sticky top-0 z-50 h-12 transition-all duration-200',
            'bg-background backdrop-blur-md',
            'border-b border-border/50',
          )}
        >
          <nav className="flex flex-row items-center gap-4 size-full px-2 md:px-4">
            {/* Mobile layout */}
            <div className="flex xl:hidden items-center justify-between w-full">
              <MobileMenuButton tree={tree} />
              <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
                <DocsLogo />
              </Link>
              <SearchToggle />
            </div>

            {/* Desktop layout */}
            <div className="hidden xl:flex flex-row items-center gap-4 w-full h-full">
              <div className="flex flex-row items-center gap-4 flex-shrink-0">
                {/* <NavbarSidebarTrigger /> */}
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <DocsLogo />
                </Link>
              </div>

              <div
                ref={menuWrapperRef}
                className="relative h-full flex-1 min-w-0"
              >
                <NavigationMenu className="flex items-center h-full">
                  <NavigationMenuList className="flex flex-row items-center h-full">
                    {localizedLinks?.map((link) => renderNavItem(link))}
                  </NavigationMenuList>
                </NavigationMenu>
                <div
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute bottom-0 h-0 border-b-2 border-white',
                  )}
                  style={{
                    left: underline.left,
                    width: underline.width,
                    opacity: underline.visible ? 1 : 0,
                  }}
                />
              </div>

              <div className="flex flex-shrink-0 items-center justify-end space-x-1 xl:space-x-2 2xl:space-x-3">
                <Link href="https://discord.gg/steel-dev">
                  <Discord fill="#A1A09A" width="16" />
                </Link>
                <Link
                  href="https://github.com/steel-dev/steel-browser"
                  className="text-xs font-mono flex items-center gap-2 transition-colors"
                  color="#A1A0A7"
                >
                  <Github fill="#A1A0A7" width="16" /> {stars}k
                </Link>
                <div className="w-px h-6 bg-zinc-700"></div>
                {/*<CopyLLMSButton />*/}
                <SearchToggle />
                <Button
                  asChild
                  className="bg-yellow-300 font-mono text-neutral-900 flex items-baseline gap-0.5 px-2 xl:px-3 py-2 hover:bg-yellow-400 transition-colors duration-200 group hidden xl:flex flex-shrink-0"
                >
                  <Link href="https://app.steel.dev" target="_blank">
                    Sign in
                    <ArrowUpRight className="w-3.5 h-3.5 translate-y-0.5 group-hover:translate-y-0 transition-transform duration-200" />
                  </Link>
                </Button>
                {/*<ThemeToggle />*/}
              </div>
            </div>
          </nav>
        </header>
        <main
          id="nd-docs-layout"
          className={cn(
            'flex flex-1 flex-row transition-all duration-100',
            collapsed && 'md:pl-[calc(var(--nav-offset)-115px)]',
          )}
        >
          <Sidebar />
          {children}
        </main>
      </TreeContextProvider>
    </MobileMenuProvider>
  );
}

export function Sidebar() {
  const { root } = useTreeContext();
  const { open, collapsed } = useSidebar();
  const pathname = usePathname();

  const children = useMemo(() => {
    const filterCriteria = ['overview', 'integrations', 'cookbook', 'changelog'];

    const shouldFilterItem = (item: PageTree.Node): boolean => {
      const isCurrentSection = filterCriteria.some(
        (criteria) => pathname?.includes(`/${criteria}/`) || pathname === `/${criteria}`,
      );

      if (isCurrentSection) {
        const matchingCriteria = filterCriteria.filter(
          (criteria) => pathname?.includes(`/${criteria}/`) || pathname === `/${criteria}`,
        );

        const belongsToCurrentSection = matchingCriteria.some((criteria) =>
          item.$id?.includes(criteria),
        );

        if (belongsToCurrentSection) {
          return false; // Don't filter out items that belong to current section
        }

        return filterCriteria.some((criteria) => {
          const itemPath = item.$id || '';
          return (
            itemPath === criteria ||
            itemPath.startsWith(`${criteria}`) ||
            itemPath.startsWith(`${criteria}/`) ||
            itemPath.includes(`/${criteria}/`) ||
            itemPath.endsWith(`/${criteria}`)
          );
        });
      }

      return filterCriteria.some((criteria) => {
        // Check if item.$id matches the exact criteria as a path segment
        const itemPath = item.$id || '';
        return (
          itemPath === criteria ||
          itemPath.startsWith(`${criteria}/`) ||
          itemPath.includes(`/${criteria}/`) ||
          itemPath.endsWith(`/${criteria}`)
        );
      });
    };

    function renderItems(items: PageTree.Node[]) {
      const filteredItems = items.filter((item) => !shouldFilterItem(item));
      const numItems = filteredItems.length;

      return filteredItems.map((item, idx, arr) => {
        const isSeperator = (item as any).data?.isSeperator === true;
        const prevIsSeperator = idx > 0 && (arr[idx - 1] as any).data?.isSeperator === true;
        const isFirstSeperatorInRun = isSeperator && !prevIsSeperator;

        return (
          <SidebarItem
            key={item.$id}
            item={item}
            numItems={numItems}
            isFirstSeperatorInRun={isFirstSeperatorInRun}
          >
            {item.type === 'folder' ? renderItems(item.children) : null}
          </SidebarItem>
        );
      });
    }

    return renderItems(root.children);
  }, [root, pathname]);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'fixed flex flex-col shrink-0 pt-4 px-2 pb-10 top-12 z-20 text-base md:text-sm overflow-auto md:sticky md:h-[calc(100dvh-50px)] border-r border-border',
        'max-md:inset-x-0 max-md:bottom-0',
        !open && 'max-md:invisible',
        'md:w-[250px] md:transition-all md:duration-100 ease-linear',
        collapsed && 'md:w-0 md:p-0 md:overflow-hidden md:invisible',
      )}
    >
      {children}
    </aside>
  );
}

export const linkVariants = cva(
  'flex items-center gap-3 w-full rounded-lg text-muted-foreground !font-sans [&_svg]:size-3',
  {
    variants: {
      active: {
        true: 'text-white font-medium',
        false: '',
      },
    },
  },
);

export function NavbarSidebarTrigger(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <button
      type="button"
      aria-label="Collapse Sidebar"
      data-collapsed={collapsed}
      {...props}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-md border border-border hover:bg-neutral-200 dark:bg-neutral-700 transition-colors cursor-pointer',
        'hidden md:flex',
        props.className,
      )}
      onClick={() => {
        setCollapsed((prev) => !prev);
      }}
    >
      <SidebarIcon className="w-4 h-4" />
    </button>
  );
}

export function SidebarItem({
  item,
  children,
  numItems,
  isFirstSeperatorInRun = false,
}: {
  item: PageTree.Node;
  children: ReactNode;
  numItems: number;
  isFirstSeperatorInRun: boolean;
}) {
  const pathname = usePathname();

  const isPathInFolder = (folderItem: PageTree.Node, currentPath: string): boolean => {
    if (folderItem.type !== 'folder') return false;

    if (folderItem.index?.url === currentPath) return true;
    const checkChildren = (children: PageTree.Node[]): boolean => {
      return children.some((child) => {
        if (child.type === 'page' && child.url === currentPath) return true;
        if (child.type === 'folder') {
          if (child.index?.url === currentPath) return true;
          return checkChildren(child.children);
        }
        return false;
      });
    };

    return checkChildren(folderItem.children);
  };

  const shouldExpand =
    item.type === 'folder' &&
    (isPathInFolder(item, pathname) || (item as any).defaultOpen === true);

  const [isOpen, setIsOpen] = React.useState(shouldExpand);

  if (
    item.type === 'page' &&
    item.name === 'Overview' &&
    item.url.includes('/integrations') &&
    !pathname.includes('/integrations')
  ) {
    return null;
  }

  if (item.type === 'page') {
    const sidebarTitle = (item as any).data?.sidebarTitle;
    const displayName = sidebarTitle || item.name;
    const isSeperator = (item as any).data?.isSeperator === true;
    const isRootPage = (item as any).data?.root === true;
    const isActive = pathname === item.url;

    return isSeperator ? (
      <div
        className={cn(
          'text-primary uppercase text-[0.75rem] leading-none tracking-wide font-mono font-bold mb-2 px-2',
          isFirstSeperatorInRun && 'mt-6',
        )}
      >
        <Link href={item.url} className="flex items-center gap-2 flex-1">
          {item.icon}
          {displayName}
          <PageBadges item={item} />
        </Link>
      </div>
    ) : (
      <div className="flex items-center gap-1 div:pt-0.5 first:(div:pt-0) group transition-all duration-100 ease-linear">
        {!isRootPage && numItems > 1 && (
          <div className={cn('h-[100%] w-[1px] bg-[#202020] ml-2', isActive && 'bg-white')} />
        )}
        <Link
          href={item.url}
          className={cn(
            linkVariants({
              active: isActive,
            }),
            isRootPage && ['font-normal font-sans text-sm pl-2'],
            !isRootPage && ['pl-2'],
            isRootPage &&
              pathname === item.url && [
                '[&_.icons]:bg-primary [&_.icons]:border-primary [&_.icons]:text-white dark:[&_.icons]:text-neutral-950',
              ],
            'group-hover:text-primary',
          )}
        >
          <div className="!font-normal text-[0.875rem] flex items-center gap-2 flex-1">
            {item.icon}
            {displayName}
            <PageBadges item={item} />
          </div>
        </Link>
      </div>
    );
  }

  if (item.type === 'separator') {
    return (
      <p className="text-primary uppercase text-[0.75rem] leading-none tracking-wide font-mono font-bold mt-6 mb-2 first:mt-0 px-2">
        {item.name}
      </p>
    );
  }

  const getStringValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return 'folder';
  };

  const accordionValue = getStringValue(item.$id) || getStringValue(item.name) || 'folder';

  return (
    <div className="pl-4">
      <Accordion
        type="single"
        collapsible
        defaultValue={shouldExpand ? accordionValue : undefined}
        className="space-y-0 bg-transparent border-none"
        onValueChange={(value) => setIsOpen(value === accordionValue)}
      >
        <AccordionItem value={accordionValue} className="border-0">
          <AccordionTrigger className="p-0 hover:no-underline [&>svg]:hidden h-auto">
            <div
              className={cn(
                linkVariants({
                  active: item.index ? pathname === item.index.url : false,
                }),
                'justify-between w-full',
                '!font-normal',
              )}
            >
              <div className="!font-normal flex items-center gap-2 flex-1">
                {item.index ? (
                  <Link
                    href={item.index.url}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'flex items-center gap-2 font-sans hover:no-underline',
                      pathname === item.index.url
                        ? 'font-normal text-primary'
                        : 'font-normal text-muted-foreground',
                    )}
                  >
                    {item.index.icon}
                    {item.index.name}
                  </Link>
                ) : (
                  <>
                    {item.icon}
                    {item.name}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.index && <PageBadges item={item.index} />}
                {isOpen ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0 pt-0">
            <div className="border-l flex flex-col">{children}</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function PageBadges({ item }: { item: PageTree.Node }) {
  if (item.type !== 'page') return null;

  const badges: React.ReactNode[] = [];

  const isNew = (item as any).data?.isNew;
  const isLink = (item as any).data?.isLink;

  if (isNew) {
    badges.push(
      <span
        key="new"
        className="font-regular text-[10px] px-1 rounded uppercase bg-yellow-500 dark:bg-yellow-300 text-neutral-950 border-none"
      >
        New
      </span>,
    );
  }
  if (isLink) {
    badges.push(
      <ArrowUpRight
        key="link"
        className="w-3.5 h-3.5 translate-y-0.5 group-hover:translate-y-0 transition-transform duration-200"
      />,
    );
  }

  const openapi = (item as any).data?.openapi;
  const operations = openapi?.operations || [];

  const methods = new Set(operations.map((op: any) => op.method.toUpperCase()));

  for (const method of methods) {
    const colors = {
      GET: 'bg-[#e7f7e7] text-[#4B714D] border-[#c2ebc4] dark:bg-background dark:text-[#c2ebc4] dark:border-[#c2ebc4]',
      POST: 'bg-[#e7f0ff] text-[#4B5F8A] border-[#c2d9ff] dark:bg-background dark:text-[#c2d9ff] dark:border-[#c2d9ff]',
      PUT: 'bg-[#fff4e7] text-[#8A6B4B] border-[#ffd9c2] dark:bg-background dark:text-[#ffd9c2] dark:border-[#ffd9c2]',
      PATCH:
        'bg-[#fffce7] text-[#8A864B] border-[#fff9c2] dark:bg-background dark:text-[#fff9c2] dark:border-[#fff9c2]',
      DELETE:
        'bg-[#ffe7e7] text-[#8A4B4B] border-[#ffc2c2] dark:bg-background dark:text-[#ffc2c2] dark:border-[#ffc2c2]',
    };

    badges.push(
      <span
        key={String(method)}
        className={`font-mono font-medium text-[10px] py-0.25 px-0.75 rounded border ${colors[String(method) as keyof typeof colors] || 'bg-[#f5f5f5] text-[#666666] border-[#d4d4d4] dark:bg-background dark:text-[#d4d4d4] dark:border-[#d4d4d4]'}`}
      >
        {String(method)}
      </span>,
    );
  }

  if (badges.length === 0) return null;

  return <div className="flex items-center gap-1 ml-auto">{badges}</div>;
}
