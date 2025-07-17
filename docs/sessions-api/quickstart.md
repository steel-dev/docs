# Quickstart

This guide will walk you through setting up your Steel account, creating your first browser session in the cloud, and driving it using Typescript/Playwright. In just a few minutes, you'll be up and programatically controlling a Steel browser Session.



:::scalar-callout{type=success icon="line/interface-alert-information-circle"}
**Want to jump right in? [Skip to our example project.](/guides/connect-with-puppeteer#example-project-scraping-hacker-news)**

\
**Using a different stack?** Check out our guides for [Playwright (node)](/guides/connect-with-playwright-node), [Playwright-Python](/guides/connect-with-playwright-python), and [Selenium](/guides/connect-with-selenium), or view the [Python SDK Reference](/reference/python-sdk-reference).
:::

### Initial Setup
1. **Create a Steel Account**
    1. Sign up for a free account at [steel.dev](http://app.steel.dev)
    2. The free plan includes 100 browser hours to get you started
    3. No credit card required

2. **Get Your API Key**
    1. After signing up, navigate to [Settings > API Keys](https://app.steel.dev/settings/api-keys)
    2. Create an API key and save it somewhere safe. You will not be able to generate the same key again.

3. **Set Up Environment Variables**
    1. Create a `.env` file in your project root (if you don't have one)
    2. Add your Steel API key:

    ```bash
    STEEL_API_KEY=ste_***
    ```
    
    Make sure to add `.env` to your `.gitignore` file to keep your key secure

### Installing Dependencies
Install the Steel SDK and Playwright:

```bash
npm install steel-sdk playwright
```

### Create Your First Session
Let's create a simple script that launches and then releases a Steel session:

```typescript
import Steel from 'steel-sdk';
import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const client = new Steel({
  steelAPIKey: process.env.STEEL_API_KEY,
});

async function main() {
  // Create a session
  const session = await client.sessions.create();
  console.log('Session created:', session.id);
  console.log(`View live session at: ${session.sessionViewerUrl}`);
  
  // Your session is now ready to use!
  // When done, release the session
  await client.sessions.release(session.id);
  console.log('Session released');
}

main().catch(console.error);
```

### Connecting to Your Session
Now that you have a session, you can connect to it using your preferred automation tool.

::::scalar-tabs{default="Node.js / Puppeteer"}

:::scalar-tab{title="Node.js / Puppeteer"}
```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${session.id}`,
});

const page = await browser.newPage();
await page.goto('https://example.com');
```
:::

::::

### Session Features
Want to do more with your session? Here are some common options you can add when creating:

```typescript
const session = await client.sessions.create({
    useProxy: true,           // Use Steel's residential proxy network
    solveCaptcha: true,       // Enable automatic CAPTCHA solving
    sessionTimeout: 1800000,  // Set 30-minute timeout (default is 5 minutes)
    userAgent: 'custom-ua'    // Set a custom user agent
});
```

You've now created your first Steel session and learned the basics of session management. With these fundamentals, you can start building more complex automations using Steel's cloud browser infrastructure.

Need help? Join our [**Discord community**](https://discord.gg/gPpvhNvc5R) or check out our full [API Reference](/api-reference).