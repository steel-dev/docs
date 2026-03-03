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
