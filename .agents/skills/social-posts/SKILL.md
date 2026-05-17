---
name: social-posts
description: Generate short social media posts (Twitter/X, LinkedIn, Discord) for the latest Steel changelog entry. Use this skill whenever the user asks for social posts, tweets, a Twitter thread, LinkedIn copy, Discord announcement, or changelog promotion copy.
---

Generate social media posts for the latest Steel changelog entry.

## Steps

1. Find the latest changelog file by listing `content/docs/changelog/` and picking the highest-numbered `changelog-0XX.mdx`.
2. Read the file and identify the key changes. Pick **2–4 highlights** — choose the ones that feel most impactful or interesting to a developer audience. Prefer concrete features over infra/internal changes.
3. Generate all three posts below.

## Post formats

### Twitter/X (two tweets — post as a thread)

**Tweet 1** (the hook — keep under 280 chars):
```
What's new @ Steel - Changelog #[N]
✦ [Highlight 1]
✦ [Highlight 2]
✦ [Highlight 3 if applicable]
✦ [One-liner summary of remaining changes]

Link below ↓
```

**Tweet 2** (the link drop):
```
Changelog #[N]: https://docs.steel.dev/changelog/changelog-0[NN]

or, come hang in our discord: https://discord.gg/steel-dev
```

Attach the changelog image (`/images/changelog/[N].png`) to tweet 1. Mention it as `[attach: /images/changelog/[N].png]` so the user knows which image to use.

No emojis anywhere in the Twitter posts.

### LinkedIn

Slightly warmer tone, same highlights, a short sentence or two of context up front. End with the docs link. Keep it under ~300 words total. No emojis.

### Discord

Follow this structure exactly:

```
**:STEEL_LOGO: Steel Changelog #[N] | [YYYY-MM-DD]**

[One sentence summarizing the theme of this release.]

Highlights
• [Highlight 1]
• [Highlight 2]
• [Remaining items grouped as a single "X, Y & more" line]

→ [Read the full changelog](https://docs.steel.dev/changelog/changelog-0[NN])

---

As always, we're excited to hear your feedback and see what you build!
Happy building!
```

Use today's date. Keep to 3 bullets — the last one can group smaller items together. No emojis anywhere except the `:STEEL_LOGO:` placeholder in the header.

## Output format

Present all three in clearly labeled sections so the user can copy-paste each one. Include the image reference for Twitter.
