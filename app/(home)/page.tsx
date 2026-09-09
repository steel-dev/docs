import type { Metadata } from 'next';
import { WebPageJsonLd } from '@/components/page-jsonld';
import { docsPath } from '@/lib/docs-path';
import { DOCS_SITE_DESCRIPTION } from '@/lib/structured-data';
import EnglishPage from './_pages/page.en';

export const metadata: Metadata = {
  alternates: {
    canonical: docsPath('/'),
    types: {
      'text/plain': docsPath('/llms.txt'),
    },
  },
};

export default function HomePage() {
  return (
    <>
      <WebPageJsonLd title="Steel Documentation" description={DOCS_SITE_DESCRIPTION} path="/" />
      <EnglishPage />
    </>
  );
}
