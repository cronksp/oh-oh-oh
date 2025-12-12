# Online Deployment Scripts

This directory contains scripts for deploying "Whereabouts" to a server that **has internet access**.

## `deploy.ps1`

**Purpose**: One-click deployment. Builds the image, starts the container, and initializes the database.

**Usage**:
Run this script from the **Project Root**:
```powershell
.\scripts\online\deploy.ps1
```

**What it does**:
1.  Builds the Docker image locally.
2.  Starts the `whereabouts-app` container.
3.  Starts the `whereabouts` database.
4.  Pushes the database schema (requires internet to pull `node:alpine` helper).
