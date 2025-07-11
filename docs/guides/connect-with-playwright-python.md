# Connect with Playwright (Python)

This guide shows you how to drive Steel's cloud browser sessions using Playwright with Python. Looking for Node.js/TypeScript? Check out our [Playwright Node.js guide](/overview/guides/link-to-node-guide).

Steel sessions are designed to be easily driven by Playwright. There are two main methods for connecting to & driving a Steel session with Playwright.

\
:::scalar-callout{type=success icon="line/arrow-right"}
**Quick Start**: Want to jump right in? [Skip to example project.](#example-project-scraping-hacker-news)
:::

## Method #1: One-line change _(easiest)_
Most Playwright scripts start with chromium.launch() function to launch your browser with desired args that looks something like this:

```python
browser = chromium.launch()
```

Simply change this line to the following (replacing `MY_STEEL_API_KEY` with your api key):

```python
browser = chromium.connect_over_cdp(
    'wss://connect.steel.dev?apiKey=MY_STEEL_API_KEY'
)
```

**_and voila!_** This will automatically start and connect to a Steel session for you with all default parameters set. Your subsequent calls will work as they did previously.

When you're done, the session automatically releases when your script calls `browser.close()`, `browser.disconnect()`, or ends the connection.

#### Advanced: Custom Session IDs
This doesn’t support other UTM parameters to add args (that is what Method #2 is for) other than one - `sessionId`. This allows you to set a custom session id (UUIDv4 format) for the session.

This is helpful because you don’t get any data returned from connecting like this but by setting your own session ID, you can use the API/SDKs to retrieve data or taking actions on the session like manually releasing it.

Example:

```python
from uuid import uuid4
from playwright.sync_api import sync_playwright

session_id = str(uuid4())  # '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'

playwright = sync_playwright().start()
browser = playwright.chromium.connect_over_cdp(
    f'wss://connect.steel.dev?apiKey={os.getenv("STEEL_API_KEY")}&sessionId={session_id}'
)
```

## Method #2: Create and connect
Use this method when you need to drive a session with non-default features like proxy support or CAPTCHA solving. The main difference is that you'll:

1. Start a session via API

2. Connect to it via chromium.connect_over_cdp()

3. Release the session when finished

:::scalar-callout{type=success}
If you want your session to be recorded in the live viewer make sure to use the existing browser context from the session when controlling a page as opposed to creating a new context.
:::

```python
import os
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
from steel import Steel

load_dotenv()

client = Steel(
    steel_api_key=os.getenv('STEEL_API_KEY'),
)

def main():
    # Create a session with additional features
    session = client.sessions.create(
        use_proxy=True,
        solve_captcha=True,
    )

    # Connect with Playwright
    playwright = sync_playwright().start()
    browser = playwright.chromium.connect_over_cdp(
        f'wss://connect.steel.dev?apiKey={os.getenv("STEEL_API_KEY")}&sessionId={session.id}'
    )

    # Create page at existing context to ensure session is recorded.
    currentContext = browser.contexts[0]
    page = currentContext.new_page()

    # Run your automation
    page.goto('https://example.com')

    # Always clean up when done
    browser.close()
    client.sessions.release(session.id)

if __name__ == "__main__":
    main()
```

**<u>Important</u>**: With Method #2, sessions remain active until explicitly released or timed out. It’s best practice to call `client.sessions.release()` when finished instead of waiting for the session to timeout to be released.

## Example Project: Scraping Hacker News
Here's a working example that scrapes Hacker News with proper error handling and session management:

::scalar-embed[Starter code that scrapes Hacker News for top 5 stories using Steel's Python SDK and Playwright.]{src="https://replit.com/@steel-dev/steel-playwright-python-starter?embed=true"}

\

To run it:

1. Add your `STEEL_API_KEY` to the secrets pane. It's located under "Tools" on the left hand pane.

2. Hit Run

The example includes:

- Complete session configuration options

- Error handling best practices

- A working Hacker News scraper example

You can also clone it on [Github](https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-playwright-python-starter) or [Replit](https://replit.com/@steel-dev/steel-playwright-python-starter?v=1) to start editing it yourself!