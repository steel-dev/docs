import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Remove Webpack customization – not supported in Turbopack
  turbopack: {
    // Add any Turbopack-specific options here (currently optional)
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
        source: "/api-reference",
        destination: "https://docs.steel.dev/api-reference",
        permanent: true,
      },
      {
        source: "/playground",
        destination: "https://playground.steel.dev/",
        permanent: true,
      },
      {
        source: "/self-hosting/render",
        destination: "https://render.com/deploy?image=steeldev/steel",
        permanent: true,
      },
      {
        source: "/self-hosting/railway",
        destination: "https://railway.app/template/FQG9Ca",
        permanent: true,
      },
      {
        source: "/examples/stagehand-py",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-stagehand-python-starter",
        permanent: true,
      },
      {
        source: "/examples/stagehand-ts",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-stagehand-node-starter",
        permanent: true,
      },
      {
        source: "/examples/playwright",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-playwright-starter",
        permanent: true,
      },
      {
        source: "/examples/puppeteer",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-puppeteer-starter",
        permanent: true,
      },
      {
        source: "/examples/selenium",
        destination:
          "https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-selenium-starter",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.scalar.com",
      },
    ],
  },
};

export default withMDX(config);
