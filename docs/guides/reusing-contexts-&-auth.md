# Reusing Contexts & Auth

The Steel Sessions API provides a `contexts` endpoint that allows you to capture and transfer browser state (including cookies and local storage) between sessions. This is particularly useful for maintaining authenticated states across multiple sessions, helping your AI agents access protected resources efficiently without repeatedly handling login processes or exposing credentials at all.

In this guide, you'll learn how to use the Steel Sessions API to reuse authentication between browser sessions.

For additional practical examples and recipes, check out the [Steel Cookbook](https://github.com/steel-dev/steel-cookbook).


### Prerequisites
- Steel API Key

- [Steel SDK](https://github.com/steel-dev/steel-python) installed (`npm install steel-sdk`)

- Familiarity with [Steel sessions](/overview/sessions-api/overview)


### Overview of the Process
Reusing authentication across sessions involves a straightforward workflow:

1. **Create and authenticate an initial session.**

    Create a Steel session, navigate to target websites, and authenticate (log-in, etc).

2. **Capture the session context.**
    
    Extract browser state data through the `GET /v1/sessions/{id}/context` endpoint. This endpoint returns a context object containing browser state information such as cookies and local storage.
    
    **Example:**

    ```typescript
    const initialSessionContext = await client.sessions.context(initialSession.id);
    ```
3. **Reuse session context in new sessions.**
    
    Create new sessions using the captured context object by passing it directly to the `sessionContext` parameter.

    **Example:**

    ```typescript
    session = await client.sessions.create({ sessionContext: initialSessionContext });
    ```

    Now your new session will begin with the same authenticated state as your previous session without having to manually authenticate again.


### Complete Example (Playwright, Node.js)

:::scalar-callout{type=success icon="line/interface-alert-information-circle"}
**Note:** While this example uses TypeScript, Node.js, and Playwright, the same logic applies regardless of your programming language or automation framework. The Steel API handles the context management - you just need to capture and reuse it using your preferred tools.
:::

The following script demonstrates the entire authentication reuse process. It:

1. Creates an initial session and authenticates with a webesite by logging in

2. Captures the authenticated session context

3. Creates a new session using the captured context

4. Verifies the authentication was successfully transferred to the new session

```typescript
import { chromium, Page } from "playwright";
import Steel from "steel-sdk";
import dotenv from "dotenv";

dotenv.config();

const client = new Steel({
  steelAPIKey: process.env.STEEL_API_KEY,
});

// Helper function to perform login
async function login(page: Page) {
  await page.goto("https://practice.expandtesting.com/login");
  await page.fill('input[name="username"]', "practice");
  await page.fill('input[name="password"]', "SuperSecretPassword!");
  await page.click('button[type="submit"]');
}

// Helper function to verify authentication
async function verifyAuth(page: Page): Promise<boolean> {
  await page.goto("https://practice.expandtesting.com/secure");
  const welcomeText = await page.textContent("#username");
  return welcomeText?.includes("Hi, practice!") ?? false;
}

async function main() {
  let session;
  let browser;

  try {
    // Step 1: Create and authenticate initial session
    console.log("Creating initial Steel session...");
    session = await client.sessions.create();
    console.log(
      `\x1b[1;93mSteel Session #1 created!\x1b[0m\n` +
        `View session at \x1b[1;37m${session.sessionViewerUrl}\x1b[0m`
    );

    // Connect Playwright to the session
    browser = await chromium.connectOverCDP(
      `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${session.id}`
    );

    const page = await browser.contexts()[0].pages()[0];
    await login(page);

    if (await verifyAuth(page)) {
      console.log("✓ Authentication successful");
    }

    // Step 2: Capture and transfer authentication
    const sessionContext = await client.sessions.context(session.id);

    // Clean up first session
    await browser.close();
    await client.sessions.release(session.id);
    console.log("Session #1 released");

    // Step 3: Create new authenticated session
    
    session = await client.sessions.create({ sessionContext });
    console.log(
      `\x1b[1;93mSteel Session #2 created!\x1b[0m\n` +
        `View session at \x1b[1;37m${session.sessionViewerUrl}\x1b[0m`
    );

    // Connect to new session
    browser = await chromium.connectOverCDP(
      `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${session.id}`
    );

    // Verify authentication transfer
    const newPage = await browser.contexts()[0].pages()[0];
    if (await verifyAuth(newPage)) {
      console.log("\x1b[32m✓ Authentication successfully transferred!\x1b[0m");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Cleanup
    await browser?.close();
    if (session) {
      await client.sessions.release(session.id);
      console.log("Session #2 released");
    }
  }
}

main().catch(console.error);
```

::scalar-button[]{title="Check out the full example" href="https://github.com/steel-dev/steel-cookbook/tree/main/examples/reuse_auth_context_example" icon="solid/arrow-right" }

### Important Considerations
- **Cookie and JWT Based Authentication Only**:
  
  This method works exclusively with websites that utilize cookie-based or JWT-based authentication (saved onto Local Storage).

- **Enhancing Continuity**:
  
  A useful practice is to save the URL of the last visited page along with the session context. This allows you to restore the browsing context, providing continuity for users.

- **Session Security**:
  
  Treat captured contexts as sensitive data. Ensure proper security and regularly refresh your sessions to maintain account integrity.

- **Available for Live Sessions**:
  
  Context can only be captures from live sessions. So if you wish to re-use a context, make sure to grab the object before releasing the session.

