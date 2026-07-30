// ABOUTME: Tests for the RFC 9727 API catalog served at /.well-known/api-catalog,
// ABOUTME: covering the linkset shape and that markdown negotiation leaves it alone.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { isNegotiableDocsPath } from '../lib/markdown-negotiation';

const CATALOG_PATH = '/.well-known/api-catalog';

type Link = { href: string; type?: string };
type LinksetEntry = {
  anchor: string;
  item?: Link[];
  'service-desc'?: Link[];
  'service-doc'?: Link[];
};

const catalog = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../public/.well-known/api-catalog', import.meta.url)),
    'utf8',
  ),
) as { linkset: LinksetEntry[] };

function entryFor(anchor: string): LinksetEntry | undefined {
  return catalog.linkset.find((entry) => entry.anchor === anchor);
}

describe('api catalog document', () => {
  test('is a linkset anchored at its own well-known URI', () => {
    expect(Array.isArray(catalog.linkset)).toBe(true);
    expect(entryFor(`https://docs.steel.dev${CATALOG_PATH}`)).toBeDefined();
  });

  test('lists the Steel API as a catalog item', () => {
    const items = entryFor(`https://docs.steel.dev${CATALOG_PATH}`)?.item ?? [];
    expect(items.map((item) => item.href)).toContain('https://api.steel.dev');
  });

  test('describes the API with the canonical OpenAPI spec, not a docs copy', () => {
    const [desc] = entryFor('https://api.steel.dev')?.['service-desc'] ?? [];

    // Pointing at the spec the API itself serves keeps one canonical copy, so
    // the catalog cannot advertise a spec that has drifted from the live API.
    expect(desc?.href).toBe('https://api.steel.dev/sdk-openapi.json');
    expect(desc?.type).toBe('application/json');
  });

  test('links human documentation for the API', () => {
    const [doc] = entryFor('https://api.steel.dev')?.['service-doc'] ?? [];
    expect(doc?.href).toStartWith('https://');
    expect(doc?.type).toBe('text/html');
  });

  test('every link is an absolute https URL', () => {
    for (const entry of catalog.linkset) {
      const links = [
        ...(entry.item ?? []),
        ...(entry['service-desc'] ?? []),
        ...(entry['service-doc'] ?? []),
      ];
      for (const link of links) {
        expect(link.href).toStartWith('https://');
      }
    }
  });
});

describe('api catalog and markdown negotiation', () => {
  test('is excluded from markdown negotiation', () => {
    // The path has no file extension, so without an explicit exclusion the
    // middleware would treat it as a docs page and rewrite it into a 404.
    expect(isNegotiableDocsPath(CATALOG_PATH)).toBe(false);
  });
});
