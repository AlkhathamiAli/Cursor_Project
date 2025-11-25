# Deployment Guide for Google Cloud Run

This guide explains how to deploy SlideMaker to Google Cloud Run.

## Prerequisites

1. Google Cloud account with billing enabled
2. Google Cloud SDK (gcloud) installed
3. Docker installed (for local testing)

## Quick Deploy

### Option 1: Using Cloud Build (Recommended)

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Submit build
gcloud builds submit --config cloudbuild.yaml
```

### Option 2: Manual Deploy

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Build and push image
docker build -t gcr.io/$PROJECT_ID/slidemaker .
docker push gcr.io/$PROJECT_ID/slidemaker

# Deploy to Cloud Run
gcloud run deploy slidemaker \
  --image gcr.io/$PROJECT_ID/slidemaker \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

## Local Testing

### Test with Docker

```bash
# Build image
docker build -t slidemaker .

# Run container
docker run -p 8080:8080 -e PORT=8080 slidemaker

# Access at http://localhost:8080
```

### Test with Python (without Docker)

```bash
# Make start.sh executable
chmod +x start.sh

# Run
PORT=8080 ./start.sh
```

## Environment Variables

Cloud Run automatically sets the `PORT` environment variable. The app will use port 8080 by default if `PORT` is not set.

## Custom Domain

After deployment, you can map a custom domain in Cloud Run:

```bash
gcloud run domain-mappings create \
  --service slidemaker \
  --domain yourdomain.com \
  --region us-central1
```

## Monitoring

View logs:
```bash
gcloud run services logs read slidemaker --region us-central1
```

View metrics in Google Cloud Console:
- Navigate to Cloud Run → slidemaker → Metrics

## Troubleshooting

### Port already in use
- Cloud Run automatically assigns ports, but ensure your app listens on `0.0.0.0` (not `localhost`)

### CORS issues
- The start.sh script includes CORS headers for cross-origin requests

### Static files not loading
- Ensure all paths are relative (using `./` not absolute paths)
- Check that files are copied to the Docker image (check .dockerignore)

