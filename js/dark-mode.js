// Dark mode functionality

// Check for saved dark mode preference or default to light mode
function getDarkModePreference() {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
        return saved === 'true';
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Apply dark mode
function applyDarkMode(isDark) {
    const root = document.documentElement;
    const body = document.body;
    const toggleButton = document.getElementById('dark-mode-toggle');
    
    if (isDark) {
        root.setAttribute('data-theme', 'dark');
        body.classList.add('dark-mode'); // Keep for backward compatibility
        if (toggleButton) {
            toggleButton.textContent = '☀️';
            toggleButton.title = 'Switch to light mode';
        }
    } else {
        root.setAttribute('data-theme', 'light');
        body.classList.remove('dark-mode'); // Keep for backward compatibility
        if (toggleButton) {
            toggleButton.textContent = '🌙';
            toggleButton.title = 'Switch to dark mode';
        }
    }
    
    // Save preference
    localStorage.setItem('darkMode', isDark.toString());
}

// Toggle dark mode
function toggleDarkMode() {
    const isCurrentlyDark = document.body.classList.contains('dark-mode');
    applyDarkMode(!isCurrentlyDark);
}

// Create dark mode toggle button
function createDarkModeToggle() {
    // Check if toggle already exists
    if (document.getElementById('dark-mode-toggle')) {
        return;
    }
    
    const toggleButton = document.createElement('button');
    toggleButton.id = 'dark-mode-toggle';
    toggleButton.className = 'dark-mode-toggle';
    toggleButton.onclick = toggleDarkMode;
    
    // Add to page
    document.body.appendChild(toggleButton);
    
    // Set initial state
    const isDark = getDarkModePreference();
    applyDarkMode(isDark);
}

// Initialize dark mode when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    createDarkModeToggle();
    
    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            // Only apply system preference if user hasn't manually set a preference
            if (localStorage.getItem('darkMode') === null) {
                applyDarkMode(e.matches);
            }
        });
    }
});

// Export functions for use in other scripts
window.darkMode = {
    toggle: toggleDarkMode,
    apply: applyDarkMode,
    getPreference: getDarkModePreference
}; 