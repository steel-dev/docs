#!/usr/bin/env node
// Phase 3 — Technical SEO audit. Fetches each key page, extracts SEO elements, flags regressions
// (broken canonicals, lost JSON-LD, new noindex, 404s) and unoptimized titles (generic vs target phrase).
// No DataForSEO needed — just live fetches. Writes a dated snapshot + delta vs last month.
// Usage: node tech-audit.mjs
import { loadConfig, monthStamp, writeSnapshot, latestSnapshot, log } from './_lib.mjs';

const config = loadConfig();
const month = monthStamp();

function pick(html, re) { const m = html.match(re); return m ? (m[1] || m[0]) : null; }
function decode(s) { return s ? s.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : null; }

async function auditPage(page) {
  const out = { url: page.url, section: page.section };
  try {
    const res = await fetch(page.url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (seo audit)' } });
    out.status = res.status;
    out.finalUrl = res.url;
    const html = await res.text();
    out.title = decode(pick(html, /<title[^>]*>([^<]*)<\/title>/i));
    out.description = decode(pick(html, /<meta\s+name="description"\s+content="([^"]*)"/i));
    out.canonical = pick(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
    out.h1 = decode(pick(html, /<h1[^>]*>([^<]*)<\/h1>/i));
    out.robots = pick(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
    out.jsonld_count = (html.match(/<script\s+type="application\/ld\+json"/gi) || []).length;
  } catch (e) {
    out.fetchError = e.message;
  }
  // ---- checks ----
  const issues = [];
  if (out.fetchError) issues.push({ sev: 'critical', msg: `fetch failed: ${out.fetchError}` });
  if (out.status && out.status >= 400) issues.push({ sev: 'critical', msg: `HTTP ${out.status}` });
  if (!out.title) issues.push({ sev: 'high', msg: 'missing <title>' });
  else if (out.title.length > 70) issues.push({ sev: 'low', msg: `title length ${out.title.length} (>70)` });
  if (!out.description) issues.push({ sev: 'high', msg: 'missing meta description' });
  else if (out.description.length < 120) issues.push({ sev: 'medium', msg: `description length ${out.description.length} (<120)` });
  if (!out.canonical) issues.push({ sev: 'high', msg: 'missing canonical' });
  else if (page.url && !out.canonical.includes(new URL(page.url).pathname)) issues.push({ sev: 'medium', msg: `canonical mismatch: ${out.canonical}` });
  if (out.jsonld_count === 0) issues.push({ sev: 'medium', msg: 'no JSON-LD' });
  if (out.robots && /noindex/i.test(out.robots)) issues.push({ sev: 'high', msg: `noindex: ${out.robots}` });
  // optimization check: does the title carry the target intent phrase?
  if (page.target_any && out.title) {
    const t = out.title.toLowerCase();
    const hit = page.target_any.find((p) => t.includes(p.toLowerCase()));
    out.title_optimized = !!hit;
    if (!hit) issues.push({ sev: 'medium', msg: `generic title — missing target phrase (${page.target_any.join('|')})` });
  }
  out.issues = issues;
  return out;
}

const results = [];
for (const page of config.key_pages) {
  const r = await auditPage(page);
  results.push(r);
  log(`${r.issues.length === 0 ? '✓' : '⚠'} [${(r.title || '(no title)').slice(0, 50)}] ${r.url} — ${r.issues.length} issue(s)`);
}

const snapshotPath = writeSnapshot(config, 'tech', month, results);
log(`wrote ${snapshotPath}`);

// --- delta vs previous month (regressions) ---
const prev = latestSnapshot(config, 'tech', month);
const regressions = [];
if (prev) {
  const prevMap = new Map((prev.data || []).map((r) => [r.url, r]));
  for (const r of results) {
    const p = prevMap.get(r.url);
    if (!p) continue;
    if (r.title !== p.title) regressions.push({ url: r.url, type: 'title_changed', from: p.title, to: r.title });
    if ((p.canonical && !r.canonical)) regressions.push({ url: r.url, type: 'canonical_lost' });
    if ((p.jsonld_count || 0) > 0 && r.jsonld_count === 0) regressions.push({ url: r.url, type: 'jsonld_lost' });
    if (p.status && p.status < 400 && r.status >= 400) regressions.push({ url: r.url, type: 'now_broken', status: r.status });
    if (!/noindex/i.test(p.robots || '') && /noindex/i.test(r.robots || '')) regressions.push({ url: r.url, type: 'now_noindex' });
    // optimization progress (the good news): newly optimized
    if (p.title_optimized === false && r.title_optimized === true) regressions.push({ url: r.url, type: 'optimized_title_now', to: r.title });
  }
}

// --- print ---
console.log(`\n# Tech audit — ${month} (${results.length} pages, prev: ${prev?.month || 'none'})`);
const optimized = results.filter((r) => r.title_optimized);
const generic = results.filter((r) => r.title_optimized === false);
console.log(`\nTitle optimization: ${optimized.length}/${config.key_pages.length} P0 pages optimized; ${generic.length} still generic.`);
if (generic.length) { console.log('\nStill generic (ship the P0 title fix):'); for (const r of generic) console.log(`  ${r.url}\n    → "${r.title}"`); }
const allIssues = results.flatMap((r) => r.issues.map((i) => ({ url: r.url, ...i }))).filter((i) => i.sev !== 'low');
if (allIssues.length) { console.log('\nIssues (med+):'); for (const i of allIssues) console.log(`  [${i.sev}] ${i.url} — ${i.msg}`); }
if (regressions.length) {
  console.log(`\nChanges vs ${prev.month}:`);
  for (const c of regressions) console.log(`  ${c.type}: ${c.url}${c.to ? ` → "${(c.to || '').slice(0, 60)}"` : ''}`);
} else if (prev) {
  console.log('\nNo regressions or optimization changes vs previous month.');
}
