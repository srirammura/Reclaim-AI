# Deployment Guide

## Production Deployment Options

### 1. Vercel (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Set Environment Variables** in Vercel Dashboard:
   - `TAVILY_API_KEY`
   - `REDIS_LANGCACHE_HOST`
   - `REDIS_LANGCACHE_API_KEY`
   - `REDIS_LANGCACHE_ID`
   - `NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY` (optional)

4. **Production URL**: Your app will be available at `https://your-project.vercel.app`

---

### 2. Docker Deployment

1. **Build Docker image**:
```bash
docker build -t reclaim-ai .
```

2. **Run container**:
```bash
docker run -p 3000:3000 \
  -e TAVILY_API_KEY=your_key \
  -e REDIS_LANGCACHE_HOST=your_host \
  -e REDIS_LANGCACHE_API_KEY=your_key \
  -e REDIS_LANGCACHE_ID=your_id \
  -e NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=your_key \
  reclaim-ai
```

3. **Or use docker-compose.yml**:
```yaml
version: '3.8'
services:
  reclaim-ai:
    build: .
    ports:
      - "3000:3000"
    environment:
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - REDIS_LANGCACHE_HOST=${REDIS_LANGCACHE_HOST}
      - REDIS_LANGCACHE_API_KEY=${REDIS_LANGCACHE_API_KEY}
      - REDIS_LANGCACHE_ID=${REDIS_LANGCACHE_ID}
      - NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=${NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY}
```

Then run:
```bash
docker-compose up -d
```

---

### 3. Railway

1. **Install Railway CLI**:
```bash
npm i -g @railway/cli
```

2. **Login**:
```bash
railway login
```

3. **Deploy**:
```bash
railway init
railway up
```

4. **Set Environment Variables** in Railway Dashboard

---

### 4. Render

1. **Create new Web Service** on Render
2. **Connect GitHub repository**
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`
5. **Set Environment Variables**

---

## Environment Variables

### Required
```env
TAVILY_API_KEY=your_tavily_api_key
```

### Optional (for caching)
```env
REDIS_LANGCACHE_HOST=your_langcache_host
REDIS_LANGCACHE_API_KEY=your_langcache_api_key
REDIS_LANGCACHE_ID=your_langcache_cache_id
```

### Optional (for CopilotKit)
```env
NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=your_copilotkit_key
```

---

## Production Checklist

- [ ] All environment variables set
- [ ] API keys configured
- [ ] Redis LangCache configured (optional but recommended)
- [ ] CopilotKit API key set (if using CopilotKit)
- [ ] Domain configured (if using custom domain)
- [ ] HTTPS enabled
- [ ] Monitoring/logging set up
- [ ] Error tracking configured

---

## Performance Optimization

1. **Enable Caching**: Use Redis LangCache for better performance
2. **CDN**: Use Vercel's CDN for static assets
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Monitoring**: Set up monitoring (e.g., Vercel Analytics)

---

## Troubleshooting

### Build Fails
- Check Node.js version (requires 20+)
- Verify all dependencies installed
- Check environment variables

### Runtime Errors
- Verify API keys are correct
- Check Redis connection (if using LangCache)
- Review server logs

### CopilotKit Not Working
- Verify `NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY` is set
- Check CopilotKit route at `/api/copilotkit`
- Ensure actions are properly exported

