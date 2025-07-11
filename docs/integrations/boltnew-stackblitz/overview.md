# Overview
StackBlitz is an **instant fullstack web IDE** for the JavaScript ecosystem. It's powered by [WebContainers](https://blog.stackblitz.com/posts/introducing-webcontainers/), the first WebAssembly-based operating system which **boots the Node.js environment in milliseconds**, securely within your browser tab.

### Overview
Run Steel browser automation scripts with JavaScript/TypeScript directly in StackBlitz without any local setup or installation. This browser-based environment makes it perfect for quick prototyping, sharing running examples, or collaborative development.

Plus, with [Bolt.new](http://bolt.new/) (StackBlitz's AI-powered web development agent), you can use natural language to write scripts and build full-stack applications around Steel's capabilities—all instantly in your browser.

:::scalar-callout{type=success icon="line/interface-alert-information-circle"}
While StackBlitz has limited Python support, we currently only offer TypeScript templates for Steel.
:::

### Requirements & Limitations
- Steel API key (any plan, get a free key [here](https://app.steel.dev/settings/api-keys))

- Supported languages: JavaScript and TypeScript

- No account required to run code (only to save changes)

### Starter Templates
- [Steel Puppeteer Starter](https://stackblitz.com/edit/steel-puppeteer-starter) - Node.js template using Puppeteer

- [Steel Playwright Starter](https://stackblitz.com/edit/steel-playwright-starter) - Node.js template using Playwright

### Running any template
To run any of the starter templates:

1. Click on the template link above to open it in StackBlitz

2. Set your `STEEL_API_KEY` in one of two ways:

    1. Export it in the terminal: export `STEEL_API_KEY=your_key_here`

    2. Create a .env file and add: `STEEL_API_KEY=your_key_here`

    Note: Don't have an API key? Get a free key at [app.steel.dev/settings/api-keys](http://app.steel.dev/settings/api-keys)

3. Run the command `npm run` in the terminal to run the script

No account is required to run or even edit the templates - you only need to sign in if you want to save your changes.

### AI-Powered Development with [Bolt.new](http://bolt.new/)
All our StackBlitz templates can be opened in [Bolt.new](http://bolt.new/), an AI-powered web development agent built on StackBlitz's WebContainer technology. With [Bolt.new](http://bolt.new/), you can:

- Use natural language prompts to modify Steel automation scripts

- Build full-stack applications around Steel's capabilities

- Get AI assistance while developing your browser automation workflows

- Deploy your projects with zero configuration

Look for the _"Open in Bolt.new"_ button on our templates to get started with AI-assisted development.

### Additional Resources
- [StackBlitz Documentation](https://developer.stackblitz.com/) - Learn more about StackBlitz's features

- [Session API Overview](https://docs.steel.dev/overview/sessions-api/overview) - Learn about Steel’s Sessions API

- [Support](https://docs.steel.dev/overview/need-help) - Get help from the Steel team

**Note**: Sections marked with → indicate detailed guides available.