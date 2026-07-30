// ABOUTME: Integration tests for the generate path of the pipeline, with a stand-in for
// ABOUTME: the OpenAI call so the prompt, dither, output and sidecar can all be checked.
import { afterAll, beforeAll, describe, setDefaultTimeout, test } from 'bun:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';

// The pipeline launches a fresh headless Chromium per render. On a loaded
// two-core CI runner one launch has taken over 30s, so allow generous headroom.
setDefaultTimeout(120000);

import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

import { run } from '../../../scripts/changelog/imagegen/index';
import { parseOptions } from '../../../scripts/changelog/imagegen/options';
import { getPalette } from '../../../scripts/changelog/imagegen/palettes';

const MOTIF = 'A quiet harbour at dawn where five ships dock at one long pier.';

/** Stands in for gpt-image-2: a gradient at the size that was asked for. */
function fakeGenerator(calls: Array<{ prompt: string; size: string }>) {
  return async ({ prompt, size }: { prompt: string; size: string }) => {
    calls.push({ prompt, size });
    const [width, height] = size.split('x').map(Number) as [number, number];
    const data = Buffer.alloc(width * height * 3);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        data[i] = Math.round((255 * x) / (width - 1));
        data[i + 1] = Math.round((255 * y) / (height - 1));
        data[i + 2] = 100;
      }
    }
    return sharp(data, { raw: { width, height, channels: 3 } })
      .png()
      .toBuffer();
  };
}

describe('run (generate path)', () => {
  let workdir: string;

  beforeAll(async () => {
    workdir = await mkdtemp(join(tmpdir(), 'changelog-run-'));
  });

  afterAll(async () => {
    await rm(workdir, { recursive: true, force: true });
  });

  test('generates, dithers, renders and records the run', async () => {
    const calls: Array<{ prompt: string; size: string }> = [];
    const out = join(workdir, 'card.png');
    const options = parseOptions([
      '--number',
      '35',
      '--motif',
      MOTIF,
      '--category',
      'Agent Workflow',
      '--date',
      '2026-07-24',
      '--out',
      out,
      '--scale',
      '1',
    ]);

    const result = await run(options, () => {}, { generate: fakeGenerator(calls) });

    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.size, '1536x864');
    assert.ok(calls[0]!.prompt.includes(MOTIF));

    const { width, height } = await sharp(await readFile(result.out)).metadata();
    assert.equal(width, 1420);
    assert.equal(height, 800);

    const sidecar = JSON.parse(await readFile(result.sidecar, 'utf8'));
    assert.equal(sidecar.number, '35');
    assert.equal(sidecar.category, 'Agent Workflow');
    assert.deepEqual(sidecar.background, { model: 'gpt-image-2', size: '1536x864' });
    assert.deepEqual(sidecar.dither, { palette: 'Elevate', matrix: 'bayer-16' });
    assert.equal(sidecar.spec.motif, MOTIF);
  });

  test('keeps the undithered original alongside the card', async () => {
    const out = join(workdir, 'kept.png');
    const options = parseOptions([
      '--number',
      '35',
      '--motif',
      MOTIF,
      '--out',
      out,
      '--scale',
      '1',
    ]);

    const result = await run(options, () => {}, { generate: fakeGenerator([]) });

    assert.equal(result.source, join(workdir, 'kept-source.png'));
    const { width, height } = await sharp(await readFile(result.source!)).metadata();
    assert.equal(width, 1536, 'the original should be kept at the generated size');
    assert.equal(height, 864);
  });

  test('puts only palette colours behind the card', async () => {
    const out = join(workdir, 'palette.png');
    const options = parseOptions([
      '--number',
      '35',
      '--motif',
      MOTIF,
      '--palette',
      'Ocean',
      '--out',
      out,
      '--scale',
      '1',
    ]);

    await run(options, () => {}, { generate: fakeGenerator([]) });

    // Re-dithering the kept original must reproduce exactly the palette in use.
    const palette = getPalette('Ocean');
    const { data } = await sharp(join(workdir, 'palette-source.png'))
      .resize(1420, 800, { fit: 'cover' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { ditherRgba } = await import('../../../scripts/changelog/imagegen/dither');
    const dithered = ditherRgba(
      { data: new Uint8ClampedArray(data), width: 1420, height: 800 },
      palette,
    );
    for (let i = 0; i < dithered.data.length; i += 4) {
      const hex = `#${[0, 1, 2].map((o) => dithered.data[i + o]!.toString(16).padStart(2, '0')).join('')}`;
      assert.ok(palette.includes(hex), `${hex} is not in the Ocean palette`);
    }
  });
});
