#!/usr/bin/env node

// Pull real search-volume / CPC / competition / difficulty for a keyword list from DataForSEO.
//
// Auth: reads DATAFORSEO_AUTH (Base64 login:password) or DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD from .env
//
// Usage:
//   node scripts/seo/dfs-keywords.mjs "browser automation api" "web scraping api"
//   node scripts/seo/dfs-keywords.mjs --file keywords.txt --out dfs-keywords.json
//   cat keywords.txt | node scripts/seo/dfs-keywords.mjs --stdin
//   node scripts/seo/dfs-keywords.mjs --serp "browserbase alternative"   # SERP results instead of volume
//
// NOTE: the DataForSEO account must be email-verified before any data endpoint returns results
// (otherwise you'll see HTTP 40104 "Please verify your account"). Verify at https://app.dataforseo.com/

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// --- load .env (minimal, no deps) ---
function loadEnv(path = '.env') {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const BASE = process.env.DATAFORSEO_BASE_URL || 'https://api.dataforseo.com';
const AUTH =
  process.env.DATAFORSEO_AUTH ||
  (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD
    ? Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString(
        'base64',
      )
    : null);
if (!AUTH) {
  console.error('Missing DataForSEO credentials. Set DATAFORSEO_AUTH (or LOGIN+PASSWORD) in .env');
  process.exit(2);
}
const HEADERS = { Authorization: `Basic ${AUTH}`, 'Content-Type': 'application/json' };

// --- arg parsing ---
const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outFile = outFlag >= 0 ? args[outFlag + 1] : null;
const fileFlag = args.indexOf('--file');
const file = fileFlag >= 0 ? args[fileFlag + 1] : null;
const serpMode = args.includes('--serp');
const stdinMode = args.includes('--stdin');
const positional = args.filter(
  (a, i) => !a.startsWith('--') && i !== outFlag + 1 && i !== fileFlag + 1,
);

let keywords = [];
if (stdinMode)
  keywords.push(
    ...readFileSync(0, 'utf8')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  );
if (file)
  keywords.push(
    ...readFileSync(file, 'utf8')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  );
keywords.push(...positional);
keywords = [...new Set(keywords.map((k) => k.trim()).filter(Boolean))];

if (!keywords.length) {
  console.error('No keywords. Pass them as args, --file PATH, or --stdin.');
  process.exit(2);
}

// --- DataForSEO calls ---
async function dfs(path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify([payload]),
  });
  const json = await res.json();
  if (json.status_code === 40104) {
    throw new Error(
      'DataForSEO account is not verified (40104). Verify at https://app.dataforseo.com/ then re-run.',
    );
  }
  if (json.status_code && json.status_code !== 20000) {
    throw new Error(`DataForSEO ${path} -> ${json.status_code} ${json.status_message}`);
  }
  return json;
}

// On this account, dataforseo_labs returns 404 (not enabled). Use google_ads search_volume directly.
// Note: competition_index is PAID competition (0-100), not organic difficulty; CPC signals $-intent.
// Batch up to ~25 keywords per call (DataForSEO allows multiple per request) to save cost.
async function keywordInfoBatch(kws) {
  const j = await dfs('/v3/keywords_data/google_ads/search_volume/live', {
    keywords: kws,
    location_code: 2840,
    language_code: 'en',
  });
  const rows = j.tasks?.[0]?.result ?? [];
  return rows.map((item) => ({
    keyword: item.keyword,
    search_volume: item.search_volume ?? null,
    cpc: item.cpc ?? null,
    paid_competition: item.competition ?? null,
    competition_index: item.competition_index ?? null,
    low_bid: item.low_top_of_page_bid ?? null,
    high_bid: item.high_top_of_page_bid ?? null,
    trend: (item.monthly_searches ?? []).map(
      (m) => `${m.year}-${String(m.month).padStart(2, '0')}:${m.search_volume}`,
    ),
    source: 'keywords_data/google_ads/search_volume',
  }));
}

async function serp(kw) {
  const j = await dfs('/v3/serp/google/organic/live/regular', {
    keyword: kw,
    location_code: 2840,
    language_code: 'en',
    device: 'desktop',
    depth: 10,
  });
  const items = j.tasks?.[0]?.result?.[0]?.items ?? [];
  return {
    keyword: kw,
    results: items.map((it) => ({
      rank: it.rank_group,
      type: it.type,
      domain: it.domain,
      title: it.title,
      url: it.url,
      description: it.description,
    })),
  };
}

// --- run ---
const results = [];
if (serpMode) {
  for (const kw of keywords) {
    try {
      results.push(await serp(kw));
      process.stderr.write(`✓ ${kw}\n`);
    } catch (e) {
      if (String(e.message).includes('40104')) {
        console.error(`\n${e.message}`);
        process.exit(3);
      }
      results.push({ keyword: kw, error: e.message });
      process.stderr.write(`✗ ${kw}: ${e.message}\n`);
    }
  }
} else {
  // batch volume lookups, 25 at a time
  for (let i = 0; i < keywords.length; i += 25) {
    const batch = keywords.slice(i, i + 25);
    try {
      const rows = await keywordInfoBatch(batch);
      results.push(...rows);
      process.stderr.write(`✓ batch ${Math.floor(i / 25) + 1} (${batch.length} kw)\n`);
    } catch (e) {
      if (String(e.message).includes('40104')) {
        console.error(`\n${e.message}`);
        process.exit(3);
      }
      for (const kw of batch) results.push({ keyword: kw, error: e.message });
      process.stderr.write(`✗ batch: ${e.message}\n`);
    }
  }
}

const json = JSON.stringify(results, null, 2);
if (outFile) {
  writeFileSync(outFile, json);
  console.error(`Wrote ${outFile}`);
} else {
  console.log(json);
}
