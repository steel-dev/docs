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
    return [
      {
        source: "/:path*.mdx",
        destination: "/llms.mdx/:path*",
      },
    ];
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
      {
        source: "/playground",
        destination: "https://playground.steel.dev/",
        permanent: true,
      },
      {
        source: "/overview/steel-cli",
        destination: "https://github.com/steel-dev/cli",
        permanent: true,
      },
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
      {
        source: "/cookbook/stagehand-py",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-stagehand-python-starter",
        permanent: true,
      },
      {
        source: "/cookbook/stagehand-ts",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-stagehand-node-starter",
        permanent: true,
      },
      {
        source: "/cookbook/playwright",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-playwright-starter",
        permanent: true,
      },
      {
        source: "/cookbook/playwright-python",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-playwright-python-starter",
        permanent: true,
      },
      {
        source: "/cookbook/puppeteer",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-puppeteer-starter",
        permanent: true,
      },
      {
        source: "/cookbook/selenium",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-selenium-starter",
        permanent: true,
      },
      {
        source: "/cookbook/steel-browser-use-starter",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-browser-use-starter",
        permanent: true,
      },
      {
        source: "/cookbook/credentials-starter",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-credentials-starter",
        permanent: true,
      },
      {
        source: "/cookbook/auth-context-starter",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-auth-context-starter",
        permanent: true,
      },
      {
        source: "/cookbook/extensions-starter",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-extensions-starter",
        permanent: true,
      },
      {
        source: "/cookbook/files-starter",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-files-api-starter",
        permanent: true,
      },
    ];
  },
  images: {
    domains: ["cdn.openai.com"],
  },
};

export default withMDX(config);
