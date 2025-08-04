# Google Form Parser Documentation

## Overview

The Google Form Parser is a JavaScript utility that extracts questions from Google Forms by parsing the embedded `FB_PUBLIC_LOAD_DATA_` variable in the form's HTML.

## Features

✅ **Extracts all visible questions** from Google Form HTML  
✅ **Identifies question types**: short_answer, long_answer, multiple_choice, checkboxes  
✅ **Extracts options** for multiple choice and checkbox questions  
✅ **Handles complex form structures** with nested data  
✅ **Error handling** for malformed or missing data  
✅ **Standalone utility** that can be used independently  

## Usage

### Basic Usage

```javascript
// Get the HTML content of a Google Form
const formHtml = "<html>...</html>";

// Parse the form and extract questions
const questions = GoogleFormParser.parseFormHtml(formHtml);

// Each question object contains:
// {
//   text: "Question text",
//   type: "short_answer" | "long_answer" | "multiple_choice" | "checkboxes",
//   options: ["option1", "option2", ...] // for multiple choice/checkbox questions
// }
```

### Question Object Structure

```javascript
{
  text: "What is your favorite color?",           // Question text
  type: "multiple_choice",                        // Question type
  options: ["Red", "Blue", "Green"]               // Available options (if applicable)
}
```

### Supported Question Types

- **`short_answer`**: Single-line text input
- **`long_answer`**: Multi-line paragraph text  
- **`multiple_choice`**: Radio button selection (choose one)
- **`checkboxes`**: Multiple selection options (choose many)

## How It Works

### 1. HTML Parsing
The parser extracts the `FB_PUBLIC_LOAD_DATA_` variable from Google Form HTML:

```javascript
const fbDataMatch = htmlContent.match(/var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*?\]);/s);
```

### 2. JSON Parsing
The extracted string is parsed as JSON to get the form data structure:

```javascript
const fbData = JSON.parse(fbDataMatch[1]);
```

### 3. Question Extraction
The parser navigates through the complex nested structure to find questions:

```javascript
const questionsData = this.findQuestionsInFBData(fbData);
```

### 4. Type Detection
Question types are determined by analyzing the data structure:

```javascript
const questionType = this.determineQuestionType(questionData);
```

## Integration with Main Application

The parser is integrated into the main Google Form Response Generator application:

1. **Form URL Input**: User provides Google Form URL
2. **HTML Fetching**: Application fetches the form HTML
3. **Question Extraction**: Parser extracts questions using `parseGoogleFormData()`
4. **Personal Info Filtering**: Questions are filtered for personal information
5. **Response Generation**: AI generates responses based on extracted questions

## Error Handling

The parser includes comprehensive error handling:

- **Missing FB_PUBLIC_LOAD_DATA_**: Throws descriptive error
- **Invalid JSON**: Handles malformed data gracefully
- **No Questions Found**: Returns empty array
- **Individual Question Errors**: Skips invalid questions and continues

## Example Output

```javascript
[
  {
    text: "What is your favorite color?",
    type: "multiple_choice",
    options: ["Red", "Blue", "Green", "Yellow"]
  },
  {
    text: "Describe your experience with our product",
    type: "long_answer",
    options: []
  },
  {
    text: "Which features do you use most often?",
    type: "checkboxes", 
    options: ["Feature A", "Feature B", "Feature C", "Feature D"]
  }
]
```

## Testing

Use the `parser-test.html` file to test the parser functionality:

1. Open `parser-test.html` in your browser
2. Paste Google Form HTML in the textarea
3. Click "Parse Form" to see extracted questions
4. Review the results and question types

## Getting Google Form HTML

To get the HTML content of a Google Form:

1. Open the public Google Form in your browser
2. Right-click on the page and select "View Page Source"
3. Copy the entire HTML content
4. Use it with the parser

## Limitations

- **CORS Restrictions**: Direct fetching may be blocked by browser security
- **Form Structure Changes**: Google may change the internal structure
- **Private Forms**: Only works with public forms
- **Complex Forms**: Very complex forms may have edge cases

## Future Enhancements

- Support for more question types (date, time, file upload, etc.)
- Better handling of conditional questions
- Support for form sections and page breaks
- Enhanced error recovery mechanisms 