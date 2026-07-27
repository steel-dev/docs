// ABOUTME: Unit tests for the text helpers that turn CLI inputs into the two-line
// ABOUTME: label, date, and title strings the changelog card renders.
import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';

import {
  formatCardDate,
  splitLabelLines,
  titleLines,
  toIsoDate,
} from '../../../scripts/changelog/imagegen/text';

describe('formatCardDate', () => {
  test("splits a date into a 'Month Day' line and a year line", () => {
    assert.deepEqual(formatCardDate(new Date(2026, 6, 24)), ['July 24', '2026']);
  });

  test('does not zero-pad the day', () => {
    assert.deepEqual(formatCardDate(new Date(2026, 0, 3)), ['January 3', '2026']);
  });
});

describe('splitLabelLines', () => {
  test('keeps a single word on one line', () => {
    assert.deepEqual(splitLabelLines('Improvements'), ['Improvements']);
  });

  test('stacks two words on two lines', () => {
    assert.deepEqual(splitLabelLines('Product Update'), ['Product', 'Update']);
  });

  test('balances three or more words across two lines', () => {
    assert.deepEqual(splitLabelLines('Agent Workflow Engine'), ['Agent Workflow', 'Engine']);
    assert.deepEqual(splitLabelLines('New browser session API'), ['New browser', 'session API']);
  });

  test('honours an explicit newline', () => {
    assert.deepEqual(splitLabelLines('New\nfeature drop'), ['New', 'feature drop']);
  });

  test('collapses surrounding and repeated whitespace', () => {
    assert.deepEqual(splitLabelLines('  Product   Update  '), ['Product', 'Update']);
  });

  test('rejects an empty label', () => {
    assert.throws(() => splitLabelLines('   '), /category/i);
  });
});

describe('toIsoDate', () => {
  test('formats in local time, without a UTC shift', () => {
    assert.equal(toIsoDate(new Date(2026, 0, 3)), '2026-01-03');
    assert.equal(toIsoDate(new Date(2026, 11, 31)), '2026-12-31');
  });
});

describe('titleLines', () => {
  test('renders the changelog number as the second line', () => {
    assert.deepEqual(titleLines('35'), ['Changelog', 'No. 35']);
  });

  test('accepts a numeric argument', () => {
    assert.deepEqual(titleLines(7), ['Changelog', 'No. 7']);
  });
});
