// ABOUTME: Shares one headless Chromium across all imagegen test files, because repeated
// ABOUTME: chromium.launch() calls in the same Bun test process can deadlock on spawn.
import { type Browser, chromium } from 'playwright';

let shared: Promise<Browser> | undefined;

/**
 * Launches Chromium once per test process and reuses it. Never closed here:
 * Playwright kills the browser when the test process exits, and an afterAll
 * in one file must not tear it down under another file's tests.
 */
export function getSharedBrowser(): Promise<Browser> {
  shared ??= chromium.launch();
  return shared;
}
