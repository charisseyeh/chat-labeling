# Theme and Button System Refactor

This document outlines the comprehensive refactoring of the color styling and button system for the conversation selector and labeler applications.

## Overview

The refactoring introduces a centralized design token system and unified button components to improve maintainability, consistency, and developer experience across both `index.html` and `labeler.html`.

## 🎨 Design System Changes

### New Files Created

#### `styles/theme.css`
Centralized design tokens using CSS custom properties for consistent theming.

**Key Features:**
- **Light/Dark Theme Variables**: Complete color palette for both themes
- **Semantic Naming**: Variables like `--surface-1`, `--text-primary`, `--brand`
- **Component-Specific Tokens**: Message bubbles, preview elements, chips/tags
- **Automatic Theme Switching**: Uses `data-theme` attribute on `<html>`

**Example Usage:**
```css
/* Before */
background: #f8f9fa;
color: #1a1a1a;

/* After */
background: var(--surface-2);
color: var(--text-primary);
```

#### `styles/buttons.css`
Unified button system with consistent variants and sizing.

**Button Variants:**
- `.btn--brand` - Primary brand color buttons
- `.btn--accent` - Accent color buttons (e.g., auto-filter)
- `.btn--outline` - Outlined buttons with brand color
- `.btn--ghost` - Transparent background buttons
- `.btn--chip` - Filter/tag style buttons
- `.btn--icon` - Small icon buttons

**Button Sizes:**
- `.btn--sm` - Small buttons (12px font)
- `.btn--md` - Medium buttons (default)
- `.btn--lg` - Large buttons (15px font)

**Example Usage:**
```html
<!-- Before -->
<button class="auto-filter-btn">Auto-filter</button>
<button class="nav-button primary">Next →</button>

<!-- After -->
<button class="btn btn--accent btn--md">Auto-filter</button>
<button class="btn btn--brand">Next →</button>
```

## 🔄 Updated Files

### HTML Files

#### `index.html`
- **Added**: Theme and button CSS imports
- **Updated**: All button classes to use new `.btn` system
- **Changed**: Filter buttons to use `.btn--chip` with semantic classes

**Button Changes:**
```html
<!-- Auto-filter button -->
<button id="analyzeBtn" class="btn btn--accent btn--md">Auto-filter</button>

<!-- Action buttons -->
<button id="selectAllBtn" class="btn btn--outline">Select All</button>
<button id="exportBtn" class="btn btn--brand">Export Selected</button>

<!-- Filter chips -->
<button class="btn btn--chip relevant" data-category="relevant">Relevant</button>
<button class="btn btn--chip not-relevant" data-category="not-relevant">Non-relevant</button>

<!-- Preview button -->
<button class="btn btn--icon">👁️ Preview</button>
```

#### `labeler.html`
- **Added**: Theme and button CSS imports
- **Updated**: Navigation buttons to use new system

**Button Changes:**
```html
<!-- Navigation buttons -->
<button class="btn btn--outline" onclick="previousConversation()">← Previous</button>
<button class="btn btn--brand" onclick="nextConversation()">Next →</button>
```

### CSS Files

#### `styles/page.css`
- **Removed**: Global button styles (now in `buttons.css`)
- **Updated**: Action container to use theme variables
- **Simplified**: Dark mode handling via theme variables

#### `styles/top-section.css`
- **Removed**: Auto-filter button styles and filter button styles
- **Updated**: All colors to use theme variables
- **Added**: Button margin spacing for filter groups

#### `styles/conversation-list.css`
- **Removed**: Preview button styles (now `.btn--icon`)
- **Updated**: All colors to use theme variables
- **Simplified**: Dark mode overrides removed

#### `styles/base.css`
- **Removed**: Navigation button styles (now in `buttons.css`)
- **Updated**: Header and text colors to use theme variables

#### `styles/conversation.css`
- **Updated**: Message bubble colors to use theme variables
- **Updated**: Text colors for markdown content
- **Simplified**: Avatar styling to use theme variables

#### `styles/components.css`
- **Removed**: Survey navigation button styles
- **Updated**: All form inputs and labels to use theme variables
- **Updated**: Survey sections and progress indicators

#### `styles/dark-mode.css`
- **Massively Simplified**: Removed redundant color overrides
- **Kept**: Scrollbar styling and special structural overrides
- **Updated**: Toggle button to use theme variables

### JavaScript Files

#### `js/dark-mode.js`
- **Enhanced**: Now sets `data-theme` attribute on `<html>` element
- **Maintained**: Backward compatibility with `body.dark-mode` class
- **Improved**: Cleaner theme switching mechanism

#### `index.html` (inline JavaScript)
- **Updated**: Filter button sync function to use `.btn--chip` and `.is-active`
- **Updated**: Preview button generation to use `.btn--icon`

## 🎯 Benefits

### 1. **Centralized Color Management**
- All colors defined in one place (`theme.css`)
- Easy to modify entire color scheme
- Consistent color usage across components

### 2. **Unified Button System**
- Consistent button styling and behavior
- Easy to add new button variants
- Standardized hover, active, and disabled states

### 3. **Improved Dark Mode**
- Automatic color switching via CSS variables
- Reduced code duplication
- Better performance (fewer CSS overrides)

### 4. **Developer Experience**
- Semantic class names (`.btn--brand` vs `.nav-button.primary`)
- Clear separation of concerns
- Easier to maintain and extend

### 5. **Future-Proof Architecture**
- Easy to add new themes
- Simple to modify button variants
- Scalable design system

## 🧪 Testing

### Test File: `test-theme.html`
Created a comprehensive test page to verify:
- All button variants render correctly
- Color swatches display properly
- Text colors are consistent
- Message bubbles use correct colors
- Dark mode toggle works seamlessly

## 📋 Migration Checklist

### For Future Changes:

1. **Adding New Colors:**
   - Add to `styles/theme.css` under appropriate section
   - Use semantic naming (e.g., `--success`, `--warning`)

2. **Creating New Buttons:**
   - Use existing `.btn` variants when possible
   - Add new variants to `styles/buttons.css` if needed
   - Follow naming convention: `.btn--{variant}`

3. **Modifying Themes:**
   - Update variables in `styles/theme.css`
   - Test both light and dark modes
   - Verify all components still look correct

4. **Adding New Components:**
   - Use theme variables for colors
   - Use `.btn` classes for buttons
   - Follow existing patterns

## 🔧 Technical Details

### CSS Custom Properties Used:
```css
/* Surfaces */
--bg-page, --surface-1, --surface-2, --surface-3, --surface-hover

/* Text */
--text-primary, --text-secondary, --text-muted

/* Brand & Accent */
--brand, --brand-contrast, --accent, --accent-contrast

/* States */
--info, --warning, --success, --error

/* Chips/Tags */
--chip-relevant, --chip-not-relevant, --chip-active-text

/* Message Bubbles */
--bubble-user-bg, --bubble-user-fg, --bubble-assistant-bg, --bubble-assistant-fg

/* Preview Elements */
--preview-user-bg, --preview-user-fg, --preview-assistant-bg, --preview-assistant-fg
```

### Button Class Structure:
```css
.btn                    /* Base button styles */
.btn--{variant}        /* Button variants */
.btn--{size}          /* Button sizes */
.btn--chip.{semantic}  /* Semantic chip classes */
```

### Theme Switching:
```javascript
// Sets data-theme attribute on <html>
root.setAttribute('data-theme', isDark ? 'dark' : 'light');
```

## 🚀 Next Steps

1. **Test thoroughly** in both light and dark modes
2. **Verify** all button interactions work correctly
3. **Check** that filter functionality still works
4. **Ensure** preview buttons function properly
5. **Validate** that export functionality is unaffected

## 📝 Notes

- **Backward Compatibility**: Maintained `body.dark-mode` class for existing CSS
- **Performance**: Reduced CSS file size by removing redundant overrides
- **Maintainability**: Much easier to modify colors and add new button styles
- **Consistency**: All buttons now follow the same design patterns

This refactoring significantly improves the codebase's maintainability and provides a solid foundation for future design system enhancements. 