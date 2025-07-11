::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/qV1473F8SxEXZJncOow5j.png}

The Steel Playground is a browser-based code execution environment for testing Steel automations. Write, run, and debug browser automation scripts directly in your browser with real-time visual feedback—no local setup required.

Steel's playground is available for:

- Signed-in users @ [app.steel.dev/playground](http://app.steel.dev/playground)
- Non-authenticated users @ [playground.steel.dev](http://playground.steel.dev/)

### How it works
The playground provides Python and Node.js runtimes with pre-installed libraries for popular automation frameworks. When you execute code, it creates Steel browser sessions that you can watch live through an integrated session viewer, making it easy to debug issues and understand how your automation behaves.

Start with provided templates for Puppeteer, Playwright (Python or TypeScript), browser-use, or write custom scripts from scratch. Code execution happens in an isolated environment, separate from your local development setup—ideal for prototyping ideas or validating Steel for your use case without affecting existing projects.

### Supported Frameworks
The playground supports the most popular browser automation frameworks:

- **Puppeteer** - Full JavaScript/TypeScript support for Puppeteer scripts

- **Playwright** - Both Python and TypeScript implementations

- **Browser-use** - Popular automation frameworks that integrate with Steel

### Important Limitations
**Read-Only Terminal** - You can see execution output and logs, but cannot run shell commands or install additional packages.

**Single Session Display** - The live browser viewer shows only the first session created in your code. Additional sessions will run normally but won't appear in the viewer.

**Pre-Installed Libraries Only** - The environment comes with essential libraries for supported frameworks, but you cannot install additional dependencies. See the reference section below for the complete list of available libraries.

**Rate Limits** - Usage is subject to rate limiting to ensure system stability and fair access for all users.

**Python & Node Runtimes** - Only Python and Node runtimes are supported for code execution.

**Custom Code Limits** - Users must be signed in to run custom code. Steel’s public playground only allows users to code from pre-set templates.

### Reference: Environment Specs & Rate Limits
_This section will contain detailed information about the development environments powering the playground’s code execution._

**Runtime Versions**

- Python v3.11.2
- Node v23.11.1

**Available Libraries**

Complete list of pre-installed packages for each supported language/framework

**Node**:

- All built-in Node libraries

- playwright

- steel-sdk

- puppeteer-core

**Python**:

- All built-in Python Libraries

- playwright

- steel-sdk

- pyppeteer

- 'browser-use==0.1.48’

**Environment Variables**

If no other API key is provided, when creating a session, Steel will automatically inject a Steel API key into the execution environment to create a session.

When using the public playground, Sessions are created using a global API key. When using the playground inside the Steel dashboard, we’ll automatically use the onboarding API key created for development purposes. If you wish to use another key, the system will default to what you override in ENV or pass in inside the code.

Rate Limits

|                             | Public Playground | Signed-in users |
|-----------------------------|-------------------|-----------------|
| Max concurrent running jobs | None              | 3               |
| Job runs per minute         | 3                 | None            |
