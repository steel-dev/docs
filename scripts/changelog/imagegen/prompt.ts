// ABOUTME: Builds the gpt-image-2 prompt for a changelog background — the Steel house
// ABOUTME: style is fixed here, only the motif and color grade come from the CLI.

/**
 * Everything that stays the same for every changelog cover. Edit this block to
 * retune the look across all future cards; per-card variation belongs in the
 * motif and color grade instead.
 */
export const HOUSE_STYLE = {
  main_description:
    'Blue-hour Japanese animation background, painterly environmental illustration, nostalgic industrial slice-of-life realism, soft cinematic light, warm signal glows, quiet infrastructure beauty, tactile metal-and-glass atmosphere, subtle film grain and halftone texture.',
  style_notes: {
    atmosphere:
      'quiet, cinematic, reflective, warm, precise, optimistic, post-launch calm, quietly triumphant',
    lighting:
      'blue-hour ambient light, soft dawn glow at the horizon, amber signal lamps, gold highlights on wet surfaces, gentle bloom, mist catching small points of light',
    colors:
      'midnight blue, deep teal, muted steel gray, warm amber, soft gold, pale cyan reflections, faint lavender haze, restrained pastel warmth',
    rendering:
      'clean drawn infrastructure with painterly color, crisp geometry, soft atmospheric detail, tactile metal surfaces, subtle grain, light halftone texture, polished anime background finish',
    composition:
      'wide cinematic framing, low-to-mid vantage point, a clear focal subject in the middle distance, calm negative space across the lower-left third and the upper edge so headline and label overlays stay legible',
  },
  avoid: [
    'photorealism',
    'dark dystopian mood',
    'harsh contrast',
    'gritty realism',
    'overly saturated neon',
    'heavy comic-book outlines',
    'readable text',
    'letters',
    'numbers',
    'logos',
    'watermarks',
    'user interface panels',
    'charts',
    'diagrams',
    'human faces in close-up',
    'workbench clutter',
    'busy foreground detail in the lower-left corner',
  ],
} as const;

/** Used when the CLI does not pass --color-grade. */
export const DEFAULT_COLOR_GRADE =
  'deep blue-hour shadows with faint gold highlights, muted teal reflections, warm amber lamp light, and soft dawn haze';

const PROMPT_TEMPLATE =
  '{{motif}}, rendered as {{main_description}} Apply a subtle overall {{color_grade}} color grade. The composition should feel calm, precise, and quietly triumphant, with environmental storytelling that carries the meaning of the release without any text, symbols, or diagrams. Use painterly detail, clean silhouettes, soft atmospheric depth, and a subtle screen-texture finish so it feels like a polished anime background still rather than a technical illustration.';

export type ImageSpecInput = {
  motif: string;
  colorGrade?: string;
};

export type ImageSpec = {
  main_description: string;
  motif: string;
  color_grade: string;
  prompt: string;
  style_notes: typeof HOUSE_STYLE.style_notes;
  avoid: readonly string[];
};

/** Assembles the full spec, including the flattened prompt sent to the model. */
export function buildImageSpec({ motif, colorGrade }: ImageSpecInput): ImageSpec {
  const trimmedMotif = motif?.trim();
  if (!trimmedMotif) throw new Error('motif must not be empty');

  const grade = colorGrade?.trim() || DEFAULT_COLOR_GRADE;
  const body = PROMPT_TEMPLATE.replace('{{motif}}', trimmedMotif)
    .replace('{{main_description}}', HOUSE_STYLE.main_description)
    .replace('{{color_grade}}', grade);

  const notes = Object.entries(HOUSE_STYLE.style_notes)
    .map(([key, value]) => `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${value}.`)
    .join(' ');

  return {
    main_description: HOUSE_STYLE.main_description,
    motif: trimmedMotif,
    color_grade: grade,
    prompt: `${body} ${notes} Avoid: ${HOUSE_STYLE.avoid.join(', ')}.`,
    style_notes: HOUSE_STYLE.style_notes,
    avoid: HOUSE_STYLE.avoid,
  };
}
