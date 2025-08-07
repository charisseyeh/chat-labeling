// Global state
let conversations = [];
let currentIndex = 0;
let labels = {};
let currentSurveyQuestion = 0;

// Survey questions data
const surveyQuestions = [
    {
        id: 'presence_resonance',
        title: 'Presence Resonance',
        description: 'I felt grounded, calm, and emotionally present.',
        options: [
            'Completely disconnected or dissociated; not at all present',
            'Mostly absent or distracted',
            'Slightly tuned in, but not grounded',
            'Somewhat present and aware',
            'Mostly calm and embodied',
            'Very grounded and attentive',
            'Fully present, centered, and emotionally attuned'
        ]
    },
    {
        id: 'field_continuity',
        title: 'Field Continuity',
        description: 'My thoughts were coherent and connected through the conversation.',
        options: [
            'Completely scattered, incoherent, or disjointed',
            'Jumping between thoughts with little connection',
            'Some sense of connection but fragmented',
            'Somewhat coherent with minor drop-offs',
            'Mostly focused, with recurring themes',
            'Very cohesive and self-referencing',
            'Fully coherent; ideas flowed naturally and built on each other'
        ]
    },
    {
        id: 'somatic_drift',
        title: 'Somatic Drift',
        description: 'I felt clearly embodied and aware—not scattered or numb.',
        options: [
            'Completely numb, dissociated, or disconnected from body',
            'Vague bodily awareness; emotionally foggy',
            'Minor physical awareness, but still scattered',
            'Mixed connection; sometimes grounded, sometimes reactive',
            'Mostly physically present and slow-paced',
            'Strong bodily awareness; emotionally settled',
            'Deeply embodied, grounded, and physically centered'
        ]
    },
    {
        id: 'reflective_trace',
        title: 'Reflective Trace',
        description: 'Insights from this moment felt meaningful and stayed with me.',
        options: [
            'No lasting impact; fleeting or shallow',
            'Momentary insight that faded quickly',
            'Mildly interesting, but not transformative',
            'Some insight that lingered briefly',
            'Insight that stayed with me for a while',
            'Strong insight that influenced later thoughts',
            'Deep, lasting shift in awareness or understanding'
        ]
    },
    {
        id: 'overall_emotional_state',
        title: 'Overall Emotional State',
        description: 'Overall, I felt emotionally balanced (regulated) vs. overwhelmed (dysregulated).',
        options: [
            'Highly dysregulated; overwhelmed or shut down',
            'Very emotionally reactive or scattered',
            'Mild dysregulation; some difficulty focusing',
            'Neutral or mixed emotional experience',
            'Mostly emotionally steady and calm',
            'Very regulated and clear-headed',
            'Fully balanced, open, and emotionally integrated'
        ]
    }
];

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

function displayCurrentConversation() {
    if (conversations.length === 0) {
        document.getElementById('conversationDisplay').innerHTML = 
            '<p>No conversations to display.</p>';
        return;
    }

    const conversation = conversations[currentIndex];
    console.log('Current conversation:', conversation);
    
    // Extract messages from the complex structure
    const messages = extractMessages(conversation);
    console.log('Messages to display:', messages);
    
    let html = `
        <div class="conversation">
            <div class="conversation-header">
                <div class="conversation-title">${escapeHtml(conversation.title || 'Untitled Conversation')}</div>
                <div class="ai-classification">
                    AI Classification: ${conversation.aiCategory || 'Not classified'} - ${conversation.aiExplanation || ''}
                </div>
            </div>
            <div class="messages">
    `;

    let messageCount = 0;
    messages.forEach((message, messageIndex) => {
        const role = message.role;
        const content = message.content;
        
        // Skip system messages and empty messages
        if (role === 'system' || !content || content.trim() === '') {
            return;
        }
        
        // Convert markdown to HTML
        const htmlContent = marked.parse(content);
        
        // Get message labels
        const messageLabels = labels[currentIndex]?.[messageIndex] || {};
        
        html += `
            <div class="message ${role}">
                <div class="avatar ${role}">${role === 'user' ? 'U' : 'A'}</div>
                <div class="message-content">${htmlContent}</div>
                <div class="message-labels">
                    <div class="label-inputs">
                        <div class="label-input">
                            <label>Notes:</label>
                            <textarea 
                                   placeholder="Additional notes..." 
                                   onchange="updateMessageLabel(${currentIndex}, ${messageIndex}, 'notes', this.value)" 
                                   style="width: 100%; min-height: 60px; padding: 6px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px; resize: vertical;">${messageLabels.notes || ''}</textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        messageCount++;
        
        // Add survey after 6 message exchanges
        if (messageCount === 6) {
            html += renderSurveySection(currentIndex, messages);
        }
    });
    
    // Add survey at the end if there are more than 6 messages
    if (messageCount > 6) {
        html += renderSurveySection(currentIndex, messages);
    }

    html += `
            </div>
        </div>
    `;

    document.getElementById('conversationDisplay').innerHTML = html;
}

// Label management functions
function updateLabel(index, field, value) {
    if (!labels[index]) {
        labels[index] = {};
    }
    labels[index][field] = value;
}

function updateMessageLabel(conversationIndex, messageIndex, field, value) {
    if (!labels[conversationIndex]) {
        labels[conversationIndex] = {};
    }
    if (!labels[conversationIndex][messageIndex]) {
        labels[conversationIndex][messageIndex] = {};
    }
    labels[conversationIndex][messageIndex][field] = value;
}

function updateSurveyResponse(conversationIndex, questionId, rating) {
    if (!labels[conversationIndex]) {
        labels[conversationIndex] = {};
    }
    if (!labels[conversationIndex].survey) {
        labels[conversationIndex].survey = {};
    }
    labels[conversationIndex].survey[questionId] = rating;
    
    // Refresh the display to show the selected rating description
    displayCurrentConversation();
}

// Survey functions
function renderSurveySection(conversationIndex, messages) {
    const surveyResponses = labels[conversationIndex]?.survey || {};
    const question = surveyQuestions[currentSurveyQuestion];
    const selectedRating = surveyResponses[question.id] || 0;
    
    let surveyHtml = '<div class="survey-section">';
    surveyHtml += `<div class="survey-progress">Questions (${currentSurveyQuestion + 1}/${surveyQuestions.length})</div>`;
    surveyHtml += '<div class="survey-question">';
    surveyHtml += `<div class="question-text">${question.title}</div>`;
    surveyHtml += '<div class="rating-scale">';
    
    for (let i = 1; i <= 7; i++) {
        const isSelected = selectedRating === i;
        const optionText = question.options[i - 1];
        
        surveyHtml += `
            <div class="rating-option ${isSelected ? 'selected' : ''}" 
                 onclick="updateSurveyResponse(${conversationIndex}, '${question.id}', ${i})">
                <div class="rating-circle">${i}</div>
            </div>
        `;
    }
    
    surveyHtml += '</div>';
    
    // Show description for selected rating
    if (selectedRating > 0) {
        surveyHtml += `<div class="rating-description">${question.options[selectedRating - 1]}</div>`;
    }
    
    surveyHtml += '</div>';
    
    // Navigation buttons
    surveyHtml += '<div class="survey-navigation">';
    if (currentSurveyQuestion > 0) {
        surveyHtml += `<button class="nav-button" onclick="previousSurveyQuestion()">Previous</button>`;
    }
    if (currentSurveyQuestion < surveyQuestions.length - 1) {
        surveyHtml += `<button class="nav-button" onclick="nextSurveyQuestion()">Next</button>`;
    } else {
        surveyHtml += `<button class="nav-button" onclick="finishSurvey()">Finish</button>`;
    }
    surveyHtml += '</div>';
    
    surveyHtml += '</div>';
    return surveyHtml;
}

// Navigation functions
function nextConversation() {
    if (currentIndex < conversations.length - 1) {
        currentIndex++;
        currentSurveyQuestion = 0; // Reset survey question when changing conversations
        updateStats();
        displayCurrentConversation();
    }
}

function previousConversation() {
    if (currentIndex > 0) {
        currentIndex--;
        currentSurveyQuestion = 0; // Reset survey question when changing conversations
        updateStats();
        displayCurrentConversation();
    }
}

function nextSurveyQuestion() {
    if (currentSurveyQuestion < surveyQuestions.length - 1) {
        currentSurveyQuestion++;
        displayCurrentConversation();
    }
}

function previousSurveyQuestion() {
    if (currentSurveyQuestion > 0) {
        currentSurveyQuestion--;
        displayCurrentConversation();
    }
}

function finishSurvey() {
    // Hide the survey section
    const surveySection = document.querySelector('.survey-section');
    if (surveySection) {
        surveySection.style.display = 'none';
    }
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