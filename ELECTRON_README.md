# Chat Labeling App - Electron Desktop Application

This is the Electron desktop version of the Chat Labeling App, which provides AI-powered conversation analysis and labeling in a native desktop application.

## Features

- **Desktop Application**: Runs as a native desktop app instead of in a browser
- **Local Server**: Automatically starts the Express server when the app launches
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Professional UI**: Native desktop window with proper app lifecycle management
- **Local Storage**: All data stored locally on your machine

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run in development mode:**
   ```bash
   # Run the web version (browser)
   npm run dev
   
   # Run the Electron desktop app
   npm start
   ```

## Building the Application

### Build for Current Platform

```bash
npm run build
```

### Build for Specific Platforms

```bash
# Windows (.exe installer)
npm run build-win

# macOS (.dmg bundle)
npm run build-mac

# Linux (AppImage)
npm run build-linux
```

### Build All Platforms

```bash
npm run dist
```

## Build Output

After building, you'll find the executables in the `dist/` directory:

- **Windows**: `dist/win-unpacked/Chat Labeling App.exe`
- **macOS**: `dist/mac/Chat Labeling App.app`
- **Linux**: `dist/linux-unpacked/chat-labeling-app`

## Application Structure

```
chat-labeling/
├── electron-main.js          # Electron main process
├── preload.js               # Preload script for renderer
├── server.js                # Express server (unchanged)
├── package.json             # Dependencies and build config
├── js/                      # Frontend JavaScript (unchanged)
├── styles/                  # CSS files (unchanged)
├── html files               # HTML templates (unchanged)
├── uploads/                 # File upload directory
├── selected_conversations/  # Exported data
└── labeled/                 # AI labeling results
```

## How It Works

1. **Electron Main Process** (`electron-main.js`):
   - Creates the desktop window
   - Starts the Express server automatically
   - Manages app lifecycle (start, stop, quit)
   - Handles server process management

2. **Preload Script** (`preload.js`):
   - Safely exposes Electron APIs to the renderer
   - Maintains security with context isolation

3. **Express Server** (`server.js`):
   - Runs on localhost:3000 (same as before)
   - All existing functionality preserved
   - File uploads, AI labeling, exports work unchanged

4. **Frontend** (HTML/CSS/JS):
   - Loads in the Electron window
   - No changes to existing code
   - All features work as before

## Troubleshooting

### Server Won't Start

- Check if port 3000 is already in use
- Ensure all dependencies are installed
- Check the console for error messages

### Build Errors

- Make sure you have the correct Node.js version
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check that all build dependencies are installed

### App Won't Launch

- Try running `npm start` to see error messages
- Check that `electron-main.js` exists and is valid
- Ensure the preload script path is correct

## Development vs Production

- **Development**: Use `npm run dev` to run the web version in browser
- **Production**: Use `npm start` to run the Electron desktop app
- **Building**: Use build commands to create distributable executables

## Security Features

- Context isolation enabled
- Node integration disabled
- Remote module disabled
- Web security enabled
- Preload script for safe API exposure

## Platform-Specific Notes

### Windows
- Creates .exe installer with NSIS
- Includes desktop shortcut option
- Allows custom installation directory

### macOS
- Creates .dmg bundle
- Supports both Intel and Apple Silicon
- Proper app bundle structure

### Linux
- Creates AppImage for easy distribution
- No installation required
- Portable across different Linux distributions

## Contributing

When making changes:

1. **Don't modify** existing server logic or frontend code
2. **Only modify** Electron-specific files:
   - `electron-main.js`
   - `preload.js`
   - `package.json` (build config only)
3. **Test** both web and desktop versions
4. **Build** and test executables before committing

## License

Same as the original Chat Labeling App project.
