# Production Deployment - Reclaim AI Agent

This guide covers deploying **only the Reclaim AI Agent** (not the full Next.js UI) to production.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create `.env`:

```env
TAVILY_API_KEY=your_tavily_api_key
PORT=3000

# Optional (for caching)
REDIS_LANGCACHE_HOST=your_langcache_host
REDIS_LANGCACHE_API_KEY=your_langcache_api_key
REDIS_LANGCACHE_ID=your_langcache_id
```

### 3. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

The agent API will be available at `http://localhost:3000/api/tool`

---

## Deployment Options

### Option 1: Docker (Recommended)

1. **Build Docker image**:
```bash
docker build -f Dockerfile.agent -t reclaim-ai-agent .
```

2. **Run container**:
```bash
docker run -p 3000:3000 \
  -e TAVILY_API_KEY=your_key \
  -e REDIS_LANGCACHE_HOST=your_host \
  -e REDIS_LANGCACHE_API_KEY=your_key \
  -e REDIS_LANGCACHE_ID=your_id \
  reclaim-ai-agent
```

3. **Docker Compose**:
```yaml
version: '3.8'
services:
  reclaim-agent:
    build:
      context: .
      dockerfile: Dockerfile.agent
    ports:
      - "3000:3000"
    environment:
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - REDIS_LANGCACHE_HOST=${REDIS_LANGCACHE_HOST}
      - REDIS_LANGCACHE_API_KEY=${REDIS_LANGCACHE_API_KEY}
      - REDIS_LANGCACHE_ID=${REDIS_LANGCACHE_ID}
    restart: unless-stopped
```

---

### Option 2: Railway

1. **Create `railway.json`**:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Deploy**:
```bash
railway init
railway up
```

---

### Option 3: Render

1. Create new **Web Service** on Render
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. Set environment variables in dashboard

---

### Option 4: Fly.io

1. **Create `fly.toml`**:
```toml
app = "reclaim-ai-agent"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile.agent"

[env]
  PORT = "3000"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

2. **Deploy**:
```bash
fly launch
```

---

## API Endpoints

### Health Check
```
GET /health
```

### Tool API
```
POST /api/tool
Content-Type: application/json

{
  "action": "analyze",
  "url": "https://www.amazon.com/dp/B08N5WRWNW",
  "userId": "user123"
}
```

Available actions:
- `analyze` - Analyze product
- `metadata` - Get product metadata
- `alternatives` - Search alternatives
- `get_preferences` - Get user preferences
- `set_preferences` - Set user preferences
- `history` - Get browsing history
- `alert` - Create price alert

See [MCP_API.md](./MCP_API.md) for detailed API documentation.

---

## MCP Server Deployment

To run as MCP server:

1. **Start MCP server**:
```bash
npm run mcp:server
```

2. **Use with MCP clients**:
See [MCP_API.md](./MCP_API.md) for MCP client examples.

---

## Environment Variables

### Required
```env
TAVILY_API_KEY=your_tavily_api_key
```

### Optional
```env
PORT=3000
REDIS_LANGCACHE_HOST=your_langcache_host
REDIS_LANGCACHE_API_KEY=your_langcache_api_key
REDIS_LANGCACHE_ID=your_langcache_id
```

---

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "service": "reclaim-ai-agent"
}
```

### Logs
Check console logs for:
- `✅ Tavily initialized successfully`
- `✅ LangCache initialized successfully`
- `🚀 Reclaim AI Agent server running on port 3000`
- `✅ [LANGCA CHE]` - Cache statistics

---

## Production Checklist

- [ ] Environment variables set
- [ ] TAVILY_API_KEY configured
- [ ] Redis LangCache configured (optional but recommended)
- [ ] Health check endpoint responding
- [ ] API endpoints tested
- [ ] Docker image built (if using Docker)
- [ ] Monitoring/logging configured
- [ ] Error tracking set up

---

## Scaling

### Horizontal Scaling
Run multiple instances behind a load balancer:
- All instances can share the same Redis LangCache
- Stateless API - safe to scale horizontally

### Vertical Scaling
- Increase memory for better caching
- More CPU for faster processing

---

## Troubleshooting

### Server Won't Start
- Check environment variables are set
- Verify TAVILY_API_KEY is valid
- Check port is not in use

### API Errors
- Verify request format matches examples
- Check server logs for detailed errors
- Ensure all required parameters are provided

### Performance Issues
- Enable Redis LangCache for caching
- Check Tavily API rate limits
- Monitor cache hit rates in logs

