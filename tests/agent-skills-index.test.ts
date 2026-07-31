// ABOUTME: Tests the Agent Skills discovery index and complete archive packaging.
// ABOUTME: Covers frontmatter metadata, archive layout, validation, and exact-byte digests.
import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';

import {
  AGENT_SKILLS_SCHEMA,
  buildAgentSkillsIndex,
  buildSkillArtifactsFromRepositoryArchive,
  GitHubTransportError,
  githubFetch,
  githubRequestError,
  MAX_SKILL_ARCHIVE_CONTENT_BYTES,
  type SkillArtifact,
} from '../scripts/generate-agent-skills-index';

const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const WRAPPER = `skills-${COMMIT}`;
const FRONTMATTER_DESCRIPTION =
  'Use when a task needs a Steel cloud browser. Do not use for local-only HTTP requests.';

function artifact(overrides: Partial<SkillArtifact> = {}): SkillArtifact {
  return {
    name: 'steel-browser',
    description: FRONTMATTER_DESCRIPTION,
    content: Buffer.from('exact archive bytes'),
    ...overrides,
  };
}

async function archiveBytes(files: Record<string, string | Blob>): Promise<Buffer> {
  const archive = new Bun.Archive(files, { compress: 'gzip', level: 9 });
  return Buffer.from(await archive.bytes());
}

function skillMarkdown(overrides: { name?: unknown; description?: unknown } = {}): string {
  const name = overrides.name ?? 'steel-browser';
  const description = overrides.description ?? FRONTMATTER_DESCRIPTION;

  return `---
name: ${JSON.stringify(name)}
description: ${JSON.stringify(description)}
---

# Steel Browser

Read [the forms reference](references/forms.md) when a task needs forms.
`;
}

async function repositoryArchive(
  overrides: {
    manifest?: unknown;
    skillMd?: string | null;
    extraFiles?: Record<string, string | Blob>;
  } = {},
): Promise<Buffer> {
  const manifest =
    overrides.manifest ??
    ({
      skills: {
        'steel-browser': {
          description: 'A deliberately different manifest blurb.',
          path: 'steel-browser',
        },
      },
    } satisfies Record<string, unknown>);
  const files: Record<string, string | Blob> = {
    [`${WRAPPER}/manifest.json`]: JSON.stringify(manifest),
    [`${WRAPPER}/README.md`]: 'Repository readme',
    [`${WRAPPER}/steel-browser/references/forms.md`]: '# Forms',
    [`${WRAPPER}/steel-browser/scripts/run.sh`]: '#!/bin/sh\n',
    ...overrides.extraFiles,
  };

  if (overrides.skillMd !== null) {
    files[`${WRAPPER}/steel-browser/SKILL.md`] = overrides.skillMd ?? skillMarkdown();
  }

  return archiveBytes(files);
}

describe('buildSkillArtifactsFromRepositoryArchive', () => {
  test('packages the full skill directory at archive root and uses frontmatter metadata', async () => {
    const [built] = await buildSkillArtifactsFromRepositoryArchive(await repositoryArchive());

    expect(built?.name).toBe('steel-browser');
    expect(built?.description).toBe(FRONTMATTER_DESCRIPTION);

    const files = await new Bun.Archive(built?.content ?? Buffer.alloc(0)).files();
    expect([...files.keys()].sort()).toEqual(['SKILL.md', 'references/forms.md', 'scripts/run.sh']);
    expect(await files.get('SKILL.md')?.text()).toContain('# Steel Browser');
    expect([...files.keys()].some((name) => name.startsWith(`${WRAPPER}/`))).toBe(false);
  });

  test('produces deterministic archive bytes for identical repository bytes', async () => {
    const repository = await repositoryArchive();
    const [first] = await buildSkillArtifactsFromRepositoryArchive(repository);
    await Bun.sleep(1100);
    const [second] = await buildSkillArtifactsFromRepositoryArchive(repository);

    expect(first?.content.equals(second?.content ?? Buffer.alloc(0))).toBe(true);
  });

  test('rejects a missing or ambiguous wrapper-level manifest', async () => {
    await expect(
      buildSkillArtifactsFromRepositoryArchive(
        await archiveBytes({ [`${WRAPPER}/README.md`]: 'No manifest' }),
      ),
    ).rejects.toThrow(/manifest/i);

    await expect(
      buildSkillArtifactsFromRepositoryArchive(
        await archiveBytes({
          'first/manifest.json': JSON.stringify({ skills: {} }),
          'second/manifest.json': JSON.stringify({ skills: {} }),
        }),
      ),
    ).rejects.toThrow(/manifest/i);
  });

  test('rejects an empty catalog or missing root SKILL.md', async () => {
    await expect(
      buildSkillArtifactsFromRepositoryArchive(
        await repositoryArchive({ manifest: { skills: {} } }),
      ),
    ).rejects.toThrow(/empty|no skills/i);

    await expect(
      buildSkillArtifactsFromRepositoryArchive(await repositoryArchive({ skillMd: null })),
    ).rejects.toThrow(/SKILL\.md/i);
  });

  test.each([
    ['non-string', 42],
    ['blank', '   '],
    ['overlong', 'x'.repeat(1025)],
  ])('rejects frontmatter description: %s', async (_label, description) => {
    await expect(
      buildSkillArtifactsFromRepositoryArchive(
        await repositoryArchive({ skillMd: skillMarkdown({ description }) }),
      ),
    ).rejects.toThrow(/description/i);
  });

  test('rejects a frontmatter name that differs from the manifest key', async () => {
    await expect(
      buildSkillArtifactsFromRepositoryArchive(
        await repositoryArchive({
          skillMd: skillMarkdown({ name: 'different-skill' }),
        }),
      ),
    ).rejects.toThrow(/name/i);
  });

  test('excludes hidden files and directories from skill archives', async () => {
    const [built] = await buildSkillArtifactsFromRepositoryArchive(
      await repositoryArchive({
        extraFiles: {
          [`${WRAPPER}/steel-browser/.env.local`]: 'STEEL_API_KEY=secret',
          [`${WRAPPER}/steel-browser/.github/workflows/ci.yml`]: 'jobs: {}',
          [`${WRAPPER}/steel-browser/references/.DS_Store`]: 'junk',
        },
      }),
    );

    const files = await new Bun.Archive(built?.content ?? Buffer.alloc(0)).files();
    expect([...files.keys()].sort()).toEqual(['SKILL.md', 'references/forms.md', 'scripts/run.sh']);
  });

  test('rejects a skill whose content exceeds the archive size ceiling', async () => {
    await expect(
      buildSkillArtifactsFromRepositoryArchive(
        await repositoryArchive({
          extraFiles: {
            [`${WRAPPER}/steel-browser/fixtures/huge.bin`]: 'x'.repeat(
              MAX_SKILL_ARCHIVE_CONTENT_BYTES + 1,
            ),
          },
        }),
      ),
    ).rejects.toThrow(/steel-browser.*bytes/i);
  });

  test('falls back to the manifest key when the manifest entry omits path', async () => {
    const [built] = await buildSkillArtifactsFromRepositoryArchive(
      await repositoryArchive({ manifest: { skills: { 'steel-browser': {} } } }),
    );

    expect(built?.name).toBe('steel-browser');
    const files = await new Bun.Archive(built?.content ?? Buffer.alloc(0)).files();
    expect([...files.keys()]).toContain('SKILL.md');
  });

  test('names the skill when SKILL.md frontmatter is not valid YAML', async () => {
    const skillMd = [
      '---',
      'name: steel-browser',
      'description: Use when: the agent needs a browser',
      '---',
      '',
      '# Steel Browser',
      '',
    ].join('\n');

    await expect(
      buildSkillArtifactsFromRepositoryArchive(await repositoryArchive({ skillMd })),
    ).rejects.toThrow(/steel-browser.*frontmatter/i);
  });

  test('rejects an unsafe manifest path', async () => {
    await expect(
      buildSkillArtifactsFromRepositoryArchive(
        await repositoryArchive({
          manifest: {
            skills: {
              'steel-browser': {
                path: '../steel-browser',
              },
            },
          },
        }),
      ),
    ).rejects.toThrow(/path/i);
  });
});

describe('buildAgentSkillsIndex', () => {
  test('emits the discovery schema and one archive entry per skill', () => {
    const index = buildAgentSkillsIndex([artifact(), artifact({ name: 'steel-developer' })]);

    expect(index.$schema).toBe(AGENT_SKILLS_SCHEMA);
    expect(index.skills).toHaveLength(2);
    expect(index.skills.map((skill) => skill.name)).toEqual(['steel-browser', 'steel-developer']);
    expect(index.skills[0]?.type).toBe('archive');
  });

  test('uses a same-origin tarball URL', () => {
    const [skill] = buildAgentSkillsIndex([artifact()]).skills;

    expect(skill?.url).toBe('/.well-known/agent-skills/steel-browser.tar.gz');
  });

  test('digests the exact archive bytes', () => {
    const content = Buffer.from('exact compressed archive bytes');
    const [skill] = buildAgentSkillsIndex([artifact({ content })]).skills;

    expect(skill?.digest).toBe(`sha256:${createHash('sha256').update(content).digest('hex')}`);
    expect(skill?.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test.each([
    '-steel',
    'steel-',
    'steel--browser',
    'Steel-browser',
    'steel browser',
    'a'.repeat(65),
  ])('rejects invalid discovery name %s', (name) => {
    expect(() => buildAgentSkillsIndex([artifact({ name })])).toThrow(/name/i);
  });

  test.each(['a', `${'a'.repeat(31)}-${'b'.repeat(32)}`])(
    'accepts valid boundary discovery name %s',
    (name) => {
      expect(buildAgentSkillsIndex([artifact({ name })]).skills[0]?.name).toBe(name);
    },
  );

  test.each(['', '   ', 'x'.repeat(1025)])(
    'rejects invalid discovery description',
    (description) => {
      expect(() => buildAgentSkillsIndex([artifact({ description })])).toThrow(/description/i);
    },
  );

  test('rejects an empty skill set rather than publishing an empty index', () => {
    expect(() => buildAgentSkillsIndex([])).toThrow(/skill/i);
  });
});

describe('GitHub transport error classification', () => {
  test('classifies non-ok GitHub responses as skippable transport errors', () => {
    const error = githubRequestError(
      'Could not resolve steel-dev/skills@main',
      new Response(null, { status: 502 }),
    );

    expect(error).toBeInstanceOf(GitHubTransportError);
    expect(error.message).toContain('502');
  });

  test('classifies exhausted rate limits as skippable transport errors', () => {
    const error = githubRequestError(
      'Could not resolve steel-dev/skills@main',
      new Response(null, {
        status: 403,
        headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1767225600' },
      }),
    );

    expect(error).toBeInstanceOf(GitHubTransportError);
    expect(error.message).toContain('rate limit');
  });

  test('classifies fetch network failures as skippable transport errors', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() =>
      Promise.reject(new TypeError('Unable to connect'))) as typeof globalThis.fetch;

    try {
      const error = await githubFetch('https://api.github.com/repos/steel-dev/skills', {}).catch(
        (caught: unknown) => caught,
      );

      expect(error).toBeInstanceOf(GitHubTransportError);
      expect((error as Error).message).toContain('Unable to connect');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('validation errors are not classified as skippable transport errors', async () => {
    const indexError = await Promise.resolve()
      .then(() => buildAgentSkillsIndex([]))
      .catch((caught: unknown) => caught);
    const packagingError = await buildSkillArtifactsFromRepositoryArchive(
      await repositoryArchive({ skillMd: null }),
    ).catch((caught: unknown) => caught);

    expect(indexError).toBeInstanceOf(Error);
    expect(indexError).not.toBeInstanceOf(GitHubTransportError);
    expect(packagingError).toBeInstanceOf(Error);
    expect(packagingError).not.toBeInstanceOf(GitHubTransportError);
  });
});
