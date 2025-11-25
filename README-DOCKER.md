# Docker & Cloud Run Setup

This project is configured for production deployment to Google Cloud Run using Docker.

## Quick Start

### Local Testing

```bash
# Build the Docker image
docker build -t slidemaker:latest .

# Run locally
docker run -p 8080:8080 -e PORT=8080 slidemaker:latest

# Access at http://localhost:8080
```

### Deploy to Cloud Run

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

## File Structure

- **Dockerfile**: Production-ready container configuration
- **.dockerignore**: Files excluded from Docker build
- **start.sh**: Startup script that runs on port $PORT (Cloud Run requirement)
- **cloudbuild.yaml**: Cloud Build configuration for automated deployment

## Key Features

✅ **Port Configuration**: Uses `$PORT` environment variable (required by Cloud Run)  
✅ **Relative Paths**: All file paths are relative (no absolute system paths)  
✅ **Security**: Runs as non-root user  
✅ **CORS Support**: Includes CORS headers for cross-origin requests  
✅ **Health Checks**: Built-in health check for Cloud Run  
✅ **Error Handling**: Proper error handling and logging  

## Requirements

- Python 3.11+ (included in Docker image)
- Port: Uses `$PORT` env var (defaults to 8080)
- Memory: Minimum 512Mi recommended
- CPU: 1 vCPU sufficient for most workloads

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to listen on | `8080` |

## Troubleshooting

### Container won't start
- Check logs: `docker logs <container-id>`
- Verify PORT is set: `echo $PORT`
- Test locally first

### Files not found
- Ensure all paths are relative (use `./` not absolute paths)
- Check `.dockerignore` isn't excluding needed files

### Port issues
- Cloud Run sets `PORT` automatically
- App listens on `0.0.0.0:PORT` (not `localhost`)

## Production Checklist

- [x] All paths are relative
- [x] PORT environment variable support
- [x] Non-root user in container
- [x] Health checks configured
- [x] CORS headers included
- [x] Error handling implemented
- [x] Security headers added
- [x] No sensitive data in image

