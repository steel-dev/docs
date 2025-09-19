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
<<<<<<< Updated upstream
      text: "Integrations",
      url: "/integrations",
      active: "nested-url",
=======
      type: "menu",
      text: "APIs",
      items: [
        {
          text: "Sessions API",
          description: "API for managing user sessions.",
          url: "/sessions-api/overview",
        },
        {
          text: "Credentials API",
          description: "API for managing user credentials.",
          url: "/credentials-api/overview",
        },
        {
          text: "Files API",
          description: "API for managing user files.",
          url: "/files-api/overview",
        },
        {
          text: "Extensions API",
          description: "API for managing user extensions.",
          url: "/extensions-api/overview",
        },
        {
          text: "Captchas API",
          description: "API for managing user sessions.",
          url: "/captchas-api/overview",
        },
      ],
>>>>>>> Stashed changes
    },
    {
      text: "Cookbook",
      url: "/cookbook",
      active: "nested-url",
    },
    {
<<<<<<< Updated upstream
      text: "Changelog",
      url: "/changelog",
      active: "nested-url",
=======
      type: "menu",
      text: "Resources",
      items: [
        {
          text: "API Reference",
          description: "View the API reference for Steel.",
          url: "/api-reference",
        },
        {
          text: "Playground",
          description: "Explore Steel's features and capabilities.",
          url: "/playground",
        },
      ],
>>>>>>> Stashed changes
    },
    {
      text: "Playground",
      description: "Explore Steel's features and capabilities.",
      url: "/playground",
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
