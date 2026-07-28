// ABOUTME: Parses and validates the CLI flags into the options object a run needs.
// ABOUTME: Applies the defaults (today's date, "Product Update", output path, scale).

import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { DEFAULT_PALETTE, getPalette } from './palettes';
import { TIME_OF_DAY_GRADES } from './prompt';

export type Options = {
  category: string;
  date: Date;
  number: string;
  motif?: string;
  colorGrade?: string;
  /** Preset name behind colorGrade, or undefined with an explicit --color-grade. */
  timeOfDay?: string;
  background?: string;
  out: string;
  size: string;
  scale: number;
  /** Palette the background is dithered against, or undefined with --no-dither. */
  palette: readonly string[] | undefined;
  paletteName: string | undefined;
  printPrompt: boolean;
  help: boolean;
};

export const DEFAULT_CATEGORY = 'Product Update';
/** 1.778:1 — near-identical to the card's 1420x800, so almost nothing is cropped. */
export const DEFAULT_SIZE = '1536x864';

export const USAGE = `changelog-imagegen — render a Steel changelog cover with a freshly generated background

Usage:
  changelog-imagegen --number 35 --motif "<scene description>" [options]

Options:
  --number <n>          Changelog number, e.g. 35                     (required)
  --motif <text>        Scene to generate  (required unless --background)
  --category <text>     Header label, stacked on two lines            (default: "${DEFAULT_CATEGORY}")
  --date <YYYY-MM-DD>   Date shown top-right                          (default: today)
  --time-of-day <name>  dawn|morning|midday|golden-hour|dusk|night    (default: random)
  --color-grade <text>  Free-form color grade; overrides --time-of-day
  --background <path>   Reuse an existing background instead of generating one
  --out <path>          Output PNG                                    (default: output/changelog-<n>.png)
  --size <WxH>          Generated background size                     (default: ${DEFAULT_SIZE})
  --scale <n>           Render scale; 2 gives a 2840x1600 PNG         (default: 2)
  --palette <name>      dithermark palette for the dither             (default: ${DEFAULT_PALETTE})
  --no-dither           Leave the generated background undithered
  --print-prompt        Print the image prompt and exit
  --help                Show this help

Requires OPENAI_API_KEY unless --background or --print-prompt is used.`;

/** Parses argv (without node/script) into validated options. */
export function parseOptions(argv: string[], random: () => number = Math.random): Options {
  const { values } = parseArgs({
    args: argv,
    options: {
      category: { type: 'string' },
      date: { type: 'string' },
      number: { type: 'string' },
      motif: { type: 'string' },
      'time-of-day': { type: 'string' },
      'color-grade': { type: 'string' },
      background: { type: 'string' },
      out: { type: 'string' },
      size: { type: 'string' },
      scale: { type: 'string' },
      palette: { type: 'string' },
      'no-dither': { type: 'boolean', default: false },
      'print-prompt': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    strict: true,
  });

  if (values.help) {
    return {
      category: DEFAULT_CATEGORY,
      date: new Date(),
      number: '',
      out: '',
      size: DEFAULT_SIZE,
      scale: 2,
      palette: undefined,
      paletteName: undefined,
      printPrompt: false,
      help: true,
    };
  }

  const number = values.number?.trim();
  if (!number) throw new Error('--number is required (the changelog number, e.g. 35)');

  const motif = values.motif?.trim();
  const background = values.background?.trim();
  if (!motif && !background) {
    throw new Error('--motif is required unless you pass --background');
  }

  const scale = values.scale === undefined ? 2 : Number(values.scale);
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(`--scale must be a positive number, got "${values.scale}"`);
  }

  const paletteName = values['no-dither'] ? undefined : values.palette?.trim() || DEFAULT_PALETTE;

  const explicitGrade = values['color-grade']?.trim();
  const timeOfDay = explicitGrade ? undefined : resolveTimeOfDay(values['time-of-day'], random);

  return {
    category: values.category?.trim() || DEFAULT_CATEGORY,
    date: parseDate(values.date),
    number,
    motif,
    colorGrade: explicitGrade || TIME_OF_DAY_GRADES[timeOfDay as string],
    timeOfDay,
    background: background ? resolve(background) : undefined,
    out: resolve(values.out?.trim() || `output/changelog-${number}.png`),
    size: values.size?.trim() || DEFAULT_SIZE,
    scale,
    palette: paletteName ? getPalette(paletteName) : undefined,
    paletteName,
    printPrompt: values['print-prompt'] ?? false,
    help: false,
  };
}

/** Resolves a --time-of-day value ('random' or unset picks one) to a preset name. */
function resolveTimeOfDay(value: string | undefined, random: () => number): string {
  const names = Object.keys(TIME_OF_DAY_GRADES);
  const requested = value?.trim();

  if (!requested || requested === 'random') {
    return names[Math.min(Math.floor(random() * names.length), names.length - 1)] as string;
  }

  if (!names.includes(requested)) {
    throw new Error(
      `--time-of-day must be one of ${names.join(', ')} or random, got "${requested}"`,
    );
  }
  return requested;
}

/** Reads YYYY-MM-DD as a local calendar date; defaults to today. */
function parseDate(value: string | undefined): Date {
  if (!value) return new Date();

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error(`--date must be YYYY-MM-DD, got "${value}"`);

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
    throw new Error(`--date is not a real date: "${value}"`);
  }
  return date;
}
