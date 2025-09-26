import type { BaseLayoutProps } from "@/components/layouts/shared";
/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: "Steel Docs",
  },
  links: [
    {
      text: "Overview",
      url: "/overview",
      active: "nested-url",
    },
    {
      text: "Integrations",
      url: "/integrations",
      active: "nested-url",
    },
    {
      text: "Cookbook",
      url: "/cookbook",
      active: "nested-url",
    },
    {
      text: "Changelog",
      url: "/changelog",
      active: "nested-url",
    },
    {
      text: "Playground",
      url: "/playground",
    },
    {
      text: "API Reference",
      url: "/api-reference",
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
