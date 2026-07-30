// ABOUTME: Verifies schema freshness stays Git-derived while sitemap dates may use mtime.
// ABOUTME: Protects JSON-LD from presenting checkout or build timestamps as content edits.
import { expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGitLastModified, getLastModified } from '@/lib/last-modified';

test('keeps filesystem fallback out of Git-derived schema freshness', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'steel-schema-freshness-'));
  const file = join(directory, 'untracked.mdx');

  try {
    await writeFile(file, '# Untracked\n');

    expect(getGitLastModified(file)).toBeUndefined();
    expect(await getLastModified(file)).toBeInstanceOf(Date);
  } finally {
    await rm(directory, { recursive: true });
  }
});
