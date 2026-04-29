import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  slug: string;
  title: string;
  description: string;
  topics: string[];
  date?: string;
}

// Render a registry date (YYYY-MM-DD) as the short English month-day-year
// form ("Apr 23, 2026"). Falls back to the raw string if parsing fails.
function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// Slugify a topic the same way sync-cookbook.ts does: lowercase, dots
// dropped, everything else non-alphanumeric becomes a dash. Matches the
// URL of the corresponding /cookbook/topics filter page.
function topicSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function RecipeCard({ slug, title, description, topics, date }: RecipeCardProps) {
  // "Stretched link" pattern: an absolute overlay <Link> covers the whole
  // card, so clicking anywhere navigates to the recipe. Inner contents are
  // pointer-events-none by default; interactive children (title, topic
  // pills) re-enable pointer events and sit above the overlay so they stay
  // clickable as distinct links.
  return (
    <article className="group not-prose relative flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-muted-foreground">
      <Link
        href={`/cookbook/${slug}`}
        className="absolute inset-0 z-0 rounded-lg"
        aria-label={title}
      />
      <div className="pointer-events-none flex flex-col gap-2">
        <h3 className="text-base font-medium leading-snug">
          <Link
            href={`/cookbook/${slug}`}
            className="pointer-events-auto relative z-10 hover:text-primary"
          >
            {title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="pointer-events-none mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Link
                key={topic}
                href={`/cookbook/topics/${topicSlug(topic)}`}
                className="pointer-events-auto relative z-10 rounded-full bg-yellow-50 dark:bg-yellow-50/5 px-2.5 py-0.5 font-mono text-xs uppercase text-stone-400 transition-colors hover:text-primary"
              >
                {topic}
              </Link>
            ))}
          </div>
        ) : (
          <span />
        )}
        {date && (
          <time
            dateTime={date}
            className="font-mono text-xs text-muted-foreground whitespace-nowrap"
          >
            {formatDate(date)}
          </time>
        )}
      </div>
    </article>
  );
}

export function RecipeGrid({ children }: { children: ReactNode }) {
  return (
    <div className={cn('not-prose grid grid-cols-1 gap-4 sm:grid-cols-2', 'my-6')}>{children}</div>
  );
}
