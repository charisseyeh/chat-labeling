// Conversation display and navigation functions

// Global state
let conversations = [];
let currentIndex = 0;
let labels = {};
let currentSurveyQuestion = 0; // Keep for backward compatibility, but we'll use position-specific states
let surveyQuestionStates = {
    beginning: 0,
    turn6: 0,
    end: 0
};
let messageObserver = null;
let currentVisibleMessage = 0;

// Survey questions data
const surveyQuestions = [
    {
        id: 'presence_resonance',
        title: 'Presence Resonance',
        description: 'I felt grounded, calm, and emotionally present.',
        options: [
            'Completely disconnected or dissociated',
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
            'ideas flowed naturally and built on each other'
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
    
    // Create the main container with side-by-side layout
    let html = `
        <div class="conversation-layout">
            <div class="survey-sidebar">
                <div class="survey-container">
                    <div class="survey-sections">
    `;

    // Add survey at the beginning
    html += renderSurveySection(currentIndex, messages, 'beginning');
    
    // Add survey at turn 6 (initially hidden)
    if (messages.length >= 6) {
        html += renderSurveySection(currentIndex, messages, 'turn6');
    }
    
    // Add survey at the end (initially hidden)
    if (messages.length > 6) {
        html += renderSurveySection(currentIndex, messages, 'end');
    }

    html += `
                    </div>
                </div>
            </div>
            <div class="conversation-main">
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
        
        html += `
            <div class="message ${role}" data-message-index="${messageCount + 1}">
                <div class="message-content">${htmlContent}</div>
            </div>
        `;
        
        messageCount++;
    });

    html += `
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('conversationDisplay').innerHTML = html;
    
    // Restore survey visibility state after re-rendering
    const renderedMessages = document.querySelectorAll('.message');
    const totalMessages = renderedMessages.length;
    
    // Check current scroll position to determine which surveys should be visible
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // Show turn6 survey if user has scrolled to message 6 or beyond
    if (totalMessages >= 6) {
        const turn6Survey = document.querySelector('.survey-turn6');
        if (turn6Survey) {
            // Check if user has scrolled to message 6
            const message6 = document.querySelector('.message[data-message-index="6"]');
            if (message6) {
                const message6Rect = message6.getBoundingClientRect();
                if (message6Rect.top <= windowHeight * 0.5) {
                    turn6Survey.style.display = 'block';
                    turn6Survey.classList.add('survey-visible');
                }
            }
        }
    }
    
    // Show end survey if user has scrolled to the last message
    if (totalMessages > 6) {
        const endSurvey = document.querySelector('.survey-end');
        if (endSurvey) {
            const lastMessage = document.querySelector(`.message[data-message-index="${totalMessages}"]`);
            if (lastMessage) {
                const lastMessageRect = lastMessage.getBoundingClientRect();
                if (lastMessageRect.top <= windowHeight * 0.5) {
                    endSurvey.style.display = 'block';
                    endSurvey.classList.add('survey-visible');
                }
            }
        }
    }
    
    // Initialize scroll detection after DOM is updated
    initializeScrollDetection();
}

// Survey functions
function renderSurveySection(conversationIndex, messages, position = 'beginning') {
    const surveyResponses = labels[conversationIndex]?.survey?.[position] || {};
    const question = surveyQuestions[surveyQuestionStates[position]];
    const selectedRating = surveyResponses[question.id] || 0;
    
    // Get position-specific question based on the current survey question
    let positionQuestion = '';
    switch (position) {
        case 'beginning':
            positionQuestion = `At the beginning of this conversation, ${getQuestionForTopic(question.id)}`;
            break;
        case 'turn6':
            positionQuestion = `At this point of the conversation, ${getQuestionForTopic(question.id)}`;
            break;
        case 'end':
            positionQuestion = `At the end of this conversation, ${getQuestionForTopic(question.id)}`;
            break;
    }
    
            let surveyHtml = `<div class="survey-section card-section survey-${position}">`;
    surveyHtml += `<div class="survey-progress">Questions (${surveyQuestionStates[position] + 1}/${surveyQuestions.length})</div>`;
    surveyHtml += '<div class="survey-question">';
    surveyHtml += `<div class="question-text">${positionQuestion}</div>`;
    
    // Show instruction text or selected rating description ABOVE the rating scale
    let descriptionText;
    if (selectedRating > 0) {
        descriptionText = question.options[selectedRating - 1];
    } else {
        // Show instruction text based on question type
        switch (question.id) {
            case 'presence_resonance':
                descriptionText = 'Rate your level of presence';
                break;
            case 'field_continuity':
                descriptionText = 'Rate how coherent your thoughts were';
                break;
            case 'somatic_drift':
                descriptionText = 'Rate how embodied you felt';
                break;
            case 'reflective_trace':
                descriptionText = 'Rate how meaningful the insights were';
                break;
            case 'overall_emotional_state':
                descriptionText = 'Rate your overall emotional balance';
                break;
            default:
                descriptionText = 'Rate your response';
        }
    }
    
    surveyHtml += `<div class="rating-description" id="description-${question.id}-${position}">${descriptionText}</div>`;
    
    surveyHtml += '<div class="rating-scale">';
    
    for (let i = 1; i <= 7; i++) {
        const isSelected = selectedRating === i;
        const isFilled = i <= selectedRating; // Fill all circles up to and including selected
        
        surveyHtml += `
            <div class="rating-option ${isSelected ? 'selected' : ''} ${isFilled ? 'filled' : ''}" 
                 onclick="updateSurveyResponse(${conversationIndex}, '${question.id}', ${i}, '${position}')"
                 onmouseenter="showHoverPreview(${i}, '${question.id}', ${conversationIndex}, '${position}')"
                 onmouseleave="hideHoverPreview('${question.id}', ${conversationIndex}, '${position}')">
                <div class="rating-circle"></div>
            </div>
        `;
    }
    
    surveyHtml += '</div>';
    
    surveyHtml += '</div>';
    
    // Navigation buttons
    surveyHtml += '<div class="survey-navigation">';
    if (surveyQuestionStates[position] > 0) {
        surveyHtml += `<button class="btn btn--outline" onclick="previousSurveyQuestion('${position}')">Previous</button>`;
    }
    if (surveyQuestionStates[position] < surveyQuestions.length - 1) {
        surveyHtml += `<button class="btn btn--accent" onclick="nextSurveyQuestion('${position}')">Next</button>`;
    } else {
        surveyHtml += `<button class="btn btn--accent" onclick="finishSurvey('${position}')">Finish</button>`;
    }
    surveyHtml += '</div>';
    
    surveyHtml += '</div>';
    return surveyHtml;
}

function getQuestionForTopic(questionId) {
    switch (questionId) {
        case 'presence_resonance':
            return 'how present did you feel?';
        case 'field_continuity':
            return 'how coherent did you feel?';
        case 'somatic_drift':
            return 'how embodied did you feel?';
        case 'reflective_trace':
            return 'how meaningful were the insights?';
        case 'overall_emotional_state':
            return 'how emotionally balanced did you feel?';
        default:
            return 'how did you feel?';
    }
}

function updateSurveyResponse(conversationIndex, questionId, rating, position = 'beginning') {
    if (!labels[conversationIndex]) {
        labels[conversationIndex] = {};
    }
    if (!labels[conversationIndex].survey) {
        labels[conversationIndex].survey = {};
    }
    if (!labels[conversationIndex].survey[position]) {
        labels[conversationIndex].survey[position] = {};
    }
    labels[conversationIndex].survey[position][questionId] = rating;
    
    // Refresh the display to show the selected rating description
    displayCurrentConversation();
}

function showHoverPreview(rating, questionId, conversationIndex, position = 'beginning') {
    const surveyResponses = labels[conversationIndex]?.survey?.[position] || {};
    const selectedRating = surveyResponses[questionId] || 0;
    
    // Don't show hover preview if a rating is already selected
    if (selectedRating > 0) {
        console.log('Hover blocked - rating already selected:', selectedRating);
        return;
    }
    
    const question = surveyQuestions.find(q => q.id === questionId);
    if (question && question.options[rating - 1]) {
        const descriptionElement = document.getElementById(`description-${questionId}-${position}`);
        if (descriptionElement) {
            console.log('Showing hover preview for rating:', rating, 'Text:', question.options[rating - 1]);
            // Always show the hover description when nothing is selected
            descriptionElement.textContent = question.options[rating - 1];
        }
        
        // Add hover-filled class to all rating options up to the hovered one
        const ratingOptions = document.querySelectorAll(`.survey-${position} .rating-option`);
        ratingOptions.forEach((option, index) => {
            if (index < rating) {
                option.classList.add('hover-filled');
            } else {
                option.classList.remove('hover-filled');
            }
        });
    }
}

function hideHoverPreview(questionId, conversationIndex, position = 'beginning') {
    const surveyResponses = labels[conversationIndex]?.survey?.[position] || {};
    const selectedRating = surveyResponses[questionId] || 0;
    const question = surveyQuestions.find(q => q.id === questionId);
    
    const descriptionElement = document.getElementById(`description-${questionId}-${position}`);
    if (descriptionElement) {
        if (selectedRating > 0) {
            // If a rating is selected, show the selected rating description
            console.log('Hiding hover - showing selected rating:', selectedRating);
            descriptionElement.textContent = question.options[selectedRating - 1];
        } else {
            // If nothing is selected, show the default instruction text
            console.log('Hiding hover - showing default instruction');
            switch (questionId) {
                case 'presence_resonance':
                    descriptionElement.textContent = 'Rate your level of presence';
                    break;
                case 'field_continuity':
                    descriptionElement.textContent = 'Rate how coherent your thoughts were';
                    break;
                case 'somatic_drift':
                    descriptionElement.textContent = 'Rate how embodied you felt';
                    break;
                case 'reflective_trace':
                    descriptionElement.textContent = 'Rate how meaningful the insights were';
                    break;
                case 'overall_emotional_state':
                    descriptionElement.textContent = 'Rate your overall emotional balance';
                    break;
                default:
                    descriptionElement.textContent = 'Rate your response';
            }
        }
    }
    
    // Remove hover-filled class from all rating options
    const ratingOptions = document.querySelectorAll(`.survey-${position} .rating-option`);
    ratingOptions.forEach(option => {
        option.classList.remove('hover-filled');
    });
}

function nextSurveyQuestion(position) {
    if (surveyQuestionStates[position] < surveyQuestions.length - 1) {
        surveyQuestionStates[position]++;
        displayCurrentConversation();
    }
}

function previousSurveyQuestion(position) {
    if (surveyQuestionStates[position] > 0) {
        surveyQuestionStates[position]--;
        displayCurrentConversation();
    }
}

function finishSurvey(position) {
    // This function can be used to hide survey sections if needed
    console.log('Survey finished for position:', position);
}

// Navigation functions
function nextConversation() {
    if (currentIndex < conversations.length - 1) {
        currentIndex++;
        // Reset survey questions to beginning when changing conversations
        surveyQuestionStates.beginning = 0;
        surveyQuestionStates.turn6 = 0;
        surveyQuestionStates.end = 0;
        updateStats();
        displayCurrentConversation();
    }
}

function previousConversation() {
    if (currentIndex > 0) {
        currentIndex--;
        // Reset survey questions to beginning when changing conversations
        surveyQuestionStates.beginning = 0;
        surveyQuestionStates.turn6 = 0;
        surveyQuestionStates.end = 0;
        updateStats();
        displayCurrentConversation();
    }
} 

// Label management functions
function updateLabel(index, field, value) {
    if (!labels[index]) {
        labels[index] = {};
    }
    labels[index][field] = value;
}

// Data loading and processing
async function loadConversations() {
    try {
        // Load the most recent file from selected_conversations/ via a small helper endpoint
        const response = await fetch('selected_conversations/latest.json');
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

// Scroll detection functions
function initializeScrollDetection() {
    // Clean up existing observer
    if (messageObserver) {
        messageObserver.disconnect();
    }
    
    // Create new intersection observer
    messageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const messageIndex = parseInt(entry.target.dataset.messageIndex);
                console.log('Message visible:', messageIndex);
                
                // Only add visual indicator if this message triggers a survey
                const shouldHighlight = shouldHighlightMessage(messageIndex);
                
                // Remove highlight from all messages
                document.querySelectorAll('.message').forEach(msg => {
                    msg.classList.remove('message-current');
                });
                
                // Add highlight only if this message triggers a survey
                if (shouldHighlight) {
                    entry.target.classList.add('message-current');
                }
                
                updateSurveyVisibility(messageIndex);
            }
        });
    }, {
        threshold: 0.5, // Trigger when 50% of message is visible
        rootMargin: '-10% 0px -10% 0px' // Trigger slightly before message is fully visible
    });
    
    // Observe all messages
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        messageObserver.observe(message);
    });
    
    console.log('Scroll detection initialized for', messages.length, 'messages');
    
    // Add a test function to manually trigger survey visibility
    window.testScrollDetection = function() {
        console.log('Testing scroll detection...');
        const messages = document.querySelectorAll('.message');
        console.log('Total messages found:', messages.length);
        
        messages.forEach((msg, index) => {
            const rect = msg.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            console.log(`Message ${index + 1}: visible=${isVisible}, top=${rect.top}, bottom=${rect.bottom}`);
        });
    };
}

function shouldHighlightMessage(messageIndex) {
    const messages = document.querySelectorAll('.message');
    const totalMessages = messages.length;
    
    // Highlight message 6 (when turn6 survey appears)
    if (messageIndex === 6) {
        console.log('Highlighting message 6 - turn6 survey trigger');
        return true;
    }
    
    // Highlight the last message (when end survey appears)
    if (messageIndex === totalMessages) {
        console.log('Highlighting last message - end survey trigger');
        return true;
    }
    
    return false;
}

function updateSurveyVisibility(currentMessageIndex) {
    console.log('Updating survey visibility for message:', currentMessageIndex);
    
    const turn6Survey = document.querySelector('.survey-turn6');
    const endSurvey = document.querySelector('.survey-end');
    const messages = document.querySelectorAll('.message');
    const totalMessages = messages.length;
    
    console.log('Total messages:', totalMessages);
    console.log('Turn6 survey found:', !!turn6Survey);
    console.log('End survey found:', !!endSurvey);
    
    // Show turn6 survey when user reaches 6th message
    if (currentMessageIndex >= 6 && turn6Survey) {
        console.log('Showing turn6 survey');
        turn6Survey.style.display = 'block';
        turn6Survey.classList.add('survey-visible');
    }
    
    // Show end survey when user reaches the last message
    if (currentMessageIndex >= totalMessages - 1 && endSurvey) {
        console.log('Showing end survey');
        endSurvey.style.display = 'block';
        endSurvey.classList.add('survey-visible');
    }
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