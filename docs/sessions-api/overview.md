# Overview

The Sessions API lets you create and control cloud-based browser sessions through simple API calls. Each session is like a fresh incognito window, but running in our cloud and controlled through code.


::scalar-button[]{title="Go to Quickstart Example" href=/sessions-api/quickstart icon="solid/arrow-right" }

### What is a Session?

Sessions are the atomic unit of our Sessions API. Think of sessions as giving your AI agents their own dedicated browser windows. Just like you might open an incognito window to start a fresh browsing session, the Sessions API lets your agents spin up isolated browser instances on demand. Each session maintains its own state, cookies, and storage - perfect for AI agents that need to navigate the web, interact with sites, and maintain context across multiple steps.

### Get started

<a href="/sessions-api/quickstart" type="page-link" class="t-editor__page-link">
    <span>Quickstart</span>
    <p>Get up a running with your first Steel Session in a few minutes</p>
</a>

### Connect with your preferred tools

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
    <p>Drive a Steel session with Playwright-python via WebSocket connection</p>
</a>

<a href="/guides/connect-with-selenium" type="page-link" class="t-editor__page-link">
    <span>Connect with Selenium</span>
    <p>How to drive and connect to Steel browser sessions with Selenium</p>
</a>

### Understanding sessions

Session Lifecycle
Learn how to start and release browser sessions programatically.

::scalar-callout[[API Reference](/api-reference)]{type=success icon=solid/computer-device-desktop}

### Built-in and customizable features

Steel’s Session API has the following built-in and customizable features:

| Core capabilities                                                | Customizable features                   |
|------------------------------------------------------------------|-----------------------------------------|
| Full browser automation with JavaScript support                  | Custom user agent strings               |
| Automatic proxy rotation via useProxy                            | Proxy configuration options             |
| CAPTCHA solving via solveCaptcha                                 | Session timeout settings                |
| Session timeout management                                       | Custom session IDs                      |
| Live session viewer and debugging tools                          | Session context management              |
| Cookie and local storage persistence                             | Browser launch configuration            |
| Selenium, Playwright, Puppeteer compatibility                    |                                         |