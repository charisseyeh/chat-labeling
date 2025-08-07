// Conversation display and navigation functions

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

    // Show survey before the first message if configured
    if (SURVEY_CONFIG.showBeforeFirstMessage && messages.length > 0) {
        html += renderSurveySection(currentIndex, messages);
    }

    let messageCount = 0;
    let surveyCount = 0;
    
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
        
        // Check if survey should appear based on configuration
        if (shouldShowSurvey(messageCount, role, surveyCount)) {
            html += renderSurveySection(currentIndex, messages);
            surveyCount++;
        }
    });
    
    // Add survey at the end if configured
    if (messageCount > SURVEY_CONFIG.showAtEndIfMoreThan) {
        html += renderSurveySection(currentIndex, messages);
    }

    html += `
            </div>
        </div>
    `;

    document.getElementById('conversationDisplay').innerHTML = html;
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