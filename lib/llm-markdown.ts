// ABOUTME: Fence-aware string transforms that strip MDX noise (frontmatter, CodeHike
// ABOUTME: fence flags, directive fences, JSX components) from LLM-served markdown.
import matter from 'gray-matter';

const FENCE_RE = /^(\s*)(`{3,}|~{3,})(.*)$/;

interface Fence {
  char: string;
  length: number;
}

interface FenceLine {
  indent: string;
  marker: string;
  info: string;
}

function parseFenceLine(line: string): FenceLine | null {
  const match = line.match(FENCE_RE);
  if (!match) return null;
  return { indent: match[1], marker: match[2], info: match[3].trim() };
}

function closesFence(line: string, fence: Fence): boolean {
  const parsed = parseFenceLine(line);
  return (
    parsed !== null &&
    parsed.marker[0] === fence.char &&
    parsed.marker.length >= fence.length &&
    parsed.info === ''
  );
}

function toFence(parsed: FenceLine): Fence {
  return { char: parsed.marker[0], length: parsed.marker.length };
}

export function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content;

  try {
    return matter(content).content.trimStart();
  } catch {
    return content;
  }
}

// ESM module-level statements (import/export) are MDX build plumbing with no
// markdown meaning. Require a quoted module specifier on imports so Python's
// `import os` (which lives inside code fences anyway) is never matched.
const ESM_IMPORT_RE = /^\s*import\b.*['"].+['"]\s*;?\s*$/;
const ESM_EXPORT_RE = /^\s*export\s+(default\b|const\b|let\b|var\b|function\b|class\b|async\b|\{)/;

export function stripModuleStatements(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let fence: Fence | null = null;

  for (const line of lines) {
    if (fence) {
      out.push(line);
      if (closesFence(line, fence)) fence = null;
      continue;
    }
    const parsedFence = parseFenceLine(line);
    if (parsedFence) {
      fence = toFence(parsedFence);
      out.push(line);
      continue;
    }
    if (ESM_IMPORT_RE.test(line) || ESM_EXPORT_RE.test(line)) continue;
    out.push(line);
  }
  return out.join('\n');
}

// Media elements carry no textual value for an agent; drop them whole. All
// occurrences in the corpus are single-line self-contained tags.
const MEDIA_OPEN_RE = /^\s*<(video|audio)\b/;
const MEDIA_CLOSE_RE = /^\s*<\/(video|audio)\b/;

export function stripMediaElements(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let fence: Fence | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      out.push(line);
      if (closesFence(line, fence)) fence = null;
      continue;
    }
    const parsedFence = parseFenceLine(line);
    if (parsedFence) {
      fence = toFence(parsedFence);
      out.push(line);
      continue;
    }
    if (MEDIA_CLOSE_RE.test(line)) continue;
    if (MEDIA_OPEN_RE.test(line)) {
      // Single-line complete tag is the common case; otherwise consume to the closer.
      const name = line.match(MEDIA_OPEN_RE)?.[1] ?? 'video';
      if (line.includes(`</${name}`) || line.includes('/>')) continue;
      while (
        i + 1 < lines.length &&
        !MEDIA_CLOSE_RE.test(lines[i + 1]) &&
        !parseFenceLine(lines[i + 1])
      )
        i++;
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

export function cleanCodeFences(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let fence: Fence | null = null;
  let prefixPackageInstall = false;

  for (const line of lines) {
    if (fence) {
      if (closesFence(line, fence)) {
        fence = null;
        prefixPackageInstall = false;
        out.push(line);
      } else if (prefixPackageInstall && line.trim() !== '') {
        out.push(`npm install ${line.trim()}`);
      } else {
        out.push(line);
      }
      continue;
    }

    const parsed = parseFenceLine(line);
    if (!parsed) {
      out.push(line);
      continue;
    }

    fence = toFence(parsed);
    if (parsed.info === '') {
      out.push(line);
      continue;
    }

    // CodeHike info strings carry titles and flags ("typescript Typescript -wcn
    // -f main.ts"); only the leading language token is meaningful to a reader.
    const token = parsed.info.split(/\s+/)[0];
    if (token === 'package-install') {
      prefixPackageInstall = true;
      out.push(`${parsed.indent}${parsed.marker}bash`);
    } else {
      out.push(`${parsed.indent}${parsed.marker}${token}`);
    }
  }

  return out.join('\n');
}

const DIRECTIVE_OPEN_RE = /^\s*(:{3,})([a-z][a-z-]*)\s*$/;
const DIRECTIVE_CLOSE_RE = /^\s*(:{3,})\s*$/;
const CALLOUT_TYPE_RE = /^type:\s*(tip|info|warn|help)$/;

const DIRECTIVE_LABELS: Record<string, string> = {
  objectives: "**What you'll learn:**",
  prerequisites: '**Prerequisites:**',
  'next-steps': '**Next steps:**',
};

interface DirectiveFrame {
  colons: number;
  awaitingCalloutType: boolean;
}

export function stripDirectiveFences(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  const stack: DirectiveFrame[] = [];
  let fence: Fence | null = null;

  for (const line of lines) {
    if (fence) {
      out.push(line);
      if (closesFence(line, fence)) fence = null;
      continue;
    }

    const parsedFence = parseFenceLine(line);
    if (parsedFence) {
      fence = toFence(parsedFence);
      out.push(line);
      continue;
    }

    const open = line.match(DIRECTIVE_OPEN_RE);
    if (open) {
      const name = open[2];
      stack.push({ colons: open[1].length, awaitingCalloutType: name === 'callout' });
      const label = DIRECTIVE_LABELS[name];
      if (label) out.push(label);
      continue;
    }

    const close = line.match(DIRECTIVE_CLOSE_RE);
    if (close) {
      const top = stack[stack.length - 1];
      if (top && close[1].length >= top.colons) {
        stack.pop();
        continue;
      }
      out.push(line); // stray closer with no open fence: fail open
      continue;
    }

    const top = stack[stack.length - 1];
    if (top?.awaitingCalloutType) {
      if (line.trim() === '') {
        out.push(line);
        continue;
      }
      top.awaitingCalloutType = false;
      if (CALLOUT_TYPE_RE.test(line.trim())) continue;
    }

    out.push(line);
  }

  return out.join('\n');
}

const JSX_CLOSE_RE = /^\s*<\/[A-Z][A-Za-z0-9]*>\s*$/;
const JSX_OPEN_START_RE = /^\s*<([A-Z][A-Za-z0-9]*)(\s|\/?>|$)/;
const TAG_END_RE = />\s*$/;

const DROP_COMPONENTS = new Set([
  'AuthorProfile',
  'Image',
  'IntegrationGrid',
  'RecipeJsonLd',
  'RecipeMeta',
  'RecipeQuickstart',
  'RecipeSearch',
  'SkillGrid',
]);

const TAB_LABELS: Record<string, string> = {
  go: 'Go',
  python: 'Python',
  rust: 'Rust',
  typescript: 'TypeScript',
};

function extractAttr(tag: string, name: string): string | null {
  const quoted = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`));
  if (quoted) return quoted[1];

  const braced = tag.match(new RegExp(`${name}\\s*=\\s*\\{\\s*("(?:[^"\\\\]|\\\\.)*")\\s*\\}`));
  if (braced) {
    try {
      return JSON.parse(braced[1]);
    } catch {
      return null;
    }
  }

  return null;
}

function renderLinkLine(title: string, href: string, description: string | null): string {
  return description ? `- [${title}](${href}): ${description}` : `- [${title}](${href})`;
}

// Card-like components become markdown links so component-only pages (cookbook
// topic and author hubs) keep their content; layout wrappers unwrap to nothing.
function renderComponent(name: string, tag: string): string[] {
  if (DROP_COMPONENTS.has(name)) return [];

  if (name === 'RecipeCard') {
    const slug = extractAttr(tag, 'slug');
    const title = extractAttr(tag, 'title');
    if (!slug || !title) return [];
    return [renderLinkLine(title, `/cookbook/${slug}`, extractAttr(tag, 'description'))];
  }

  if (name === 'Card') {
    const title = extractAttr(tag, 'title');
    const href = extractAttr(tag, 'href');
    if (!title || !href) return [];
    return [renderLinkLine(title, href, extractAttr(tag, 'description'))];
  }

  if (name === 'Tab') {
    const id = extractAttr(tag, 'id');
    if (!id) return [];
    const label = TAB_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
    return ['', `**${label}**`, ''];
  }

  return [];
}

export function stripJsxComponents(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let fence: Fence | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (fence) {
      out.push(line);
      if (closesFence(line, fence)) fence = null;
      continue;
    }

    const parsedFence = parseFenceLine(line);
    if (parsedFence) {
      fence = toFence(parsedFence);
      out.push(line);
      continue;
    }

    if (JSX_CLOSE_RE.test(line)) continue;

    const open = line.match(JSX_OPEN_START_RE);
    if (!open) {
      out.push(stripInlineSpans(line));
      continue;
    }

    // Consume a tag that may span lines (e.g. <RecipeSearch recipes={[...JSON...]} />);
    // attribute lines never end with ">", so the first line that does closes the tag.
    let end = i;
    let complete = TAG_END_RE.test(lines[end]);
    while (!complete) {
      const next = end + 1;
      if (next >= lines.length || parseFenceLine(lines[next])) break;
      end = next;
      complete = TAG_END_RE.test(lines[end]);
    }

    if (!complete) {
      out.push(line); // fail open; later lines are processed normally
      continue;
    }

    out.push(...renderComponent(open[1], lines.slice(i, end + 1).join(' ')));
    i = end;
  }

  return out.join('\n');
}

// Single-line inline span wrappers are purely stylistic (e.g. bolding "#help").
// Convert font-bold spans to markdown bold and strip other inline spans to text.
const INLINE_SPAN_RE = /<span\b([^>]*)>([^<]*)<\/span>/g;

export function stripInlineSpans(line: string): string {
  return line.replace(INLINE_SPAN_RE, (match, attrs: string, content: string) => {
    return /font-bold|font-semibold|font-medium/.test(attrs) ? `**${content}**` : content;
  });
}

export function collapseBlankLines(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let fence: Fence | null = null;
  let blankRun = 0;

  for (const line of lines) {
    if (fence) {
      out.push(line);
      if (closesFence(line, fence)) fence = null;
      continue;
    }

    const parsedFence = parseFenceLine(line);
    if (parsedFence) {
      fence = toFence(parsedFence);
      blankRun = 0;
      out.push(line);
      continue;
    }

    if (line.trim() === '') {
      blankRun++;
      if (blankRun > 1) continue;
      out.push(line);
      continue;
    }

    blankRun = 0;
    out.push(line);
  }

  return out.join('\n');
}

export function cleanMdxForLLM(content: string): string {
  return collapseBlankLines(
    stripMediaElements(
      stripJsxComponents(
        stripDirectiveFences(cleanCodeFences(stripModuleStatements(stripFrontmatter(content)))),
      ),
    ),
  );
}
