// ABOUTME: Orchestrates one run: build the prompt, get a background, render the card,
// ABOUTME: and write the PNG plus a sidecar JSON recording how it was made.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { prepareBackground } from './background';
import { DITHER_MATRIX_SIZE } from './dither';
import { generateBackground, IMAGE_MODEL } from './openai';
import type { Options } from './options';
import { buildImageSpec, type ImageSpec } from './prompt';
import { renderCard } from './render';
import { formatCardDate, splitLabelLines, titleLines, toIsoDate } from './text';

export type RunResult = {
  out: string;
  sidecar: string;
  /** Where the raw generated image was kept, so it can be re-dithered for free. */
  source?: string;
  spec?: ImageSpec;
};

export type RunDependencies = {
  /** Seam for tests, so the pipeline can be exercised without calling OpenAI. */
  generate?: typeof generateBackground;
};

/** Runs the full pipeline for the given options. */
export async function run(
  options: Options,
  log: (message: string) => void = () => {},
  { generate = generateBackground }: RunDependencies = {},
): Promise<RunResult> {
  const spec = options.motif
    ? buildImageSpec({ motif: options.motif, colorGrade: options.colorGrade })
    : undefined;

  let source: Buffer;
  if (options.background) {
    log(`Using background ${options.background}`);
    source = await readFile(options.background);
  } else {
    log(
      `Generating background with ${IMAGE_MODEL} at ${options.size}${
        options.timeOfDay ? ` (${options.timeOfDay})` : ''
      }…`,
    );
    source = await generate({ prompt: spec!.prompt, size: options.size });
  }

  if (options.palette) {
    log(
      `Dithering with Bayer ${DITHER_MATRIX_SIZE}x${DITHER_MATRIX_SIZE} and the ${options.paletteName} palette…`,
    );
  }
  const background = await prepareBackground(source, { palette: options.palette });

  log('Rendering card…');
  const png = await renderCard(
    {
      categoryLines: splitLabelLines(options.category),
      dateLines: formatCardDate(options.date),
      titleLines: titleLines(options.number),
      backgroundDataUri: `data:image/png;base64,${background.png.toString('base64')}`,
      pixelatedBackground: background.pixelated,
    },
    { scale: options.scale },
  );

  const stem = options.out.replace(/\.png$/i, '');
  const sidecar = `${stem}.json`;
  // Keep the undithered original so another palette can be tried without paying again.
  const sourcePath = options.background ? undefined : `${stem}-source.png`;

  await mkdir(dirname(options.out), { recursive: true });
  await writeFile(options.out, png);
  if (sourcePath) await writeFile(sourcePath, source);
  await writeFile(
    sidecar,
    `${JSON.stringify(
      {
        number: options.number,
        category: options.category,
        date: toIsoDate(options.date),
        scale: options.scale,
        timeOfDay: options.timeOfDay ?? null,
        background: options.background ?? { model: IMAGE_MODEL, size: options.size },
        dither: options.paletteName
          ? { palette: options.paletteName, matrix: `bayer-${DITHER_MATRIX_SIZE}` }
          : false,
        spec,
      },
      null,
      2,
    )}\n`,
  );

  log(`Wrote ${options.out}`);
  if (sourcePath) log(`Kept the undithered original at ${sourcePath}`);
  return { out: options.out, sidecar, source: sourcePath, spec };
}
