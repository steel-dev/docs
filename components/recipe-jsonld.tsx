const SITE_URL = 'https://docs.steel.dev';

interface AuthorRef {
  handle: string;
  name: string;
}

interface Props {
  slug: string;
  title: string;
  description: string;
  authors: AuthorRef[];
  datePublished?: string; // YYYY-MM-DD; earliest created across variants
  dateModified?: string; // YYYY-MM-DD; latest updated across variants
  sourceUrl?: string; // GitHub source link for the recipe
}

// Article JSON-LD for /cookbook/<slug>. Each author Person carries `url`
// pointing back to /cookbook/authors/<handle> so Search ties recipe
// E-E-A-T to the author profile pages, which themselves declare
// ProfilePage + Person via AuthorProfile. mainEntityOfPage anchors the
// schema at the canonical recipe URL.
export function RecipeJsonLd({
  slug,
  title,
  description,
  authors,
  datePublished,
  dateModified,
  sourceUrl,
}: Props) {
  const recipeUrl = `${SITE_URL}/cookbook/${slug}`;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: recipeUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': recipeUrl },
    author: authors.map((a) => ({
      '@type': 'Person',
      name: a.name,
      url: `${SITE_URL}/cookbook/authors/${a.handle}`,
    })),
  };
  if (datePublished) data.datePublished = datePublished;
  if (dateModified) data.dateModified = dateModified;
  if (sourceUrl) data.codeRepository = sourceUrl;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
