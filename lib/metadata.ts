import type { Metadata } from 'next/types';

const defaultMetadata: Metadata = {
  title: 'Steel Docs',
  description:
    "Find all the guides and resources you need to build with Steel's browser automation platform",
  openGraph: {
    title: 'Steel Docs',
    description:
      "Find all the guides and resources you need to build with Steel's browser automation platform",
    url: 'https://docs.steel.dev',
    siteName: 'Steel Docs',
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Steel Docs',
    description:
      "Find all the guides and resources you need to build with Steel's browser automation platform",
    creator: '@steelsystems',
    images: ['/images/logo.png'],
  },
};

const overviewMetadata: Partial<Metadata> = {
  title: 'Steel Documentation',
  description:
    "Find all the guides and resources you need to build with Steel's browser automation platform.",
  openGraph: {
    title: 'Steel Documentation',
    description:
      "Find all the guides and resources you need to build with Steel's browser automation platform.",
    images: [{ url: '/images/logo.png', width: 800, height: 600 }],
  },
  twitter: {
    title: 'Steel Documentation',
    description:
      "Find all the guides and resources you need to build with Steel's browser automation platform.",
    images: ['/images/logo.png'],
  },
};

const integrationsMetadata: Partial<Metadata> = {
  title: 'Integrations',
  description: 'Learn how to integrate Steel with popular browser agents and automation tools.',
  openGraph: {
    title: 'Integrations',
    description: 'Learn how to integrate Steel with popular browser agents and automation tools.',
    images: [{ url: '/images/logo.png', width: 800, height: 600 }],
  },
  twitter: {
    title: 'Integrations',
    description: 'Learn how to integrate Steel with popular browser agents and automation tools.',
    images: ['/images/logo.png'],
  },
};

const cookbookMetadata: Partial<Metadata> = {
  title: 'Cookbook',
  description: 'Practical recipes and examples for automating browsers and workflows with Steel.',
  openGraph: {
    title: 'Cookbook',
    description: 'Practical recipes and examples for automating browsers and workflows with Steel.',
    images: [{ url: '/images/logo.png', width: 800, height: 600 }],
  },
  twitter: {
    title: 'Cookbook',
    description: 'Practical recipes and examples for automating browsers and workflows with Steel.',
    images: ['/images/logo.png'],
  },
};

const changelogMetadata: Partial<Metadata> = {
  title: 'Changelog',
  description: 'Stay up to date with the latest features, improvements, and fixes in Steel.',
  openGraph: {
    title: 'Changelog',
    description: 'Stay up to date with the latest features, improvements, and fixes in Steel.',
    images: [{ url: '/images/logo.png', width: 800, height: 600 }],
  },
  twitter: {
    title: 'Changelog',
    description: 'Stay up to date with the latest features, improvements, and fixes in Steel.',
    images: ['/images/logo.png'],
  },
};

export function createMetadata(override: Partial<Metadata>): Metadata {
  return {
    ...defaultMetadata,
    ...override,
    openGraph: {
      ...defaultMetadata.openGraph,
      ...override.openGraph,
    },
    twitter: {
      ...defaultMetadata.twitter,
      ...override.twitter,
    },
  };
}

export const baseUrl =
  process.env.NODE_ENV === 'development'
    ? new URL('http://localhost:3030')
    : new URL(`https://${process.env.NEXT_PUBLIC_VERCEL_URL!}`);

export function getRouteMetadata(path: string): Partial<Metadata> {
  if (path.startsWith('/overview')) return overviewMetadata;
  if (path.startsWith('/integrations')) return integrationsMetadata;
  if (path.startsWith('/cookbook')) return cookbookMetadata;
  if (path.startsWith('/changelog')) return changelogMetadata;
  // fallback for dynamic docs pages
  return {};
}
