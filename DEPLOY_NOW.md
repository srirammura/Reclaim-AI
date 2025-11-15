# Deploy Reclaim AI Agent NOW 🚀

## Quick Deploy Options

### Option 1: Railway (Easiest - 5 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize and deploy
cd reclaim-ai
railway init
railway up

# Set environment variables (from your .env.local)
railway variables set TAVILY_API_KEY=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
railway variables set REDIS_LANGCACHE_HOST=aws-us-east-1.langcache.redis.io
railway variables set REDIS_LANGCACHE_API_KEY=wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO
railway variables set REDIS_LANGCACHE_ID=d2d2cba1c3ef49beab4d3c8b2e0857d0

# Get your production URL
railway domain
```

**Your agent will be live at:** `https://your-project.up.railway.app`

---

### Option 2: Render (No CLI needed - 10 minutes)

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `reclaim-ai-agent`
   - **Environment:** `Node`
   - **Region:** `Oregon` (or closest)
   - **Branch:** `main` (or your branch)
   - **Root Directory:** `reclaim-ai`
   - **Build Command:** `npm install && npm run agent:build`
   - **Start Command:** `npm run agent:start`
   - **Plan:** `Starter` (free tier)
5. Add Environment Variables:
   - `TAVILY_API_KEY` = `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`
   - `REDIS_LANGCACHE_HOST` = `aws-us-east-1.langcache.redis.io`
   - `REDIS_LANGCACHE_API_KEY` = `wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO`
   - `REDIS_LANGCACHE_ID` = `d2d2cba1c3ef49beab4d3c8b2e0857d0`
   - `PORT` = `3000` (optional, defaults to 3000)
6. Click **"Create Web Service"**

**Your agent will be live at:** `https://reclaim-ai-agent.onrender.com` (or custom domain)

---

### Option 3: Fly.io (Fast deployment)

```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
cd reclaim-ai
fly launch --dockerfile Dockerfile.agent

# Set environment variables
fly secrets set TAVILY_API_KEY=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
fly secrets set REDIS_LANGCACHE_HOST=aws-us-east-1.langcache.redis.io
fly secrets set REDIS_LANGCACHE_API_KEY=wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO
fly secrets set REDIS_LANGCACHE_ID=d2d2cba1c3ef49beab4d3c8b2e0857d0
```

**Your agent will be live at:** `https://reclaim-ai-agent.fly.dev`

---

### Option 4: Docker (Manual deployment)

```bash
# Build Docker image
cd reclaim-ai
docker build -f Dockerfile.agent -t reclaim-ai-agent:latest .

# Run locally
docker run -d -p 3000:3000 \
  -e TAVILY_API_KEY=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 \
  -e REDIS_LANGCACHE_HOST=aws-us-east-1.langcache.redis.io \
  -e REDIS_LANGCACHE_API_KEY=wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO \
  -e REDIS_LANGCACHE_ID=d2d2cba1c3ef49beab4d3c8b2e0857d0 \
  --name reclaim-agent \
  reclaim-ai-agent:latest

# Push to Docker Hub (then deploy to any cloud provider)
docker tag reclaim-ai-agent:latest your-username/reclaim-ai-agent:latest
docker push your-username/reclaim-ai-agent:latest
```

---

## Test Your Deployment

Once deployed, test your agent:

```bash
# Health check
curl https://your-deployment-url/health

# Test API
curl -X POST https://your-deployment-url/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "url": "https://www.amazon.com/dp/B08N5WRWNW"
  }'
```

---

## Quick Deploy Script

Or use the included deployment helper:

```bash
cd reclaim-ai
./deploy.sh
```

Follow the prompts to deploy to your preferred platform.

---

## What's Deployed?

- ✅ Standalone Express server (`server.ts`)
- ✅ Reclaim AI Agent API (`/api/tool`)
- ✅ Health check endpoint (`/health`)
- ✅ All dependencies included
- ✅ Production-optimized build

---

## Documentation

- **API Documentation:** [MCP_API.md](./MCP_API.md)
- **Detailed Deployment:** [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
- **Usage Guide:** [README-AGENT.md](./README-AGENT.md)

---

## Need Help?

- Check the deployment logs in your platform's dashboard
- Verify all environment variables are set correctly
- Test the health endpoint first: `/health`
- See troubleshooting in [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

