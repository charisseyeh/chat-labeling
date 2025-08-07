# Conversation Labeler - Sidebar Layout

This version of the conversation labeler features a new sidebar layout that displays survey responses on the left side of the conversation container.

## Features

### Side-by-Side Layout
- **Survey Sidebar**: Fixed on the left side, showing survey responses for different conversation points
- **Conversation Main**: Takes up the remaining space on the right, displaying the full conversation
- **Responsive Design**: Automatically adjusts to different screen sizes

### Survey Positions
The survey container shows responses for three key points in the conversation:

1. **Beginning** (Green border): Before the conversation starts
2. **Turn 6** (Orange border): After 6 message exchanges
3. **End** (Red border): At the end of the conversation

### Visual Indicators
- Each survey section has a distinct color-coded border
- Gradient backgrounds help distinguish between different survey positions
- Position information is clearly displayed in the survey headers

### Responsive Behavior
- **Desktop (>1200px)**: Full side-by-side layout
- **Tablet (900-1200px)**: Reduced sidebar width
- **Mobile (<900px)**: Stacked layout with conversation first, surveys below

## Files

- `labeler-sidebar.html`: New HTML file for testing the sidebar layout
- `js/conversation.js`: Updated JavaScript with sidebar layout logic
- `styles/conversation.css`: CSS for the side-by-side layout
- `styles/components.css`: Updated survey component styles

## Usage

1. Open `labeler-sidebar.html` in a web browser
2. Navigate through conversations using the arrow buttons
3. Complete surveys for each position (beginning, turn 6, end)
4. Export labeled data when finished

## Technical Details

### Layout Structure
```html
<div class="conversation-layout">
    <div class="survey-sidebar">
        <div class="survey-container">
            <div class="survey-sections">
                <!-- Survey sections for beginning, turn6, end -->
            </div>
        </div>
    </div>
    <div class="conversation-main">
        <!-- Conversation display -->
    </div>
</div>
```

### Survey Data Structure
```javascript
labels[conversationIndex].survey = {
    beginning: { questionId: rating },
    turn6: { questionId: rating },
    end: { questionId: rating }
}
```

## Benefits

1. **Better Context**: Survey responses are always visible alongside the conversation
2. **Efficient Workflow**: No need to scroll to find survey sections
3. **Clear Organization**: Each survey position is visually distinct
4. **Responsive**: Works well on all device sizes
5. **Sticky Sidebar**: Survey container stays in view while scrolling through long conversations 