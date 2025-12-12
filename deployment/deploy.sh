#!/bin/bash

echo "Deploying Whereabouts..."
# ... (rest of script updates omitted for brevity, assuming complete replacement or specific line targeting)
# Actually, let's just replace the specific lines found in grep


# Check for .env.local
if [ ! -f .env.local ]; then
    echo "Error: .env.local not found!"
    exit 1
fi

# Build Docker image
echo "Building Docker image..."
docker build -t whereabouts-app .

# Stop existing container
echo "Stopping existing container..."
docker stop whereabouts-app || true
docker rm whereabouts-app || true

# Run new container
echo "Starting new container..."
docker run -d \
  --name oh-oh-oh \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.local \
  oh-oh-oh

echo "Deployment complete!"
