// Survey functionality module
import { SurveyConfigManager } from './survey-config.js';

// Survey state management
export class SurveyStateManager {
    constructor() {
        this.states = {
            beginning: 0,
            turn6: 0,
            end: 0,
            completed: {}
        };
        this.loadSavedCompletedStates();
    }

    loadSavedCompletedStates() {
        try {
            const savedCompletedStates = localStorage.getItem('surveyCompletedStates');
            if (savedCompletedStates) {
                const oldStates = JSON.parse(savedCompletedStates);
                console.log('Loaded saved completed states:', oldStates);
                
                // Migrate old global completion states to conversation-specific format
                this.states.completed = {};
                
                // Check if this is the old format (position-based keys like 'beginning', 'turn6', 'end')
                const hasOldFormat = oldStates.beginning !== undefined || oldStates.turn6 !== undefined || oldStates.end !== undefined;
                
                if (hasOldFormat) {
                    // This is old format - migrate to new format for conversation 0 (first conversation)
                    console.log('Migrating old completion states to conversation-specific format');
                    if (oldStates.beginning) this.states.completed['0_beginning'] = true;
                    if (oldStates.turn6) this.states.completed['0_turn6'] = true;
                    if (oldStates.end) this.states.completed['0_end'] = true;
                    
                    // Save the migrated format
                    this.saveCompletedStates();
                } else {
                    // This is already the new format
                    this.states.completed = oldStates;
                }
            }
        } catch (error) {
            console.warn('Failed to load saved completed states:', error);
            this.states.completed = {};
        }
    }

    saveCompletedStates() {
        try {
            localStorage.setItem('surveyCompletedStates', JSON.stringify(this.states.completed));
            console.log('Saved completed states to storage:', this.states.completed);
        } catch (error) {
            console.warn('Failed to save completed states to storage:', error);
        }
    }

    getState(position) {
        return this.states[position] || 0;
    }

    setState(position, value) {
        this.states[position] = value;
    }

    isCompleted(position, conversationIndex = null) {
        if (conversationIndex !== null) {
            // Check if this specific conversation has completed this survey section
            const conversationSpecificKey = `${conversationIndex}_${position}`;
            if (this.states.completed[conversationSpecificKey]) {
                return true;
            }
            
            // Fallback: check if this is conversation 0 and we have old-format completion states
            // This handles the case where old data exists but hasn't been migrated yet
            if (conversationIndex === 0 && this.states.completed[position]) {
                return true;
            }
            
            return false;
        }
        // Fallback to global state for backward compatibility
        return this.states.completed[position] || false;
    }

    markCompleted(position, conversationIndex = null) {
        if (conversationIndex !== null) {
            // Mark as completed for this specific conversation
            this.states.completed[`${conversationIndex}_${position}`] = true;
            
            // If this is conversation 0, also clear any old-format completion state
            // to ensure consistency
            if (conversationIndex === 0 && this.states.completed[position]) {
                delete this.states.completed[position];
            }
        } else {
            // Fallback to global state for backward compatibility
            this.states.completed[position] = true;
        }
        this.saveCompletedStates();
    }

    clearCompleted(position, conversationIndex = null) {
        if (conversationIndex !== null) {
            // Clear completed state for this specific conversation
            delete this.states.completed[`${conversationIndex}_${position}`];
        } else {
            // Fallback to global state for backward compatibility
            delete this.states.completed[position];
        }
        this.saveCompletedStates();
    }

    resetPositionStates() {
        this.states.beginning = 0;
        this.states.turn6 = 0;
        this.states.end = 0;
    }
    
    // Debug method to show current state format
    getStateInfo() {
        return {
            positionStates: {
                beginning: this.states.beginning,
                turn6: this.states.turn6,
                end: this.states.end
            },
            completedStates: this.states.completed,
            hasOldFormat: this.states.completed.beginning !== undefined || 
                          this.states.completed.turn6 !== undefined || 
                          this.states.completed.end !== undefined
        };
    }
}

// Survey rendering functions
export function renderSurveySection(conversationIndex, messages, position, surveyStateManager, labels, onUpdateResponse, onNextQuestion, onPreviousQuestion, onFinishSurvey) {
    // Get the current survey configuration
    const configManager = new SurveyConfigManager();
    const surveyQuestions = configManager.getQuestions();
    
    // Check if this survey section is completed for this specific conversation
    const isCompleted = surveyStateManager.isCompleted(position, conversationIndex);
    
    console.log(`[Render] Survey section ${position}:`, {
        conversationIndex,
        position,
        isCompleted,
        completedStates: surveyStateManager.states.completed,
        hasLabels: !!labels[conversationIndex]?.survey?.[position],
        stateInfo: surveyStateManager.getStateInfo(),
        questionCount: surveyQuestions.length
    });
    
    if (isCompleted) {
        console.log(`[Render] Rendering completed state for ${position}`);
        // Render completed state
        let surveyHtml = `<div class="survey-section card-section survey-${position} survey-completed">`;
        surveyHtml += `<div class="survey-complete">`;
        surveyHtml += `<div class="survey-progress">Completed</div>`;
        surveyHtml += `<p>Your answers will be exported when you are ready, you can review your answers by going to previous questions.</p>`;
        surveyHtml += `<div class="survey-navigation">`;
        surveyHtml += `<button class="btn btn--outline" onclick="window.reopenSurvey('${position}')">Previous</button>`;
        surveyHtml += `</div>`;
        surveyHtml += `</div>`;
        surveyHtml += `</div>`;
        return surveyHtml;
    }
    
    const surveyResponses = labels[conversationIndex]?.survey?.[position] || {};
    const question = surveyQuestions[surveyStateManager.getState(position)];
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
    surveyHtml += `<div class="survey-progress">Questions (${surveyStateManager.getState(position) + 1}/${surveyQuestions.length})</div>`;
    surveyHtml += '<div class="survey-question">';
    surveyHtml += `<div class="question-text">${positionQuestion}</div>`;
    
    // Show instruction text or selected rating description ABOVE the rating scale
    let descriptionText;
    if (selectedRating > 0) {
        descriptionText = question.options[selectedRating - 1];
    } else {
        // Show instruction text based on question type
        descriptionText = getInstructionText(question.id);
    }
    
    surveyHtml += `<div class="rating-description" id="description-${question.id}-${position}">${descriptionText}</div>`;
    
    surveyHtml += '<div class="rating-scale">';
    
    for (let i = 1; i <= 7; i++) {
        const isSelected = selectedRating === i;
        const isFilled = i <= selectedRating; // Fill all circles up to and including selected
        
        surveyHtml += `
            <div class="rating-option ${isSelected ? 'selected' : ''} ${isFilled ? 'filled' : ''}" 
                 onclick="window.updateSurveyResponse(${conversationIndex}, '${question.id}', ${i}, '${position}')"
                 onmouseenter="window.showHoverPreview(${i}, '${question.id}', ${conversationIndex}, '${position}')"
                 onmouseleave="window.hideHoverPreview('${question.id}', ${conversationIndex}, '${position}')">
                <div class="rating-circle"></div>
            </div>
        `;
    }
    
    surveyHtml += '</div>';
    
    surveyHtml += '</div>';
    
    // Navigation buttons
    surveyHtml += '<div class="survey-navigation">';
    if (surveyStateManager.getState(position) > 0) {
        surveyHtml += `<button class="btn btn--outline" onclick="window.previousSurveyQuestion('${position}')">Previous</button>`;
    }
    if (surveyStateManager.getState(position) < surveyQuestions.length - 1) {
        surveyHtml += `<button class="btn btn--accent" onclick="window.nextSurveyQuestion('${position}')">Next</button>`;
    } else {
        surveyHtml += `<button class="btn btn--accent" onclick="window.finishSurvey('${position}')">Finish</button>`;
    }
    surveyHtml += '</div>';
    
    surveyHtml += '</div>';
    return surveyHtml;
}

// Survey utility functions
export function getQuestionForTopic(questionId) {
    const configManager = new SurveyConfigManager();
    const question = configManager.getQuestionById(questionId);
    
    if (question) {
        // Use the question title to generate a more natural question
        const title = question.title.toLowerCase();
        if (title.includes('presence')) return 'how present did you feel?';
        if (title.includes('coherent') || title.includes('continuity')) return 'how coherent did you feel?';
        if (title.includes('embodied') || title.includes('somatic')) return 'how embodied did you feel?';
        if (title.includes('insight') || title.includes('reflective')) return 'how meaningful were the insights?';
        if (title.includes('emotional') || title.includes('balance')) return 'how emotionally balanced did you feel?';
        return 'how did you feel?';
    }
    
    // Fallback for backward compatibility
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

export function getInstructionText(questionId) {
    const configManager = new SurveyConfigManager();
    const question = configManager.getQuestionById(questionId);
    
    if (question) {
        return `Rate your ${question.title.toLowerCase()}`;
    }
    
    // Fallback for backward compatibility
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

export function showHoverPreview(rating, questionId, conversationIndex, position, labels) {
    const configManager = new SurveyConfigManager();
    const question = configManager.getQuestionById(questionId);
    
    const surveyResponses = labels[conversationIndex]?.survey?.[position] || {};
    const selectedRating = surveyResponses[questionId] || 0;
    
    // Don't show hover preview if a rating is already selected
    if (selectedRating > 0) {
        console.log('Hover blocked - rating already selected:', selectedRating);
        return;
    }
    
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

export function hideHoverPreview(questionId, conversationIndex, position, labels) {
    const configManager = new SurveyConfigManager();
    const question = configManager.getQuestionById(questionId);
    
    const surveyResponses = labels[conversationIndex]?.survey?.[position] || {};
    const selectedRating = surveyResponses[questionId] || 0;
    
    const descriptionElement = document.getElementById(`description-${questionId}-${position}`);
    if (descriptionElement) {
        if (selectedRating > 0) {
            // If a rating is selected, show the selected rating description
            console.log('Hiding hover - showing selected rating:', selectedRating);
            descriptionElement.textContent = question.options[selectedRating - 1];
        } else {
            // If nothing is selected, show the default instruction text
            console.log('Hiding hover - showing default instruction');
            descriptionElement.textContent = getInstructionText(questionId);
        }
    }
    
    // Remove hover-filled class from all rating options
    const ratingOptions = document.querySelectorAll(`.survey-${position} .rating-option`);
    ratingOptions.forEach(option => {
        option.classList.remove('hover-filled');
    });
}

// Make functions available globally for backward compatibility
window.getQuestionForTopic = getQuestionForTopic;
window.getInstructionText = getInstructionText;
window.showHoverPreview = showHoverPreview;
window.hideHoverPreview = hideHoverPreview;

// Add missing functions that are referenced in conversation-core.js
window.reopenSurvey = window.reopenSurvey || function(position) {
    console.warn('reopenSurvey not loaded - this function is required for survey navigation');
};
