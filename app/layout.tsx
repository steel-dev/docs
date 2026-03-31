import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { GeistMono } from 'geist/font/mono';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { inter, jetBrainsMono } from '@/fonts';
import { KeyboardShortcutsProvider } from '@/hooks/use-keyboard-shortcuts';
import { QueryProvider } from '@/providers/query-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.steel.dev'),
  alternates: {
    types: {
      'text/plain': '/llms.txt',
    },
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
