# Reclaim AI Agent - Production Deployment

Standalone production deployment for Reclaim AI Agent (API only, no UI).

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
tsx server.ts

# Production
npm run build && npm start
```

The agent API will be available at `http://localhost:3000/api/tool`

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

**Available Actions:**
- `analyze` - Analyze product URL
- `metadata` - Get product metadata
- `alternatives` - Search for alternatives
- `get_preferences` - Get user preferences
- `set_preferences` - Set user preferences
- `history` - Get browsing history
- `alert` - Create price alert

---

## Example API Calls

### Analyze Product
```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "url": "https://www.amazon.com/dp/B08N5WRWNW",
    "userId": "user123"
  }'
```

### Search Alternatives
```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "alternatives",
    "productName": "iPhone 15 Pro",
    "additionalTerms": "used cheaper"
  }'
```

---

## MCP Server

To run as MCP (Model Context Protocol) server:

```bash
npm run mcp:server
```

See [MCP_API.md](./MCP_API.md) for complete MCP API documentation with request/response examples.

---

## Docker Deployment

### Build
```bash
docker build -f Dockerfile.agent -t reclaim-ai-agent .
```

### Run
```bash
docker run -p 3000:3000 \
  -e TAVILY_API_KEY=your_key \
  -e REDIS_LANGCACHE_HOST=your_host \
  -e REDIS_LANGCACHE_API_KEY=your_key \
  -e REDIS_LANGCACHE_ID=your_id \
  reclaim-ai-agent
```

---

## Documentation

- [MCP_API.md](./MCP_API.md) - Complete MCP API documentation with request/response examples
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Detailed deployment guide
- [USAGE.md](./USAGE.md) - Complete usage guide

---

## Features

✅ Standalone API server (no UI)
✅ MCP compatible
✅ REST API
✅ Docker support
✅ Production ready
✅ Full documentation

