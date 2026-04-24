# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Steel Docs is the documentation site for Steel.dev, built with [Fumadocs](https://fumadocs.vercel.app/) and Next.js 15. It uses CodeHike for enhanced code blocks and custom remark plugins for MDX processing.

## Commands

```bash
# Development
bun install          # Install dependencies
bun run dev          # Start dev server on port 3030 (uses Turbopack)

# Building
bun run generate     # Generate OpenAPI specs and llms.txt (required before build)
bun run build        # Full production build

# Linting/Formatting (uses Biome)
bun run lint         # Check for lint issues
bun run lint:fix     # Fix lint issues
bun run format       # Format code
bun run check        # Run all Biome checks
bun run check:fix    # Fix all Biome issues

# Validation
bun run validate-links  # Validate documentation links
```

## Architecture

### Content System
- **MDX content**: `content/docs/` - organized by section (overview, cookbook, integrations, changelog)
- **Source config**: `source.config.ts` - defines frontmatter schema and MDX plugins
- **Source loader**: `lib/source.ts` - processes pages, handles "new" badges, OpenAPI integration

### Key Frontmatter Fields
```yaml
title: Page title
sidebarTitle: Shorter sidebar title
description: Page description
isNew: true           # Show "NEW" badge
isLink: true          # External link indicator
isSeperator: true     # Visual separator in sidebar
llm: true             # Include in llms.txt
publishedAt: "2025-01-01"  # Auto-calculate "new" badge
```

### MDX Processing Pipeline
1. `remarkCodeHike` - Code block enhancements
2. `remarkDirective` - Custom directive syntax (:::callout, :::objectives, etc.)
3. `remarkCustomDirectives` - Transforms directives to components
4. `remarkFormatCode` - Code formatting

### Custom Components
Components live in `components/` with these key categories:
- `docskit/` - CodeHike code components (DocsKitCode, DocsKitInlineCode)
- `layout/` - Page layout components
- `ui/` - Radix-based UI primitives

### API Routes
- `/api/search` - Full-text search
- `/api/feedback` - User feedback collection
- `/api/openapi-markdown/[...slug]` - OpenAPI spec rendering
- `/llms.mdx/[[...slug]]` - LLM-friendly content serving

## Documentation Writing Guidelines

Follow the content rhythm pattern: Paragraph -> Code Example -> Paragraph -> List/Table -> Code

- **60% code, 40% text** - Show, don't just tell
- **Never put two paragraphs in a row** - Break with code/lists/tables
- **Every concept needs a code example**

### Available Directives
```mdx
:::callout
type: tip|info|warn|help
### Optional Title
Content here
:::

:::objectives
- Learning objectives
:::

:::prerequisites
- Required knowledge
:::

:::next-steps
- [Next Guide](/path): Description
:::
```

### Code Block Flags
- `-n` line numbers
- `-c` copy button
- `-w` word wrap
- `-a` animate
- `-f <file-name>` file name display


# Coding

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.