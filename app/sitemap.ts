import type { MetadataRoute } from 'next';
import { getLastModified } from '@/lib/last-modified';
import { source } from '@/lib/source';

const SITE_URL = 'https://docs.steel.dev';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = source.getPages().filter((page) => !/^\/(en\/)?changelog\/.+/.test(page.url));

  const pageEntries = await Promise.all(
    pages.map(async (page) => {
      const url = `${SITE_URL}${page.url.replace(/^\/en(\/|$)/, '/').replace(/\/$/, '/')}`;
      const lastModified = await getLastModified(
        (page.data as { _file?: { absolutePath?: string } })._file?.absolutePath,
      );
      return {
        url,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: 'weekly' as const,
        priority: page.url === '/' ? 1 : 0.8,
      };
    }),
  );

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...pageEntries.filter(
      ({ url }) => url !== `${SITE_URL}/overview` && url !== `${SITE_URL}/overview/`,
    ),
  ];
  const seenUrls = new Set<string>();

  return entries.filter(({ url }) => {
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });
}
