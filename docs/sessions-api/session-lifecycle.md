# Session Lifecycle

Sessions are the foundation of browser automation in Steel. Each session represents an isolated browser instance that persists until it's either explicitly released or times out.

Each session can be in one of three states:

- **Live**: The session is active and ready to accept commands/connections. This is the state right after creation and during normal operation.

- **Released**: The session has been intentionally shut down, either through explicit release or timeout. Resources have been cleaned up. Can no longer accept commands/connections.

- **Failed**: Something went wrong during the session's lifetime (like a crash or connection loss). These sessions are automatically cleaned up.

Browser sessions are billed and metered by the minute. A session can last up to 24 hours depending on your plan.

Understanding how sessions live and die helps you manage resources effectively and build more reliable applications.

### Session Lifetime and Timeout
When you start a session, it stays alive for 5 minutes by default but you can change it by passing the `timeout` parameter. After the time passes, the session will be automatically released.

::::scalar-tabs{default="Node.js"}

:::scalar-tab{title="Node.js"}
```typescript
import Steel from 'steel-sdk';

const client = new Steel();

// Create session and keep it running for 10 minutes.
const session = await client.sessions.create({
  timeout: 600000 // 10 minutes (NOTE: Units are in milliseconds)
});
```
:::

:::scalar-tab{title="Python"}
```python
import os
from steel import Steel

client = Steel()

# Create session and keep it running for 10 minutes.
session = client.sessions.create(
    timeout=600000 # 10 minutes (NOTE: Units are in milliseconds)
)
```
:::

::::

**Note:** Currently, Steel doesn’t support editing a the timeout duration of a live session.

### Releasing a Session
When you're done with a session, it's best practice to release it explicitly rather than waiting for the timeout. You can release a session any time before the timeout is up by calling the `release` method.

::::scalar-tabs{default="Node.js"}

:::scalar-tab{title="Node.js"}
```typescript
const response = await client.sessions.release(session.id);
```
:::

:::scalar-tab{title="Python"}
```python
response = client.sessions.release(session.id)
```
:::

::::

### Bulk Session Release
Sometimes you need to clean up all active sessions at once. Steel provides a convenient way to do this:

::::scalar-tabs{default="Node.js"}

:::scalar-tab{title="Node.js"}
```typescript
// Release all active sessions
const response = await client.sessions.releaseAll();
console.log(response.message); // "All sessions released successfully"
```
:::

:::scalar-tab{title="Python"}
```python
# Release all active sessions
response = client.sessions.release_all()
print(response.message) # "All sessions released successfully"
```
:::

::::