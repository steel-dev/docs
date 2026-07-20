#!/usr/bin/env node
// Phase 2 — SERP rank tracking. For each tracked keyword, pulls Google organic SERP and records
// the first position of docs.steel.dev and steel.dev. Writes a dated snapshot + delta vs last month.
// Usage: node dfs-rank.mjs            # all tracked keywords (costs ~$0.05–0.10/keyword)
//        node dfs-rank.mjs --limit 8  # cheap smoke test
import { loadConfig, dfs, monthStamp, writeSnapshot, latestSnapshot, log } from './_lib.mjs';

const config = loadConfig();
const month = monthStamp();
const sites = config.sites; // [docs.steel.dev, steel.dev]
const limit = process.argv.includes('--limit') ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) : null;
const pool = config.rank_keywords || config.tracked_keywords;
const keywords = limit ? pool.slice(0, limit) : pool;

function findRank(items, siteHost) {
  const matched = items.find((it) => it.domain && (it.domain === siteHost || it.domain.endsWith('.' + siteHost)));
  return matched ? { rank: matched.rank_group, url: matched.url, title: matched.title } : null;
}

const rows = [];
let budgetExhausted = false;
for (const kw of keywords) {
  if (budgetExhausted) { rows.push({ keyword: kw, error: 'skipped (serp budget exhausted)' }); continue; }
  try {
    const j = await dfs('/v3/serp/google/organic/live/regular', {
      keyword: kw, location_code: config.location_code, language_code: config.language_code,
      device: 'desktop', depth: config.serp_depth,
    });
    const items = j.tasks?.[0]?.result?.[0]?.items ?? [];
    const organic = items.filter((it) => ['organic', 'featured_snippet', 'local_pack'].includes(it.type));
    const rec = { keyword: kw };
    for (const site of sites) {
      const hit = findRank(organic, site);
      rec[site] = hit ? hit.rank : null;
      if (hit) rec[site + '_url'] = hit.url;
    }
    rec.top3 = organic.slice(0, 3).map((it) => ({ domain: it.domain, title: it.title }));
    rows.push(rec);
    log(`✓ rank "${kw}" — ${sites.map((s) => `${s}:${rec[s] ?? '—'}`).join(' ')}`);
  } catch (e) {
    const msg = String(e.message);
    if (msg.includes('40104')) { log('✗ account not verified (40104) — stopping'); process.exit(3); }
    if (msg.includes('40200')) {
      log('✗ DataForSEO SERP balance/credits exhausted (40200) — top up at app.dataforseo.com. Stopping; remaining keywords skipped.');
      budgetExhausted = true;
      rows.push({ keyword: kw, error: 'serp budget exhausted (40200)' });
      continue;
    }
    log(`✗ rank "${kw}": ${msg}`);
    rows.push({ keyword: kw, error: msg });
  }
}

const snapshotPath = writeSnapshot(config, 'ranks', month, rows);
log(`wrote ${snapshotPath}`);

// --- delta vs previous month ---
const prev = latestSnapshot(config, 'ranks', month);
const changes = [];
if (prev) {
  const prevMap = new Map((prev.data || []).map((r) => [r.keyword, r]));
  for (const r of rows) {
    if (r.error) continue;
    const p = prevMap.get(r.keyword);
    if (!p) continue;
    for (const site of sites) {
      const now = r[site], was = p[site];
      if (now === was) continue;
      if (was == null && now != null) changes.push({ keyword: r.keyword, site, type: 'newly_ranked', from: was, to: now });
      else if (now == null && was != null) changes.push({ keyword: r.keyword, site, type: 'dropped_out', from: was, to: null });
      else if (now != null && was != null) changes.push({ keyword: r.keyword, site, type: now < was ? 'improved' : 'declined', from: was, to: now, delta: now - was });
    }
  }
}

// --- print ---
console.log(`\n# Ranks — ${month} (${rows.length} keywords, prev: ${prev?.month || 'none'})`);
const ranked = rows.filter((r) => !r.error && sites.some((s) => r[s] != null)).sort((a, b) => Math.min(...sites.map((s) => a[s] ?? 99)) - Math.min(...sites.map((s) => b[s] ?? 99)));
console.log('\nCurrently ranking (best position per keyword):');
for (const r of ranked.slice(0, 25)) console.log(`  ${sites.map((s) => r[s] != null ? `${s.split('.')[0]}:#${r[s]}` : '').filter(Boolean).join(' ').padEnd(22)}  ${r.keyword}`);
const nowhere = rows.filter((r) => !r.error && sites.every((s) => r[s] == null));
console.log(`\nNot in top ${config.serp_depth} for any tracked site: ${nowhere.length} keywords`);
if (changes.length) {
  console.log(`\nChanges vs ${prev.month}:`);
  for (const c of changes) console.log(`  [${c.site.split('.')[0]}] ${c.type} ${c.from ?? '—'}→${c.to ?? '—'}  ${c.keyword}`);
} else if (prev) {
  console.log('\nNo rank changes vs previous month.');
}
