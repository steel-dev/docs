// ABOUTME: Unit tests for CLI argument parsing and the defaults applied to a run.
// ABOUTME: Covers category, date, changelog number, motif, color grade and output paths.
import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';

import { DEFAULT_SIZE, parseOptions } from '../../../scripts/changelog/imagegen/options';
import { TIME_OF_DAY_GRADES } from '../../../scripts/changelog/imagegen/prompt';

const MOTIF = 'A quiet harbour at dawn where five ships dock at one pier.';
const REQUIRED = ['--number', '35', '--motif', MOTIF];

describe('parseOptions', () => {
  test('reads category, date, number, motif and color grade', () => {
    const options = parseOptions([
      '--category',
      'New Feature',
      '--date',
      '2026-07-24',
      '--number',
      '35',
      '--motif',
      MOTIF,
      '--color-grade',
      'warm amber dusk',
    ]);

    assert.equal(options.category, 'New Feature');
    assert.deepEqual(options.date, new Date(2026, 6, 24));
    assert.equal(options.number, '35');
    assert.equal(options.motif, MOTIF);
    assert.equal(options.colorGrade, 'warm amber dusk');
  });

  test("defaults the category to 'Product Update'", () => {
    assert.equal(parseOptions(REQUIRED).category, 'Product Update');
  });

  test('defaults the date to today', () => {
    const today = new Date();
    const { date } = parseOptions(REQUIRED);
    assert.equal(date.getFullYear(), today.getFullYear());
    assert.equal(date.getMonth(), today.getMonth());
    assert.equal(date.getDate(), today.getDate());
  });

  test('derives the output path from the changelog number', () => {
    assert.match(parseOptions(REQUIRED).out, /output\/changelog-35\.png$/);
  });

  test('takes an explicit output path', () => {
    const options = parseOptions([...REQUIRED, '--out', 'cards/hero.png']);
    assert.match(options.out, /cards\/hero\.png$/);
  });

  test('requires a changelog number', () => {
    assert.throws(() => parseOptions(['--motif', MOTIF]), /number/i);
  });

  test('requires a motif unless a background is supplied', () => {
    assert.throws(() => parseOptions(['--number', '35']), /motif/i);
    const options = parseOptions(['--number', '35', '--background', 'bg.png']);
    assert.match(options.background ?? '', /bg\.png$/);
  });

  test('rejects an unparseable date', () => {
    assert.throws(() => parseOptions([...REQUIRED, '--date', 'not-a-date']), /date/i);
  });

  test('defaults scale to 2 and accepts an override', () => {
    assert.equal(parseOptions(REQUIRED).scale, 2);
    assert.equal(parseOptions([...REQUIRED, '--scale', '1']).scale, 1);
  });

  test("defaults the generated size to the card's aspect ratio", () => {
    assert.equal(parseOptions(REQUIRED).size, DEFAULT_SIZE);
    assert.equal(parseOptions([...REQUIRED, '--size', '1024x1024']).size, '1024x1024');
  });

  test('rejects a non-positive scale', () => {
    assert.throws(() => parseOptions([...REQUIRED, '--scale', '0']), /scale/i);
  });

  test('dithers with the Elevate palette by default', () => {
    const options = parseOptions(REQUIRED);
    assert.equal(options.paletteName, 'Elevate');
    assert.equal(options.palette?.length, 18);
  });

  test('takes another palette by name', () => {
    assert.equal(parseOptions([...REQUIRED, '--palette', 'Ocean']).paletteName, 'Ocean');
  });

  test('rejects an unknown palette', () => {
    assert.throws(() => parseOptions([...REQUIRED, '--palette', 'nope']), /unknown palette/i);
  });

  test('drops the palette with --no-dither', () => {
    const options = parseOptions([...REQUIRED, '--no-dither']);
    assert.equal(options.palette, undefined);
    assert.equal(options.paletteName, undefined);
  });

  test('exposes print-prompt and help flags', () => {
    assert.equal(parseOptions([...REQUIRED, '--print-prompt']).printPrompt, true);
    assert.equal(parseOptions(['--help']).help, true);
  });
});

describe('parseOptions time of day', () => {
  test('resolves a named time of day into its color grade', () => {
    const options = parseOptions([...REQUIRED, '--time-of-day', 'dawn']);
    assert.equal(options.timeOfDay, 'dawn');
    assert.equal(options.colorGrade, TIME_OF_DAY_GRADES.dawn);
  });

  test('picks a random preset by default', () => {
    const names = Object.keys(TIME_OF_DAY_GRADES);
    const first = parseOptions(REQUIRED, () => 0);
    const last = parseOptions(REQUIRED, () => 0.999);

    assert.equal(first.timeOfDay, names[0]);
    assert.equal(first.colorGrade, TIME_OF_DAY_GRADES[names[0]!]);
    assert.equal(last.timeOfDay, names[names.length - 1]);
  });

  test("accepts 'random' explicitly", () => {
    const options = parseOptions([...REQUIRED, '--time-of-day', 'random'], () => 0);
    assert.equal(options.timeOfDay, Object.keys(TIME_OF_DAY_GRADES)[0]);
  });

  test('an explicit color grade wins over any time of day', () => {
    const options = parseOptions([
      ...REQUIRED,
      '--time-of-day',
      'dawn',
      '--color-grade',
      'warm amber dusk',
    ]);
    assert.equal(options.colorGrade, 'warm amber dusk');
    assert.equal(options.timeOfDay, undefined);
  });

  test('rejects an unknown time of day with the valid names', () => {
    assert.throws(() => parseOptions([...REQUIRED, '--time-of-day', 'brunch']), /dawn/);
  });
});
