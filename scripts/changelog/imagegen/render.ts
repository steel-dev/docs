// ABOUTME: Renders the card HTML to a PNG buffer with headless Chromium.
// ABOUTME: The viewport is the Figma frame; --scale multiplies the exported resolution.
import { chromium } from 'playwright';

import { CARD_HEIGHT, CARD_WIDTH, type CardContent, renderCardHtml } from './template';

export type RenderOptions = {
  /** Resolution multiplier: 2 exports a 2840x1600 PNG. */
  scale?: number;
};

/** Renders a card to PNG bytes. */
export async function renderCard(
  content: CardContent,
  { scale = 2 }: RenderOptions = {},
): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: CARD_WIDTH, height: CARD_HEIGHT },
      deviceScaleFactor: scale,
    });
    await page.setContent(renderCardHtml(content), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    return await page.screenshot({ type: 'png' });
  } finally {
    await browser.close();
  }
}
