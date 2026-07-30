#!/usr/bin/env node
// Phase 0, search performance. Reads a Search Console "Pages" CSV export and reports site
// clicks/impressions/CTR twice: as-is, and "ex-sinks" with the `impression_sinks` pages from
// config.json removed, so month-over-month comparisons aren't distorted by them.
// Writes a dated snapshot + delta vs last month. No DataForSEO needed.
// Usage: node gsc-perf.mjs <path-to-gsc-pages-export.csv>
import { loadConfig, monthStamp, writeSnapshot, latestSnapshot, log } from './_lib.mjs';

// Path-only comparison key: full URLs and bare paths in an export must match the same sink entry.
function normalizePath(page) {
  let path = page.trim();
  try {
    path = new URL(path).pathname;
  } catch {
    // already a path
  }
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

function splitCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += ch;
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

function toNumber(cell) {
  return Number(cell.replace(/[,%\s]/g, '')) || 0;
}

// Parse a Search Console pages export into { page, clicks, impressions } rows. Column order and
// the exact page-column header ("Top pages", "Page", "URL") vary by export; match on the header.
export function parseGscCsv(text) {
  const lines = text.replace(/^﻿/, '').split('\n').filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const col = (re) => headers.findIndex((h) => re.test(h));
  const pageCol = col(/page|url|address/);
  const clicksCol = col(/click/);
  const impressionsCol = col(/impression/);
  if (pageCol < 0 || clicksCol < 0 || impressionsCol < 0) {
    throw new Error(`unexpected export columns: ${headers.join(', ')}`);
  }
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return {
      page: cells[pageCol],
      clicks: toNumber(cells[clicksCol]),
      impressions: toNumber(cells[impressionsCol]),
    };
  });
}

function ratio(clicks, impressions) {
  return impressions ? clicks / impressions : 0;
}

function totals(rows) {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  return { clicks, impressions, ctr: ratio(clicks, impressions) };
}

// Site totals, the same totals with the sink pages removed, and each sink's own numbers.
export function summarize(rows, sinkPaths) {
  const sinkKeys = new Set(sinkPaths.map(normalizePath));
  const isSink = (row) => sinkKeys.has(normalizePath(row.page));
  const total = totals(rows);
  const sinks = sinkPaths.map((path) => {
    const matched = rows.filter((r) => normalizePath(r.page) === normalizePath(path));
    const t = totals(matched);
    return { path, ...t, impressionShare: ratio(t.impressions, total.impressions) };
  });
  return { total, exSinks: totals(rows.filter((r) => !isSink(r))), sinks };
}

function pct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function line(label, t) {
  return `${label}: ${t.clicks} clicks · ${t.impressions.toLocaleString('en-US')} impressions · ${pct(t.ctr)} CTR`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const csvPath = process.argv[2];
  if (!csvPath) {
    log('usage: node gsc-perf.mjs <path-to-gsc-pages-export.csv>');
    process.exit(1);
  }
  const config = loadConfig();
  const month = monthStamp();
  const { readFileSync } = await import('node:fs');
  const summary = summarize(parseGscCsv(readFileSync(csvPath, 'utf8')), config.impression_sinks);

  const snapshotPath = writeSnapshot(config, 'perf', month, summary);
  log(`wrote ${snapshotPath}`);

  console.log(`\n# Search performance, ${month} (source: ${csvPath})`);
  console.log(line('\nSite (as exported)', summary.total));
  console.log(line('Site (ex-sinks)', summary.exSinks));
  console.log('\nImpression sinks excluded (see config.json → impression_sinks):');
  for (const s of summary.sinks) {
    console.log(
      `  ${s.path}: ${s.impressions.toLocaleString('en-US')} impressions (${pct(s.impressionShare)} of site), ${s.clicks} clicks, ${pct(s.ctr)} CTR`,
    );
  }

  const prev = latestSnapshot(config, 'perf', month);
  if (prev?.data?.exSinks) {
    console.log(`\n${line(`vs ${prev.month} (ex-sinks)`, prev.data.exSinks)}`);
  } else {
    console.log('\nNo previous perf snapshot, so this run is the ex-sinks baseline.');
  }
}
