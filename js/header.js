// Shared header component
function createHeader(title, stats = null, navigation = null) {
    return `
        <div class="header">
            <div class="header-content">
                <div class="header-left">
                    <h1>${title}</h1>
                    ${stats ? `<div class="stats">${stats}</div>` : ''}
                </div>
                ${navigation ? `<div class="header-navigation">${navigation}</div>` : ''}
            </div>
        </div>
    `;
}

// Function to initialize header with specific content
function initializeHeader(options = {}) {
    const {
        title = 'Conversation App',
        stats = null,
        navigation = null,
        targetSelector = 'body'
    } = options;
    
    const headerHtml = createHeader(title, stats, navigation);
    const target = document.querySelector(targetSelector);
    
    if (target) {
        // Insert header at the beginning of the target element
        target.insertAdjacentHTML('afterbegin', headerHtml);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createHeader, initializeHeader };
} 