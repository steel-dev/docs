import './global.css';
import { GoogleTagManager } from '@next/third-parties/google';
import { RootProvider } from 'fumadocs-ui/provider';
import { GeistMono } from 'geist/font/mono';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteIdentityJsonLd } from '@/components/page-jsonld';
import { inter, jetBrainsMono } from '@/fonts';
import { KeyboardShortcutsProvider } from '@/hooks/use-keyboard-shortcuts';
import { DOCS_SITE_DESCRIPTION, DOCS_SITE_NAME } from '@/lib/structured-data';
import { QueryProvider } from '@/providers/query-provider';

const OG_IMAGE = '/og/overview';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.steel.dev'),
  applicationName: DOCS_SITE_NAME,
  title: {
    template: `%s | ${DOCS_SITE_NAME}`,
    default: DOCS_SITE_NAME,
  },
  description: DOCS_SITE_DESCRIPTION,
  alternates: {
    types: {
      'text/plain': '/llms.txt',
    },
  },
  openGraph: {
    type: 'website',
    siteName: DOCS_SITE_NAME,
    locale: 'en_US',
    title: DOCS_SITE_NAME,
    description: DOCS_SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: DOCS_SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@steeldotdev',
    creator: '@steeldotdev',
    title: DOCS_SITE_NAME,
    description: DOCS_SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetBrainsMono.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <SiteIdentityJsonLd />
      </head>
      <body className="flex flex-col min-h-screen">
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
        <QueryProvider>
          <KeyboardShortcutsProvider>
            <RootProvider
              search={{
                enabled: true,
              }}
              theme={{
                enabled: false,
              }}
            >
              {children}
            </RootProvider>
          </KeyboardShortcutsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
