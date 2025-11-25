# Stagewise Setup for Welcome Page

## Quick Start

Stagewise is now integrated into your welcome page. To use it:

### 1. Start Your Local Server
Make sure your server is running on port 8000:
```bash
python3 server.py
```

### 2. Open Welcome Page
Navigate to: http://localhost:8000/welcome.html

### 3. Start Stagewise
In a new terminal, run:
```bash
npx stagewise@latest
```

Stagewise will automatically connect to your running server and overlay its toolbar on your welcome page.

## How to Use Stagewise

1. **Select Elements**: Click on any element on your welcome page (buttons, text, images, etc.)

2. **Issue Commands**: Use natural language to modify elements:
   - "Change the hero title color to blue"
   - "Make the CTA button larger"
   - "Add more stars to the background"
   - "Change the background gradient"

3. **Apply Changes**: Stagewise will interpret your commands and update the code automatically

## Configuration

Your `stagewise.json` file is configured with:
- **appPort**: 8000 (matches your local server)

## Elements Ready for Stagewise

The following elements on welcome.html are marked for easy selection:
- Hero card
- Hero title
- Hero subtitle  
- CTA button
- Top navigation bar
- Navigation logo
- Navigation links

## Tips

- Stagewise works best when your server is running on the configured port
- Changes are made directly to your local files
- You can undo changes using git if needed
- Stagewise toolbar appears as an overlay on your page


