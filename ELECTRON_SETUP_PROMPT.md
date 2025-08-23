# Cursor Prompt: Convert Web App to Electron Desktop App

## Task
Convert the existing chat labeling web application to an Electron desktop app. The app currently runs as a Node.js server with Express, and I want to package it as a native desktop application that users can download and run without any technical setup.

## Current Application Structure
```
chat-labeling/
├── server.js                 # Express server (main entry point)
├── package.json             # Current dependencies
├── js/                      # Frontend JavaScript files
├── styles/                  # CSS files
├── html files               # HTML templates
├── uploads/                 # File upload directory
├── selected_conversations/  # Exported data
└── labeled/                 # AI labeling results
```

## Requirements

### 1. Create Electron Wrapper
- **Don't change any existing code** - this is a wrapper only
- Create `electron-main.js` that starts the existing server
- Modify `package.json` to include Electron dependencies
- Add build scripts for creating executables

### 2. Local Storage Enhancement
- Use Electron's app paths for better local storage
- Store data in user's app data directory instead of relative paths
- Ensure full file system access for large datasets
- Keep all existing storage functionality

### 3. User Experience
- App should open in a desktop window (not browser)
- Single executable file for distribution
- No terminal commands or localhost setup needed
- Professional desktop app appearance

## Files to Create/Modify

### 1. `electron-main.js` (NEW FILE)
```javascript
// This file should:
// - Import Electron modules
// - Create desktop window
// - Start the existing server.js
// - Load the app in the window
// - Handle app lifecycle events
// - Clean up server process on exit
```

### 2. `package.json` (MODIFY EXISTING)
```json
// Add to existing package.json:
// - "main": "electron-main.js"
// - Electron dependencies in devDependencies
// - Build scripts for electron-builder
// - Build configuration for Windows/Mac/Linux
```

### 3. Build Configuration
```json
// Add electron-builder config for:
// - Windows (.exe installer)
// - Mac (.dmg bundle)
// - Linux (AppImage)
// - App icons and metadata
```

## Technical Requirements

### Server Integration
- The existing `server.js` should start automatically
- Server should run on localhost:3000 (same as current)
- All existing API endpoints should work unchanged
- File uploads and storage should work as before

### File System Access
- Use `app.getPath('userData')` for data storage
- Create proper directory structure in user's app data
- Maintain all existing file operations
- Handle large conversation files (no size limits)

### Cross-Platform Compatibility
- Windows: .exe installer
- Mac: .dmg bundle  
- Linux: AppImage
- Handle platform-specific paths and permissions

## Build Process
```bash
# Commands that should work after setup:
npm install          # Install dependencies
npm start           # Run in development
npm run build       # Build for current platform
npm run build-win   # Build Windows executable
npm run build-mac   # Build Mac bundle
npm run build-linux # Build Linux AppImage
```

## Important Notes

### Don't Change
- Any existing JavaScript, CSS, or HTML files
- Server logic or API endpoints
- File upload/download functionality
- AI labeling or survey features
- Export functionality

### Do Add
- Electron main process file
- Build configuration
- Platform-specific packaging
- Better local storage paths
- Professional app metadata

### User Experience
- Users download single executable
- Double-click to run (no installation)
- App opens in desktop window
- All data stored locally on their machine
- No technical knowledge required

## Expected Output

After running this prompt, I should have:

1. **`electron-main.js`** - Electron main process file
2. **Modified `package.json`** - With Electron dependencies and build scripts
3. **Build configuration** - For creating platform-specific executables
4. **Working Electron app** - That runs the existing web app in a desktop window

## Testing Requirements

The final app should:
- Start without any terminal commands
- Open in a desktop window (not browser)
- Load the existing chat labeling interface
- Allow file uploads and all existing functionality
- Store data locally in user's app data directory
- Handle large conversation files without issues

## Dependencies to Add

```json
"devDependencies": {
  "electron": "^27.0.0",
  "electron-builder": "^24.6.4"
}
```

## Build Dependencies

```json
"build": {
  "appId": "com.chatlabeling.app",
  "productName": "Chat Labeling App",
  "directories": {
    "output": "dist"
  },
  "files": [
    "**/*",
    "!node_modules/**/*",
    "!dist/**/*"
  ]
}
```

---

**Remember**: This is a wrapper project. Don't modify the existing application logic - just create the Electron shell that runs the current web app as a desktop application.
