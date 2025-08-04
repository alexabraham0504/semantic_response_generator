# Environment Setup Guide

## API Key Configuration

This application supports loading the Gemini API key from an environment file for enhanced security.

### Option 1: Environment File (Recommended)

1. **Create env.local file** (already created in this project)
2. **Add your API key**:
   ```
   GEMINI_API_KEY=AIzaSyBWvOxGMQhotE9xibPay49Bm2SnTkrmd0U
   ```
3. **Start the application**: Open `index.html` in your browser
4. **Automatic loading**: The API key will be automatically loaded and the input field will be disabled

### Option 2: Manual Input

1. **Open the application**: Open `index.html` in your browser
2. **Enter API key manually**: Paste your Gemini API key in the input field
3. **Proceed with form parsing**: The application will work as normal

## File Structure

```
project/
├── index.html          # Main application
├── styles.css          # Styling
├── script.js           # Main functionality
├── config.js           # Environment configuration
├── env.local           # Environment variables (your API key)
├── README.md           # Documentation
└── SETUP.md            # This setup guide
```

## Security Notes

- The `env.local` file contains your API key - keep it secure
- The API key is loaded client-side and stored in memory only
- No data is sent to external servers except for Gemini API calls
- Consider adding `env.local` to your `.gitignore` file if using version control

## Troubleshooting

### API Key Not Loading
- Ensure `env.local` file exists in the project root
- Check that the file format is correct: `GEMINI_API_KEY=your_key_here`
- Verify the file is accessible (no permission issues)

### Application Not Working
- Check browser console for error messages
- Ensure all files are in the same directory
- Try refreshing the page after creating the env.local file

### CORS Issues
- Serve the files through a local web server (not file:// protocol)
- Use a simple HTTP server like Python's `http.server` or Node.js `http-server`

## Local Development Server

### Method 1: Proxy Server (Recommended for CORS Issues)

If you're experiencing CORS errors when trying to fetch Google Forms, use the included proxy server:

#### Prerequisites:
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Open terminal/command prompt in the project directory

#### Setup and Run:
```bash
# Install dependencies
npm install

# Start the proxy server
npm start
```

The server will start on `http://localhost:3000` and automatically serve the web app with CORS-free Google Form fetching.

### Method 2: Simple HTTP Server

#### Python 3
```bash
python -m http.server 8000
```

#### Node.js
```bash
npx http-server
```

Then visit `http://localhost:8000` in your browser.

### Method 3: Manual HTML Input (Fallback)

If all server methods fail due to CORS:
1. Open the Google Form in your browser
2. Right-click → "View Page Source"
3. Copy the entire HTML content
4. Paste it into the "Or Paste Form HTML" textarea in the app
5. Click "Parse HTML" to extract questions 