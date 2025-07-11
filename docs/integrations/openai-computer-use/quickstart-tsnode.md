# Quickstart (TS/Node)
How to use OpenAI Computer Use with Steel

This guide walks you through creating an AI agent with OpenAI's `computer-use-preview` model using TypeScript and Node.js.

### Prerequisites
- Node.js 16+

- A Steel API key ([sign up here](https://steel.dev/))

- An OpenAI API key with access to the `computer-use-preview` model

### Step 1: Create Type Definitions
```typescript
# types.ts
interface ResponseItem {
  type: string;
  id: string;
}

interface MessageResponseItem extends ResponseItem {
  type: 'message';
  role: 'assistant';
  content: {
    type: 'output_text';
    text: string;
  }[];
}

interface ComputerCallResponseItem extends ResponseItem {
  type: 'computer_call';
  call_id: string;
  action: {
    type: string;
    [key: string]: any;
  };
  pending_safety_checks?: string[];
}

interface FunctionCallResponseItem extends ResponseItem {
  type: 'function_call';
  call_id: string;
  name: string;
  arguments: string;
}

type ResponseOutputItem =
  | MessageResponseItem
  | ComputerCallResponseItem
  | FunctionCallResponseItem;

interface Response {
  id: string;
  output: ResponseOutputItem[];
}
```

### Step 2: Create Steel Browser Integration
```typescript
# steelBrowser.ts
import * as dotenv from 'dotenv';
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import { Steel } from 'steel-sdk';

dotenv.config();

/**
 * SteelBrowser class for interacting with a Steel browser session
 * This class provides methods to control a browser using Steel's API
 */
class SteelBrowser {
  environment = 'browser' as const;
  dimensions = { width: 1024, height: 768 };

  private client: Steel;
  private session: any;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {
    this.client = new Steel({
      steelAPIKey: process.env.STEEL_API_KEY,
      baseURL: process.env.STEEL_API_URL,
    });
  }

  async initialize(): Promise<void> {
    this.session = await this.client.sessions.create({
      useProxy: false,
      solveCaptcha: false,
      blockAds: true,
      dimensions: this.dimensions,
    });
    console.log(`Session created: ${this.session.sessionViewerUrl}`);

    const connectUrl =
      process.env.STEEL_CONNECT_URL || 'wss://connect.steel.dev';
    const cdpUrl = `${connectUrl}?apiKey=${process.env.STEEL_API_KEY}&sessionId=${this.session.id}`;

    try {
      this.browser = await chromium.connectOverCDP(cdpUrl, {
        timeout: 60000, // 60 second timeout
      });

      const context = this.browser.contexts()[0];
      this.page = context.pages()[0];

      await this.page.goto('https://bing.com');
    } catch (error) {
      console.error('Error connecting to Steel session:', error);

      // Clean up if connection fails
      if (this.session) {
        try {
          await this.client.sessions.release(this.session.id);
          console.log(`Session released due to connection error`);
        } catch (releaseError) {
          console.error('Error releasing session:', releaseError);
        }
      }

      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
    if (this.session) {
      await this.client.sessions.release(this.session.id);
      console.log(`Session ended: ${this.session.sessionViewerUrl}`);
    }
  }

  async screenshot(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      const cdpSession = await this.page.context().newCDPSession(this.page);
      const result = await cdpSession.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
      });
      return result.data;
    } catch (e) {
      const buffer = await this.page.screenshot();
      return buffer.toString('base64');
    }
  }

  async click(
    x: number | string,
    y: number | string,
    button: string = 'left'
  ): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    const parsedX = typeof x === 'string' ? parseInt(x, 10) : x;
    const parsedY = typeof y === 'string' ? parseInt(y, 10) : y;

    if (isNaN(parsedX) || isNaN(parsedY)) {
      throw new Error(`Invalid coordinates: x=${x}, y=${y}`);
    }

    await this.page.mouse.click(parsedX, parsedY, {
      button: button as 'left' | 'right' | 'middle',
    });
  }

  async doubleClick(x: number | string, y: number | string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    const parsedX = typeof x === 'string' ? parseInt(x, 10) : x;
    const parsedY = typeof y === 'string' ? parseInt(y, 10) : y;

    if (isNaN(parsedX) || isNaN(parsedY)) {
      throw new Error(`Invalid coordinates: x=${x}, y=${y}`);
    }

    await this.page.mouse.dblclick(parsedX, parsedY);
  }

  async scroll(
    x: number | string,
    y: number | string,
    scrollX: number | string,
    scrollY: number | string
  ): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    const parsedX = typeof x === 'string' ? parseInt(x, 10) : x;
    const parsedY = typeof y === 'string' ? parseInt(y, 10) : y;
    const parsedScrollX =
      typeof scrollX === 'string' ? parseInt(scrollX, 10) : scrollX;
    const parsedScrollY =
      typeof scrollY === 'string' ? parseInt(scrollY, 10) : scrollY;

    if (
      isNaN(parsedX) ||
      isNaN(parsedY) ||
      isNaN(parsedScrollX) ||
      isNaN(parsedScrollY)
    ) {
      throw new Error(`Invalid scroll parameters`);
    }

    await this.page.mouse.move(parsedX, parsedY);
    await this.page.evaluate(
      ({ scrollX, scrollY }) => {
        window.scrollBy(scrollX, scrollY);
      },
      { scrollX: parsedScrollX, scrollY: parsedScrollY }
    );
  }

  async type(text: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.keyboard.type(text);
  }

  async wait(ms: number = 1000): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async move(x: number | string, y: number | string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    const parsedX = typeof x === 'string' ? parseInt(x, 10) : x;
    const parsedY = typeof y === 'string' ? parseInt(y, 10) : y;

    if (isNaN(parsedX) || isNaN(parsedY)) {
      throw new Error(`Invalid coordinates: x=${x}, y=${y}`);
    }

    await this.page.mouse.move(parsedX, parsedY);
  }

  async keypress(keys: string[]): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    for (const k of keys) {
      let key = k;
      if (k === 'ENTER') key = 'Enter';
      else if (k === 'SPACE') key = 'Space';
      else if (k === 'BACKSPACE') key = 'Backspace';
      else if (k === 'TAB') key = 'Tab';
      else if (k === 'ESCAPE' || k === 'ESC') key = 'Escape';
      else if (k === 'ARROWUP') key = 'ArrowUp';
      else if (k === 'ARROWDOWN') key = 'ArrowDown';
      else if (k === 'ARROWLEFT') key = 'ArrowLeft';
      else if (k === 'ARROWRIGHT') key = 'ArrowRight';

      await this.page.keyboard.press(key);
    }
  }

  async drag(
    path: Array<{ x: number | string; y: number | string }>
  ): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    if (path.length === 0) return;

    const parsedPath = path.map((point) => {
      const x = typeof point.x === 'string' ? parseInt(point.x, 10) : point.x;
      const y = typeof point.y === 'string' ? parseInt(point.y, 10) : point.y;

      if (isNaN(x) || isNaN(y)) {
        throw new Error(`Invalid path coordinates`);
      }

      return { x, y };
    });

    await this.page.mouse.move(parsedPath[0].x, parsedPath[0].y);
    await this.page.mouse.down();

    for (const point of parsedPath.slice(1)) {
      await this.page.mouse.move(point.x, point.y);
    }

    await this.page.mouse.up();
  }

  getCurrentUrl(): string {
    if (!this.page) throw new Error('Page not initialized');
    return this.page.url();
  }

  async back(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.goBack();
  }

  async goto(url: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.goto(url);
  }

  async refresh(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.reload();
  }
}

export { SteelBrowser };
```

### Step 3: Create Helper Functions for CUA Integration
```typescript
# cuaHelpers.ts
import { OpenAI } from 'openai';
import { SteelBrowser } from './steelBrowser';
import type { 
  ComputerCallResponseItem, 
  Response 
} from './types';

/**
 * Check if an item is a computer call
 */
export function isComputerCall(item: any): item is ComputerCallResponseItem {
  return (
    item?.type === 'computer_call' && 'action' in item && 'call_id' in item
  );
}

/**
 * Execute an action requested by the computer-use-preview model
 */
export async function executeAction(
  browser: SteelBrowser,
  action: ComputerCallResponseItem['action']
): Promise<void> {
  const actionType = action.type;

  try {
    if (actionType === 'click') {
      let x, y, button;

      if (
        (action.x === 'left' ||
          action.x === 'right' ||
          action.x === 'middle') &&
        typeof action.y === 'number'
      ) {
        x = action.button ?? 0;
        y = action.y;
        button = action.x;
      } else {
        x = action.x ?? 0;
        y = action.y ?? 0;
        button = action.button ?? 'left';
      }

      await browser.click(x, y, button);
    } else if (actionType === 'goto' && action.url) {
      await browser.goto(action.url);
    } else if (actionType === 'back') {
      await browser.back();
    } else if (actionType === 'refresh') {
      await browser.refresh();
    } else if (actionType === 'doubleClick' || actionType === 'double_click') {
      await browser.doubleClick(action.x ?? 0, action.y ?? 0);
    } else if (actionType === 'move') {
      await browser.move(action.x ?? 0, action.y ?? 0);
    } else if (actionType === 'scroll') {
      await browser.scroll(
        action.x ?? 0,
        action.y ?? 0,
        action.scrollX ?? action.scroll_x ?? 0,
        action.scrollY ?? action.scroll_y ?? 0
      );
    } else if (actionType === 'type') {
      await browser.type(action.text || '');
    } else if (actionType === 'keypress') {
      await browser.keypress(action.keys || []);
    } else if (actionType === 'drag') {
      await browser.drag(action.path || []);
    } else if (actionType === 'wait') {
      await browser.wait(action.ms ?? 1000);
    } else if (actionType === 'screenshot') {
      // Just a screenshot request, no action needed
    } else {
      // Generic action handling
      const actionParams = Object.fromEntries(
        Object.entries(action).filter(([key]) => key !== 'type')
      );
      await (browser as any)[actionType](...Object.values(actionParams));
    }

    console.log(`Executed action: ${actionType}`);
  } catch (error) {
    console.error(`Error executing ${actionType} action:`, error);
    throw error;
  }
}

/**
 * Send a screenshot back to the model
 */
export async function sendScreenshot(
  client: OpenAI,
  browser: SteelBrowser,
  responseId: string,
  callId: string,
  safetyChecks: string[] = []
): Promise<Response> {
  const screenshot = await browser.screenshot();

  return client.responses.create({
    model: 'computer-use-preview',
    previous_response_id: responseId,
    tools: [
      {
        type: 'computer-preview' as const,
        display_width: browser.dimensions.width,
        display_height: browser.dimensions.height,
        environment: browser.environment,
      },
    ],
    input: [
      {
        type: 'computer_call_output',
        call_id: callId,
        acknowledged_safety_checks: safetyChecks.map((check) => ({
          id: check,
          code: 'safety_check',
          message: 'Safety check acknowledged',
        })),
        output: {
          type: 'computer_screenshot',
          image_url: `data:image/png;base64,${screenshot}`,
        },
      },
    ],
    truncation: 'auto',
  }) as Promise<Response>;
}
```

### Step 4: Create the Main CUA Loop
```typescript
# runCua.ts
import * as readline from 'readline';
import { OpenAI } from 'openai';
import { SteelBrowser } from './steelBrowser';
import { executeAction, isComputerCall, sendScreenshot } from './cuaHelpers';
import type { Response, MessageResponseItem } from './types';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Main function to run the CUA loop
 */
export async function runCuaLoop(): Promise<void> {
  const task = await new Promise<string>((resolve) =>
    rl.question('What task should the assistant perform? ', resolve)
  );

  const browser = new SteelBrowser();

  try {
    await browser.initialize();

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const tools = [
      {
        type: 'computer-preview' as const,
        display_width: browser.dimensions.width,
        display_height: browser.dimensions.height,
        environment: browser.environment,
      },
    ];

    // Initial request to OpenAI
    const response = (await client.responses.create({
      model: 'computer-use-preview',
      tools,
      input: [{ role: 'user', content: task }],
      reasoning: {
        generate_summary: 'concise',
        effort: 'medium',
      },
      truncation: 'auto',
    })) as Response;

    // Process first response
    const computerCalls = response.output.filter(isComputerCall);

    if (computerCalls.length > 0) {
      const compCall = computerCalls[0];
      await executeAction(browser, compCall.action);
      const nextResponse = await sendScreenshot(
        client,
        browser,
        response.id,
        compCall.call_id,
        compCall.pending_safety_checks || []
      );

      // Continue with the main loop
      await processResponses(client, browser, nextResponse);
    } else {
      await processResponses(client, browser, response);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up resources
    await browser.cleanup();
    rl.close();
  }
}

/**
 * Process responses from the model
 */
async function processResponses(
  client: OpenAI,
  browser: SteelBrowser,
  initialResponse: Response
): Promise<void> {
  let response = initialResponse;

  // Main loop
  while (true) {
    for (const item of response.output) {
      if (item.type === 'message') {
        const messageItem = item as MessageResponseItem;
        console.log(`Assistant: ${messageItem.content[0].text}`);
      }
    }

    const computerCalls = response.output.filter(isComputerCall);
    if (computerCalls.length === 0) {
      console.log('Task completed.');
      break;
    }

    const compCall = computerCalls[0];
    const action = compCall.action;
    console.log(`Action: ${action.type}`);

    await executeAction(browser, action);

    const pendingChecks = compCall.pending_safety_checks || [];
    response = await sendScreenshot(
      client,
      browser,
      response.id,
      compCall.call_id,
      pendingChecks
    );
  }
}
```

### Step 5: Add Main Entry Point
```typescript
# index.ts
import { runCuaLoop } from './runCua';

/**
 * Main entry point
 */
async function main() {
  try {
    console.log('🤖 Welcome to the Steel-powered Computer Use Agent!');
    await runCuaLoop();
    console.log(
      '👋 Session completed. Thank you for using the Computer Use Agent!'
    );
  } catch (error) {
    console.error('❌ Error:', error);
    try {
      // Make sure to cleanup and close any resources
      process.exit(1);
    } catch (e) {
      // Ignore errors in cleanup
    }
  }
}

main();
```

### Running Your Agent
Execute your script to start an interactive AI browser session:

```
npx ts-node index.ts
```

When prompted, enter a task for the AI assistant to perform, such as:

- "Research the top 5 electric vehicles with the longest range"

- "Find and compare iPhone prices across different retailers"

- "Look up the weather forecast for New York this weekend"

You'll see each action the agent takes displayed in the console, and you can view the live browser session by opening the session URL in your web browser.

### Full Example

::scalar-embed{src="https://stackblitz.com/edit/stackblitz-starters-wz34fsfn?embed=1&file=index.ts"}

To run it:

1. Add your `STEEL_API_KEY` and `OPENAI_API_KEY` to .env.

2. Hit Refresh

### Next Steps
- Explore the [Steel API documentation](https://docs.steel.dev/) for more advanced features

- Check out the [OpenAI documentation](https://platform.openai.com/docs/guides/tools-computer-use) for more information about the computer-use-preview model

- Add additional features like session recording or multi-session management