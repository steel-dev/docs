# Implement Human-in-the-Loop Controls

Steel's debug URL feature allows you to implement human-in-the-loop workflows where users can directly interact with and control browser sessions. This is particularly useful when you need users to take temporary control of automated browser sessions.

### Prerequisites
- Basic familiarity with [Steel sessions](/overview/sessions-api/overview)

- Understanding of [debug URLs](/overview/guides/view-and-embed-live-sessions)

- A Steel API key

### Making Sessions Interactive
To enable human interaction with a session, you'll need to configure two key parameters when embedding the session viewer:

- `interactive=true`: Enables users to interact with the page through clicks, scrolling, and form inputs

- `showControls=true`: Shows the navigation bar where users can enter URLs and use forward/back controls

```typescript
<iframe 
  src={`${session.debugUrl}?interactive=true&showControls=true`}
  style="width: 100%; height: 600px; border: none;"
></iframe>
```

When both parameters are enabled, users can:

- Click and interact with elements on the page

- Scroll the page

- Enter new URLs in the navigation bar

- Use browser-style forward/back navigation

- Fill out forms and input fields

- Navigate through websites naturally

If you’re building user facing agents, this is particularly useful when you need users to:

- Take control of an automated session that needs assistance

- Enter sensitive information like login credentials

- Solve CAPTCHAs

- Verify or correct automated actions

- Demonstrate actions that will be automated

### Implementation Examples

#### React Implementation
Here's how to embed an interactive session viewer into a React Application:

```typescript
// SessionViewer.tsx
import React from 'react';

type SessionViewerProps = {
    debugURL: string;
};

const SessionViewer: React.FC<SessionViewerProps> = ({ debugURL }) => {
    return (
        <div className="session-container">
            <div 
                className="status-banner"
                style={{
                    background: '#f0f0f0',
                    padding: '10px',
                    marginBottom: '10px',
                    textAlign: 'center',
                }}
            >
                Automated session - Click inside to take control
            </div>

            <iframe 
                src={`${debugURL}?interactive=true&showControls=true`}
                style={{
                    width: '100%',
                    height: '600px',
                    border: 'none',
                }}
                title="Browser Session"
            />
        </div>
    );
};

export default SessionViewer;

// Usage in App.tsx
import React from 'react';
import SessionViewer from './SessionViewer';

const App: React.FC = () => {
    return (
        <div className="App">
            <h1>Browser Automation Dashboard</h1>
            <SessionViewer debugURL="YOUR_debug_URL" />
        </div>
    );
};

export default App;
```

### Best Practices
- Ensure your iframe container is large enough for comfortable interaction (recommended minimum height: 600px)

- Make it clear to users when they can interact with the session

- Remember that any actions taken in an interactive session affect the actual browser session & state

### What's Next
Learn about session timeouts for managing interactive sessions:

<a href="/overview/sessions-api/session-lifecycle" type="page-link" class="t-editor__page-link">
    <span>Session Lifecycle</span>
    <p>Learn how to start and release browser sessions programatically.</p>
</a>