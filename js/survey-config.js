// Survey configuration module - allows users to customize their survey questions

// Default survey configuration
const DEFAULT_SURVEY_CONFIG = {
    questions: [
        {
            id: 'mood_state',
            title: 'Mood State',
            description: 'How would you describe your overall mood during this conversation?',
            options: [
                'Very negative mood',
                'Negative mood',
                'Somewhat negative mood',
                'Neutral mood',
                'Somewhat positive mood',
                'Positive mood',
                'Very positive mood'
            ]
        },
        {
            id: 'emotional_regulation',
            title: 'Emotional Regulation',
            description: 'How well were you able to manage your emotions during this conversation?',
            options: [
                'Poor emotional control',
                'Below average control',
                'Some difficulty managing',
                'Moderate emotional control',
                'Good emotional control',
                'Very good control',
                'Excellent emotional control'
            ]
        },
        {
            id: 'stress_level',
            title: 'Stress Level',
            description: 'How stressed or overwhelmed did you feel during this conversation?',
            options: [
                'Extremely stressed',
                'Very stressed',
                'Moderately stressed',
                'Mildly stressed',
                'Low stress',
                'Very low stress',
                'No stress at all'
            ]
        },
        {
            id: 'energy_level',
            title: 'Energy Level',
            description: 'How energized or motivated did you feel during this conversation?',
            options: [
                'Very low energy',
                'Low energy',
                'Somewhat low energy',
                'Moderate energy',
                'Somewhat high energy',
                'High energy',
                'Very high energy'
            ]
        },
        {
            id: 'overall_wellbeing',
            title: 'Overall Wellbeing',
            description: 'How would you rate your overall sense of wellbeing during this conversation?',
            options: [
                'Very poor wellbeing',
                'Poor wellbeing',
                'Below average wellbeing',
                'Average wellbeing',
                'Above average wellbeing',
                'Good wellbeing',
                'Excellent wellbeing'
            ]
        }
    ]
};

// Survey configuration manager
export class SurveyConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('surveyConfig');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                // Validate the config structure
                if (this.validateConfig(parsed)) {
                    return parsed;
                }
            }
        } catch (error) {
            console.warn('Failed to load survey config, using default:', error);
        }
        return this.getDefaultConfig();
    }

    saveConfig() {
        try {
            localStorage.setItem('surveyConfig', JSON.stringify(this.config));
            console.log('Survey config saved:', this.config);
        } catch (error) {
            console.warn('Failed to save survey config:', error);
        }
    }

    getDefaultConfig() {
        return JSON.parse(JSON.stringify(DEFAULT_SURVEY_CONFIG));
    }

    validateConfig(config) {
        if (!config || !Array.isArray(config.questions)) {
            return false;
        }
        
        for (const question of config.questions) {
            if (!question.id || !question.title || !Array.isArray(question.options) || question.options.length !== 7) {
                return false;
            }
        }
        
        return true;
    }

    getQuestions() {
        return this.config.questions;
    }

    getQuestionById(id) {
        return this.config.questions.find(q => q.id === id);
    }

    updateQuestion(id, updates) {
        const questionIndex = this.config.questions.findIndex(q => q.id === id);
        if (questionIndex !== -1) {
            this.config.questions[questionIndex] = { ...this.config.questions[questionIndex], ...updates };
            this.saveConfig();
            return true;
        }
        return false;
    }

    addQuestion(question) {
        if (this.validateQuestion(question)) {
            this.config.questions.push(question);
            this.saveConfig();
            return true;
        }
        return false;
    }

    removeQuestion(id) {
        const questionIndex = this.config.questions.findIndex(q => q.id === id);
        if (questionIndex !== -1) {
            this.config.questions.splice(questionIndex, 1);
            this.saveConfig();
            return true;
        }
        return false;
    }

    validateQuestion(question) {
        return question && 
               question.id && 
               question.title && 
               Array.isArray(question.options) && 
               question.options.length === 7;
    }

    resetToDefault() {
        this.config = this.getDefaultConfig();
        this.saveConfig();
    }

    // Generate AI prompt template from current config
    generateAiPromptTemplate() {
        let template = `You are an emotionally intelligent assistant evaluating the user's emotional state.

Below is the conversation so far. Rate the user's likely state on the following 1–7 scale for each variable:
1 = Not at all true, 7 = Completely true

Rate EACH variable using the detailed anchors below. Base ratings primarily on the USER's language cues and described sensations. Use brief, evidence-based explanations (quote short phrases when helpful). If there are no user messages provided, assume a neutral baseline: set all scores to 4 and explanation to "No user messages provided; neutral baseline assumption."

Variables and detailed anchors:`;

        this.config.questions.forEach((question, index) => {
            template += `\n\n${index + 1}) ${question.title} — ${question.description}`;
            question.options.forEach((option, optionIndex) => {
                template += `\n   ${optionIndex + 1}: ${option}`;
            });
        });

        template += `\n\nOutput requirements:
- Return ONLY a single valid JSON object with keys: ${this.config.questions.map(q => q.id).join(', ')}, explanation
- Each score must be an integer from 1 to 7
- The explanation should be 1–2 sentences citing concrete evidence from the user messages (if present)`;

        return template;
    }

    // Get the field names for AI output
    getFieldNames() {
        return this.config.questions.map(q => q.id);
    }
}

// Export default config for backward compatibility
export const surveyQuestions = DEFAULT_SURVEY_CONFIG.questions;
