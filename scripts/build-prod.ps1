# Build Production Image
Write-Host "Building Production Image (Whereabouts)..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml build
Write-Host "Build Complete." -ForegroundColor Green
