// ABOUTME: Site identity, page, breadcrumb, and article JSON-LD renderers.
// ABOUTME: Shared builders keep entity IDs consistent across documentation pages.
import {
  buildSiteIdentitySchema,
  buildTechArticleSchema,
  buildWebPageSchema,
  DOCS_URL,
} from '@/lib/structured-data';

interface CrumbItem {
  name: string;
  url: string;
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function SiteIdentityJsonLd() {
  return <JsonLd data={buildSiteIdentitySchema()} />;
}

interface WebPageProps {
  title: string;
  description?: string;
  path: string;
}

export function WebPageJsonLd({ title, description, path }: WebPageProps) {
  return <JsonLd data={buildWebPageSchema({ name: title, description, path })} />;
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
      item: `${DOCS_URL}${item.url}`,
    })),
  };
  return <JsonLd data={data} />;
}

interface TechArticleProps {
  title: string;
  description?: string;
  path: string; // canonical path, e.g. /integrations/selenium
  datePublished?: string; // YYYY-MM-DD from frontmatter publishedAt
  dateModified?: string; // YYYY-MM-DD from git history
  image?: string; // absolute OG image URL
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
  image,
}: TechArticleProps) {
  return (
    <JsonLd
      data={buildTechArticleSchema({
        name: title,
        description,
        path,
        datePublished,
        dateModified,
        image,
      })}
    />
  );
}
