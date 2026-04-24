import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Remove Webpack customization – not supported in Turbopack
  turbopack: {
    // Add any Turbopack-specific options here (currently optional)
  },
  async rewrites() {
    return [];
  },
  redirects: async () => {
    return [
      {
        source: "/start",
        destination: "/",
        permanent: false,
      },
      {
        source: "/.well-known/llms.txt",
        destination: "/llms.txt",
        permanent: true, // 301 redirect - tells crawlers this is the canonical location
      },
      {
        source: "/overview/llms-full.txt",
        destination: "/llms-full.txt",
        permanent: true,
      },
      {
        source: "/steel-js-sdk",
        destination: "https://www.npmjs.com/package/steel-sdk",
        permanent: true,
      },
      {
        source: "/steel-python-sdk",
        destination: "https://pypi.org/project/steel-sdk/",
        permanent: true,
      },
      {
        source: "/api-reference",
        destination: "https://steel.apidocumentation.com/api-reference",
        permanent: true,
      },
      // {
      //   source: "/overview/steel-cli",
      //   destination: "https://github.com/steel-dev/cli",
      //   permanent: true,
      // },
      {
        source: "/overview/self-hosting/render",
        destination: "https://render.com/deploy?image=steeldev/steel",
        permanent: true,
      },
      // {
      //   source: "/overview/self-hosting/railway",
      //   destination: "https://railway.app/template/FQG9Ca",
      //   permanent: true,
      // },
      {
        source: "/integrations/valtown/quickstart",
        destination: "https://www.val.town/x/steel/steel_puppeteer_starter",
        permanent: true,
      },
      // Legacy cookbook URLs. Keep to avoid breaking external links.
      { source: "/cookbook/playwright", destination: "/cookbook/playwright-ts", permanent: true },
      {
        source: "/cookbook/playwright-python",
        destination: "/cookbook/playwright-py",
        permanent: true,
      },
      { source: "/cookbook/puppeteer", destination: "/cookbook/puppeteer-ts", permanent: true },
      {
        source: "/cookbook/steel-browser-use-starter",
        destination: "/cookbook/browser-use",
        permanent: true,
      },
      {
        source: "/cookbook/credentials-starter",
        destination: "/cookbook/credentials",
        permanent: true,
      },
      {
        source: "/cookbook/auth-context-starter",
        destination: "/cookbook/auth-context",
        permanent: true,
      },
      {
        source: "/cookbook/extensions-starter",
        destination: "/cookbook/extensions",
        permanent: true,
      },
      { source: "/cookbook/files-starter", destination: "/cookbook/files-api", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Link",
            value: '</llms.txt>; rel="alternate"; type="text/markdown", </llms-full.txt>; rel="alternate"; type="text/markdown"',
          },
        ],
      },
    ];
  },
  images: {
    domains: ["cdn.openai.com"],
  },
};

export default withMDX(config);
