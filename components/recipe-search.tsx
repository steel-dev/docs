'use client';

import { SearchIcon } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { RecipeCard, RecipeGrid } from './recipe-card';

interface Recipe {
  slug: string;
  title: string;
  description: string;
  topics: string[];
  date?: string;
}

interface Props {
  recipes: Recipe[];
}

// Client-side filter over the Home page's recipe list. Matches tokens in
// the query against any of title/description/topics/slug (substring
// match). Global ⌘K search still covers the full docs index.
export function RecipeSearch({ recipes }: Props) {
  const inputId = useId();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return recipes;
    return recipes.filter((recipe) => {
      const haystack = [recipe.title, recipe.description, recipe.slug, ...(recipe.topics ?? [])]
        .join(' ')
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [recipes, query]);

  return (
    <div className="not-prose">
      <label htmlFor={inputId} className="sr-only">
        Filter recipes
      </label>
      <div className="relative mb-4">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter recipes by name, topic, or framework...`}
          className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-muted-foreground focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {filtered.length > 0 ? (
        <RecipeGrid>
          {filtered.map((r) => (
            <RecipeCard key={r.slug} {...r} />
          ))}
        </RecipeGrid>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No recipes match <span className="font-medium text-foreground">{query}</span>.
        </p>
      )}
    </div>
  );
}
