import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { GeistMono } from 'geist/font/mono';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ReoAnalytics } from '@/components/analytics/reo';
import { inter, jetBrainsMono } from '@/fonts';
import { KeyboardShortcutsProvider } from '@/hooks/use-keyboard-shortcuts';
import { QueryProvider } from '@/providers/query-provider';

const SITE_NAME = 'Steel Docs';
const SITE_DESCRIPTION =
  "Find all the guides and resources you need to build with Steel's browser automation platform.";
const OG_IMAGE = '/og/overview';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.steel.dev'),
  applicationName: SITE_NAME,
  title: {
    template: `%s | ${SITE_NAME}`,
    default: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    types: {
      'text/plain': '/llms.txt',
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@steelsystems',
    creator: '@steelsystems',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
      <head />
      <body className="flex flex-col min-h-screen">
        <ReoAnalytics />
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
