// Survey functionality module

// Survey questions data
export const surveyQuestions = [
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
                this.states.completed = JSON.parse(savedCompletedStates);
                console.log('Loaded saved completed states:', this.states.completed);
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

    isCompleted(position) {
        return this.states.completed[position] || false;
    }

    markCompleted(position) {
        this.states.completed[position] = true;
        this.saveCompletedStates();
    }

    clearCompleted(position) {
        delete this.states.completed[position];
        this.saveCompletedStates();
    }

    resetPositionStates() {
        this.states.beginning = 0;
        this.states.turn6 = 0;
        this.states.end = 0;
    }
}

// Survey rendering functions
export function renderSurveySection(conversationIndex, messages, position, surveyStateManager, labels, onUpdateResponse, onNextQuestion, onPreviousQuestion, onFinishSurvey) {
    // Check if this survey section is completed
    const isCompleted = surveyStateManager.isCompleted(position);
    
    console.log(`[Render] Survey section ${position}:`, {
        conversationIndex,
        position,
        isCompleted,
        completedStates: surveyStateManager.states.completed,
        hasLabels: !!labels[conversationIndex]?.survey?.[position]
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

export function hideHoverPreview(questionId, conversationIndex, position, labels) {
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
