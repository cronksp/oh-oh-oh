# Deploy Production (Internet Access Required to pull images)
Write-Host "Deploying Whereabouts Production Environment..." -ForegroundColor Green
docker-compose -f docker/docker-compose.prod.yml up -d --build --remove-orphans

Write-Host "Waiting for database to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "Initializing Database Schema..." -ForegroundColor Cyan
# Run a temporary node container (mounting source) to push schema, since prod container is standalone/optimized
# Note: This requires internet access to pull node:20-alpine if not present
docker run --rm --network host -v ${PWD}:/app -w /app node:20-alpine sh -c "retry=0; until nc -z localhost 5432; do echo 'Waiting for DB...'; sleep 1; retry=\$((retry+1)); if [ \$retry -gt 30 ]; then exit 1; fi; done; npm install -g drizzle-kit && npm install drizzle-orm postgres dotenv && npx drizzle-kit push"

$hostPort = $env:HOST_PORT
if (-not $hostPort -or $hostPort -eq "") { $hostPort = 3001 }
Write-Host "Deployment Complete. Whereabouts running on http://localhost:$hostPort" -ForegroundColor Green
