# Overview
[Val Town](https://www.val.town/) is a collaborative platform for writing and deploying TypeScript functions, enabling you to build APIs and schedule tasks directly from your browser.

### Overview
Val Town enables you to run Steel + Puppeteer scripts as serverless functions with one-click deployment. Write your automation code in the browser, schedule it to run on intervals, or trigger it via API endpoints - all without managing servers or containers.

:::scalar-callout{type=success icon="line/interface-alert-information-circle"}
Val Town runs on the Deno runtime and supports JavaScript, TypeScript, JSX, and TSX. For Puppeteer integrations, we recommend using the deno-puppeteer library as shown in the below starter template.
:::

### Requirements
- Steel API key (any plan, get a free key [here](https://app.steel.dev/settings/api-keys))

- Val Town account (free tier available)

- Basic JavaScript/TypeScript knowledge

- Familiarity with Puppeteer

### Quickstart Template

::scalar-embed[Val.town starter]{src="https://www.val.town/embed/steel/steel_puppeteer_starter"}

**How to use this Val:**

- Get a free Steel API key at [https://app.steel.dev/settings/api-keys](https://app.steel.dev/settings/api-keys)

- Add it to your [Val Town Environment Variables](https://www.val.town/settings/environment-variables) as `STEEL_API_KEY`

- Fork [this val](https://www.val.town/v/steel/steel_puppeteer_starter)

- Click `Run` on that val

- View the magic in the logs ✨

### Additional Resources
- [**Val Town Documentation**](https://docs.val.town/) - Learn more about Val Town's features

- [**Session API Overview**](https://docs.steel.dev/overview/sessions-api/overview) - Learn about Steel’s Sessions API

- [**Support**](https://docs.steel.dev/overview/need-help) - Get help from the Steel team