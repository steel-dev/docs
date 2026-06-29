import Link from 'next/link';
import type { ReactNode, SVGProps } from 'react';
import { GoIcon, PythonIcon, RustIcon, TSIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  slug: string;
  title: string;
  description: string;
  topics: string[];
  languages?: string[];
  date?: string;
}

// Per-language icon with optical-size tuning so the marks read as one
// consistent size inside the chip (TS fills its box; the Go mark is
// wide-and-short).
const LANG_ICONS: Record<
  string,
  { Icon: (p: SVGProps<SVGSVGElement>) => ReactNode; size: string }
> = {
  TypeScript: { Icon: TSIcon, size: 'size-3' },
  Python: { Icon: PythonIcon, size: 'size-3.5' },
  Go: { Icon: GoIcon, size: 'size-4' },
  Rust: { Icon: RustIcon, size: 'size-3.5' },
};

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

export function RecipeCard({ slug, title, description, topics, languages, date }: RecipeCardProps) {
  // "Stretched link" pattern: an absolute overlay <Link> covers the whole
  // card, so clicking anywhere navigates to the recipe. Inner contents are
  // pointer-events-none by default; interactive children (title, topic
  // pills) re-enable pointer events and sit above the overlay so they stay
  // clickable as distinct links.
  return (
    <article
      className={cn(
        'group not-prose relative flex flex-col rounded-lg border bg-card p-5 transition-colors',
        'border-border hover:border-muted-foreground',
      )}
    >
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
        <div className="flex flex-wrap items-center gap-2">
          {languages && languages.length > 0 && (
            <div className="flex -space-x-1.5">
              {languages.map((language) => {
                const icon = LANG_ICONS[language];
                if (!icon) return null;
                return (
                  <span
                    key={language}
                    title={language}
                    aria-label={language}
                    className="inline-flex size-5 items-center justify-center rounded-full border-2 border-background bg-card text-muted-foreground"
                  >
                    <icon.Icon className={icon.size} />
                  </span>
                );
              })}
            </div>
          )}
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
