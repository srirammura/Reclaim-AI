# Quick Deploy Guide

## Option 1: Railway (Easiest)

1. **Install Railway CLI**:
```bash
npm i -g @railway/cli
```

2. **Login**:
```bash
railway login
```

3. **Initialize and Deploy**:
```bash
cd reclaim-ai
railway init
railway link  # Link to existing project or create new
railway up
```

4. **Set Environment Variables**:
```bash
railway variables set TAVILY_API_KEY=your_key
railway variables set REDIS_LANGCACHE_HOST=your_host
railway variables set REDIS_LANGCACHE_API_KEY=your_key
railway variables set REDIS_LANGCACHE_ID=your_id
```

5. **Get Production URL**:
```bash
railway domain
```

---

## Option 2: Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: reclaim-ai-agent
   - **Environment**: Node
   - **Build Command**: `npm install && npm run agent:build`
   - **Start Command**: `npm run agent:start`
   - **Health Check Path**: `/health`
5. Set environment variables in dashboard
6. Click "Create Web Service"

---

## Option 3: Fly.io

1. **Install Fly CLI**:
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login**:
```bash
fly auth login
```

3. **Deploy**:
```bash
cd reclaim-ai
fly launch --dockerfile Dockerfile.agent
```

4. **Set Environment Variables**:
```bash
fly secrets set TAVILY_API_KEY=your_key
fly secrets set REDIS_LANGCACHE_HOST=your_host
fly secrets set REDIS_LANGCACHE_API_KEY=your_key
fly secrets set REDIS_LANGCACHE_ID=your_id
```

---

## Option 4: Docker + Cloud Provider

### Build Docker Image
```bash
cd reclaim-ai
docker build -f Dockerfile.agent -t reclaim-ai-agent .
```

### Push to Docker Hub
```bash
docker tag reclaim-ai-agent your-username/reclaim-ai-agent
docker push your-username/reclaim-ai-agent
```

### Deploy to Cloud (AWS/GCP/Azure)
- Use your preferred cloud provider's container service
- Set environment variables
- Point to your Docker image

---

## Local Testing Before Deployment

```bash
# Test locally
npm run agent:dev

# Test health check
curl http://localhost:3000/health

# Test API
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{"action": "analyze", "url": "https://www.amazon.com/dp/B08N5WRWNW"}'
```

