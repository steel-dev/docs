# Embed Session Recordings

Every Steel browser session automatically records all page events. While Steel's dashboard includes full-featured session playback for watching past sessions, the `v1/sessions/:id/events` endpoint allows you to pull the same recorded events to implement custom playback functionality in your applications.

In this guide, you'll learn how to use the Steel Sessions API to fetch recorded events from a session and use the [rrweb-player](https://github.com/rrweb-io/rrweb/tree/master/packages/rrweb-player) library to playback those events in your own UI.

### Prerequisites
- Steel API Key

- [Steel SDK](https://github.com/steel-dev/steel-python) installed
    - Node: `npm install steel-sdk`
    - Python: `pip install steel-sdk`

- Familiarity with [Steel sessions](/overview/sessions-api/overview)

- Basic Understanding of HTML/JS

### Retrieving Session Events

To retrieve the recorded events for a specific session you can use the SDKs:

::::scalar-tabs{}

:::scalar-tab{title="Node.js"}
```typescript
const events = await client.sessions.events(session.id)
```
:::

:::scalar-tab{title="Python"}
```python
events = client.sessions.events(session_id=session.id)
```
:::

::::

or you can simply make a GET request to the events endpoint:

```bash
GET /v1/sessions/:id/events
```

Replace `:id` with the unique identifier of the session you want to retrieve. This endpoint requires authentication, so be sure to include your authentication credentials. You can learn more about that in the [API Reference for session events](/api-reference#tag/sessions/GET/v1/sessions/{id}/events).

### Replaying Sessions
The events are returned in the [RRWeb format](https://github.com/rrweb-io/rrweb), which can be replayed using the [rrweb-player](https://github.com/rrweb-io/rrweb/tree/master/packages/rrweb-player) library. Here's an example of how you can implement playback in your application with rrweb-player:

#### Step 1: Install rrweb-player
```bash
npm install --save rrweb-player
```

#### Step 2: Set up the player in your frontend application
```javascript
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

#### Step 3: Add player controls in your HTML/JSX/etc.
```php-template
<div id="player-container"></div>
```

Voilà! Now you can playback recorded events from any Steel session. As usual, if you have any questions, comments, concerns; feel free to get help in the [Discord](https://discord.gg/steel-dev).

