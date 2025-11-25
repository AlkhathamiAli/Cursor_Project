#!/bin/bash
# Docker build script for Mac - Google Cloud Artifact Registry
# Make sure Docker Desktop is running before executing this script

set -e

# Check if Docker is running
echo "🔍 Checking Docker daemon status..."
if ! docker info > /dev/null 2>&1; then
    echo ""
    echo "❌ ERROR: Docker daemon is not running!"
    echo ""
    echo "Please start Docker Desktop:"
    echo "  1. Open Docker Desktop application"
    echo "  2. Wait for it to fully start (whale icon in menu bar should be steady)"
    echo "  3. Run this script again"
    echo ""
    echo "Or start it from command line:"
    echo "  open -a Docker"
    echo ""
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

# Configuration
REGION="me-central2"
PROJECT_ID="prj-adc-gcp-coop-test"
REPOSITORY="slidemaker"
IMAGE_NAME="slidemaker"
TAG="latest"

# Full image path for Artifact Registry
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${TAG}"

echo "=========================================="
echo "🐳 Building Docker Image for Mac"
echo "=========================================="
echo "Image: ${IMAGE_TAG}"
echo "Platform: linux/amd64 (for Cloud Run compatibility)"
echo "=========================================="
echo ""

# Build with platform flag for Mac compatibility
docker build \
  --platform linux/amd64 \
  -t "${IMAGE_TAG}" \
  .

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "Next steps:"
echo "1. Authenticate with Google Cloud:"
echo "   gcloud auth configure-docker ${REGION}-docker.pkg.dev"
echo ""
echo "2. Push the image:"
echo "   docker push ${IMAGE_TAG}"
echo ""
echo "3. Deploy to Cloud Run:"
echo "   gcloud run deploy slidemaker \\"
echo "     --image ${IMAGE_TAG} \\"
echo "     --region ${REGION} \\"
echo "     --platform managed \\"
echo "     --allow-unauthenticated \\"
echo "     --port 8080"

