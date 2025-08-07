# Modular Labeler Structure

## Overview

This modular structure separates the original monolithic `labeler.html` file into organized, manageable components. Each file has a specific responsibility, making it easier to maintain and modify individual parts of the application.

## File Structure

```
├── labeler-modular.html (main HTML file)
├── styles/
│   ├── base.css (global styles and layout)
│   ├── conversation.css (conversation and message styles)
│   └── components.css (labels, survey, forms)
├── js/
│   ├── base.js (global state and core functionality)
│   ├── conversation.js (conversation display and navigation)
│   └── components.js (labels, survey, forms)
└── README-modular.md (this file)
```

## CSS Organization

### `styles/base.css`
**Purpose**: Global styles, layout, and navigation
- Body and typography
- Header and navigation
- Export section
- Button styles
- Layout containers

**When to modify**: 
- Change overall layout
- Modify navigation buttons
- Update global colors or fonts
- Add new layout components

### `styles/conversation.css`
**Purpose**: Conversation display and message styling
- Conversation container and header
- Message bubbles and avatars
- Markdown content styling
- Message layout and spacing

**When to modify**:
- Change message appearance
- Modify conversation layout
- Update avatar styles
- Adjust markdown rendering

### `styles/components.css`
**Purpose**: Interactive components and forms
- Message labels and input fields
- Survey interface
- Rating scales and options
- Form styling

**When to modify**:
- Update survey appearance
- Modify label input styles
- Change rating interface
- Add new form components

## JavaScript Organization

### `js/base.js`
**Purpose**: Core functionality and global state
- Global variables and state management
- Data loading and processing
- Utility functions
- Export functionality
- Event listeners

**When to modify**:
- Change data loading logic
- Modify export functionality
- Add new utility functions
- Update global state management

### `js/conversation.js`
**Purpose**: Conversation display and navigation
- `displayCurrentConversation()` - Main display function
- `nextConversation()` / `previousConversation()` - Navigation
- Message rendering logic

**When to modify**:
- Change how conversations are displayed
- Modify navigation behavior
- Update message rendering
- Add new conversation features

### `js/components.js`
**Purpose**: Interactive components and forms
- Survey questions and logic
- Label management functions
- Survey rendering and navigation
- Form handling

**When to modify**:
- Add new survey questions
- Change label functionality
- Modify survey interface
- Update form behavior

## How to Manage Each Component

### 🎨 **Styling Changes**

#### Global Layout Changes
```bash
# Edit base styles
nano styles/base.css
```

#### Conversation Appearance
```bash
# Edit conversation styles
nano styles/conversation.css
```

#### Component Styling
```bash
# Edit component styles
nano styles/components.css
```

### ⚙️ **Functionality Changes**

#### Core Features
```bash
# Edit base functionality
nano js/base.js
```

#### Conversation Features
```bash
# Edit conversation functionality
nano js/conversation.js
```

#### Component Features
```bash
# Edit component functionality
nano js/components.js
```

## Development Workflow

### 1. **Adding New Features**

**Example**: Adding a new survey question

1. **Add the question data** in `js/components.js`:
   ```javascript
   // Add to surveyQuestions array
   {
       id: 'new_question',
       title: 'New Question',
       description: 'Description here',
       options: ['Option 1', 'Option 2', ...]
   }
   ```

2. **Style the new question** in `styles/components.css`:
   ```css
   /* Add any new styles needed */
   .new-question-specific {
       /* styles here */
   }
   ```

### 2. **Modifying Existing Features**

**Example**: Changing message appearance

1. **Update conversation styles** in `styles/conversation.css`:
   ```css
   .message-content {
       /* modify existing styles */
   }
   ```

2. **Update rendering logic** in `js/conversation.js` if needed:
   ```javascript
   function displayCurrentConversation() {
       // modify display logic
   }
   ```

### 3. **Adding New Components**

**Example**: Adding a new labeling component

1. **Add styles** in `styles/components.css`:
   ```css
   .new-labeling-component {
       /* component styles */
   }
   ```

2. **Add functionality** in `js/components.js`:
   ```javascript
   function newLabelingFunction() {
       // component logic
   }
   ```

3. **Update HTML** in `labeler-modular.html`:
   ```html
   <div class="new-labeling-component">
       <!-- component HTML -->
   </div>
   ```

## File Dependencies

### CSS Dependencies
```
labeler-modular.html
├── styles/base.css (loads first)
├── styles/conversation.css (loads second)
└── styles/components.css (loads last)
```

### JavaScript Dependencies
```
labeler-modular.html
├── js/base.js (loads first - global state)
├── js/conversation.js (loads second - uses base functions)
└── js/components.js (loads last - uses base and conversation functions)
```

## Best Practices

### 1. **CSS Organization**
- Keep related styles together
- Use consistent naming conventions
- Avoid duplicate styles across files
- Comment sections for clarity

### 2. **JavaScript Organization**
- Keep functions close to where they're used
- Use clear function names
- Avoid circular dependencies
- Document complex functions

### 3. **File Management**
- One responsibility per file
- Keep files focused and manageable
- Use descriptive file names
- Maintain consistent structure

## Testing Changes

### 1. **Test Individual Components**
```bash
# Test CSS changes
# Open browser dev tools and modify styles directly

# Test JS changes
# Use browser console to test functions
```

### 2. **Test Integration**
```bash
# Open labeler-modular.html in browser
# Verify all functionality works together
```

### 3. **Common Issues**
- **CSS not loading**: Check file paths in HTML
- **JS errors**: Check console for missing functions
- **Styling conflicts**: Ensure CSS load order is correct

## Migration from Original

### From `labeler.html` to `labeler-modular.html`:

1. **Backup original**:
   ```bash
   cp labeler.html labeler-backup.html
   ```

2. **Use modular version**:
   ```bash
   cp labeler-modular.html labeler.html
   ```

3. **Test functionality**:
   - Open in browser
   - Verify all features work
   - Check styling is identical

## Benefits of This Structure

1. **Maintainability**: Easy to find and modify specific features
2. **Scalability**: Easy to add new components
3. **Collaboration**: Multiple developers can work on different components
4. **Testing**: Can test components in isolation
5. **Performance**: Can load only needed components
6. **Reusability**: Components can be reused in other projects

## Troubleshooting

### Common Issues:

1. **Functions not found**: Check JavaScript load order
2. **Styles not applied**: Check CSS file paths
3. **Survey not working**: Check `js/components.js` functions
4. **Navigation broken**: Check `js/conversation.js` functions

### Debug Steps:

1. **Check browser console** for JavaScript errors
2. **Inspect network tab** for missing files
3. **Verify file paths** in HTML
4. **Test functions** in browser console 