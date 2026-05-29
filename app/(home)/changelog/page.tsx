import fs from 'node:fs';
import path from 'node:path';
import { redirect } from 'next/navigation';

// Resolve the highest-numbered changelog entry so /changelog always lands on the latest.
function getLatestChangelogSlug() {
  const dir = path.join(process.cwd(), 'content/docs/changelog');
  const slugs = fs
    .readdirSync(dir)
    .filter((file) => /^changelog-\d+\.mdx$/.test(file))
    .map((file) => file.replace(/\.mdx$/, ''));

  slugs.sort((a, b) => {
    const numA = parseInt(a.match(/(\d+)$/)?.[1] ?? '0', 10);
    const numB = parseInt(b.match(/(\d+)$/)?.[1] ?? '0', 10);
    return numB - numA;
  });

  return slugs[0];
}

export default function ChangelogPage() {
  const latest = getLatestChangelogSlug();
  redirect(`/changelog/${latest}`);
}
