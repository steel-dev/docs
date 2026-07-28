// ABOUTME: Ordered (Bayer) colour dithering, ported from dithermark.com's worker so a
// ABOUTME: generated background matches what dithering it there by hand would produce.

/** dithermark's default ordered pattern size. */
export const DITHER_MATRIX_SIZE = 16;

export type RgbaImage = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

/**
 * Builds a Bayer threshold matrix of `dimensions` x `dimensions`, values 0..n²-1.
 * Each doubling nests the base [0 2 / 3 1] pattern, per the standard recursive
 * definition dithermark uses.
 */
export function bayerMatrix(dimensions: number): Uint8Array {
  const base = [0, 2, 3, 1];
  if (dimensions <= 2) return new Uint8Array(base);

  let size = 2;
  let matrix = new Uint8Array(base);

  while (size < dimensions) {
    const sectionSize = size;
    size *= 2;
    const next = new Uint8Array(size * size);

    // Fill the four quadrants: top-left, top-right, bottom-left, bottom-right.
    for (let quadrant = 0; quadrant < 4; quadrant++) {
      const originX = quadrant % 2 === 0 ? 0 : sectionSize;
      const originY = quadrant < 2 ? 0 : sectionSize;

      for (let y = 0; y < sectionSize; y++) {
        for (let x = 0; x < sectionSize; x++) {
          next[(originY + y) * size + originX + x] =
            matrix[y * sectionSize + x]! * 4 + base[quadrant]!;
        }
      }
    }
    matrix = next;
  }

  return matrix;
}

/**
 * Applies an ordered colour dither in place and returns the same image.
 *
 * Each pixel is nudged by its Bayer threshold — scaled by dithermark's r
 * coefficient of 256/∛n — then snapped to the nearest palette colour by squared
 * RGB distance, which is dithermark's default colour comparison mode.
 */
export function ditherRgba(
  image: RgbaImage,
  palette: readonly string[],
  matrixSize: number = DITHER_MATRIX_SIZE,
): RgbaImage {
  if (palette.length === 0) throw new Error('palette must contain at least one colour');

  const colors = palette.map(parseHex);
  const matrix = bayerMatrix(matrixSize);
  const period = Math.max(matrixSize, 2);
  const fraction = 1 / (matrix.length - 1);
  const rCoefficient = 256 / Math.cbrt(colors.length);

  // Uint8ClampedArray reproduces dithermark's clamping and rounding for free.
  const pixel = new Uint8ClampedArray(3);
  const { data, width } = image;

  for (let i = 0, x = 0, y = 0; i < data.length; i += 4) {
    const threshold =
      (fraction * matrix[(y % period) * period + (x % period)]! - 0.5) * rCoefficient;

    pixel[0] = data[i]! + threshold;
    pixel[1] = data[i + 1]! + threshold;
    pixel[2] = data[i + 2]! + threshold;

    const match = closestColor(pixel, colors);
    data[i] = match[0]!;
    data[i + 1] = match[1]!;
    data[i + 2] = match[2]!;

    if (++x >= width) {
      x = 0;
      y++;
    }
  }

  return image;
}

function closestColor(pixel: Uint8ClampedArray, colors: number[][]): number[] {
  let closest = colors[0]!;
  let closestDistance = Infinity;

  for (const color of colors) {
    const dr = pixel[0]! - color[0]!;
    const dg = pixel[1]! - color[1]!;
    const db = pixel[2]! - color[2]!;
    const distance = dr * dr + dg * dg + db * db;
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = color;
    }
  }

  return closest;
}

function parseHex(hex: string): number[] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`palette colour must be a 6-digit hex value, got "${hex}"`);

  const value = Number.parseInt(match[1]!, 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}
