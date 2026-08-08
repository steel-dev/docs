// ABOUTME: Steel's core brand design language, served to agents at /DESIGN.md.
// ABOUTME: Machine-readable token block (palette/typefaces) followed by brand principles.

export const DESIGN_MD = `---
version: alpha
name: Steel
description: Steel's core brand design language — dark, dense, technical, and quiet. Color carries meaning; the mark is confident and minimal.
palette:
  canvas: "#0F0F0F"                            # the void behind everything
  surface: ["#161615", "#1C1C1A", "#232320"]  # neutral steps for layering
  ink: ["#EDEDEC", "#A1A09A", "#7F7E77"]      # primary → muted text
  hairline: "#232320"
  brand: ["#F5D90A", "#FF5500"]                # Steel yellow (primary), Steel orange
  status: { live: "#30A46C", warn: "#F5D90A", error: "#E5484D", info: "#0090FF" }
typefaces:
  ui: Geist
  mono: "Geist Mono"
  voice: "Compact and confident; Geist Mono carries code, data, and labels."
---

# Steel Brand

Steel is dark-first, dense, and quiet — a utilitarian, technical aesthetic for
people who work with browsers and infrastructure at speed. The interface steps
back; the data does the talking.

## Character
- **Dark and grounded.** Near-black canvases layered with warm-neutral surfaces. Never bright for its own sake.
- **Color means state.** Status colors signal what's happening (live, warn, error, info); brand yellow is the single accent, used sparingly.
- **Mono-minded.** Geist for prose; Geist Mono for code, identifiers, metrics, and labels. It reads like a tool, not a brochure.
- **Quiet depth.** Structure comes from tonal steps and 1px hairlines, not soft shadows.

## The mark
- Keep the wordmark crisp and uncrowded — give it generous clear space on every side.
- Never recolor, stretch, rotate, or add effects to the logo. On light grounds, use the inverted variant.
- Steel yellow (#F5D90A) may sit beside the mark as the brand accent; it never replaces the wordmark.

## Voice
Direct, technical, no fluff. Write operator to operator — precise nouns, short
sentences, no marketing superlatives.
`;
