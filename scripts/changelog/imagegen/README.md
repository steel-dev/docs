# changelog imagegen

Renders the Steel changelog cover ([Figma frame 4180:8](https://www.figma.com/design/cvUQ2hiigj9FeB304X6yp8/Steel---Media-Assets--main-?node-id=4180-8&m=dev)) with a freshly generated background. Every element except the background is fixed: the Steel mark, the four vertical guide lines, the black scrim, and the Geist SemiBold type. The background comes from `gpt-image-2` on every run and is ordered-dithered in the same way dithermark.com does it.

The changelog draft generator calls this pipeline through `scripts/changelog/cover.ts` using the model-provided `coverMotif`. It is also a standalone CLI for manual runs and palette retries.

## Usage

```bash
export OPENAI_API_KEY=sk-…
bun run generate-changelog-image -- \
  --number 35 \
  --category "Product Update" \
  --date 2026-07-24 \
  --motif "A nighttime rail-switching terminal where five separate routes have just converged into one illuminated central line…"
```

Writes three files:

- `output/changelog-35.png` — the card, 2840×1600
- `output/changelog-35-source.png` — the raw generated image before dithering
- `output/changelog-35.json` — number, category, date, dither settings and the full image spec

The source is kept so you can retry a palette without paying for another generation:

```bash
bun run generate-changelog-image -- --number 35 --background output/changelog-35-source.png --palette Ocean
```

| Flag | Default | Notes |
| --- | --- | --- |
| `--number` | *required* | Renders as `No. 35` |
| `--motif` | *required* | The scene to generate. Not needed with `--background` |
| `--category` | `Product Update` | Stacked on two lines, balanced by word length. A `\n` forces the break |
| `--date` | today | `YYYY-MM-DD`, rendered as `July 24` / `2026` |
| `--color-grade` | blue-hour default | Overrides the grade in the prompt |
| `--background` | – | Reuse an image instead of generating one — good for retyping a card |
| `--out` | `output/changelog-<n>.png` | |
| `--size` | `1536x864` | Size requested from `gpt-image-2`; matches the card ratio, so nothing meaningful is cropped |
| `--scale` | `2` | `1` renders 1420×800 (the size committed to `public/images/changelog/`), `2` renders 2840×1600 |
| `--palette` | `Elevate` | Any dithermark palette by name, e.g. `Ocean`, `Galaxy`, `Sepia` |
| `--no-dither` | – | Leave the background undithered |
| `--print-prompt` | – | Print the image spec as JSON and exit, no API call |

## The prompt

`prompt.ts` holds the house style — `main_description`, `style_notes` and the `avoid` list — which stays identical across cards. Only `motif` and `color_grade` vary per run, and both come from flags. The final prompt is the same template as the reference spec: motif, then style, then color grade, then the style notes and avoid list.

Two fields differ from the original reference spec, because they described that card's specific scene rather than the house style: `composition` is now motif-agnostic (it still reserves calm negative space in the lower-left for the headline), and `symbolism` was dropped — that job belongs to `--motif`.

## The dither

`dither.ts` is a port of dithermark.com's ordered colour dither, so running the CLI gives the same result as uploading the image there and picking Bayer 16×16 with a palette. Per pixel: take the Bayer threshold, map it to `bayer/255 − 0.5`, scale it by dithermark's r coefficient of `256/∛n`, add that to R, G and B with 8-bit clamping, then snap to the nearest palette colour by squared RGB distance (dithermark's default colour comparison mode). `palettes.ts` holds all 33 of its built-in palettes.

The dither is applied at the card's own 1420×800, never at the export size, so the dot pattern is the same relative to the card at `--scale 1` and `--scale 2`. The renderer then upscales it with nearest-neighbour, so at 2× every dither dot is a crisp 2×2 block instead of a blurred one.

Note that the background in the original Figma frame was **not** made with a dithermark palette — none of its colours match one — so cards from this tool will not look identical to that specific frame.

## Layout

`template.ts` is a direct port of the Figma frame: 1420×800, 32px padding, a 20%→40% black vertical scrim, the 1390×800 guide-line group centred in the frame, a 54.286×40 Steel mark, 24px/24px header type at 80% white with -0.72px tracking, and the 104px headline at -3.12px tracking trimmed to its cap/alphabetic box. Assets in `assets/` are the exported Figma vectors and the Geist SemiBold TTF, all inlined as data URIs at render time.

## Tests

Tests live in `tests/imagegen/` and run with the rest of the suite:

```bash
bun test tests/imagegen/            # all 71
bun test tests/imagegen/unit/       # text, prompt, options, Bayer matrix and dither
bun test tests/imagegen/integration # renders with Chromium and sharp, asserts on pixels
bun test tests/imagegen/e2e/        # runs the CLI as a subprocess
```

No test hits the OpenAI API. The generate path is covered by passing a stand-in generator to `run()`; everything else goes through `--background`.
