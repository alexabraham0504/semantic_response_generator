const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static('.'));

// Proxy endpoint
app.get('/proxy', async (req, res) => {
    try {
        const url = req.query.url;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        console.log(`Proxying request to: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `HTTP ${response.status}: ${response.statusText}` 
            });
        }

        const html = await response.text();
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        res.send(html);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch the URL',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Proxy server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} in your browser to use the app`);
    console.log(`🔧 Proxy endpoint: http://localhost:${PORT}/proxy?url=<google-form-url>`);
});

module.exports = app; 