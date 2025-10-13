import fs from 'node:fs';
import path from 'node:path';
import { Code } from 'lucide-react';
import { Cards, IndexCard } from '@/components/card';

// Helper to parse and sort changelog entries
function getChangelogEntries() {
  const filePath = path.join(process.cwd(), 'public/changelog/llms.txt');
  const file = fs.readFileSync(filePath, 'utf8');
  const lines = file.split('\n');
  // Match lines like: - [changelog-1](https://docs.steel.dev/changelog/changelog-1)
  const entries = lines
    .map((line) => {
      const match = line.match(/- \[([^\]]+)\]\(([^)]+)\)/);
      if (!match) return null;
      // Extract number from title, e.g., "changelog-12" -> 12
      const numMatch = match[1].match(/(\d+)$/);
      const number = numMatch ? parseInt(numMatch[1], 10) : 0;
      return {
        title: match[1],
        href: match[2],
        number,
      };
    })
    .filter(Boolean);

  // Sort descending by number
  entries.sort((a, b) => b!.number - a!.number);
  return entries;
}

export default function ChangelogPage() {
  const changelogs = getChangelogEntries();
  return (
    <main className="my-6 space-y-10">
      <div className="px-4 md:px-[var(--nav-offset)]">
        <div className="space-y-10">
          <div className="space-y-1">
            <h3 className="text-3xl">Changelog</h3>
            <hr className="border-t border-border mt-8" />
          </div>
          <Cards>
            {changelogs.map(({ title, href }: any) => {
              const parsedTitle = title
                .replace(/-/g, ' ')
                .toLowerCase() // optional: normalize first
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              return (
                <IndexCard
                  key={href}
                  icon={<Code />}
                  href={href}
                  title={parsedTitle}
                  description={`See details for ${parsedTitle}`}
                />
              );
            })}
          </Cards>
        </div>
      </div>
    </main>
  );
}
