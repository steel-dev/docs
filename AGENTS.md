# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js + TypeScript docs site.

- `app/`: App Router pages, layouts, route handlers (`page.tsx`, `layout.tsx`, `route.ts`).
- `components/`: Reusable UI and MDX-facing components.
- `content/docs/`: Documentation source (`.mdx`) and section navigation via `meta.json`.
- `lib/`, `hooks/`, `contexts/`, `providers/`, `utils/`: shared logic and state helpers.
- `scripts/`: content generation utilities (OpenAPI markdown and `llms.txt` generation).
- `public/images/`: static assets referenced by docs.

## Build, Test, and Development Commands
Use Bun for all workflows.

- `bun install --frozen-lockfile`: install dependencies consistently.
- `bun run dev`: run local docs site on `http://localhost:3030`.
- `bun run build`: generate docs artifacts, then run production Next.js build.
- `bun run start`: serve the production build.
- `bun run lint` or `bun run check`: run Biome checks across app/content/script directories.
- `bun run lint:fix` or `bun run check:fix`: auto-apply Biome fixes.
- `bun run format`: format code/content with Biome.
- `bun run validate-links`: run link validation (`lint.ts`).
- `bun run generate-llms` / `bun run generate-openapi`: regenerate derived documentation files.

## Coding Style & Naming Conventions
- TypeScript is `strict` (`tsconfig.json`); prefer explicit types for public helpers.
- Formatting/linting is enforced by Biome (`biome.json`):
  - 2-space indentation, LF endings, 100-char line width
  - single quotes in JS/TS, double quotes in JSX
  - semicolons and trailing commas enabled
- Follow existing file patterns: Next.js convention files in `app/`, kebab-case doc filenames in `content/docs/`.
- Use the `@/*` path alias for internal imports where it improves clarity.

## Testing Guidelines
There is no dedicated unit-test framework configured in this repo today. Treat these as required quality gates:

1. `bun run check`
2. `bun run validate-links`
3. `bun run build` for changes that affect routing, generation, or site rendering

## Commit & Pull Request Guidelines
History follows Conventional Commit style: `feat:`, `fix:`, `chore:`, `ci:` (example: `fix: typo on docs page`).

- Keep commit subjects short, imperative, and scoped.
- In PRs, include:
  - what changed and why
  - impacted paths (for example `content/docs/overview/*`)
  - screenshots/GIFs for UI or layout updates
  - linked issue/PR context when applicable

## Security & Configuration Tips
- Start from `.env-example`; never commit secrets.
- Set `LLMS_BASE_URL` when generating `llms.txt` in non-default environments.
