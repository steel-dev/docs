import type { MetadataRoute } from 'next';
import { docsUrl, stripDocsPath } from '@/lib/docs-path';
import { getLastModified } from '@/lib/last-modified';
import { source } from '@/lib/source';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = source
    .getPages()
    .filter((page) => !/^\/(en\/)?changelog\/.+/.test(stripDocsPath(page.url)));

  const pageEntries = await Promise.all(
    pages.map(async (page) => {
      const url = docsUrl(stripDocsPath(page.url).replace(/^\/en(\/|$)/, '/'));
      const lastModified = await getLastModified(
        (page.data as { _file?: { absolutePath?: string } })._file?.absolutePath,
      );
      return {
        url,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: 'weekly' as const,
        priority: stripDocsPath(page.url) === '/' ? 1 : 0.8,
      };
    }),
  );

  const entries: MetadataRoute.Sitemap = [
    {
      url: docsUrl('/'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...pageEntries.filter(
      ({ url }) => url !== docsUrl('/overview') && url !== docsUrl('/overview/'),
    ),
  ];
  const seenUrls = new Set<string>();

  return entries.filter(({ url }) => {
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });
}
