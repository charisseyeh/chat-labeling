const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('.'));

// Endpoint to get API key (with basic security)
app.get('/api-key', (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not found in environment variables' });
    }
    res.json({ apiKey });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Make sure to create a .env file with your OPENAI_API_KEY');
}); 