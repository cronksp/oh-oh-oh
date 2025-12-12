# Package for Offline Deployment
Write-Host "Step 1: Building Image..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml build

Write-Host "Step 2: Saving Image to .tar file..." -ForegroundColor Cyan
docker save -o whereabouts-app.tar whereabouts-app:latest

Write-Host "Success! 'whereabouts-app.tar' created." -ForegroundColor Green
Write-Host "Transfer this file to your offline server and run: docker load -i whereabouts-app.tar" -ForegroundColor Yellow
