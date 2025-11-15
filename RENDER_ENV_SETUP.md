# 🔐 Render Environment Variables Setup

## Option 1: Using render.yaml (Recommended for Blueprint)

If you deploy using Render Blueprint (connects via `render.yaml`):

1. **Go to Render Dashboard** → "New +" → **"Blueprint"**
2. **Connect your repository** (`Reclaim-AI`)
3. Render will read `render.yaml` and create the service
4. **You'll still need to set sensitive variables in the dashboard:**
   - Go to your service → **"Environment"** tab
   - Add the actual values for:
     - `TAVILY_API_KEY`
     - `REDIS_LANGCACHE_HOST`
     - `REDIS_LANGCACHE_API_KEY`
     - `REDIS_LANGCACHE_ID`

The `render.yaml` file shows Render **what** variables are needed, but you must set the **actual values** in the dashboard for security.

---

## Option 2: Manual Setup (Step by Step)

If you manually create the service, use these values:

### In Render Dashboard → Environment Variables:

| Key | Value |
|-----|-------|
| `TAVILY_API_KEY` | `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` |
| `REDIS_LANGCACHE_HOST` | `aws-us-east-1.langcache.redis.io` |
| `REDIS_LANGCACHE_API_KEY` | `wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO` |
| `REDIS_LANGCACHE_ID` | `d2d2cba1c3ef49beab4d3c8b2e0857d0` |
| `PORT` | `3000` (optional) |

**Apply to:** ☑ Production ☑ Preview ☑ Development (for each variable)

---

## Option 3: Using .env File (Local Development Only)

For **local development**, you can use `.env`:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env` (already filled with your keys)

3. **Important:** `.env` files are in `.gitignore` and are **NOT** automatically used by Render for security reasons.

**Render does NOT automatically pull from `.env` files** because:
- Security: `.env` files contain sensitive keys
- They should never be committed to git
- Render requires you to set them in the dashboard for security

---

## ✅ Best Practice

**For Deployment (Render):**
- ✅ Use `render.yaml` to define variable names
- ✅ Set actual values in Render dashboard
- ✅ Use `.env` for local development only

**For Local Development:**
- ✅ Use `.env` file (already configured)
- ✅ `.env` is in `.gitignore` (safe)

---

## Quick Reference: All Environment Variables

See `.env.example` file for the complete list with descriptions.

---

## 🔒 Security Note

Never commit `.env` files to git! They're in `.gitignore` for your protection.

