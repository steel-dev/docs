import type { MetadataRoute } from 'next';
import { getLastModified } from '@/lib/last-modified';
import { source } from '@/lib/source';

const SITE_URL = 'https://docs.steel.dev';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = source.getPages().filter((page) => !/^\/(en\/)?changelog\/.+/.test(page.url));

  return Promise.all(
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
}
