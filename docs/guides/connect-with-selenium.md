# Connect with Selenium

:::scalar-callout{type=info}
Our Selenium integration is in its early stages and is not at feature parity with our Puppeteer and Playwright integrations. Some features like CAPTCHA solving and proxy support are currently unavailable. More details are provided below.
:::

Steel sessions are designed to be easily driven by Selenium, allowing you to run your existing Selenium scripts in the cloud with minimal changes.

This guide shows you how to drive Steel's cloud browser sessions using Selenium with Python.


:::scalar-callout{type=success icon="line/arrow-right"}
**Quick Start**: Want to jump right in? [Skip to example project](#example-project-scraping-hacker-news).
:::

## Limitations
Before we begin, please note that the following features are not yet supported in our Selenium integration:

- **CAPTCHA Solving**: Automatic CAPTCHA solving is not available.

- **Proxy Support**: Custom proxy configurations are currently unsupported.

- **Advanced Session Management**: Features like session cloning and cookie manipulation are limited.

- **Live Session Viewer**: While sessions are logged in the Steel Cloud app, we don’t currently have support for the live session viewer.

## Connecting to Steel with Selenium
Most Selenium scripts start with a simple WebDriver setup that looks something like this:

```python
from selenium import webdriver

driver = webdriver.Chrome()  # or Firefox(), Safari(), etc.
driver.get('https://example.com')
```

To run your script with Steel, you'll need to:

1. Create a session with Selenium support enabled

2. Set up custom header handling (required for authentication)

3. Connect using Steel's dedicated Selenium URL

#### Here's what that looks like:
First, create a custom connection handler for Steel-specific headers:

```python
from selenium.webdriver.remote.remote_connection import RemoteConnection

class CustomRemoteConnection(RemoteConnection):
    def __init__(self, remote_server_addr: str, session_id: str):
        super().__init__(remote_server_addr)
        self._session_id = session_id

    def get_remote_connection_headers(self, parsed_url, keep_alive=False):
        headers = super().get_remote_connection_headers(parsed_url, keep_alive)
        headers.update({
            'steel-api-key': os.environ.get("STEEL_API_KEY"),
            'session-id': self._session_id
        })
        return headers
```

Then use it to connect to Steel:

```python
from steel import Steel
from selenium import webdriver
import os

client = Steel(
    steel_api_key=os.getenv('STEEL_API_KEY'),
)

def main():
    # Create a session with Selenium support
    session = client.sessions.create(
        is_selenium=True,  # Required for Selenium sessions
    )

    # Connect using the custom connection handler
    driver = webdriver.Remote(
        command_executor=CustomRemoteConnection(
            remote_server_addr='http://connect.steelbrowser.com/selenium',
            session_id=session.id
        ),
        options=webdriver.ChromeOptions()
    )

    # Run your automation
    driver.get('https://example.com')

    # Clean up when done
    driver.quit()
    client.sessions.release(session.id)

if __name__ == "__main__":
    main()
```

**Important**: Sessions remain active until explicitly released or timed out. It’s best practise to call `client.sessions.release()` when finished instead of relying on timeout.

## Why Custom Headers?
Unlike Puppeteer and Playwright, Selenium doesn't natively support adding the headers required by Steel (session-id and steel-api-key). That's why we need to create a custom connection handler to include these headers with each request.

## Example Project: Scraping Hacker News
Here's a working example that scrapes Hacker News with proper error handling and session management:

::scalar-embed[Starter code that scrapes Hacker News for top 5 stories using Steel's Python SDK and Selenium.]{src="https://replit.com/@steel-dev/steel-selenium-starter?v=1&embed=1"}

\

To run it:

1. Add your `STEEL_API_KEY` to the secrets pane. It's located under "Tools" on the left hand pane.

2. Hit Run

The example includes:

- Complete session configuration options

- Error handling best practices

- A working Hacker News scraper example

You can also clone it on [Github](https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-selenium-starter) or [Replit](https://replit.com/@steel-dev/steel-selenium-starter?v=1#README.md) to start editing it yourself!

