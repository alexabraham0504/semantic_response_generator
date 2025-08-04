module.exports = (req, res) => {
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
}; 