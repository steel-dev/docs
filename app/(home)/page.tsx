import type { Metadata } from 'next';
import { WebPageJsonLd } from '@/components/page-jsonld';
import { DOCS_SITE_DESCRIPTION } from '@/lib/structured-data';
import EnglishPage from './_pages/page.en';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    types: {
      'text/plain': '/llms.txt',
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
