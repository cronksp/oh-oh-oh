# Production Deployment

For production, we use a **Standalone container**. Unlike development, this container contains a **copy** of your code that is optimized and "baked in".

-   **No Volume Mounts**: Changes to code on the server will NOT affect the running app until you rebuild.
-   **Optimized**: Uses Next.js "standalone" mode for smaller image sizes.

## Section 1: Online Deployment (Server has Internet)

If your target server has internet access, you can build and run everything directly on the server.

1.  Can Git pull the repo to the server.
2.  Run the deployment script:
    ```powershell
    ./scripts/online/deploy.ps1
    ```
    *(Or on Linux/Mac: `docker-compose -f docker/docker-compose.prod.yml up -d --build`)*

This will:
1.  Build the `whereabouts-app` image.
2.  Start the `whereabouts` database.
3.  **Attempt to push the database schema** (requires internet to fallback to a temporary node container).
4.  Launch the app on port 3000.

## Section 2: Offline Deployment (Air-Gapped)

If your target server CANNOT reach the internet (to pull base images like `node:alpine`), you must transfer the image manually.

### Step 1: Package on Developer Machine
On your laptop (with internet):
1.  Run the packaging script:
    ```powershell
    ./scripts/offline/package.ps1
    ```
    This creates a file named `whereabouts-app.tar`.

### Step 2: Transfer
Copy `whereabouts-app.tar` to your USB drive or secure transfer method and move it to the offline server.

### Step 3: Load and Run on Server
On the offline server (ensure `whereabouts-app.tar`, `docker/docker-compose.prod.yml`, and `scripts/` are present):

1.  Run the install script:
    ```powershell
    ./scripts/offline/install.ps1
    ```

This script will:
- Load the docker image.
- Start the containers.
- Attempt to initialize the database (requires `node:20-alpine` to be pre-loaded if strictly offline).
