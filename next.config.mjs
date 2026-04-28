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
      // Legacy cookbook URLs. Concept pages now merge language variants via
      // a hash-driven Fumadocs Tabs component, so old language-suffixed
      // slugs redirect to `/cookbook/<concept>#<lang>`.
      {
        source: "/cookbook/playwright-ts",
        destination: "/cookbook/playwright#typescript",
        permanent: true,
      },
      {
        source: "/cookbook/playwright-py",
        destination: "/cookbook/playwright#python",
        permanent: true,
      },
      {
        source: "/cookbook/playwright-python",
        destination: "/cookbook/playwright#python",
        permanent: true,
      },
      { source: "/cookbook/puppeteer-ts", destination: "/cookbook/puppeteer", permanent: true },
      {
        source: "/cookbook/stagehand-ts",
        destination: "/cookbook/stagehand#typescript",
        permanent: true,
      },
      {
        source: "/cookbook/stagehand-py",
        destination: "/cookbook/stagehand#python",
        permanent: true,
      },
      {
        source: "/cookbook/claude-computer-use-ts",
        destination: "/cookbook/claude-computer-use#typescript",
        permanent: true,
      },
      {
        source: "/cookbook/claude-computer-use-py",
        destination: "/cookbook/claude-computer-use#python",
        permanent: true,
      },
      {
        source: "/cookbook/openai-computer-use-ts",
        destination: "/cookbook/openai-computer-use#typescript",
        permanent: true,
      },
      {
        source: "/cookbook/openai-computer-use-py",
        destination: "/cookbook/openai-computer-use#python",
        permanent: true,
      },
      {
        source: "/cookbook/gemini-computer-use-ts",
        destination: "/cookbook/gemini-computer-use#typescript",
        permanent: true,
      },
      {
        source: "/cookbook/gemini-computer-use-py",
        destination: "/cookbook/gemini-computer-use#python",
        permanent: true,
      },
      {
        source: "/cookbook/openai-agents-ts",
        destination: "/cookbook/openai-agents#typescript",
        permanent: true,
      },
      {
        source: "/cookbook/openai-agents-py",
        destination: "/cookbook/openai-agents#python",
        permanent: true,
      },
      {
        source: "/cookbook/vercel-ai-sdk-ts",
        destination: "/cookbook/vercel-ai-sdk",
        permanent: true,
      },
      { source: "/cookbook/files-api", destination: "/cookbook/files", permanent: true },
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
      { source: "/cookbook/files-starter", destination: "/cookbook/files", permanent: true },
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
    domains: ["cdn.openai.com", "github.com", "avatars.githubusercontent.com"],
  },
};

export default withMDX(config);
