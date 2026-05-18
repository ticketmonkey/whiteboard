#!/usr/bin/env bash
set -e
echo "Pulling latest image..."
docker compose pull
echo "Restarting container..."
docker compose up -d
echo "Done. Whiteboard running at http://localhost:3000"
