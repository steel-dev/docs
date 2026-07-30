import type { Metadata } from 'next';
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
  return <EnglishPage />;
}
