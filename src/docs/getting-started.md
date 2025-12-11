# Getting Started

## Prerequisites
- Node.js 20+
- Docker (optional, for DB)
- PostgreSQL (or MSSQL)

## Setup

1.  **Clone the repository**
    ```bash
    git clone <repo-url>
    cd oh-oh-oh
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Copy `.env.local.example` to `.env.local` and fill in the values.
    ```bash
    cp .env.local.example .env.local
    ```
    - `DATABASE_URL`: Connection string for your DB.
    - `SYSTEM_MASTER_KEY`: Generate a 32-byte hex string (e.g., `openssl rand -hex 32`).

4.  **Run Database**
    If you have Docker, you can use the provided compose file:
    ```bash
    docker-compose up -d
    ```

5.  **Push Schema**
    ```bash
    npx drizzle-kit push
    ```

6.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Dev Container
The project includes a `.devcontainer` configuration. Open the folder in VS Code and click "Reopen in Container" to get a fully configured environment.
