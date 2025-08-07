# Dark Mode Implementation

This project now includes comprehensive dark mode support across all HTML files and components.

## Features

- **Automatic System Preference Detection**: The app automatically detects and applies the user's system dark mode preference
- **Manual Toggle**: Users can manually toggle between light and dark modes using the button in the top-right corner
- **Persistent Preference**: User's dark mode choice is saved in localStorage and persists across sessions
- **Comprehensive Styling**: All components, including conversations, surveys, navigation, and forms are styled for dark mode

## Files Modified

### New Files Created
- `styles/dark-mode.css` - Complete dark mode stylesheet
- `js/dark-mode.js` - Dark mode toggle functionality and system preference detection
- `README-dark-mode.md` - This documentation file

### Files Updated
- `labeler.html` - Added dark mode CSS and JS includes
- `labeler-modular.html` - Added dark mode CSS and JS includes
- `labeler-sidebar.html` - Added dark mode CSS and JS includes
- `labeler-original.html` - Added dark mode CSS and JS includes
- `index.html` - Added dark mode CSS and JS includes
- `test-scroll.html` - Added dark mode CSS and JS includes

## How It Works

### CSS Variables
The dark mode uses CSS custom properties (variables) defined in `:root` for consistent theming:

```css
:root {
    --dark-bg-primary: #1a1a1a;
    --dark-bg-secondary: #2d2d2d;
    --dark-bg-tertiary: #3a3a3a;
    --dark-text-primary: #ffffff;
    --dark-text-secondary: #b3b3b3;
    --dark-text-muted: #808080;
    --dark-border: #404040;
    --dark-accent: #4a9eff;
    /* ... more variables */
}
```

### JavaScript Functionality
The dark mode toggle is handled by `js/dark-mode.js`:

- **System Preference Detection**: Uses `window.matchMedia('(prefers-color-scheme: dark)')`
- **Local Storage**: Saves user preference in `localStorage.getItem('darkMode')`
- **Toggle Button**: Creates a floating button in the top-right corner
- **Event Listeners**: Listens for system theme changes and applies them automatically

### Components Styled

1. **Layout & Navigation**
   - Header and navigation buttons
   - Background colors and borders
   - Text colors and hover states

2. **Conversation Display**
   - Message bubbles (user and assistant)
   - Conversation headers and titles
   - Message content and markdown elements

3. **Survey Components**
   - Survey sections and containers
   - Rating scales and circles
   - Question text and descriptions
   - Navigation buttons

4. **Forms & Inputs**
   - Text inputs and search boxes
   - Select dropdowns
   - Buttons and interactive elements

5. **Additional Elements**
   - Scrollbars
   - Tooltips and overlays
   - Export sections
   - Labels and annotations

## Usage

### For Users
1. The dark mode toggle button appears in the top-right corner of all pages
2. Click the button to switch between light and dark modes
3. Your preference is automatically saved and will persist across sessions
4. The app will initially match your system's dark mode preference

### For Developers
To add dark mode support to new components:

1. **Add CSS Classes**: Use the existing dark mode variables
```css
.my-component {
    background: var(--dark-bg-secondary);
    color: var(--dark-text-primary);
    border: 1px solid var(--dark-border);
}
```

2. **Include Dark Mode Styles**: Add dark mode overrides
```css
body.dark-mode .my-component {
    background: var(--dark-bg-secondary);
    color: var(--dark-text-primary);
}
```

3. **Include Scripts**: Add the dark mode script to new HTML files
```html
<script src="js/dark-mode.js"></script>
```

## Browser Support

- **Modern Browsers**: Full support for CSS custom properties and `matchMedia`
- **Fallback**: Gracefully degrades to light mode on older browsers
- **Mobile**: Responsive design works on mobile devices

## Accessibility

- **High Contrast**: Dark mode maintains WCAG contrast ratios
- **Keyboard Navigation**: Toggle button is keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Reduced Motion**: Respects user's motion preferences

## Future Enhancements

- **Theme Customization**: Allow users to customize accent colors
- **Auto-switching**: Time-based automatic theme switching
- **Animation Smoothness**: Improved transitions between themes
- **Component Library**: Standardized dark mode components for reuse 