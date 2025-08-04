/**
 * Google Form Response Generator with Gemini AI
 * A complete web application for generating AI-powered responses with controlled sentiment
 */

class GoogleFormResponseGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupSentimentSliders();
        this.personalInfoKeywords = [
            'name', 'email', 'phone', 'contact', 'address', 'personal',
            'first name', 'last name', 'full name', 'phone number',
            'email address', 'contact information', 'personal information',
            'what is your name', 'what\'s your name', 'your name',
            'phone number', 'mobile number', 'cell phone', 'home phone',
            'work phone', 'email address', 'e-mail', 'e mail',
            'contact number', 'contact details', 'personal details'
        ];
        this.generatedResponses = [];
    }

    /**
     * Initialize all DOM elements
     */
    initializeElements() {
        // API Key elements
        this.apiKeyInput = document.getElementById('apiKey');
        this.toggleApiKeyBtn = document.getElementById('toggleApiKey');
        
        // Form parsing elements
        this.formUrlInput = document.getElementById('formUrl');
        this.parseBtn = document.getElementById('parseBtn');
        this.parseBtnText = this.parseBtn.querySelector('.btn-text');
        this.parseBtnSpinner = this.parseBtn.querySelector('.loading-spinner');
        
        // Manual HTML parsing elements
        this.formHtmlInput = document.getElementById('formHtml');
        this.parseHtmlBtn = document.getElementById('parseHtmlBtn');
        this.parseHtmlBtnText = this.parseHtmlBtn.querySelector('.btn-text');
        this.parseHtmlBtnSpinner = this.parseHtmlBtn.querySelector('.loading-spinner');
        
        // Sentiment sliders
        this.positiveSlider = document.getElementById('positiveSlider');
        this.neutralSlider = document.getElementById('neutralSlider');
        this.negativeSlider = document.getElementById('negativeSlider');
        this.positiveValue = document.getElementById('positiveValue');
        this.neutralValue = document.getElementById('neutralValue');
        this.negativeValue = document.getElementById('negativeValue');
        this.totalValue = document.getElementById('totalValue');
        this.totalStatus = document.getElementById('totalStatus');
        
        // Response generation elements
        this.responseCountInput = document.getElementById('responseCount');
        this.generateBtn = document.getElementById('generateBtn');
        this.generateBtnText = this.generateBtn.querySelector('.btn-text');
        this.generateBtnSpinner = this.generateBtn.querySelector('.loading-spinner');
        
        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.responsesContainer = document.getElementById('responsesContainer');
        this.exportCsvBtn = document.getElementById('exportCsvBtn');
        this.exportJsonBtn = document.getElementById('exportJsonBtn');
        
        // Error elements
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Sentiment section
        this.sentimentSection = document.getElementById('sentimentSection');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // API key toggle
        this.toggleApiKeyBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
        
        // Form parsing
        this.parseBtn.addEventListener('click', () => this.parseForm());
        this.formUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.parseForm();
        });
        
        // Manual HTML parsing
        this.parseHtmlBtn.addEventListener('click', () => this.parseFormHtml());
        
        // Response generation
        this.generateBtn.addEventListener('click', () => this.generateResponses());
        
        // Export functionality
        this.exportCsvBtn.addEventListener('click', () => this.exportToCSV());
        this.exportJsonBtn.addEventListener('click', () => this.exportToJSON());
        
        // API key validation
        this.apiKeyInput.addEventListener('input', () => this.validateApiKey());
        
        // Initial validation after config loads
        setTimeout(() => this.validateApiKey(), 100);
    }

    /**
     * Setup sentiment sliders with linked behavior
     */
    setupSentimentSliders() {
        const sliders = [this.positiveSlider, this.neutralSlider, this.negativeSlider];
        
        sliders.forEach(slider => {
            slider.addEventListener('input', () => this.updateSentimentValues());
        });
        
        // Initialize values
        this.updateSentimentValues();
    }

    /**
     * Update sentiment values and validate total
     */
    updateSentimentValues() {
        const positive = parseInt(this.positiveSlider.value);
        const neutral = parseInt(this.neutralSlider.value);
        const negative = parseInt(this.negativeSlider.value);
        const total = positive + neutral + negative;
        
        // Update display values
        this.positiveValue.textContent = positive;
        this.neutralValue.textContent = neutral;
        this.negativeValue.textContent = negative;
        this.totalValue.textContent = total;
        
        // Update status
        if (total === 100) {
            this.totalStatus.textContent = '✓ Valid';
            this.totalStatus.className = 'total-status valid';
            this.generateBtn.disabled = false;
        } else {
            this.totalStatus.textContent = `✗ Invalid (${total}%)`;
            this.totalStatus.className = 'total-status invalid';
            this.generateBtn.disabled = true;
        }
    }

    /**
     * Toggle API key visibility
     */
    toggleApiKeyVisibility() {
        const type = this.apiKeyInput.type === 'password' ? 'text' : 'password';
        this.apiKeyInput.type = type;
        this.toggleApiKeyBtn.querySelector('.eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
    }

    /**
     * Validate API key presence
     */
    validateApiKey() {
        // Check if API key is available from environment
        const envApiKey = window.AppConfig?.getGeminiApiKey();
        const inputApiKey = this.apiKeyInput.value.trim();
        const hasApiKey = envApiKey || inputApiKey.length > 0;
        
        // If environment API key is available, use it and disable input
        if (envApiKey) {
            this.apiKeyInput.value = envApiKey;
            this.apiKeyInput.disabled = true;
            this.toggleApiKeyBtn.disabled = true;
            this.apiKeyInput.style.background = '#f3f4f6';
            this.apiKeyInput.placeholder = 'API key loaded from environment';
        }
        
        // Since API section is hidden, always enable parse button if we have any API key
        this.parseBtn.disabled = !hasApiKey;
        return hasApiKey;
    }

    /**
     * Parse Google Form and extract questions
     */
    async parseForm() {
        const url = this.formUrlInput.value.trim();
        const envApiKey = window.AppConfig?.getGeminiApiKey();
        const inputApiKey = this.apiKeyInput.value.trim();
        const apiKey = envApiKey || inputApiKey;
        
        if (!apiKey) {
            this.showError('Please ensure env.local file contains GEMINI_API_KEY or contact administrator for API key setup');
            return;
        }
        
        if (!url) {
            this.showError('Please enter a Google Form URL');
            return;
        }

        if (!this.isValidGoogleFormUrl(url)) {
            this.showError('Please enter a valid Google Form URL');
            return;
        }

        this.setParseLoading(true);
        this.hideError();
        this.hideResults();

        try {
            const questions = await this.extractQuestions(url);
            this.displayQuestions(questions);
            this.showSentimentSection();
        } catch (error) {
            console.error('Error parsing form:', error);
            this.showError('Failed to parse the form. Please check the URL and try again.');
        } finally {
            this.setParseLoading(false);
        }
    }

    /**
     * Parse Google Form HTML manually
     */
    async parseFormHtml() {
        const htmlContent = this.formHtmlInput.value.trim();
        const envApiKey = window.AppConfig?.getGeminiApiKey();
        const inputApiKey = this.apiKeyInput.value.trim();
        const apiKey = envApiKey || inputApiKey;
        
        if (!apiKey) {
            this.showError('Please ensure env.local file contains GEMINI_API_KEY or contact administrator for API key setup');
            return;
        }
        
        if (!htmlContent) {
            this.showError('Please paste the Google Form HTML content');
            return;
        }

        this.setParseHtmlLoading(true);
        this.hideError();
        this.hideResults();

        try {
            const questions = this.parseGoogleFormData(htmlContent);
            const result = this.filterPersonalInfo(questions);
            this.displayQuestions(result);
            this.showSentimentSection();
        } catch (error) {
            console.error('Error parsing form HTML:', error);
            this.showError('Failed to parse the form HTML. Please check that you copied the complete HTML content.');
        } finally {
            this.setParseHtmlLoading(false);
        }
    }

    /**
     * Validate Google Form URL format
     */
    isValidGoogleFormUrl(url) {
        const googleFormPattern = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[a-zA-Z0-9_-]+\/viewform/;
        return googleFormPattern.test(url);
    }

    /**
     * Extract questions from Google Form
     * Only parses actual Google Form data, no mock questions
     */
    async extractQuestions(url) {
        try {
            // Fetch the actual form HTML
            const formHtml = await this.fetchGoogleFormHtml(url);
            const questions = this.parseGoogleFormData(formHtml);
            return this.filterPersonalInfo(questions);
        } catch (error) {
            console.error('Failed to parse Google Form:', error);
            throw new Error(`Could not parse the Google Form. Please try one of these solutions:

1. Use the manual HTML input method below
2. Run the proxy server: npm install && npm start
3. Check that the URL is correct and the form is public

Error: ${error.message}`);
        }
    }

    /**
     * Fetch Google Form HTML content using multiple CORS proxies
     */
    async fetchGoogleFormHtml(url) {
        const proxies = [
            // Direct fetch
            {
                name: 'Direct',
                fetch: () => fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                })
            },
            // AllOrigins proxy
            {
                name: 'AllOrigins',
                fetch: () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'text/html'
                    }
                })
            },
            // CORS Anywhere proxy
            {
                name: 'CORS Anywhere',
                fetch: () => fetch(`https://cors-anywhere.herokuapp.com/${url}`, {
                    method: 'GET',
                    headers: {
                        'Origin': window.location.origin,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
            },
            // JSONP proxy
            {
                name: 'JSONP Proxy',
                fetch: () => fetch(`https://thingproxy.freeboard.io/fetch/${url}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'text/html'
                    }
                })
            },
            // Local development proxy (if running on localhost)
            {
                name: 'Local Proxy',
                fetch: () => fetch(`http://localhost:3000/proxy?url=${encodeURIComponent(url)}`, {
                    method: 'GET'
                })
            }
        ];

        for (const proxy of proxies) {
            try {
                console.log(`Trying ${proxy.name} proxy...`);
                const response = await proxy.fetch();
                
                if (!response.ok) {
                    console.log(`${proxy.name} failed with status: ${response.status}`);
                    continue;
                }
                
                const html = await response.text();
                
                // Verify we got actual HTML content
                if (html.includes('<html') && html.includes('FB_PUBLIC_LOAD_DATA_')) {
                    console.log(`Successfully fetched HTML using ${proxy.name}`);
                    return html;
                } else {
                    console.log(`${proxy.name} returned invalid HTML content`);
                    continue;
                }
            } catch (error) {
                console.log(`${proxy.name} failed:`, error.message);
                continue;
            }
        }
        
        throw new Error(`All fetch methods failed. Please try the manual HTML input method below.`);
    }

    /**
     * Parse Google Form data from HTML content
     * Extracts FB_PUBLIC_LOAD_DATA_ variable and parses form questions
     */
    parseGoogleFormData(htmlContent) {
        try {
            // Extract the FB_PUBLIC_LOAD_DATA_ variable
            const fbDataMatch = htmlContent.match(/var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*?\]);/s);
            
            if (!fbDataMatch) {
                throw new Error('FB_PUBLIC_LOAD_DATA_ variable not found in form HTML');
            }
            
            console.log('Found FB_PUBLIC_LOAD_DATA_ variable, length:', fbDataMatch[1].length);
            
            // Parse the JSON data
            const fbData = JSON.parse(fbDataMatch[1]);
            
            console.log('Parsed FB data structure:', {
                length: fbData.length,
                type: typeof fbData,
                isArray: Array.isArray(fbData),
                firstFewElements: fbData.slice(0, 3)
            });
            
            // Extract questions from the parsed data
            let questions = this.extractQuestionsFromFBData(fbData);
            
            console.log('Extracted questions from FB data:', questions);
            
            // If no questions found in FB data, try HTML parsing as fallback
            if (questions.length === 0) {
                console.log('No questions found in FB data, trying HTML parsing...');
                questions = this.extractQuestionsFromHTML(htmlContent);
                console.log('Extracted questions from HTML:', questions);
            }
            
            return questions;
        } catch (error) {
            console.error('Error in parseGoogleFormData:', error);
            throw new Error(`Failed to parse form data: ${error.message}`);
        }
    }

    /**
     * Extract questions from FB_PUBLIC_LOAD_DATA_ structure
     */
    extractQuestionsFromFBData(fbData) {
        const questions = [];
        
        try {
            // Navigate through the FB data structure to find questions
            const questionsData = this.findQuestionsInFBData(fbData);
            
            if (!questionsData || !Array.isArray(questionsData)) {
                throw new Error('No questions data found in FB_PUBLIC_LOAD_DATA_');
            }
            
            // Group questions with their options
            const groupedQuestions = this.groupQuestionsWithOptions(questionsData);
            
            console.log('Grouped questions:', groupedQuestions);
            
            groupedQuestions.forEach((questionData, index) => {
                if (this.isValidQuestion(questionData)) {
                    const question = this.parseQuestionData(questionData, index + 1);
                    if (question) {
                        questions.push(question);
                    }
                }
            });
            
            return questions;
        } catch (error) {
            console.error('Error extracting questions from FB data:', error);
            return [];
        }
    }

    /**
     * Group questions with their options to avoid treating options as separate questions
     */
    groupQuestionsWithOptions(questionsData) {
        const groupedQuestions = [];
        let currentQuestion = null;
        let currentOptions = [];
        
        console.log('Starting to group questions with options...');
        
        for (let i = 0; i < questionsData.length; i++) {
            const item = questionsData[i];
            
            if (!Array.isArray(item) || item.length < 2) continue;
            
            const questionText = item[0] || '';
            
            console.log(`Item ${i}: "${questionText}" - isMainQuestion: ${this.isMainQuestion(questionText)}, isOption: ${this.isOptionText(questionText)}`);
            
            // Check if this is a main question (not an option)
            if (this.isMainQuestion(questionText)) {
                // Save previous question if exists
                if (currentQuestion) {
                    currentQuestion.options = currentOptions;
                    groupedQuestions.push(currentQuestion);
                    console.log(`Saved question with ${currentOptions.length} options`);
                }
                
                // Start new question
                currentQuestion = {
                    questionData: item,
                    options: []
                };
                currentOptions = [];
                console.log(`Started new question: "${questionText}"`);
            } else if (this.isOptionText(questionText)) {
                // This is an option for the current question
                if (currentQuestion) {
                    currentOptions.push(questionText);
                    console.log(`Added option: "${questionText}"`);
                }
            }
        }
        
        // Add the last question
        if (currentQuestion) {
            currentQuestion.options = currentOptions;
            groupedQuestions.push(currentQuestion);
            console.log(`Saved final question with ${currentOptions.length} options`);
        }
        
        console.log('Final grouped questions:', groupedQuestions);
        return groupedQuestions;
    }

    /**
     * Check if text represents a main question (not an option)
     */
    isMainQuestion(text) {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase();
        
        // Check for question indicators
        const questionWords = [
            'what', 'how', 'why', 'when', 'where', 'which', 'who', 
            'describe', 'explain', 'tell', 'select', 'choose', 'rate',
            'provide', 'frequent', 'reported', 'satisfied', 'condition',
            'please provide', 'if you have', 'approximate response time'
        ];
        
        const hasQuestionWord = questionWords.some(word => lowerText.includes(word));
        const hasQuestionMark = text.includes('?');
        const hasActionWord = lowerText.includes('please') || lowerText.includes('rate') || 
                             lowerText.includes('select') || lowerText.includes('choose') ||
                             lowerText.includes('provide') || lowerText.includes('mention');
        
        // Check if it's a longer text (likely a question)
        const isLongText = text.length > 40;
        
        // Check if it's not just an option
        const isOption = this.isOptionText(text);
        
        // Must have question characteristics AND be longer than a simple option AND not be an option
        return (hasQuestionWord || hasQuestionMark || hasActionWord) && !isOption && isLongText;
    }

    /**
     * Check if text represents an option (not a main question)
     */
    isOptionText(text) {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase();
        
        // Common option patterns
        const optionPatterns = [
            'excellent', 'good', 'average', 'poor', 'very satisfied', 'satisfied',
            'neutral', 'dissatisfied', 'very dissatisfied', 'clear selection',
            'your answer', 'restrooms', 'library', 'cafeteria', 'canteen',
            'sports facilities', 'laboratories', 'drinking water stations',
            'parking areas', 'seating in common areas', 'campus greenery',
            'landscaping', 'student center', 'union', 'arts', 'humanities hall',
            'main academic block', 'science & technology building', 'library building',
            'choose', 'select all that apply'
        ];
        
        // Check if text matches option patterns
        const matchesOption = optionPatterns.some(pattern => lowerText.includes(pattern));
        
        // Check if it's a short standalone text without question indicators
        const isShortText = text.length < 50 && !text.includes('?') && !text.includes('what') && 
                           !text.includes('how') && !text.includes('which') && !text.includes('please');
        
        // Check if it's just a single word or short phrase (likely an option)
        const isSingleWord = text.split(' ').length <= 3 && !text.includes('?');
        
        // Check if it's a common facility/amenity name (definitely an option)
        const facilityNames = [
            'restrooms', 'library', 'cafeteria', 'canteen', 'sports facilities', 
            'laboratories', 'drinking water stations', 'parking areas', 
            'seating in common areas', 'campus greenery', 'landscaping'
        ];
        const isFacilityName = facilityNames.some(name => lowerText.includes(name));
        
        // If it's a single word or very short phrase, it's likely an option
        const isVeryShort = text.trim().split(' ').length <= 2 && text.length < 30;
        
        return matchesOption || (isShortText && isSingleWord) || isFacilityName || isVeryShort;
    }

    /**
     * Fallback method to extract questions from HTML directly
     */
    extractQuestionsFromHTML(htmlContent) {
        const questions = [];
        
        try {
            // Look for question elements in the HTML
            const questionSelectors = [
                'div[role="listitem"]',
                '.freebirdFormviewerViewItemsItemItem',
                '.freebirdFormviewerViewItemsItemItemTitle',
                '[data-item-id]'
            ];
            
            // Create a temporary DOM element to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            
            for (const selector of questionSelectors) {
                const elements = tempDiv.querySelectorAll(selector);
                console.log(`Found ${elements.length} elements with selector: ${selector}`);
                
                elements.forEach((element, index) => {
                    const text = element.textContent?.trim();
                    if (text && text.length > 0) {
                        // Try to determine question type from HTML structure
                        const type = this.determineQuestionTypeFromHTML(element);
                        
                        questions.push({
                            text: text,
                            type: type,
                            options: [],
                            isPersonalInfo: false
                        });
                    }
                });
                
                if (questions.length > 0) {
                    console.log(`Successfully extracted ${questions.length} questions from HTML`);
                    break;
                }
            }
            
            return questions;
        } catch (error) {
            console.error('Error extracting questions from HTML:', error);
            return [];
        }
    }

    /**
     * Determine question type from HTML element
     */
    determineQuestionTypeFromHTML(element) {
        const html = element.innerHTML.toLowerCase();
        
        // Check for multiple choice indicators
        if (html.includes('radio') || html.includes('radiogroup')) {
            return 'multiple_choice';
        }
        
        // Check for checkbox indicators
        if (html.includes('checkbox') || html.includes('checkboxes')) {
            return 'checkboxes';
        }
        
        // Check for textarea indicators
        if (html.includes('textarea') || html.includes('paragraph')) {
            return 'long_answer';
        }
        
        // Check for text input indicators
        if (html.includes('text') || html.includes('input')) {
            return 'short_answer';
        }
        
        // Default to short answer
        return 'short_answer';
    }

    /**
     * Find questions array in FB_PUBLIC_LOAD_DATA_ structure
     */
    findQuestionsInFBData(fbData) {
        console.log('Searching for questions in FB data structure:', fbData);
        
        // Method 1: Try common locations first
        const commonIndices = [1, 2, 3, 4, 5];
        for (const index of commonIndices) {
            if (fbData[index] && Array.isArray(fbData[index])) {
                const potentialQuestions = fbData[index];
                console.log(`Checking index ${index}:`, potentialQuestions);
                
                if (this.containsQuestions(potentialQuestions)) {
                    console.log(`Found questions at index ${index}`);
                    return potentialQuestions;
                }
            }
        }
        
        // Method 2: Recursive search through all arrays
        const questions = this.recursiveSearchForQuestions(fbData);
        if (questions) {
            console.log('Found questions through recursive search');
            return questions;
        }
        
        // Method 3: Look for specific patterns
        const patternQuestions = this.findQuestionsByPattern(fbData);
        if (patternQuestions) {
            console.log('Found questions by pattern matching');
            return patternQuestions;
        }
        
        console.log('No questions found in any method');
        return null;
    }

    /**
     * Check if an array contains question-like objects
     */
    containsQuestions(array) {
        if (!Array.isArray(array) || array.length === 0) return false;
        
        // Count how many items look like questions
        let questionCount = 0;
        for (const item of array) {
            if (this.isValidQuestion(item)) {
                questionCount++;
            }
        }
        
        // If more than 50% of items look like questions, consider it a questions array
        return questionCount > 0 && questionCount >= array.length * 0.3;
    }

    /**
     * Recursively search for questions in nested arrays
     */
    recursiveSearchForQuestions(data, depth = 0) {
        if (depth > 5) return null; // Prevent infinite recursion
        
        if (Array.isArray(data)) {
            // Check if this array itself contains questions
            if (this.containsQuestions(data)) {
                return data;
            }
            
            // Search through each element
            for (const item of data) {
                const result = this.recursiveSearchForQuestions(item, depth + 1);
                if (result) return result;
            }
        }
        
        return null;
    }

    /**
     * Find questions by looking for specific patterns in the data structure
     */
    findQuestionsByPattern(fbData) {
        // Look for arrays that contain objects with question-like properties
        for (let i = 0; i < fbData.length; i++) {
            const element = fbData[i];
            if (Array.isArray(element)) {
                for (const item of element) {
                    if (Array.isArray(item) && item.length >= 3) {
                        // Check if this looks like a question structure
                        if (typeof item[0] === 'string' && item[0].length > 0) {
                            // This might be a question - check if there are more like it
                            const similarItems = element.filter(elem => 
                                Array.isArray(elem) && 
                                typeof elem[0] === 'string' && 
                                elem[0].length > 0
                            );
                            
                            if (similarItems.length >= 2) {
                                console.log(`Found question pattern at index ${i}`);
                                return element;
                            }
                        }
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Check if a data item represents a valid question
     */
    isValidQuestion(questionData) {
        // Handle grouped question structure
        if (questionData.questionData) {
            return this.isValidQuestion(questionData.questionData);
        }
        
        // Basic validation
        if (!questionData || !Array.isArray(questionData) || questionData.length < 2) {
            return false;
        }
        
        // Check if first element is a non-empty string (question text)
        const questionText = questionData[0];
        if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
            return false;
        }
        
        // Additional validation: check for common question patterns
        const text = questionText.toLowerCase();
        
        // Skip if it's clearly not a question (e.g., metadata, instructions)
        if (text.includes('page') || text.includes('section') || text.includes('header')) {
            return false;
        }
        
        // Check if it looks like a question (contains question words or ends with ?)
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'which', 'who', 'describe', 'explain', 'tell', 'select', 'choose'];
        const hasQuestionWord = questionWords.some(word => text.includes(word));
        const endsWithQuestionMark = text.includes('?');
        const hasActionWord = text.includes('please') || text.includes('enter') || text.includes('fill');
        
        // Consider it a question if it has question characteristics
        return hasQuestionWord || endsWithQuestionMark || hasActionWord || questionData.length >= 3;
    }

    /**
     * Parse individual question data into our standard format
     */
    parseQuestionData(questionData, questionNumber) {
        try {
            let questionText, questionType, options;
            
            // Handle grouped question structure
            if (questionData.questionData) {
                // This is a grouped question with options
                questionText = questionData.questionData[0] || '';
                questionType = this.determineQuestionType(questionData.questionData);
                options = questionData.options || [];
            } else {
                // This is a regular question data array
                questionText = questionData[0] || '';
                questionType = this.determineQuestionType(questionData);
                options = this.extractQuestionOptions(questionData);
            }
            
            return {
                text: questionText,
                type: questionType,
                options: options,
                isPersonalInfo: false // Will be determined by filterPersonalInfo
            };
        } catch (error) {
            console.error(`Error parsing question ${questionNumber}:`, error);
            return null;
        }
    }

    /**
     * Determine question type from Google Form data structure
     */
    determineQuestionType(questionData) {
        try {
            // Google Form question types are encoded in the data structure
            // We need to examine various properties to determine the type
            
            // Check for question type indicators in the data
            const questionTypeData = questionData[3] || [];
            
            // Look for type indicators in the question data
            if (questionData[4] && Array.isArray(questionData[4])) {
                const typeIndicators = questionData[4];
                
                // Check for multiple choice indicators
                if (typeIndicators.some(item => item === 0 || item === 1)) {
                    return 'multiple_choice';
                }
                
                // Check for checkbox indicators
                if (typeIndicators.some(item => item === 2)) {
                    return 'checkboxes';
                }
            }
            
            // Check for text input types
            if (questionData[1] && questionData[1].includes('text')) {
                // Determine if it's short or long answer based on length
                const maxLength = this.extractMaxLength(questionData);
                return maxLength > 100 ? 'long_answer' : 'short_answer';
            }
            
            // Check for paragraph text (long answer)
            if (questionData[1] && questionData[1].includes('paragraph')) {
                return 'long_answer';
            }
            
            // Check for short text input
            if (questionData[1] && questionData[1].includes('short')) {
                return 'short_answer';
            }
            
            // Default to short answer if we can't determine
            return 'short_answer';
        } catch (error) {
            console.error('Error determining question type:', error);
            return 'short_answer';
        }
    }

    /**
     * Extract question options for multiple choice and checkbox questions
     */
    extractQuestionOptions(questionData) {
        try {
            const options = [];
            
            // Options are typically stored in questionData[1] or questionData[4]
            const optionsData = questionData[1] || questionData[4] || [];
            
            if (Array.isArray(optionsData)) {
                optionsData.forEach(option => {
                    if (option && typeof option === 'string') {
                        options.push(option);
                    } else if (option && Array.isArray(option) && option[0]) {
                        options.push(option[0]);
                    }
                });
            }
            
            return options;
        } catch (error) {
            console.error('Error extracting question options:', error);
            return [];
        }
    }

    /**
     * Extract maximum length for text input questions
     */
    extractMaxLength(questionData) {
        try {
            // Look for length constraints in the question data
            const constraints = questionData[3] || [];
            if (Array.isArray(constraints)) {
                for (let i = 0; i < constraints.length; i++) {
                    if (typeof constraints[i] === 'number' && constraints[i] > 0) {
                        return constraints[i];
                    }
                }
            }
            return 100; // Default length
        } catch (error) {
            return 100;
        }
    }



    /**
     * Filter out personal information questions
     */
    filterPersonalInfo(questions) {
        const filteredQuestions = questions.filter(question => {
            const questionText = question.text.toLowerCase();
            const containsPersonalInfo = this.personalInfoKeywords.some(keyword => 
                questionText.includes(keyword.toLowerCase())
            );
            question.isPersonalInfo = containsPersonalInfo;
            return !containsPersonalInfo;
        });

        return {
            questions: filteredQuestions,
            totalFound: questions.length,
            filteredOut: questions.length - filteredQuestions.length
        };
    }

    /**
     * Display extracted questions
     */
    displayQuestions(result) {
        const { questions, totalFound, filteredOut } = result;
        
        // Post-process questions to ensure proper grouping
        const cleanedQuestions = this.postProcessQuestions(questions);
        
        // Store cleaned questions for later use
        this.currentQuestions = cleanedQuestions;
        
        // Analyze question types and adjust response count
        this.analyzeQuestionTypes(cleanedQuestions);
        
        // Show sentiment section
        this.showSentimentSection();
        
        // Show success message
        this.showSuccessMessage(`Successfully parsed form: ${cleanedQuestions.length} questions found, ${filteredOut} personal info questions filtered`);
    }

    /**
     * Post-process questions to ensure proper grouping and remove standalone options
     */
    postProcessQuestions(questions) {
        const cleanedQuestions = [];
        let currentMainQuestion = null;
        let optionStartIndex = -1;
        let expectedQuestionCount = 8; // We expect 8 questions total
        
        console.log('Post-processing questions to ensure proper grouping...');
        
        // First pass: Identify main questions and their types
        const mainQuestions = questions.filter(q => {
            const text = q.text.toLowerCase();
            return (
                // Multiple choice questions
                text.includes('how would you rate') ||
                text.includes('how satisfied are you') ||
                
                // Checkbox questions with options
                text.includes('select all that apply') ||
                (text.includes('which') && text.includes('following')) ||
                
                // Short answer questions
                text.includes('what is your') ||
                text.includes('which campus building') ||
                
                // Long answer questions
                text.includes('please provide') ||
                text.includes('if you have')
            );
        });
        
        console.log(`Found ${mainQuestions.length} main questions out of expected ${expectedQuestionCount}`);
        
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const questionText = question.text.toLowerCase();
            
            // Determine if this is a main question
            const isMainQuestion = (
                // Multiple choice questions
                questionText.includes('how would you rate') ||
                questionText.includes('how satisfied are you') ||
                
                // Checkbox questions with options
                questionText.includes('select all that apply') ||
                (questionText.includes('which') && questionText.includes('following')) ||
                
                // Short answer questions
                questionText.includes('what is your') ||
                questionText.includes('which campus building') ||
                
                // Long answer questions
                questionText.includes('please provide') ||
                questionText.includes('if you have')
            );
            
            if (isMainQuestion) {
                // Save previous question if exists
                if (currentMainQuestion) {
                    cleanedQuestions.push(currentMainQuestion);
                }
                
                // Determine question type
                let type = 'short_answer'; // default
                if (questionText.includes('select all that apply') || 
                    (questionText.includes('which') && questionText.includes('following'))) {
                    type = 'checkboxes';
                } else if (questionText.includes('how would you rate') || 
                          questionText.includes('how satisfied are you')) {
                    type = 'multiple_choice';
                } else if (questionText.includes('please provide') || 
                          questionText.includes('if you have')) {
                    type = 'long_answer';
                }
                
                // Start new question
                currentMainQuestion = {
                    text: question.text,
                    type: type,
                    options: [],
                    isPersonalInfo: question.isPersonalInfo
                };
                
                // For checkbox and multiple choice questions, look ahead for options
                if (type === 'checkboxes' || type === 'multiple_choice') {
                    optionStartIndex = i + 1;
                    let nextMainQuestionIndex = -1;
                    
                    // Find where the options end
                    for (let j = optionStartIndex; j < questions.length; j++) {
                        const nextText = questions[j].text.toLowerCase();
                        if (nextText.includes('how would you rate') ||
                            nextText.includes('how satisfied are you') ||
                            nextText.includes('select all that apply') ||
                            (nextText.includes('which') && nextText.includes('following')) ||
                            nextText.includes('what is your') ||
                            nextText.includes('which campus building') ||
                            nextText.includes('please provide') ||
                            nextText.includes('if you have')) {
                            nextMainQuestionIndex = j;
                            break;
                        }
                    }
                    
                    // Collect options
                    if (nextMainQuestionIndex !== -1) {
                        for (let j = optionStartIndex; j < nextMainQuestionIndex; j++) {
                            if (!this.isMainQuestion(questions[j].text)) {
                                currentMainQuestion.options.push(questions[j].text);
                            }
                        }
                        i = nextMainQuestionIndex - 1;
                    } else {
                        for (let j = optionStartIndex; j < questions.length; j++) {
                            if (!this.isMainQuestion(questions[j].text)) {
                                currentMainQuestion.options.push(questions[j].text);
                            }
                        }
                        i = questions.length;
                    }
                    
                    console.log(`Processed ${type} question: "${question.text}" with ${currentMainQuestion.options.length} options`);
                } else {
                    console.log(`Added ${type} question: "${question.text}"`);
                }
            }
        }
        
        // Add the last question
        if (currentMainQuestion) {
            cleanedQuestions.push(currentMainQuestion);
        }
        
        // Validate question count
        if (cleanedQuestions.length !== expectedQuestionCount) {
            console.warn(`Warning: Found ${cleanedQuestions.length} questions, expected ${expectedQuestionCount}`);
        }
        
        console.log('Final question breakdown:');
        cleanedQuestions.forEach((q, i) => {
            console.log(`Q${i + 1}: ${q.type} - "${q.text}" ${q.options.length ? `(${q.options.length} options)` : ''}`);
        });
        
        return cleanedQuestions;
    }
    
    /**
     * Check if text represents a main question
     */
    isMainQuestion(text) {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase();
        return (
            // Multiple choice questions
            lowerText.includes('how would you rate') ||
            lowerText.includes('how satisfied are you') ||
            
            // Checkbox questions with options
            lowerText.includes('select all that apply') ||
            (lowerText.includes('which') && lowerText.includes('following')) ||
            
            // Short answer questions
            lowerText.includes('what is your') ||
            lowerText.includes('which campus building') ||
            
            // Long answer questions
            lowerText.includes('please provide') ||
            lowerText.includes('if you have')
        );
    }
    
    /**
     * Check if text is a standalone option (like a facility name)
     */
    isStandaloneOption(text) {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase().trim();
        
        // List of known standalone options
        const standaloneOptions = [
            'restrooms',
            'library',
            'cafeteria',
            'canteen',
            'sports facilities',
            'laboratories',
            'drinking water stations',
            'parking areas',
            'seating in common areas',
            'campus greenery',
            'landscaping',
            'excellent',
            'good',
            'average',
            'poor',
            'very satisfied',
            'satisfied',
            'neutral',
            'dissatisfied',
            'very dissatisfied'
        ];
        
        // Check if it's a known option
        if (standaloneOptions.includes(lowerText)) return true;
        
        // Check if it's a very short text (likely an option)
        if (text.split(' ').length <= 2 && text.length < 20) return true;
        
        // Check if it's part of a facility name
        const facilityParts = ['room', 'hall', 'building', 'center', 'facility', 'area', 'station'];
        if (facilityParts.some(part => lowerText.includes(part))) return true;
        
        return false;
    }

    /**
     * Check if text represents a main question during post-processing
     */
    isMainQuestionInPostProcess(text) {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase();
        
        // Check for question indicators
        const questionWords = [
            'what', 'how', 'why', 'when', 'where', 'which', 'who', 
            'describe', 'explain', 'tell', 'select', 'choose', 'rate',
            'provide', 'frequent', 'reported', 'satisfied', 'condition',
            'please provide', 'if you have', 'approximate response time'
        ];
        
        const hasQuestionWord = questionWords.some(word => lowerText.includes(word));
        const hasQuestionMark = text.includes('?');
        const hasActionWord = lowerText.includes('please') || lowerText.includes('rate') || 
                             lowerText.includes('select') || lowerText.includes('choose') ||
                             lowerText.includes('provide') || lowerText.includes('mention');
        
        // Check if it's a longer text (likely a question)
        const isLongText = text.length > 30;
        
        // Check if it's not just an option
        const isOption = this.isOptionInPostProcess(text);
        
        // Check if it contains facility names as part of the question (not standalone)
        const facilityNames = [
            'restrooms', 'library', 'cafeteria', 'canteen', 'sports facilities', 
            'laboratories', 'drinking water stations', 'parking areas', 
            'seating in common areas', 'campus greenery', 'landscaping'
        ];
        const containsFacilityNames = facilityNames.some(name => lowerText.includes(name));
        
        // Must have question characteristics AND be longer than a simple option
        // AND either contain facility names (part of question) or be a proper question
        return (hasQuestionWord || hasQuestionMark || hasActionWord) && !isOption && isLongText;
    }

    /**
     * Check if text represents an option during post-processing
     */
    isOptionInPostProcess(text) {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase();
        
        // Common option patterns
        const optionPatterns = [
            'excellent', 'good', 'average', 'poor', 'very satisfied', 'satisfied',
            'neutral', 'dissatisfied', 'very dissatisfied', 'clear selection',
            'your answer', 'restrooms', 'library', 'cafeteria', 'canteen',
            'sports facilities', 'laboratories', 'drinking water stations',
            'parking areas', 'seating in common areas', 'campus greenery',
            'landscaping', 'student center', 'union', 'arts', 'humanities hall',
            'main academic block', 'science & technology building', 'library building',
            'choose', 'select all that apply'
        ];
        
        // Check if text matches option patterns
        const matchesOption = optionPatterns.some(pattern => lowerText.includes(pattern));
        
        // Check if it's a common facility/amenity name (definitely an option)
        const facilityNames = [
            'restrooms', 'library', 'cafeteria', 'canteen', 'sports facilities', 
            'laboratories', 'drinking water stations', 'parking areas', 
            'seating in common areas', 'campus greenery', 'landscaping'
        ];
        const isFacilityName = facilityNames.some(name => lowerText.includes(name));
        
        // Check if it's just a single word or very short phrase (likely an option)
        const isVeryShort = text.trim().split(' ').length <= 2 && text.length < 30;
        
        // Check if it's a rating option
        const ratingOptions = ['excellent', 'good', 'average', 'poor', 'very satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very dissatisfied'];
        const isRatingOption = ratingOptions.some(rating => lowerText.includes(rating));
        
        // Check if it's a facility name (exact match)
        const exactFacilityNames = ['restrooms', 'library', 'cafeteria', 'canteen', 'sports facilities', 'laboratories'];
        const isExactFacilityName = exactFacilityNames.some(name => lowerText.trim() === name);
        
        return matchesOption || isFacilityName || isVeryShort || isRatingOption || isExactFacilityName;
    }

    /**
     * Analyze question types and adjust response count accordingly
     */
    analyzeQuestionTypes(questions) {
        const typeCounts = {
            'short_answer': 0,
            'long_answer': 0,
            'multiple_choice': 0,
            'checkboxes': 0
        };
        
        // Count question types
        questions.forEach(question => {
            if (typeCounts.hasOwnProperty(question.type)) {
                typeCounts[question.type]++;
            }
        });
        
        // Calculate complexity score
        let complexityScore = 0;
        complexityScore += typeCounts.short_answer * 1; // Simple
        complexityScore += typeCounts.long_answer * 3; // Complex
        complexityScore += typeCounts.multiple_choice * 1; // Simple
        complexityScore += typeCounts.checkboxes * 2; // Medium complexity
        
        // Adjust response count based on complexity
        let recommendedCount = 3; // Default
        
        if (complexityScore <= 5) {
            recommendedCount = 5; // Simple forms can handle more responses
        } else if (complexityScore <= 10) {
            recommendedCount = 3; // Medium complexity
        } else if (complexityScore <= 15) {
            recommendedCount = 2; // High complexity
        } else {
            recommendedCount = 1; // Very complex forms
        }
        
        // Update the response count input
        this.responseCountInput.value = Math.min(recommendedCount, 10);
        
        // Show analysis information
        this.showQuestionTypeAnalysis(typeCounts, complexityScore, recommendedCount);
    }

    /**
     * Show question type analysis to the user
     */
    showQuestionTypeAnalysis(typeCounts, complexityScore, recommendedCount) {
        const analysisDiv = document.createElement('div');
        analysisDiv.className = 'question-analysis';
        analysisDiv.style.cssText = `
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            font-size: 0.9rem;
        `;
        
        const typeLabels = {
            'short_answer': 'Short Answer',
            'long_answer': 'Long Answer',
            'multiple_choice': 'Multiple Choice',
            'checkboxes': 'Checkboxes'
        };
        
        let analysisHTML = `
            <h4 style="margin: 0 0 0.5rem 0; color: #0c4a6e;">📊 Question Analysis</h4>
            <div style="margin-bottom: 0.5rem;">
                <strong>Question Types Found:</strong><br>
        `;
        
        Object.entries(typeCounts).forEach(([type, count]) => {
            if (count > 0) {
                analysisHTML += `• ${typeLabels[type]}: ${count} question${count > 1 ? 's' : ''}<br>`;
            }
        });
        
        analysisHTML += `
            </div>
            <div style="margin-bottom: 0.5rem;">
                <strong>Complexity Score:</strong> ${complexityScore} (${this.getComplexityDescription(complexityScore)})
            </div>
            <div>
                <strong>Recommended Responses:</strong> ${recommendedCount} (automatically adjusted)
            </div>
        `;
        
        // Add detailed question breakdown
        analysisHTML += `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #0ea5e9;">
                <strong>📋 Detailed Question Breakdown:</strong><br>
        `;
        
        this.currentQuestions.forEach((question, index) => {
            analysisHTML += `
                <div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(255,255,255,0.5); border-radius: 4px;">
                    <strong>Q${index + 1}:</strong> ${question.text}<br>
                    <small style="color: #0369a1;">Type: ${typeLabels[question.type] || question.type}</small>
                    ${question.options && question.options.length > 0 ? 
                        `<br><small style="color: #0369a1;">Options: ${question.options.join(', ')}</small>` : 
                        ''
                    }
                </div>
            `;
        });
        
        analysisHTML += `</div>`;
        
        analysisDiv.innerHTML = analysisHTML;
        
        // Insert the analysis before the sentiment section
        const sentimentSection = document.getElementById('sentimentSection');
        if (sentimentSection && sentimentSection.parentNode) {
            sentimentSection.parentNode.insertBefore(analysisDiv, sentimentSection);
        }
    }

    /**
     * Get complexity description based on score
     */
    getComplexityDescription(score) {
        if (score <= 5) return 'Simple';
        if (score <= 10) return 'Medium';
        if (score <= 15) return 'Complex';
        return 'Very Complex';
    }

    /**
     * Show sentiment configuration section
     */
    showSentimentSection() {
        this.sentimentSection.style.display = 'block';
        this.sentimentSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Generate responses using Gemini API
     */
    async generateResponses() {
        const envApiKey = window.AppConfig?.getGeminiApiKey();
        const inputApiKey = this.apiKeyInput.value.trim();
        const apiKey = envApiKey || inputApiKey;
        const responseCount = parseInt(this.responseCountInput.value);
        
        console.log('API Key Debug:', {
            envApiKey: envApiKey ? `${envApiKey.substring(0, 10)}...` : 'not found',
            inputApiKey: inputApiKey ? `${inputApiKey.substring(0, 10)}...` : 'not found',
            finalApiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'not found'
        });
        
        if (!this.currentQuestions || this.currentQuestions.length === 0) {
            this.showError('No questions available. Please parse a form first.');
            return;
        }
        
        if (!this.validateSentimentTotal()) {
            this.showError('Sentiment distribution must total 100%');
            return;
        }

        this.setGenerateLoading(true);
        this.hideError();
        this.hideResults();

        try {
            const responses = await this.generateResponsesWithGemini(apiKey, responseCount);
            this.displayResponses(responses);
        } catch (error) {
            console.error('Error generating responses:', error);
            this.showError('Failed to generate responses. Please check your API key and try again.');
        } finally {
            this.setGenerateLoading(false);
        }
    }

    /**
     * Validate sentiment total equals 100%
     */
    validateSentimentTotal() {
        const positive = parseInt(this.positiveSlider.value);
        const neutral = parseInt(this.neutralSlider.value);
        const negative = parseInt(this.negativeSlider.value);
        return (positive + neutral + negative) === 100;
    }

    /**
     * Generate responses with proper sentiment distribution
     */
    async generateResponsesWithGemini(apiKey, responseCount) {
        const positive = parseInt(this.positiveSlider.value);
        const neutral = parseInt(this.neutralSlider.value);
        const negative = parseInt(this.negativeSlider.value);
        
        // Calculate exact number of responses for each sentiment
        const positiveCount = Math.round((positive / 100) * responseCount);
        const neutralCount = Math.round((neutral / 100) * responseCount);
        const negativeCount = responseCount - positiveCount - neutralCount; // Ensure total equals responseCount
        
        console.log(`Sentiment Distribution: Positive=${positiveCount}, Neutral=${neutralCount}, Negative=${negativeCount}`);
        
        const responses = [];
        const sentimentQueue = this.createSentimentQueue(positiveCount, neutralCount, negativeCount);
        
        for (let i = 0; i < responseCount; i++) {
            const sentiment = sentimentQueue[i];
            const response = await this.generateSingleResponse(apiKey, i + 1, sentiment);
            responses.push(response);
            
            // Add delay between API calls to avoid rate limiting
            if (i < responseCount - 1) {
                await this.simulateNetworkDelay(500);
            }
        }
        
        return responses;
    }

    /**
     * Create a queue of sentiments based on distribution
     */
    createSentimentQueue(positiveCount, neutralCount, negativeCount) {
        const queue = [];
        
        // Add positive responses
        for (let i = 0; i < positiveCount; i++) {
            queue.push('positive');
        }
        
        // Add neutral responses
        for (let i = 0; i < neutralCount; i++) {
            queue.push('neutral');
        }
        
        // Add negative responses
        for (let i = 0; i < negativeCount; i++) {
            queue.push('negative');
        }
        
        // Shuffle the queue to randomize the order while maintaining distribution
        return this.shuffleArray(queue);
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Generate a single response with specified sentiment
     */
    async generateSingleResponse(apiKey, responseNumber, sentiment) {
        const prompt = this.buildGeminiPrompt(sentiment);
        
        const response = await this.callGeminiAPI(apiKey, prompt);
        return {
            responseNumber,
            sentiment,
            questions: this.currentQuestions.map(question => ({
                question: question.text,
                answer: this.extractAnswerFromResponse(response, question),
                explanation: this.generateExplanation(question, sentiment)
            }))
        };
    }

    /**
     * Determine sentiment based on distribution
     */
    determineSentiment(positive, neutral, negative) {
        const random = Math.random() * 100;
        if (random < positive) return 'positive';
        if (random < positive + neutral) return 'neutral';
        return 'negative';
    }

    /**
     * Build prompt for Gemini API with enhanced semantic guidance
     */
    buildGeminiPrompt(sentiment) {
        const questionsText = this.currentQuestions.map((q, i) => 
            `${i + 1}. ${q.text} (Type: ${q.type}${q.options.length > 0 ? ', Options: ' + q.options.join(', ') : ''})`
        ).join('\n');
        
        const sentimentGuidance = this.getSentimentGuidance(sentiment);
        
        return `You are an expert at generating realistic survey responses. Generate responses for the following Google Form questions with a ${sentiment} sentiment.

FORM QUESTIONS:
${questionsText}

SENTIMENT CONTEXT: ${sentiment.toUpperCase()}
${sentimentGuidance}

RESPONSE GUIDELINES:
1. For multiple choice: Select the most appropriate option that aligns with the ${sentiment} sentiment
2. For checkboxes: Choose relevant options that reflect the ${sentiment} perspective
3. For short answer: Provide concise, ${sentiment}-appropriate responses with realistic details
4. For long answer: Write detailed responses with proper context, reasoning, and ${sentiment} tone
5. Ensure all responses are authentic, realistic, and contextually appropriate
6. Maintain consistent ${sentiment} sentiment throughout all responses
7. Use language and tone that naturally reflects the ${sentiment} perspective
8. Provide specific examples and details that support the ${sentiment} viewpoint

SEMANTIC REQUIREMENTS:
- Use vocabulary and phrasing typical of ${sentiment} responses
- Include realistic details and examples appropriate to the ${sentiment} perspective
- Ensure responses feel natural and authentic to someone with a ${sentiment} viewpoint
- Consider the context and implications of each question from a ${sentiment} perspective

OUTPUT FORMAT:
Question 1: [Your response here]
Question 2: [Your response here]
Question 3: [Your response here]
...and so on for all questions

Please generate responses that are authentic, contextually relevant, and semantically appropriate for the ${sentiment} sentiment.`;
    }

    /**
     * Get detailed sentiment guidance for more semantic responses
     */
    getSentimentGuidance(sentiment) {
        const guidance = {
            positive: `- POSITIVE: Enthusiastic, satisfied, optimistic, constructive feedback
- Use positive language: "great", "excellent", "love", "appreciate", "beneficial"
- Express satisfaction and enthusiasm
- Provide constructive suggestions with positive framing
- Show appreciation for services, products, or experiences
- Use exclamation marks and upbeat language appropriately
- Focus on strengths, improvements, and positive outcomes`,
            
            neutral: `- NEUTRAL: Balanced, objective, factual, mixed opinions
- Use moderate language: "adequate", "reasonable", "satisfactory", "acceptable"
- Present balanced viewpoints with pros and cons
- Avoid extreme language or strong emotional expressions
- Provide factual observations and measured feedback
- Use neutral tone with occasional positive or negative notes
- Focus on objective assessment and practical considerations`,
            
            negative: `- NEGATIVE: Critical, concerned, dissatisfied, areas for improvement
- Use critical language: "disappointing", "frustrating", "needs improvement", "concerned"
- Express dissatisfaction or concerns constructively
- Identify specific problems or areas for improvement
- Use more formal or reserved language
- Focus on issues, limitations, and areas needing attention
- Provide constructive criticism with specific examples`
        };
        
        return guidance[sentiment] || guidance.neutral;
    }

    /**
     * Call Gemini API with fallback models
     */
    async callGeminiAPI(apiKey, prompt) {
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
                return data.candidates[0].content.parts[0].text;
                
            } catch (error) {
                console.error(`Gemini API call error (${model}):`, error);
                
                if (model === models[models.length - 1]) {
                    // Last model failed, throw error
                    throw error;
                }
                // Continue to next model
            }
        }
    }

    /**
     * Extract answer from Gemini response
     */
    extractAnswerFromResponse(response, question) {
        try {
            // Parse the Gemini response to extract answers
            const lines = response.split('\n');
            const questionIndex = this.currentQuestions.findIndex(q => q.text === question.text);
            
            if (questionIndex !== -1) {
                // Look for the answer in the response
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.match(new RegExp(`Question ${questionIndex + 1}:`, 'i')) || 
                        line.match(new RegExp(`Q${questionIndex + 1}:`, 'i'))) {
                        // Extract the answer after the colon
                        const answer = line.split(':').slice(1).join(':').trim();
                        if (answer) {
                            return answer;
                        }
                    }
                }
            }
            
            // If no specific answer found, return a generic response
            return 'Response generated based on question context';
        } catch (error) {
            console.error('Error extracting answer from response:', error);
            return 'Response generated based on question context';
        }
    }

    /**
     * Generate explanation for the response based on sentiment
     */
    generateExplanation(question, sentiment) {
        const explanations = {
            positive: {
                multiple_choice: "Selected this option as it reflects a positive, enthusiastic perspective that aligns with the respondent's satisfaction and optimism.",
                checkboxes: "Chose these options based on positive experiences and satisfaction with the available choices.",
                short_answer: "Provided a concise, positive response that reflects enthusiasm and satisfaction with the topic.",
                long_answer: "Wrote a detailed, positive response with specific examples and constructive feedback that demonstrates satisfaction and optimism."
            },
            neutral: {
                multiple_choice: "Selected this option as it represents a balanced, objective choice that reflects measured consideration.",
                checkboxes: "Chose these options based on practical considerations and balanced assessment of the available choices.",
                short_answer: "Provided a moderate, factual response that reflects objective consideration of the topic.",
                long_answer: "Wrote a detailed, balanced response with both positive and negative considerations, reflecting objective analysis."
            },
            negative: {
                multiple_choice: "Selected this option as it reflects concerns or dissatisfaction with the available choices.",
                checkboxes: "Chose these options based on critical assessment and identification of areas needing improvement.",
                short_answer: "Provided a critical response that reflects concerns or dissatisfaction with the topic.",
                long_answer: "Wrote a detailed response highlighting issues and areas for improvement, reflecting constructive criticism."
            }
        };
        
        const questionType = question.type || 'short_answer';
        const sentimentExplanations = explanations[sentiment] || explanations.neutral;
        
        return sentimentExplanations[questionType] || sentimentExplanations.short_answer;
    }



    /**
     * Display generated responses
     */
    displayResponses(responses) {
        this.generatedResponses = responses;
        this.responsesContainer.innerHTML = '';
        
        // Validate sentiment distribution
        this.validateSentimentDistribution(responses);
        
        // Add loading class for visual feedback
        this.responsesContainer.classList.add('loading');
        
        // Clear loading state after a short delay for smooth transition
        setTimeout(() => {
            this.responsesContainer.classList.remove('loading');
            
            responses.forEach((response, index) => {
                const responseCard = this.createResponseCard(response, index);
                this.responsesContainer.appendChild(responseCard);
                
                // Add staggered animation for each card
                responseCard.style.opacity = '0';
                responseCard.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    responseCard.style.transition = 'all 0.5s ease';
                    responseCard.style.opacity = '1';
                    responseCard.style.transform = 'translateY(0)';
                }, index * 150); // Stagger each card by 150ms
            });
        }, 500);
        
        this.showResults();
    }

    /**
     * Create response card element
     */
    createResponseCard(response, index) {
        const card = document.createElement('div');
        card.className = 'response-card';
        card.style.setProperty('--index', index);
        
        const sentimentClass = this.getSentimentClass(response.sentiment);
        
        let questionsHtml = '';
        response.questions.forEach((q, qIndex) => {
            questionsHtml += `
                <div class="question-text">
                    <strong>${qIndex + 1}.</strong> ${q.question}
                </div>
                <div class="answer-text">${q.answer}</div>
                <div class="explanation-text">${q.explanation}</div>
            `;
        });
        
        card.innerHTML = `
            <div class="response-header">
                <span class="response-number">Response ${response.responseNumber}</span>
                <span class="response-sentiment ${sentimentClass}">${response.sentiment}</span>
            </div>
            ${questionsHtml}
        `;
        
        return card;
    }

    /**
     * Get CSS class for sentiment
     */
    getSentimentClass(sentiment) {
        return sentiment.toLowerCase();
    }

    /**
     * Export responses to CSV
     */
    exportToCSV() {
        if (!this.generatedResponses || this.generatedResponses.length === 0) {
            this.showError('No responses to export');
            return;
        }

        let csv = 'Question,Answer,Sentiment,Explanation\n';
        
        this.generatedResponses.forEach(response => {
            response.questions.forEach(question => {
                csv += `"${question.question}","${question.answer}","${response.sentiment}","${question.explanation}"\n`;
            });
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'google-form-responses.csv';
        link.click();
        
        this.showSuccessMessage('Responses exported to CSV successfully!');
    }

    /**
     * Export responses to JSON
     */
    exportToJSON() {
        if (!this.generatedResponses || this.generatedResponses.length === 0) {
            this.showError('No responses to export');
            return;
        }

        const data = this.generatedResponses.map(response => ({
            responseNumber: response.responseNumber,
            sentiment: response.sentiment,
            questions: response.questions
        }));
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'google-form-responses.json';
        link.click();
        
        this.showSuccessMessage('Responses exported to JSON successfully!');
    }

    /**
     * Utility functions
     */
    simulateNetworkDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setParseLoading(isLoading) {
        this.parseBtn.disabled = isLoading;
        this.parseBtnText.style.display = isLoading ? 'none' : 'inline';
        this.parseBtnSpinner.style.display = isLoading ? 'inline-block' : 'none';
    }

    setParseHtmlLoading(isLoading) {
        this.parseHtmlBtn.disabled = isLoading;
        this.parseHtmlBtnText.style.display = isLoading ? 'none' : 'inline';
        this.parseHtmlBtnSpinner.style.display = isLoading ? 'inline-block' : 'none';
    }

    setGenerateLoading(isLoading) {
        const btn = this.generateBtn;
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.loading-spinner');
        
        if (isLoading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'inline-block';
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.7';
            
            // Add loading text
            btnText.textContent = 'Generating Responses...';
            btnText.style.display = 'inline';
            
            // Show loading state in responses container
            this.responsesContainer.innerHTML = '';
            this.responsesContainer.classList.add('loading');
            this.showResults(); // Show the results section with loading state
        } else {
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
            
            // Reset button text
            btnText.textContent = 'Generate Responses';
            
            // Remove loading state from responses container
            this.responsesContainer.classList.remove('loading');
        }
    }

    showResults() {
        this.resultsSection.style.display = 'block';
        this.resultsSection.style.opacity = '0';
        this.resultsSection.style.transform = 'translateY(20px)';
        
        // Smooth animation to show results
        setTimeout(() => {
            this.resultsSection.style.transition = 'all 0.5s ease-out';
            this.resultsSection.style.opacity = '1';
            this.resultsSection.style.transform = 'translateY(0)';
        }, 100);
        
        // Scroll into view with smooth behavior
        setTimeout(() => {
            this.resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }, 200);
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorSection.style.display = 'block';
        this.errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        this.errorSection.style.display = 'none';
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(successDiv)) {
                    document.body.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Validate and log sentiment distribution
     */
    validateSentimentDistribution(responses) {
        const sentimentCounts = {
            positive: 0,
            neutral: 0,
            negative: 0
        };
        
        responses.forEach(response => {
            sentimentCounts[response.sentiment]++;
        });
        
        const total = responses.length;
        const distribution = {
            positive: ((sentimentCounts.positive / total) * 100).toFixed(1),
            neutral: ((sentimentCounts.neutral / total) * 100).toFixed(1),
            negative: ((sentimentCounts.negative / total) * 100).toFixed(1)
        };
        
        console.log('Actual Sentiment Distribution:', distribution);
        console.log('Response Counts:', sentimentCounts);
        
        // Show distribution info to user
        this.showDistributionInfo(distribution, sentimentCounts);
        
        return distribution;
    }

    /**
     * Show sentiment distribution information to user
     */
    showDistributionInfo(distribution, counts) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'distribution-info';
        infoDiv.innerHTML = `
            <div class="distribution-header">
                <h4>Generated Response Distribution</h4>
                <span class="distribution-summary">
                    Positive: ${counts.positive} (${distribution.positive}%) | 
                    Neutral: ${counts.neutral} (${distribution.neutral}%) | 
                    Negative: ${counts.negative} (${distribution.negative}%)
                </span>
            </div>
        `;
        
        // Insert before the responses container
        const responsesContainer = this.responsesContainer;
        responsesContainer.parentNode.insertBefore(infoDiv, responsesContainer);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (infoDiv.parentNode) {
                infoDiv.parentNode.removeChild(infoDiv);
            }
        }, 5000);
    }
}

// Add CSS animations for success messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when the DOM is loaded and config is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for config to load
    if (window.AppConfig) {
        await window.AppConfig.loadEnvironmentVariables();
    }
    
    // Initialize the application
    new GoogleFormResponseGenerator();
});

/**
 * Standalone Google Form Parser Utility
 * Can be used independently to extract questions from Google Form HTML
 */
class GoogleFormParser {
    /**
     * Parse Google Form HTML and extract questions
     * @param {string} htmlContent - The full HTML content of a Google Form
     * @returns {Array} Array of question objects
     */
    static parseFormHtml(htmlContent) {
        try {
            // Extract the FB_PUBLIC_LOAD_DATA_ variable
            const fbDataMatch = htmlContent.match(/var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*?\]);/s);
            
            if (!fbDataMatch) {
                throw new Error('FB_PUBLIC_LOAD_DATA_ variable not found in form HTML');
            }
            
            // Parse the JSON data
            const fbData = JSON.parse(fbDataMatch[1]);
            
            // Extract questions from the parsed data
            return this.extractQuestionsFromFBData(fbData);
        } catch (error) {
            throw new Error(`Failed to parse form data: ${error.message}`);
        }
    }

    /**
     * Extract questions from FB_PUBLIC_LOAD_DATA_ structure
     * @param {Array} fbData - The parsed FB_PUBLIC_LOAD_DATA_ array
     * @returns {Array} Array of question objects
     */
    static extractQuestionsFromFBData(fbData) {
        const questions = [];
        
        try {
            // Navigate through the FB data structure to find questions
            const questionsData = this.findQuestionsInFBData(fbData);
            
            if (!questionsData || !Array.isArray(questionsData)) {
                throw new Error('No questions data found in FB_PUBLIC_LOAD_DATA_');
            }
            
            questionsData.forEach((questionData, index) => {
                if (this.isValidQuestion(questionData)) {
                    const question = this.parseQuestionData(questionData, index + 1);
                    if (question) {
                        questions.push(question);
                    }
                }
            });
            
            return questions;
        } catch (error) {
            console.error('Error extracting questions from FB data:', error);
            return [];
        }
    }

    /**
     * Find questions array in FB_PUBLIC_LOAD_DATA_ structure
     * @param {Array} fbData - The parsed FB_PUBLIC_LOAD_DATA_ array
     * @returns {Array|null} Questions array or null if not found
     */
    static findQuestionsInFBData(fbData) {
        // The questions are typically in the 4th element (index 3) of the main array
        // But we need to search more thoroughly as the structure can vary
        for (let i = 0; i < fbData.length; i++) {
            const element = fbData[i];
            if (Array.isArray(element) && element.length > 0) {
                // Check if this array contains question-like objects
                const firstItem = element[0];
                if (firstItem && typeof firstItem === 'object' && firstItem[0]) {
                    // This looks like a question structure
                    return element;
                }
            }
        }
        return null;
    }

    /**
     * Check if a data item represents a valid question
     * @param {Array} questionData - Question data array
     * @returns {boolean} True if valid question
     */
    static isValidQuestion(questionData) {
        return questionData && 
               Array.isArray(questionData) && 
               questionData.length >= 4 && 
               questionData[0] && 
               typeof questionData[0] === 'string';
    }

    /**
     * Parse individual question data into standard format
     * @param {Array} questionData - Question data array
     * @param {number} questionNumber - Question number
     * @returns {Object|null} Question object or null if invalid
     */
    static parseQuestionData(questionData, questionNumber) {
        try {
            const questionText = questionData[0] || '';
            const questionType = this.determineQuestionType(questionData);
            const options = this.extractQuestionOptions(questionData);
            
            return {
                text: questionText,
                type: questionType,
                options: options
            };
        } catch (error) {
            console.error(`Error parsing question ${questionNumber}:`, error);
            return null;
        }
    }

    /**
     * Determine question type from Google Form data structure
     * @param {Array} questionData - Question data array
     * @returns {string} Question type
     */
    static determineQuestionType(questionData) {
        try {
            // Check for question type indicators in the data
            const questionTypeData = questionData[3] || [];
            
            // Look for type indicators in the question data
            if (questionData[4] && Array.isArray(questionData[4])) {
                const typeIndicators = questionData[4];
                
                // Check for multiple choice indicators
                if (typeIndicators.some(item => item === 0 || item === 1)) {
                    return 'multiple_choice';
                }
                
                // Check for checkbox indicators
                if (typeIndicators.some(item => item === 2)) {
                    return 'checkboxes';
                }
            }
            
            // Check for text input types
            if (questionData[1] && questionData[1].includes('text')) {
                // Determine if it's short or long answer based on length
                const maxLength = this.extractMaxLength(questionData);
                return maxLength > 100 ? 'long_answer' : 'short_answer';
            }
            
            // Check for paragraph text (long answer)
            if (questionData[1] && questionData[1].includes('paragraph')) {
                return 'long_answer';
            }
            
            // Check for short text input
            if (questionData[1] && questionData[1].includes('short')) {
                return 'short_answer';
            }
            
            // Default to short answer if we can't determine
            return 'short_answer';
        } catch (error) {
            console.error('Error determining question type:', error);
            return 'short_answer';
        }
    }

    /**
     * Extract question options for multiple choice and checkbox questions
     * @param {Array} questionData - Question data array
     * @returns {Array} Array of option strings
     */
    static extractQuestionOptions(questionData) {
        try {
            const options = [];
            
            // Options are typically stored in questionData[1] or questionData[4]
            const optionsData = questionData[1] || questionData[4] || [];
            
            if (Array.isArray(optionsData)) {
                optionsData.forEach(option => {
                    if (option && typeof option === 'string') {
                        options.push(option);
                    } else if (option && Array.isArray(option) && option[0]) {
                        options.push(option[0]);
                    }
                });
            }
            
            return options;
        } catch (error) {
            console.error('Error extracting question options:', error);
            return [];
        }
    }

    /**
     * Extract maximum length for text input questions
     * @param {Array} questionData - Question data array
     * @returns {number} Maximum length
     */
    static extractMaxLength(questionData) {
        try {
            // Look for length constraints in the question data
            const constraints = questionData[3] || [];
            if (Array.isArray(constraints)) {
                for (let i = 0; i < constraints.length; i++) {
                    if (typeof constraints[i] === 'number' && constraints[i] > 0) {
                        return constraints[i];
                    }
                }
            }
            return 100; // Default length
        } catch (error) {
            return 100;
        }
    }
}

// Make the parser available globally
window.GoogleFormParser = GoogleFormParser; 