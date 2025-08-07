const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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