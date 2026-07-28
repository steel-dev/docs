// ABOUTME: Generates the changelog cover PNG for a draft using the vendored imagegen
// ABOUTME: pipeline, then quantizes it to PNG-8 and installs it under public/images/changelog.
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import sharp from 'sharp';
import { type RunDependencies, run } from './imagegen/index';
import { parseOptions } from './imagegen/options';

export const CHANGELOG_COVER_DIR = 'public/images/changelog';

export interface CoverResult {
  /** Repo-relative path of the committed PNG, e.g. `public/images/changelog/36.png`. */
  publicPath: string;
  /** Site path used in frontmatter and the Image component, e.g. `/images/changelog/36.png`. */
  src: string;
  /** Temporary directory keeping the undithered original and sidecar for palette retries. */
  workdir: string;
}

export interface GenerateChangelogCoverInput {
  number: number;
  motif: string;
  /** Date shown on the card, `YYYY-MM-DD`. */
  publishedAt: string;
  repoRoot?: string;
  log?: (message: string) => void;
  /** Seam for tests, so the pipeline can be exercised without calling OpenAI. */
  deps?: RunDependencies;
}

/** Renders the cover card for one changelog and returns where it was installed. */
export async function generateChangelogCover({
  number,
  motif,
  publishedAt,
  repoRoot = process.cwd(),
  log = () => {},
  deps,
}: GenerateChangelogCoverInput): Promise<CoverResult> {
  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), `steel-changelog-cover-${number}-`));
  const options = parseOptions([
    '--number',
    String(number),
    '--motif',
    motif,
    '--date',
    publishedAt,
    '--out',
    path.join(workdir, `changelog-${number}.png`),
    '--scale',
    '1',
  ]);

  const rendered = await run(options, log, deps);

  const publicPath = path.posix.join(CHANGELOG_COVER_DIR, `${number}.png`);
  const installed = path.join(repoRoot, publicPath);
  await fs.mkdir(path.dirname(installed), { recursive: true });
  // The dither already snaps the background to a small palette, so PNG-8 is near-lossless
  // and keeps the committed cover at the same weight as the hand-compressed ones.
  await sharp(rendered.out)
    .png({ palette: true, compressionLevel: 9, effort: 10 })
    .toFile(installed);

  return {
    publicPath,
    src: `/images/changelog/${number}.png`,
    workdir,
  };
}
