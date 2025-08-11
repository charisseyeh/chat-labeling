// Scroll detection and survey visibility module

export class ScrollDetectionManager {
    constructor() {
        this.messageObserver = null;
        this.currentVisibleMessage = 0;
    }

    initializeScrollDetection() {
        // Clean up existing observer
        if (this.messageObserver) {
            this.messageObserver.disconnect();
        }
        
        // Create new intersection observer
        this.messageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const messageIndex = parseInt(entry.target.dataset.messageIndex);
                    console.log('Message visible:', messageIndex);
                    
                    // Only add visual indicator if this message triggers a survey
                    const shouldHighlight = this.shouldHighlightMessage(messageIndex);
                    
                    // Remove highlight from all messages
                    document.querySelectorAll('.message').forEach(msg => {
                        msg.classList.remove('message-current');
                    });
                    
                    // Add highlight only if this message triggers a survey
                    if (shouldHighlight) {
                        entry.target.classList.add('message-current');
                    }
                    
                    this.updateSurveyVisibility(messageIndex);
                }
            });
        }, {
            threshold: 0.5, // Trigger when 50% of message is visible
            rootMargin: '-10% 0px -10% 0px' // Trigger slightly before message is fully visible
        });
        
        // Observe all messages
        const messages = document.querySelectorAll('.message');
        messages.forEach(message => {
            this.messageObserver.observe(message);
        });
        
        console.log('Scroll detection initialized for', messages.length, 'messages');
        
        // Add a test function to manually trigger survey visibility
        window.testScrollDetection = () => {
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

    shouldHighlightMessage(messageIndex) {
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

    updateSurveyVisibility(currentMessageIndex) {
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

    cleanup() {
        if (this.messageObserver) {
            this.messageObserver.disconnect();
            this.messageObserver = null;
        }
    }
}

// Make functions available globally for backward compatibility
window.initializeScrollDetection = function() {
    // This will be set by the main conversation module
    console.warn('initializeScrollDetection called before ScrollDetectionManager is initialized');
};
