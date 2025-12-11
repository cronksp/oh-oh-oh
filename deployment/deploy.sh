#!/bin/bash

echo "Deploying oh-oh-oh..."

# Check for .env.local
if [ ! -f .env.local ]; then
    echo "Error: .env.local not found!"
    exit 1
fi

# Build Docker image
echo "Building Docker image..."
docker build -t oh-oh-oh .

# Stop existing container
echo "Stopping existing container..."
docker stop oh-oh-oh || true
docker rm oh-oh-oh || true

# Run new container
echo "Starting new container..."
docker run -d \
  --name oh-oh-oh \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.local \
  oh-oh-oh

echo "Deployment complete!"
