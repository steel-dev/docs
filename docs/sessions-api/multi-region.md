# Multi-region

### Overview
By default, Steel automatically selects the data center closest to the client’s request location when creating a new browser session. This ensures optimal performance and minimal latency for your browser automation tasks. However, you can also manually specify which region you want your browser session to run in using the `region` parameter.

This region selection determines the physical location of the browser instance itself, which can help reduce latency for applications targeting specific geographic areas or comply with data residency requirements.

### Automatic Region Selection
When you create a session without specifying a region, Steel automatically determines the closest data center based on your request location:

::::scalar-tabs{}

:::scalar-tab{title="Node.js"}
```typescript
import Steel from 'steel-sdk';

const client = new Steel();

// Automatically uses the closest region
const session = await client.sessions.create();
```
:::

:::scalar-tab{title="Python"}
```python
from steel import Steel

client = Steel()

# Automatically uses the closest region
session = client.sessions.create()
```
:::

::::
### Manual Region Selection
To specify a particular region for your browser session, use the `region` parameter when creating a session:

::::scalar-tabs{}

:::scalar-tab{title="Node.js"}
```typescript
import Steel from 'steel-sdk';

const client = new Steel();

// Create session in Los Angeles data center
const session = await client.sessions.create({
    region: "LAX"
});
```
:::

:::scalar-tab{title="Python"}
```python
from steel import Steel

client = Steel()

# Create session in Los Angeles data center
session = client.sessions.create(
    region="LAX"
)
```
:::

::::

### Available Regions
Steel is available in the following regions:

| Region           | Code   | Data Center Location    |
|------------------|--------|-------------------------|
| Los Angeles      | `LAX`  | Los Angeles, USA        |
| Chicago          | `ORD`  | Chicago, USA            |
| Washington DC    | `IAD`  | Washington DC, USA      |
| Mumbai           | `BOM`  | Mumbai, India           |
| Santiago         | `SCL`  | Santiago, Chile         |
| Frankfurt        | `FRA`  | Frankfurt, Germany      |
| Hong Kong        | `HKG`  | Hong Kong               |

### Region vs Proxy Selection
:::scalar-callout{type=info}
Region selection determines where your browser session runs, which is different from proxy selection. The `region` parameter controls the physical location of the browser instance, while the useProxy and proxyUrl parameters control the network routing and IP address used by the browser for web requests.
:::

You can combine region selection with proxy settings:

::::scalar-tabs{}

:::scalar-tab{title="Node.js"}
```typescript
// Browser runs in Hong Kong, but uses a US proxy for requests
const session = await client.sessions.create({
    region: "HKG",
    useProxy: true
});
```
:::

:::scalar-tab{title="Python"}
```python
# Browser runs in Hong Kong, but uses a US proxy for requests
session = client.sessions.create(
    region="HKG",
    use_proxy=True
)
```
:::

::::

We’ll be launching new features soon to allow you to control regions for proxies as well. Right now, all are US based.