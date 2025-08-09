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
// Also serve the selected_conversations directory statically
app.use('/selected_conversations', express.static(path.join(__dirname, 'selected_conversations')));

// Parse request bodies (increase limits for large selections)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

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

        // Save as conversations.json in the uploads directory
        const conversationsPath = path.join(__dirname, 'uploads', 'conversations.json');
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

// Endpoint to check if uploads/conversations.json exists
app.get('/has-conversations', (req, res) => {
    const uploadsPath = path.join(__dirname, 'uploads', 'conversations.json');
    const exists = fs.existsSync(uploadsPath);
    res.json({ exists });
});

// Endpoint to get the latest selected_conversations file (by modified time)
app.get('/selected_conversations/latest.json', (req, res) => {
    try {
        const dir = path.join(__dirname, 'selected_conversations');
        if (!fs.existsSync(dir)) {
            return res.status(404).json({ error: 'No selected_conversations directory' });
        }
        const files = fs.readdirSync(dir)
            .filter(name => name.endsWith('.json'))
            .map(name => ({ name, mtime: fs.statSync(path.join(dir, name)).mtime.getTime() }))
            .sort((a, b) => b.mtime - a.mtime);
        if (files.length === 0) {
            return res.status(404).json({ error: 'No selected conversations files found' });
        }
        const latestPath = path.join(dir, files[0].name);
        const data = fs.readFileSync(latestPath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (err) {
        console.error('Error reading latest selected conversations:', err);
        res.status(500).json({ error: 'Failed to load latest selected conversations' });
    }
});

// Endpoint to save exported data to selected_conversations directory
app.post('/save-export', (req, res) => {
    try {
        const data = req.body;
        const dir = path.join(__dirname, 'selected_conversations');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        const filename = `selected_conversations_${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(dir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`Saved export to: ${filepath}`);
        
        res.json({ success: true, filename: path.join('selected_conversations', filename) });
    } catch (error) {
        console.error('Error saving export:', error);
        res.status(500).json({ error: 'Failed to save export' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Make sure to create a .env file with your OPENAI_API_KEY');
}); 