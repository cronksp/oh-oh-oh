# Install & Run Offline Package
Write-Host "Step 1: Loading Docker Image..." -ForegroundColor Cyan
if (!(Test-Path "whereabouts-app.tar")) {
    Write-Host "Error: 'whereabouts-app.tar' not found in current directory." -ForegroundColor Red
    exit 1
}
docker load -i whereabouts-app.tar

Write-Host "Step 2: Starting Application..." -ForegroundColor Cyan
docker-compose -f docker/docker-compose.prod.yml up -d --remove-orphans

Write-Host "Waiting for database to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "Initializing Database Schema..." -ForegroundColor Cyan
Write-Host "Note: This requires 'node:20-alpine' to be present on this machine." -ForegroundColor Yellow
# Try to run schema push, but don't fail the whole script if it fails (since we might be offline/missing build tools image)
docker run --rm --network host -v ${PWD}:/app -w /app node:20-alpine sh -c "retry=0; until nc -z localhost 5432; do echo 'Waiting for DB...'; sleep 1; retry=\$((retry+1)); if [ \$retry -gt 30 ]; then exit 1; fi; done; npm install -g drizzle-kit && npm install drizzle-orm postgres dotenv && npx drizzle-kit push"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Automated schema push failed. You may need to manually initialize the database." -ForegroundColor Magenta
}

$hostPort = $env:HOST_PORT
if (-not $hostPort -or $hostPort -eq "") { $hostPort = 3001 }
Write-Host "Deployment Complete. Whereabouts running on http://localhost:$hostPort" -ForegroundColor Green
