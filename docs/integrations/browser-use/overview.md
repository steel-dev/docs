Browser-Use is an open-source library that enables AI agents to control and interact with browsers programmatically. This integration connects Browser-Use with Steel's infrastructure, allowing for seamless automation of web tasks and workflows.

## Overview
The Browser-Use integration connects Steel's browser infrastructure with the Browser-Use agent framework, enabling AI models to perform complex web interactions. Agents can navigate websites, fill forms, click buttons, extract data, and complete multi-step tasks - all while leveraging Steel's reliable cloud-based browsers for execution. This integration bridges the gap between AI capabilities and real-world web applications without requiring custom API development.

## Requirements & Limitations
- **Python Version**: Requires Python 3.11 or higher

- **Dependencies**: Requires Playwright-python and certain Langchain chat modules

- **Supported Models**: Works best with vision-capable models (GPT-4o, Claude 3)

- **Limitations**: Performance depends on the underlying LLM's ability to understand visual context

## Documentation
[Quickstart Guide](/overview/integrations/browser-use/quickstart) → Quickstart step-by-step guide how to install browser-use, configure your environment, and create your first agent to interact with websites through Steel.

## Additional Resources
- [Example Repository](https://github.com/browser-use/browser-use/tree/main/examples) - Working example implementations for various use cases

- [Discord Community](https://link.browser-use.com/discord) - Join discussions and get support

- [Browser-Use Documentation](https://docs.browser-use.com/) - Comprehensive guide to the browser-use library