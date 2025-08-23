const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

const app = express();
let PORT = 3000; // Will be dynamically assigned

// Serve static files
app.use(express.static('.'));
// Also serve the selected_conversations directory statically
app.use('/selected_conversations', express.static(path.join(__dirname, 'selected_conversations')));
// Serve labeled outputs
app.use('/labeled', express.static(path.join(__dirname, 'labeled')));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'conversation-selector.html'));
});

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

// Save per-conversation labeled export into new directory structure
app.post('/save-labeled', (req, res) => {
    try {
        const { filename, data } = req.body || {};
        if (!data) {
            return res.status(400).json({ error: 'Missing data' });
        }
        
        // Create new directory structure
        const conversationsDir = path.join(__dirname, 'labeled', 'conversations');
        const safeDir = path.join(__dirname, 'labeled', 'safe');
        const combinedDir = path.join(__dirname, 'labeled', 'combined');
        
        if (!fs.existsSync(conversationsDir)) fs.mkdirSync(conversationsDir, { recursive: true });
        if (!fs.existsSync(safeDir)) fs.mkdirSync(safeDir, { recursive: true });
        if (!fs.existsSync(combinedDir)) fs.mkdirSync(combinedDir, { recursive: true });
        
        // Generate conversation ID (auto-increment)
        const conversationFiles = fs.readdirSync(conversationsDir)
            .filter(name => name.startsWith('conversation_') && name.endsWith('.json'))
            .map(name => parseInt(name.match(/conversation_(\d+)/)?.[1] || '0'))
            .sort((a, b) => a - b);
        
        const nextId = conversationFiles.length > 0 ? Math.max(...conversationFiles) + 1 : 1;
        const conversationId = nextId.toString().padStart(3, '0');
        const date = new Date().toISOString().split('T')[0];
        
        // Save full version in conversations/ directory
        const fullFilename = `conversation_${conversationId}_${date}.json`;
        const fullFilepath = path.join(conversationsDir, fullFilename);
        fs.writeFileSync(fullFilepath, JSON.stringify(data, null, 2));
        
        // Create safe version (without conversation content)
        const safeData = createSafeVersion(data, conversationId);
        const safeFilepath = path.join(safeDir, fullFilename);
        fs.writeFileSync(safeFilepath, JSON.stringify(safeData, null, 2));
        
        // Update master index
        updateMasterIndex(conversationId, date, fullFilename);
        
        console.log(`Saved conversation ${conversationId} to: ${fullFilepath}`);
        console.log(`Saved safe version to: ${safeFilepath}`);
        
        return res.json({ 
            success: true, 
            conversationId,
            fullFilename: path.join('labeled', 'conversations', fullFilename),
            safeFilename: path.join('labeled', 'safe', fullFilename)
        });
    } catch (err) {
        console.error('Error saving labeled export:', err);
        return res.status(500).json({ error: 'Failed to save labeled export' });
    }
});

// Create safe version without conversation content
function createSafeVersion(data, conversationId) {
    const safeData = {
        conversation_id: conversationId,
        export_date: data.exportDate,
        num_turns: data.data[0]?.num_turns || 0,
        completion_status: determineCompletionStatus(data.data[0]),
        assessments: data.data[0]?.assessments || {},
        comparisons: data.comparisons || {}
    };
    
    return safeData;
}

// Determine completion status
function determineCompletionStatus(conversationData) {
    const assessments = conversationData?.assessments || {};
    const hasPre = Object.keys(assessments.pre?.human || {}).length > 0;
    const hasMid = Object.keys(assessments.mid?.human || {}).length > 0;
    const hasPost = Object.keys(assessments.post?.human || {}).length > 0;
    
    if (hasPre && hasMid && hasPost) return 'complete';
    if (hasPre || hasMid || hasPost) return 'partial';
    return 'incomplete';
}

// Update master index
function updateMasterIndex(conversationId, date, filename) {
    const indexPath = path.join(__dirname, 'labeled', 'index.json');
    let index = { conversations: [] };
    
    if (fs.existsSync(indexPath)) {
        try {
            index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        } catch (err) {
            console.warn('Error reading existing index, creating new one');
        }
    }
    
    // Add or update conversation entry
    const existingIndex = index.conversations.findIndex(c => c.id === conversationId);
    if (existingIndex >= 0) {
        index.conversations[existingIndex] = {
            id: conversationId,
            date: date,
            filename: filename,
            last_updated: new Date().toISOString()
        };
    } else {
        index.conversations.push({
            id: conversationId,
            date: date,
            filename: filename,
            last_updated: new Date().toISOString()
        });
    }
    
    // Sort by ID
    index.conversations.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

// Get list of all conversations
app.get('/labeled/conversations', (req, res) => {
    try {
        const indexPath = path.join(__dirname, 'labeled', 'index.json');
        if (!fs.existsSync(indexPath)) {
            return res.json({ conversations: [] });
        }
        
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        res.json(index);
    } catch (err) {
        console.error('Error reading conversations index:', err);
        res.status(500).json({ error: 'Failed to read conversations index' });
    }
});

// Get a specific conversation by ID
app.get('/labeled/conversations/:id', (req, res) => {
    try {
        const conversationId = req.params.id;
        const conversationsDir = path.join(__dirname, 'labeled', 'conversations');
        const files = fs.readdirSync(conversationsDir)
            .filter(name => name.startsWith(`conversation_${conversationId}_`));
        
        if (files.length === 0) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        const filepath = path.join(conversationsDir, files[0]);
        const data = fs.readFileSync(filepath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (err) {
        console.error('Error reading conversation:', err);
        res.status(500).json({ error: 'Failed to read conversation' });
    }
});

// Function to find an available port and start the server
async function startServer() {
    const net = require('net');
    
    function findAvailablePort(startPort) {
        return new Promise((resolve, reject) => {
            const server = net.createServer();
            
            server.listen(startPort, () => {
                const port = server.address().port;
                server.close(() => resolve(port));
            });
            
            server.on('error', () => {
                // Port is in use, try the next one
                findAvailablePort(startPort + 1).then(resolve).catch(reject);
            });
        });
    }
    
    try {
        // Find an available port starting from 3000
        PORT = await findAvailablePort(3000);
        
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log('Make sure to create a .env file with your OPENAI_API_KEY');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer(); 