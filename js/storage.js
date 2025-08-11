// Storage and data persistence module

// Label storage management
export class LabelStorage {
    constructor() {
        this.labels = {};
        this.loadSavedLabels();
    }

    loadSavedLabels() {
        try {
            const savedLabels = localStorage.getItem('surveyLabels');
            if (savedLabels) {
                this.labels = JSON.parse(savedLabels);
                console.log('Loaded saved labels:', this.labels);
            }
        } catch (error) {
            console.warn('Failed to load saved labels:', error);
            this.labels = {};
        }
    }

    saveLabelsToStorage() {
        try {
            localStorage.setItem('surveyLabels', JSON.stringify(this.labels));
            console.log('Saved labels to storage:', this.labels);
        } catch (error) {
            console.warn('Failed to save labels to storage:', error);
        }
    }

    getLabels(conversationIndex) {
        return this.labels[conversationIndex] || {};
    }

    setLabels(conversationIndex, labels) {
        this.labels[conversationIndex] = labels;
        this.saveLabelsToStorage();
    }

    updateLabel(conversationIndex, field, value) {
        if (!this.labels[conversationIndex]) {
            this.labels[conversationIndex] = {};
        }
        this.labels[conversationIndex][field] = value;
        this.saveLabelsToStorage();
    }

    updateSurveyResponse(conversationIndex, questionId, rating, position = 'beginning') {
        if (!this.labels[conversationIndex]) {
            this.labels[conversationIndex] = {};
        }
        if (!this.labels[conversationIndex].survey) {
            this.labels[conversationIndex].survey = {};
        }
        if (!this.labels[conversationIndex].survey[position]) {
            this.labels[conversationIndex].survey[position] = {};
        }
        this.labels[conversationIndex].survey[position][questionId] = rating;
        
        // Auto-save labels to localStorage
        this.saveLabelsToStorage();
        
        return this.labels[conversationIndex];
    }

    getAllLabels() {
        return this.labels;
    }

    clearAllLabels() {
        this.labels = {};
        try {
            localStorage.removeItem('surveyLabels');
            console.log('Cleared all saved labels');
        } catch (error) {
            console.warn('Failed to clear saved labels:', error);
        }
    }
}

// AI Label storage management
export class AiLabelStorage {
    constructor() {
        this.aiLabels = {};
        this.loadSavedAiLabels();
    }

    loadSavedAiLabels() {
        try {
            const savedAiLabels = localStorage.getItem('aiLabels');
            if (savedAiLabels) {
                this.aiLabels = JSON.parse(savedAiLabels);
                console.log('Loaded saved AI labels:', this.aiLabels);
            }
        } catch (error) {
            console.warn('Failed to load saved AI labels:', error);
            this.aiLabels = {};
        }
    }

    saveAiLabelsToStorage() {
        try {
            localStorage.setItem('aiLabels', JSON.stringify(this.aiLabels));
            console.log('Saved AI labels to storage:', this.aiLabels);
        } catch (error) {
            console.warn('Failed to save AI labels to storage:', error);
        }
    }

    getAiLabels(conversationIndex) {
        return this.aiLabels[conversationIndex] || {};
    }

    setAiLabels(conversationIndex, aiLabels) {
        this.aiLabels[conversationIndex] = aiLabels;
        this.saveAiLabelsToStorage();
    }

    getAllAiLabels() {
        return this.aiLabels;
    }

    clearAllAiLabels() {
        this.aiLabels = {};
        try {
            localStorage.removeItem('aiLabels');
            console.log('Cleared all saved AI labels');
        } catch (error) {
            console.warn('Failed to clear saved AI labels:', error);
        }
    }
}

// Save status management
export class SaveStatusManager {
    constructor() {
        this.lastSaveTimes = {};
        this.lastSaveLabels = {};
    }

    needsSaving(conversationIndex, labels) {
        // Safety check for conversationIndex
        if (typeof conversationIndex !== 'number' || conversationIndex < 0) {
            console.warn('[Save Check] Invalid conversation index:', conversationIndex);
            return false;
        }
        
        const lastSaveKey = `lastSave_${conversationIndex}`;
        const lastSave = localStorage.getItem(lastSaveKey);
        
        if (!lastSave) {
            return true; // Never saved before
        }
        
        try {
            const lastSaveTime = new Date(lastSave).getTime();
            const currentTime = new Date().getTime();
            const timeSinceLastSave = currentTime - lastSaveTime;
            
            // Check if human labels have changed since last save
            const humanLabels = labels[conversationIndex]?.survey || {};
            const lastSaveLabelsKey = `lastSaveLabels_${conversationIndex}`;
            const lastSaveLabels = localStorage.getItem(lastSaveLabelsKey);
            
            if (lastSaveLabels) {
                try {
                    const lastLabels = JSON.parse(lastSaveLabels);
                    const currentLabels = JSON.stringify(humanLabels);
                    
                    if (currentLabels !== lastLabels) {
                        console.log(`[Save Check] Human labels changed for conversation ${conversationIndex}, needs saving`);
                        return true;
                    }
                } catch (e) {
                    console.warn('[Save Check] Error parsing last save labels:', e);
                    return true; // If we can't parse, assume we need to save
                }
            }
            
            // Check if it's been more than 1 hour since last save (as a safety net)
            const oneHour = 60 * 60 * 1000;
            if (timeSinceLastSave > oneHour) {
                console.log(`[Save Check] More than 1 hour since last save for conversation ${conversationIndex}, needs saving`);
                return true;
            }
            
            console.log(`[Save Check] Conversation ${conversationIndex} doesn't need saving (last save: ${new Date(lastSaveTime).toLocaleString()})`);
            return false;
        } catch (e) {
            console.warn('[Save Check] Error in needsSaving:', e);
            return true; // If there's an error, assume we need to save
        }
    }

    updateLastSaveInfo(conversationIndex, labels) {
        // Safety check for conversationIndex
        if (typeof conversationIndex !== 'number' || conversationIndex < 0) {
            console.warn('[Save Check] Invalid conversation index in updateLastSaveInfo:', conversationIndex);
            return;
        }
        
        try {
            const lastSaveKey = `lastSave_${conversationIndex}`;
            const lastSaveLabelsKey = `lastSaveLabels_${conversationIndex}`;
            
            localStorage.setItem(lastSaveKey, new Date().toISOString());
            localStorage.setItem(lastSaveLabelsKey, JSON.stringify(labels[conversationIndex]?.survey || {}));
            
            console.log(`[Save Check] Updated last save info for conversation ${conversationIndex}`);
        } catch (e) {
            console.error('[Save Check] Error updating last save info:', e);
        }
    }

    resetSaveStatus(conversationIndex) {
        if (conversationIndex === undefined) {
            console.warn('resetSaveStatus called without conversationIndex');
            return;
        }
        
        const lastSaveKey = `lastSave_${conversationIndex}`;
        const lastSaveLabelsKey = `lastSaveLabels_${conversationIndex}`;
        
        localStorage.removeItem(lastSaveKey);
        localStorage.removeItem(lastSaveLabelsKey);
        
        console.log(`[Save Check] Reset save status for conversation ${conversationIndex}`);
    }

    getLastSaveTime(conversationIndex) {
        const lastSaveKey = `lastSave_${conversationIndex}`;
        const lastSave = localStorage.getItem(lastSaveKey);
        return lastSave ? new Date(lastSave) : null;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
}

// Utility function to clear all saved survey data
export function clearAllSavedSurveyData() {
    try {
        localStorage.removeItem('surveyLabels');
        localStorage.removeItem('surveyCompletedStates');
        localStorage.removeItem('aiLabels');
        console.log('Cleared all saved survey data');
    } catch (error) {
        console.warn('Failed to clear saved survey data:', error);
    }
}

// Make functions available globally for backward compatibility
window.clearAllSavedSurveyData = clearAllSavedSurveyData;
