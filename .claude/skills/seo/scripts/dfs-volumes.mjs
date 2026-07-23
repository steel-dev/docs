#!/usr/bin/env node
// Phase 1 — Refresh keyword demand. Pulls DataForSEO search_volume (volume + CPC + 12-mo trend)
// for the tracked keyword set, writes a dated snapshot, and diffs vs the previous month → movers.
// Usage: node dfs-volumes.mjs            # all tracked keywords
//        node dfs-volumes.mjs --limit 10 # cheap smoke test
import { loadConfig, dfs, monthStamp, writeSnapshot, latestSnapshot, pulsePath, log, ensureDir } from './_lib.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const config = loadConfig();
const month = monthStamp();
const limit = process.argv.includes('--limit') ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) : null;
const keywords = limit ? config.tracked_keywords.slice(0, limit) : config.tracked_keywords;

async function pullBatch(batch) {
  const j = await dfs('/v3/keywords_data/google_ads/search_volume/live', {
    keywords: batch,
    location_code: config.location_code,
    language_code: config.language_code,
  });
  return (j.tasks?.[0]?.result ?? []).map((r) => ({
    keyword: r.keyword,
    volume: r.search_volume ?? null,
    cpc: r.cpc ?? null,
    paid_competition: r.competition ?? null,
    competition_index: r.competition_index ?? null,
    trend: (r.monthly_searches ?? []).map((m) => `${m.year}-${String(m.month).padStart(2, '0')}:${m.search_volume}`),
  }));
}

const rows = [];
let balanceExhausted = false;
for (let i = 0; i < keywords.length; i += 25) {
  if (balanceExhausted) break;
  const batch = keywords.slice(i, i + 25);
  try {
    rows.push(...(await pullBatch(batch)));
    log(`✓ volumes batch ${Math.floor(i / 25) + 1} (${batch.length} kw)`);
  } catch (e) {
    const msg = String(e.message);
    log(`✗ volumes batch: ${msg}`);
    if (msg.includes('40104') || msg.includes('40200')) {
      console.error(`\nSTOP: ${msg}` + (msg.includes('40200') ? ` — ${keywords.length - rows.length} keywords not pulled this month.` : ''));
      balanceExhausted = true;
    }
  }
}

const byKw = new Map(rows.map((r) => [r.keyword.toLowerCase(), r]));
// ensure keywords with no ads data still appear (null = below threshold, NOT zero demand)
for (const k of keywords) if (!byKw.has(k.toLowerCase())) byKw.set(k.toLowerCase(), { keyword: k, volume: null, cpc: null, paid_competition: null, trend: [] });

const snapshotPath = writeSnapshot(config, 'volumes', month, [...byKw.values()]);
log(`wrote ${snapshotPath}`);

// --- diff vs previous month ---
const prev = latestSnapshot(config, 'volumes', month);
const movers = [];
if (prev) {
  const prevMap = new Map((prev.data || []).map((r) => [r.keyword.toLowerCase(), r]));
  for (const r of [...byKw.values()]) {
    const p = prevMap.get(r.keyword.toLowerCase());
    if (!p) continue;
    const dVol = (r.volume ?? 0) - (p.volume ?? 0);
    // trend slope: compare avg of last 3 months vs prior 3 months (current run's trend)
    const nums = (r.trend || []).map((t) => parseInt(t.split(':')[1])).filter((n) => !Number.isNaN(n));
    const recent = nums.slice(0, 3), older = nums.slice(3, 6);
    const recAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const oldAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : 0;
    const slopePct = oldAvg > 0 ? Math.round(((recAvg - oldAvg) / oldAvg) * 100) : null;
    if (Math.abs(dVol) >= 50 || (slopePct !== null && Math.abs(slopePct) >= 25)) {
      movers.push({ keyword: r.keyword, prevVol: p.volume, vol: r.volume, dVol, slopePct });
    }
  }
  movers.sort((a, b) => Math.abs(b.dVol || 0) + Math.abs(b.slopePct || 0) - (Math.abs(a.dVol || 0) + Math.abs(a.slopePct || 0)));
}

// --- write a small movers summary the report step can ingest ---
ensureDir(pulsePath(config, 'pulse_dir'));
writeFileSync(join(pulsePath(config, 'pulse_dir'), `movers-${month}.json`), JSON.stringify({ month, previousMonth: prev?.month || null, movers }, null, 2));

// --- print ---
console.log(`\n# Volumes — ${month} (${rows.length} keywords, prev: ${prev?.month || 'none'})`);
const sorted = [...byKw.values()].filter((r) => r.volume != null).sort((a, b) => (b.volume || 0) - (a.volume || 0));
console.log('\nTop by volume:');
for (const r of sorted.slice(0, 20)) console.log(`  ${String(r.volume).padStart(7)}  $${(r.cpc || 0).toFixed(2).padStart(7)}  ${r.keyword}`);
if (movers.length) {
  console.log(`\nMovers vs ${prev.month} (|Δvol|≥50 or trend |Δ|≥25%):`);
  for (const m of movers.slice(0, 25)) console.log(`  ${m.keyword}: ${m.prevVol}→${m.vol} (Δ${m.dVol >= 0 ? '+' : ''}${m.dVol})${m.slopePct !== null ? `, trend ${m.slopePct >= 0 ? '+' : ''}${m.slopePct}%` : ''}`);
} else if (prev) {
  console.log('\nNo significant movers vs previous month.');
}
