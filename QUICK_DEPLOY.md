# ⚡ Quick Deploy - Copy & Paste Guide

## 🎯 RECOMMENDED: Deploy to Render (5 minutes, No CLI)

### Step 1: Commit & Push Your Code (if needed)

```bash
cd "/Users/srirammuralidharan/AI Projects/reclaim-ai"
git add .
git commit -m "Add Reclaim AI Agent deployment configuration"
git push origin main
```

### Step 2: Deploy via Render Dashboard

**Open in browser:** https://dashboard.render.com

**Follow these exact steps:**

1. **Sign up / Log in** → Use GitHub account (easiest)

2. **Click "New +"** (top right) → **"Web Service"**

3. **Connect Repository:**
   - Select `youtube-video-summary`
   - Click **"Connect"**

4. **Configure Service:**
   ```
   Name: reclaim-ai-agent
   Region: Oregon (US West)
   Branch: main
   Root Directory: reclaim-ai  ⚠️ IMPORTANT!
   Runtime: Node
   Build Command: npm install && npm run agent:build
   Start Command: npm run agent:start
   Instance Type: Free
   ```

5. **Add Environment Variables** (Click "Advanced"):
   - Variable: `TAVILY_API_KEY` Value: `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`
   - Variable: `REDIS_LANGCACHE_HOST` Value: `aws-us-east-1.langcache.redis.io`
   - Variable: `REDIS_LANGCACHE_API_KEY` Value: `wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO`
   - Variable: `REDIS_LANGCACHE_ID` Value: `d2d2cba1c3ef49beab4d3c8b2e0857d0`

6. **Click "Create Web Service"**

7. **Wait 2-5 minutes** → Watch build logs

8. **Done!** Your agent will be live at: `https://reclaim-ai-agent.onrender.com`

### Step 3: Test Your Deployment

Open in browser or run:
```bash
curl https://reclaim-ai-agent.onrender.com/health
```

You should see: `{"status":"ok","service":"reclaim-ai-agent"}`

---

## 🚂 ALTERNATIVE: Railway CLI (If you prefer CLI)

### Install & Deploy:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login (opens browser)
railway login

# Navigate to project
cd "/Users/srirammuralidharan/AI Projects/reclaim-ai"

# Initialize
railway init

# Set environment variables
railway variables set TAVILY_API_KEY=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
railway variables set REDIS_LANGCACHE_HOST=aws-us-east-1.langcache.redis.io
railway variables set REDIS_LANGCACHE_API_KEY=wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO
railway variables set REDIS_LANGCACHE_ID=d2d2cba1c3ef49beab4d3c8b2e0857d0

# Deploy
railway up

# Get URL
railway domain
```

---

## ✅ After Deployment

1. **Test Health Check:**
   ```bash
   curl https://your-url/health
   ```

2. **Test Product Analysis:**
   ```bash
   curl -X POST https://your-url/api/tool \
     -H "Content-Type: application/json" \
     -d '{"action":"analyze","url":"https://www.amazon.com/dp/B08N5WRWNW"}'
   ```

3. **View Logs:**
   - Render: Dashboard → Service → Logs
   - Railway: `railway logs`

---

## 🐛 Troubleshooting

**Build fails?** → Check build logs in dashboard

**Server not starting?** → Verify environment variables are set correctly

**404 errors?** → Ensure Root Directory is set to `reclaim-ai`

**API errors?** → Test `/health` endpoint first

---

## 📚 Documentation

- Full Guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- API Docs: [MCP_API.md](./MCP_API.md)
- Production Guide: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

