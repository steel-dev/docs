import type { BaseLayoutProps } from '@/components/layouts/shared';
import { docsPath } from '@/lib/docs-path';
/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: 'Steel Docs',
  },
  links: [
    {
      text: 'Overview',
      url: docsPath('/'),
      active: 'url',
    },
    {
      text: 'Integrations',
      url: docsPath('/integrations'),
      active: 'nested-url',
    },
    {
      text: 'Cookbook',
      url: docsPath('/cookbook'),
      active: 'nested-url',
    },
    {
      text: 'Changelog',
      url: docsPath('/changelog'),
      active: 'nested-url',
    },
    {
      text: 'API Reference',
      url: docsPath('/api-reference'),
    },
    // {
    //   type: "menu",
    //   text: "Libraries & SDKs",
    //   items: [
    //     {
    //       text: "Steel JS SDK",
    //       description: "JavaScript SDK for Steel.",
    //       url: "/tools/steel/sdk-introduction",
    //     },
    //     {
    //       text: "Steel Python SDK",
    //       description: "Python SDK for Steel in the browser.",
    //       url: "/tools/steel/python-sdk-reference",
    //     },
    //   ],
    // },
  ],
};
