import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { DOCS_PATH_PREFIX, docsPath, stripDocsPath } from '@/lib/docs-path';

export function useLLMsTxt() {
  const pathname = usePathname();

  // Calculate the static file path based on current pathname
  const getStaticPath = () => {
    if (!pathname || stripDocsPath(pathname) === '/') return docsPath('/llms.txt');

    // Remove /docs prefix if present
    const path = stripDocsPath(pathname);

    // For specific pages, use the parent directory's llms.txt
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      // Remove the last segment (the page name) to get the section
      const sectionPath = segments.slice(0, -1).join('/');
      return docsPath(sectionPath ? `/${sectionPath}/llms.txt` : '/llms.txt');
    }

    return docsPath('/llms.txt');
  };

  const staticPath = getStaticPath();

  return useQuery({
    queryKey: ['llms-txt', staticPath],
    queryFn: async () => {
      const response = await fetch(staticPath);
      if (!response.ok) {
        // Fallback to root llms.txt if section-specific doesn't exist
        const rootResponse = await fetch(docsPath('/llms.txt'));
        if (!rootResponse.ok) {
          throw new Error(`Failed to fetch LLM context`);
        }
        return rootResponse.text();
      }
      return response.text();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (static content)
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: false, // Only fetch when needed
  });
}

// Builds the public markdown URL for a page: the page path with a .md suffix
// (e.g. /overview/intro.md). The docs root has no markdown page, so it points
// at the /llms.txt index instead. Pure so the convention is unit-testable.
export function getPublicMarkdownUrl(pathname: string | null, origin: string) {
  if (!pathname) return '';

  // Remove /docs prefix if present
  const basePath =
    !DOCS_PATH_PREFIX && (pathname === '/docs' || pathname.startsWith('/docs/'))
      ? pathname.slice(5) || '/'
      : stripDocsPath(pathname);

  const mdPath = basePath.startsWith('/') ? basePath : '/' + basePath;

  return `${origin}${docsPath(mdPath === '/' ? '/llms.txt' : `${mdPath}.md`)}`;
}

// Hook for getting the current page's markdown URL
export function useCurrentPageMarkdown() {
  const pathname = usePathname();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return getPublicMarkdownUrl(pathname, origin);
}
