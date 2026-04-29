#!/usr/bin/env bun
// Resolves the configured ref in cookbook.lock.json to its current HEAD SHA,
// rewrites the lockfile if it changed, and runs sync-cookbook so the
// generated MDX matches. Run this whenever you want the docs site to pick
// up new recipes from the upstream cookbook.
//
// Pass --ref <name> to switch the tracked branch/tag (e.g. swap from
// `rework` back to `main` once the reorg merges). Set GITHUB_TOKEN to lift
// the unauthenticated rate limit if you bump frequently.
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_FILE = path.join(ROOT, 'cookbook.lock.json');

interface CookbookLock {
  repo: string;
  ref: string;
  sha: string;
}

function parseArgs(argv: string[]): { ref?: string } {
  const out: { ref?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--ref' && argv[i + 1]) {
      out.ref = argv[++i];
    }
  }
  return out;
}

async function readLock(): Promise<CookbookLock> {
  const raw = await fs.readFile(LOCK_FILE, 'utf8');
  return JSON.parse(raw) as CookbookLock;
}

async function writeLock(lock: CookbookLock): Promise<void> {
  await fs.writeFile(LOCK_FILE, `${JSON.stringify(lock, null, 2)}\n`);
}

async function resolveSha(repo: string, ref: string): Promise<string> {
  const url = `https://api.github.com/repos/${repo}/commits/${ref}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to resolve ${repo}@${ref}: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { sha?: string };
  if (!data.sha) throw new Error(`No sha in response for ${repo}@${ref}`);
  return data.sha;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const lock = await readLock();
  const ref = args.ref ?? lock.ref;
  const sha = await resolveSha(lock.repo, ref);

  if (sha === lock.sha && ref === lock.ref) {
    console.log(`Already at ${sha.slice(0, 12)} (${lock.repo}@${ref}); resyncing anyway.`);
  } else {
    console.log(
      `Bumping ${lock.repo}: ${lock.sha.slice(0, 12)} (${lock.ref}) → ${sha.slice(0, 12)} (${ref})`,
    );
    await writeLock({ repo: lock.repo, ref, sha });
  }

  const proc = Bun.spawn(['bun', 'run', 'sync-cookbook'], {
    cwd: ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const code = await proc.exited;
  process.exit(code);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
