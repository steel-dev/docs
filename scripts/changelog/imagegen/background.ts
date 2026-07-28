// ABOUTME: Prepares a generated image for use as the card background: cover-crop to the
// ABOUTME: card, then ordered-dither it against a dithermark palette.
import sharp from 'sharp';

import { ditherRgba } from './dither';
import { CARD_HEIGHT, CARD_WIDTH } from './template';

export type PrepareBackgroundOptions = {
  /** Palette to dither against, or undefined to leave the image alone. */
  palette: readonly string[] | undefined;
};

export type PreparedBackground = {
  png: Buffer;
  /** True when the image is already at card size and must be upscaled without resampling. */
  pixelated: boolean;
};

/**
 * Dithering happens at the card's logical size, never at the export size, so the
 * dot pattern is the same relative to the card at --scale 1 and --scale 2. The
 * renderer then upscales it with nearest-neighbour to keep the dots crisp.
 */
export async function prepareBackground(
  source: Buffer,
  { palette }: PrepareBackgroundOptions,
): Promise<PreparedBackground> {
  if (!palette) return { png: source, pixelated: false };

  const { data, info } = await sharp(source)
    .resize(CARD_WIDTH, CARD_HEIGHT, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const dithered = ditherRgba(
    {
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length),
      width: info.width,
      height: info.height,
    },
    palette,
  );

  const png = await sharp(
    Buffer.from(dithered.data.buffer, dithered.data.byteOffset, dithered.data.length),
    {
      raw: { width: info.width, height: info.height, channels: 4 },
    },
  )
    .png()
    .toBuffer();

  return { png, pixelated: true };
}
