# Intro to Steel
::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/D-Yt182xdIQAAQph6XjuT.png width=500}

_Steel is an open-source browser API purpose-built for AI agents._

### Getting LLMs to use the web is _hard_
We want AI products that can book us a flight, find us a sublet, buy us a prom suit, and get us an interview.

But if you’ve ever tried to build an AI app that can interact with the web today, you know the headaches:

- **Dynamic Content**: Modern sites heavily rely on client-side rendering and lazy loading, requiring scrapers to wait for page hydration and execute JS to access the full content.

- **Complex Navigation**: Reaching desired data often involves multi-step flows, simulating user actions like clicks, typing, and handling CAPTCHAs.

- **Authentication**: High-value data and functionality frequently sits behind auth walls, necessitating robust identity management and auto-login capabilities.

- **Infrastructure Overhead**: Efficiently scaling and managing headless browser fleets is complex, with issues like cold starts, resource contention, and reliability eating up valuable dev cycles.

- **Lack of Web APIs**: Many critical sites still lack API access, forcing teams to build and maintain brittle custom scrapers for each target.

This is by design. Most of the web is designed to be anti-bot and human friendly.

But what if we flipped that?

### A better way to take your LLMs online
Steel is a headless browser API that lets AI engineers:

- Control fleets of browser sessions in the cloud via API or Python/Node SDKs

- Easily extract page data as cleaned HTML, markdown, PDFs, or screenshots

- Access data behind logins with persistent cookies and automatic sign-in

- Render complex client-side content with JavaScript execution

- Bypass anti-bot measures with rotating proxies, stealth configs, and CAPTCHA solving

- Reduce token usage and costs by up to 80% with optimized page formats

- Reuse session and cookie data across multiple runs

- Debug with ease using live session viewers, replays, and embeddings

All fully managed, and ready to scale, so you can focus on building shipping product, not babysitting browsers.

Under the hood, Steel’s cloud-native platform handles all the headaches of browser infrastructure:

- Executing JavaScript to load and hydrate pages

- Managing credentials, sign-in flows, proxies, CAPTCHAs, and cookies

- Horizontal browser scaling and recovering from failures

- Optimizing data formats to reduce LLM token usage

- Monitoring with OpenTelemetry for seamless integration with your observability tools

### Get started with Sessions API

<a href="/sessions-api/overview" type="page-link" class="t-editor__page-link">
    <span>Overview</span>
    <p>Manage fleets of browser sessions with ease</p>
</a>

<a href="/sessions-api/quickstart" type="page-link" class="t-editor__page-link">
    <span>Quickstart</span>
    <p>Get up a running with your first Steel Session in a few minutes</p>
</a>

<a href="/guides/connect-with-puppeteer" type="page-link" class="t-editor__page-link">
    <span>Connect with Puppeteer</span>
    <p>Drive a Steel session with Puppeteer via WebSocket connection</p>
</a>

<a href="/guides/connect-with-playwright-node" type="page-link" class="t-editor__page-link">
    <span>Connect with Playwright (Node)</span>
    <p>Drive a Steel session with Playwright via WebSocket connection</p>
</a>

<a href="/guides/connect-with-playwright-python" type="page-link" class="t-editor__page-link">
    <span>Connect with Playwright (Python)</span>
    <p>Drive a Steel session with Playwright Python via WebSocket connection</p>
</a>

<a href="/guides/connect-with-selenium" type="page-link" class="t-editor__page-link">
    <span>Connect with Selenium</span>
    <p>How to drive and connect to Steel browser sessions with Selenium</p>
</a>

<a href="/integrations/browser-use/quickstart" type="page-link" class="t-editor__page-link">
    <span>Connect with Browser-use</span>
    <p>Drive a Steel session with OpenAI's Browser-use capabilities</p>
</a>

<a href="/files-api/overview" type="page-link" class="t-editor__page-link">
    <span>Files API</span>
    <p>Upload, manage and download files within browser sessions</p>
</a>

<a href="/guides/view-and-embed-live-sessions" type="page-link" class="t-editor__page-link">
    <span>Embed Live Sessions</span>
    <p>View and embed live Steel browser sessions in your application</p>
</a>

<a href="/platform/opentelemetry" type="page-link" class="t-editor__page-link">
    <span>OpenTelemetry Support</span>
    <p>Monitor your Steel sessions with your favorite observability tools</p>
</a>

### Reference

::scalar-callout[[API Reference](/api-reference)]{type=success icon=solid/computer-device-desktop}