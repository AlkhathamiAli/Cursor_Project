# Local Development Server

## Quick Start

### Option 1: Python Server (Recommended)
```bash
python3 server.py
```

Or simply:
```bash
./start-server.sh
```

Then open your browser to:
- **http://localhost:8000**
- **http://localhost:8000/blank.html** (for the editor)

### Option 2: Node.js Server
If you prefer Node.js, you can use:
```bash
npx http-server -p 8000 -c-1 --cors
```

### Option 3: PHP Server (if PHP is installed)
```bash
php -S localhost:8000
```

## Why Use a Local Server?

1. **Safari Compatibility**: Safari blocks `fetch()` requests from `file:///` URLs
2. **CORS Support**: APIs work properly with HTTP URLs
3. **Better Development**: More realistic environment for testing
4. **Translation API**: The MyMemory API works better with HTTP URLs

## Accessing Your Files

Once the server is running:
- Main page: http://localhost:8000/index.html
- Editor: http://localhost:8000/blank.html
- Home: http://localhost:8000/Home.html

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Changing the Port

Edit `server.py` and change the `PORT` variable if port 8000 is already in use.

