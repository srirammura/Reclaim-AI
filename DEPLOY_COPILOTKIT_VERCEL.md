# 🚀 Deploy Reclaim AI with CopilotKit to Vercel

## Overview

Your Reclaim AI application uses CopilotKit and Next.js, which is **perfectly suited for Vercel deployment**. Vercel is the recommended platform for Next.js + CopilotKit applications.

## Quick Deploy to Vercel (5 minutes)

### Step 1: Install Vercel CLI (if needed)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser for authentication.

### Step 3: Deploy from Project Directory

```bash
cd "/Users/srirammuralidharan/AI Projects/reclaim-ai"
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (or Yes if you've created one)
- Project name: `reclaim-ai` (or press Enter for default)
- Directory: `.` (press Enter)
- Override settings? **No** (or configure as needed)

### Step 4: Set Environment Variables

After first deployment, set your environment variables:

```bash
vercel env add TAVILY_API_KEY
# Paste: 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

vercel env add REDIS_LANGCACHE_HOST
# Paste: aws-us-east-1.langcache.redis.io

vercel env add REDIS_LANGCACHE_API_KEY
# Paste: wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO

vercel env add REDIS_LANGCACHE_ID
# Paste: d2d2cba1c3ef49beab4d3c8b2e0857d0

# Optional: CopilotKit API key (if you have one)
vercel env add NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY
# Paste your CopilotKit API key (if applicable)
```

**Important:** Apply to all environments:
- For each variable, select: `Production`, `Preview`, `Development`

### Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

This will redeploy with all environment variables configured.

### Step 6: Get Your Production URL

After deployment, Vercel will show you:
- **Production URL:** `https://reclaim-ai.vercel.app` (or your custom domain)

---

## Alternative: Deploy via Vercel Dashboard

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com
2. Sign up or log in (use GitHub - easiest)

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Import Git Repository
3. Select: **`Reclaim-AI`** repository
4. Click **"Import"**

### Step 3: Configure Project
Vercel will auto-detect Next.js:

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**Verify these settings are correct** (they should be auto-detected).

### Step 4: Add Environment Variables
Before deploying, add environment variables:

Click **"Environment Variables"** and add:

```
TAVILY_API_KEY = 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
```
Select: ☑ Production ☑ Preview ☑ Development

```
REDIS_LANGCACHE_HOST = aws-us-east-1.langcache.redis.io
```
Select: ☑ Production ☑ Preview ☑ Development

```
REDIS_LANGCACHE_API_KEY = wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO
```
Select: ☑ Production ☑ Preview ☑ Development

```
REDIS_LANGCACHE_ID = d2d2cba1c3ef49beab4d3c8b2e0857d0
```
Select: ☑ Production ☑ Preview ☑ Development

```
NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY = (optional - your CopilotKit key)
```
Select: ☑ Production ☑ Preview ☑ Development

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 2-5 minutes for build
3. **Done!** Your app is live

---

## What Gets Deployed

✅ **Full Next.js Application** with CopilotKit UI
✅ **API Routes:**
   - `/api/copilotkit` - CopilotKit runtime
   - `/api/analyze` - Product analysis API
   - `/api/tool` - Direct tool API
✅ **Static Assets** (automatically optimized)
✅ **Serverless Functions** (auto-configured by Vercel)

---

## Testing Your Deployment

### 1. Test the UI
Open your Vercel URL in a browser:
- Main page: `https://your-app.vercel.app`
- CopilotKit sidebar should be visible

### 2. Test API Endpoints

**CopilotKit Runtime:**
```bash
curl https://your-app.vercel.app/api/copilotkit
```

**Product Analysis:**
```bash
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.amazon.com/dp/B08N5WRWNW"}'
```

**Tool API:**
```bash
curl -X POST https://your-app.vercel.app/api/tool \
  -H "Content-Type: application/json" \
  -d '{"action": "analyze", "url": "https://www.amazon.com/dp/B08N5WRWNW"}'
```

---

## Automatic Deployments

Vercel automatically deploys:
- **Production:** On push to `main` branch
- **Preview:** On every pull request

No manual deployment needed! Just push to GitHub.

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificate

---

## Monitoring & Logs

- **Logs:** Vercel Dashboard → Your Project → Logs
- **Analytics:** Vercel Dashboard → Analytics
- **Functions:** Monitor API route performance

---

## Troubleshooting

**Build Fails?**
- Check build logs in Vercel dashboard
- Verify `package.json` scripts are correct
- Ensure Node.js version is 20+ (Vercel auto-detects)

**API Routes Not Working?**
- Verify environment variables are set
- Check serverless function logs
- Ensure `/api` routes are in `app/api` directory

**CopilotKit Not Loading?**
- Verify `NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY` is set (if required)
- Check browser console for errors
- Ensure CopilotKit provider is configured correctly

---

## Benefits of Vercel Deployment

✅ **Optimized for Next.js** - Best performance
✅ **Automatic HTTPS** - SSL included
✅ **Global CDN** - Fast worldwide
✅ **Serverless Functions** - Auto-scaling
✅ **Zero Configuration** - Works out of the box
✅ **Git Integration** - Auto-deploy on push
✅ **Preview Deployments** - Test before production
✅ **Analytics** - Built-in performance monitoring

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all endpoints
3. ✅ Set up custom domain (optional)
4. ✅ Configure monitoring
5. ✅ Share your production URL!

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **CopilotKit Docs:** https://docs.copilotkit.ai
- **Your Repo:** https://github.com/srirammura/Reclaim-AI

