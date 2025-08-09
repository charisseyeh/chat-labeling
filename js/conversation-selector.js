let conversations = [];
let allConversations = []; // Store all conversations before filtering
// Track selected categories (multi-select). Empty Set = show all
const selectedCategories = new Set();
// Single source of truth for what is currently rendered in the list
let displayedConversations = [];

function getSearchTerm() {
    const el = document.getElementById('searchInput');
    return (el && el.value ? el.value.toLowerCase() : '');
}

// Remove the simple displayConversations function - use the full version below

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function toggleSelection(index) {
    const checkbox = document.getElementById(`convo-${index}`);
    checkbox.checked = !checkbox.checked;
    const item = checkbox.closest('.conversation-item');
    item.classList.toggle('selected', checkbox.checked);
}

function onHeaderClick(event, index) {
    const target = event.target;
    // If clicking on the checkbox itself, let its own handler manage state
    if (target.closest('input[type="checkbox"]')) return;
    // If clicking the preview button, do nothing here
    if (target.closest('.preview-btn')) return;
    // If clicking the label, let the label toggle the checkbox natively to avoid double toggle
    if (target.closest('label')) return;
    // Otherwise, toggle selection when clicking anywhere in header padding/background
    toggleSelection(index);
}

function onCheckboxChange(index) {
    const checkbox = document.getElementById(`convo-${index}`);
    const item = checkbox.closest('.conversation-item');
    if (item) {
        item.classList.toggle('selected', checkbox.checked);
    }
}

function togglePreview(originalIndex) {
    // Find the preview div by looking for the button that called this function
    const button = event.target.closest('.preview-btn');
    const conversationItem = button.closest('.conversation-item');
    
    if (!conversationItem) {
        console.error(`Conversation item not found`);
        return;
    }
    
    const previewDiv = conversationItem.querySelector('.conversation-preview');
    
    if (!previewDiv) {
        console.error(`Preview div not found for conversation item`);
        return;
    }
    
    const isVisible = previewDiv.style.display !== 'none';
    
    if (!isVisible) {
        // Get the conversation directly from the allConversations array (before filtering)
        const conversation = allConversations[originalIndex];
        
        if (!conversation) {
            console.error(`Conversation not found for original index ${originalIndex}`);
            return;
        }
        
        const messages = extractMessages(conversation);
        
        let html = '';
        messages.forEach(message => {
            const role = message.role;
            const content = message.content;
            
            if (role === 'system' || !content || content.trim() === '') {
                return;
            }
            
            html += `
                <div class="preview-message ${role}">
                    <div class="preview-avatar ${role}">${role === 'user' ? 'U' : 'A'}</div>
                    <div class="preview-content">${escapeHtml(content.substring(0, 200))}${content.length > 200 ? '...' : ''}</div>
                </div>
            `;
        });
        
        const messagesContainer = previewDiv.querySelector('.preview-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = html;
        }
        previewDiv.style.display = 'block';
        
        // Update chevron icon to point up
        const previewBtn = previewDiv.previousElementSibling?.querySelector('.preview-btn i');
        if (previewBtn) {
            previewBtn.className = 'fas fa-chevron-up';
        }
    } else {
        previewDiv.style.display = 'none';
        
        // Update chevron icon to point down
        const previewBtn = previewDiv.previousElementSibling?.querySelector('.preview-btn i');
        if (previewBtn) {
            previewBtn.className = 'fas fa-chevron-down';
        }
    }
}

function extractMessages(conversation) {
    const messages = [];
    
    if (!conversation.mapping) {
        return messages;
    }
    
    // Get all nodes and sort them by creation time
    const allNodes = Object.values(conversation.mapping).filter(node => 
        node.message && 
        node.message.content && 
        node.message.content.content_type === 'text' &&
        node.message.content.parts?.[0]?.trim() !== ''
    );
    
    // Sort by creation time to get chronological order
    allNodes.sort((a, b) => {
        const timeA = a.message.create_time || 0;
        const timeB = b.message.create_time || 0;
        return timeA - timeB;
    });
    
    allNodes.forEach(node => {
        const role = node.message.author?.role || 'user';
        const content = node.message.content.parts?.[0] || '';
        
        if (content && content.trim() !== '') {
            messages.push({
                role: role,
                content: content.trim()
            });
        }
    });
    
    return messages;
}

function selectAll() {
    const checkboxes = document.querySelectorAll('#conversationList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        checkbox.parentElement.classList.add('selected');
    });
}

function deselectAll() {
    const checkboxes = document.querySelectorAll('#conversationList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.parentElement.classList.remove('selected');
    });
}

function saveSelection() {
    const selectedIndices = Array.from(document.querySelectorAll('#conversationList input[type="checkbox"]'))
        .map((checkbox, index) => (checkbox.checked ? index : null))
        .filter(index => index !== null);

    // Use the currently rendered list as the ground truth
    const selectedConversations = selectedIndices.map(index => {
        const selectedConvo = displayedConversations[index];
        const originalIndex = conversations.findIndex(conv => conv === selectedConvo);
        return conversations[originalIndex];
    });
    
    // Create a download link for the selected conversations
    const blob = new Blob([JSON.stringify(selectedConversations, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected_conversations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function exportSelectedConversations() {
    // Get all manually selected conversations (using checkboxes)
    const selectedIndices = Array.from(document.querySelectorAll('#conversationList input[type="checkbox"]'))
        .map((checkbox, index) => checkbox.checked ? index : null)
        .filter(index => index !== null);

    // Map based on what is actually rendered right now
    const selectedConversations = selectedIndices.map(index => {
        const selectedConvo = displayedConversations[index];
        const originalIndex = conversations.findIndex(conv => conv === selectedConvo);
        return conversations[originalIndex];
    });
    
    if (selectedConversations.length === 0) {
        alert('No conversations selected. Please select the conversations you want to export for labeling.');
        return;
    }
    
    // Add metadata about the export
    const exportData = {
        exportDate: new Date().toISOString(),
        totalSelectedConversations: selectedConversations.length,
        totalConversations: conversations.length,
        selectedIndices: selectedIndices,
        conversations: selectedConversations
    };
    
    // Save to selected_conversations directory on the server
    try {
        const response = await fetch('/save-export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(exportData)
        });

        // Attempt to parse JSON only if response is JSON
        const contentType = response.headers.get('content-type') || '';
        let result = null;
        if (contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response from /save-export:', text);
        }

        if (response.ok && result && result.success) {
            // Navigate to labeler to begin labeling using the latest saved file
            window.location.href = 'labeler.html';
        } else {
            const statusInfo = `${response.status} ${response.statusText}`;
            alert(`Failed to save selected conversations to server (${statusInfo}).`);
        }
    } catch (err) {
        console.error('Could not save to server directory:', err);
        alert('Failed to save selected conversations. See console for details.');
    }
}

// Search functionality (guarded if search input exists)
(function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterConversations);
    }
})();

let apiKey = null;

async function loadApiKey() {
    try {
        const response = await fetch('/api-key');
        const data = await response.json();
        if (data.apiKey) {
            apiKey = data.apiKey;
            const status = document.getElementById('apiKeyStatus');
            if (status) status.textContent = 'API key loaded';
            const btn = document.getElementById('analyzeBtn');
            if (btn) btn.disabled = false;
        } else {
            throw new Error('No API key found');
        }
    } catch (error) {
        console.error('Error loading API key:', error);
        const status = document.getElementById('apiKeyStatus');
        if (status) status.textContent = 'API key not found. Check .env file';
        const btn = document.getElementById('analyzeBtn');
        if (btn) btn.disabled = true;
    }
}

async function analyzeWithAI() {
    if (!apiKey) {
        alert('API key not loaded. Please check your .env file and restart the server.');
        return;
    }

    // Use filtered conversations if date range is set, otherwise use all conversations
    const conversationsToAnalyze = filteredConversations.length > 0 ? filteredConversations : conversations;
    
    if (conversationsToAnalyze.length === 0) {
        alert('No conversations to analyze. Please check your date range filter.');
        return;
    }

    const button = document.getElementById('analyzeBtn');
    if (!button) {
        console.error('Analyze button not found');
        return;
    }
    
    // Try to get progress elements, but don't fail if they don't exist
    const btnText = button.querySelector('.btn-text');
    const btnProgress = button.querySelector('.btn-progress');
    const btnProgressFill = button.querySelector('.btn-progress-fill');
    const btnProgressText = button.querySelector('.btn-progress-text');
    
    const hasProgressElements = btnText && btnProgress && btnProgressFill && btnProgressText;
    
    button.disabled = true;
    
    if (hasProgressElements) {
        btnText.style.display = 'none';
        btnProgress.style.display = 'flex';
    } else {
        // Fallback: just change the button text
        button.textContent = 'Analyzing...';
    }
    
    // Add progress tracking
    let processedCount = 0;
    const totalCount = conversationsToAnalyze.length;

    try {
        // Process conversations in batches of 20 to avoid rate limits
        const batchSize = 20;
        for (let i = 0; i < conversationsToAnalyze.length; i += batchSize) {
            const batch = conversationsToAnalyze.slice(i, i + batchSize);
            
            // Extract first user message from each conversation
            const conversationSamples = batch.map(conv => {
                const messages = extractMessages(conv);
                const firstUserMessage = messages.find(msg => msg.role === 'user');
                const sample = firstUserMessage ? firstUserMessage.content.substring(0, 400) : (conv.title || 'Untitled Conversation');
                return {
                    title: conv.title || 'Untitled Conversation',
                    sample: sample
                };
            });
            
            console.log('Sending request to OpenAI with API key:', apiKey.substring(0, 10) + '...');
            
            const requestBody = {
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: "You are helping to identify conversations that might be relevant for reflective or therapy-like conversations with ChatGPT. Look for conversations about personal growth, emotions, relationships, self-reflection, mental health, or similar topics. You must respond with ONLY a valid JSON array with exactly the same number of items as conversations provided, no other text."
                }, {
                    role: "user",
                    content: `Analyze these ${conversationSamples.length} conversations and determine if each is relevant for reflective/therapy-like conversations with ChatGPT. Look for topics like personal growth, emotions, relationships, self-reflection, mental health, or similar.

For each conversation, I'll provide the title and a sample of the first user message (up to 400 characters).

IMPORTANT: You must respond with exactly ${conversationSamples.length} classifications in a JSON array, one for each conversation provided.

Each object must have exactly these fields:
- "category": either "relevant" or "not-relevant"
- "explanation": a brief reason for the classification

Example format:
[{"category": "relevant", "explanation": "This appears to be about personal relationships"}, {"category": "not-relevant", "explanation": "This is about technical programming"}]

Conversations to analyze: ${JSON.stringify(conversationSamples)}`
                }]
            };
            
            console.log('Request body:', requestBody);
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('OpenAI response status:', response.status);
            console.log('OpenAI response data:', data);
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${data.error?.message || response.statusText} (Status: ${response.status})`);
            }
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Unexpected response format from OpenAI API');
            }
            
            let classifications;
            try {
                classifications = JSON.parse(data.choices[0].message.content);
                console.log('Parsed classifications:', classifications);
                
                // Validate that we got the expected number of classifications
                if (!Array.isArray(classifications)) {
                    throw new Error('Response is not an array');
                }
                
                if (classifications.length !== batch.length) {
                    console.warn(`Expected ${batch.length} classifications but got ${classifications.length}`);
                    // Pad with default classifications if we got fewer than expected
                    while (classifications.length < batch.length) {
                        classifications.push({
                            category: 'not-relevant',
                            explanation: 'Failed to classify - missing from AI response'
                        });
                    }
                }
            } catch (parseError) {
                console.error('Error parsing OpenAI response:', parseError);
                console.log('Raw response content:', data.choices[0].message.content);
                throw new Error('Failed to parse OpenAI response. The AI may not have returned valid JSON.');
            }
            
            // Add classifications to conversations
            batch.forEach((conv, index) => {
                if (index < classifications.length && classifications[index] && classifications[index].category) {
                    conv.aiCategory = classifications[index].category;
                    conv.aiExplanation = classifications[index].explanation || '';
                } else {
                    console.warn(`Missing classification for conversation ${index}:`, classifications[index]);
                    conv.aiCategory = 'not-relevant';
                    conv.aiExplanation = 'Failed to classify';
                }
            });

            // Update display after each batch
            displayConversations(conversationsToAnalyze);
            
            // Update progress
            processedCount += batch.length;
            const progressPercent = Math.round((processedCount / totalCount) * 100);
            
            if (hasProgressElements && btnProgressFill && btnProgressText) {
                btnProgressFill.style.width = `${progressPercent}%`;
                btnProgressText.textContent = `${processedCount}/${totalCount} (${progressPercent}%)`;
            } else {
                // Fallback: update button text with progress
                button.textContent = `Analyzing... ${processedCount}/${totalCount}`;
            }
            
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < conversationsToAnalyze.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        console.error('Error analyzing with AI:', error);
        let errorMessage = 'Error analyzing conversations. ';
        if (error.message.includes('rate limit')) {
            errorMessage += 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('API key')) {
            errorMessage += 'Invalid API key. Please check your configuration.';
        } else if (error.message.includes('Failed to parse')) {
            errorMessage += 'AI response was invalid. Please try again.';
        } else {
            errorMessage += 'Check console for details.';
        }
        alert(errorMessage);
    } finally {
        if (button) {
            button.disabled = false;
        }
        
        if (hasProgressElements && btnText && btnProgress && btnProgressFill && btnProgressText) {
            btnText.style.display = 'inline';
            btnProgress.style.display = 'none';
            btnProgressFill.style.width = '0%';
            btnProgressText.textContent = '0%';
        } else {
            // Fallback: restore button text
            button.textContent = 'Auto-filter';
        }
    }
}

function syncFilterButtonsUI() {
    document.querySelectorAll('.btn--chip').forEach(btn => {
        const cat = btn.dataset.category;
        if (selectedCategories.has(cat)) {
            btn.classList.add('is-active');
        } else {
            btn.classList.remove('is-active');
        }
    });
}

function filterByCategory(category) {
    if (selectedCategories.has(category)) {
        selectedCategories.delete(category); // deselect
    } else {
        selectedCategories.add(category); // select
    }
    syncFilterButtonsUI();
    filterConversations();
}

function filterConversations() {
    const searchTerm = getSearchTerm();
    const isAll = selectedCategories.size === 0; // none selected means show all
    const filteredConvos = conversations.filter(convo => {
        const matchesSearch = (convo.title || '').toLowerCase().includes(searchTerm);
        const matchesCategory = isAll || (convo.aiCategory && selectedCategories.has(convo.aiCategory));
        return matchesSearch && matchesCategory;
    });
    displayConversations(filteredConvos);
}

// Update display function to show AI classifications
function displayConversations(convos) {
    const container = document.getElementById('conversationList');
    // Keep this in sync so selection/export use the same ordering and subset
    displayedConversations = convos;
    container.innerHTML = convos.map((convo, index) => {
        // Find the original index in the allConversations array (before filtering)
        const originalIndex = allConversations.findIndex(c => c === convo);
        return `
        <div class="conversation-item" data-original-index="${originalIndex}">
            <div class="conversation-header" onclick="onHeaderClick(event, ${index})">
                <input type="checkbox" id="convo-${index}" onclick="event.stopPropagation()" onchange="onCheckboxChange(${index})">
                <label for="convo-${index}" style="margin-left: 10px; flex-grow: 1;">
                    <div class="conversation-title">
                        ${escapeHtml(convo.title || 'Untitled Conversation')}
                        ${convo.aiCategory ? 
                            `<span class="category-tag ${convo.aiCategory}">${
                                convo.aiCategory === 'relevant' ? 'Relevant' : 'Not Relevant'
                            }</span>` 
                            : ''}
                    </div>
                    <div class="conversation-meta">
                        <small style="color: #666; font-size: 12px;">${formatDate(convo.create_time)}</small>
                        ${convo.aiExplanation ? 
                            `<br><small style="color: #666; font-size: 12px;">${escapeHtml(convo.aiExplanation)}</small>` 
                            : ''}
                    </div>
                </label>
                <button onclick="event.stopPropagation(); togglePreview(${originalIndex})" class="preview-btn" title="Preview"><i class="fas fa-chevron-down"></i></button>
            </div>
            <div class="conversation-preview" style="display: none;">
                <div class="preview-messages"></div>
            </div>
        </div>
    `}).join('');
}

// Update search to use new filter function (guarded if element exists)
(function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterConversations);
    }
})();

// Date range filtering
let filteredConversations = [];
let dateRangeStart = null;
let dateRangeEnd = null;

function updateDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    dateRangeStart = startDate ? new Date(startDate).getTime() / 1000 : null;
    dateRangeEnd = endDate ? new Date(endDate + 'T23:59:59').getTime() / 1000 : null;
    
    filterConversationsByDate();
}

function setDateRange(modelVersion) {
    const ranges = {
        'gpt-4o-latest': { start: '2025-07-01', end: '2025-12-31' },
        'gpt-4o-2025': { start: '2025-01-01', end: '2025-06-30' },
        'gpt-4o-2024': { start: '2024-05-01', end: '2024-12-31' },
        'gpt-3.5-turbo-0125': { start: '2024-04-01', end: '2025-12-31' },
        'gpt-3.5-turbo-1106': { start: '2023-11-01', end: '2024-03-31' },
        'gpt-3.5-turbo-16k': { start: '2023-06-01', end: '2023-10-31' },
        'gpt-3.5-turbo': { start: '2023-03-01', end: '2023-05-31' }
    };
    
    const range = ranges[modelVersion];
    if (range) {
        document.getElementById('startDate').value = range.start;
        document.getElementById('endDate').value = range.end;
        updateDateRange();
    }
}

function setDateRangeFromDropdown() {
    const select = document.getElementById('modelPreset');
    const selectedValue = select.value;
    
    if (selectedValue) {
        setDateRange(selectedValue);
    }
}

function updateAnalyzeButtonText() {
    const button = document.getElementById('analyzeBtn');
    if (button) {
        const count = filteredConversations.length;
        button.textContent = `Auto-filter ${count} conversations`;
    }
}

// Make function globally accessible
window.updateAnalyzeButtonText = updateAnalyzeButtonText;

function filterConversationsByDate() {
    filteredConversations = conversations.filter(convo => {
        const createTime = convo.create_time;
        if (!createTime) return false;
        
        if (dateRangeStart && createTime < dateRangeStart) return false;
        if (dateRangeEnd && createTime > dateRangeEnd) return false;
        
        return true;
    });
    
    document.getElementById('filteredCount').textContent = filteredConversations.length;
    updateAnalyzeButtonText();
    displayConversations(filteredConversations);
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day} ${year}`;
}

// Upload functionality
let selectedFile = null;

function handleFileSelect() {
    const fileInput = document.getElementById('fileInput');
    const selectedFileName = document.getElementById('selectedFileName');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (fileInput.files.length > 0) {
        selectedFile = fileInput.files[0];
        selectedFileName.textContent = `Selected: ${selectedFile.name}`;
        uploadBtn.disabled = true; // prevent double clicks while auto-uploading
        // Automatically upload once the user selects the file
        uploadFile();
    } else {
        selectedFile = null;
        selectedFileName.textContent = '';
        uploadBtn.disabled = false;
    }
}

async function uploadFile() {
    if (!selectedFile) {
        alert('Please select a file first.');
        return;
    }

    const uploadBtn = document.getElementById('uploadBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    uploadStatus.innerHTML = '<p style="color: #666;">Uploading conversations...</p>';

    const formData = new FormData();
    formData.append('conversations', selectedFile);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            uploadStatus.innerHTML = '<p style="color: green;">✓ Upload successful! Loading conversations...</p>';
            // Switch to conversation interface
            setTimeout(() => {
                showConversationInterface();
                loadConversations();
            }, 1000);
        } else {
            uploadStatus.innerHTML = `<p style="color: red;">✗ Upload failed: ${result.error}</p>`;
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload';
        }
    } catch (error) {
        console.error('Upload error:', error);
        uploadStatus.innerHTML = '<p style="color: red;">✗ Upload failed. Please try again.</p>';
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload';
    }
}

// Interface management
function showUploadInterface() {
    document.getElementById('uploadInterface').style.display = 'block';
    document.getElementById('conversationInterface').style.display = 'none';
}

function showConversationInterface() {
    document.getElementById('uploadInterface').style.display = 'none';
    const el = document.getElementById('conversationInterface');
    if (el) {
        el.style.display = 'flex';
    }
}

// Check if conversations exist and show appropriate interface
async function checkConversationsExist() {
    try {
        const response = await fetch('/has-conversations');
        const result = await response.json();
        
        if (result.exists) {
            // Insert header only when conversations file exists
            if (typeof initializeHeader === 'function') {
                initializeHeader({
                    title: 'Select chats',
                    stats: 'Select reflective or therapy-like chats that you had with ChatGPT below to label it',
                    navigation: '<button class="btn btn--accent" onclick="exportSelectedConversations()">Use selected conversations</button>'
                });
            }
            showConversationInterface();
            loadConversations();
        } else {
            showUploadInterface();
        }
    } catch (error) {
        console.error('Error checking conversations:', error);
        showUploadInterface();
    }
}

// Load conversations when the page loads
async function loadConversations() {
    try {
        const response = await fetch('uploads/conversations.json');
        const data = await response.json();
        allConversations = data; // Store all conversations before filtering
        
        // Filter conversations to only include those with more than 6 turns
        const longConversations = data.filter(conversation => {
            const messages = extractMessages(conversation);
            return messages.length > 6;
        });
        
        // Update the conversation counts
        const totalElement = document.getElementById('totalConversationCount');
        const longElement = document.getElementById('longConversationCount');
        if (totalElement) totalElement.textContent = data.length;
        if (longElement) longElement.textContent = longConversations.length;
        
        // Use only long conversations for further processing
        conversations = longConversations;
        
        // Initialize filtered conversations
        filteredConversations = longConversations;
        const filteredElement = document.getElementById('filteredCount');
        if (filteredElement) filteredElement.textContent = longConversations.length;
        
        displayConversations(conversations);
        
        // Update the total conversations count in the header
        const headerTotalElement = document.getElementById('totalConversations');
        if (headerTotalElement) {
            headerTotalElement.textContent = longConversations.length;
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
        document.getElementById('conversationList').innerHTML = '<p style="color: red;">Error loading conversations. Please check the console for details.</p>';
    }
}

// Load API key when the page loads
loadApiKey();

// Check which interface to show and initialize
checkConversationsExist();

// Initialize dark mode
if (typeof createDarkModeToggle === 'function') {
    createDarkModeToggle();
} 