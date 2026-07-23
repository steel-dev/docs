// ABOUTME: BreadcrumbList and TechArticle JSON-LD emitted by the docs page renderer.
// ABOUTME: BreadcrumbJsonLd runs site-wide; TechArticleJsonLd covers integration pages.
const SITE_URL = 'https://docs.steel.dev';

interface CrumbItem {
  name: string;
  url: string;
}

// BreadcrumbList JSON-LD: home + named ancestors that have their own page +
// the page itself. Every ListItem carries `item` (Google requires it on all
// but the last), so url-less folder nodes are filtered out by the caller.
export function BreadcrumbJsonLd({ items }: { items: CrumbItem[] }) {
  if (items.length < 2) return null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

interface TechArticleProps {
  title: string;
  description?: string;
  path: string; // canonical path, e.g. /integrations/selenium
  datePublished?: string; // YYYY-MM-DD from frontmatter publishedAt
  dateModified?: string; // YYYY-MM-DD from git history
}

// TechArticle JSON-LD for integration pages. Cookbook recipes emit their own
// TechArticle via RecipeJsonLd (with per-author Person entries); integration
// pages are authored by the team, so the author is the Steel organization.
export function TechArticleJsonLd({
  title,
  description,
  path,
  datePublished,
  dateModified,
}: TechArticleProps) {
  const url = `${SITE_URL}${path}`;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: 'Steel', url: 'https://steel.dev' },
  };
  if (description) data.description = description;
  if (datePublished) data.datePublished = datePublished;
  if (dateModified) data.dateModified = dateModified;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
