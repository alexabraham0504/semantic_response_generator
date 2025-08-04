const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, '..'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

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

// Configuration endpoint
app.get('/api/config', (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Return configuration data
    const config = {
        hasApiKey: !!process.env.GEMINI_API_KEY,
        apiKeyConfigured: true, // This will be true if the environment variable is set
        environment: process.env.NODE_ENV || 'development'
    };

    res.json(config);
});

// Gemini API endpoint
app.post('/api/gemini', async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const models = [
            'gemini-2.5-pro',
            'gemini-2.0-flash-exp',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-pro'
        ];
        
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
                
                console.log(`Trying Gemini model: ${model}`);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 4096,
                            candidateCount: 1
                        },
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH", 
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Gemini API Error (${model}):`, {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText
                    });
                    
                    if (model === models[models.length - 1]) {
                        // Last model failed, throw error
                        throw new Error(`All Gemini models failed. Last error: ${response.status} - ${response.statusText}`);
                    }
                    continue; // Try next model
                }

                const data = await response.json();
                
                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error('Invalid response format from Gemini API');
                }
                
                console.log(`Successfully used Gemini model: ${model}`);
                return res.json({ 
                    text: data.candidates[0].content.parts[0].text,
                    model: model
                });
                
            } catch (error) {
                console.error(`Gemini API call error (${model}):`, error);
                
                if (model === models[models.length - 1]) {
                    // Last model failed, throw error
                    throw error;
                }
                // Continue to next model
            }
        }
    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            details: error.message 
        });
    }
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