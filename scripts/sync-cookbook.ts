#!/usr/bin/env bun
// Syncs the cookbook repo into generated MDX pages.
//
// Default behaviour: resolve the latest SHA for the configured ref (bump the
// lockfile) then generate MDX. Pass --no-bump to skip the SHA resolution and
// use whatever is already in cookbook.lock.json.
//
// Pass --ref <name> to switch the tracked branch/tag.
// Set GITHUB_TOKEN to lift the unauthenticated rate limit.
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_FILE = path.join(ROOT, 'cookbook.lock.json');
const CACHE_ROOT = path.join(ROOT, '.cache/cookbook');
const OUTPUT_DIR = path.join(ROOT, 'content/docs/cookbook');
const TOPICS_DIR = path.join(OUTPUT_DIR, 'topics');

// Topics promoted to the sidebar "Topics" section. Every other topic still
// gets a /cookbook/topics/<slug> page but does not appear in the sidebar.
const CURATED_TOPICS: string[] = ['Browser automation', 'Agents', 'Computer use', 'Steel APIs'];

// Editorial blurb shown under the topic title on /cookbook/topics/<slug>
// pages. Topics missing here fall back to a generic count line.
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  'Browser automation':
    'Drive a cloud browser with familiar automation libraries: Playwright, Puppeteer, Selenium, Stagehand.',
  Agents: 'Agent frameworks that run a perception-plan-act loop against a Steel browser session.',
  'Computer use':
    'Model-native browser control where the LLM sees the screen and emits actions directly.',
  'Steel APIs':
    "Recipes for Steel's first-party APIs: credentials, auth contexts, profiles, extensions, files.",
  Playwright:
    'Recipes that use Playwright to drive a Steel session, either as the automation library itself or as transport for Steel APIs.',
  'Browser Use': 'Agent recipes built on the browser-use framework.',
  Authentication:
    'Patterns for persisting and replaying authenticated sessions across Steel browsers.',
  'Typed output':
    'Agents that return structured, schema-validated results instead of free-form text.',
  Captchas: "Recipes that handle CAPTCHA challenges using Steel's CAPTCHA API.",
  Mobile: "Recipes targeting Steel's mobile browser environment.",
  'Next.js': 'Recipes that integrate Steel into a Next.js application.',
};

// Display order for language tabs in merged concept pages. Entries not
// listed fall back to the end in insertion order.
const LANGUAGE_ORDER: string[] = ['TypeScript', 'Python', 'Next.js'];

interface CookbookLock {
  repo: string; // "owner/name" on GitHub
  ref: string; // human-readable branch/tag
  sha: string; // pinned commit SHA the docs site is built against
}

function parseArgs(argv: string[]): { ref?: string; noBump: boolean } {
  const out: { ref?: string; noBump: boolean } = { noBump: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--ref' && argv[i + 1]) {
      out.ref = argv[++i];
    } else if (argv[i] === '--no-bump') {
      out.noBump = true;
    }
  }
  return out;
}

async function readLock(): Promise<CookbookLock> {
  const raw = await fs.readFile(LOCK_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed?.repo || !parsed?.sha) {
    throw new Error(`${LOCK_FILE} must contain { repo, ref, sha }`);
  }
  return parsed as CookbookLock;
}

async function writeLock(lock: CookbookLock): Promise<void> {
  await fs.writeFile(LOCK_FILE, `${JSON.stringify(lock, null, 2)}\n`);
}

async function resolveSha(repo: string, ref: string): Promise<string> {
  const url = `https://api.github.com/repos/${repo}/commits/${ref}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to resolve ${repo}@${ref}: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { sha?: string };
  if (!data.sha) throw new Error(`No sha in response for ${repo}@${ref}`);
  return data.sha;
}

function cookbookGithubUrl(repo: string): string {
  return `https://github.com/${repo}`;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// Fetches the cookbook tarball at a pinned SHA into .cache/cookbook/<sha>.
// Cache hit is keyed on SHA, so re-running with the same lock is a no-op
// after the first fetch and `bun bump-cookbook` naturally invalidates the
// cache by writing a new SHA into the lockfile.
async function fetchCookbook(lock: CookbookLock): Promise<string> {
  const dest = path.join(CACHE_ROOT, lock.sha);
  if (await pathExists(path.join(dest, 'registry.yaml'))) return dest;

  await fs.rm(dest, { recursive: true, force: true });
  await fs.mkdir(dest, { recursive: true });

  const url = `https://codeload.github.com/${lock.repo}/tar.gz/${lock.sha}`;
  console.log(`Fetching ${lock.repo}@${lock.sha.slice(0, 12)}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const tarball = path.join(CACHE_ROOT, `${lock.sha}.tar.gz`);
  await Bun.write(tarball, await res.arrayBuffer());
  const proc = Bun.spawn(['tar', '-xz', '--strip-components=1', '-C', dest, '-f', tarball], {
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const code = await proc.exited;
  await fs.unlink(tarball).catch(() => {});
  if (code !== 0) throw new Error(`tar exited ${code}`);
  return dest;
}

interface Recipe {
  title: string;
  slug: string;
  path: string;
  description: string;
  authors: string[];
  language: string;
  topics: string[];
  created: string; // YYYY-MM-DD; publish date for this variant
  updated: string; // YYYY-MM-DD; last meaningful change to this variant
}

interface Concept {
  slug: string;
  title: string;
  description: string;
  entries: Recipe[];
}

interface AuthorEntry {
  name?: string;
  website?: string;
  avatar?: string;
}
type AuthorMap = Record<string, AuthorEntry>;

async function readRegistry(cookbookDir: string): Promise<Recipe[]> {
  const raw = await fs.readFile(path.join(cookbookDir, 'registry.yaml'), 'utf8');
  const parsed = yaml.load(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('registry.yaml must be an array');
  }
  return parsed as Recipe[];
}

async function readAuthors(cookbookDir: string): Promise<AuthorMap> {
  try {
    const raw = await fs.readFile(path.join(cookbookDir, 'authors.yaml'), 'utf8');
    return (yaml.load(raw) as AuthorMap) ?? {};
  } catch {
    return {};
  }
}

function yamlString(s: string): string {
  if (/[:#'"\\]/.test(s)) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function topicSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function variant(entry: Recipe): { label: string; id: string; rank: number } {
  const label = entry.language;
  const id = label.toLowerCase().replace(/\./g, '');
  const rank = LANGUAGE_ORDER.indexOf(label);
  return { label, id, rank: rank === -1 ? LANGUAGE_ORDER.length : rank };
}

function conceptTopics(concept: Concept): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const entry of concept.entries) {
    for (const topic of entry.topics ?? []) {
      if (!seen.has(topic)) {
        seen.add(topic);
        ordered.push(topic);
      }
    }
  }
  return ordered;
}

// Earliest first-commit date among a concept's variants. Shown on cards
// and used to sort every recipe grid (home, topic pages, related)
// "newest published first".
function conceptCreatedDate(concept: Concept): string {
  let earliest = '';
  for (const entry of concept.entries) {
    if (entry.created && (earliest === '' || entry.created < earliest)) {
      earliest = entry.created;
    }
  }
  return earliest;
}

// Sort a list of concepts by created date, newest first. Ties preserve
// registry order (stable sort).
function sortByCreatedDesc(concepts: Concept[]): Concept[] {
  return [...concepts].sort((a, b) => {
    const da = conceptCreatedDate(a);
    const db = conceptCreatedDate(b);
    if (da === db) return 0;
    return da < db ? 1 : -1;
  });
}

function groupConcepts(recipes: Recipe[]): Concept[] {
  const order: string[] = [];
  const map = new Map<string, Concept>();
  for (const entry of recipes) {
    if (!map.has(entry.slug)) {
      order.push(entry.slug);
      map.set(entry.slug, {
        slug: entry.slug,
        title: entry.title,
        description: entry.description,
        entries: [],
      });
    }
    map.get(entry.slug)!.entries.push(entry);
  }
  for (const concept of map.values()) {
    concept.entries.sort((a, b) => variant(a).rank - variant(b).rank);
  }
  return order.map((slug) => map.get(slug)!);
}

function stripLeadingH1(body: string): string {
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i < lines.length && lines[i].startsWith('# ')) {
    i++;
    while (i < lines.length && lines[i].trim() === '') i++;
    return lines.slice(i).join('\n');
  }
  return body;
}

function rewriteSiblingLinks(body: string, pathToSlug: Map<string, string>): string {
  return body.replace(/\]\(\.\.\/([^\/)]+)(\/?[^)]*)\)/g, (match, folder: string) => {
    const slug = pathToSlug.get(folder);
    return slug ? `](/cookbook/${slug})` : match;
  });
}

async function readRecipeBody(
  cookbookDir: string,
  recipe: Recipe,
  pathToSlug: Map<string, string>,
): Promise<string> {
  const raw = await fs.readFile(path.join(cookbookDir, recipe.path, 'README.md'), 'utf8');
  const stripped = stripLeadingH1(raw);
  return rewriteSiblingLinks(stripped, pathToSlug).trim();
}

function frontmatter(fields: Record<string, string>): string {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    lines.push(`${k}: ${yamlString(v)}`);
  }
  lines.push('---');
  return lines.join('\n');
}

function renderRecipeCard(concept: Concept): string {
  const topics = conceptTopics(concept);
  const topicsLiteral = `[${topics.map((t) => `'${t.replace(/'/g, "\\'")}'`).join(', ')}]`;
  const date = conceptCreatedDate(concept);
  const dateAttr = date ? ` date="${date}"` : '';
  return `<RecipeCard slug="${concept.slug}" title={${JSON.stringify(concept.title)}} description={${JSON.stringify(concept.description)}} topics={${topicsLiteral}}${dateAttr} />`;
}

function renderRecipeGrid(concepts: Concept[]): string {
  const cards = concepts.map(renderRecipeCard).join('\n');
  return `<RecipeGrid>\n${cards}\n</RecipeGrid>`;
}

function sourceUrl(recipe: Recipe, repo: string, sha: string): string {
  return `${cookbookGithubUrl(repo)}/tree/${sha}/${recipe.path}`;
}

// Author display metadata for a single handle. Avatar resolves to the
// explicit authors.yaml value if set, else falls back to the GitHub
// avatar endpoint which redirects to the handle's profile picture.
function authorMeta(
  handle: string,
  authors: AuthorMap,
): { handle: string; name: string; avatar: string } {
  const entry = authors[handle];
  const name = entry?.name?.trim() || handle;
  const avatar = entry?.avatar?.trim() || `https://github.com/${handle}.png?size=40`;
  return { handle, name, avatar };
}

function renderRecipeMeta(recipe: Recipe, repo: string, sha: string, authors: AuthorMap): string {
  const metas = (recipe.authors ?? []).map((h) => authorMeta(h, authors));
  const metasLiteral = `[${metas.map((m) => JSON.stringify(m)).join(', ')}]`;
  const dateAttr = recipe.updated ? ` updated="${recipe.updated}"` : '';
  return `<RecipeMeta href="${sourceUrl(recipe, repo, sha)}" path="${recipe.path}" authors={${metasLiteral}}${dateAttr} />`;
}

function renderTabs(
  concept: Concept,
  bodies: string[],
  repo: string,
  sha: string,
  authors: AuthorMap,
): string {
  // Fumadocs Tabs "simple mode": items drives the visible tab bar and Tab
  // children are matched by declaration order. Each Tab's `id` feeds URL
  // hash activation (#typescript, #python, ...). The cookbook-concept-*
  // class names strip Fumadocs' default card styling so the recipe content
  // flows with the rest of the page (see app/global.css). RecipeMeta at
  // the top of each tab carries the variant's GitHub link, author credit,
  // and entry date.
  const labels = concept.entries.map((e) => variant(e).label);
  const items = `[${labels.map((l) => `'${l}'`).join(', ')}]`;
  const tabs = concept.entries
    .map((entry, i) => {
      const v = variant(entry);
      const meta = renderRecipeMeta(entry, repo, sha, authors);
      return `<Tab id="${v.id}" className="cookbook-concept-tab">\n\n${meta}\n\n${bodies[i]}\n\n</Tab>`;
    })
    .join('\n\n');
  return `<Tabs items={${items}} groupId="lang" persist updateAnchor className="cookbook-concept-tabs">\n\n${tabs}\n\n</Tabs>`;
}

// Pick up to 3 related concepts by topic overlap. Break ties on most
// recently created recipe so newer entries surface first.
function relatedConcepts(concept: Concept, all: Concept[]): Concept[] {
  const myTopics = new Set(conceptTopics(concept));
  if (myTopics.size === 0) return [];
  const scored = all
    .filter((c) => c.slug !== concept.slug)
    .map((c) => {
      const overlap = conceptTopics(c).filter((t) => myTopics.has(t)).length;
      return { concept: c, overlap, date: conceptCreatedDate(c) };
    })
    .filter((s) => s.overlap > 0)
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      if (a.date === b.date) return 0;
      return a.date < b.date ? 1 : -1;
    });
  return scored.slice(0, 3).map((s) => s.concept);
}

async function emitConcept(
  cookbookDir: string,
  concept: Concept,
  pathToSlug: Map<string, string>,
  repo: string,
  sha: string,
  authors: AuthorMap,
  allConcepts: Concept[],
): Promise<void> {
  const bodies = await Promise.all(
    concept.entries.map((e) => readRecipeBody(cookbookDir, e, pathToSlug)),
  );
  let body: string;
  if (concept.entries.length === 1) {
    const meta = renderRecipeMeta(concept.entries[0], repo, sha, authors);
    body = `${meta}\n\n${bodies[0]}`;
  } else {
    body = renderTabs(concept, bodies, repo, sha, authors);
  }

  const related = relatedConcepts(concept, allConcepts);
  if (related.length > 0) {
    body += `\n\n## Related recipes\n\n${renderRecipeGrid(related)}`;
  }

  const fm = frontmatter({ title: concept.title, description: concept.description });
  await fs.writeFile(path.join(OUTPUT_DIR, `${concept.slug}.mdx`), `${fm}\n\n${body}\n`);
}

async function emitHome(concepts: Concept[]): Promise<void> {
  // Flat grid, newest published first. Topic grouping lives in the sidebar
  // (Topics section) and on /cookbook/topics/<slug> pages, not here. Wrap
  // in <RecipeSearch> so the body exposes a quick filter over the cookbook
  // without needing the global ⌘K dialog.
  const sorted = sortByCreatedDesc(concepts);
  const recipeData = sorted.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    topics: conceptTopics(c),
    date: conceptCreatedDate(c),
  }));
  const recipesLiteral = JSON.stringify(recipeData, null, 2);
  const fm = frontmatter({
    title: 'Cookbook',
    sidebarTitle: 'Home',
    description: 'Runnable recipes for using Steel with your favorite libraries and frameworks.',
  });
  const body = `<RecipeSearch recipes={${recipesLiteral}} />`;
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.mdx'), `${fm}\n\n${body}\n`);
}

async function emitTopicPage(topic: string, concepts: Concept[]): Promise<void> {
  const matching = sortByCreatedDesc(concepts.filter((c) => conceptTopics(c).includes(topic)));
  const slug = topicSlug(topic);
  const count = matching.length;
  const description =
    TOPIC_DESCRIPTIONS[topic] ?? `${count} recipe${count === 1 ? '' : 's'} tagged ${topic}.`;
  const fm = frontmatter({ title: topic, description });
  const body = renderRecipeGrid(matching);
  await fs.writeFile(path.join(TOPICS_DIR, `${slug}.mdx`), `${fm}\n\n${body}\n`);
}

async function writeMainMeta(repo: string): Promise<void> {
  // Sidebar: Home, separator, curated Topics (as topic pages), separator,
  // external GitHub link. Recipe pages and non-curated topic pages exist
  // but aren't surfaced in the sidebar (reachable via cards and
  // /cookbook/topics/* directly).
  const meta = {
    title: 'Cookbook',
    root: true,
    pages: [
      'index',
      '---Topics---',
      ...CURATED_TOPICS.map((t) => `topics/${topicSlug(t)}`),
      '---Contribute---',
      `[Cookbook on GitHub](${cookbookGithubUrl(repo)})`,
    ],
  };
  await fs.writeFile(path.join(OUTPUT_DIR, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
}

async function writeTopicsMeta(topics: string[]): Promise<void> {
  const meta = {
    title: 'Topics',
    pages: topics.map(topicSlug).sort(),
  };
  await fs.writeFile(path.join(TOPICS_DIR, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
}

async function cleanStaleMdx(concepts: Concept[], topicSlugs: string[]): Promise<void> {
  const rootWant = new Set<string>(['index.mdx', 'meta.json']);
  for (const c of concepts) rootWant.add(`${c.slug}.mdx`);
  const rootEntries = await fs.readdir(OUTPUT_DIR);
  for (const entry of rootEntries) {
    if (entry.endsWith('.mdx') && !rootWant.has(entry)) {
      await fs.unlink(path.join(OUTPUT_DIR, entry));
      console.log(`  - removed stale ${entry}`);
    }
  }

  const topicWant = new Set<string>(['meta.json']);
  for (const slug of topicSlugs) topicWant.add(`${slug}.mdx`);
  try {
    const topicEntries = await fs.readdir(TOPICS_DIR);
    for (const entry of topicEntries) {
      if (entry.endsWith('.mdx') && !topicWant.has(entry)) {
        await fs.unlink(path.join(TOPICS_DIR, entry));
        console.log(`  - removed stale topics/${entry}`);
      }
    }
  } catch {
    // topics/ may not exist on first run
  }

  // Remove legacy tags/ dir if it exists from an earlier iteration.
  try {
    const legacyDir = path.join(OUTPUT_DIR, 'tags');
    const legacy = await fs.readdir(legacyDir);
    for (const entry of legacy) {
      await fs.unlink(path.join(legacyDir, entry));
    }
    await fs.rmdir(legacyDir);
    console.log('  - removed legacy tags/ directory');
  } catch {
    // legacy dir already gone
  }
}

async function main(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(TOPICS_DIR, { recursive: true });

  const args = parseArgs(process.argv.slice(2));
  const lock = await readLock();

  if (!args.noBump) {
    const ref = args.ref ?? lock.ref;
    const sha = await resolveSha(lock.repo, ref);
    if (sha === lock.sha && ref === lock.ref) {
      console.log(`Already at ${sha.slice(0, 12)} (${lock.repo}@${ref}).`);
    } else {
      console.log(
        `Bumping ${lock.repo}: ${lock.sha.slice(0, 12)} (${lock.ref}) → ${sha.slice(0, 12)} (${ref})`,
      );
      lock.ref = ref;
      lock.sha = sha;
      await writeLock(lock);
    }
  }

  const cookbookDir = await fetchCookbook(lock);

  const recipes = await readRegistry(cookbookDir);
  const concepts = groupConcepts(recipes);

  const pathToSlug = new Map<string, string>();
  for (const recipe of recipes) {
    pathToSlug.set(path.basename(recipe.path), recipe.slug);
  }

  const seen = new Set<string>();
  const allTopics: string[] = [];
  for (const r of recipes) {
    for (const t of r.topics ?? []) {
      if (!seen.has(t)) {
        seen.add(t);
        allTopics.push(t);
      }
    }
  }

  const authors = await readAuthors(cookbookDir);
  console.log(
    `Syncing ${concepts.length} concepts, ${allTopics.length} topics from ${lock.repo}@${lock.sha.slice(0, 12)} (${lock.ref})...`,
  );

  for (const concept of concepts) {
    await emitConcept(cookbookDir, concept, pathToSlug, lock.repo, lock.sha, authors, concepts);
    const variants = concept.entries.length > 1 ? ` (${concept.entries.length} variants)` : '';
    console.log(`  + ${concept.slug}${variants}`);
  }

  await emitHome(concepts);
  console.log('  + index (Home)');

  for (const topic of allTopics) {
    await emitTopicPage(topic, concepts);
    const inSidebar = CURATED_TOPICS.includes(topic) ? ' (sidebar)' : '';
    console.log(`  + topics/${topicSlug(topic)}${inSidebar}`);
  }

  await cleanStaleMdx(concepts, allTopics.map(topicSlug));
  await writeMainMeta(lock.repo);
  await writeTopicsMeta(allTopics);

  const rel = path.relative(ROOT, OUTPUT_DIR);
  console.log(
    `Wrote ${concepts.length} concepts + Home + ${allTopics.length} topic pages to ${rel}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
