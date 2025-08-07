// Component functionality - Labels, Survey, Forms

// Global state (shared with other modules)
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

// Survey Configuration - Easy to modify survey frequency
const SURVEY_CONFIG = {
    // Survey will appear after these specific message counts
    specificTriggers: [6],
    
    // Survey will appear every N messages (set to 0 to disable)
    everyNthMessage: 0,
    
    // Show survey at the end if conversation has more than this many messages
    showAtEndIfMoreThan: 1,
    
    // Show survey after every assistant message (true/false)
    afterEveryAssistantMessage: false,
    
    // Show survey after every user message (true/false)
    afterEveryUserMessage: false,
    
    // Maximum number of surveys per conversation (0 = unlimited)
    maxSurveysPerConversation: 0,
    
    // Show survey before the first message (true/false)
    showBeforeFirstMessage: true
};

// Survey questions data
const surveyQuestions = [
    {
        id: 'presence_resonance',
        title: 'At this point in the conversation, how present did you feel?',
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
        title: 'How coherent were your thoughts?',
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
        title: 'How embodied did you feel?',
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
        title: 'How meaningful were the insights?',
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
        title: 'How emotionally balanced did you feel?',
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

// Helper function to check if survey should appear
function shouldShowSurvey(messageCount, role, surveyCount = 0) {
    // Check if we've hit the maximum surveys per conversation
    if (SURVEY_CONFIG.maxSurveysPerConversation > 0 && surveyCount >= SURVEY_CONFIG.maxSurveysPerConversation) {
        return false;
    }
    
    // Check specific triggers
    if (SURVEY_CONFIG.specificTriggers.includes(messageCount)) {
        return true;
    }
    
    // Check every Nth message
    if (SURVEY_CONFIG.everyNthMessage > 0 && messageCount % SURVEY_CONFIG.everyNthMessage === 0 && messageCount > 0) {
        return true;
    }
    
    // Check after every assistant message
    if (SURVEY_CONFIG.afterEveryAssistantMessage && role === 'assistant') {
        return true;
    }
    
    // Check after every user message
    if (SURVEY_CONFIG.afterEveryUserMessage && role === 'user') {
        return true;
    }
    
    return false;
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

// Survey functions
function renderSurveySection(conversationIndex, messages, position = 'beginning') {
    const surveyResponses = labels[conversationIndex]?.survey?.[position] || {};
    const question = surveyQuestions[surveyQuestionStates[position]];
    const selectedRating = surveyResponses[question.id] || 0;
    
    let surveyHtml = '<div class="survey-section">';
    surveyHtml += `<div class="survey-progress">Questions (${surveyQuestionStates[position] + 1}/${surveyQuestions.length})</div>`;
    surveyHtml += '<div class="survey-question">';
    surveyHtml += `<div class="question-text">${question.title}</div>`;
    
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
    
    surveyHtml += `<div class="rating-description" id="description-${question.id}">${descriptionText}</div>`;
    
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
        surveyHtml += `<button class="nav-button secondary" onclick="previousSurveyQuestion('${position}')">Previous</button>`;
    }
    if (surveyQuestionStates[position] < surveyQuestions.length - 1) {
        surveyHtml += `<button class="nav-button primary" onclick="nextSurveyQuestion('${position}')">Next</button>`;
    } else {
        surveyHtml += `<button class="nav-button primary" onclick="finishSurvey('${position}')">Finish</button>`;
    }
    surveyHtml += '</div>';
    
    surveyHtml += '</div>';
    return surveyHtml;
}

function nextSurveyQuestion(position = 'beginning') {
    if (surveyQuestionStates[position] < surveyQuestions.length - 1) {
        surveyQuestionStates[position]++;
        displayCurrentConversation();
    }
}

function previousSurveyQuestion(position = 'beginning') {
    if (surveyQuestionStates[position] > 0) {
        surveyQuestionStates[position]--;
        displayCurrentConversation();
    }
}

function finishSurvey(position = 'beginning') {
    // This function can be used to hide survey sections if needed
    console.log('Survey finished for position:', position);
} 

// Hover preview functions
function showHoverPreview(rating, questionId, conversationIndex, position = 'beginning') {
    // Remove all hover classes
    const ratingOptions = document.querySelectorAll('.rating-option');
    ratingOptions.forEach(option => {
        option.classList.remove('hover-filled');
    });
    
    // Add hover-filled class to all options up to the hovered one
    for (let i = 1; i <= rating; i++) {
        const option = ratingOptions[i - 1];
        if (option) {
            option.classList.add('hover-filled');
        }
    }
    
    // Show description for hovered rating
    const descriptionElement = document.getElementById(`description-${questionId}`);
    if (descriptionElement) {
        const question = surveyQuestions.find(q => q.id === questionId);
        if (question && question.options[rating - 1]) {
            descriptionElement.textContent = question.options[rating - 1];
        }
    }
}

function hideHoverPreview(questionId, conversationIndex, position = 'beginning') {
    // Remove all hover classes
    const ratingOptions = document.querySelectorAll('.rating-option');
    ratingOptions.forEach(option => {
        option.classList.remove('hover-filled');
    });
    
    // Restore original state
    const surveyResponses = labels[conversationIndex]?.survey?.[position] || {};
    const selectedRating = surveyResponses[questionId] || 0;
    
    // Show description for selected rating or instruction text
    const descriptionElement = document.getElementById(`description-${questionId}`);
    if (descriptionElement) {
        if (selectedRating > 0) {
            const question = surveyQuestions.find(q => q.id === questionId);
            if (question && question.options[selectedRating - 1]) {
                descriptionElement.textContent = question.options[selectedRating - 1];
            }
        } else {
            // Show instruction text based on question type
            const question = surveyQuestions.find(q => q.id === questionId);
            let instructionText;
            switch (questionId) {
                case 'presence_resonance':
                    instructionText = 'Rate your level of presence';
                    break;
                case 'field_continuity':
                    instructionText = 'Rate how coherent your thoughts were';
                    break;
                case 'somatic_drift':
                    instructionText = 'Rate how embodied you felt';
                    break;
                case 'reflective_trace':
                    instructionText = 'Rate how meaningful the insights were';
                    break;
                case 'overall_emotional_state':
                    instructionText = 'Rate your overall emotional balance';
                    break;
                default:
                    instructionText = 'Rate your response';
            }
            descriptionElement.textContent = instructionText;
        }
    }
} 