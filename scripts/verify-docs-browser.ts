import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.argv[2];
if (!origin) throw new Error('Usage: bun scripts/verify-docs-browser.ts <preview-origin>');
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const browser = await chromium.launch();
await mkdir('.vercel/qa', { recursive: true });
try {
  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ] as const) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors: string[] = [];
    const rsc: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (
        new URL(response.url()).origin === origin &&
        response.status() >= 400 &&
        ['script', 'stylesheet', 'image', 'font'].includes(response.request().resourceType())
      ) {
        errors.push(`Asset ${response.status()}: ${new URL(response.url()).pathname}`);
      }
      if (response.headers()['content-type']?.includes('text/x-component') && response.ok()) {
        rsc.push(response.url());
      }
    });
    await page.route('**/*', (route) => {
      const headers = route.request().headers();
      if (new URL(route.request().url()).origin === origin && bypass) {
        headers['x-vercel-protection-bypass'] = bypass;
      }
      return route.continue({ headers });
    });
    await page.goto(`${origin}/docs/overview/steel-cli`);
    await page.getByRole('heading', { name: 'Steel CLI', exact: true }).waitFor();
    await page.waitForFunction(() => {
      const anchor = document.querySelector('a[href="/docs/overview/authentication"]');
      return anchor && Object.keys(anchor).some((key) => key.startsWith('__reactFiber$'));
    });
    if (name === 'mobile') {
      await page.getByRole('button', { name: 'Open navigation' }).click();
    }
    await page.locator('a[href="/docs/overview/authentication"]:visible').first().click();
    await page.waitForURL('**/docs/overview/authentication');
    await page.getByRole('heading', { name: 'Authentication', exact: true }).waitFor();
    if (name === 'mobile') await page.locator('[aria-label="Search"]:visible').first().click();
    else await page.getByText('Search...', { exact: true }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input').fill('Steel CLI');
    await dialog.locator('a[href^="/docs/overview/steel-cli"]').first().click();
    await page.waitForURL('**/docs/overview/steel-cli*');
    const anchor = await page.locator('h2[id]').first().getAttribute('id');
    if (!anchor) throw new Error('Expected a heading anchor');
    await page.goto(`${origin}/docs/overview/steel-cli#${encodeURIComponent(anchor)}`);
    await page.reload();
    if (
      decodeURIComponent(new URL(page.url()).hash.slice(1)) !== anchor ||
      !(await page.locator(`[id="${anchor}"]`).count())
    ) {
      throw new Error('Heading anchor did not survive navigation/reload');
    }
    await page.screenshot({ path: `.vercel/qa/docs-${name}.png`, fullPage: true });
    const escapes = await page
      .locator('a[href]')
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute('href') || '')
          .filter(
            (href) => href.startsWith('/') && !href.startsWith('/docs') && !href.startsWith('//'),
          ),
      );
    if (errors.length || escapes.length || !rsc.length) {
      throw new Error(JSON.stringify({ name, errors, escapes, rsc }));
    }
    console.log(
      JSON.stringify({ name, url: page.url(), rscResponses: rsc.length, errors, escapes }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
