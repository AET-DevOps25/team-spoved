#!/bin/bash

echo "Starting optimized Docker build..."

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build specific services if specified, otherwise build all
if [ "$1" ]; then
  echo "Building specific service: $1"
  docker-compose build --parallel $1
else
  echo "Building all services in parallel..."
  docker-compose build --parallel
fi

echo "Build completed!"
