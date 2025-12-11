# Deployment

## Docker Deployment

1.  **Build Image**
    ```bash
    docker build -t oh-oh-oh .
    ```

2.  **Run Container**
    ```bash
    docker run -d \
      -p 3000:3000 \
      -e DATABASE_URL="postgres://user:pass@host:5432/db" \
      -e SYSTEM_MASTER_KEY="<your-32-byte-hex-key>" \
      oh-oh-oh
    ```

## Windows (Standalone)

1.  **Prerequisites**: Node.js 20+, IIS (optional for reverse proxy).
2.  **Build**:
    ```powershell
    npm install
    npm run build
    ```
3.  **Run**:
    ```powershell
    $env:DATABASE_URL="<connection-string>"
    $env:SYSTEM_MASTER_KEY="<key>"
    npm start
    ```
    Or use a process manager like PM2.

## Database Migrations
Run migrations before starting the app in production:
```bash
npx drizzle-kit migrate
```
(Ensure you have generated migrations locally first with `npx drizzle-kit generate`).
