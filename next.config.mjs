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
      }
    ];
  },
};

export default withMDX(config);
