import { execSync } from 'node:child_process';
import { stat } from 'node:fs/promises';
import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

const SITE_URL = 'https://docs.steel.dev';

function gitLastModified(absPath: string): Date | undefined {
  try {
    const out = execSync(`git log -1 --format=%aI -- "${absPath}"`, {
      encoding: 'utf8',
      timeout: 5000,
    }).trim();
    if (!out) return undefined;
    const d = new Date(out);
    return Number.isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
}

async function fsLastModified(absPath: string): Promise<Date | undefined> {
  try {
    return (await stat(absPath)).mtime;
  } catch {
    return undefined;
  }
}

async function getLastModified(absPath: string | undefined): Promise<Date | undefined> {
  if (!absPath) return undefined;
  return gitLastModified(absPath) ?? (await fsLastModified(absPath));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = source.getPages();

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
