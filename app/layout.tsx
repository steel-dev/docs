import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import { jetBrainsMono, inter } from "@/fonts";
import { GeistMono } from "geist/font/mono";
import { KeyboardShortcutsProvider } from "@/hooks/use-keyboard-shortcuts";
import { QueryProvider } from "@/providers/query-provider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <QueryProvider>
          <KeyboardShortcutsProvider>
            <RootProvider
              search={{
                enabled: true,
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
