// ABOUTME: Contract tests for shared schema.org entity IDs and pure JSON-LD builders.
// ABOUTME: Prevents disconnected entities, unverified profiles, and invented freshness.
import { describe, expect, test } from 'bun:test';
import {
  buildSiteIdentitySchema,
  buildTechArticleSchema,
  buildWebPageSchema,
  DOCS_WEBSITE_ID,
  getWebPageId,
  STEEL_ORGANIZATION_ID,
  STEEL_SAME_AS,
} from '@/lib/structured-data';

describe('structured data builders', () => {
  test('builds one connected site identity graph with verified profiles', () => {
    const schema = buildSiteIdentitySchema();
    const organization = schema['@graph'].find((node) => node['@type'] === 'Organization');
    const website = schema['@graph'].find((node) => node['@type'] === 'WebSite');

    expect(organization).toEqual({
      '@type': 'Organization',
      '@id': STEEL_ORGANIZATION_ID,
      name: 'Steel',
      url: 'https://steel.dev/',
      sameAs: STEEL_SAME_AS,
    });
    expect(website).toMatchObject({
      '@id': DOCS_WEBSITE_ID,
      url: 'https://docs.steel.dev/',
      name: 'Steel Docs',
      publisher: { '@id': STEEL_ORGANIZATION_ID },
    });
    expect(STEEL_SAME_AS).toEqual(['https://github.com/steel-dev', 'https://x.com/steeldotdev']);
  });

  test('builds the homepage entity without invented freshness', () => {
    const page = buildWebPageSchema({
      name: 'Steel Documentation',
      description: 'Documentation for Steel.',
      path: '/',
    });

    expect(page).toMatchObject({
      '@type': 'WebPage',
      '@id': 'https://docs.steel.dev/#webpage',
      url: 'https://docs.steel.dev/',
      name: 'Steel Documentation',
      isPartOf: { '@id': DOCS_WEBSITE_ID },
      about: { '@id': STEEL_ORGANIZATION_ID },
      publisher: { '@id': STEEL_ORGANIZATION_ID },
    });
    expect(page).not.toHaveProperty('datePublished');
    expect(page).not.toHaveProperty('dateModified');
  });

  test('uses canonical page IDs and omits absent optional fields', () => {
    const page = buildWebPageSchema({
      name: 'Quickstart',
      path: '/overview/sessions-api/quickstart',
    });

    expect(page['@id']).toBe('https://docs.steel.dev/overview/sessions-api/quickstart#webpage');
    expect(page).not.toHaveProperty('description');
  });

  test('connects articles to the emitted page and organization entities', () => {
    const article = buildTechArticleSchema({
      name: 'Run Playwright on Steel Cloud Browsers',
      description: 'Connect Playwright to Steel.',
      path: '/integrations/playwright',
      dateModified: '2026-07-30',
    });

    expect(article).toMatchObject({
      '@type': 'TechArticle',
      mainEntityOfPage: { '@id': getWebPageId('/integrations/playwright') },
      author: { '@id': STEEL_ORGANIZATION_ID },
      publisher: { '@id': STEEL_ORGANIZATION_ID },
      dateModified: '2026-07-30',
    });
    expect(article).not.toHaveProperty('datePublished');
  });
});
