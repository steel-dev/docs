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


# Writing Software

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