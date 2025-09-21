'use client';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { Search, SearchIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

export function SearchToggle(props: ComponentProps<'div'>) {
  const { enabled, setOpenSearch } = useSearchContext();
  if (!enabled) return;

  return (
    <>
      {/* For mobile, show the search icon */}
      <div
        className="md:hidden h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
        onClick={() => setOpenSearch(true)}
        aria-label="Search"
        {...props}
      >
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* For desktop, show the search bar */}
      <div
        className="3xs:hidden 2xs:hidden sm:hidden md:flex w-full max-w-[160px] lg:max-w-[225px] h-9 bg-white dark:bg-background rounded-md shadow-[0px_1px_2px_0px_rgba(0,0,0,0.36)] outline outline-[0.50px] outline-offset-[-0.50px] outline-zinc-800 inline-flex justify-start items-center gap-2 rounded-sm px-2 cursor-pointer group"
        onClick={() => setOpenSearch(true)}
        {...props}
      >
        <div className="flex items-center flex-1 gap-2">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors md:inline hidden">
            Search...
          </span>
        </div>
        <div className="px-1.5 py-[3px] bg-muted rounded-xs outline outline-[0.50px] outline-offset-[-0.50px] outline-zinc-800 inline-flex justify-center items-center">
          <div className="text-center justify-center text-zinc-500 text-xs font-normal font-mono leading-none group-hover:text-primary">Ctrl K</div>
        </div>
      </div>
    </>
  );
}
