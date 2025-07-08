#!/bin/bash

set -e  # Exit on any error

echo "🧹 Docker Cleanup Script"
echo "======================="
echo "⚠️  WARNING: This will remove ALL Docker resources!"
echo "This includes containers, images, volumes, and networks from ALL projects."
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo "🛑 Stopping and removing containers from this project..."
docker-compose down -v

echo "🗑️  Removing all Docker containers..."
docker container prune -f

echo "🗑️  Removing all Docker images..."
docker image prune -a -f

echo "🗑️  Removing all Docker volumes..."
docker volume prune -f

echo "🗑️  Removing all Docker networks..."
docker network prune -f

echo "🗑️  Clearing Docker build cache..."
docker builder prune -a -f

echo "🧹 Complete system cleanup..."
docker system prune -a -f --volumes

echo "🚀 Building and starting services..."
docker compose up --build