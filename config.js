/**
 * Configuration file for environment variables
 * Loads API keys and other configuration from env.local file
 */

class Config {
    constructor() {
        this.envVars = {};
        this.loadEnvironmentVariables();
    }

    /**
     * Load environment variables from env.local file
     */
    async loadEnvironmentVariables() {
        try {
            const response = await fetch('./env.local');
            if (response.ok) {
                const envContent = await response.text();
                this.parseEnvFile(envContent);
            } else {
                console.warn('env.local file not found, using default configuration');
            }
        } catch (error) {
            console.warn('Could not load env.local file:', error);
        }
    }

    /**
     * Parse environment file content
     */
    parseEnvFile(content) {
        const lines = content.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    this.envVars[key] = value;
                }
            }
        });
    }

    /**
     * Get environment variable value
     */
    get(key, defaultValue = null) {
        return this.envVars[key] || defaultValue;
    }

    /**
     * Get Gemini API key
     */
    getGeminiApiKey() {
        return this.get('GEMINI_API_KEY');
    }

    /**
     * Check if API key is available
     */
    hasApiKey() {
        return !!this.getGeminiApiKey();
    }
}

// Create global config instance
window.AppConfig = new Config(); 