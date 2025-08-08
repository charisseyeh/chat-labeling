const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('.'));

// Parse JSON bodies
app.use(express.json());

// Endpoint to get API key (with basic security)
app.get('/api-key', (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not found in environment variables' });
    }
    res.json({ apiKey });
});

// Endpoint to upload conversations file
app.post('/upload', upload.single('conversations'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read the uploaded file
        const uploadedData = fs.readFileSync(req.file.path, 'utf8');
        const conversations = JSON.parse(uploadedData);

        // Save as conversations.json in the root directory
        const conversationsPath = path.join(__dirname, 'conversations.json');
        fs.writeFileSync(conversationsPath, JSON.stringify(conversations, null, 2));

        // Clean up the temporary uploaded file
        fs.unlinkSync(req.file.path);

        console.log(`Uploaded conversations saved to: ${conversationsPath}`);
        res.json({ success: true, message: 'Conversations uploaded successfully' });
    } catch (error) {
        console.error('Error uploading conversations:', error);
        res.status(500).json({ error: 'Failed to upload conversations' });
    }
});

// Endpoint to check if conversations.json exists
app.get('/has-conversations', (req, res) => {
    const conversationsPath = path.join(__dirname, 'conversations.json');
    const uploadsPath = path.join(__dirname, 'uploads', 'conversations.json');
    const exists = fs.existsSync(conversationsPath) || fs.existsSync(uploadsPath);
    res.json({ exists });
});

// Endpoint to save exported data to current directory
app.post('/save-export', (req, res) => {
    try {
        const data = req.body;
        const filename = `selected_conversations_${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`Saved export to: ${filepath}`);
        
        res.json({ success: true, filename: filename });
    } catch (error) {
        console.error('Error saving export:', error);
        res.status(500).json({ error: 'Failed to save export' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Make sure to create a .env file with your OPENAI_API_KEY');
}); 