// ABOUTME: Builds the 1420x800 changelog card as a self-contained HTML document,
// ABOUTME: a direct port of the Figma frame with every asset inlined as a data URI.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const assetsDir = new URL('./assets/', import.meta.url);

const FONT_DATA_URI = dataUri('font/ttf', read('fonts/Geist-SemiBold.ttf'));
const LOGO_DATA_URI = dataUri('image/svg+xml', read('steel-logo.svg'));
const GRID_DATA_URI = dataUri('image/svg+xml', read('grid.svg'));

export const CARD_WIDTH = 1420;
export const CARD_HEIGHT = 800;

export type CardContent = {
  /** Header label, already broken into the lines it should render on. */
  categoryLines: string[];
  /** Date shown top-right: "July 24" over "2026". */
  dateLines: string[];
  /** Headline: "Changelog" over "No. 35". */
  titleLines: string[];
  /** Background image as a data URI. */
  backgroundDataUri: string;
  /** True when the background is already card-sized and must upscale without blurring. */
  pixelatedBackground?: boolean;
};

/** Renders the card as a standalone HTML document. */
export function renderCardHtml(content: CardContent): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: "Geist";
    font-weight: 600;
    font-style: normal;
    src: url("${FONT_DATA_URI}") format("truetype");
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: ${CARD_WIDTH}px;
    height: ${CARD_HEIGHT}px;
    overflow: hidden;
    font-family: "Geist";
    font-weight: 600;
    font-feature-settings: "dlig" 1;
    -webkit-font-smoothing: antialiased;
    background: #000;
  }

  .card {
    position: relative;
    width: ${CARD_WIDTH}px;
    height: ${CARD_HEIGHT}px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }

  .background,
  .scrim,
  .grid {
    position: absolute;
    pointer-events: none;
  }

  .background {
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .scrim {
    inset: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
  }

  /* The grid group is 1390x800 in Figma, centred in the 1420px frame. */
  .grid {
    top: 50%;
    left: 50%;
    width: 1390px;
    height: 800px;
    transform: translate(-50%, -50%);
  }

  .header {
    position: relative;
    display: flex;
    align-items: center;
    gap: 32px;
    padding: 32px;
    width: 100%;
  }

  .header-slot {
    display: flex;
    flex: 1 0 0;
    min-width: 1px;
    align-items: center;
    justify-content: center;
  }

  .logo {
    display: block;
    width: 54.286px;
    height: 40px;
  }

  .meta {
    flex: 1 0 0;
    min-width: 1px;
    font-size: 24px;
    line-height: 24px;
    letter-spacing: -0.72px;
    color: rgba(255, 255, 255, 0.8);
    word-break: break-word;
  }

  .meta-right { text-align: right; }

  .body {
    position: relative;
    display: flex;
    flex: 1 0 0;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    min-height: 1px;
    padding: 32px;
    width: 100%;
  }

  .title {
    width: 100%;
    font-size: 104px;
    line-height: 1;
    letter-spacing: -3.12px;
    color: #fff;
    word-break: break-word;
    text-box-trim: trim-both;
    text-box-edge: cap alphabetic;
    text-box: trim-both cap alphabetic;
  }
</style>
</head>
<body>
  <div class="card">
    <img class="background" alt="" src="${content.backgroundDataUri}"${
      content.pixelatedBackground ? ' style="image-rendering: pixelated;"' : ''
    }>
    <div class="scrim"></div>
    <img class="grid" alt="" src="${GRID_DATA_URI}">

    <div class="header">
      <div class="header-slot" style="justify-content: flex-start;">
        <img class="logo" alt="" src="${LOGO_DATA_URI}">
      </div>
      <div class="header-slot">
        <div class="meta">${lines(content.categoryLines)}</div>
      </div>
      <div class="header-slot">
        <div class="meta meta-right">${lines(content.dateLines)}</div>
      </div>
    </div>

    <div class="body">
      <div class="title">${lines(content.titleLines)}</div>
    </div>
  </div>
</body>
</html>`;
}

function lines(values: string[]): string {
  return values.map((value) => `<p>${escapeHtml(value)}</p>`).join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function read(name: string): Buffer {
  return readFileSync(fileURLToPath(new URL(name, assetsDir)));
}

function dataUri(mime: string, bytes: Buffer): string {
  return `data:${mime};base64,${bytes.toString('base64')}`;
}
