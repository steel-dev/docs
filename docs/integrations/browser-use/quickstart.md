# Quickstart

This guide walks you through connecting a Steel cloud browser session with the browser-use framework, enabling an AI agent to interact with websites.

### Prerequisites
Ensure you have the following:

- Python 3.11 or higher

- Steel API key (sign up at [app.steel.dev](https://app.steel.dev/))

- OpenAI API key (sign up at [platform.openai.com](https://platform.openai.com/))

### Step 1: Set up your environment
First, create a project directory, set up a virtual environment, and install the required packages:

```bash
# Create a project directory
mkdir steel-browser-use-agent
cd steel-browser-use-agent

# Recommended: Create and activate a virtual environment
uv venv
source .venv/bin/activate  # On Windows, use: .venv\Scripts\activate

# Install required packages
pip install steel-sdk browser-use langchain-openai python-dotenv
```

Create a `.env` file with your API keys:

```
STEEL_API_KEY=your_steel_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 2: Create a Steel browser session
Use the Steel SDK to start a new browser session for your agent:

```python
from steel import Steel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
STEEL_API_KEY = os.getenv("STEEL_API_KEY")

# Create a Steel browser session
client = Steel(steel_api_key=STEEL_API_KEY)
session = client.sessions.create()

print(f"View live session at: {session.session_viewer_url}")
```

This creates a new browser session in Steel's cloud. The session_viewer_url allows you to watch your agent's actions in real-time.

### Step 3: Define Your Browser Session
Connect the browser-use BrowserSession class to your Steel session using the CDP URL:

```python
from browser_use import Agent, BrowserSession

# Connect browser-use to the Steel session
cdp_url = f"wss://connect.steel.dev?apiKey={STEEL_API_KEY}&sessionId={session.id}"
browser_session = BrowserSession(cdp_url=cdp_url)

python
Step 4: Define your AI Agent
Here we bring it all together by defining our agent with what browser, browser context, task, and LLM to use.

# After setting up the browser session
from browser_use import Agent
from langchain_openai import ChatOpenAI

# Create a ChatOpenAI model for agent reasoning
model = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    api_key=os.getenv('OPENAI_API_KEY')
)

# Define the task for the agent
task = "Go to docs.steel.dev, open the changelog, and tell me what's new."

# Create the agent with the task, model, and browser session
agent = Agent(
    task=task,
    llm=model,
    browser_session=browser_session,
)
```

This configures the AI agent with:

- An OpenAI model for reasoning

- The browser session instance from Step 3

- A specific task to perform


:::scalar-callout{type=success icon="line/interface-alert-information-circle"}
**Supported Models:**
\
This example uses **GPT-4o**, but you can use any browser-use compatible models like Anthropic, DeepSeek, or Gemini. See the full list of supported models here.
:::

### Step 5: Run your Agent
Execute the agent and handle cleanup:

```python
# Define the main function with the agent execution
async def main():
    try:
        # Run the agent
        print("Running the agent...")
        await agent.run()
        print("Task completed!")
    finally:
        # Clean up resources
        client.sessions.release(session.id)
        print("Resources cleaned up")

# Run the async main function
if __name__ == '__main__':
    asyncio.run(main())
```

Run using the following command: `python main.py`

The agent will spin up a steel browser session and interact with it to complete the task. After completion, it's important to properly close the browser and release the Steel session.

### Complete example
Here's the complete script that puts all steps together:

```python
import os
import asyncio
from dotenv import load_dotenv
from browser_use import Agent, BrowserSession
from steel import Steel
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()
STEEL_API_KEY = os.getenv('STEEL_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Initialize the Steel client
client = Steel(steel_api_key=STEEL_API_KEY)

# Create a Steel session
print("Creating Steel session...")
session = client.sessions.create()
print(f"Session created at {session.session_viewer_url}")

# Connect browser-use to Steel
cdp_url = f"wss://connect.steel.dev?apiKey={STEEL_API_KEY}&sessionId={session.id}"
browser_session = BrowserSession(cdp_url=cdp_url)

# Create and configure the AI agent
model = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    api_key=OPENAI_API_KEY
)

task = "Go to docs.steel.dev, open the changelog, and tell me what's new."

agent = Agent(
    task=task,
    llm=model,
    browser_session=browser_session
)

async def main():
  try:
      # Run the agent
      print("Running the agent...")
      await agent.run()
      print("Task completed!")
      
  except Exception as e:
      print(f"An error occurred: {e}")
  finally:
      # Clean up resources
      if session:
          client.sessions.release(session.id)
          print("Session released")
      print("Done!")

# Run the async main function
if __name__ == '__main__':
    asyncio.run(main())
```

Save this as main.py and run it with:

```bash
python main.py
```

### Customizing your agent's task
Try modifying the task to make your agent perform different actions:

```python
# Search for weather information
task = "Go to https://weather.com, search for 'San Francisco', and tell me today's forecast."

# Research product information
task = "Go to https://www.amazon.com, search for 'wireless headphones', and summarize the features of the first product."

# Visit a documentation site
task = "Go to https://docs.steel.dev, find information about the Steel API, and summarize the key features."
```

Congratulations! You've successfully connected a Steel browser session with browser-use to create an AI web agent.