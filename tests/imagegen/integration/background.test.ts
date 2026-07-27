// ABOUTME: Integration tests for background preparation — cover-cropping the generated
// ABOUTME: image to the card and dithering it against a dithermark palette.
import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

import { prepareBackground } from '../../../scripts/changelog/imagegen/background';
import { getPalette } from '../../../scripts/changelog/imagegen/palettes';
import { CARD_HEIGHT, CARD_WIDTH } from '../../../scripts/changelog/imagegen/template';

/** A horizontal gradient, so there is real tonal range to dither. */
async function gradient(width: number, height: number): Promise<Buffer> {
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      data[i] = Math.round((255 * x) / (width - 1));
      data[i + 1] = Math.round((255 * y) / (height - 1));
      data[i + 2] = 128;
    }
  }
  return sharp(data, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}

const colorsIn = async (png: Buffer) => {
  const { data } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const used = new Set<string>();
  for (let i = 0; i < data.length; i += 4) {
    used.add(`#${[0, 1, 2].map((o) => data[i + o]!.toString(16).padStart(2, '0')).join('')}`);
  }
  return used;
};

describe('prepareBackground', () => {
  test('cover-crops a wider source to the card size', async () => {
    const { png, pixelated } = await prepareBackground(await gradient(2048, 512), {
      palette: getPalette('Elevate'),
    });

    const { width, height } = await sharp(png).metadata();
    assert.equal(width, CARD_WIDTH);
    assert.equal(height, CARD_HEIGHT);
    assert.equal(pixelated, true, 'a dithered background must not be resampled smoothly');
  });

  test('uses only palette colours', async () => {
    const palette = getPalette('Elevate');
    const { png } = await prepareBackground(await gradient(1536, 864), { palette });

    const used = await colorsIn(png);
    assert.ok(used.size > 1, 'expected the dither to mix palette colours');
    for (const color of used) assert.ok(palette.includes(color), `${color} is not in the palette`);
  });

  test('honours a different palette', async () => {
    const palette = getPalette('Ocean');
    const { png } = await prepareBackground(await gradient(1536, 864), { palette });

    for (const color of await colorsIn(png)) {
      assert.ok(palette.includes(color), `${color} is not in the Ocean palette`);
    }
  });

  test('dithers at card size, so dot size does not depend on the export scale', async () => {
    const { png } = await prepareBackground(await gradient(1536, 864), {
      palette: getPalette('Elevate'),
    });

    const { width, height } = await sharp(png).metadata();
    assert.equal(width, CARD_WIDTH);
    assert.equal(height, CARD_HEIGHT);
  });

  test('passes the source through untouched when dithering is off', async () => {
    const source = await gradient(1536, 864);
    const { png, pixelated } = await prepareBackground(source, { palette: undefined });

    assert.equal(pixelated, false);
    assert.deepEqual(png, source);
  });
});
