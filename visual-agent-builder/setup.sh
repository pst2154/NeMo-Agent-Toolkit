#!/bin/bash

# Visual Agent Builder Setup Script
# This script sets up the development environment for the Visual Agent Builder

set -e  # Exit on error

echo "🚀 Setting up Visual Agent Builder..."
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi
echo "✅ Python found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi
echo "✅ npm found: $(npm --version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Code execution sandbox will not work."
    echo "   Install Docker from: https://docs.docker.com/get-docker/"
else
    echo "✅ Docker found: $(docker --version)"
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt || {
    echo "❌ Failed to install backend dependencies"
    exit 1
}
echo "✅ Backend dependencies installed"

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install || {
    echo "❌ Failed to install frontend dependencies"
    exit 1
}
echo "✅ Frontend dependencies installed"

echo ""
echo "🔧 Checking environment variables..."
if [ -z "$NVIDIA_API_KEY" ]; then
    echo "⚠️  NVIDIA_API_KEY environment variable is not set"
    echo "   Set it with: export NVIDIA_API_KEY='your-api-key-here'"
else
    echo "✅ NVIDIA_API_KEY is set"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Set your API key (if not already set):"
echo "   export NVIDIA_API_KEY='your-api-key-here'"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   python main.py"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "4. (Optional) Start the code execution sandbox:"
echo "   cd ../src/nat/tool/code_execution/local_sandbox"
echo "   source start_local_sandbox.sh"
echo ""
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more information, see README.md"
