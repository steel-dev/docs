// ABOUTME: Shared schema.org entity IDs and pure builders for Steel documentation pages.
// ABOUTME: Keeps site identity and page references consistent across JSON-LD renderers.
export const DOCS_URL = 'https://docs.steel.dev';
export const STEEL_URL = 'https://steel.dev/';
export const STEEL_ORGANIZATION_ID = `${DOCS_URL}/#organization`;
export const DOCS_WEBSITE_ID = `${DOCS_URL}/#website`;
export const DOCS_SITE_NAME = 'Steel Docs';
export const DOCS_SITE_DESCRIPTION =
  'Documentation for Steel, the open-source browser API for AI agents — managed cloud browsers with stealth, residential proxies, CAPTCHA solving, persistent profiles, session replays, and agent observability.';
export const STEEL_SAME_AS = ['https://github.com/steel-dev', 'https://x.com/steeldotdev'] as const;
export const STEEL_LOGO_URL = `${DOCS_URL}/images/logo.png`;

interface WebPageSchemaOptions {
  name: string;
  description?: string;
  path: string;
}

interface TechArticleSchemaOptions extends WebPageSchemaOptions {
  datePublished?: string;
  dateModified?: string;
  image?: string; // absolute URL, e.g. `${DOCS_URL}/og/integrations/playwright`
}

export function getCanonicalPageUrl(path: string): string {
  return path === '/' ? `${DOCS_URL}/` : `${DOCS_URL}${path}`;
}

export function getWebPageId(path: string): string {
  return `${getCanonicalPageUrl(path)}#webpage`;
}

// Google reconciles entities on `@id`, not `url`, so the recipe author Person
// and the ProfilePage Person must share this ID to merge in the Search graph.
export function getAuthorPersonId(handle: string): string {
  return `${DOCS_URL}/cookbook/authors/${handle}#person`;
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
        logo: STEEL_LOGO_URL,
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
  image,
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
  if (image) data.image = image;
  return data;
}
