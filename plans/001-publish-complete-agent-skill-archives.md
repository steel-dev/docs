# Plan 001: Publish complete, reliable Agent Skill archives

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report—do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b4d2ff07..HEAD -- scripts/generate-agent-skills-index.ts tests/agent-skills-index.test.ts .env-example next.config.mjs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. Treat a
> mismatch in the named symbols or header rules as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b4d2ff07`, 2026-07-30
- **Execution status**: DONE — implementation and local verification complete

## Why this matters

The discovery index currently advertises each upstream skill as one `SKILL.md`
file even though every published skill has supporting files. Installing the
advertised artifact therefore leaves relative links to references, scripts, or
templates unresolved. The generator also publishes manifest blurbs instead of
the discovery-oriented frontmatter descriptions and turns every generation
failure into a successful build with no index.

This plan packages each complete skill directory into a deterministic `.tar.gz`,
derives discovery metadata from `SKILL.md`, keeps the single-commit snapshot
property, and makes generation failure stop the deploy. The Agent Skills
Discovery RFC requires archive distribution for skills with supporting files,
root-level `SKILL.md`, SHA-256 over the archive bytes, and
`application/gzip` for `.tar.gz` artifacts:
<https://github.com/cloudflare/agent-skills-discovery-rfc>.

## Current state

- `scripts/generate-agent-skills-index.ts` resolves upstream `main`, reads
  `manifest.json`, fetches only each `SKILL.md`, and writes the generated index.
- `tests/agent-skills-index.test.ts` exercises only the current pure index
  builder. It has no archive, frontmatter-source, or failure-boundary coverage.
- `.env-example` does not mention the already-supported `GITHUB_TOKEN`.
- `next.config.mjs` has no explicit archive media-type rule.
- `.gitignore:26` already ignores `public/.well-known/agent-skills/`; keep that
  generated-output policy unchanged.
- `gray-matter` is already a direct dependency. Bun 1.3.9 exposes
  `Bun.Archive`, which can read the GitHub tarball and create deterministic
  gzip-compressed tar archives, so no package or lockfile change is needed.

Current artifact shape in `scripts/generate-agent-skills-index.ts:19-24`:

```ts
export type SkillArtifact = {
  name: string;
  path: string;
  description: string;
  content: Buffer;
};
```

Current validation and emitted entry in
`scripts/generate-agent-skills-index.ts:16,38-66`:

```ts
const NAME_PATTERN = /^[a-z0-9-]{1,64}$/;

return {
  name: artifact.name,
  type: 'skill-md' as const,
  description: artifact.description,
  url: `https://raw.githubusercontent.com/${SKILLS_REPO}/${commit}/${artifact.path}/SKILL.md`,
  digest: `sha256:${createHash('sha256').update(artifact.content).digest('hex')}`,
};
```

Current metadata source in `scripts/generate-agent-skills-index.ts:100-115`:

```ts
type Manifest = {
  skills: Record<string, { description: string; path: string }>;
};

return Promise.all(
  Object.entries(manifest.skills).map(async ([name, skill]) => ({
    name,
    path: skill.path,
    description: skill.description,
    content: await fetchRaw(commit, `${skill.path}/SKILL.md`),
  })),
);
```

Current failure boundary in `scripts/generate-agent-skills-index.ts:129-136`:

```ts
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.warn(`⚠️ Skipped the Agent Skills index: ${(error as Error).message}`);
  }
}
```

The five skills in the pinned snapshot all contain supporting regular files.
Two contain scripts, and `steel-skill-creator` also contains templates. Do not
special-case today's file counts; archive every regular file below each
manifest path.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Targeted tests | `bun test tests/agent-skills-index.test.ts` | all tests pass |
| Typecheck | `bun run typecheck` | exit 0, no errors |
| Lint/format check | `bun run check` | exit 0, no warnings |
| Link validation | `bun run validate-links` | exit 0 |
| Generate artifacts | `bun run generate-agent-skills` | exit 0 and reports a pinned commit |
| Production build | `bun run build` | exit 0 |
| Diff hygiene | `git diff --check` | no output |

## Suggested executor toolkit

- Read the `Bun.Archive` API documentation before changing the generator:
  <https://bun.com/docs/runtime/archive>.
- Use the Agent Skills Discovery RFC's "Archive Structure", "Integrity and
  Verification", and "HTTP Considerations" sections as the contract:
  <https://github.com/cloudflare/agent-skills-discovery-rfc>.

## Scope

**In scope** (the only tracked files to modify):

- `scripts/generate-agent-skills-index.ts`
- `tests/agent-skills-index.test.ts`
- `.env-example`
- `next.config.mjs`
- `lib/markdown-negotiation.ts`
- `tests/markdown-negotiation.test.ts`

The ignored directory `public/.well-known/agent-skills/` is expected to be
created during verification. Do not force-add it.

**Operational recommendation**:

- Configure a read-only `GITHUB_TOKEN` in the Vercel Production and Preview
  environments to avoid shared-IP rate limits. The fail-closed generator keeps
  deploys safe without it. Never put the value in a file, command transcript,
  test fixture, plan, or PR description.

**Out of scope**:

- `steel-dev/skills`, its `manifest.json`, or any upstream skill content
- The discovery schema version
- `.gitignore` or the generated-file policy
- `package.json` and `bun.lock`
- General CORS configuration
- Uploading archives to a separate release or object store
- Caching-policy redesign

## Git workflow

- Branch: `fix/agent-skills-archives`
- Use one logical Conventional Commit, for example:
  `fix(skills): publish complete skill archives`
- Do not force-add generated archives.
- Do not push, configure Vercel, or open a PR unless the operator authorized
  those external changes.

## Steps

### Step 1: Write the archive and metadata regression tests

Update `tests/agent-skills-index.test.ts` before changing production code.
Build a synthetic GitHub repository tarball in memory with `Bun.Archive`.
It must contain one wrapper directory, a `manifest.json`, and at least one
skill directory with:

- root `SKILL.md`;
- a `references/*.md` file;
- a `scripts/*` file;
- a manifest description deliberately different from the `SKILL.md`
  frontmatter description.

Add tests that require the future exported converter and builder to:

1. take the description from parsed `SKILL.md` frontmatter;
2. emit an archive containing `SKILL.md`, `references/...`, and `scripts/...`
   at archive root, with no repository or skill-directory wrapper;
3. produce identical archive bytes for the same sorted input on two runs;
4. emit `type: "archive"`, a same-origin
   `/.well-known/agent-skills/<name>.tar.gz` URL, and a SHA-256 digest of the
   exact archive bytes;
5. reject `-steel`, `steel-`, `steel--browser`, uppercase, spaces, and a
   65-character name while accepting one-character and valid 64-character
   names;
6. reject a missing or ambiguous root manifest, an empty manifest skill map,
   a missing root `SKILL.md`, a non-string/blank/overlong description, and a
   frontmatter name that differs from the manifest key.

Use `new Bun.Archive(bytes).files()` to inspect archive entries. Normalize
entry names before assertions, but do not weaken the root-layout requirement.

**Verify**: `bun test tests/agent-skills-index.test.ts` → the new tests fail
against the current implementation for the expected missing exports and
`skill-md` behavior; existing tests still execute.

### Step 2: Fetch one commit-pinned repository snapshot

Refactor `scripts/generate-agent-skills-index.ts` so network reads follow this
sequence:

1. Resolve `steel-dev/skills@main` once through the existing GitHub commits API.
2. Validate the returned SHA as exactly 40 lowercase hexadecimal characters.
3. Download one archive from
   `https://codeload.github.com/steel-dev/skills/tar.gz/<sha>`.
4. Read that response with `new Bun.Archive(bytes).files()`.

Retain conditional `Authorization: Bearer ...` support and add the standard
GitHub API version header. On a 401, 403, or rate-limit response, throw an
actionable error containing the status and safe rate-limit reset information
from response headers. Do not log the token or response body.

Locate exactly one `<wrapper>/manifest.json` in the repository archive. Reject
missing or ambiguous candidates. Parse a manifest type whose skill records
only require `path`; do not read `description` from the manifest.

This one downloaded archive is the source for the manifest and all skill
files, preserving the current single-commit snapshot property without many
independent raw-file requests.

**Verify**: `bun run typecheck` → exit 0 with no `Bun.Archive`, manifest, or
fetch type errors.

### Step 3: Convert complete skill directories into deterministic archives

Add and export a pure, testable converter such as
`buildSkillArtifactsFromRepositoryArchive(repositoryBytes)`.

For every `[manifestName, { path }]`:

1. Normalize the manifest path and prove it is relative, contains no `..`,
   and stays below the repository wrapper.
2. Collect every regular file below that path from the repository archive.
   Sort by root-relative POSIX path.
3. Strip the repository wrapper and skill-directory prefix from every entry.
4. Require `SKILL.md` at the resulting archive root.
5. Parse `SKILL.md` with the existing `gray-matter` dependency.
6. Require string `name` and `description` fields, require the description to
   be nonblank, and require frontmatter `name === manifestName`.
7. Create the artifact bytes with:

   ```ts
   new Bun.Archive(sortedRootRelativeFiles, {
     compress: 'gzip',
     level: 9,
   })
   ```

   Convert the result to a `Buffer` before hashing or writing.

`SkillArtifact` should now hold `name`, frontmatter `description`, and archive
`content`. It no longer needs an upstream `path`. Do not include the upstream
wrapper, manifest, other skills, or repository-level files in a skill archive.

`Bun.Archive` normalizes filesystem metadata. That is acceptable for the
current upstream tree because its skill content is regular mode-0644 files.
Do not silently omit or normalize a future symlink, hard link, or required
executable bit; that is a STOP condition.

**Verify**: `bun test tests/agent-skills-index.test.ts` → archive-layout,
frontmatter, deterministic-byte, and malformed-input tests pass.

### Step 4: Emit archive entries and enforce the full name grammar

Change `buildAgentSkillsIndex` to accept the completed artifacts without a
commit argument and emit:

```ts
{
  name: artifact.name,
  type: 'archive',
  description: artifact.description,
  url: `/.well-known/agent-skills/${artifact.name}.tar.gz`,
  digest: `sha256:${sha256OfExactArchiveBytes}`,
}
```

Replace the permissive regex with:

```ts
/^[a-z0-9]+(?:-[a-z0-9]+)*$/
```

Enforce the 1–64 character bound separately so the error remains clear.
Keep the 1024-character description limit and add a nonblank check. The digest
must cover the bytes written to the URL, not `SKILL.md` or uncompressed files.

**Verify**: `bun test tests/agent-skills-index.test.ts` → all old, updated, and
new builder tests pass.

### Step 5: Publish only complete output and fail the build on every error

Change `main` so it resolves, downloads, validates, packages, and builds the
entire index before touching `public/.well-known/agent-skills/`.

After all in-memory work succeeds:

1. remove only the exact generated output directory;
2. recreate it;
3. write every `<name>.tar.gz`;
4. write `index.json` last.

This removes artifacts for skills deleted upstream. A filesystem error may
leave a partial local directory, but it must also fail the build, so that
directory cannot be deployed.

Replace the warning/swallow wrapper with uncaught top-level execution:

```ts
if (import.meta.main) {
  await main();
}
```

The existing `bun run generate && next build` chain then stops before Next.js
when generation fails, leaving the previously successful production deployment
live instead of shipping a 404.

**Verify**:

```sh
if GITHUB_TOKEN=invalid-for-failure-test bun run generate-agent-skills; then
  exit 1
fi
```

Expected: the generator prints a safe authentication/status error, exits
nonzero, and the shell assertion exits 0. It must not print a warning followed
by success.

### Step 6: Document deploy authentication and guarantee archive media type

Add a commented `GITHUB_TOKEN` entry to `.env-example`. State that it is a
read-only GitHub token used by Agent Skills generation and is required in
shared build environments to avoid the unauthenticated per-IP limit. Do not
add a value.

In `next.config.mjs` add a narrowly scoped header rule:

```js
{
  source: "/.well-known/agent-skills/:name.tar.gz",
  headers: [{ key: "Content-Type", value: "application/gzip" }],
},
```

Do not add a broad content-type rule, change the API catalog rule, or add a
CORS header merely to mirror platform behavior.

**Verify**: `bun run build` → generation and the Next.js build both exit 0;
the custom header source is accepted.

### Step 7: Verify generated artifacts end to end

With a valid `GITHUB_TOKEN` present in the shell, run:

```sh
bun run generate-agent-skills
bun -e '
  import { createHash } from "node:crypto";
  import { readFile } from "node:fs/promises";
  const root = "public/.well-known/agent-skills";
  const index = JSON.parse(await readFile(`${root}/index.json`, "utf8"));
  if (!index.skills.length) throw new Error("empty index");
  for (const skill of index.skills) {
    if (skill.type !== "archive") throw new Error(`${skill.name}: wrong type`);
    const pathname = new URL(skill.url, "https://docs.steel.dev").pathname;
    const filename = pathname.split("/").at(-1);
    const bytes = await readFile(`${root}/${filename}`);
    const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    if (digest !== skill.digest) throw new Error(`${skill.name}: digest mismatch`);
    const files = await new Bun.Archive(bytes).files();
    if (!files.has("SKILL.md")) throw new Error(`${skill.name}: no root SKILL.md`);
    if (files.size < 2) throw new Error(`${skill.name}: supporting files missing`);
  }
'
```

Expected: both commands exit 0. Inspect `git status --short`; generated files
must remain ignored.

Run `bun run build`, then start the built server in a separate terminal with
`bun run start`. For one archive URL from the generated index:

```sh
curl -sSI http://localhost:3030/.well-known/agent-skills/steel-browser.tar.gz
```

Expected: `200` and `Content-Type: application/gzip`.

Finally, after explicit operator authorization, configure the read-only token
in Vercel Production and Preview, deploy, and repeat `HEAD` checks against the
live index and one archive. Both must return
`Access-Control-Allow-Origin: *`; if not, stop and scope a CORS follow-up.

**Verify**: `bun run check && bun run typecheck && bun run validate-links` →
all commands exit 0.

### Step 8: Exclude discovery artifacts from Markdown negotiation

The production HTTP check found that `.tar.gz` was not an excluded static
extension. A recognized Markdown agent fetching an archive was rewritten to
`/llms.mdx/.well-known/agent-skills/...` and received a 404.

Add `/.well-known/agent-skills` to `EXCLUDED_PATH_PREFIXES` in
`lib/markdown-negotiation.ts`. Add regression assertions in
`tests/markdown-negotiation.test.ts` for both `index.json` and a `.tar.gz`
artifact.

**Verify**: request the built archive with `Accept: text/markdown` and a
recognized agent user agent. It must remain `200 application/gzip` with no
`x-middleware-rewrite` header.

## Test plan

All new automated tests belong in `tests/agent-skills-index.test.ts`, following
its existing `artifact()` fixture and exact-byte digest assertions.

- Happy path: one repository archive becomes one root-layout skill archive and
  one `type: "archive"` index entry.
- Progressive-disclosure regression: `references/` and `scripts/` survive.
- Discovery regression: the frontmatter description wins over a divergent
  manifest description.
- Integrity: digest hashes the exact compressed bytes.
- Reproducibility: identical inputs produce identical compressed bytes.
- Name edges: leading, trailing, consecutive hyphens; invalid characters;
  1-, 64-, and 65-character bounds.
- Malformed source: missing/duplicate manifest, empty catalog, missing
  `SKILL.md`, invalid frontmatter types, blank/overlong description, and name
  mismatch.
- Run `bun test tests/agent-skills-index.test.ts` → all targeted tests pass.
- Run `bun run test` → the complete suite passes before handoff.

## Done criteria

- [ ] Every generated entry has `type: "archive"` and a local `.tar.gz` URL.
- [ ] Every downloaded archive has root `SKILL.md` plus all supporting files.
- [ ] Every index digest matches the exact served archive bytes.
- [ ] Descriptions come only from parsed `SKILL.md` frontmatter.
- [ ] Leading, trailing, and consecutive hyphens are rejected.
- [ ] The source manifest and every skill file come from one validated commit.
- [ ] No generator error is caught and downgraded to a successful build.
- [ ] `.env-example` documents the token without containing a value.
- [ ] The fail-closed generator protects deploys when no token is configured;
      adding the read-only Vercel token remains an operational recommendation.
- [ ] Local and deployed archives return `application/gzip`.
- [ ] Agent Skills index and archive paths are excluded from Markdown
      negotiation, including for recognized agent user agents.
- [ ] Local and deployed index/archive responses retain the current open CORS
      behavior.
- [ ] `bun run test`, `bun run typecheck`, `bun run check`,
      `bun run validate-links`, and `bun run build` all exit 0.
- [ ] `git diff --check` has no output.
- [ ] No tracked files outside the in-scope list changed.
- [ ] `plans/README.md` status row is updated.

## STOP conditions

Stop and report back instead of improvising if:

- The upstream archive has anything other than one wrapper-level
  `manifest.json`.
- Any skill path is absolute, contains `..`, escapes its wrapper, or lacks a
  root `SKILL.md`.
- Any upstream skill uses symlinks, hard links, or an executable permission
  required at runtime. `Bun.Archive`'s normalized regular-file output is not
  sufficient in that case.
- Two runs over identical fixture files produce different archive bytes.
- A generated archive or index digest does not match the bytes at its URL.
- Next.js or the deployed platform does not serve `.tar.gz` as
  `application/gzip`.
- The deployed index or archives no longer return the currently observed open
  CORS header.
- Any verification fails twice after a reasonable, in-scope correction.

## Maintenance notes

- Reviewers should inspect archive entry names and the digest input closely;
  both bugs can produce artifacts that look valid until a client installs them.
- If an upstream skill later becomes `SKILL.md`-only, this plan intentionally
  still publishes it as an archive. Supporting mixed artifact types can be a
  later optimization, not part of this correctness repair.
- If upstream files begin relying on executable modes or links, move to an
  archive implementation that explicitly preserves and validates metadata.
- Stable local URLs mean index and archives must be generated and deployed
  together. Do not introduce independent caching for one without the other.
- CORS is verified rather than configured here because the live static endpoint
  already supplies it. Revisit only if the post-deploy check fails.
