import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { stripDocsPath } from '@/lib/docs-path';
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
    page?.data.description ??
    'Documentation for Steel: the open-source browser API for AI agents — cloud browsers with stealth, proxies, CAPTCHA solving, and observability.';
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
        <svg width="168" height="50" viewBox="0 0 84 25" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17.586 22C18.081 22 18.328 22 18.517 21.904C18.684 21.819 18.819 21.684 18.904 21.517C19 21.328 19 21.081 19 20.586L19 4.414C19 3.919 19 3.672 18.904 3.483C18.819 3.316 18.684 3.181 18.517 3.096C18.328 3 18.081 3 17.586 3L1.414 3C0.919 3 0.672 3 0.483 3.096C0.316 3.181 0.181 3.316 0.096 3.483C0 3.672 0 3.919 0 4.414L0 20.586C0 21.081 0 21.328 0.096 21.517C0.181 21.684 0.316 21.819 0.483 21.904C0.672 22 0.919 22 1.414 22L17.586 22ZM16.53 6.167C16.995 6.167 17.227 6.167 17.381 6.264C17.515 6.349 17.611 6.482 17.651 6.636C17.696 6.812 17.624 7.033 17.48 7.475L15.878 12.392C15.763 12.743 15.706 12.918 15.599 13.048C15.504 13.162 15.382 13.251 15.243 13.306C15.087 13.368 14.902 13.368 14.533 13.368L2.592 13.368C2.039 13.368 1.762 13.368 1.638 13.26C1.53 13.166 1.474 13.026 1.488 12.883C1.504 12.719 1.704 12.529 2.105 12.148L7.588 6.944C7.89 6.657 8.041 6.513 8.216 6.411C8.37 6.32 8.538 6.253 8.712 6.212C8.909 6.167 9.118 6.167 9.535 6.167L16.53 6.167Z"
            fill="#EEEEEC"
          />
          <path
            d="M35.08 14.68C35.34 16.2 36.42 17.2 38.2 17.2C39.56 17.2 40.48 16.66 40.46 15.62C40.44 14.58 39.56 13.98 37.34 13.44C34.26 12.7 32.28 11.46 32.28 9.18C32.28 6.6 34.44 4.98 37.68 4.98C40.84 4.98 43 6.92 43.34 9.78L40.3 9.94C40.14 8.44 39.1 7.5 37.6 7.5C36.28 7.5 35.34 8.18 35.4 9.22C35.44 10.42 36.84 10.82 38.36 11.2C41.54 11.9 43.56 13.26 43.56 15.52C43.56 18.22 41.18 19.74 38.12 19.74C34.66 19.74 32.22 17.82 32.02 14.82L35.08 14.68ZM46.528 6.48H49.548V8.9H52.308V11.12H49.548V16.04C49.548 16.82 49.948 17.26 50.708 17.26H52.328V19.5H50.068C47.728 19.5 46.528 18.34 46.528 16.04V11.12H44.808V8.9H46.528V6.48ZM53.499 14.2C53.499 10.86 55.639 8.66 58.939 8.66C61.879 8.66 64.139 10.7 64.119 14.42V14.98H56.639C56.719 16.56 57.579 17.52 58.939 17.52C59.799 17.52 60.599 17 60.939 16.2L63.979 16.4C63.339 18.46 61.359 19.74 58.939 19.74C55.639 19.74 53.499 17.54 53.499 14.2ZM56.659 13.16H61.079C60.919 11.56 59.999 10.88 58.939 10.88C57.659 10.88 56.819 11.74 56.659 13.16ZM65.686 14.2C65.686 10.86 67.826 8.66 71.126 8.66C74.066 8.66 76.326 10.7 76.306 14.42V14.98H68.826C68.906 16.56 69.766 17.52 71.126 17.52C71.986 17.52 72.786 17 73.126 16.2L76.166 16.4C75.526 18.46 73.546 19.74 71.126 19.74C67.826 19.74 65.686 17.54 65.686 14.2ZM68.846 13.16H73.266C73.106 11.56 72.186 10.88 71.126 10.88C69.846 10.88 69.006 11.74 68.846 13.16ZM78.414 5.3H81.414V16.42C81.414 16.96 81.714 17.26 82.234 17.26H82.994V19.5H81.354C79.574 19.5 78.414 18.44 78.414 16.56V5.3Z"
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
    slug: stripDocsPath(page.url).split('/').filter(Boolean),
  }));
}
