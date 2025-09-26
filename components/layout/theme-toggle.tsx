'use client';

import { cva } from 'class-variance-authority';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { type HTMLAttributes, useLayoutEffect, useState } from 'react';
import { cn } from '../../lib/utils';

export function ThemeToggle({
  className,
  mode = 'light-dark',
  ...props
}: HTMLAttributes<HTMLElement> & {
  mode?: 'light-dark';
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const value = mounted ? resolvedTheme : null;

  if (!value) return null;

  const nextTheme = value === 'light' ? 'dark' : 'light';
  const Icon = value === 'light' ? Sun : Moon;

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      className={cn('inline-flex items-center cursor-pointer bg-transparent text-primary hover:text-muted-foreground', className)}
      data-theme-toggle=""
      onClick={() => setTheme(nextTheme)}
      {...props}
    >
      <Icon className="size-4" fill="transparent" />
    </button>
  );
}
