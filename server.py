#!/usr/bin/env python3
"""
Simple HTTP server for local development
Serves files from the current directory on http://localhost:8000
"""

import http.server
import socketserver
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == "__main__":
    # Change to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = MyHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"\n{'='*60}")
            print(f"🚀 Server running at:")
            print(f"   http://localhost:{PORT}")
            print(f"   http://127.0.0.1:{PORT}")
            print(f"{'='*60}")
            print(f"\n📁 Serving files from: {os.getcwd()}")
            print(f"\n💡 Press Ctrl+C to stop the server\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped.")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"\n❌ Port {PORT} is already in use.")
            print(f"💡 Try a different port or stop the process using port {PORT}")
            print(f"   To use a different port, edit PORT = {PORT} in this file")
        else:
            print(f"\n❌ Error: {e}")
        sys.exit(1)

