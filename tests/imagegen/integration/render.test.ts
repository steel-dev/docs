// ABOUTME: Integration tests that render the card with headless Chromium and inspect
// ABOUTME: the resulting pixels for size, background, scrim, grid lines and text.
import { beforeAll, describe, setDefaultTimeout, test } from 'bun:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';

// The render hook launches headless Chromium, which is slow enough on a loaded
// two-core CI runner to blow past a 30s budget.
setDefaultTimeout(120000);

import { renderCard } from '../../../scripts/changelog/imagegen/render';
import { CARD_HEIGHT, CARD_WIDTH } from '../../../scripts/changelog/imagegen/template';

/** A flat mid-grey background, so overlays are easy to detect. */
function solidBackgroundDataUri(r: number, g: number, b: number): string {
  const png = new PNG({ width: 64, height: 36 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = 255;
  }
  return `data:image/png;base64,${PNG.sync.write(png).toString('base64')}`;
}

const content = {
  categoryLines: ['Product', 'Update'],
  dateLines: ['July 24', '2026'],
  titleLines: ['Changelog', 'No. 35'],
  backgroundDataUri: solidBackgroundDataUri(128, 128, 128),
};

describe('renderCard', () => {
  let image: PNG;
  const scale = 1;

  beforeAll(async () => {
    image = PNG.sync.read(await renderCard(content, { scale }));
  });

  const brightness = (x: number, y: number) => {
    const index = (image.width * y + x) << 2;
    return (image.data[index]! + image.data[index + 1]! + image.data[index + 2]!) / 3;
  };
  /** True if any pixel in the box is near-white, i.e. text or logo ink. */
  const hasInk = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) if (brightness(x, y) > 200) return true;
    }
    return false;
  };

  test('renders at the Figma frame size', () => {
    assert.equal(image.width, CARD_WIDTH * scale);
    assert.equal(image.height, CARD_HEIGHT * scale);
  });

  test('covers the frame with the background image', () => {
    // Mid-grey (128) under a 20%-40% black scrim lands in the 76..103 range.
    const samples: Array<[number, number]> = [
      [700, 300],
      [250, 150],
      [1150, 720],
    ];
    for (const [x, y] of samples) {
      const value = brightness(x, y);
      assert.ok(value > 70 && value < 110, `expected scrimmed grey at ${x},${y}, got ${value}`);
    }
  });

  test('darkens the bottom more than the top', () => {
    assert.ok(
      brightness(700, 780) < brightness(700, 20) - 5,
      'bottom of the scrim should be noticeably darker than the top',
    );
  });

  test('draws the four vertical grid lines', () => {
    const lineXs = [16, 479, 941, 1404];
    const gapY = 300;
    for (const x of lineXs) {
      const line = Math.max(brightness(x - 1, gapY), brightness(x, gapY));
      const nearby = brightness(x + 40, gapY);
      assert.ok(line > nearby + 3, `expected a lighter grid line near x=${x}`);
    }
  });

  test('places the Steel logo in the top-left', () => {
    assert.ok(hasInk(32, 32, 87, 72), 'logo mark should be visible at 32,32');
  });

  test('places the category label and the date in the header', () => {
    assert.ok(hasInk(494, 24, 700, 80), 'category label should sit in the middle slot');
    assert.ok(hasInk(1200, 24, 1388, 80), 'date should sit in the right slot');
  });

  test('bottoms out the headline against the 32px padding', () => {
    assert.ok(hasInk(32, 590, 600, 770), 'headline should fill the lower-left block');
    assert.ok(!hasInk(32, 772, 600, 800), 'headline must not reach into the bottom padding');
  });

  test('keeps the headline inside the left padding', () => {
    assert.ok(!hasInk(0, 560, 31, 800), 'nothing should render left of the 32px padding');
  });
});
