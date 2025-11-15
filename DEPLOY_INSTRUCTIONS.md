# Deployment Instructions

## Current Status: Ready for Deployment ✅

The Reclaim AI Agent is ready to be deployed to production. All configuration files are in place.

## Recommended Deployment Method: Railway

Railway is the easiest option for deploying Express servers.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser for authentication.

### Step 3: Initialize Project

```bash
cd reclaim-ai
railway init
```

### Step 4: Set Environment Variables

You'll need to set these in Railway dashboard or via CLI:

```bash
railway variables set TAVILY_API_KEY=your_tavily_api_key
railway variables set REDIS_LANGCACHE_HOST=your_langcache_host  # Optional
railway variables set REDIS_LANGCACHE_API_KEY=your_langcache_api_key  # Optional
railway variables set REDIS_LANGCACHE_ID=your_langcache_id  # Optional
```

### Step 5: Deploy

```bash
railway up
```

Railway will automatically:
- Detect the Node.js project
- Run `npm install`
- Build the project
- Start the server using `npm run agent:start`

### Step 6: Get Production URL

```bash
railway domain
```

Or check the Railway dashboard for your deployment URL.

---

## Alternative: Render Deployment

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Use the settings from `render.yaml` (already configured)
5. Set environment variables in the dashboard
6. Deploy

---

## Alternative: Docker Deployment

### Build Image
```bash
docker build -f Dockerfile.agent -t reclaim-ai-agent .
```

### Run Container
```bash
docker run -d -p 3000:3000 \
  -e TAVILY_API_KEY=your_key \
  --name reclaim-agent \
  reclaim-ai-agent
```

### Push to Registry (for cloud deployment)
```bash
# Tag for Docker Hub
docker tag reclaim-ai-agent your-username/reclaim-ai-agent
docker push your-username/reclaim-ai-agent

# Or use cloud provider's container registry
```

---

## Testing Production Deployment

Once deployed, test your endpoints:

### Health Check
```bash
curl https://your-deployment-url.railway.app/health
```

### Analyze Product
```bash
curl -X POST https://your-deployment-url.railway.app/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "url": "https://www.amazon.com/dp/B08N5WRWNW"
  }'
```

---

## Environment Variables Required

Make sure to set these in your deployment platform:

### Required
- `TAVILY_API_KEY` - Your Tavily API key for web crawling

### Optional (but recommended for performance)
- `REDIS_LANGCACHE_HOST` - Redis LangCache host
- `REDIS_LANGCACHE_API_KEY` - Redis LangCache API key
- `REDIS_LANGCACHE_ID` - Redis LangCache cache ID

### Optional (auto-set)
- `PORT` - Server port (defaults to 3000)

---

## Deployment Checklist

- [ ] Railway/Render/Fly.io account created
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Health check endpoint working (`/health`)
- [ ] API endpoint working (`/api/tool`)
- [ ] MCP server accessible (if using MCP)

---

## Need Help?

See detailed guides:
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Detailed deployment guide
- [MCP_API.md](./MCP_API.md) - MCP API documentation
- [README-AGENT.md](./README-AGENT.md) - Agent-specific documentation

