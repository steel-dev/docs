// ABOUTME: Tests the SEO pulse Search Console summary: CSV parsing plus the ex-sinks totals
// ABOUTME: that report site clicks/impressions/CTR with the impression-sink pages removed.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseGscCsv, summarize } from '../.claude/skills/seo/scripts/gsc-perf.mjs';

const CONFIG = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../.claude/skills/seo/config.json', import.meta.url)),
    'utf8',
  ),
);

const EXPORT_CSV = [
  'Top pages,Clicks,Impressions,CTR,Position',
  'https://docs.steel.dev/llms-full.txt,10,"37,527",0.03%,17.9',
  'https://docs.steel.dev/overview/self-hosting/railway,17,"36,672",0.05%,10.1',
  'https://docs.steel.dev/overview/pricing,100,"10,000",1%,6.2',
  'https://docs.steel.dev/overview/stealth/proxies,50,"5,000",1%,7.4',
].join('\n');

describe('parseGscCsv', () => {
  test('reads page, clicks, and impressions, tolerating quotes and thousands separators', () => {
    const rows = parseGscCsv(EXPORT_CSV);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({
      page: 'https://docs.steel.dev/llms-full.txt',
      clicks: 10,
      impressions: 37527,
    });
    expect(rows[2].impressions).toBe(10000);
  });

  test('accepts a BOM and a "Page" header variant', () => {
    const rows = parseGscCsv('﻿Page,Impressions,Clicks\n/overview/pricing,10000,100\n');
    expect(rows).toEqual([{ page: '/overview/pricing', clicks: 100, impressions: 10000 }]);
  });
});

describe('summarize', () => {
  const sinks = ['/llms-full.txt', '/overview/self-hosting/railway'];

  test('reports site totals and the same totals excluding the impression sinks', () => {
    const { total, exSinks } = summarize(parseGscCsv(EXPORT_CSV), sinks);
    expect(total).toEqual({ clicks: 177, impressions: 89199, ctr: 177 / 89199 });
    expect(exSinks).toEqual({ clicks: 150, impressions: 15000, ctr: 0.01 });
  });

  test('breaks out each sink with its share of site impressions', () => {
    const { sinks: rows } = summarize(parseGscCsv(EXPORT_CSV), sinks);
    expect(rows.map((r: { path: string }) => r.path)).toEqual(sinks);
    expect(rows[0]).toEqual({
      path: '/llms-full.txt',
      clicks: 10,
      impressions: 37527,
      ctr: 10 / 37527,
      impressionShare: 37527 / 89199,
    });
  });

  test('matches sinks written as paths or full URLs, with or without a trailing slash', () => {
    const rows = parseGscCsv(
      ['Page,Clicks,Impressions', '/llms-full.txt,10,100', 'https://docs.steel.dev/x/,1,10'].join(
        '\n',
      ),
    );
    const { exSinks } = summarize(rows, ['https://docs.steel.dev/llms-full.txt', '/x']);
    expect(exSinks).toEqual({ clicks: 0, impressions: 0, ctr: 0 });
  });

  test('treats a sink missing from the export as zero rather than failing', () => {
    const rows = parseGscCsv('Page,Clicks,Impressions\n/overview/pricing,100,10000\n');
    const summary = summarize(rows, sinks);
    expect(summary.exSinks).toEqual({ clicks: 100, impressions: 10000, ctr: 0.01 });
    expect(summary.sinks[0]).toEqual({
      path: '/llms-full.txt',
      clicks: 0,
      impressions: 0,
      ctr: 0,
      impressionShare: 0,
    });
  });
});

describe('config', () => {
  test('tracks the impression sinks that distort site-level numbers', () => {
    expect(CONFIG.impression_sinks).toEqual(['/llms-full.txt', '/overview/self-hosting/railway']);
    expect(CONFIG.$comment_impression_sinks).toContain('impression');
  });
});
