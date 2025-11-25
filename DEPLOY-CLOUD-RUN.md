# Deploying SlideMaker to Google Cloud Run

This guide will help you deploy SlideMaker to Google Cloud Run using Docker.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK (gcloud)** installed and configured
3. **Docker** installed (for local testing)

## Quick Start

### 1. Set up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Build and Test Locally (Optional)

```bash
# Build the Docker image
docker build -t slidemaker:latest .

# Run locally on port 8080
docker run -p 8080:8080 -e PORT=8080 slidemaker:latest

# Test in browser
open http://localhost:8080
```

### 3. Deploy to Cloud Run

#### Option A: Using Cloud Build (Recommended)

```bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# The build will automatically deploy to Cloud Run
```

#### Option B: Manual Deployment

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/$PROJECT_ID/slidemaker

# Deploy to Cloud Run
gcloud run deploy slidemaker \
  --image gcr.io/$PROJECT_ID/slidemaker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1
```

### 4. Get Your Service URL

After deployment, Cloud Run will provide a URL:

```bash
gcloud run services describe slidemaker --region us-central1 --format 'value(status.url)'
```

## Configuration

### Environment Variables

Cloud Run automatically sets the `PORT` environment variable. The app will use port 8080 by default if `PORT` is not set.

### Resource Limits

Default configuration:
- **Memory**: 512Mi
- **CPU**: 1 vCPU
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10
- **Timeout**: 300 seconds

To customize, edit `cloudbuild.yaml` or use `gcloud run deploy` with custom flags.

### Custom Domain (Optional)

```bash
# Map a custom domain
gcloud run domain-mappings create \
  --service slidemaker \
  --domain yourdomain.com \
  --region us-central1
```

## Continuous Deployment

### Using Cloud Build Triggers

1. Connect your repository to Cloud Source Repositories or GitHub
2. Create a trigger:

```bash
gcloud builds triggers create github \
  --name slidemaker-deploy \
  --repo-name your-repo \
  --repo-owner your-username \
  --branch-pattern "^main$" \
  --build-config cloudbuild.yaml
```

## Monitoring

### View Logs

```bash
# Stream logs
gcloud run services logs read slidemaker --region us-central1 --follow

# View in Cloud Console
# https://console.cloud.google.com/run
```

### Monitor Performance

- **Cloud Run Metrics**: https://console.cloud.google.com/run
- **Cloud Monitoring**: https://console.cloud.google.com/monitoring

## Troubleshooting

### Container fails to start

1. Check logs: `gcloud run services logs read slidemaker --region us-central1`
2. Verify PORT is set correctly
3. Test locally first: `docker run -p 8080:8080 -e PORT=8080 slidemaker:latest`

### 502 Bad Gateway

- Check container logs for errors
- Verify the app is listening on `0.0.0.0:PORT`
- Ensure health check is passing

### Out of Memory

Increase memory allocation:

```bash
gcloud run services update slidemaker \
  --memory 1Gi \
  --region us-central1
```

## Security Best Practices

1. **Use Secrets Manager** for API keys (don't hardcode)
2. **Enable authentication** if needed: `--no-allow-unauthenticated`
3. **Use IAM** to control access
4. **Enable VPC** for private networking if required

## Cost Optimization

- **Min instances = 0**: Scales to zero when not in use
- **CPU allocation**: Only during request processing
- **Memory**: Start with 512Mi, increase if needed

## Local Development

```bash
# Run with Docker
docker build -t slidemaker:dev .
docker run -p 8080:8080 -e PORT=8080 slidemaker:dev

# Or use Python directly
PORT=8080 ./start.sh
```

## Support

For issues or questions:
- Check Cloud Run logs
- Review Dockerfile and start.sh
- Verify all paths are relative (no absolute paths)

