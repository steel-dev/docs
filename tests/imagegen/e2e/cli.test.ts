// ABOUTME: End-to-end tests that run the CLI as a subprocess and check its exit code,
// ABOUTME: stdout, and the PNG plus sidecar JSON it writes to disk.
import { afterAll, beforeAll, describe, setDefaultTimeout, test } from 'bun:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

// Each case renders a card in a subprocess, which exceeds the default 5s timeout.
setDefaultTimeout(30000);

const CLI = fileURLToPath(new URL('../../../scripts/changelog/imagegen/cli.ts', import.meta.url));

const MOTIF = 'A quiet harbour at dawn where five ships dock at one long pier.';

type CliResult = { code: number; stdout: string; stderr: string };

// Spawned synchronously on purpose: asynchronous spawns deadlock in this runner
// once the Chromium integration tests have launched browsers in the same process.
function cli(args: string[]): CliResult {
  const result = Bun.spawnSync([process.execPath, CLI, ...args], {
    env: { ...process.env, OPENAI_API_KEY: '' },
  });

  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

describe('changelog-imagegen CLI', () => {
  let workdir: string;
  let backgroundPath: string;

  beforeAll(async () => {
    workdir = await mkdtemp(join(tmpdir(), 'changelog-imagegen-'));
    backgroundPath = join(workdir, 'background.png');

    const png = new PNG({ width: 1536, height: 1024 });
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = 90;
      png.data[i + 1] = 110;
      png.data[i + 2] = 130;
      png.data[i + 3] = 255;
    }
    await writeFile(backgroundPath, PNG.sync.write(png));
  });

  afterAll(async () => {
    await rm(workdir, { recursive: true, force: true });
  });

  test('prints usage for --help', async () => {
    const { code, stdout } = cli(['--help']);
    assert.equal(code, 0);
    assert.match(stdout, /changelog-imagegen/);
    assert.match(stdout, /--motif/);
  });

  test('prints the prompt spec without touching the network', async () => {
    const { code, stdout } = cli(['--number', '35', '--motif', MOTIF, '--print-prompt']);
    assert.equal(code, 0);
    const spec = JSON.parse(stdout);
    assert.equal(spec.motif, MOTIF);
    assert.ok(spec.prompt.includes(MOTIF));
    assert.ok(spec.style_notes.lighting.length > 0);
  });

  test('fails with a usage message when --number is missing', async () => {
    const { code, stderr } = cli(['--motif', MOTIF]);
    assert.equal(code, 1);
    assert.match(stderr, /--number is required/);
    assert.match(stderr, /Usage:/);
  });

  test('fails when a background must be generated but no API key is set', async () => {
    const { code, stderr } = cli([
      '--number',
      '35',
      '--motif',
      MOTIF,
      '--out',
      join(workdir, 'nokey.png'),
    ]);
    assert.equal(code, 1);
    assert.match(stderr, /OPENAI_API_KEY/);
  });

  test('renders a card from an existing background', async () => {
    const out = join(workdir, 'card.png');
    const { code, stdout, stderr } = cli([
      '--number',
      '12',
      '--category',
      'New Feature',
      '--date',
      '2026-01-03',
      '--background',
      backgroundPath,
      '--out',
      out,
      '--scale',
      '1',
    ]);

    assert.equal(code, 0, stderr);
    assert.equal(stdout.trim(), out);

    const image = PNG.sync.read(await readFile(out));
    assert.equal(image.width, 1420);
    assert.equal(image.height, 800);

    const sidecar = JSON.parse(await readFile(join(workdir, 'card.json'), 'utf8'));
    assert.equal(sidecar.number, '12');
    assert.equal(sidecar.category, 'New Feature');
    assert.equal(sidecar.date, '2026-01-03');
    assert.equal(sidecar.background, backgroundPath);
    assert.deepEqual(sidecar.dither, { palette: 'Elevate', matrix: 'bayer-16' });
    assert.equal(sidecar.spec, undefined);

    // The source was supplied, so there is nothing to keep a copy of.
    await assert.rejects(readFile(join(workdir, 'card-source.png')), /ENOENT/);
  });

  test('dithers the background against the chosen palette', async () => {
    const out = join(workdir, 'ocean.png');
    const { code, stderr } = cli([
      '--number',
      '12',
      '--background',
      backgroundPath,
      '--palette',
      'Ocean',
      '--out',
      out,
      '--scale',
      '1',
    ]);

    assert.equal(code, 0, stderr);
    assert.match(stderr, /Bayer 16x16 and the Ocean palette/);

    // The flat grey source only dithers into more than one colour if the pass ran.
    const image = PNG.sync.read(await readFile(out));
    // One row only — the scrim is a vertical gradient, so rows differ by design.
    const colors = new Set<string>();
    for (let x = 700; x < 760; x++) {
      const i = (image.width * 230 + x) << 2;
      colors.add(`${image.data[i]},${image.data[i + 1]},${image.data[i + 2]}`);
    }
    assert.ok(colors.size > 1, 'expected a dithered mix of palette colours');
  });

  test('leaves the background alone with --no-dither', async () => {
    const out = join(workdir, 'flat.png');
    const { code, stderr } = cli([
      '--number',
      '12',
      '--background',
      backgroundPath,
      '--no-dither',
      '--out',
      out,
      '--scale',
      '1',
    ]);

    assert.equal(code, 0, stderr);
    assert.doesNotMatch(stderr, /Dithering/);

    const image = PNG.sync.read(await readFile(out));
    // One row only — the scrim is a vertical gradient, so rows differ by design.
    const colors = new Set<string>();
    for (let x = 700; x < 760; x++) {
      const i = (image.width * 230 + x) << 2;
      colors.add(`${image.data[i]},${image.data[i + 1]},${image.data[i + 2]}`);
    }
    assert.equal(colors.size, 1, 'an undithered flat background should stay one colour');

    const sidecar = JSON.parse(await readFile(join(workdir, 'flat.json'), 'utf8'));
    assert.equal(sidecar.dither, false);
  });

  test('doubles the resolution at --scale 2', async () => {
    const out = join(workdir, 'card-2x.png');
    const { code, stderr } = cli([
      '--number',
      '12',
      '--background',
      backgroundPath,
      '--out',
      out,
      '--scale',
      '2',
    ]);

    assert.equal(code, 0, stderr);
    const image = PNG.sync.read(await readFile(out));
    assert.equal(image.width, 2840);
    assert.equal(image.height, 1600);
  });
});
