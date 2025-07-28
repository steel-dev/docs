# Quickstart (Python)

How to use Stagehand with Steel

This guide shows you how to use Stagehand with Steel browsers to create AI agents that navigate the web using natural language instructions.

We'll build a simple automation that extracts data from Hacker News.

### Prerequisites

- Python 3.8+

- A Steel API key ([sign up here](https://app.steel.dev/))

- An OpenAI API key

### Step 1: Setup and Dependencies

```python
# requirements.txt
steel-sdk>=0.14.0
stagehand>=0.3.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
# .env
STEEL_API_KEY=your-steel-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### Step 2: Setup and Data Models

```python
import asyncio
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from steel import Steel
from stagehand import StagehandConfig, Stagehand

# Load environment variables
load_dotenv()

# Replace with your own API keys
STEEL_API_KEY = os.getenv("STEEL_API_KEY") or "your-steel-api-key-here"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or "your-openai-api-key-here"

# Define Pydantic models for structured data extraction
class Story(BaseModel):
    title: str = Field(..., description="Story title")
    rank: int = Field(..., description="Story rank number")

class Stories(BaseModel):
    stories: list[Story] = Field(..., description="List of top stories")
```

### Step 3: Create the Automation Script

```python
async def main():
    print("🚀 Steel + Stagehand Python Starter")
    print("=" * 60)

    if STEEL_API_KEY == "your-steel-api-key-here":
        print("⚠️  WARNING: Please replace 'your-steel-api-key-here' with your actual Steel API key")
        print("   Get your API key at: https://app.steel.dev/settings/api-keys")
        return

    if OPENAI_API_KEY == "your-openai-api-key-here":
        print("⚠️  WARNING: Please replace 'your-openai-api-key-here' with your actual OpenAI API key")
        print("   Get your API key at: https://platform.openai.com/")
        return

    session = None
    stagehand = None
    client = None

    try:
        print("\nCreating Steel session...")

        # Initialize Steel client with the API key from environment variables
        client = Steel(steel_api_key=STEEL_API_KEY)

        session = client.sessions.create(
            # === Basic Options ===
            # use_proxy=True,              # Use Steel's proxy network (residential IPs)
            # proxy_url='http://...',      # Use your own proxy (format: protocol://username:password@host:port)
            # solve_captcha=True,          # Enable automatic CAPTCHA solving
            # session_timeout=1800000,     # Session timeout in ms (default: 5 mins)
            # === Browser Configuration ===
            # user_agent='custom-ua',      # Set a custom User-Agent
        )

        print(f"\033[1;93mSteel Session created!\033[0m")
        print(f"View session at \033[1;37m{session.session_viewer_url}\033[0m")

        config = StagehandConfig(
            env="LOCAL",
            model_name="gpt-4o-mini",
            model_api_key=OPENAI_API_KEY,
            # Connect to Steel session via CDP
            local_browser_launch_options={
                "cdp_url": f"{session.websocket_url}&apiKey={STEEL_API_KEY}",
            }
        )

        stagehand = Stagehand(config)

        print("Initializing Stagehand...")
        await stagehand.init()

        print("Connected to browser via Stagehand")

        print("Navigating to Hacker News...")
        await stagehand.page.goto("https://news.ycombinator.com")

        print("Extracting top stories using AI...")

        stories_data = await stagehand.page.extract(
            "Extract the titles and ranks of the first 5 stories on the page",
            schema=Stories
        )

        print("\n\033[1;92mTop 5 Hacker News Stories:\033[0m")
        for story in stories_data.stories:
            print(f"{story.rank}. {story.title}")

        print("\nLooking for search functionality...")

        try:
            observe_result = await stagehand.page.observe("find the search link or button if it exists")
            print(f"Observed: {observe_result}")

            await stagehand.page.act("click on the search link if it exists")
            print("Found and clicked search functionality!")

            await stagehand.page.act("type 'AI' in the search box")
            print("Typed 'AI' in search box")

        except Exception as error:
            print(f"No search functionality found or accessible: {error}")

        await asyncio.sleep(2)

        print("\n\033[1;92mAutomation completed successfully!\033[0m")

    except Exception as error:
        print(f"Error during automation: {error}")
        import traceback
        traceback.print_exc()

    finally:
        if stagehand:
            print("Closing Stagehand...")
            try:
                await stagehand.close()
            except Exception as error:
                print(f"Error closing Stagehand: {error}")

        if session and client:
            print("Releasing Steel session...")
            try:
                client.sessions.release(session.id)
                print("Steel session released successfully")
            except Exception as error:
                print(f"Error releasing session: {error}")

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
```

### Running Your Automation

Execute your script:

```bash
python main.py
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

```python
from pydantic import BaseModel, Field
from typing import Optional

class Product(BaseModel):
    name: str = Field(..., description="Product name")
    price: str = Field(..., description="Product price")
    rating: Optional[float] = Field(None, description="Product rating")
    in_stock: bool = Field(..., description="Whether product is in stock")

class ProductData(BaseModel):
    products: list[Product] = Field(..., description="List of products")

# Extract product data
product_data = await stagehand.page.extract(
    "extract product information from this e-commerce page",
    schema=ProductData
)
```

#### Complex Actions with Natural Language

```python
# Fill out a form using natural language
await stagehand.page.act("fill out the contact form with name 'John Doe', email 'john@example.com', and message 'Hello!'")

# Navigate through multi-step processes
await stagehand.page.act("click on the 'Sign Up' button and then fill out the registration form")

# Handle dynamic content
await stagehand.page.act("wait for the page to load completely, then click on the first product")

# Observe page state before acting
observation = await stagehand.page.observe("describe what's currently visible on the page")
print(f"Page observation: {observation}")
```

### Next Steps

- Explore the [Stagehand documentation](https://docs.browserbase.com/stagehand) for more advanced features

- Check out the [Steel API documentation](https://docs.steel.dev/) for session management options

- Add error handling and retry logic for production use

- Implement structured logging and monitoring for your automations
