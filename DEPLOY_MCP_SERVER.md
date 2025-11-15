# 🚀 Deploy MCP Server for Reclaim AI Agent

## Overview

This is a **standalone MCP (Model Context Protocol) server** that other tools can call via HTTP to get product analysis, recommendations, and reasoning. 

**No Next.js, no UI** - Just a pure MCP server that accepts URLs and returns recommendations with detailed reasoning.

## What Gets Deployed

✅ **MCP Server over HTTP** (`mcp-server-http.ts`)
✅ **7 MCP Tools** available:
   - `analyze_product` - Main tool: URL → Analysis + Reasoning + Recommendations
   - `get_product_metadata` - Extract product info
   - `search_alternatives` - Find cheaper alternatives
   - `get_user_preferences` - Get user preferences
   - `set_user_preferences` - Set user preferences
   - `get_browsing_history` - Get browsing history
   - `create_price_alert` - Create price alerts

✅ **Legacy REST API** (`/api/tool`) for backward compatibility

## Deployment Options

### Option 1: Render (Recommended - Easiest)

**Step 1:** Go to https://dashboard.render.com

**Step 2:** Click "New +" → "Web Service"

**Step 3:** Connect Repository
- Select: **`Reclaim-AI`**
- Click "Connect"

**Step 4:** Configure Settings
```
Name: reclaim-ai-mcp-server
Region: Oregon (US West)
Branch: main
Root Directory: reclaim-ai
Runtime: Node
Build Command: npm install && npm run agent:build
Start Command: npm run mcp:start
Instance Type: Free (Starter)
```

**Step 5:** Add Environment Variables
Click "Advanced" → Add:
- `TAVILY_API_KEY` = `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`
- `REDIS_LANGCACHE_HOST` = `aws-us-east-1.langcache.redis.io`
- `REDIS_LANGCACHE_API_KEY` = `wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO`
- `REDIS_LANGCACHE_ID` = `d2d2cba1c3ef49beab4d3c8b2e0857d0`

**Step 6:** Click "Create Web Service"

**Step 7:** Wait for deployment (2-5 minutes)

**Done!** Your MCP server will be at: `https://reclaim-ai-mcp-server.onrender.com`

---

### Option 2: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
cd reclaim-ai
railway init

# Set environment variables
railway variables set TAVILY_API_KEY=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
railway variables set REDIS_LANGCACHE_HOST=aws-us-east-1.langcache.redis.io
railway variables set REDIS_LANGCACHE_API_KEY=wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO
railway variables set REDIS_LANGCACHE_ID=d2d2cba1c3ef49beab4d3c8b2e0857d0

# Set start command
railway variables set START_COMMAND="npm run mcp:start"

# Deploy
railway up
```

---

### Option 3: Docker

```bash
# Build Docker image
cd reclaim-ai
docker build -f Dockerfile.agent -t reclaim-ai-mcp-server .

# Run container
docker run -d -p 3000:3000 \
  -e TAVILY_API_KEY=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 \
  -e REDIS_LANGCACHE_HOST=aws-us-east-1.langcache.redis.io \
  -e REDIS_LANGCACHE_API_KEY=wy4ECQMIqQNwkLY9Z2LgLY9x9QLynRuuHgZ43J68o4Z7FhP5XZwvSntm4qLcijvR0oIB_CzX5Q-BFA-8Rf4nJSKK9F3K8kpE3zfd0OapAcsJokykGBB3FXighe4QkgmaLAX3e98Yndi3RqQQCzkDUKXR9lmkY_nDuHYiPveWCLiGzg9ANxFxd6_G2Hs1qKwKoNNwSazTpv3Q02jCsqj6xiJ2iLIp3PHGUaxKLX0cp2P-4HWO \
  -e REDIS_LANGCACHE_ID=d2d2cba1c3ef49beab4d3c8b2e0857d0 \
  --name reclaim-mcp-server \
  reclaim-ai-mcp-server
```

---

## Using the MCP Server

### 1. List Available Tools

```bash
curl https://your-server-url/mcp/tools
```

### 2. Call MCP Tool (Analyze Product)

```bash
curl -X POST https://your-server-url/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW",
      "userId": "user123"
    }
  }'
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"url\": \"https://www.amazon.com/dp/B08N5WRWNW\",\n  \"title\": \"iPhone 15 Pro\",\n  \"price\": 999,\n  \"manipulationSignals\": [\"Urgency/scarcity pressure\"],\n  \"manipulationClaims\": [...],\n  \"recommendation\": {\n    \"score\": 35,\n    \"detailedReasoning\": \"📊 SCORE BREAKDOWN: 35/100\\n-30 points: 2 marketing claim(s) detected\\n-20 points: 1 cheaper alternative(s) available\\n\\n🚨 MARKETING CLAIMS DETECTED...\",\n    \"verdict\": \"find-alternative\"\n  },\n  \"alternatives\": [...]\n}"
    }
  ]
}
```

### 3. Legacy REST API (Backward Compatible)

```bash
curl -X POST https://your-server-url/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "url": "https://www.amazon.com/dp/B08N5WRWNW"
  }'
```

---

## Integration Examples

### From Another Tool/Service

```javascript
// Call MCP server from your tool
const response = await fetch('https://your-server-url/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'analyze_product',
    arguments: {
      url: 'https://www.amazon.com/dp/B08N5WRWNW'
    }
  })
});

const result = await response.json();
const analysis = JSON.parse(result.content[0].text);

console.log('Score:', analysis.recommendation.score);
console.log('Reasoning:', analysis.recommendation.detailedReasoning);
console.log('Verdict:', analysis.recommendation.verdict);
```

### From Python

```python
import requests

response = requests.post(
    'https://your-server-url/mcp/tools/call',
    json={
        'name': 'analyze_product',
        'arguments': {
            'url': 'https://www.amazon.com/dp/B08N5WRWNW'
        }
    }
)

result = response.json()
analysis = json.loads(result['content'][0]['text'])

print(f"Score: {analysis['recommendation']['score']}")
print(f"Reasoning: {analysis['recommendation']['detailedReasoning']}")
print(f"Verdict: {analysis['recommendation']['verdict']}")
```

---

## Endpoints

- **Health Check:** `GET /health`
- **List Tools:** `GET /mcp/tools`
- **Call Tool:** `POST /mcp/tools/call`
- **Legacy API:** `POST /api/tool`

---

## Testing Locally

```bash
cd reclaim-ai
npm run mcp:dev
```

Then test:
```bash
# Health check
curl http://localhost:3000/health

# List tools
curl http://localhost:3000/mcp/tools

# Analyze product
curl -X POST http://localhost:3000/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name":"analyze_product","arguments":{"url":"https://www.amazon.com/dp/B08N5WRWNW"}}'
```

---

## What You Get

✅ **Standalone MCP server** - No dependencies on Next.js or UI
✅ **HTTP-based** - Easy to integrate from any tool
✅ **Production-ready** - Ready to deploy and use
✅ **Detailed reasoning** - Explains why it scored a product
✅ **Marketing claim verification** - Uses Tavily to verify claims
✅ **Alternatives search** - Finds cheaper/similar options
✅ **Caching** - Redis LangCache for performance

---

## Documentation

- **Full MCP API:** [MCP_API.md](./MCP_API.md)
- **Production Deployment:** [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

