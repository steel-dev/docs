# Quickstart (Node.js)

How to use Stagehand with Steel

This guide shows you how to use Stagehand with Steel browsers to create AI agents that navigate the web using natural language instructions.

We'll build a simple automation that extracts data from Hacker News.

### Prerequisites

- Node.js 20+

- A Steel API key ([sign up here](https://app.steel.dev/))

- An OpenAI API key

### Step 1: Setup and Dependencies

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
# .env
STEEL_API_KEY=your-steel-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### Step 2: Setup Steel and Stagehand Integration

```typescript
import { Stagehand } from "@browserbasehq/stagehand";
import Steel from "steel-sdk";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const STEEL_API_KEY = process.env.STEEL_API_KEY || "your-steel-api-key-here";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your-openai-api-key-here";

// Initialize Steel client with the API key from environment variables
const client = new Steel({
  steelAPIKey: STEEL_API_KEY,
});
```

### Step 3: Create the Automation Script

```javascript
async function main() {
  console.log("🚀 Steel + Stagehand Node Starter");
  console.log("=".repeat(60));

  if (STEEL_API_KEY === "your-steel-api-key-here") {
    console.warn(
      "⚠️  WARNING: Please replace 'your-steel-api-key-here' with your actual Steel API key"
    );
    console.warn(
      "   Get your API key at: https://app.steel.dev/settings/api-keys"
    );
    return;
  }

  if (OPENAI_API_KEY === "your-openai-api-key-here") {
    console.warn(
      "⚠️  WARNING: Please replace 'your-openai-api-key-here' with your actual OpenAI API key"
    );
    console.warn("   Get your API key at: https://platform.openai.com/");
    return;
  }

  let session;
  let stagehand;

  try {
    console.log("\nCreating Steel session...");

    session = await client.sessions.create({
      // === Basic Options ===
      // useProxy: true, // Use Steel's proxy network (residential IPs)
      // proxyUrl: 'http://...',         // Use your own proxy (format: protocol://username:password@host:port)
      // solveCaptcha: true,             // Enable automatic CAPTCHA solving
      // sessionTimeout: 1800000,        // Session timeout in ms (default: 5 mins)
      // === Browser Configuration ===
      // userAgent: 'custom-ua-string',  // Set a custom User-Agent
    });

    console.log(
      `\x1b[1;93mSteel Session created!\x1b[0m\n` +
        `View session at \x1b[1;37m${session.sessionViewerUrl}\x1b[0m`
    );

    stagehand = new Stagehand({
      env: "LOCAL", // Using LOCAL env to connect to Steel session
      localBrowserLaunchOptions: {
        cdpUrl: `${session.websocketUrl}&apiKey=${STEEL_API_KEY}`,
      },
      enableCaching: false,
      modelClientOptions: {
        apiKey: OPENAI_API_KEY,
      },
    });

    console.log("Initializing Stagehand...");
    await stagehand.init();

    console.log("Connected to browser via Stagehand");

    console.log("Navigating to Hacker News...");
    await stagehand.page.goto("https://news.ycombinator.com");

    console.log("Extracting top stories using AI...");

    const stories = await stagehand.page.extract({
      instruction: "extract the titles of the first 5 stories on the page",
      schema: z.object({
        stories: z.array(
          z.object({
            title: z.string(),
            rank: z.number(),
          })
        ),
      }),
    });

    console.log("\n\x1b[1;92mTop 5 Hacker News Stories:\x1b[0m");
    stories.stories?.forEach((story, index) => {
      console.log(`${index + 1}. ${story.title}`);
    });

    console.log("\nLooking for search functionality...");

    try {
      await stagehand.page.act(
        "find and click on the search link or button if it exists"
      );
      console.log("Found search functionality!");

      await stagehand.page.act("type 'AI' in the search box");
      console.log("Typed 'AI' in search box");
    } catch (error) {
      console.log("No search functionality found or accessible");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n\x1b[1;92mAutomation completed successfully!\x1b[0m");
  } catch (error) {
    console.error("Error during automation:", error);
  } finally {
    if (stagehand) {
      console.log("Closing Stagehand...");
      try {
        await stagehand.close();
      } catch (error) {
        console.error("Error closing Stagehand:", error);
      }
    }

    if (session) {
      console.log("Releasing Steel session...");
      try {
        await client.sessions.release(session.id);
        console.log("Steel session released successfully");
      } catch (error) {
        console.error("Error releasing session:", error);
      }
    }
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
```

### Running Your Automation

Execute your script:

```bash
npm start
```

You'll see the session URL printed in the console. Open this URL to view the live browser session.

The automation will:

1. Create a Steel browser session
2. Connect Stagehand to the session
3. Navigate to Hacker News
4. Extract the top 5 stories using AI
5. Try to find and interact with search functionality

### Advanced Usage

#### Custom Data Extraction Schema

```javascript
const productData = await stagehand.page.extract({
  instruction: "extract product information from this e-commerce page",
  schema: z.object({
    products: z.array(
      z.object({
        name: z.string(),
        price: z.string(),
        rating: z.number().optional(),
        inStock: z.boolean(),
      })
    ),
  }),
});
```

#### Complex Actions with Natural Language

```javascript
// Fill out a form using natural language
await stagehand.page.act(
  "fill out the contact form with name 'John Doe', email 'john@example.com', and message 'Hello!'"
);

// Navigate through multi-step processes
await stagehand.page.act(
  "click on the 'Sign Up' button and then fill out the registration form"
);

// Handle dynamic content
await stagehand.page.act(
  "wait for the page to load completely, then click on the first product"
);
```

### Next Steps

- Explore the [Stagehand documentation](https://docs.browserbase.com/stagehand) for more advanced features

- Check out the [Steel API documentation](https://docs.steel.dev/) for session management options

- Add error handling and retry logic for production use

- Implement structured logging and monitoring for your automations
