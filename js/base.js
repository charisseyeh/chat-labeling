// Global state
let conversations = [];
let currentIndex = 0;
let labels = {};
let currentSurveyQuestion = 0;

// Utility functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Data loading and processing
async function loadConversations() {
    try {
        const response = await fetch('selected_conversations.json');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Loaded data:', data);
        console.log('Data structure:', Object.keys(data));
        
        conversations = data.conversations || data;
        console.log('Conversations loaded:', conversations.length);
        
        currentIndex = 0;
        updateStats();
        displayCurrentConversation();
    } catch (error) {
        console.error('Error loading conversations:', error);
        document.getElementById('conversationDisplay').innerHTML = 
            '<p style="color: red;">Error loading conversations: ' + error.message + '</p>';
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
    
    console.log('Extracted messages:', messages);
    return messages;
}

// UI update functions
function updateStats() {
    document.getElementById('currentConversation').textContent = currentIndex + 1;
    document.getElementById('totalConversations').textContent = conversations.length;
}

// Export functions
function exportLabeledData() {
    const labeledConversations = conversations.map((conv, index) => ({
        ...conv,
        labels: labels[index] || {}
    }));

    const exportData = {
        exportDate: new Date().toISOString(),
        totalConversations: conversations.length,
        labeledConversations: labeledConversations,
        labels: labels
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labeled_conversations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Exported ${conversations.length} conversations with labels!`);
}

// Event listeners
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextConversation();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousConversation();
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadConversations();
}); 