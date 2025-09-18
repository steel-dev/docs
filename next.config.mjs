import { createMDX } from 'fumadocs-mdx/next';

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
        source: '/start',
        destination: '/',
        permanent: false,
      },
      {
        source: '/.well-known/llms.txt',
        destination: '/llms.txt',
        permanent: true, // 301 redirect - tells crawlers this is the canonical location
      },
      {
        source: '/api-reference',
        destination: 'https://docs.steel.dev/api-reference',
        permanent: true,
      },
      {
        source: '/playground',
        destination: 'https://playground.steel.dev/',
        permanent: true,
      },
      {
        source: '/render',
        destination: 'https://playground.steel.dev/',
        permanent: true,
      },
      {
        source: '/railway',
        destination: 'https://railway.app/template/FQG9Ca',
        permanent: true,
      },
      {
        source: '/resources/reference/integrations/valtown/quickstart',
        destination: 'https://www.val.town/v/steel/steel_puppeteer_starter',
        permanent: true,
      }
    ];
  },
  images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'api.scalar.com',
        },
      ],
    },
};

export default withMDX(config);
