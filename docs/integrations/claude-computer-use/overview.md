# Overview

Anthropic's Claude Computer Use is an advanced AI capability that combines vision and reasoning to autonomously control computer interfaces through a continuous action loop, enabling complex web automation tasks.

### Overview

The Claude Computer Use integration connects Anthropic's Claude 3.5 Sonnet (and newer models) with Steel's reliable browser infrastructure. This integration enables AI agents to:

- Control Steel browser sessions via Claude's Computer Use API

- Execute real browser actions like clicking, typing, scrolling, and navigation

- Perform complex web tasks such as form filling, data extraction, and multi-step workflows

- Process visual feedback from screenshots to determine next actions

- Implement human-in-the-loop verification for sensitive operations

By combining Claude's Computer Use capabilities with Steel's cloud browser infrastructure, you can build robust, scalable web automation solutions that leverage Steel's anti-bot capabilities, proxy management, and sandboxed environments.

### Requirements & Limitations

- **Anthropic API Key**: Access to Claude 3.5 Sonnet or newer models with Computer Use capabilities

- **Steel API Key**: Active subscription to Steel

- **Python or Node.js Environment**: Support for API clients for both services

- **Supported Environments**: Works best with Steel's browser environment (vs. desktop environments)

- **Beta Status**: Computer Use is currently in beta with some limitations around latency and accuracy

### Documentation

[Quickstart Guide (Python)](https://docs.steel.dev/overview/integrations/claude-computer-use/quickstart-python) → Step-by-step guide to building a Claude Computer Use agent with Steel browser sessions in Python.

[Quickstart Guide (Node.js)](https://docs.steel.dev/overview/integrations/claude-computer-use/quickstart-tsnode) → Step-by-step guide to building a Claude Computer Use agent with Steel browser sessions in TypeScript & Node.js.

### Additional Resources

[Anthropic Computer Use Documentation](https://docs.anthropic.com/en/docs/build-with-claude/computer-use) - Official documentation from Anthropic

[Steel Sessions API Reference](https://docs.steel.dev/api-reference) - Technical details for managing Steel browser sessions

[Cookbook Recipe (Python)](https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-claude-computer-use-python-starter) - Working, forkable examples of the integration in Python

[Cookbook Recipe (Node.js)](https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-claude-computer-use-node-starter) - Working, forkable examples of the integration in Node.js

[Community Discord](https://discord.gg/steel-dev) - Get help and share your implementations
