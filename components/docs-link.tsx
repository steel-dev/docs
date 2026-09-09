import FumadocsLink, { type LinkProps as FumadocsLinkProps } from 'fumadocs-core/link';
import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import { docsPath } from '@/lib/docs-path';

/** Keep framework link behavior while applying the docs public URL boundary. */
export function DocsLink({ href, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink
      {...props}
      href={
        typeof href === 'string'
          ? docsPath(href)
          : {
              ...href,
              pathname: href.pathname ? docsPath(href.pathname) : href.pathname,
            }
      }
    />
  );
}

export function DocsFumadocsLink({ href, ...props }: ComponentProps<typeof FumadocsLink>) {
  return <FumadocsLink {...props} href={href ? docsPath(href) : href} />;
}

export type { FumadocsLinkProps as LinkProps };
