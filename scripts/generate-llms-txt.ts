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

const AGENT_INSTRUCTIONS = `# Steel Documentation

> Steel is a cloud browser API for AI agents and developers.
> Use Steel to launch cloud browsers, scrape content, and automate web tasks.

## Quick Reference

- Install: \`npm install steel-sdk\` (Node.js) or \`pip install steel-sdk\` (Python)
- CLI: \`curl -sSf https://setup.steel.dev | sh\`
- Auth header: \`steel-api-key: <your-key>\`
- Auth env var: \`STEEL_API_KEY\`
- API base URL: \`https://api.steel.dev\`
- WebSocket: \`wss://connect.steel.dev?apiKey=<key>&sessionId=<id>\`
- API reference: https://steel.apidocumentation.com/api-reference

## Agent Instructions

- For the simplest one-liner scrape, use the CLI:
  \`\`\`bash
  steel scrape https://example.com
  \`\`\`
- For simple scraping without a browser session, use the REST scrape endpoint:
  \`\`\`
  curl -X POST https://api.steel.dev/v1/scrape \\
    -H "steel-api-key: YOUR_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{"url": "https://example.com"}'
  \`\`\`
- For browser automation, connect Puppeteer or Playwright via WebSocket:
  \`\`\`js
  import Steel from 'steel-sdk';
  import puppeteer from 'puppeteer-core';

  const client = new Steel({ steelAPIKey: process.env.STEEL_API_KEY });
  const session = await client.sessions.create();
  const browser = await puppeteer.connect({
    browserWSEndpoint: \`wss://connect.steel.dev?apiKey=\${process.env.STEEL_API_KEY}&sessionId=\${session.id}\`,
  });
  // ... use browser ...
  await browser.close();
  await client.sessions.release(session.id);
  \`\`\`
- Python SDK:
  \`\`\`python
  from steel import Steel
  client = Steel(steel_api_key="YOUR_KEY")  # or set STEEL_API_KEY env var
  result = client.scrape(url="https://example.com")
  print(result.content.html)
  \`\`\`
- Always release sessions when done: \`client.sessions.release(sessionId)\`
- Do NOT use \`session.websocketUrl\` directly — construct the WSS URL as shown above
- The Node SDK constructor param is \`steelAPIKey\` (not \`apiKey\`)
- The Python SDK constructor param is \`steel_api_key\` (not \`api_key\`)
- Individual doc pages are available as markdown by appending \`.mdx\` to any URL

`;

// Main generation function
async function generateAllLLMsTxt() {
  console.log('🚀 Starting documentation generation...');

  const allPages = getAllPages();
  console.log(`📄 Found ${allPages.length} pages`);

  const rootContent = generateLLMsContent(allPages, 'Steel Documentation', []);
  const pageIndex = rootContent.replace(/^# Steel Documentation\n/, '');
  await fs.writeFile(path.join(PUBLIC_DIR, 'llms.txt'), AGENT_INSTRUCTIONS + pageIndex);
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
