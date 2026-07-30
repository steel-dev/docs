// ABOUTME: Shared schema.org entity IDs and pure builders for Steel documentation pages.
// ABOUTME: Keeps site identity and page references consistent across JSON-LD renderers.
export const DOCS_URL = 'https://docs.steel.dev';
export const STEEL_URL = 'https://steel.dev/';
export const STEEL_ORGANIZATION_ID = `${DOCS_URL}/#organization`;
export const DOCS_WEBSITE_ID = `${DOCS_URL}/#website`;
export const DOCS_SITE_NAME = 'Steel Docs';
export const DOCS_SITE_DESCRIPTION =
  "Documentation for Steel, an open-source browser API for AI agents and automation. Create cloud browser sessions with Steel's APIs, SDKs, and integrations.";
export const STEEL_SAME_AS = ['https://github.com/steel-dev', 'https://x.com/steeldotdev'] as const;

interface WebPageSchemaOptions {
  name: string;
  description?: string;
  path: string;
}

interface TechArticleSchemaOptions extends WebPageSchemaOptions {
  datePublished?: string;
  dateModified?: string;
}

export function getCanonicalPageUrl(path: string): string {
  return path === '/' ? `${DOCS_URL}/` : `${DOCS_URL}${path}`;
}

export function getWebPageId(path: string): string {
  return `${getCanonicalPageUrl(path)}#webpage`;
}

export function buildSiteIdentitySchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': STEEL_ORGANIZATION_ID,
        name: 'Steel',
        url: STEEL_URL,
        sameAs: STEEL_SAME_AS,
      },
      {
        '@type': 'WebSite',
        '@id': DOCS_WEBSITE_ID,
        url: `${DOCS_URL}/`,
        name: DOCS_SITE_NAME,
        description: DOCS_SITE_DESCRIPTION,
        publisher: { '@id': STEEL_ORGANIZATION_ID },
      },
    ],
  };
}

export function buildWebPageSchema({ name, description, path }: WebPageSchemaOptions) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': getWebPageId(path),
    url: getCanonicalPageUrl(path),
    name,
    isPartOf: { '@id': DOCS_WEBSITE_ID },
    about: { '@id': STEEL_ORGANIZATION_ID },
    publisher: { '@id': STEEL_ORGANIZATION_ID },
  };
  if (description) data.description = description;
  return data;
}

export function buildTechArticleSchema({
  name,
  description,
  path,
  datePublished,
  dateModified,
}: TechArticleSchemaOptions) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: name,
    url: getCanonicalPageUrl(path),
    mainEntityOfPage: { '@id': getWebPageId(path) },
    author: { '@id': STEEL_ORGANIZATION_ID },
    publisher: { '@id': STEEL_ORGANIZATION_ID },
  };
  if (description) data.description = description;
  if (datePublished) data.datePublished = datePublished;
  if (dateModified) data.dateModified = dateModified;
  return data;
}
