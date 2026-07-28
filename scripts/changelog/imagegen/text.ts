// ABOUTME: Turns raw CLI inputs into the exact line-broken strings the card renders:
// ABOUTME: the stacked category label, the two-line date, and the changelog title.

/** Formats a date the way the card shows it: "July 24" above "2026". */
export function formatCardDate(date: Date): [string, string] {
  const month = date.toLocaleString('en-US', { month: 'long' });
  return [`${month} ${date.getDate()}`, String(date.getFullYear())];
}

/**
 * Breaks a category label into the one or two lines the header slot expects.
 * An explicit newline in the input wins; otherwise words are split into two
 * lines of as-even length as possible.
 */
export function splitLabelLines(label: string): string[] {
  if (label.includes('\n')) {
    const lines = label.split('\n').map(normalizeSpace).filter(Boolean);
    if (lines.length === 0) throw new Error('category must not be empty');
    return lines;
  }

  const words = normalizeSpace(label).split(' ').filter(Boolean);
  if (words.length === 0) throw new Error('category must not be empty');
  if (words.length === 1) return words;

  let best = { split: 1, delta: Infinity };
  for (let split = 1; split < words.length; split++) {
    const first = words.slice(0, split).join(' ');
    const second = words.slice(split).join(' ');
    const delta = Math.abs(first.length - second.length);
    if (delta < best.delta) best = { split, delta };
  }
  return [words.slice(0, best.split).join(' '), words.slice(best.split).join(' ')];
}

/** Formats a date as YYYY-MM-DD in local time, matching what --date accepts. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The two title lines: "Changelog" over "No. 35". */
export function titleLines(changelogNumber: string | number): [string, string] {
  return ['Changelog', `No. ${changelogNumber}`];
}

function normalizeSpace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
