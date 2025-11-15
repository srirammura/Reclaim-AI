# 🔧 Fix Render Deployment Issue

## Problem
Render is looking for `/opt/render/project/src/reclaim-ai` subdirectory, but your repository root IS the reclaim-ai folder.

## ✅ Solution

### In Render Dashboard:

1. **Go to your service** → **Settings**

2. **Find "Root Directory"** field

3. **Change it to:** `.` (just a dot) OR leave it **empty**

4. **Save changes**

5. **Redeploy** (or it will auto-redeploy)

---

## Alternative: Delete and Recreate Service

If updating doesn't work:

1. **Delete the current service** in Render
2. **Create new service:**
   - Click "New +" → "Web Service"
   - Connect `Reclaim-AI` repository
   - **IMPORTANT:** Leave **Root Directory** **EMPTY** or set to `.`
   - Build Command: `npm install && npm run agent:build`
   - Start Command: `npm run mcp:start`
3. **Add environment variables** (see below)

---

## Environment Variables to Add

In Render Dashboard → Environment Variables:

| Key | Value |
|-----|-------|
| `TAVILY_API_KEY` | `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` |
| `REDIS_LANGCACHE_HOST` | `aws-us-east-1.langcache.redis.io` |
| `REDIS_LANGCACHE_API_KEY` | `wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO` |
| `REDIS_LANGCACHE_ID` | `d2d2cba1c3ef49beab4d3c8b2e0857d0` |

**Apply to:** ☑ Production ☑ Preview ☑ Development (for each variable)

---

## ✅ Correct Settings Summary

```
Name: reclaim-ai-mcp-server
Root Directory: .          ⚠️ THIS IS KEY - Must be "." or empty
Build Command: npm install && npm run agent:build
Start Command: npm run mcp:start
Runtime: Node
```

---

After fixing Root Directory and adding environment variables, deployment should work!

