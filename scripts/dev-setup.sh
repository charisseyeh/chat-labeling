#!/bin/bash

# Chat Labeling App - Development Setup Script

echo "🚀 Chat Labeling App - Development Setup"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version $(node -v) is too old. Please use Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating template..."
    echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
    echo "📝 Please edit .env file and add your OpenAI API key"
else
    echo "✅ .env file found"
fi

echo ""
echo "🎯 Development Commands:"
echo "  npm run dev     - Run web version in browser"
echo "  npm start       - Run Electron desktop app"
echo "  npm run build   - Build for current platform"
echo "  npm run dist    - Build for all platforms"
echo ""
echo "🔧 To run the Electron app:"
echo "  npm start"
echo ""
echo "🌐 To run the web version:"
echo "  npm run dev"
echo ""
echo "✨ Setup complete! Happy coding!"
