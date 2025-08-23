// Port Manager - Automatically finds available ports
class PortManager {
    constructor() {
        this.startPort = 3000;
        this.maxPorts = 100; // Try ports 3000-3099
        this.currentPort = null;
    }

    // Find an available port starting from startPort
    async findAvailablePort() {
        for (let port = this.startPort; port < this.startPort + this.maxPorts; port++) {
            if (await this.isPortAvailable(port)) {
                this.currentPort = port;
                return port;
            }
        }
        throw new Error(`No available ports found in range ${this.startPort}-${this.startPort + this.maxPorts - 1}`);
    }

    // Check if a specific port is available
    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const net = require('net');
            const server = net.createServer();
            
            server.listen(port, () => {
                server.once('close', () => {
                    resolve(true);
                });
                server.close();
            });
            
            server.on('error', () => {
                resolve(false);
            });
        });
    }

    // Get the current port being used
    getCurrentPort() {
        return this.currentPort;
    }

    // Get the server URL for the current port
    getServerUrl() {
        if (!this.currentPort) {
            throw new Error('No port has been assigned yet');
        }
        return `http://localhost:${this.currentPort}`;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortManager;
}
