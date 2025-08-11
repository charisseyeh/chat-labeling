# Chat Labeler - Conversation Analysis Tool

A web application for analyzing and labeling conversation data using AI assistance. This tool helps you upload conversation files, review them, and export labeled datasets.

## Features

- 📁 Upload conversation JSON files
- 🔍 Search and filter conversations
- 🏷️ AI-powered conversation labeling and analysis
- 📊 Export labeled conversations
- 🌙 Dark mode support
- 📱 Responsive design

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### Installing Node.js

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS (Long Term Support) version
3. Run the installer and follow the setup wizard
4. Verify installation by opening a terminal/command prompt and running:
   ```bash
   node --version
   npm --version
   ```

## Setup Instructions

### 1. Clone the Repository

Open your terminal/command prompt and navigate to where you want to store the project:

```bash
# Navigate to your desired directory
cd /path/to/your/desired/location

# Clone the repository
git clone https://github.com/YOUR_USERNAME/chat-labeler.git

# Navigate into the project directory
cd chat-labeler
```

### 2. Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

This will install:
- Express.js (web server)
- Multer (file upload handling)
- dotenv (environment variable management)

### 3. Set Up Your OpenAI API Key

The application requires an OpenAI API key for AI-powered features:

1. **Get an API Key:**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the generated key

2. **Create Environment File:**
   - In the project root directory, create a file named `.env`
   - Add your API key to the file:
     ```
     OPENAI_API_KEY=your_actual_api_key_here
     ```
   - **Important:** Never commit this file to version control!

### 4. Start the Application

Run the development server:

```bash
npm start
```

Or alternatively:
```bash
node server.js
```

You should see output like:
```
Server running on http://localhost:3000
```

### 5. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

The application should now be running locally!

## Usage Guide

### Uploading Conversations

1. **Prepare Your Data:**
   - Ensure your conversations are in JSON format
   - The expected format should have conversation objects with messages

2. **Upload Process:**
   - Click "Upload Conversations" on the main page
   - Select your JSON file
   - Click "Upload" to process the file

### Labeling Conversations

1. **Browse Conversations:**
   - Use the search bar to find specific conversations
   - Filter by categories or date ranges
   - Click on conversations to preview content

2. **AI-Assisted Labeling:**
   - Select conversations you want to analyze
   - Click "Analyze with AI" to get AI-generated labels
   - Review and modify labels as needed

3. **Export Results:**
   - Select labeled conversations
   - Click "Export Selected" to download your labeled dataset

## File Structure

```
chat-labeler/
├── js/                    # JavaScript files
├── styles/               # CSS stylesheets
├── uploads/              # Uploaded conversation files
├── selected_conversations/ # Exported labeled data
├── labeled/              # Labeled conversation outputs
├── server.js             # Express server
├── package.json          # Dependencies and scripts
└── .env                  # Environment variables (create this)
```

## Troubleshooting

### Common Issues

**Port 3000 is already in use:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or use a different port
# Edit server.js and change PORT = 3000 to PORT = 3001
```

**"Module not found" errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**API key not working:**
- Verify your `.env` file exists in the project root
- Check that the API key is correct and active
- Ensure there are no extra spaces or quotes in the `.env` file

**File upload issues:**
- Check that your JSON file is valid
- Ensure the file size isn't too large
- Verify the JSON structure matches expected format

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Look at the terminal where you ran `npm start` for server errors
3. Verify all prerequisites are installed correctly
4. Ensure your `.env` file is set up properly

## Development

### Running in Development Mode

```bash
npm run dev
```

### Stopping the Server

In the terminal where the server is running, press:
```
Ctrl + C (Windows/Linux)
Cmd + C (Mac)
```

## Security Notes

- Never commit your `.env` file to version control
- Keep your OpenAI API key secure and don't share it
- The application runs locally on your machine, so data stays private

## Support

For technical issues or questions about the application, please contact the development team or create an issue in the GitHub repository.

---

**Happy Labeling! 🏷️**
