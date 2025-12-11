# Build Script
Write-Host "Building oh-oh-oh..."

# Install dependencies
npm install

# Build Next.js app
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
