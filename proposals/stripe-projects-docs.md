<!-- ABOUTME: Proposal for adding Stripe Projects to docs.steel.dev. -->
<!-- ABOUTME: Proposal only; does not edit any existing docs page. For review on branch niko/stripe-projects. -->

# Proposal: Stripe Projects on docs.steel.dev

Status: **draft for review**. This document proposes how to document the Steel x Stripe Projects
integration on the public docs site. It proposes edits; it does **not** apply them. Every fact is
sourced, and every contested number is flagged rather than stated.

Scope anchors:
- Feature code: `origin/nasr/feat-stripe-projects-add-provider-integration-support` in `steel-main`
  (provider side of Stripe's Agentic Provisioning Protocol; developer command
  `stripe projects add steel/browser`).
- Launch content: `steel-content/40-49 Planning/2026-07-stripe-projects/` (messaging spine is the
  single source of truth; embargo 2026-07-08 11:00 ET, gated on Stripe's shared-Slack confirmation).
- Docs site: `steel-dev/docs` (Fumadocs + Next.js; content under `content/docs/`).

---

## 1. TL;DR

- Add one evergreen overview page at `content/docs/overview/stripe-projects.mdx` (URL
  `/overview/stripe-projects`) documenting the provisioning flow `stripe projects add steel/browser`,
  what lands in `.env`, and how to use the credentials. It sits in **overview**, right after
  `steel-cli`, because it is a credential-provisioning act (same job as `steel login`), not a runtime
  integration.
- Ship a launch changelog entry `content/docs/changelog/changelog-033.mdx` (number resolved from
  `[NEEDS DATA]` to **033**) plus a `/public/images/changelog/33.png` asset. Nav wiring is two
  `meta.json` edits plus optional backlinks from `steel-cli.mdx`, `authentication.mdx`, and
  `pricinglimits.mdx`.
- The page states **no fees or metered rates** and links to `/overview/pricinglimits` instead, which
  keeps it publish-safe and sidesteps the catalog-versus-docs pricing conflicts.
- LLM inclusion (`/llms-full.txt`) and the OG card are automatic from frontmatter; no manual asset
  work for the overview page.
- One big risk: the **embargo Slack-gate is unconfirmed** (all launch-pack assets are still
  `status: draft`) **and** several figures conflict between the shipping service catalog and the live
  `pricinglimits.mdx` (proxy $/GB, Launch captcha $/1k, Scale retention, the anti-bot deposit
  framing). The new page carries none of those numbers, so it can ship independently, but the two
  surfaces must not disagree once both are live.

## 2. Recommended page and nav placement

**File path:** `content/docs/overview/stripe-projects.mdx` (does not exist today; no slug collision).

**`content/docs/overview/meta.json` edit** (the only nav file that must change):

BEFORE:
```json
    "---Overview---",
    "intro-to-steel",
    "authentication",
    "steel-cli",
    "need-help",
    "pricinglimits",
```
AFTER:
```json
    "---Overview---",
    "intro-to-steel",
    "authentication",
    "steel-cli",
    "stripe-projects",
    "need-help",
    "pricinglimits",
```

**Why overview, beside `steel-cli`:** `stripe projects add steel/browser` mints a Steel org/project and
a `STEEL_API_KEY` and writes them to `.env`. That is the same act as `steel login` (`steel-cli.mdx`)
and "Getting Your API Key" (`authentication.mdx`), so it clusters the three "obtain a Steel credential"
pages. After provisioning, the developer consumes the **same** Steel API, **same** API key, and
**same** base URL as any other project, which is why this is not an integration:
`content/docs/integrations/*` describes runtime/framework connectors (Playwright, Puppeteer,
Stagehand, coding agents), and x402 earns its `---Protocols---` slot only because it changes
consumption (separate endpoint, crypto per call, no API key). Stripe Projects changes provisioning
only.

**Rejected alternatives:**
- `integrations/---Protocols---` beside x402: misfiles an onboarding doc as a runtime integration;
  consumption is unchanged.
- Overview after `pricinglimits`: conceptually a CLI/provisioning flow, not a pricing doc; placing it
  next to `steel-cli` matches the mental model a new developer brings from `steel-cli.mdx`.
- New top-level section: one page does not justify breaking the four-section IA (`overview`,
  `changelog`, `cookbook`, `integrations`).

The launch blog (`launch-pack/04-launch-blog.md`) and the changelog draft
(`launch-pack/05-changelog-and-docs-snippet.md`) already link to
`https://docs.steel.dev/overview/stripe-projects`, so this placement also keeps every public link in
the launch pack valid.

## 3. Frontmatter

```yaml
---
title: Stripe Projects
description: Provision a Steel project and STEEL_API_KEY from the Stripe CLI with `stripe projects add steel/browser`. Credentials sync into .env so your agents get cloud browser sessions.
sidebarTitle: Stripe Projects
llm: true
publishedAt: "2026-07-08"
---
```

Matches the overview reference pages (`title` + `description` + `sidebarTitle` + `llm: true`).
`publishedAt` is set deliberately: `isPageNew()` in `lib/source.ts` auto-shows a sidebar **NEW** badge
for any non-changelog page within 7 days of `publishedAt`, so setting it to the **actual go-live date**
gives a clean launch badge that disappears with no cleanup. **Set `publishedAt` to the real go-live
date if it slips past the embargo.** If you prefer strict parity with `authentication`/`steel-cli`
(which omit it), drop `publishedAt` and rely on nav position plus the changelog entry.

## 4. Full proposed page content

File: `content/docs/overview/stripe-projects.mdx`. Opens with a one-line intro (`steel-cli.mdx`
style); no `**Last Edit:**` line, to match the closest analog.

````mdx
Steel is a co-design and launch partner in the [Stripe Projects](https://docs.stripe.com/projects) developer preview. Add Steel to a project and a real Steel project plus a `STEEL_API_KEY` sync into your `.env`, so your agents get cloud browser sessions to drive on the live web, one at a time or in parallel.

## Overview

Steel is browser infrastructure for AI agents. Through Stripe Projects, one command provisions a Steel project and API key inside a Steel account you own, with no dashboard trip and no copy-paste. The provider slug is `steel/browser`, and Steel implements the provider side of the Agentic Provisioning Protocol.

| Command | What it does |
| --- | --- |
| `stripe projects init` | Scaffolds a Stripe Project in your app directory. |
| `stripe projects add steel/browser` | Links your Stripe account to a Steel account, provisions a Steel project, and writes credentials to `.env`. |

After provisioning, your agents consume the standard Steel API with the same `STEEL_API_KEY`, the same SDKs, and the same base URL as any other Steel project. See [authentication](/overview/authentication) and the [Steel CLI](/overview/steel-cli).

## Prerequisites

You need the Stripe CLI and the Stripe Projects plugin (Stripe Projects is in developer preview):

```bash Terminal
# macOS - install the Stripe CLI and the Projects plugin
brew install stripe/stripe-cli/stripe && stripe plugin install projects
```

## Provision Steel

Scaffold a project, then add Steel:

```bash Terminal -wc
# 1. scaffold a Stripe Project in your app directory
stripe projects init my-app

# 2. add Steel - provisions a project + API key and syncs into .env
stripe projects add steel/browser
```

`stripe projects add steel/browser` links your Stripe account to a Steel account (creating one from your Stripe-verified email if needed), provisions a Steel project inside it, and pulls the credentials into your active environment's output file (`.env` by default).

## What lands in `.env`

The `add` command writes Steel's access configuration to `.env`:

```bash .env -wcn
STEEL_API_KEY=ste-...              # authenticates every Steel API and SDK call
STEEL_BASE_URL=https://api.steel.dev
STEEL_ORG_ID=org_...               # your Steel organization
STEEL_PROJECT_ID=proj_...          # the project provisioned for this app
```

<!-- CONFLICT TO RESOLVE: the backend returns access_configuration as snake_case { steel_api_key, base_url, org_id, project_id }. Only `steel_api_key` is confirmed to map to STEEL_API_KEY. The STEEL_-prefixed names for base_url / org_id / project_id are assumptions about how the Stripe CLI uppercases and prefixes provider vars, not something the Steel codebase can confirm. In particular, steel-cli.mdx (Endpoint Resolution) documents STEEL_API_URL as the cloud base-URL env var, which would make the provisioned base-url line STEEL_API_URL, not STEEL_BASE_URL. Confirm against Stripe's Projects CLI how it names these keys, then update this block and the table below. -->

| Variable | What it is |
| --- | --- |
| `STEEL_API_KEY` | Project API key (prefixed `ste-`). Authenticates every Steel SDK and REST API call. |
| `STEEL_BASE_URL` | Steel Cloud API base URL (`https://api.steel.dev`). Name unconfirmed; may be `STEEL_API_URL`. |
| `STEEL_ORG_ID` | Your Steel organization ID (`org_...`). Name unconfirmed. |
| `STEEL_PROJECT_ID` | The Steel project provisioned for this app (`proj_...`). Name unconfirmed. |

The resources live in a Steel account you own. Keep `.env` out of version control.

## Use the credentials

The Steel SDK reads `STEEL_API_KEY` from the environment automatically:

<CodeTabs storage="languageSwitcher">

```typescript !! Typescript -wcn
import Steel from "steel-sdk";

// reads STEEL_API_KEY from the environment
const client = new Steel();

const session = await client.sessions.create();
// sessions include a live viewer URL and recording
```

```python !! Python -wcn
from steel import Steel

# reads STEEL_API_KEY from the environment
client = Steel()  # picks up STEEL_API_KEY from .env

session = client.sessions.create()
# sessions include a live viewer URL and recording
```

</CodeTabs>

## Plans and pricing

Steel is available through Stripe Projects on a free, pay-as-you-go plan (Launch) and a paid plan for higher limits (Scale). Current plans, included credits, and metered rates live on [pricing and limits](/overview/pricinglimits); upgrade between plans from the Stripe CLI:

```bash Terminal -wc
stripe projects upgrade steel/browser
```

:::callout
type: info
### Anti-bot and CAPTCHA solving
Anti-bot and CAPTCHA solving become available once a payment method is on file. See [pricing and limits](/overview/pricinglimits) for plan-specific detail.
:::

<!-- CONFLICT TO RESOLVE (moved here so it never creates a visible gap): pricinglimits.mdx currently requires a $10 Launch balance for CAPTCHA solving and proxies, while the service catalog frames it as a payment method (Stripe SPT) on file with no $10 threshold. Proxy $/GB, Launch captcha $/1k, and Scale retention also disagree between the catalog and pricinglimits.mdx. Because this page states no numbers, it can ship as-is; reconcile pricinglimits.mdx with billing before either surface implies a figure. -->

## Pull credentials on another machine

If you cloned the repo or a teammate provisioned Steel, pull the current credentials into your local `.env`:

```bash Terminal -wc
stripe projects env --pull
```

## Limits and self-hosting

The `steel-browser` runtime is open source under Apache-2.0, so teams can inspect the code, review the security model, and run it locally when they need a local path. Not every managed feature ships with the runtime:

| Ships with the open-source runtime | Steel Cloud only |
| --- | --- |
| Browser automation core | Managed residential proxies |
| Session lifecycle and tracing | Credentials API |
| Local and self-hosted path | High concurrency and anti-bot/CAPTCHA |

For plan limits (concurrent sessions, session length, requests per minute, data retention), see [pricing and limits](/overview/pricinglimits).

### FAQ

:::faq
### Do I need a Steel account before I run `stripe projects add`?

No. The command links your Stripe account to a Steel account, creating one from your Stripe-verified email if needed. The Steel project and `STEEL_API_KEY` land in a Steel account you own.

### Where do my provisioned resources live?

In your own Steel account. `stripe projects add steel/browser` provisions a real Steel project plus a project-scoped API key inside the Steel organization tied to your Stripe account. You can sign into the Steel dashboard with that account.

### Can I link an existing Steel project to a Stripe Project?

Not today. Steel provisions a fresh project for each Stripe Project rather than attaching an existing one.

### Do the provisioned credentials work with the Steel SDK and CLI?

Yes. Provisioning writes a standard `STEEL_API_KEY`, so the official SDKs, the REST API, and the Steel CLI all read it from the environment without extra configuration.
:::
````

**Reconciliation notes against the launch-pack snippet (`05-changelog-and-docs-snippet.md`):**
- The `.env` placeholder is `ste-...`, the real Steel key prefix (from
  `apps/api/src/modules/api-keys/api-keys.controller.ts`), not `sk_live_...` (a Stripe convention).
- Env vars, commands, slug, and flow come from the engineering recon and match the snippet.
- The conflicted `$10 top-up` line is replaced with the catalog's "payment method on file" framing
  plus a flag; the `$10` figure never appears in public copy.
- Plan tiers are named Launch and Scale (matching the messaging spine and the shipping code), not
  "free/paid".
- No metered rates or fees are stated anywhere.
- The SDK snippet is collapsed to the safe `sessions.create()` shape used in `authentication.mdx`
  (no invented SDK attribute names).
- A runtime-vs-cloud table and the commands table break up prose so no two paragraphs sit back to
  back (house rhythm rule).
- `### FAQ` matches the level used on `authentication.mdx`, `steel-cli.mdx`, and `pricinglimits.mdx`.

## 5. Changelog entry

Next entry is **`033`** (highest on disk is `changelog-032.mdx`; `changelog/meta.json` lists `032` as
latest). Hand-author from the launch pack; do **not** run `scripts/changelog/` (it is a weekly
auto-drafter that would miss the embargo and the co-marketing framing).

File: `content/docs/changelog/changelog-033.mdx`

````mdx
---
title: "Changelog #033"
sidebarTitle: "Changelog #033"
description: "Steel is a co-design and launch partner in Stripe Projects. Provision a Steel project and STEEL_API_KEY from the Stripe CLI with stripe projects add steel/browser."
llm: true
image: "/images/changelog/33.png"
imageAlt: "Announcing Changelog #033"
publishedAt: "2026-07-08"
---
import Image from 'next/image';

<Image
  src="/images/changelog/33.png"
  alt="Announcing Changelog #033"
  width={800}
  height={400}
/>
Steel is a co-design and launch partner in **Stripe Projects** (developer preview). You can provision a Steel project and API key straight from the terminal, with no dashboard trip. Steel implements the provider side of the Agentic Provisioning Protocol that Stripe Projects runs on.

### ⭐ New

#### Provision Steel from the Stripe CLI

`stripe projects add steel/browser` creates a Steel project in your own Steel account and syncs the credentials into your `.env`. Your agents get cloud browser sessions to drive on the live web, wired up in one command.

```bash
stripe projects add steel/browser
# -> STEEL_API_KEY + base URL + org ID + project ID land in .env
```

The resources live in a Steel account you own. Steel is available on a free, pay-as-you-go plan (Launch) and a paid plan for higher limits (Scale); see [pricing and limits](https://docs.steel.dev/overview/pricinglimits) for current plans and rates. Anti-bot and CAPTCHA solving become available once a payment method is on file.

[Provision Steel from the Stripe CLI](https://docs.steel.dev/overview/stripe-projects)
````

**Resolutions:** `[NEEDS DATA]` becomes `033`; the `$10 top-up` line is dropped in favor of the
payment-method-on-file framing; no fees or rates are stated; "co-design and launch partner" framing
added (per the campaign `CLAUDE.md`); `publishedAt` must be the actual go-live date if it slips. The
section heading is `### ⭐ New`, matching the h3 convention in `changelog-029` through `changelog-032`
(`### ⭐ New`, `### 🔧 Improvements`, `### 🐛 Bug Fixes`, `### 🏡 Housekeeping`).

**Nav edit** for `content/docs/changelog/meta.json`: insert `"changelog-033"` as the first item after
`"---Changelog---"`, before `"changelog-032"`. The **NEW** badge is automatic: `isPageNew()` badges
the highest-numbered changelog entry within 7 days of `publishedAt`, so adding `033` auto-badges it
and strips the badge from `032`.

**Asset:** create `/public/images/changelog/33.png` (the directory currently ends at `32.png`) via
the normal changelog illustration flow.

## 6. Cross-links and site wiring

| Where | Change | Type |
| --- | --- | --- |
| `content/docs/overview/meta.json` | Add `"stripe-projects"` after `"steel-cli"` (see section 2). | Required |
| `content/docs/changelog/meta.json` | Prepend `"changelog-033"` after `"---Changelog---"`, before `"changelog-032"`. | Required |
| `content/docs/changelog/changelog-033.mdx` | New file (section 5); body links to `/overview/stripe-projects`. | Required |
| `/public/images/changelog/33.png` | New asset for the `changelog-033` `<Image>` block. | Required |
| `content/docs/overview/steel-cli.mdx` | Add a one-line cross-link near the Auth/Config section, e.g. "Provision Steel from the Stripe CLI: `stripe projects add steel/browser`" linking to `/overview/stripe-projects`. Closest analog and the natural discovery path. | Recommended |
| `content/docs/overview/authentication.mdx` | In "Getting Your API Key", list `stripe projects add steel/browser` alongside the dashboard as a way to obtain a `STEEL_API_KEY`. | Recommended |
| `content/docs/overview/pricinglimits.mdx` | Optional backlink (short callout) noting Steel is available through Stripe Projects, linking to `/overview/stripe-projects`. Do **not** duplicate rates on the new page. | Optional |
| `content/docs/integrations/meta.json` + `index.mdx` (`IntegrationGrid`) | **No change.** The page is intentionally not an integration. | None |
| `llms.txt` / `llms-full.txt` | **No manual edit.** Generated from source at build; `llm: true` auto-includes the page. Verify post-build that `/llms-full.txt` contains the Stripe Projects section. | Auto |
| OG image (`/og/overview/stripe-projects`) | **No asset.** `app/og/[...slug]/route.tsx` renders a 1200x630 card from `title` + `description`; section `overview` yields label "Overview", accent `#a3a3a3`. The title/description in section 3 ARE the OG card. | Auto |
| `apps/api/src/plugins/errors/docs-links.ts` (steel-main) | Optional: add `stripeProjects: \`${BASE}/stripe-projects\`` only if the feature surfaces client-facing errors that should link here. Add it alongside `pricingLimits`/`authentication`. | Optional, conditional |

**Coordinate with the steel-main feature branch
(`origin/nasr/feat-stripe-projects-add-provider-integration-support`):** `stripe-projects.catalog.ts`
sets `llm_context` to `https://docs.steel.dev/llm/steel.md` and
`https://docs.steel.dev/llm/steel-project.md`, but no `/llm` route exists in the docs repo (only
`/llms.txt`, `/llms-full.txt`, and the `app/llms.mdx` catch-all). These URLs 404. Repoint the catalog
to `/overview/stripe-projects` (or `/llms-full.txt`) on the feature branch before launch, or stand up
dedicated LLM context pages.

## 7. Open items / must-resolve-before-publish

Each cites its source.

- **Embargo / Slack gate (blocker).** All launch-pack assets carry `status: draft` and the comment
  "do not publish before Stripe Slack confirm" (`launch-pack/05`, line 7). The embargo time
  (2026-07-08 11:00 ET) has elapsed, but the rule requires explicit confirmation in the shared Slack
  channel, which is not recorded in these materials. Dev-facing assets (docs, changelog, catalog
  copy) need the embargo-hold and Slack-confirm but not Stripe PR sign-off (per
  `launch-pack/README.md` line 16). Get a one-line partner-manager confirmation in Slack that the docs
  page and changelog are cleared under that dev-facing carve-out.
- **Proxy $/GB (conflict).** `pricinglimits.mdx` says `$10/GB` Launch and `$6/GB` Scale;
  `stripe-projects.catalog.ts` says `$5/GB` for both. Reconcile with billing before either surface
  implies a number.
- **Launch captcha $/1k (conflict).** `pricinglimits.mdx` says `$3/1k`; the catalog standalone
  default says `$2/1k`. Reconcile.
- **Scale retention (conflict).** `pricinglimits.mdx` says 14 days; the catalog and
  `engineering-work-explainer.md` section 4 say 30-day. Reconcile.
- **Anti-bot deposit framing (conflict).** `pricinglimits.mdx` requires a `$10` Launch balance; the
  catalog says anti-bot becomes available "once a payment method (your Stripe SPT) is on file" with
  no `$10` threshold, and `steel_milestone_0.md` says Projects orgs run on arrears with no separate
  deposit. Pick one framing and align both surfaces. (The new page uses the neutral
  "payment method on file" wording to avoid stating either.)
- **Standalone-Project rates (new surface).** The catalog's standalone default rates (browser
  `$0.10/hr`, captcha `$2/1k`, proxy `$5/GB`, scrape `$5/1k`) have no equivalent in
  `pricinglimits.mdx`, which only models Launch/Scale/Enterprise. Decide whether to surface them
  anywhere; if you do, proxy and captcha contradict the Launch/Scale figures.
- **Env var names.** Only `steel_api_key` is confirmed from the backend. The `STEEL_`-prefixed names
  for `base_url` / `org_id` / `project_id` (including `STEEL_BASE_URL` vs the `STEEL_API_URL` that
  `steel-cli.mdx` documents) are assumptions about Stripe CLI namespacing. Confirm against Stripe's
  Projects CLI, then update the `.env` block and table in section 4.
- **Catalog `llm_context` URLs 404.** `/llm/steel.md` and `/llm/steel-project.md` do not resolve.
  Repoint on the steel-main branch (section 6).
- **Plan naming.** `steel_milestone_0.md` still says Hobby/Teams; the shipping code
  (`stripe-projects.constants.ts`, `PLAN_SERVICE_TO_STEEL_PLAN`) and the messaging spine use
  Launch/Scale. Align any asset that inherited Hobby/Teams. The docs page uses Launch/Scale (spine
  L82 sanctions these names); confirm with billing/Stripe before the names go live on a public page,
  or fall back to the tier-agnostic "free pay-as-you-go plan and a paid plan for higher limits" until
  confirmed.
- **Slug / command confirmation.** Confirm the public provider slug `steel/browser` and the final
  `stripe projects add steel/browser` command with Stripe. Code service id is `browser` (provider
  prefix `steel`); app id is `com.steel.projects`. The exact CLI verbs (`add`, `upgrade`, `env
  --pull`, `init`, `plugin install`) are Stripe-side and not verifiable from the Steel codebase;
  confirm against `docs.stripe.com/projects`.
- **Stripe-side enablements (steel-main/slack.md).** SPT delivery and
  `default_shared_payment_token` enablement were requested for the provider account/app; confirm they
  are live in prod before launch (the Scale `$250/mo` charge would otherwise exceed the default `$50`
  SPT cap).
- **Public-safe pricing sign-off.** The messaging spine forbids stating fees or metered rates in
  public copy. Confirm with marketing whether any figure (the `$30` credit, `$250/mo` Scale fee,
  metered rates) may appear in public copy at all; this proposal assumes none do and links out
  instead.
- **Assets from humans.** Color and mono logos (exported to Stripe spec) and
  `/public/images/changelog/33.png` are still needed.
- **Exec quotes / press (separate track).** Any press release or Stripe-naming press must go to
  `partner-pr@stripe.com` (CC partner manager) for a 7-10 business-day Stripe PR review before going
  live; confirm founder names/titles (Hussien Hussien, CEO; Nasr Mohamed, CTO) against brand sources.
  Out of scope for this docs proposal.

## 8. Rollout / launch sequence

Ordered to respect the embargo and the "publish nothing before Stripe Slack confirm" rule.

1. **Hold.** Keep the docs page and `changelog-033` in draft on branch `niko/stripe-projects` until
   Stripe confirms launch in the shared Slack channel. The elapsed embargo date alone does not clear
   them.
2. **Reconcile pricing.** With billing, resolve proxy $/GB, Launch captcha $/1k, Scale retention, and
   the anti-bot-deposit framing on `pricinglimits.mdx`. The new page carries no numbers, so it can
   ship even if pricinglimits reconciliation slips, but the two surfaces must not disagree once both
   are live.
3. **Confirm env vars and CLI verbs.** Confirm the `.env` variable names and the exact Stripe CLI
   subcommands against Stripe's Projects CLI; update the `.env` block and table in section 4.
4. **Fix the feature branch (steel-main).** Repoint the catalog `llm_context` URLs to a resolvable
   target; confirm Stripe-side SPT enablements are live in prod.
5. **Prepare assets.** Create `/public/images/changelog/33.png`; set `publishedAt` on both the page
   and `changelog-033` to the planned go-live date.
6. **Stage edits.** Add `stripe-projects.mdx`, `changelog-033.mdx`, the `33.png` asset, the two
   `meta.json` edits, and the recommended backlinks from `steel-cli.mdx` / `authentication.mdx` (and
   the optional `pricinglimits.mdx` backlink).
7. **On Stripe Slack confirmation:** merge and deploy; flip the page and changelog from draft to live
   (remove any draft gating).
8. **Verify post-deploy.** `/llms-full.txt` contains the Stripe Projects section;
   `/og/overview/stripe-projects` renders the 1200x630 card; the sidebar shows the **NEW** badge on
   both the page and `changelog-033`; run `stripe projects add steel/browser` end-to-end to confirm
   the printed commands and `.env` output match the page.
9. **Coordinated publish.** Publish the changelog, launch blog, and social per the launch-pack
   sequence (on X, the command/link goes in the first reply, not the main post).

## 9. Out of scope

This proposal deliberately does **not**:

- Change any existing docs page's content (all edits to `steel-cli.mdx`, `authentication.mdx`,
  `pricinglimits.mdx`, and both `meta.json` files are proposed diffs for review, not applied here).
- Reconcile or rewrite pricing numbers on `pricinglimits.mdx` (flagged for billing; the new page
  states none).
- Add the page to `content/docs/integrations/` or the `IntegrationGrid` (it is a
  provisioning/onboarding doc, not a runtime integration).
- Add a new top-level docs section.
- Change the API reference, self-hosting docs, or any `cookbook` page.
- Modify steel-main code (catalog, service, constants); the `llm_context` repoint and env-var
  confirmation are coordination notes for the feature-branch owner.
- Author the launch blog, press release, exec quotes, or social posts (those live in the launch pack
  under separate Stripe PR rules).
- Add an Enterprise tier to the catalog (the catalog publishes no Enterprise service; docs retain
  `Custom`).
- Implement any mock or placeholder behavior.
