## Changelog #013 | 2025-06-18

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/xabZ_F1PSsw-1OaFnvEuE.png}

Hey everyone! This week we pushed a handful of improvements and fixes across Steel Cloud and Steel Browser. Nothing too crazy, but some solid quality of life updates.

### ⭐ New
#### _OpenTelemetry Support_ 🔧
Steel-browser now has OpenTelemetry support. You can hook logs and events to your own providers. Metrics are automatically configured. Connect your favorite providers like Sentry or Axiom and get trace visibility easier than ever.

### 🔧 Bugfixes/Improvements
- Added a feedback button to the dashboard so you can share feedback easier and quicker

- Stealth improvements on the canvas fingerprinting side and other browser leaks related to workers

- Some session player improvements - fixed issue with long sessions causing pages to crash (more improvements on the way)

- Steel Browser: fix platform details not persisting when generated for the browser,

- A couple other small UI and API fixes

As always, thanks for testing out Steel’s Beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

\
## Changelog #012 | 2025-06-11

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/LKGCuYzD7oa22Qe7zC0Xv.png}

Clean up and fixes galore 🧹 Sometimes the best updates are the ones that make everything just work better - and that's exactly what we focused on this week.

### 🔧 Bugfixes/Improvements
#### Steel Cloud

- Fixed infinite websocket connection issues for frontend logs that were causing performance degradation

- Resolved bug where recording snapshots larger than 5MB were being dropped, ensuring complete session recordings

- Fixed user agent string passing functionality that wasn't working correctly in session creation

- Patched frontend crash that occurred when clicking on newly ended sessions

- Implemented performance improvements across the dashboard for smoother and faster data fetching

- Added better error boundaries throughout the frontend for improved stability and user experience

#### Steel Playground

- Enhanced error handling for code execution, providing clearer feedback when things go wrong

- Improved animations and created a smoother terminal experience for better developer workflow

As always, thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

\
## Changelog #011 | 2025-06-03
Sup chat. Huss here back with your roundup of Steel's first [Launch Week](https://steel.dev/launch-week). We launched new features every day last week (fully recapped below) as well as a new pricing plan.

Let's take a look! 🤸

### Day 1 - Credentials Beta

::scalar-image{src=https://d3b9kr64nievew.cloudfront.net/cmbf5zpf100ey140ilj2haqc9/cmbf8zotk0gk8120j8adtmpfu.png width="560"}

Your agents can now automatically sign into password-protected websites without ever seeing your credentials. Built with enterprise-grade AES-256-GCM encryption, TOTP/2FA support, and field blurring protection.

Just store credentials via API, create sessions with credential injection enabled, and Steel will automatically authenticate to unblock your agents. [Read the announcement thread here.]()

::scalar-button[]{title="Read Credentials API Docs →" href=/overview/credentials-api/overview }

### Day 2 - Steel Playground

::scalar-image{src=https://d3b9kr64nievew.cloudfront.net/cmbf5zpf100ey140ilj2haqc9/cmbf8zv4x0g1d2b0j2nrm1cwu.png width="560"}

**Steel Playground** is the first zero-setup tool from Steel that lets you test browser automations faster than ever, directly on the web.

Write Puppeteer, Playwright, or browser-use code and watch it execute live through an integrated session viewer, terminal, and log view. Works with both Python and TypeScript, with 1-click templates from our cookbook! [Read the announcement thread here]().

::scalar-button[]{title="Go to Playground →" href=https://playground.steel.dev/ }

### Day 3 - Multi-Region Browser Deployments

::scalar-image{src=https://d3b9kr64nievew.cloudfront.net/cmbf5zpf100ey140ilj2haqc9/cmbf902g80gky2f0ib0zfzqiy.png width="560"}

At Steel, we understand that latency kills agent performance, especially with hundreds of requests across continents adding up to sluggish experiences.

We've expanded Steel Cloud to 7 global regions with automatic closest-region selection—from Los Angeles to Hong Kong, your browsers spin up wherever makes the most sense. [Read the announcement thread here.]()

::scalar-button[]{title="Read Multi-Region Docs →" href=/overview/sessions-api/multi-region }

### Day 4 - Filesystem V2

::scalar-image{src=https://d3b9kr64nievew.cloudfront.net/cmbf5zpf100ey140ilj2haqc9/cmbf90lm40gslym0i1arf4ivq.png width="560"}

Your agents can now upload, manage, and download files seamlessly within browser sessions, plus get persistent global storage & backups across all automations.

Upload files once and mount them to sessions anywhere, download files from online, or bulk download all artifacts from a session as zip archives. [Read the announcement thread here.]()

::scalar-button[]{title="Read Files API Docs →" href=/overview/files-api/overview }

### Day 5 - Starter Plan + PAYG

::scalar-image{src=https://d3b9kr64nievew.cloudfront.net/cmbf5zpf100ey140ilj2haqc9/cmbf90t3z0h4k4g0hiqrhnqb2.png width="560"}

We're (finally) making Steel accessible to every team that wants to test and validate browser automation. There's now a perfect middle ground between tinkering and launching.

**The Starter Plan** gives you $29/month with $29 in credits, plus pay-as-you-go overages so you don't hit limits in prod.

::scalar-button[]{title="Go to Pricing →" href=https://steel.dev/#pricing }
-------------

Thanks for building with Steel! It means the world to us and we’re excited to hear your feedback on the above!

\
## Changelog #010 | 2025-05-21

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/740kXiKjNNK1O_xf12uE5.png}

Hey! This week we focused on implementing some fixes and improvements to help round out Steel’s DevEx while we prepare for [REDACTED]. Let’s get into it!

### 🔧 Bugfixes/Improvements
1. _Steel Browser_
    1. Improved Chrome args structure and manipulation using ENV variables

    2. Updated Steel browser plugin so you can hook onto custom CDP lifecycle events without editing source code directly

    3. Separated Browser and API launch, resulting in faster API boot times

    4. Standardized package names in the repo for a cleaner dependency structure

2. _Steel Cloud_
    1. Fixes to re-render bugs that were causing some state update delays

    2. Fixes requests ordering from FE to preload data for a snappier UI

    3. New Signup / Sign-in page dropped :)

    4. Improved browser logs component to make them easier to understand

Thanks for reading & testing out the Steel beta. We really look forward to more of your feedback and continuing to cook for ya’ll.

\
## Changelog #009 | 2025-05-13

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/lLdC9xMtNw1cihp5shpLU.png}

We’ve got some really cool stuff in the oven cooking 👨‍🍳 But in the meantime, here’s a handful of bug fixes and quality of life features we’ve pushed this week.

### 🔧 Bugfixes/Improvements
- Patched issue with adding session context via Python SDK

- Resolved issue with inability to access iframe content in Steel Sessions

- Added advanced options on session creation through the Steel Cloud dashboard

- A handful of UI/API fixes

As always, thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

\
## Changelog #008 | 2025-05-06

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/oWlREKD5nejyDprfYbiGM.png}

Howdy y’all! These last few weeks brought significant improvements to session state management and browser control capabilities, along with several important bugfixes to enhance the Steel experience.

### ⭐ New
#### Enhanced Session Context Support 🔄
Session contexts have been extended to cover indexedDB and sessionStorage, providing more robust state persistence and authentication handling. This improvement allows for more reliable user sessions, especially for sites that rely heavily on client-side storage for auth tokens and application state.

```typescript

// Example: Working with the enhanced session context
const session = await client.sessions.create();
let browser = await chromium.connectOverCDP(
  `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${session.id}`
);
const page = await browser.contexts()[0].pages()[0];

// Session now maintains indexedDB and sessionStorage state
// Perfect for sites using modern auth patterns
await page.goto('https://app.example.com/login');
await page.fill('#email', 'user@example.com');
await page.fill('#password', 'password123');
await page.click('#login-button');

const sessionContext = await client.sessions.context(session.id);


const session = await client.sessions.create({ sessionContext });
browser = await chromium.connectOverCDP(
    `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${session.id}`
);

const page = await browser.contexts()[0].pages()[0];

// State persists across navigation
await page.goto('https://app.example.com/dashboard');
// User remains logged in!
```

[Documentation Link](/overview/guides/reusing-contexts-auth) | [Auth Examples](https://github.com/steel-dev/steel-cookbook/tree/main/examples/reuse_auth_context_example)

**Steel Browser Now Uses Chromium By Default 🌐**

We've upgraded Steel Browser to use Chromium as our default browser, replacing our previous Chrome implementation. While Chrome served us well for bypassing basic anti-bot measures and stealth detection, it presented compatibility challenges for M-chip Mac users.

The key issue was that Mac users running Steel Browser through Docker couldn't operate properly, as Chrome lacked distribution support for ARM Linux machines (which our Docker image utilized for Mac compatibility).

Now that we use Chromium by default (which DOES have an ARM Linux compatible distribution);all the issues that Mac users were facing should now be gone.

### 🔧 Bugfixes/Improvements
- Steel Browser is now plugin-based, allowing

- Fixed multiple UI bugs for a smoother user experience

- Resolved an issue with browser updates happening in the background causing interruptions

- Added support for custom Chrome arguments via environment variables

- Improved session stability when working with sites that use indexedDB heavily

- Fixed state synchronization issues between browser restarts

- Repaired the live viewer for Railway deployments in Steel Browser

- You can now call browser actions with existing sessions

- Improved URL and environment variable management in the open-source repository

- Custom domain support throughout steel browser

- +10 other small bugfixes all around

### 💖 First-time contributors
Special thanks to [@aspectrr](https://github.com/aspectrr) for their help on enabling custom Chrome args for Steel Browser; as well as the ability to run browser actions on current pages within a session.

As always, thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

Got questions or want to chat? Join us on [Discord](https://discord.gg/steel-dev) or reach out on [Twitter/X](https://twitter.com/steeldotdev).

\
## Changelog #007 | 2025-04-09

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/fYgqRSCjhbqLejUq4fjy8.jpeg}

Hey y’all! This week's update brings an exciting new Files API for Sessions, along with several improvements to the Steel browser experience and important bugfixes to enhance stability.

### ⭐ New
#### Files API for Sessions 📂
The new Files API enables seamless file management within active browser sessions. You can now upload files from your local machine, use them in your automation workflows, and download files back when needed - perfect for testing file uploads or working with documents in your browser automation.

```typescript
// Upload a file to your session
const file = new File(["Hello World!"], "hello.txt", { type: "text/plain" });
const uploadedFile = await client.sessions.files.upload(session.id, { file });

// Create a CDP session to pass in some custom controls
const cdpSession = await currentContext.newCDPSession(page);
const document = await cdpSession.send("DOM.getDocument");

// We need to find the input element using the selector
const inputNode = await cdpSession.send("DOM.querySelector", {
  nodeId: document.root.nodeId,
  selector: "#load-file",
});

// Set the CSV file as input on the page.
await cdpSession.send("DOM.setFileInputFiles", {
  files: [uploadedFile.path],
  nodeId: inputNode.nodeId,
});

// Download a file from your session
const response = await client.sessions.files.download(session.id, file.id);
const downloadedFile = await response.blob();
```

[Documentation Link](https://docs.steel.dev/overview/guides/working-with-files-in-sessions) | [Steel Cookbook](https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-files-api-starter)

### 🔧 Bugfixes/Improvements
- Improved rendering of the session viewer for a slight speed bump in UI updates

- Enhanced logging system for better coverage and debugging capabilities

- Upgraded the session viewer UI on steel-browser for improved usability

- Fixed proxy usage metrics that were incorrectly over-reporting usage

- Improved the UI docker image to accept dynamic API URLs, enabling more flexible custom deployments

- +10 other small bug fixes

As always, thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

Got questions or want to chat? Join us on [Discord](https://discord.gg/steel-dev) or reach out on [Twitter/X](https://twitter.com/steeldotdev).

\
## Changelog #006 | 2025-04-01

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/3Ih08HgMtUZuZeoyvEERp.png}

Happy April Fools day y’all! We’ve been heads down this week on some large features that we have coming soon — but thought we should give you guys a little update

### 🔧 Bugfixes/Improvements
- Bug causing the session viewer to flicker on certain websites is no longer

- Issue with non-existent session directory when starting up steel-browser is now gone

- "proxyTxBytes is required!" error when accessing past session details was also fixed

- On steel-browser, you can now pass in `SKIP_FINGERPRINT_INJECTION` to override our stealth logic and use your own

### 🏡 Housekeeping
HUUUGE welcome to the newest members of the Steel team [Dane](https://x.com/daneo_w) and [JunHyoung](https://github.com/junhsss)! They’ll both be pushing tons of features to steel-browser and Steel Cloud and join us in building out the rest of the Steel universe!

### 💖 First-time contributors
Special thanks to the following new contributors who've made the above improvements possible 💖 [@jagadeshjai](https://github.com/jagadeshjai)

As always, thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

Got questions or want to chat? Join us on [Discord](https://discord.gg/steel-dev) or reach out on [Twitter/X](https://twitter.com/steeldotdev).

\
## Changelog #005 | 2025-03-26

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/AKYFQrDhCB_2-dd2MY_si.png}

Happy Wednesday, chat 🫡 We've been working hard on some key improvements to our bot detection avoidance capabilities, adding new features, and squashing bugs. Here's what's new this week:

### ⭐ New
#### Enhanced Stealth Improvements 🥷
We've made significant improvements to our stealth features and patched several fingerprinting leaks that were causing browser sessions to be flagged as bots. These updates help ensure your sessions can navigate the web more reliably without triggering anti-bot measures.

**Availability: Steel Cloud ☁️ + Steel-browser (OSS) 🔧**

#### Cloudflare Turnstile Solving ✅
We've launched an early version of Cloudflare Turnstile solving, now included in our CAPTCHA solving module within sessions. The solver works well for most common Turnstile implementations, though we're still refining it for some edge cases.

**Availability: Steel Cloud ☁️**

#### Take Control Feature in [Surf.new](http://surf.new/) 🎮
Inspired by OpenAI's Operator, we've implemented a new "Take Control" feature in [Surf.new](http://surf.new/). This allows you to:

- Pause the AI agent and manually interact with the browser

- Complete complex tasks like signing into websites

- Hand control back to the AI to continue where you left off

This showcase demonstrates the power of our debug URL capabilities, which you can integrate into your own applications.

### 🔧 Bugfixes/Improvements
- Fixed issues with the one-click deployment to Railway on steel-browser

- Better error handling for incorrect inputs

- Frontend updates for multi-tab / playback

- Various performance optimizations for browser initialization

### 💖 First-time contributors
Special thanks to [@shivamkhatri](https://github.com/shivamkhatri) for making some key PRs on Surf and steel-browser! 💖

As always, thanks for testing out Steel! We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

Got questions or want to chat? Join us on [Discord](https://discord.gg/steel-dev) or reach out on [Twitter/X](https://twitter.com/steeldotdev).

\
## Changelog #004 | 2025-03-19

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/aDM_u6zJ-T_yBeJYgkvRh.png}

Wooooooooooooo!! We got some new updates we’re pumped to share.

⭐ New
**npx create-steel-app**
The easiest way to get started with Steel just dropped!

Run `npx create-steel-app` to spin up a full project based on any of the recipes in the Steel cookbook repo.

**_Note:_** This works with pure Python projects too! As long as you have npm installed, you’ll be able quick spin up projects like Browser-use and Playwright-python on Steel!

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/jEdp6vzjOSMWbz2ePv3gO.png}

#### Multitab Support
We shipped support for multiple tabs via the debug URL. This comes with support for embedding specific pages as well as a full browser view that displays all tabs with full interactivity. Essentially a fully embeddable browser UI can now exist right in your app. Light/dark mode supported ;)

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/8LAdzG-x1Li9Nf3Q6VB4P.png}

[Documentation Link](/overview/guides/view-and-embed-live-sessions)

#### Embed and view session recordings
We’ve published an endpoint (`v1/sessions/:id/events`) and docs around how you can simply embed and view session recordings inside your app.

Here’s a code snippet of how to create an embeddable session replay component:

```typescript
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css'; // important for styling of the player

// Once you've fetched the events
const events = await client.sessions.events(session.id)

// Create player element
const playerElement = document.getElementById('player-container');

// Initialize the player with events
const player = new rrwebPlayer({
  target: playerElement,
  props: {
    events: events,
    width: 800,  // Width of the player
    height: 600, // Height of the player
    autoPlay: true,
    skipInactive: true  // Skip periods of inactivity
  }
});
```

[Documentation Link](/overview/guides/embed-session-recordings)

#### CUA x Steel
OpenAI’s Computer-use agent just dropped and it’s awesome! We’ve added a whole bunch of resources across the Steel universe to demo how the CUA agent can control a Steel browser!

- [Cookbook: Simple CUA Loop (Python)](https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-oai-computer-use-python-starter)

- [Cookbook: Simple CUA Loop (Node)](https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-oai-computer-use-node-starter)

- Coming soon to [Surf.new](http://surf.new/) 🌊

### 🔧 Bugfixes/Improvements
- Python/Node SDKs are out of beta and official starting on version `0.0.1` 🥂 This update comes with all the afore mentioned capabilities incorporated into the SDKs.

- Lots of improvements and fixes to the Surf UI

- Added guide to docs on how to re-use contexts between sessions for carrying over things like authenticated state ([docs](/overview/guides/reusing-contexts-auth))

- Patches some source of memory leak errors causing slower session times

### 🏡 Housekeeping
- Carti dropped 🗣️

### 💖 First-time contributors
Special thanks to [@PaperBoardOfficial](https://github.com/PaperBoardOfficial) for making some key PRs and issues on Surf 💖

As always, thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

\
## Changelog #003 | 2025-03-04

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/ByP4qtaUIR447nJaZqbPS.png}

Happy Tuesday everyone! This week, the team has been heads down working through customer issues/bugs/complaints (especially the trickier ones) and we have a lot of exciting stuff in the works. But first, some updates!

### ⭐ New
#### Browser Agent Leaderboard 🏆 | [leaderboard.steel.dev](https://leaderboard.steel.dev/)

We’ve been seeing some exciting new developments in the web agent space. From OpenAI Operator, to Browser Use, there’s been a ton of announcements in the last two months and the state of the art is constantly being outdone. That’s why we decided to launch a leaderboard, compiling the top ranking web agents based on WebVoyager results.

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/Bn_vj6cr558fhVAl0PJPX.png}


#### Lightning-fast Session Creation Times ⚡️

Now, when creating a session that uses that use default value (except timeout, you can change that), sessions will be booted up in ~400ms or less. This was possible due to some new scaling logic that we laid out which allows us to keep new clean browser sessions hot and ready to be used.


::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/etXHsy_awCwDv2MZrMHbX.png}

**Note:** these optimizations will not affect sessions using custom proxies or non-default session creation flags.

### 🔧 Bugfixes/Improvements
- Resizing the live session view iframe that’s returned from session.debugUrl no longer produces a black screen

- Hiding the session details tab no longer breaks the session viewer on [app.steel.dev](http://app.steel.dev/)

- Recorded DOM events are now compressed in transport, allowing for smaller sizes in transport (don’t forget to unpack when displaying recorded events)

### 💖 First-time contributors
Special thanks to [@junhsss](https://github.com/junhsss) for adding a file management API to Steel Browser. This will allow for very neat applications on both the open source repo and Steel Cloud!

As always, thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

\
## Changelog #002 | 2025-02-25
We decided to maniacally focus on the Steel UX this week and we’re crazy pumped to show you what’s new. Let’s get it 🫡

### ⭐ New
#### New Steel Dashboard Experience ✨

The Steel dashboard has a sleek new look and feel! We’ve redesigned what it feels like to use Steel Cloud and get onboarded for the first time. We focused on quickly getting started for new users and starting new projects for experienced users.

We’re super proud of this one and look forward to your feedback.

::scalar-embed[Quick run through of new Steel Quickstart Experience]{src="https://h33f0d69tq.ufs.sh/f/8f4EspggSXKHg9av2FtnfPyILuxSrCpz2BaJq7DQvTd6cZe0"}

\* Coming to the steel-browser repo experience soon!

#### Docs & cookbook updates👨‍🍳
You asked and we listened: A bunch of new resources have been created across the Steel Universe.

- *Browser-use*: We’ve added a cookbook example and quickstart guide to using browser-use with Steel. Browser-use x Steel is an insanely powerful combo we’ve seen many users deploy and wanted to help make it even easier to get started.

  - [Cookbook Example](https://github.com/steel-dev/steel-cookbook/tree/main/examples/steel-browser-use-starter) | [Quickstart Guide](/overview/integrations/browser-use/quickstart)

- *DebugURL use-cases*: We’ve added new guides to our docs with a focus on how to best leverage the powerful little debug URL you get back from a Steel session response. Check em out:

  - [Embed and view live sessions](https://docs.steel.dev/overview/guides/view-and-embed-live-sessions) | [Human in the Loop Controls](https://docs.steel.dev/overview/guides/implement-human-in-the-loop-controls)

#### Surf model updates

We’ve upgraded [surf.new](http://surf.new/) with a bunch of new models that you can try out like:

- **Deepseek** (`deepseek-chat` and `deepseek-reasoner`)

- **Gemini** (like `2.0 flash` _fast!_)

- *Claude 3.7 sonnet* (woah + _fast!_)

Or use local models running on your computer with Ollama support :)

### 🔧 Bugfixes/Improvements
- Patched issues with fetching and re-using contexts between Sessions (docs coming soon)

- DebugURL went through a variety of changes + has had it’s full capabilities rolled out to the steel-browser repo

- Added event counts to Steel Cloud’s Sessions page to make it easier to sift through sessions lists

- Steel-browser: Improved logging across the board + other upgrades (checkout the latest release here: : [v0.1.3-beta](https://github.com/steel-dev/steel-browser/releases/tag/v0.1.3-beta))

- Improved session viewer reliability across the board when viewing live sessions (even more coming!)

### 🏡 Housekeeping
This week, we welcomed [Mislav](https://x.com/mislavjc) to the Steel team! He’ll be working on making building agents on Steel even easier and more capable. You can bug him in the Steel discord server @mislavjc.

### 💖 First-time contributors
Special thanks [@hakzarov](https://github.com/hakzarov) for adding better logging for both the API and the Chrome process on the steel-browser repo!

As always, thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

\
## Changelog #001 | 2025-02-09
Happy Super Bowl Sunday 🏈 Before we settle in to lose money on our respective betting apps, we have some updates we NEED to tell you about.

### ⭐ New
Introducing [Surf.new](http://surf.new/)

[Surf.new](http://surf.new/) is an open-source playground for chatting with different web-agents via Steel. We want it to serve as a resource for the community to try out new web agents as they become available, helping developers evaluate what works best for their use-cases. Currently, you can try browser-use's web agent and a browser-specific fork of Claude’s Computer-use agent. We'll be actively maintaining it while using it as a launching pad to showcase new Steel features and improvements in web automation.

It’s pretty neat if you ask us 🤠 Give it a try and let us know what you think! Contributions are more than welcome too :)

::scalar-embed[Finding Flights on Surf]{src="https://github.com/user-attachments/assets/cc50c603-1cb8-49b1-8910-251b6beec228"}


#### Embedding and interactive with Live Sessions
Our debugURL has some new life blown into it and, oh boy, are we ever pumped about it. The debugURL you get returned when creating a session is most commonly used for viewing what’s happening live in the browser. A common use-case is embedding that view into your app, such that people can see what’s going on in the browser as actions are being taken. It’s what powers our live session viewer in the Steel dashboard.

In addition to a complete refactoring to improve performance, some of the improvements include:

- Ability to let a viewer interact with the browser sessions directly via clicking, typing, scrolling, etc. This was a big one lots of people have asked for to powering human-in-the-loop features (think “take control” in OpenAI’s Operator).

- Ability to show/hide mouse on screen

- Show/hide URL bar & to toggle be light mode or dark mode

All of which can be turned on or off via UTM params. Check out [the docs](https://docs.steel.dev/overview/guides/viewing-and-embedding-live-sessions) for more on this here!

Available on Steel Cloud and available soon on the steel-browser repo.

#### Dimensions for sessions
We now support the ability to set screen + viewport dimensions when creating a session (POST/v1/sessions).

```python
from steel import Steel

client = Steel()

session = client.sessions.create(
    dimensions={
        "width":1280,
        "height":800
    }
)
```

This helps save you from having to set page viewport on every page load. Which can cause buggy resizing behaviour with your sessions.

Available on Steel Cloud and the steel-browser repo.

### Ad blocking
You can now block ads from rendering in your sessions. This is useful for saving on proxy bandwidth, simplifying action space for agents (so they don’t have the option of clicking on ads), and generally speeding up page load times.

It’s defaulted to true when starting a session but you can explicitly turn it on/off by passing a bool into the blockAds param in the create session endpoint (POST/v1/sessions) or via the SDK like so:

```python
from steel import Steel

client = Steel()

session = client.sessions.create(
    block_ads=true
)
```

### 🔧 Fixes/Improvements
Lots of bug fixes and improvements across the board including:

- Fixed with inability to view sessions where proxy was enabled

- Better scrape errors

- Improved Proxy usage tracking

- Fixed multiple issues with Recording sessions

- Implemented graceful shutdowns

- Various dockerfile optimizations

- Custom executable paths for local browsers when running steel-browser repo locally

### 💖 First time contributors
Special thanks to the following new contributors to steel-browser who've made the above improvements possible 💖
[@marclave](https://github.com/marclave), [@krichprollsch](https://github.com/krichprollsch), [@BrentBrightling](https://github.com/BrentBrightling) , [@Envek](https://github.com/Envek), [@danew](https://github.com/danew), [@raymelon](https://github.com/raymelon), [@21e8](https://github.com/21e8), [@QAComet](https://github.com/QAComet), [@mislavjc](https://github.com/mislavjc), and [@Emmanuel-Melon](https://github.com/Emmanuel-Melon)

As always, thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community.

\
## Changelog #000 | 2024-12-20
Happy AGI day (?) & inaugural changelog post. I wanted to share some updates we made to Steel over the last few weeks!

### ⭐ New
Just launched a new MCP server for Claude Desktop integration that lets Claude visually browse & interact with the web using our Browser API and Web Voyager

Works with self-hosted, local, and cloud implementations

Built on a custom Web Voyager implementation using Bounding Boxes and Custom tools to map webpages into LLM action spaces

Check it out: https://github.com/steel-dev/steel-mcp-server

### 🔧 40+ Bugfixes like
- Fixed billing page + usage tracking issues

- Resolved rate limit errors

- Resolved session creation bugs with large request volumes

- Fixed compatibility issues with Windows for OS repo

- Improved recording extension handling, so it should be more stable now

- Resolved session viewer crashes for sites >10MB

- Fixed performance issues with loading certain sites in the open source repo

### ⚡ Improvements
- Large, complex sites now render in just a few seconds (instead of forever like before)

- Session launch time improved by ~30%

- Faster and clearer error messaging

- Enhanced session viewer stability

### 🏡 Housekeeping
- We're rolling out a Research Grants program to support AI researchers with Steel Credits! If you're working on web scraping research or exploring new ways for agents to use the web, reach out to [research@steel.dev](mailto:research@steel.dev) and we'd love to support you.

- We're hiring across engineering roles! Looking for full stack, Applied AI, and infra developers who love open source, AI, and tackling challenging problems. Plus, there's a $5,000 referral bonus if you help us find the right person! More details: https://steel-dev.notion.site/jobs-at-steel

Thanks for testing out the Steel beta. We really look forward to more of your feedback and continuing to build with this awesome, curious, and supportive community. Happy Holidays ☃️