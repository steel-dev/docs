#!/usr/bin/env bun
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COOKBOOK_DIR = path.join(ROOT, 'external/cookbook');
const OUTPUT_DIR = path.join(ROOT, 'content/docs/cookbook');

interface Recipe {
  title: string;
  slug: string;
  path: string;
  description: string;
  date: string;
  authors: string[];
  tags: string[];
}

async function readRegistry(): Promise<Recipe[]> {
  const raw = await fs.readFile(path.join(COOKBOOK_DIR, 'registry.yaml'), 'utf8');
  const parsed = yaml.load(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('registry.yaml must be an array');
  }
  return parsed as Recipe[];
}

function yamlString(s: string): string {
  // Wrap in double quotes if it contains chars that would confuse YAML.
  if (/[:#'"\\]/.test(s)) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function buildFrontmatter(recipe: Recipe): string {
  return [
    '---',
    `title: ${yamlString(recipe.title)}`,
    `sidebarTitle: ${yamlString(recipe.title)}`,
    `description: ${yamlString(recipe.description)}`,
    '---',
  ].join('\n');
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

function rewriteSiblingLinks(body: string, slugs: Set<string>): string {
  // [text](../slug) or [text](../slug/) -> [text](/cookbook/slug)
  return body.replace(/\]\(\.\.\/([^\/)]+)(\/?[^)]*)\)/g, (match, sibling: string) => {
    return slugs.has(sibling) ? `](/cookbook/${sibling})` : match;
  });
}

async function syncRecipe(recipe: Recipe, slugs: Set<string>): Promise<void> {
  const readmePath = path.join(COOKBOOK_DIR, recipe.path, 'README.md');
  const raw = await fs.readFile(readmePath, 'utf8');
  let body = stripLeadingH1(raw);
  body = rewriteSiblingLinks(body, slugs);
  const mdx = `${buildFrontmatter(recipe)}\n\n${body.trim()}\n`;
  await fs.writeFile(path.join(OUTPUT_DIR, `${recipe.slug}.mdx`), mdx);
}

async function writeMeta(recipes: Recipe[]): Promise<void> {
  const meta = {
    title: 'Cookbook',
    root: true,
    pages: recipes.map((r) => r.slug),
  };
  await fs.writeFile(path.join(OUTPUT_DIR, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
}

async function cleanStaleMdx(recipes: Recipe[]): Promise<void> {
  const want = new Set(recipes.map((r) => `${r.slug}.mdx`));
  want.add('meta.json');
  const entries = await fs.readdir(OUTPUT_DIR);
  for (const entry of entries) {
    if (entry.endsWith('.mdx') && !want.has(entry)) {
      await fs.unlink(path.join(OUTPUT_DIR, entry));
      console.log(`  - removed stale ${entry}`);
    }
  }
}

async function main(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const recipes = await readRegistry();
  const slugs = new Set(recipes.map((r) => r.slug));
  console.log(`Syncing ${recipes.length} cookbook recipes...`);

  for (const recipe of recipes) {
    await syncRecipe(recipe, slugs);
    console.log(`  + ${recipe.slug}`);
  }

  await cleanStaleMdx(recipes);
  await writeMeta(recipes);

  const rel = path.relative(ROOT, OUTPUT_DIR);
  console.log(`Wrote ${recipes.length} recipes + meta.json to ${rel}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
