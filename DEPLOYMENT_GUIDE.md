# 🚀 Step-by-Step Deployment Guide

## Option 1: Deploy to Render (Easiest - No CLI Required)

### Step 1: Prepare Your Code

✅ Your code is ready! All files are in place:
- ✅ `server.ts` - Main server file
- ✅ `lib/reclaim-agent.ts` - Agent logic
- ✅ `.env.local` - Environment variables configured

### Step 2: Push to GitHub (if not already done)

```bash
cd "/Users/srirammuralidharan/AI Projects/reclaim-ai"
git add .
git commit -m "Add Reclaim AI Agent for production deployment"
git push origin main
```

### Step 3: Deploy to Render

1. **Go to Render Dashboard**
   - Open https://dashboard.render.com in your browser
   - Sign up or log in (free account works)

2. **Create New Web Service**
   - Click **"New +"** button (top right)
   - Select **"Web Service"**

3. **Connect Your Repository**
   - Click **"Connect account"** if not connected
   - Authorize Render to access your GitHub
   - Select repository: `youtube-video-summary`
   - Click **"Connect"**

4. **Configure Service Settings**
   - **Name:** `reclaim-ai-agent`
   - **Region:** `Oregon (US West)` (or closest to you)
   - **Branch:** `main` (or your branch)
   - **Root Directory:** `reclaim-ai` ⚠️ **Important!**
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run agent:build`
   - **Start Command:** `npm run agent:start`
   - **Plan:** `Starter` (Free tier - perfect for testing)

5. **Add Environment Variables**
   Click **"Advanced"** → **"Add Environment Variable"** and add:

   ```
   TAVILY_API_KEY = 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
   ```
   ```
   REDIS_LANGCACHE_HOST = aws-us-east-1.langcache.redis.io
   ```
   ```
   REDIS_LANGCACHE_API_KEY = wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO
   ```
   ```
   REDIS_LANGCACHE_ID = d2d2cba1c3ef49beab4d3c8b2e0857d0
   ```
   ```
   PORT = 3000
   ```
   (PORT is optional - Render sets this automatically)

6. **Deploy!**
   - Click **"Create Web Service"**
   - Render will automatically:
     - Clone your repo
     - Install dependencies
     - Build your project
     - Start the server

7. **Wait for Deployment**
   - Watch the build logs (takes 2-5 minutes)
   - You'll see: "Your service is live!"

8. **Get Your Production URL**
   - Your agent will be at: `https://reclaim-ai-agent.onrender.com`
   - Or check your dashboard for the exact URL

### Step 4: Test Your Deployment

```bash
# Health check
curl https://reclaim-ai-agent.onrender.com/health

# Test API
curl -X POST https://reclaim-ai-agent.onrender.com/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "url": "https://www.amazon.com/dp/B08N5WRWNW"
  }'
```

---

## Option 2: Deploy to Railway (Requires CLI)

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```
(This will open your browser for authentication)

### Step 3: Initialize Project

```bash
cd "/Users/srirammuralidharan/AI Projects/reclaim-ai"
railway init
```

### Step 4: Set Environment Variables

```bash
railway variables set TAVILY_API_KEY=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
railway variables set REDIS_LANGCACHE_HOST=aws-us-east-1.langcache.redis.io
railway variables set REDIS_LANGCACHE_API_KEY=wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO
railway variables set REDIS_LANGCACHE_ID=d2d2cba1c3ef49beab4d3c8b2e0857d0
```

### Step 5: Deploy

```bash
railway up
```

### Step 6: Get Your URL

```bash
railway domain
```

---

## Option 3: Local Docker Deployment

### Step 1: Build Docker Image

```bash
cd "/Users/srirammuralidharan/AI Projects/reclaim-ai"
docker build -f Dockerfile.agent -t reclaim-ai-agent:latest .
```

### Step 2: Run Container

```bash
docker run -d -p 3000:3000 \
  -e TAVILY_API_KEY=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 \
  -e REDIS_LANGCACHE_HOST=aws-us-east-1.langcache.redis.io \
  -e REDIS_LANGCACHE_API_KEY=wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO \
  -e REDIS_LANGCACHE_ID=d2d2cba1c3ef49beab4d3c8b2e0857d0 \
  --name reclaim-agent \
  reclaim-ai-agent:latest
```

### Step 3: Test

```bash
curl http://localhost:3000/health
```

---

## Troubleshooting

### Build Fails
- Check build logs in Render/Railway dashboard
- Ensure `package.json` has correct scripts
- Verify Node.js version (should be 20+)

### Environment Variables Not Working
- Double-check variable names (case-sensitive)
- Ensure no extra spaces in values
- Redeploy after adding variables

### Server Not Starting
- Check logs for errors
- Verify PORT is set correctly (usually auto-set by platform)
- Ensure all dependencies are installed

### API Returns Errors
- Test health endpoint first: `/health`
- Check environment variables are set
- Verify Tavily API key is valid

---

## Next Steps After Deployment

1. ✅ Test health endpoint: `https://your-url/health`
2. ✅ Test API: POST to `/api/tool` with product URL
3. ✅ Monitor logs in dashboard
4. ✅ Set up custom domain (optional)
5. ✅ Configure auto-deploy on git push (optional)

---

## Need Help?

- Check deployment logs in your platform's dashboard
- See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed info
- See [MCP_API.md](./MCP_API.md) for API documentation

