#!/usr/bin/env bun
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import matter from 'gray-matter';
import { AGENT_INSTRUCTIONS } from '../lib/agent-instructions';
import { source } from '../lib/source';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const LLMS_FILE_NAME = 'llms.txt';

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

// Frontmatter accessors. When this script runs under Next.js the fumadocs-mdx
// loader populates `page.data.title` etc., but under plain Bun the MDX loader
// is not active — `page.data.content` holds the raw file (including
// frontmatter), so parse it ourselves as a fallback.
function getFrontmatter(page: any): Record<string, unknown> {
  if (page.data?.title || page.data?.description) return page.data;
  const raw: string | undefined = page.data?.content;
  if (!raw) return page.data ?? {};
  try {
    return { ...page.data, ...matter(raw).data };
  } catch {
    return page.data ?? {};
  }
}

function shouldIncludePage(page: any): boolean {
  return getFrontmatter(page).llm !== false;
}

// Get all pages from source
function getAllPages(): PageMetadata[] {
  const sourcePages = source.getPages();

  return sourcePages
    .filter(shouldIncludePage)
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

      const frontmatter = getFrontmatter(page);

      // Build a disambiguated title: if the title is generic (e.g. "Overview",
      // "Quickstart"), prepend the parent section for clarity.
      const toTitleCase = (s: string) =>
        s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const dataTitle = (frontmatter as any)?.title as string | undefined;
      const rawTitle: string = dataTitle || toTitleCase(page.file.name);
      const GENERIC_TITLES = [
        'overview',
        'quickstart',
        'quickstart-py',
        'quickstart-ts',
        'index',
        'introduction',
        'getting-started',
        'integrations-overview',
      ];
      const isGeneric = GENERIC_TITLES.includes(rawTitle.toLowerCase().replace(/\s+/g, '-'));
      let title = rawTitle;
      if (isGeneric && section.length > 0) {
        const parent = toTitleCase(section[section.length - 1]);
        title = `${parent} ${toTitleCase(rawTitle)}`;
      }

      return {
        title,
        description: ((frontmatter as any)?.description as string | undefined) || '',
        url: page.url, // Keep original URL for file path generation
        cleanUrl: cleanUrl, // Add clean URL for content links
        section: section,
      };
    })
    .filter((page) => !page.url.includes('/changelog/') && !page.section.includes('changelog'))
    .sort((a, b) => a.url.localeCompare(b.url));
}

function formatPageUrl(cleanUrl: string): string {
  return `${config.productionUrl}${cleanUrl}`;
}

// Generate llms.txt content for a set of pages
function generateLLMsContent(
  pages: PageMetadata[],
  title: string,
  currentSection: string[] = [],
): string {
  const lines = [`# ${title}`, '', '## Pages', ''];

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

    // At root level, use a fixed order: overview first, changelog last
    if (currentSection.length === 0) {
      const ROOT_ORDER = ['overview', 'integrations', 'cookbook', 'changelog'];
      const ai = ROOT_ORDER.indexOf(a);
      const bi = ROOT_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
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
        const pageUrl = formatPageUrl(page.cleanUrl);
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
        const pageUrl = formatPageUrl(page.cleanUrl);
        lines.push(
          `- [${page.title}](${pageUrl})${page.description ? `: ${page.description}` : ''}`,
        );
      }
      lines.push('');
    } else {
      // Root level pages
      for (const page of sectionPages) {
        const pageUrl = formatPageUrl(page.cleanUrl);
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

async function cleanupGeneratedLLMsTxt(dir: string, removeEmptyDirs = false): Promise<boolean> {
  let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>;

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }

  let hasRemainingFiles = false;

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const childHasRemainingFiles = await cleanupGeneratedLLMsTxt(entryPath, true);
      hasRemainingFiles ||= childHasRemainingFiles;
      continue;
    }

    if (entry.isFile() && entry.name === LLMS_FILE_NAME) {
      await fs.unlink(entryPath);
      continue;
    }

    hasRemainingFiles = true;
  }

  if (removeEmptyDirs && !hasRemainingFiles) {
    await fs.rmdir(dir);
  }

  return hasRemainingFiles;
}

// Main generation function
async function generateAllLLMsTxt() {
  console.log('🚀 Starting documentation generation...');

  await ensureDir(PUBLIC_DIR);
  await cleanupGeneratedLLMsTxt(PUBLIC_DIR);

  const allPages = getAllPages();
  console.log(`📄 Found ${allPages.length} pages`);

  const rootContent = generateLLMsContent(allPages, 'Steel Documentation', []);
  const pageIndex = rootContent.replace(/^# Steel Documentation\n/, '');
  await fs.writeFile(path.join(PUBLIC_DIR, LLMS_FILE_NAME), AGENT_INSTRUCTIONS + pageIndex);
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
    await fs.writeFile(path.join(outputPath, LLMS_FILE_NAME), sectionContent);
  }
  console.log('✔️  Generated section llms.txt files');

  console.log('✅ All llms.txt files generated successfully!');
}

// Run the generation
generateAllLLMsTxt().catch(console.error);
