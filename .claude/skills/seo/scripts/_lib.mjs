// Shared helpers for the seo skill's scripts: .env loading, DataForSEO client, snapshot IO, month stamping.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL_DIR = join(dirname(fileURLToPath(import.meta.url)), '..'); // .../seo
export const REPO_ROOT = process.cwd();
export const CONFIG_PATH = join(SKILL_DIR, 'config.json');

export function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

// Walk up from REPO_ROOT to find .env (it's gitignored at repo root).
export function loadEnv(start = REPO_ROOT) {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    const p = join(dir, '.env');
    if (existsSync(p)) {
      for (const line of readFileSync(p, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
      return p;
    }
    dir = dirname(dir);
  }
  return null;
}

export function authHeader() {
  loadEnv();
  const b64 = process.env.DATAFORSEO_AUTH;
  if (b64) return `Basic ${b64}`;
  if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) {
    return `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64')}`;
  }
  throw new Error('DataForSEO credentials missing. Set DATAFORSEO_AUTH (or LOGIN+PASSWORD) in .env');
}

export const BASE = process.env.DATAFORSEO_BASE_URL || 'https://api.dataforseo.com';

// Call a DataForSEO endpoint. payload is wrapped in an array (task list). Returns the parsed body.
// Checks BOTH the top-level status and the per-task status — DataForSEO can return top-level 20000
// while the task itself fails (e.g. 40200 Payment Required), which would otherwise silently yield
// empty results.
export async function dfs(path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify([payload]),
  });
  const json = await res.json();
  const top = json.status_code;
  const task = json.tasks?.[0]?.status_code;
  const taskMsg = json.tasks?.[0]?.status_message;
  if (top === 40104 || task === 40104) {
    throw new Error('DataForSEO account not verified (40104). Verify at https://app.dataforseo.com/ then re-run.');
  }
  if (top === 40200 || task === 40200) {
    throw new Error('DataForSEO balance/credits exhausted (40200). Top up at https://app.dataforseo.com/ then re-run.');
  }
  if (top && top !== 20000) {
    throw new Error(`DataForSEO ${path} -> top ${top} ${json.status_message}`);
  }
  if (task && task !== 20000) {
    throw new Error(`DataForSEO ${path} -> task ${task} ${taskMsg || ''}`.trim());
  }
  return json;
}

export function monthStamp(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function pulsePath(config, sub) {
  return join(REPO_ROOT, config.paths[sub]);
}

export function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

// Write a snapshot file named <name>-<month>.json
export function writeSnapshot(config, name, month, data) {
  const dir = pulsePath(config, 'snapshots_dir');
  ensureDir(dir);
  const path = join(dir, `${name}-${month}.json`);
  writeFileSync(path, JSON.stringify({ month, generatedAt: new Date().toISOString(), data }, null, 2));
  return path;
}

// Return the latest snapshot <name>-*.json strictly older than `excludeMonth` (or any latest if omitted).
export function latestSnapshot(config, name, excludeMonth = null) {
  const dir = pulsePath(config, 'snapshots_dir');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => f.startsWith(`${name}-`) && f.endsWith('.json'))
    .filter((f) => !excludeMonth || !f.includes(`-${excludeMonth}.json`))
    .sort()
    .reverse();
  if (!files.length) return null;
  const path = join(dir, files[0]);
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function log(...a) { process.stderr.write(a.join(' ') + '\n'); }
