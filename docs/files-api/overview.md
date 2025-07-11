# Overview
How to upload, download, manage and work with files within an active session

::scalar-image{src=https://api.scalar.com/cdn/images/jBw8j7D0nDuWr2AD2vuO5/AZtqJmCS-b3Skd0l83dcH.png}

Steel provides two complementary file management systems: Session Files for working with files within active browser sessions, and Global Files for persistent file storage across your organization.

### Overview
Steel's file management system makes it easy to work with files in your automated workflows:

- **Session-Based File Operations**: Upload files to active sessions for immediate use in browser automations, download files acquired during browsing

- **Persistent File Storage**: Maintain a global file repository for reuse across multiple sessions and workflows

- **Workspace Management**: Organize and access files generated across different automation runs

- **Data Pipeline Integration**: Upload datasets once and reference them across multiple automation sessions

- **File Archival**: Automatically preserve files from completed sessions for later access

### How It Works
#### Session Files System
Files uploaded to active sessions become available within that session's isolated VM environment. These files can be used immediately with web applications and browser automation tools. When files are downloaded from the internet during a session, they become accessible through the same API. Session files persist beyond session lifecycle - files are automatically backed up when sessions end.

#### Global Files System
The Global Files API provides persistent, organization-wide file storage independent of browser sessions. Files uploaded to global storage can be referenced and mounted in any session. All session files are automatically promoted to global storage when sessions are released, creating a comprehensive file workspace.

### Session Files API
This section outlines how to interact with the filesystem inside of the VM that your session is running from. All of these files are accessible from the browser.

#### Upload Files to Session File System
```typescript
// Upload file to session environment
// Get read stream of local file
const file = fs.createReadStream("./steel.png");

// Start a session
const session = await client.sessions.create();

// Mount the file into an active session
const uploadedFile = await client.sessions.files.upload(session.id, {
  file: file, // or path in global files api or absolute url
});
```

#### List Files in a Session File System
```typescript
// List all files currently accessible inside of a session
const files = await client.session.files.list(sessionId);
files.forEach(file => {
  console.log(`${file.path} | Size: ${file.size} | Last Modified: ${file.lastModified}`);
});
```

#### Download Files from Session File System
```typescript
// Download a specific file from a session (works for active and released sessions)
const response = await client.sessions.files.download(sessionId, "path/to/file");
const fileBlob = await response.blob();

// Download all files uploaded or downloaded during a session as zip archive
const archiveResponse = await client.sessions.files.downloadArchive(sessionId);
```

#### Delete Files from Sessions File System
```typescript
// Delete a specific file from a session (works for active and released sessions)
const response = await client.sessions.files.delete(sessionId, "path/to/file");

// Delete all files uploaded or downloaded in a Session
const archiveResponse = await client.sessions.files.deleteAll(session.id);
```

### Global Files API
##### Upload File to Global Storage
```typescript
// Store files in persistent, organization-wide storage for reuse across sessions
const file = fs.createReadStream("./dataset.csv");

const globalFile = await client.files.upload({ 
    file,
   // path: "dataset.csv" // optional
});
console.log(globalFile.path); // dataset.csv

// Using the file from Global Files API in a session
// Start a session
const session = await client.sessions.create();

// Mount the local buffer stream of file into an active session
const uploadedFile = await client.sessions.files.upload(session.id, {
  file: globalFile.path
});
```

#### List All Files
```typescript
// Retrieve all files in global storage, including those from completed sessions
const files = await client.files.list();
files.forEach(file => {
  console.log(`${file.path} | Size: ${file.size} | Last Modified: ${file.lastModified}`);
});
```

#### Download Global File
```typescript
// Retrieve a file from global storage
const response = await client.files.download(file.path); // dataset.csv
const fileBlob = await response.blob();
```

#### Delete Global File
```typescript
// Remove a file from global storage
await client.files.delete(file.path);
```

### Usage in Context
#### Set File Input Values
Reference uploaded files in file input elements using CDP (Chrome DevTools Protocol).

```typescript
// Create CDP session for advanced controls
const cdpSession = await currentContext.newCDPSession(page);
const document = await cdpSession.send("DOM.getDocument");

// Find the input element
const inputNode = await cdpSession.send("DOM.querySelector", {
  nodeId: document.root.nodeId,
  selector: "#file-input"
});

// Set the uploaded file as input
await cdpSession.send("DOM.setFileInputFiles", {
  files: [uploadedSessionFile.path],
  nodeId: inputNode.nodeId,
});
```

#### Standard Playwright/Puppeteer Upload
```typescript
// For simple/smaller file uploads, 
// using standard automation library methods will look at local files
await page.setInputFiles("#file-input", [uploadedSessionFile.path]);
```

#### Complete Example
End-to-end workflow demonstrating global file management and session file operations.

```typescript
import dotenv from "dotenv";
import fs from "fs";
import { chromium } from "playwright";
import Steel from "steel-sdk";

dotenv.config();

const client = new Steel({
  steelAPIKey: process.env.STEEL_API_KEY,
});

async function main() {
  let session;
  let browser;

  try {
    // Upload dataset to global storage for reuse
    const datasetFile = new File(
      [fs.readFileSync("./data/stock-data.csv")],
      "stock-data.csv",
      { type: "text/csv" }
    );

    const globalFile = await client.files.upload({ file: datasetFile });
    console.log(`Dataset uploaded to global storage: ${globalFile.id}`);

    // Create session and mount global file
    session = await client.sessions.create();
    console.log(`Session created: ${session.sessionViewerUrl}`);

    const sessionFile = await client.sessions.files.upload(session.id, {
      file: globalFile.path
    });

    // Connect browser and use the file
    browser = await chromium.connectOverCDP(
      `wss://connect.steel.dev?apiKey=${process.env.STEEL_API_KEY}&sessionId=${session.id}`
    );

    const currentContext = browser.contexts()[0];
    const page = currentContext.pages()[0];

    // Navigate to data visualization tool
    await page.goto("<https://www.csvplot.com/>");

    // Upload file to web application using CDP
    const cdpSession = await currentContext.newCDPSession(page);
    const document = await cdpSession.send("DOM.getDocument");
    const inputNode = await cdpSession.send("DOM.querySelector", {
      nodeId: document.root.nodeId,
      selector: "#load-file",
    });

    await cdpSession.send("DOM.setFileInputFiles", {
      files: [sessionFile.path],
      nodeId: inputNode.nodeId,
    });

    // Wait for visualization and capture
    await page.waitForSelector("svg.main-svg");

    // Download all session files (original upload + any generated files)
    const archiveResponse = await client.sessions.files.download.archive(session.id);
    const zipBlob = await archiveResponse.blob();

    // Files are automatically available in global storage after session ends

  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (browser) await browser.close();
    if (session) await client.sessions.release(session.id);

    // List all available files in global storage
    const allFiles = await client.files.list();
    console.log(`Total files in storage: ${allFiles.length}`);
  }
}

main();
```