'use client';
import { usePathname } from 'fumadocs-core/framework';
import Link from 'fumadocs-core/link';
import { ChevronDown } from 'lucide-react';
import React, {
  type AnchorHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { isActive } from '../../lib/is-active';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';

interface BaseItem {
  /**
   * Restrict where the item is displayed
   *
   * @defaultValue 'all'
   */
  on?: 'menu' | 'nav' | 'all';
}

export interface BaseLinkType extends BaseItem {
  url: string;
  /**
   * When the item is marked as active
   *
   * @defaultValue 'url'
   */
  active?: 'url' | 'nested-url' | 'none';
  external?: boolean;
}

export interface MainItemType extends BaseLinkType {
  type?: 'main';
  icon?: ReactNode;
  text: ReactNode;
  description?: ReactNode;
  isNew?: boolean;
  isLink?: boolean;
  isSeperator?: boolean;
}

export interface IconItemType extends BaseLinkType {
  type: 'icon';
  /**
   * `aria-label` of icon button
   */
  label?: string;
  icon: ReactNode;
  text: ReactNode;
  /**
   * @defaultValue true
   */
  secondary?: boolean;
}

interface ButtonItem extends BaseLinkType {
  type: 'button';
  icon?: ReactNode;
  text: ReactNode;
  /**
   * @defaultValue false
   */
  secondary?: boolean;
}

export interface MenuItemType extends BaseItem {
  type: 'menu';
  icon?: ReactNode;
  text: ReactNode;

  url?: string;
  items: (
    | (MainItemType & {
        /**
         * Options when displayed on navigation menu
         */
        menu?: HTMLAttributes<HTMLElement> & {
          banner?: ReactNode;
        };
      })
    | CustomItem
  )[];

  /**
   * @defaultValue false
   */
  secondary?: boolean;
}

export interface DropdownItemType extends BaseItem {
  type: 'dropdown';
  icon?: ReactNode;
  text: ReactNode;
  url?: string; // Optional URL for main item click navigation
  items: (
    | (MainItemType & {
        /**
         * Options when displayed on dropdown menu
         */
        dropdown?: HTMLAttributes<HTMLElement>;
      })
    | CustomItem
  )[];
  /**
   * @defaultValue false
   */
  secondary?: boolean;
}

interface CustomItem extends BaseItem {
  type: 'custom';
  /**
   * @defaultValue false
   */
  secondary?: boolean;
  children: ReactNode;
}

export type LinkItemType =
  | MainItemType
  | IconItemType
  | ButtonItem
  | MenuItemType
  | DropdownItemType
  | CustomItem;

export const BaseLinkItem = forwardRef<
  HTMLAnchorElement,
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { item: BaseLinkType }
>(({ item, ...props }, ref) => {
  const pathname = usePathname();
  const activeType = item.active ?? 'url';
  const active = activeType !== 'none' && isActive(item.url, pathname, activeType === 'nested-url');

  return (
    <Link ref={ref} href={item.url} external={item.external} {...props} data-active={active}>
      {props.children}
    </Link>
  );
});

BaseLinkItem.displayName = 'BaseLinkItem';

// Helper function to determine if a navigation item should be active
function isNavItemActive(item: LinkItemType, pathname: string): boolean {
  if (!('url' in item) || !item.url) return false;

  // Check if item has active property (only certain types have it)
  // For menu items, default to "nested-url" behavior since they should match child routes
  const activeType =
    'active' in item ? (item.active ?? 'url') : item.type === 'menu' ? 'nested-url' : 'url';
  if (activeType === 'none') return false;

  // For other items, use the standard isActive logic
  return isActive(item.url, pathname, activeType === 'nested-url');
}

export function renderNavItem(item: LinkItemType): ReactNode {
  const itemType = item.type ?? 'main';
  const pathname = usePathname();

  switch (itemType) {
    case 'main': {
      if (!('url' in item)) return null;

      const isActive = isNavItemActive(item, pathname);

      return (
        <NavigationMenuItem key={item.url}>
          <NavigationMenuLink asChild>
            <Link
              href={item.url}
              className={cn(
                'font-sans text-sm px-4 py-2 rounded-md hover:text-primary transition-colors',
                isActive && 'text-white',
              )}
              data-nav-active={isActive ? 'true' : undefined}
            >
              {item.text}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      );
    }

    case 'menu': {
      if (!('items' in item)) return null;

      return (
        <NavigationMenuItem key={'text' in item ? String(item.text) : undefined}>
          {item.url ? (
            <NavigationMenuTrigger asChild>
              <div
                className={cn(
                  'font-sans text-sm px-4 py-2 rounded-md group flex items-center gap-1 cursor-pointer',
                )}
                data-nav-active={isNavItemActive(item, pathname) ? 'true' : undefined}
              >
                <Link href={item.url} className="flex items-center gap-1">
                  {item.text}
                </Link>
                <ChevronDown className="relative h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </NavigationMenuTrigger>
          ) : (
            // When no URL, use default button behavior
            <NavigationMenuTrigger
              className={cn('font-sans text-sm px-4 py-2 rounded-md group flex items-center gap-1')}
              data-nav-active={isNavItemActive(item, pathname) ? 'true' : undefined}
            >
              {item.text}
              <ChevronDown className="relative h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </NavigationMenuTrigger>
          )}
          <NavigationMenuContent className="mt-12 bg-background border rounded-lg shadow-lg w-auto left-auto right-auto">
            {/* Simple two-column layout */}
            <div className="grid grid-cols-1 gap-x-5 px-2 py-1 w-max">
              {item.items.map((menuItem, index) => {
                if (menuItem.type === 'custom') {
                  return <div key={`custom-${index}`}>{menuItem.children}</div>;
                }

                if (!('url' in menuItem)) return null;

                const isMenuItemActive = isNavItemActive(menuItem, pathname);

                return (
                  <NavigationMenuLink key={menuItem.url} asChild>
                    <div className="!font-normal flex items-center gap-2 flex-1">
                      <Link
                        href={menuItem.url}
                        className={cn(
                          'block py-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors',
                          isMenuItemActive && 'underline underline-offset-4 text-primary',
                        )}
                      >
                        {menuItem.text}
                      </Link>
                      {menuItem.isNew && (
                        <span
                          key="new"
                          className="font-regular text-[10px] px-1 py-0.5 rounded uppercase bg-orange-500 dark:bg-brand-orange text-neutral-950 border-none"
                        >
                          New
                        </span>
                      )}
                    </div>
                  </NavigationMenuLink>
                );
              })}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      );
    }

    case 'dropdown':
      if (!('items' in item)) return null;
      return (
        <DropdownNavItem
          key={'text' in item ? String(item.text) : undefined}
          item={item as DropdownItemType}
        />
      );

    case 'icon':
    case 'button':
    case 'custom':
      // These types are not part of the current PRD scope
      return null;

    default:
      return null;
  }
}

// Separate component for dropdown
function DropdownNavItem({ item }: { item: DropdownItemType }) {
  return (
    <NavigationMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="font-mono text-sm px-4 py-2 rounded-md hover:bg-accent data-[state=open]:bg-accent transition-colors flex items-center gap-1"
          >
            {item.text}
            <ChevronDown className="relative h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className="w-[400px]">
          {item.items.map((dropdownItem, index) => {
            if (dropdownItem.type === 'custom') {
              return (
                <div key={`dropdown-custom-${index}`} className="p-2">
                  {dropdownItem.children}
                </div>
              );
            }

            if (!('url' in dropdownItem)) return null;

            return (
              <DropdownMenuItem key={dropdownItem.url} asChild>
                <Link href={dropdownItem.url} className="flex flex-col gap-1 cursor-pointer p-3">
                  <div className="font-medium text-sm">{dropdownItem.text}</div>
                  {dropdownItem.description && (
                    <div className="text-sm text-muted-foreground">{dropdownItem.description}</div>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}
          {/* If dropdown has a main URL, add a footer link */}
          {item.url && (
            <>
              <div className="h-px bg-border my-2" />
              <DropdownMenuItem asChild>
                <Link
                  href={item.url}
                  className="flex items-center justify-between p-3 text-sm font-medium"
                >
                  View all {item.text}
                  <span className="text-muted-foreground">→</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </NavigationMenuItem>
  );
}
