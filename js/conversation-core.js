// Core conversation display and navigation module
import { SurveyStateManager, renderSurveySection } from './survey.js';
import { SurveyConfigManager } from './survey-config.js';
import { LabelStorage, AiLabelStorage, SaveStatusManager } from './storage.js';
import { extractMessages, renderAiMetrics, exportCombinedAndComparisonsForIndex } from './export.js';
import { ScrollDetectionManager } from './scroll.js';

// Global state
let conversations = [];
let currentIndex = 0;
let surveyStateManager;
let labelStorage;
let aiLabelStorage;
let saveStatusManager;
let scrollDetectionManager;

// Initialize storage managers
function initializeStorageManagers() {
    surveyStateManager = new SurveyStateManager();
    labelStorage = new LabelStorage();
    aiLabelStorage = new AiLabelStorage();
    saveStatusManager = new SaveStatusManager();
    scrollDetectionManager = new ScrollDetectionManager();
}

// Utility functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatHeaderMeta(conversation) {
    const messages = extractMessages(conversation);
    const numMessages = messages.length;
    const numTurns = Math.ceil(numMessages / 2);
    
    // Get save status - add safety check for currentIndex
    let saveStatus = 'Not saved';
    if (typeof currentIndex === 'number' && currentIndex >= 0) {
        const lastSaveTime = saveStatusManager.getLastSaveTime(currentIndex);
        
        if (lastSaveTime) {
            try {
                const timeDiff = Date.now() - lastSaveTime.getTime();
                const minutes = Math.floor(timeDiff / (1000 * 60));
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                
                if (minutes < 1) saveStatus = 'Saved just now';
                else if (minutes < 60) saveStatus = `Saved ${minutes}m ago`;
                else if (hours < 24) saveStatus = `Saved ${hours}h ago`;
                else saveStatus = `Saved ${days}d ago`;
            } catch (e) {
                console.warn('Error parsing save time:', e);
                saveStatus = 'Saved recently';
            }
        }
    }
    
    return `${numTurns} turns • ${numMessages} messages • ${saveStatus}`;
}

function updateStats() {
    console.log('[Stats] updateStats called - currentIndex:', currentIndex, 'conversations.length:', conversations.length);
    
    // Top header meta
    const headerTitleEl = document.getElementById('headerTitle');
    const headerMetaEl = document.getElementById('headerMeta');
    const conversation = conversations[currentIndex];
    
    console.log('[Stats] Conversation object:', conversation);
    
    if (headerTitleEl) headerTitleEl.textContent = conversation?.title || 'Untitled Conversation';
    if (headerMetaEl && conversation) {
        try {
            const meta = formatHeaderMeta(conversation);
            console.log('[Stats] Meta formatted:', meta);
            headerMetaEl.innerHTML = escapeHtml(meta);
        } catch (e) {
            console.error('[Stats] Error formatting header meta:', e);
            headerMetaEl.innerHTML = 'Error loading meta';
        }
    }

    // Bottom nav counters
    const bottomCurrent = document.getElementById('bottomCurrentConversation');
    const bottomTotal = document.getElementById('bottomTotalConversations');
    if (bottomCurrent) bottomCurrent.textContent = currentIndex + 1;
    if (bottomTotal) bottomTotal.textContent = conversations.length;
    
    console.log('[Stats] updateStats complete');
}



// Calculate AI summary metrics (kept for export functionality)
function calculateAiSummary(aiLabel) {
    // First try to get the comparison data from the exported file if available
    let comparisonData = window.lastComparisonData;
    
    // If not available in memory, try to get from localStorage
    if (!comparisonData) {
        try {
            const savedComparison = localStorage.getItem(`comparisonData_${currentIndex}`);
            if (savedComparison) {
                comparisonData = JSON.parse(savedComparison);
                console.log('Loaded comparison data from localStorage:', comparisonData);
            }
        } catch (e) {
            console.warn('Failed to load comparison data from localStorage:', e);
        }
    }
    
    // If we have comparison data with summary, use it
    if (comparisonData && comparisonData.summary) {
        const summary = comparisonData.summary;
        const dimensions = ['presence_resonance', 'field_continuity', 'somatic_drift', 'reflective_trace', 'overall_state'];
        
        // Calculate overall MAE average
        const maeValues = dimensions.map(dim => summary[dim]?.post_mae).filter(v => v != null);
        const avgMae = maeValues.length > 0 ? maeValues.reduce((a, b) => a + b, 0) / maeValues.length : null;
        
        // Find best and worst dimensions
        let bestDim = null;
        let worstDim = null;
        let bestMae = Infinity;
        let worstMae = -Infinity;
        
        dimensions.forEach(dim => {
            const mae = summary[dim]?.post_mae;
            if (mae != null) {
                if (mae < bestMae) {
                    bestMae = mae;
                    bestDim = dim;
                }
                if (mae > worstMae) {
                    worstMae = mae;
                    worstDim = dim;
                }
            }
        });
        
        // Generate overall rating
        let overallRating = 'Unknown';
        if (avgMae != null) {
            if (avgMae < 0.5) overallRating = 'Excellent';
            else if (avgMae < 1.0) overallRating = 'Good';
            else if (avgMae < 1.5) overallRating = 'Fair';
            else overallRating = 'Poor';
        }
        
        // Format dimension names
        const formatDimension = (dim) => dim.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        return {
            overall: `${overallRating} agreement (MAE avg: ${avgMae ? avgMae.toFixed(1) : 'N/A'})`,
            best: bestDim ? `${formatDimension(bestDim)} (${bestMae.toFixed(1)})` : 'N/A',
            worst: worstDim ? `${formatDimension(worstDim)} (${bestMae.toFixed(1)})` : 'N/A'
        };
    }
    
    // If we have AI labels but no comparison data, show a basic status
    if (aiLabel && Object.keys(aiLabel).length > 0) {
        return {
            overall: 'AI labeling complete - comparison pending',
            best: 'Run comparison to see metrics',
            worst: 'Run comparison to see metrics'
        };
    }
    
    // Default fallback
    return {
        overall: 'Analysis in progress...',
        best: 'Calculating...',
        worst: 'Calculating...'
    };
}

// Navigate to dashboard
function viewDashboard() {
    window.location.href = 'dashboard.html';
}

function displayCurrentConversation() {
    if (conversations.length === 0) {
        document.getElementById('conversationDisplay').innerHTML = 
            '<p>No conversations to display.</p>';
        return;
    }

    // Safety check for currentIndex
    if (typeof currentIndex !== 'number' || currentIndex < 0 || currentIndex >= conversations.length) {
        console.warn('Invalid currentIndex in displayCurrentConversation:', currentIndex);
        currentIndex = 0; // Reset to safe value
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
    html += renderSurveySection(currentIndex, messages, 'beginning', surveyStateManager, labelStorage.getAllLabels());
    
    // Add survey at turn 6 (initially hidden)
    if (messages.length >= 6) {
        html += renderSurveySection(currentIndex, messages, 'turn6', surveyStateManager, labelStorage.getAllLabels());
    }
    
    // Add survey at the end (initially hidden)
    if (messages.length > 6) {
        html += renderSurveySection(currentIndex, messages, 'end', surveyStateManager, labelStorage.getAllLabels());
    }

    html += `
                    </div>
                </div>
            </div>
            <div class="conversation-main">
                <div class="conversation">
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
    
    // Update header/bottom
    updateStats();

    // Initialize scroll detection after DOM is updated
    scrollDetectionManager.initializeScrollDetection();
    
    // Update save status display
    updateSaveStatusDisplay();
}

// Survey navigation functions
function nextSurveyQuestion(position) {
    try {
        const configManager = new SurveyConfigManager();
        const surveyQuestions = configManager.getQuestions();
        
        console.log('[Survey Navigation] Next question:', {
            position,
            currentState: surveyStateManager.getState(position),
            totalQuestions: surveyQuestions.length,
            canGoNext: surveyStateManager.getState(position) < surveyQuestions.length - 1
        });
        
        if (surveyStateManager.getState(position) < surveyQuestions.length - 1) {
            surveyStateManager.setState(position, surveyStateManager.getState(position) + 1);
            displayCurrentConversation();
        } else {
            console.log('[Survey Navigation] Cannot go to next question - already at last question');
        }
    } catch (error) {
        console.error('[Survey Navigation] Error in nextSurveyQuestion:', error);
        alert('Error navigating to next question. Please check the console for details.');
    }
}

function previousSurveyQuestion(position) {
    try {
        console.log('[Survey Navigation] Previous question:', {
            position,
            currentState: surveyStateManager.getState(position),
            canGoPrevious: surveyStateManager.getState(position) > 0
        });
        
        if (surveyStateManager.getState(position) > 0) {
            surveyStateManager.setState(position, surveyStateManager.getState(position) - 1);
            displayCurrentConversation();
        } else {
            console.log('[Survey Navigation] Cannot go to previous question - already at first question');
        }
    } catch (error) {
        console.error('[Survey Navigation] Error in previousSurveyQuestion:', error);
        alert('Error navigating to previous question. Please check the console for details.');
    }
}

function finishSurvey(position) {
    // Replace the survey section with a final message view
    const container = document.querySelector(`.survey-${position}`);
    if (!container) {
        console.warn('Survey container not found for position:', position);
        return;
    }
    
    // Mark this survey section as completed for the current conversation
    surveyStateManager.markCompleted(position, currentIndex);
    
    container.innerHTML = `
        <div class="survey-complete">
            <div class="survey-progress">Completed</div>
            <p>Your answers will be exported when you are ready, you can review your answers by going to previous questions.</p>
            <div class="survey-navigation">
                <button class="btn btn--outline" onclick="reopenSurvey('${position}')">Previous</button>
            </div>
        </div>`;
    
    // Add a class to indicate this section is completed
    container.classList.add('survey-completed');
}

function reopenSurvey(position) {
    // Return to the last question in this survey section
    const configManager = new SurveyConfigManager();
    const surveyQuestions = configManager.getQuestions();
    
    surveyStateManager.setState(position, surveyQuestions.length - 1);
    
    // Clear the completed state for this position for the current conversation
    surveyStateManager.clearCompleted(position, currentIndex);
    
    displayCurrentConversation();
}

// Helper function to clear old comparison data from memory
function clearOldComparisonData() {
    // Clear the global comparison data when switching conversations
    if (window.lastComparisonData) {
        delete window.lastComparisonData;
        console.log('Cleared old comparison data from memory');
    }
}

// Navigation functions
function nextConversation() {
    if (currentIndex < conversations.length - 1) {
        // Clear old comparison data before switching
        clearOldComparisonData();
        
        currentIndex++;
        // Reset survey questions to beginning when changing conversations
        surveyStateManager.resetPositionStates();
        // Note: completed states are now conversation-specific
        updateStats();
        displayCurrentConversation();
        // Ensure viewport starts at top for the new conversation
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
}

function previousConversation() {
    if (currentIndex > 0) {
        // Clear old comparison data before switching
        clearOldComparisonData();
        
        currentIndex--;
        // Reset survey questions to beginning when changing conversations
        surveyStateManager.resetPositionStates();
        // Note: completed states are now conversation-specific
        updateStats();
        displayCurrentConversation();
        // Ensure viewport starts at top for the new conversation
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
}

// Survey response handling
function updateSurveyResponse(conversationIndex, questionId, rating, position = 'beginning') {
    labelStorage.updateSurveyResponse(conversationIndex, questionId, rating, position);
    
    // Update save status since human labels changed
    updateSaveStatusDisplay();
    
    // Refresh the display to show the selected rating description
    displayCurrentConversation();
}

// Hover preview functions
function showHoverPreview(rating, questionId, conversationIndex, position = 'beginning') {
    const surveyResponses = labelStorage.getLabels(conversationIndex)?.survey?.[position] || {};
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
    const surveyResponses = labelStorage.getLabels(conversationIndex)?.survey?.[position] || {};
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
            const instructionText = getInstructionText(questionId);
            descriptionElement.textContent = instructionText;
        }
    }
    
    // Remove hover-filled class from all rating options
    const ratingOptions = document.querySelectorAll(`.survey-${position} .rating-option`);
    ratingOptions.forEach(option => {
        option.classList.remove('hover-filled');
    });
}

function getInstructionText(questionId) {
    switch (questionId) {
        case 'presence_resonance':
            return 'Rate your level of presence';
        case 'field_continuity':
            return 'Rate how coherent your thoughts were';
        case 'somatic_drift':
            return 'Rate how embodied you felt';
        case 'reflective_trace':
            return 'Rate how meaningful the insights were';
        case 'overall_emotional_state':
            return 'Rate your overall emotional balance';
        default:
            return 'Rate your response';
    }
}

// Data loading and processing
async function loadConversations() {
    try {
        console.log('[Load] Starting to load conversations...');
        console.log('[Load] Current state - conversations:', conversations.length, 'currentIndex:', currentIndex);
        
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
        console.log('[Load] Set currentIndex to:', currentIndex);
        
        // Initialize storage managers
        initializeStorageManagers();
        
        // Try to restore comparison data from localStorage for current conversation
        try {
            const savedComparison = localStorage.getItem(`comparisonData_${currentIndex}`);
            if (savedComparison) {
                const comparisonData = JSON.parse(savedComparison);
                window.lastComparisonData = comparisonData;
                console.log('[Load] Restored comparison data from localStorage:', comparisonData);
            }
        } catch (e) {
            console.warn('[Load] Failed to restore comparison data from localStorage:', e);
        }
        
        console.log('[Load] After loading saved data:');
        console.log('[Load] Labels:', labelStorage.getAllLabels());
        console.log('[Load] Completed states:', surveyStateManager.states.completed);
        console.log('[Load] AI labels:', aiLabelStorage.getAllAiLabels());
        
        updateStats();
        displayCurrentConversation();
        
        console.log('[Load] Load complete - conversations:', conversations.length, 'currentIndex:', currentIndex);
    } catch (error) {
        console.error('Error loading conversations:', error);
        document.getElementById('conversationDisplay').innerHTML = 
            '<p style="color: red;">Error loading conversations: ' + error.message + '</p>';
    }
}

// AI labeling functions
async function runAiLabelingForCurrentQuiet() {
    if (typeof labelConversationWithAI !== 'function') {
        throw new Error('AI labeling module not loaded');
    }
    const conv = conversations[currentIndex];
    const result = await labelConversationWithAI(conv);
    aiLabelStorage.setAiLabels(currentIndex, result);
    
    // Compute and display metrics for this single conversation
    try {
        const single = [buildExportPayloadForIndex(currentIndex)];
        const metrics = computeComparisons(single);
        console.log('[AI Labeling] Metrics for conversation', currentIndex + 1, metrics);
        renderAiMetrics(metrics);
    } catch (e) {
        console.warn('Failed to compute/display AI metrics', e);
    }
}

// Build a single export item for a specific conversation index
function buildExportPayloadForIndex(index) {
    const conv = conversations[index];
    const messages = extractMessages(conv);
    const convoTitle = conv.title || 'Untitled Conversation';
    const convoObj = {
        conversation_index: index,
        conversation_title: convoTitle,
        num_turns: messages.length,
        assessments: { pre: { human: {}, ai: {} }, mid: { human: {}, ai: {} }, post: { human: {}, ai: {} } },
        messages: messages.map(m => ({ role: m.role, text: m.content }))
    };
    // Human
    const human = labelStorage.getLabels(index)?.survey || {};
    if (human.beginning) {
        convoObj.assessments.pre.human = mapSurveyToGuide(human.beginning);
    }
    if (human.turn6) {
        convoObj.assessments.mid.human = mapSurveyToGuide(human.turn6);
    }
    if (human.end) {
        convoObj.assessments.post.human = mapSurveyToGuide(human.end);
    }
    // AI
    const ai = aiLabelStorage.getAiLabels(index) || {};
    if (ai.pre) convoObj.assessments.pre.ai = ai.pre;
    if (ai.mid) convoObj.assessments.post.ai = ai.mid;
    if (ai.post) convoObj.assessments.post.ai = ai.post;
    return convoObj;
}

function mapSurveyToGuide(section) {
    return {
        presence_resonance: section.presence_resonance ?? null,
        field_continuity: section.field_continuity ?? null,
        somatic_drift: section.somatic_drift ?? null,
        reflective_trace: section.reflective_trace ?? null,
        overall_state: section.overall_emotional_state ?? null,
        notes: section.notes || undefined
    };
}

// Unified flow: run AI then export combined + comparisons with UI feedback
async function saveAndCompareWithAI() {
    const button = document.getElementById('saveCompareBtn');
    const originalText = button.textContent;
    
    // Safety check for currentIndex
    if (typeof currentIndex !== 'number' || currentIndex < 0) {
        console.error('Invalid currentIndex:', currentIndex);
        alert('Error: No conversation selected. Please refresh the page.');
        return;
    }
    
    try {
        // Check if conversation needs saving
        if (!saveStatusManager.needsSaving(currentIndex, labelStorage.getAllLabels())) {
            button.textContent = 'Already saved!';
            button.classList.add('btn--info');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('btn--info');
            }, 2000);
            return;
        }
        
        // Step 1: Show "AI labeling..." in button
        button.disabled = true;
        button.textContent = 'AI labeling...';
        
        // Step 2: Label current conversation with AI (quiet)
        await runAiLabelingForCurrentQuiet();
        
        // Step 3: Export combined + comparisons for current conversation only
        exportCombinedAndComparisonsForIndex(
            conversations, 
            labelStorage.getAllLabels(), 
            aiLabelStorage.getAllAiLabels(), 
            currentIndex, 
            window.computeComparisons, 
            renderAiMetrics
        );
        
        // Step 4: Update last save info
        saveStatusManager.updateLastSaveInfo(currentIndex, labelStorage.getAllLabels());
        
        // Step 5: Show "Saved!" briefly
        button.textContent = 'Saved!';
        button.classList.add('btn--success');
        
        // Step 6: Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('btn--success');
            button.disabled = false;
        }, 2000);
        
    } catch (err) {
        console.error('Save and compare failed', err);
        
        // Provide more specific error messages for common issues
        let errorMessage = 'Failed to save and compare with AI. ';
        if (err.message === 'Missing API Key') {
            errorMessage += 'Please enter your OpenAI API key in the dropdown menu above.';
        } else if (err.message.includes('API key')) {
            errorMessage += 'Please check your API key configuration.';
        } else {
            errorMessage += 'See console for details.';
        }
        
        alert(errorMessage);
        
        // Reset button on error
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Display save status for current conversation
function updateSaveStatusDisplay() {
    const button = document.getElementById('saveCompareBtn');
    if (!button || typeof currentIndex !== 'number' || currentIndex < 0) return;
    
    const lastSaveTime = saveStatusManager.getLastSaveTime(currentIndex);
    
    if (lastSaveTime) {
        try {
            const timeAgo = saveStatusManager.getTimeAgo(lastSaveTime);
            button.title = `Last saved: ${lastSaveTime.toLocaleString()} (${timeAgo} ago)`;
            
            // Add visual indicator if recently saved
            if (saveStatusManager.needsSaving(currentIndex, labelStorage.getAllLabels())) {
                button.classList.remove('btn--saved');
            } else {
                button.classList.add('btn--saved');
            }
        } catch (e) {
            console.warn('Error parsing save time in updateSaveStatusDisplay:', e);
            button.title = 'Last saved: recently';
            button.classList.remove('btn--saved');
        }
    } else {
        button.title = 'Not saved yet';
        button.classList.remove('btn--saved');
    }
}

// Make functions available globally for backward compatibility
window.nextSurveyQuestion = nextSurveyQuestion;
window.previousSurveyQuestion = previousSurveyQuestion;
window.finishSurvey = finishSurvey;
window.reopenSurvey = reopenSurvey;
window.nextConversation = nextConversation;
window.previousConversation = previousConversation;
window.updateSurveyResponse = updateSurveyResponse;
window.showHoverPreview = showHoverPreview;
window.hideHoverPreview = hideHoverPreview;
window.saveAndCompareWithAI = saveAndCompareWithAI;
window.viewDashboard = viewDashboard;

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
