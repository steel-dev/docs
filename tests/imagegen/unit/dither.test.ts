// ABOUTME: Unit tests for the Bayer matrix and the ordered colour dither, checked
// ABOUTME: against dithermark's algorithm so output matches dithering by hand there.
import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';

import {
  bayerMatrix,
  DITHER_MATRIX_SIZE,
  ditherRgba,
} from '../../../scripts/changelog/imagegen/dither';
import { getPalette, PALETTES } from '../../../scripts/changelog/imagegen/palettes';

const ELEVATE = getPalette('Elevate');

describe('bayerMatrix', () => {
  test('returns the 2x2 base matrix', () => {
    assert.deepEqual([...bayerMatrix(2)], [0, 2, 3, 1]);
  });

  test('returns the standard 4x4 matrix', () => {
    // prettier-ignore
    assert.deepEqual([...bayerMatrix(4)], [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]);
  });

  test('returns a permutation of 0..255 at 16x16', () => {
    const matrix = bayerMatrix(16);
    assert.equal(matrix.length, 256);
    assert.deepEqual(
      [...matrix].sort((a, b) => a - b),
      Array.from({ length: 256 }, (_, i) => i),
    );
  });

  test('defaults to the 16x16 matrix dithermark uses', () => {
    assert.equal(DITHER_MATRIX_SIZE, 16);
  });
});

/** A flat image of one colour, as RGBA. */
function flatImage(width: number, height: number, [r, g, b, a]: number[]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r!;
    data[i + 1] = g!;
    data[i + 2] = b!;
    data[i + 3] = a!;
  }
  return { data, width, height };
}

const hexOf = (data: Uint8ClampedArray, index: number) =>
  `#${[0, 1, 2].map((o) => data[index + o]!.toString(16).padStart(2, '0')).join('')}`;

describe('ditherRgba', () => {
  test('maps every pixel onto a palette colour', () => {
    const image = flatImage(32, 32, [120, 130, 140, 255]);
    const { data } = ditherRgba(image, ELEVATE);

    for (let i = 0; i < data.length; i += 4) {
      assert.ok(ELEVATE.includes(hexOf(data, i)), `pixel ${i / 4} is ${hexOf(data, i)}`);
    }
  });

  test('breaks a flat colour into more than one palette colour', () => {
    const image = flatImage(32, 32, [120, 130, 140, 255]);
    const { data } = ditherRgba(image, ELEVATE);

    const used = new Set<string>();
    for (let i = 0; i < data.length; i += 4) used.add(hexOf(data, i));
    assert.ok(used.size > 1, `expected a mix of palette colours, got ${[...used]}`);
  });

  test('repeats with the matrix period', () => {
    const image = flatImage(48, 48, [120, 130, 140, 255]);
    const { data } = ditherRgba(image, ELEVATE);
    const at = (x: number, y: number) => hexOf(data, (y * 48 + x) * 4);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        assert.equal(at(x, y), at(x + 16, y), `column period broke at ${x},${y}`);
        assert.equal(at(x, y), at(x, y + 16), `row period broke at ${x},${y}`);
      }
    }
  });

  test('is deterministic', () => {
    const first = ditherRgba(flatImage(16, 16, [90, 110, 130, 255]), ELEVATE).data;
    const second = ditherRgba(flatImage(16, 16, [90, 110, 130, 255]), ELEVATE).data;
    assert.deepEqual([...first], [...second]);
  });

  test('preserves alpha', () => {
    const { data } = ditherRgba(flatImage(8, 8, [90, 110, 130, 128]), ELEVATE);
    for (let i = 3; i < data.length; i += 4) assert.equal(data[i], 128);
  });

  test('snaps pure black and white to the nearest palette colours', () => {
    const black = ditherRgba(flatImage(4, 4, [0, 0, 0, 255]), ['#000000', '#ffffff']);
    for (let i = 0; i < black.data.length; i += 4) assert.equal(hexOf(black.data, i), '#000000');

    const white = ditherRgba(flatImage(4, 4, [255, 255, 255, 255]), ['#000000', '#ffffff']);
    for (let i = 0; i < white.data.length; i += 4) assert.equal(hexOf(white.data, i), '#ffffff');
  });

  test('rejects an empty palette', () => {
    assert.throws(() => ditherRgba(flatImage(4, 4, [0, 0, 0, 255]), []), /palette/i);
  });
});

describe('getPalette', () => {
  test("ships dithermark's palettes", () => {
    assert.equal(Object.keys(PALETTES).length, 33);
    assert.equal(ELEVATE.length, 18);
    assert.equal(ELEVATE[0], '#201a0b');
  });

  test('matches names case-insensitively', () => {
    assert.deepEqual(getPalette('elevate'), ELEVATE);
  });

  test('lists the options when the name is unknown', () => {
    assert.throws(() => getPalette('nope'), /unknown palette "nope".*Elevate/s);
  });
});
