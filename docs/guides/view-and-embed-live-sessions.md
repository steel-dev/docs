# View and Embed Live Sessions

Every Steel browser session comes with a debug URL that provides a flexible way to view and interact with the session. While Steel's dashboard includes a full-featured session viewer for monitoring your sessions, the debug URL feature allows you to implement custom viewing solutions in your applications and let viewers control browser sessions remotely.

### Prerequisites
- A Steel API key

- An active Steel browser session

- Basic familiarity with HTML and JavaScript/Python

### Getting the Debug URL
When creating a session through our API, the response includes a `debugUrl`.

Here's how to retrieve it using Steel’s SDKs:

::::scalar-tabs{}

:::scalar-tab{title="Node.js"}
```typescript
import Steel from 'steel-sdk';

const client = new Steel();
const session = await client.sessions.create();

// Get the debug URL
const debugUrl = session.debugUrl;
console.log(`Debug URL: ${debugUrl}`);
```
:::

:::scalar-tab{title="Python"}
```python
from steel import Steel

client = Steel()
session = client.sessions.create()

# Get the debug URL
debug_url = session.debug_url
print(f"Debug URL: {debug_url}")
```
:::

::::

Once you have the debug URL, you can open it directly in your browser to quickly view your session.

### Embedding Sessions in Your Application
For production use cases, you can embed the session view in your application using an iframe:

```typescript
<iframe 
  src={session.debugUrl}
  style="width: 100%; height: 600px; border: none;"
></iframe>
```

The view will automatically scale to fit the iframe container while maintaining aspect ratio.

:::scalar-callout{type=success}
Debug URLs are not authenticated. Anyone with access to a session's debug URL can view that session. Consider this when implementing session sharing features.
:::

### Configuration Options
Customize the embedded view using UTM parameters:

```typescript
<iframe 
  src={`${session.debugUrl}?theme=light&interactive=true&showControls=true`}
  style="width: 100%; height: 600px; border: none;"
></iframe>
```

Available parameters:

| Parameter      | Type    | Default  | Description                                                                                                                                                     |
| -------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageId`       | string  | (empty)  | Optional: Enables a single‐tab view of a particular pageId. You can fetch pageIds either directly from Playwright/Puppeteer or using the Live Details endpoint. |
| `pageIndex`    | string  | (empty)  | Optional: Enables a single‐tab view of tab N where N is the index passed in. For example, to display only the first page, pass in `pageIndex=0`.                |
| `theme`        | string  | `"dark"` | Visual theme of the interface (`"dark"` or `"light"`).                                                                                                          |
| `interactive`  | boolean | `true`   | When enabled, viewers can interact with the page through clicks, scrolling, and navigation.                                                                     |
| `showControls` | boolean | `true`   | Shows or hides the URL input and navigation controls.                                                                                                           |
### Common Use Cases
#### Sharing Session Views
Embed a fullscreen read-only session view:

```typescript
<iframe 
  src={`${session.debugUrl}?interactive=false&showControls=false`}
  style="width: 100%; height: 600px; border: none;"
></iframe>
```

#### Human-in-the-Loop Workflows
The debug URL feature is particularly useful for human-in-the-loop workflows, where you need to enable human intervention in automated processes. See our detailed guide on [implementing human-in-the-loop workflows](/overview/guides/implementing-human-in-the-loop-controls) for more information.

### Working with Tabs
#### Multi-tab View
By default, the debug url will return a multi-tab view of the browser. When a new page/tab is created, the viewer will auto switch to that new tab. It will not switch back if the focus is set to a previous tab. When `interactive=false` is appended to the debugUrl in the iframe, switching between tabs will be disabled (along with every other interaction), so be wary of that if you need to switch between tabs in a non-interactive view.

#### Single-tab View
When a `pageId` or a `pageIndex` is passed into the debug url, the browser view will only focus on that page and no other tabs will be shown. This is useful when you only want to present one tab to the user and either manually switch tabs (by passing in a different `pageId` or `pageIndex`) or just generally disable other pages.

### Troubleshooting
- If the iframe appears blank, ensure your session is still active and has actions sent to it like navigating to new pages.

- If interaction isn't working, verify that `interactive=true` is set

- For sizing issues, check that your container has explicit dimensions (use the `dimensions` parameter when creating your session)

- Make sure your session hasn't timed out (default timeout is 5 minutes)

### What's Next
Learn more about:

<a href="/overview/guides/implement-human-in-the-loop-controls" type="page-link" class="t-editor__page-link">
    <span>Implement Human-in-the-Loop Controls</span>
    <p>How to let users take control of Steel browser sessions</p>
</a>

<a href="/overview/sessions-api/session-lifecycle" type="page-link" class="t-editor__page-link">
    <span>Session Lifecycle</span>
    <p>Learn how to start and release browser sessions programatically.</p>
</a>