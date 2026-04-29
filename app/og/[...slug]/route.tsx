import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

const SIZE = { width: 1200, height: 630 };

const SECTION_LABELS: Record<string, string> = {
  overview: 'Overview',
  integrations: 'Integrations',
  cookbook: 'Cookbook',
  changelog: 'Changelog',
  'api-reference': 'API Reference',
};

const SECTION_ACCENTS: Record<string, string> = {
  overview: '#a3a3a3',
  integrations: '#fde047',
  cookbook: '#fde047',
  changelog: '#a3a3a3',
  'api-reference': '#a3a3a3',
};

export async function GET(_req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await props.params;
  let page = source.getPage(slug);
  if (!page && slug?.[0] !== 'en') {
    page = source.getPage(['en', ...slug]);
  }

  const title = page?.data.title ?? 'Steel Docs';
  const description =
    page?.data.description ?? 'Documentation for Steel: the open-source browser API for AI agents.';
  const section = slug?.[0] === 'en' ? slug?.[1] : slug?.[0];
  const sectionLabel = section ? (SECTION_LABELS[section] ?? '') : '';
  const accent = section ? (SECTION_ACCENTS[section] ?? '#a3a3a3') : '#a3a3a3';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a0a',
        backgroundImage:
          'radial-gradient(ellipse 800px 500px at 100% 0%, rgba(253, 224, 71, 0.10), transparent 70%)',
        padding: '72px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <svg width="184" height="50" viewBox="0 0 92 25" fill="none">
          <path
            d="M6.39469 3C2.863 3 0 5.73424 0 9.10709C0 12.4799 2.863 15.2142 6.39469 15.2142H13.4999C13.8923 15.2142 14.2104 15.518 14.2104 15.8928C14.2104 16.2675 13.8923 16.5713 13.4999 16.5713H0.497365C0.222678 16.5713 0 16.784 0 17.0463V21.5248C0 21.7872 0.222678 21.9998 0.497365 21.9998H13.4999C17.0316 21.9998 19.8946 19.2656 19.8946 15.8928C19.8946 12.5199 17.0316 9.78566 13.4999 9.78566H6.39469C6.00228 9.78566 5.68417 9.48186 5.68417 9.10709C5.68417 8.73233 6.00228 8.42853 6.39469 8.42853H18.4434C18.4535 8.42863 18.4636 8.42868 18.4737 8.42868H20.6053C20.9977 8.42868 21.3158 8.73248 21.3158 9.10724V21.525C21.3158 21.7873 21.5385 22 21.8132 22H26.5026C26.7773 22 27 21.7873 27 21.525V9.10724C27 5.73439 24.137 3.00015 20.6053 3.00015H19.8946V3H6.39469Z"
            fill="#EEEEEC"
          />
          <path
            d="M43.08 14.68C43.34 16.2 44.42 17.2 46.2 17.2C47.56 17.2 48.48 16.66 48.46 15.62C48.44 14.58 47.56 13.98 45.34 13.44C42.26 12.7 40.28 11.46 40.28 9.18C40.28 6.6 42.44 4.98 45.68 4.98C48.84 4.98 51 6.92 51.34 9.78L48.3 9.94C48.14 8.44 47.1 7.5 45.6 7.5C44.28 7.5 43.34 8.18 43.4 9.22C43.44 10.42 44.84 10.82 46.36 11.2C49.54 11.9 51.56 13.26 51.56 15.52C51.56 18.22 49.18 19.74 46.12 19.74C42.66 19.74 40.22 17.82 40.02 14.82L43.08 14.68ZM54.5283 6.48H57.5483V8.9H60.3083V11.12H57.5483V16.04C57.5483 16.82 57.9483 17.26 58.7083 17.26H60.3283V19.5H58.0683C55.7283 19.5 54.5283 18.34 54.5283 16.04V11.12H52.8083V8.9H54.5283V6.48ZM61.4988 14.2C61.4988 10.86 63.6388 8.66 66.9388 8.66C69.8788 8.66 72.1388 10.7 72.1188 14.42V14.98H64.6388C64.7188 16.56 65.5788 17.52 66.9388 17.52C67.7988 17.52 68.5988 17 68.9388 16.2L71.9788 16.4C71.3388 18.46 69.3588 19.74 66.9388 19.74C63.6388 19.74 61.4988 17.54 61.4988 14.2ZM64.6588 13.16H69.0788C68.9188 11.56 67.9988 10.88 66.9388 10.88C65.6588 10.88 64.8188 11.74 64.6588 13.16ZM73.6863 14.2C73.6863 10.86 75.8263 8.66 79.1263 8.66C82.0663 8.66 84.3263 10.7 84.3063 14.42V14.98H76.8263C76.9063 16.56 77.7663 17.52 79.1263 17.52C79.9863 17.52 80.7863 17 81.1263 16.2L84.1663 16.4C83.5263 18.46 81.5463 19.74 79.1263 19.74C75.8263 19.74 73.6863 17.54 73.6863 14.2ZM76.8463 13.16H81.2663C81.1063 11.56 80.1863 10.88 79.1263 10.88C77.8463 10.88 77.0063 11.74 76.8463 13.16ZM86.4137 5.3H89.4138V16.42C89.4138 16.96 89.7138 17.26 90.2337 17.26H90.9938V19.5H89.3538C87.5738 19.5 86.4137 18.44 86.4137 16.56V5.3Z"
            fill="#EDEDEC"
          />
        </svg>
        {sectionLabel && (
          <div
            style={{
              fontSize: '22px',
              color: accent,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            {sectionLabel}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          maxWidth: '1000px',
        }}
      >
        <div
          style={{
            fontSize: '88px',
            fontWeight: 600,
            color: '#fafafa',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: '32px',
              color: '#a3a3a3',
              lineHeight: 1.4,
              fontWeight: 400,
              letterSpacing: '-0.005em',
            }}
          >
            {description}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: '20px',
            color: '#525252',
            fontWeight: 400,
          }}
        >
          docs.steel.dev
        </div>
      </div>
    </div>,
    SIZE,
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: page.url.split('/').filter(Boolean),
  }));
}
