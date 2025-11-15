# 🚀 Deploy to Render - Step by Step

## Your Repository is Ready! ✅
**GitHub:** https://github.com/srirammura/Reclaim-AI

## Render Deployment Steps:

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Sign up or log in (free account works fine)

### Step 2: Create New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**

### Step 3: Connect Repository
1. Click **"Connect account"** if not already connected
2. Authorize Render to access GitHub
3. Select repository: **`Reclaim-AI`**
4. Click **"Connect"**

### Step 4: Configure Service Settings

Fill in these **exact settings**:

```
Name: reclaim-ai-agent
Region: Oregon (US West)  (or closest to you)
Branch: main
Root Directory: reclaim-ai  ⚠️ IMPORTANT!
Runtime: Node
Build Command: npm install && npm run agent:build
Start Command: npm run agent:start
Instance Type: Free (Starter)  ✅ Free tier is fine
```

### Step 5: Add Environment Variables

Click **"Advanced"** → Then add these environment variables one by one:

1. **Variable:** `TAVILY_API_KEY`
   **Value:** `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`

2. **Variable:** `REDIS_LANGCACHE_HOST`
   **Value:** `aws-us-east-1.langcache.redis.io`

3. **Variable:** `REDIS_LANGCACHE_API_KEY`
   **Value:** `wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO`

4. **Variable:** `REDIS_LANGCACHE_ID`
   **Value:** `d2d2cba1c3ef49beab4d3c8b2e0857d0`

5. **Variable:** `PORT`
   **Value:** `3000`
   (Optional - Render sets this automatically, but doesn't hurt to set it)

### Step 6: Deploy!
1. Click **"Create Web Service"**
2. Wait 2-5 minutes while Render:
   - Clones your repository
   - Installs dependencies
   - Builds the project
   - Starts the server

### Step 7: Get Your Production URL
Once deployment is complete, you'll see:
- **Your service is live!**
- URL: `https://reclaim-ai-agent.onrender.com` (or similar)

### Step 8: Test Your Deployment

**Health Check:**
```bash
curl https://reclaim-ai-agent.onrender.com/health
```
Should return: `{"status":"ok","service":"reclaim-ai-agent"}`

**Test API:**
```bash
curl -X POST https://reclaim-ai-agent.onrender.com/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "url": "https://www.amazon.com/dp/B08N5WRWNW"
  }'
```

---

## Alternative: Use render.yaml

If you prefer, you can use the `render.yaml` file we created:
1. In Render dashboard, instead of manual setup, click **"New +"** → **"Blueprint"**
2. Connect your `Reclaim-AI` repository
3. Render will automatically detect `render.yaml` and configure everything
4. You'll still need to add environment variables in the dashboard

---

## Troubleshooting

**Build fails?**
- Check build logs in Render dashboard
- Ensure `Root Directory` is set to `reclaim-ai`
- Verify Node.js version in package.json

**Server not starting?**
- Check logs tab in Render dashboard
- Verify environment variables are set correctly
- Ensure `PORT` is set (Render provides this automatically)

**404 errors?**
- Verify `Start Command` is: `npm run agent:start`
- Check that `server.ts` or `server.js` exists in root directory

---

## ✅ After Successful Deployment

Your Reclaim AI Agent will be live at:
- **Production URL:** `https://reclaim-ai-agent.onrender.com`
- **Health Check:** `/health`
- **API Endpoint:** `/api/tool`

For full API documentation, see: [MCP_API.md](./MCP_API.md)

