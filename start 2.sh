#!/bin/bash
# Start script for Cloud Run
# Uses PORT environment variable (required by Cloud Run)

set -e

# Get PORT from environment (Cloud Run sets this, default to 8080)
PORT=${PORT:-8080}

# Ensure PORT is a valid integer
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "Error: PORT must be a number, got: $PORT"
    exit 1
fi

# Change to script directory (ensures we're in the right place)
cd "$(dirname "$0")"

# Verify we're in the app directory
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Current directory: $(pwd)"
    exit 1
fi

echo "=========================================="
echo "🚀 SlideMaker Web Server"
echo "=========================================="
echo "📁 Serving from: $(pwd)"
echo "🌐 Port: $PORT"
echo "=========================================="
echo ""

# Start Python HTTP server with CORS support and proper error handling
exec python3 -c "
import http.server
import socketserver
import os
import sys

PORT = int(os.environ.get('PORT', 8080))

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        # Add CORS headers for cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '3600')
        
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        
        # Cache control for HTML files (no cache for dynamic content)
        if self.path.endswith('.html'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        else:
            # Cache static assets for 1 hour
            self.send_header('Cache-Control', 'public, max-age=3600')
        
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom log format for Cloud Run
        message = format % args
        print(f'[{self.log_date_time_string()}] {message}', flush=True)
    
    def log_error(self, format, *args):
        # Log errors to stderr
        message = format % args
        print(f'ERROR: [{self.log_date_time_string()}] {message}', file=sys.stderr, flush=True)

try:
    with socketserver.TCPServer(('0.0.0.0', PORT), CORSRequestHandler) as httpd:
        print(f'✅ Server running on http://0.0.0.0:{PORT}', flush=True)
        print(f'📂 Serving files from: {os.getcwd()}', flush=True)
        httpd.serve_forever()
except OSError as e:
    print(f'❌ Error starting server: {e}', file=sys.stderr, flush=True)
    sys.exit(1)
except KeyboardInterrupt:
    print('\n👋 Server stopped.', flush=True)
    sys.exit(0)
"

