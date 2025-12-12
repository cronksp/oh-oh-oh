# Offline Deployment Scripts

This directory contains scripts for deploying "Whereabouts" to an **air-gapped** server (no internet).

## Workflow

### Step 1: Package (On your Laptop)
**Script**: `package.ps1`

Run this on a machine with internet access and Docker installed.
```powershell
.\scripts\offline\package.ps1
```
**Output**: `whereabouts-app.tar` (in the project root).

---

### Step 2: Transfer
Copy the following to your offline server:
1.  `whereabouts-app.tar`
2.  The `scripts/` directory (or just the `offline/` folder).
3.  `docker/docker-compose.prod.yml`.

---

### Step 3: Install (On Server)
**Script**: `install.ps1`

Run this on the offline server (ensure the `.tar` file is in the same directory or project root).
```powershell
.\scripts\offline\install.ps1
```

**What it does**:
1.  Loads the Docker image from `whereabouts-app.tar`.
2.  Starts the containers using `docker-compose.prod.yml`.
3.  Attempts to initialize the database (Note: If strictly offline, you may need to ensure `node:alpine` is pre-cached for schema push, or manually migrate).
