// ABOUTME: Unit tests for the gpt-image-2 prompt builder that keeps the Steel house
// ABOUTME: style fixed while taking motif and color grade from the CLI.
import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';

import {
  buildImageSpec,
  DEFAULT_COLOR_GRADE,
  HOUSE_STYLE,
} from '../../../scripts/changelog/imagegen/prompt';

const MOTIF = 'A nighttime rail-switching terminal where five routes converge into one line.';

describe('buildImageSpec', () => {
  test('puts the motif and color grade into the spec', () => {
    const spec = buildImageSpec({ motif: MOTIF, colorGrade: 'warm amber dusk' });
    assert.equal(spec.motif, MOTIF);
    assert.equal(spec.color_grade, 'warm amber dusk');
  });

  test('falls back to the default color grade', () => {
    const spec = buildImageSpec({ motif: MOTIF });
    assert.equal(spec.color_grade, DEFAULT_COLOR_GRADE);
  });

  test('keeps the house style fixed', () => {
    const spec = buildImageSpec({ motif: MOTIF, colorGrade: 'warm amber dusk' });
    assert.equal(spec.main_description, HOUSE_STYLE.main_description);
    assert.deepEqual(spec.style_notes, HOUSE_STYLE.style_notes);
    assert.deepEqual(spec.avoid, HOUSE_STYLE.avoid);
  });

  test('interpolates motif, description and grade into the final prompt', () => {
    const spec = buildImageSpec({ motif: MOTIF, colorGrade: 'warm amber dusk' });
    assert.ok(spec.prompt.includes(MOTIF), 'prompt should contain the motif');
    assert.ok(
      spec.prompt.includes(HOUSE_STYLE.main_description),
      'prompt should contain the style',
    );
    assert.ok(spec.prompt.includes('warm amber dusk'), 'prompt should contain the color grade');
    assert.ok(!spec.prompt.includes('{{'), 'prompt should have no unresolved placeholders');
  });

  test('appends the style notes and the avoid list to the prompt', () => {
    const spec = buildImageSpec({ motif: MOTIF });
    assert.ok(spec.prompt.includes(HOUSE_STYLE.style_notes.lighting));
    assert.ok(spec.prompt.includes(HOUSE_STYLE.avoid[0]));
    assert.ok(spec.prompt.toLowerCase().includes('avoid'));
  });

  test('rejects an empty motif', () => {
    assert.throws(() => buildImageSpec({ motif: '  ' }), /motif/i);
  });
});
