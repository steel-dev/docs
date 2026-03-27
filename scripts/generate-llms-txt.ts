#!/usr/bin/env bun
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { source } from '../lib/source';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Configuration for generation
interface GenerationConfig {
  productionUrl: string;
}

// Environment variables (optional):
// LLMS_BASE_URL - URL for llms.txt (default: "https://docs.steel.dev")
const config: GenerationConfig = {
  productionUrl: process.env.LLMS_BASE_URL || 'https://docs.steel.dev',
};

interface PageMetadata {
  title: string;
  description: string;
  url: string;
  cleanUrl: string;
  section: string[];
}

const ROOT_SECTION_ORDER = ['overview', 'integrations', 'cookbook', 'changelog'];
const ROOT_INTRO_LINES = [
  '> Steel is an open-source cloud browser infrastructure platform for AI agents. It gives your agent a real browser that can navigate pages, fill forms, solve CAPTCHAs, persist auth, and extract content from modern websites. Steel is the fastest remote browser in independent benchmarks: 0.89s average lifecycle, 1.7x to 9x faster than alternatives.',
  '',
  '## Who Steel is for',
  '',
  '- **AI agent builders** who need reliable, authenticated web access in production.',
  '- **Scraping and data extraction teams** who want managed browser infrastructure without running headless Chrome themselves.',
  '- **Automation engineers** migrating Playwright, Puppeteer, or Selenium scripts to the cloud.',
  '- **Teams that need persistent browser state**: login sessions, cookies, credentials, and extensions that survive across runs.',
  '',
  '## For coding agents',
  '',
  '- [Install guide](https://setup.steel.dev/install.md): Install the Steel CLI, add the `steel-browser` skill, authenticate, and verify with `steel scrape`.',
  '- [Steel CLI + Skill](https://docs.steel.dev/overview/steel-cli): Learn the terminal workflow, `steel browser` commands, and agent skill setup.',
  '- [Steel Browser Skill Package](https://github.com/steel-dev/cli/tree/main/skills/steel-browser): Install the dedicated skill for coding agents.',
  '',
  '## Why Steel',
  '',
  '- **Performance**: 0.89s avg browser lifecycle (p95: 1.09s). 25.6% control-plane tax, the lowest measured in independent testing.',
  '- **Open source**: Core browser runtime at [github.com/steel-dev/steel-browser](https://github.com/steel-dev/steel-browser). Benchmark code at [github.com/steel-dev/browserbench](https://github.com/steel-dev/browserbench).',
  '- **Self-hostable**: Run Steel in your own infrastructure with Docker or Railway one-click deploy. No vendor lock-in.',
  '- **Framework agnostic**: Works with Playwright, Puppeteer, and Selenium. Native Node and Python SDKs.',
  '- **Production ready**: Profiles for persistent auth, CAPTCHA solving, stealth/proxy tooling, agent logs, and live session debugging.',
  '',
  '## Key features',
  '',
  '- Steel runs isolated cloud browser sessions through an API, CLI, and SDKs.',
  '- Steel can return page content as HTML, markdown, screenshots, and PDFs.',
  '- Steel can persist browser state across runs with profiles, cookies, credentials, extensions, and auth context.',
  '- Steel includes anti-bot tooling: proxies, stealth settings, CAPTCHA solving, and mobile-mode browsing.',
  '- Steel includes debugging and observability tools: live sessions, past session embeds, recordings, WebRTC streaming, and agent logs.',
  '- Steel supports cloud, self-hosted, and local runtime workflows.',
];

// Get all pages from source
function getAllPages(): PageMetadata[] {
  const sourcePages = source.getPages();

  return (
    sourcePages
      .map((page) => {
        // Extract section from URL (split by / and filter out empty strings)
        const urlParts = page.url.split('/').filter(Boolean);
        const section = urlParts.slice(0, -1); // All parts except the last one

        // Clean URL for content links (remove locale prefix)
        let cleanUrl = page.url;
        const locales = ['en', 'es']; // Add your supported locales here
        if (urlParts.length > 0 && locales.includes(urlParts[0])) {
          // Remove the locale prefix for content links
          cleanUrl = '/' + urlParts.slice(1).join('/');
        }

        return {
          title: (page.data as any)?.title || page.file.name,
          description: (page.data as any)?.description || '',
          url: page.url, // Keep original URL for file path generation
          cleanUrl: cleanUrl, // Add clean URL for content links
          section: section,
        };
      })
      // .filter(
      //   (page) =>
      //     !page.url.includes("/changelog/") &&
      //     !page.section.includes("changelog"),
      // )
      .sort((a, b) => a.url.localeCompare(b.url))
  );
}

// Generate llms.txt content for a set of pages
function generateLLMsContent(
  pages: PageMetadata[],
  title: string,
  currentSection: string[] = [],
  introLines: string[] = [],
): string {
  const lines = [`# ${title}`, ''];

  if (introLines.length > 0) {
    lines.push(...introLines, '');
  }

  lines.push('## Pages', '');

  // For deep sections (like /tools), we want to group by the next level
  const groupDepth = currentSection.length;
  const groupedBySections = new Map<string, PageMetadata[]>();

  // Group pages by their section at the appropriate depth
  for (const page of pages) {
    let sectionKey = 'root';

    if (page.section.length > groupDepth) {
      // Group by the next level after current section
      sectionKey = page.section[groupDepth];
    } else if (page.section.length === groupDepth && groupDepth > 0) {
      sectionKey = '_overview';
    }

    const sectionArray = groupedBySections.get(sectionKey) ?? [];
    sectionArray.push(page);
    groupedBySections.set(sectionKey, sectionArray);
  }

  // Sort sections, but put _overview first if it exists
  const sortedSections = Array.from(groupedBySections.keys()).sort((a, b) => {
    if (a === '_overview') return -1;
    if (b === '_overview') return 1;
    if (a === 'root') return -1;
    if (b === 'root') return 1;

    if (currentSection.length === 0) {
      const aIndex = ROOT_SECTION_ORDER.indexOf(a);
      const bIndex = ROOT_SECTION_ORDER.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
    }

    return a.localeCompare(b);
  });

  // Add subsection headers when we have multiple sections
  const needsSubsectionHeaders =
    sortedSections.length > 2 || (currentSection.length === 0 && sortedSections.length > 1);

  for (const section of sortedSections) {
    const sectionPages = (groupedBySections.get(section) ?? []).sort((a, b) => {
      // Sort overview pages first
      if (a.url.endsWith(`/${section}`)) return -1;
      if (b.url.endsWith(`/${section}`)) return 1;
      return a.title.localeCompare(b.title);
    });

    if (section === '_overview') {
      // These are overview pages at the current level
      for (const page of sectionPages) {
        const pageUrl =
          page.cleanUrl === '/'
            ? `${config.productionUrl}/`
            : `${config.productionUrl}${page.cleanUrl}`;
        lines.push(
          `- [${page.title}](${pageUrl})${page.description ? `: ${page.description}` : ''}`,
        );
      }
      if (sectionPages.length > 0) lines.push('');
    } else if (section !== 'root') {
      // Add subsection header for better organization
      if (needsSubsectionHeaders) {
        lines.push(`#### ${section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ')}`);
        lines.push('');
      } else {
        lines.push(`### ${section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ')}`);
        lines.push('');
      }

      for (const page of sectionPages) {
        const pageUrl =
          page.cleanUrl === '/'
            ? `${config.productionUrl}/`
            : `${config.productionUrl}${page.cleanUrl}`;
        lines.push(
          `- [${page.title}](${pageUrl})${page.description ? `: ${page.description}` : ''}`,
        );
      }
      lines.push('');
    } else {
      // Root level pages
      for (const page of sectionPages) {
        const pageUrl =
          page.cleanUrl === '/'
            ? `${config.productionUrl}/`
            : `${config.productionUrl}${page.cleanUrl}`;
        lines.push(
          `- [${page.title}](${pageUrl})${page.description ? `: ${page.description}` : ''}`,
        );
      }
      if (sectionPages.length > 0) lines.push('');
    }
  }

  return lines.join('\n').trim();
}

// Create directory if it doesn't exist
async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Main generation function
async function generateAllLLMsTxt() {
  console.log('🚀 Starting documentation generation...');

  const allPages = getAllPages();
  console.log(`📄 Found ${allPages.length} pages`);

  // Generate root llms.txt with production URLs
  const rootContent = generateLLMsContent(allPages, 'Steel Documentation', [], ROOT_INTRO_LINES);
  const rootContentWithOptional = [
    rootContent,
    '',
    '## Optional',
    '',
    `- [llms-full.txt](${config.productionUrl}/llms-full.txt): Full concatenated docs bundle for tools that prefer a single LLM-friendly context file.`,
  ].join('\n');
  await fs.writeFile(path.join(PUBLIC_DIR, 'llms.txt'), rootContentWithOptional);
  console.log('✔️  Generated root llms.txt');

  // Generate section-level llms.txt files
  const sections = new Map<string, PageMetadata[]>();

  for (const page of allPages) {
    // Generate for each directory level
    for (let i = 1; i <= page.section.length; i++) {
      const sectionPath = page.section.slice(0, i).join('/');
      const sectionArray = sections.get(sectionPath) ?? [];
      sectionArray.push(page);
      sections.set(sectionPath, sectionArray);
    }
  }

  // Create llms.txt for each section
  for (const [sectionPath, sectionPages] of sections) {
    const sectionParts = sectionPath.split('/');
    const sectionTitle = 'Documentation';

    const sectionContent = generateLLMsContent(sectionPages, sectionTitle, sectionParts);
    const outputPath = path.join(PUBLIC_DIR, sectionPath);

    await ensureDir(outputPath);
    await fs.writeFile(path.join(outputPath, 'llms.txt'), sectionContent);
  }
  console.log('✔️  Generated section llms.txt files');

  console.log('✅ All llms.txt files generated successfully!');
}

// Run the generation
generateAllLLMsTxt().catch(console.error);
