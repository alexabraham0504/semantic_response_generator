const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Proxy endpoint
app.get('/api/proxy', async (req, res) => {
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
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Proxy server is running' });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Handle all other routes by serving the appropriate HTML files
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const validPages = ['generator', 'demo', 'parser-test'];
    
    if (validPages.includes(page)) {
        res.sendFile(path.join(__dirname, '..', `${page}.html`));
    } else {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

module.exports = app; 