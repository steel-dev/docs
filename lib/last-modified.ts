// ABOUTME: Resolves a content file's last-modified date from git history,
// ABOUTME: falling back to filesystem mtime. Shared by the sitemap and JSON-LD.
import { execSync } from 'node:child_process';
import { stat } from 'node:fs/promises';

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

export async function getLastModified(absPath: string | undefined): Promise<Date | undefined> {
  if (!absPath) return undefined;
  return gitLastModified(absPath) ?? (await fsLastModified(absPath));
}
