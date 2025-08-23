const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;
let serverStarted = false;
let appPath; // Global variable for app path

// Store server process info
let serverInfo = {
    port: null,
    url: null
};

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            preload: path.join(appPath, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: add app icon
        title: 'Chat Labeling App',
        show: false // Don't show until ready
    });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // Show loading screen immediately (both dev and production)
        mainWindow.loadFile(path.join(appPath, 'loading.html'));
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Always start the server when creating a new window
    // This ensures the server starts even if it was stopped previously
    startServer();
}

function startServer() {
    console.log('Starting server...');
    
    // Use the already initialized appPath
    const serverPath = path.join(appPath, 'server.js');
    
    console.log('Server path:', serverPath);
    
    // Start the existing server.js
    serverProcess = spawn('node', [serverPath], {
        cwd: appPath,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    // No timeout needed - loading screen handles server status check

    serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Server output:', output);
        
        // Check if server is ready and extract the actual port
        if (output.includes('Server running at http://localhost:')) {
            // Extract the actual port from the server output
            const portMatch = output.match(/Server running at http:\/\/localhost:(\d+)/);
            if (portMatch) {
                serverInfo.port = parseInt(portMatch[1]);
                serverInfo.url = `http://localhost:${serverInfo.port}`;
                console.log(`Server started successfully on port ${serverInfo.port}`);
            }
            
            serverStarted = true;
            console.log('Server started successfully');
            
            // The loading screen will automatically redirect when server is ready
            // No need to manually load the URL here
        }
    });

    serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
    });

    serverProcess.on('error', (error) => {
        console.error('Failed to start server:', error);
        // Show error to user
        if (mainWindow && !mainWindow.isDestroyed()) {
            const errorPath = path.join(appPath, 'error.html');
            mainWindow.loadFile(errorPath);
        }
    });

    // Handle server process exit with error
    serverProcess.on('exit', (code) => {
        console.log(`Server process exited with code ${code}`);
        serverStarted = false;
        
        // If server exited with error code, show error page
        if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
            const errorPath = path.join(appPath, 'error.html');
            mainWindow.loadFile(errorPath);
        }
    });
}

function stopServer() {
    if (serverProcess) {
        console.log('Stopping server...');
        serverProcess.kill('SIGTERM');
        
        // Force kill if graceful shutdown fails
        setTimeout(() => {
            if (serverProcess && !serverProcess.killed) {
                serverProcess.kill('SIGKILL');
            }
        }, 5000);
        
        serverProcess = null;
        serverStarted = false;
    }
}

// App event handlers
app.whenReady().then(() => {
    // Initialize app path immediately
    if (app.isPackaged) {
        // In production, use the resources directory
        appPath = path.join(process.resourcesPath, 'app');
    } else {
        // In development, use current directory
        appPath = __dirname;
    }
    console.log('App initialized with path:', appPath);
    
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    stopServer();
});

app.on('will-quit', () => {
    stopServer();
});

// Handle app quit
app.on('quit', () => {
    stopServer();
});

// IPC handlers for communication between main and renderer processes
ipcMain.handle('get-server-status', () => {
    return {
        running: serverStarted,
        url: serverInfo.url,
        port: serverInfo.port
    };
});

ipcMain.handle('restart-server', () => {
    stopServer();
    setTimeout(() => {
        startServer();
    }, 1000);
    return { success: true };
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadFile('error.html');
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
