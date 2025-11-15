#!/bin/bash
# Deployment script for Reclaim AI Agent
# This script helps deploy the agent to various platforms

set -e

echo "🚀 Reclaim AI Agent - Deployment Helper"
echo "========================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠️  Warning: .env.local not found"
  echo "   Please create .env.local with the following variables:"
  echo "   - TAVILY_API_KEY"
  echo "   - REDIS_LANGCACHE_HOST (optional)"
  echo "   - REDIS_LANGCACHE_API_KEY (optional)"
  echo "   - REDIS_LANGCACHE_ID (optional)"
  echo ""
fi

echo "Select deployment method:"
echo "1) Docker (local or cloud)"
echo "2) Railway"
echo "3) Render"
echo "4) Fly.io"
echo "5) Show instructions for all"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
  1)
    echo ""
    echo "🐳 Docker Deployment"
    echo "==================="
    echo ""
    echo "Building Docker image..."
    docker build -f Dockerfile.agent -t reclaim-ai-agent:latest .
    echo ""
    echo "✅ Docker image built successfully!"
    echo ""
    echo "To run locally:"
    echo "  docker run -d -p 3000:3000 \\"
    echo "    -e TAVILY_API_KEY=your_key \\"
    echo "    -e REDIS_LANGCACHE_HOST=your_host \\"
    echo "    -e REDIS_LANGCACHE_API_KEY=your_key \\"
    echo "    -e REDIS_LANGCACHE_ID=your_id \\"
    echo "    --name reclaim-agent \\"
    echo "    reclaim-ai-agent:latest"
    echo ""
    echo "To push to Docker Hub:"
    echo "  docker tag reclaim-ai-agent:latest your-username/reclaim-ai-agent:latest"
    echo "  docker push your-username/reclaim-ai-agent:latest"
    ;;
  2)
    echo ""
    echo "🚂 Railway Deployment"
    echo "===================="
    echo ""
    if ! command -v railway &> /dev/null; then
      echo "Installing Railway CLI..."
      npm install -g @railway/cli
    fi
    echo "Login to Railway..."
    railway login
    echo "Initializing project..."
    railway init
    echo "Setting environment variables..."
    if [ -f ".env.local" ]; then
      while IFS='=' read -r key value; do
        if [[ ! $key =~ ^# ]] && [[ -n $key ]]; then
          railway variables set "$key=$value"
        fi
      done < .env.local
    fi
    echo "Deploying..."
    railway up
    echo ""
    echo "✅ Deployment initiated! Check Railway dashboard for status."
    ;;
  3)
    echo ""
    echo "🎨 Render Deployment"
    echo "==================="
    echo ""
    echo "1. Go to https://render.com"
    echo "2. Click 'New +' → 'Web Service'"
    echo "3. Connect your GitHub repository"
    echo "4. Use these settings:"
    echo "   - Name: reclaim-ai-agent"
    echo "   - Environment: Node"
    echo "   - Build Command: npm install && npm run agent:build"
    echo "   - Start Command: npm run agent:start"
    echo "   - Health Check Path: /health"
    echo "5. Add environment variables from .env.local"
    echo "6. Click 'Create Web Service'"
    echo ""
    echo "Or use the render.yaml configuration file:"
    echo "  render deploy"
    ;;
  4)
    echo ""
    echo "✈️  Fly.io Deployment"
    echo "===================="
    echo ""
    if ! command -v fly &> /dev/null && ! command -v flyctl &> /dev/null; then
      echo "Installing Fly.io CLI..."
      curl -L https://fly.io/install.sh | sh
    fi
    echo "Login to Fly.io..."
    fly auth login
    echo "Launching deployment..."
    fly launch --dockerfile Dockerfile.agent
    echo "Setting environment variables..."
    if [ -f ".env.local" ]; then
      while IFS='=' read -r key value; do
        if [[ ! $key =~ ^# ]] && [[ -n $key ]]; then
          fly secrets set "$key=$value"
        fi
      done < .env.local
    fi
    echo ""
    echo "✅ Deployment initiated!"
    ;;
  5)
    echo ""
    echo "📚 All Deployment Instructions"
    echo "=============================="
    echo ""
    echo "See DEPLOYMENT.md for detailed instructions"
    echo "See PRODUCTION_DEPLOYMENT.md for agent-specific deployment"
    echo "See DEPLOY_INSTRUCTIONS.md for quick start guide"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "✅ Deployment process started!"
echo ""
echo "After deployment, test your endpoint:"
echo "  curl https://your-deployment-url/health"
echo ""
echo "For API usage, see MCP_API.md"

