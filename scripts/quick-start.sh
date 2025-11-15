#!/bin/bash

# Reclaim AI Quick Start Script
# This script helps set up and test the Reclaim AI application

set -e

echo "🚀 Reclaim AI Quick Start"
echo "========================"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ required. Current: $(node -v)"
    echo "   Use: nvm use 20"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check if .env.local exists
echo ""
echo "🔑 Checking environment variables..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
    echo "⚠️  Please add your TAVILY_API_KEY to .env.local"
else
    echo "✅ .env.local exists"
    if grep -q "your_tavily_api_key_here" .env.local; then
        echo "⚠️  Please update TAVILY_API_KEY in .env.local"
    else
        echo "✅ TAVILY_API_KEY configured"
    fi
fi

# Check Redis
echo ""
echo "💾 Checking Redis..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is installed but not running"
        echo "   Start with: redis-cli --daemonize yes"
        echo "   Or Docker: docker run -d -p 6379:6379 --name redis-reclaim redis:latest"
    fi
elif command -v docker &> /dev/null; then
    if docker ps | grep -q redis-reclaim; then
        echo "✅ Redis container is running"
    else
        echo "⚠️  Redis container not found"
        echo "   Starting Redis with Docker..."
        docker run -d -p 6379:6379 --name redis-reclaim redis:latest || echo "   Docker container may already exist"
    fi
else
    echo "⚠️  Redis not found. Install Redis:"
    echo "   macOS: brew install redis && brew services start redis"
    echo "   Linux: sudo apt-get install redis-server"
    echo "   Docker: docker run -d -p 6379:6379 redis:latest"
fi

# Install dependencies
echo ""
echo "📚 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Build check
echo ""
echo "🔨 Checking build..."
if [ ! -d ".next" ]; then
    echo "⚠️  First build needed. Run: npm run dev"
else
    echo "✅ Build exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your TAVILY_API_KEY to .env.local"
echo "2. Start Redis (if not running)"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "Test the API:"
echo 'curl -X POST http://localhost:3000/api/analyze \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d '"'"'{"url":"https://www.amazon.com/dp/B08N5WRWNW"}'"'"

