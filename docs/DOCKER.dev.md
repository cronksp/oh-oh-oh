# Whereabouts Development Workflow

This project is configured to valid development using **VS Code Dev Containers**. This ensures all developers have the same environment, tools (Git, Node, etc.), and extensions.

## Prerequisities

1.  Docker Desktop installed and running.
2.  VS Code installed.
3.  [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension for VS Code.

## How to Start (The "Right" Way)

1.  Open the project folder in VS Code.
2.  You should see a pop-up: "Reopen in Container". Click it.
3.  *Alternative*: Press `F1` -> Type "Dev Containers: Reopen in Container".

VS Code will build the container, install standard VS Code extensions, configure Git to use your local credentials, and open a terminal inside the container.

## Key Concepts

### Volume Mounting
In Development mode (`devcontainer.json` -> `docker/docker-compose.yml`), your local folder is **bound** (mounted) to `/workspace` inside the container.
-   **Changes you make in VS Code appear instantly inside the container.**
-   **Changes the app makes (logs, files) appear instantly on your machine.**

This allows for hot-reloading (`npm run dev`) to work just like it does on your local machine.

## Running the App

Once inside the Dev Container terminal:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).
