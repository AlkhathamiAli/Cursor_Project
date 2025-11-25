#!/bin/bash
# Test script to verify Docker setup locally

set -e

echo "=========================================="
echo "🐳 Testing Docker Setup"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t slidemaker-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Docker build failed"
    exit 1
fi

echo ""
echo "🚀 Starting container on port 8080..."
echo "   Access at: http://localhost:8080"
echo "   Press Ctrl+C to stop"
echo ""

# Run the container
docker run --rm -p 8080:8080 -e PORT=8080 slidemaker-test

