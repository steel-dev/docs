# Connect with Puppeteer

This guide shows you how to drive Steel's cloud browser sessions using Puppeteer.

Steel sessions are designed to be easily driven by Puppeteer. There are two main methods for connecting to & driving a Steel session with Puppeteer.

\
:::scalar-callout{type=success icon="line/arrow-right"}
**Quick Start**: Want to jump right in? [Skip to example project.](#example-project-scraping-hacker-news)
:::

## Method #1: One-line change _(easiest)_

Most Puppeteer scripts start with a `puppeteer.launch()` function to launch your browser with desired args that looks something like this:

```typescript
const browser = await puppeteer.launch({...});
```

\
Simply change this line to the following (replacing `MY_STEEL_API_KEY` with your api key):

```typescript
const browser = await puppeteer.connect({
    browserWSEndpoint: 'wss://connect.steel.dev?apiKey=MY_STEEL_API_KEY',
});
```

**_and voila!_** This will automatically start and connect to a Steel session for you with all default parameters set. Your subsequent calls will work as they did previously.

When you're done, the session automatically releases when your script calls `browser.close()`, `browser.disconnect()`, or ends the connection.

#### Advanced: Custom Session IDs

This doesn’t support other UTM parameters to add args (that is what Method #2 is for) other than one - `sessionId`. This allows you to set a custom session id (UUIDv4 format) for the session.

This is helpful because you don’t get any data returned from connecting like this but by setting your own session ID, you can use the API/SDKs to retrieve data or taking actions on the session like manually releasing it.

Example:

```typescript
import { v4 as uuidv4 } from 'uuid';
import Steel from 'steel-sdk';

const sessionId = uuidv4(); // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'

const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${sessionId}`,
});

// Get session details
const client = new Steel();
const session = await client.sessions.retrieve(sessionId);
console.log(`View session live at: ${session.sessionViewerUrl}`);
```

## Method #2: Create and connect
Use this method when you need to drive a session with non-default features like proxy support or CAPTCHA solving. The main difference is that you'll:

1. Start a session via API

2. Connect to it via puppeteer.connect()

3. Release the session when finished

```typescript
import Steel from 'steel-sdk';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const client = new Steel({
    steelAPIKey: process.env.STEEL_API_KEY, // Optional
});

async function main() {
    // Create a session with additional features
    const session = await client.sessions.create({
        useProxy: true,
        solveCaptcha: true,
    });

    // Connect with Puppeteer
    const browser = await puppeteer.connect({
        browserWSEndpoint: `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${session.id}`,
    });

    // Run your automation
    const page = await browser.newPage();
    await page.goto('https://example.com');

    // Always clean up when done
    await browser.close();
    await client.sessions.release(session.id);
}

main();
```

**<u>Important</u>**: With Method #2, sessions remain active until explicitly released or timed out. It’s best practise to call `client.sessions.release()` when finished instead of waiting for the session to timeout to be released.

## Example Project: Scraping Hacker News
Here's a working example that scrapes Hacker News with proper error handling and session management:

::scalar-embed[Starter code that scrapes Hacker News for top 5 stories using Steel's Node SDK and Puppeteer.]{src="https://stackblitz.com/edit/steel-puppeteer-starter?ctl=1&embed=1&file=index.ts&view=editor"}

Run by entering following commands in the terminal:

1. `export STEEL_API_KEY=your_api_key`
2. `npm start`

The example includes:

- Complete session configuration options

- Error handling best practices

- A working Hacker News scraper example

- TypeScript support

You can also clone it on [Github](https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-puppeteer-starter), [Val.town](https://www.val.town/v/stevekrouse/steel_puppeteer_starter), [StackBlitz](https://stackblitz.com/edit/steel-puppeteer-starter?file=README.md), or [Replit](https://replit.com/@steel-dev/steel-puppeteer-starter?v=1) to start editing it yourself!