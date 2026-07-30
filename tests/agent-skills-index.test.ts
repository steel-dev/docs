// ABOUTME: Tests for the Agent Skills discovery index builder, covering the schema
// ABOUTME: shape, commit-pinned artifact URLs and the SHA-256 digest of each SKILL.md.
import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';

import {
  AGENT_SKILLS_SCHEMA,
  buildAgentSkillsIndex,
  type SkillArtifact,
} from '../scripts/generate-agent-skills-index';

const COMMIT = '0123456789abcdef0123456789abcdef01234567';

function artifact(overrides: Partial<SkillArtifact> = {}): SkillArtifact {
  return {
    name: 'steel-browser',
    path: 'steel-browser',
    description: 'Skill for agent-driven web workflows using Steel cloud browsers.',
    content: Buffer.from('---\nname: steel-browser\n---\n\nDrive a Steel browser.\n'),
    ...overrides,
  };
}

describe('buildAgentSkillsIndex', () => {
  test('emits the discovery schema and one entry per skill', () => {
    const index = buildAgentSkillsIndex(COMMIT, [
      artifact(),
      artifact({ name: 'steel-developer', path: 'steel-developer' }),
    ]);

    expect(index.$schema).toBe(AGENT_SKILLS_SCHEMA);
    expect(index.skills).toHaveLength(2);
    expect(index.skills.map((skill) => skill.name)).toEqual(['steel-browser', 'steel-developer']);
    expect(index.skills[0]?.type).toBe('skill-md');
  });

  test('pins each artifact URL to the commit it was read from', () => {
    const [skill] = buildAgentSkillsIndex(COMMIT, [artifact()]).skills;

    // Pinning to a commit rather than a branch keeps the URL and the digest
    // agreeing forever, so a later upstream edit cannot invalidate this index.
    expect(skill?.url).toBe(
      `https://raw.githubusercontent.com/steel-dev/skills/${COMMIT}/steel-browser/SKILL.md`,
    );
  });

  test('digests the exact bytes of the artifact', () => {
    const content = Buffer.from('---\nname: steel-browser\n---\n\nExact bytes.\n');
    const [skill] = buildAgentSkillsIndex(COMMIT, [artifact({ content })]).skills;

    expect(skill?.digest).toBe(`sha256:${createHash('sha256').update(content).digest('hex')}`);
    expect(skill?.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test('rejects a name the discovery schema would not accept', () => {
    expect(() => buildAgentSkillsIndex(COMMIT, [artifact({ name: 'Steel Browser' })])).toThrow(
      /name/i,
    );
  });

  test('rejects a description longer than the schema allows', () => {
    expect(() =>
      buildAgentSkillsIndex(COMMIT, [artifact({ description: 'x'.repeat(1025) })]),
    ).toThrow(/description/i);
  });

  test('rejects an empty skill set rather than publishing an empty index', () => {
    expect(() => buildAgentSkillsIndex(COMMIT, [])).toThrow(/skill/i);
  });
});
