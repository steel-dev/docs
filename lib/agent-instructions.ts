// ABOUTME: Quick reference and gotchas served to agents via the /llms.txt index,
// ABOUTME: the /llms-full.txt bundle, and the /AGENTS.md route.

export const AGENT_INSTRUCTIONS = `# Steel Documentation

> Steel is the open-source browser API for AI agents — managed cloud browsers with stealth,
> residential proxies, CAPTCHA solving, persistent profiles, session replays, and agent observability.
> Use Steel to launch cloud browsers, scrape content, and automate web tasks.

## Quick Reference

- Install: \`npm install steel-sdk\` (Node.js) or \`pip install steel-sdk\` (Python)
- Agent CLI setup (stable v0.5.0+): https://setup.steel.dev/install.md
- Human-terminal CLI install: \`curl -fsS https://setup.steel.dev | sh\`
- Auth header: \`steel-api-key: <your-key>\`
- Auth env var: \`STEEL_API_KEY\`
- API base URL: \`https://api.steel.dev\`
- WebSocket: \`wss://connect.steel.dev?apiKey=<key>&sessionId=<id>\`
- MCP server: \`https://mcp.steel.dev/mcp\` (OAuth sign-in, or \`Authorization: Bearer <your-key>\`)
- API reference: https://steel.apidocumentation.com/api-reference
- Brand design language (DESIGN.md): https://docs.steel.dev/DESIGN.md

## Agent Instructions

- For CLI setup, read https://setup.steel.dev/install.md. Install the stable binary, then run
  \`steel init --agent --from <client>\` with \`opencode\`, \`codex\`, \`pi\`, or \`claude-code\`.
  Ask the user to approve the returned device URL, then resume the same init command.
  Load the installed \`steel-browser\` skill before performing the user's task.
- CLI device login does not require copying an API key. The SDK/REST API examples below
  use \`STEEL_API_KEY\` separately; do not extract a CLI device grant into application code.
- CLI output is text by default, including when piped. Pass \`--json\` for machine-readable output.
- For the simplest one-liner scrape, use the CLI:
  \`\`\`bash
  steel scrape https://example.com
  \`\`\`
- For simple scraping without a browser session, use the REST scrape endpoint:
  \`\`\`
  curl -X POST https://api.steel.dev/v1/scrape \\
    -H "steel-api-key: YOUR_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{"url": "https://example.com"}'
  \`\`\`
- For browser automation, connect Puppeteer or Playwright via WebSocket:
  \`\`\`js
  import Steel from 'steel-sdk';
  import puppeteer from 'puppeteer-core';

  const client = new Steel({ steelAPIKey: process.env.STEEL_API_KEY });
  const session = await client.sessions.create();
  const browser = await puppeteer.connect({
    browserWSEndpoint: \`wss://connect.steel.dev?apiKey=\${process.env.STEEL_API_KEY}&sessionId=\${session.id}\`,
  });
  // ... use browser ...
  await browser.close();
  await client.sessions.release(session.id);
  \`\`\`
- For agent-style browser control over plain HTTP, use the Commands API. Take a snapshot, then act on the refs in it:
  \`\`\`
  curl -X POST https://api.steel.dev/v1/sessions/SESSION_ID/commands \\
    -H "steel-api-key: YOUR_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{"commands": [{"command": "navigate", "url": "https://example.com"}, {"command": "snapshot", "interactive": true}]}'
  \`\`\`
  Then send \`{"after": "<next from the response>", "commands": [{"command": "click", "target": "e1"}]}\`. Docs: https://docs.steel.dev/overview/commands-api/overview
- To give an MCP client Steel browsers, add the hosted MCP server. In Claude Code:
  \`\`\`bash
  claude mcp add --transport http steel https://mcp.steel.dev/mcp
  \`\`\`
  The client signs in with OAuth on first use. Docs: https://docs.steel.dev/overview/mcp
- Python SDK:
  \`\`\`python
  from steel import Steel
  client = Steel(steel_api_key="YOUR_KEY")  # or set STEEL_API_KEY env var
  result = client.scrape(url="https://example.com")
  print(result.content.html)
  \`\`\`
- \`client.scrape()\` returns a \`ScrapeResponse\` with:
  - \`result.content.html\` — full HTML string
  - \`result.content.markdown\` — markdown version
  - \`result.content.cleaned_html\` — cleaned HTML
  - \`result.content.readability\` — readability text
  - \`result.metadata.status_code\` — HTTP status (int)
  - \`result.metadata.title\` — page title
  - \`result.links\` — list of extracted links
- Always release sessions when done: \`client.sessions.release(sessionId)\`
- Do NOT use \`session.websocketUrl\` directly — construct the WSS URL as shown above
- The Node SDK constructor param is \`steelAPIKey\` (not \`apiKey\`)
- The Python SDK constructor param is \`steel_api_key\` (not \`api_key\`)
- The Python package installs as \`pip install steel-sdk\` but imports as \`from steel import Steel\`
- \`sessions.create()\` accepts an optional \`sessionId\` (Node) / \`session_id\` (Python) UUID when you need the ID before the session exists; omit it and Steel generates one
- The Python \`sessions.create()\` session timeout param is \`api_timeout\` (not \`timeout\`, which is the HTTP request timeout)
- Any docs page is available as markdown by appending \`.md\` to its URL, for example \`https://docs.steel.dev/overview/steel-cli.md\`; AI user agents (Claude, Cursor, GPT) receive markdown automatically at the canonical URL
- \`/llms-full.txt\` concatenates every page into one file (large, roughly 230k tokens); prefer fetching the individual \`.md\` pages you need over reading the whole bundle

`;
