// ABOUTME: Renders the card HTML to a PNG buffer with headless Chromium.
// ABOUTME: The viewport is the Figma frame; --scale multiplies the exported resolution.
import { type Browser, chromium } from 'playwright';

import { CARD_HEIGHT, CARD_WIDTH, type CardContent, renderCardHtml } from './template';

export type RenderOptions = {
  /** Resolution multiplier: 2 exports a 2840x1600 PNG. */
  scale?: number;
  /** An already-launched browser to render in; the caller owns its lifecycle. */
  browser?: Browser;
};

/** Renders a card to PNG bytes. */
export async function renderCard(
  content: CardContent,
  { scale = 2, browser }: RenderOptions = {},
): Promise<Buffer> {
  const ownBrowser = browser === undefined;
  const target = browser ?? (await chromium.launch());
  try {
    const page = await target.newPage({
      viewport: { width: CARD_WIDTH, height: CARD_HEIGHT },
      deviceScaleFactor: scale,
    });
    try {
      await page.setContent(renderCardHtml(content), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      return await page.screenshot({ type: 'png' });
    } finally {
      await page.close();
    }
  } finally {
    if (ownBrowser) await target.close();
  }
}
