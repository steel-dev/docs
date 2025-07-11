This guide provides step-by-step instructions to set up your own Steel Browser instance using Docker. The setup consists of two main components: an API service that manages Chrome instances and a user interface for interaction.

### Prerequisites
- Docker (20.10.0 or later)

- At least 4GB of RAM

- 10GB of free disk space

### Quick Start
1. Create a new directory for your Steel Browser instance:

    ```bash
    mkdir steel-browser && cd steel-browser
    ```

2. Create the following file:

    **docker-compose.yml**

    ```yaml
    services:
    api:
        image: ghcr.io/steel-dev/steel-browser-api:latest
        ports:
        - "3000:3000"
        - "9223:9223"
        volumes:
        - ./.cache:/app/.cache
        networks:
        - steel-network

    ui:
        image: ghcr.io/steel-dev/steel-browser-ui:latest
        ports:
        - "5173:80"
        depends_on:
        - api
        networks:
        - steel-network

    networks:
    steel-network:
        name: steel-network
        driver: bridge
    ```

3. Launch the containers:

    ```bash
    docker compose up -d
    ```

4. Access Steel Browser by opening `http://localhost:5173` in your web browser.

### Advanced Setup

#### Building From Source
If you prefer to build the containers yourself:

1. Clone the repository:

    ```bash
    git clone https://github.com/steel-dev/steel-browser.git
    cd steel-browser
    ```

2. Create a `.env` file (optional):

    ```bash
    API_URL=YOUR_API_URL
    ```
3. Build and start using the development compose file:

    ```bash
    docker compose -f docker-compose.dev.yml up -d --build
    ```

    _The “-d” will run the containers in the background._

#### Configuration Options
- **API Port**: Default is 3000 (also 3000 inside the container). Change in the compose file if needed

    - Heads up, changing the external facing port won’t change the fact that anything on the `steel-network` will just use internal ports — so you will also have to change the port that the api binds to, for it to be reflected in the UI

- **UI Port**: Default is 5173 (or 80 inside container). Adjust if required

- **Chrome Debugging Port**: Default is 9223. Required for browser communication

#### Volume Persistence
The `.cache` directory stores Chrome data and extensions. Mount it as a volume for persistence:

```yaml
volumes:
  - ./.cache:/app/.cache
```

### Architecture
Steel Browser consists of two main components:

1. **API Container**: Runs Chrome in headless mode, providing CDP (Chrome DevTools Protocol) services

2. **UI Container**: Nginx-based frontend for interacting with the browser

### Customizing the Build
#### Using a Different Chrome Version
The API container uses Chrome 128.0.6613.119 by default. To use a different version:

1. Create a custom Dockerfile based on the API one

2. Modify the Chrome installation section:

```
ARG CHROME_VERSION="128.0.6613.119"
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    curl \
    unzip \
    && CHROME_DEB="google-chrome-stable_${CHROME_VERSION}-1_amd64.deb" \
    && wget -q "https://mirror.cs.uchicago.edu/google-chrome/pool/main/g/google-chrome-stable/${CHROME_DEB}" \
    # ...rest of the installation...
```

#### Changing Node Version
Both containers use Node 22.13.0 by default. To use a different version, modify the build arguments:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: ./api/Dockerfile
      args:
        NODE_VERSION: 18.19.0
```

### Troubleshooting
#### Chrome Won't Start
Ensure your host has enough resources and check the API container logs:

```bash
docker logs steel-browser_api_1
```

Common issues:

- Running on ARM architecture (solution for this coming soon!)

- Insufficient memory

- Missing shared libraries

- Permission problems with `.cache` directory

#### Connectivity Issues
If the UI can't connect to the API:

1. Verify both containers are running:

    ```bash
    docker-compose ps
    ```

2. Check if the API is accessible:

    ```bash
    curl http://localhost:3000/api/health
    ```

3. Ensure the containers can communicate over the network:

    ```bash
    docker exec steel-browser_ui_1 curl http://api:3000/api/health
    ```

### Production Deployment
For production environments:

1. Use specific image versions instead of `latest`

2. Set up proper reverse proxy with HTTPS

3. Configure appropriate resource limits

Example production compose file:

```yaml
services:
  api:
    image: ghcr.io/steel-dev/steel-browser-api:sha256:...
    restart: always
    ports:
      - "3000:3000"
    deploy:
      resources:
        limits:
          memory: 2G
    volumes:
      - ./data/.cache:/app/.cache
    networks:
      - steel-network

  ui:
    image: ghcr.io/steel-dev/steel-browser-ui:sha256:...
    restart: always
    ports:
      - "5173:80"
    networks:
      - steel-network

networks:
  steel-network:
    name: steel-network
    driver: bridge
```

### Security Considerations
- Don't expose Chrome debugging port (9223) to the public internet

    - You can also choose to not expose the API as well if you’re automations/agent also run within the same network as the `ui` and `api` containers

- Set up proper authentication if deploying publicly

- Keep containers updated with the latest versions

### Updating
To update to the latest version:

```bash
docker compose pull
docker compose up -d
```

For custom builds:

```bash
git pull
docker compose -f docker-compose.dev.yml up -d --build
```

Now your Steel Browser instance is up and running on your own infrastructure!