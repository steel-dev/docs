// ABOUTME: Resolves content freshness from Git, with a separate filesystem fallback.
// ABOUTME: Schema uses Git-only dates; sitemap discovery may fall back to file mtime.
import { execSync } from 'node:child_process';
import { stat } from 'node:fs/promises';

export function getGitLastModified(absPath: string | undefined): Date | undefined {
  if (!absPath) return undefined;
  try {
    const out = execSync(`git log -1 --format=%aI -- "${absPath}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
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

export async function getLastModified(absPath: string | undefined): Promise<Date | undefined> {
  if (!absPath) return undefined;
  return getGitLastModified(absPath) ?? (await fsLastModified(absPath));
}
