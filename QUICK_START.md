# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Environment Variables

Create `.env.local`:

```env
TAVILY_API_KEY=your_key_here
```

Optional (for caching):
```env
REDIS_LANGCACHE_HOST=your_host
REDIS_LANGCACHE_API_KEY=your_key
REDIS_LANGCACHE_ID=your_id
```

Optional (for CopilotKit UI):
```env
NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=your_key
```

## 3. Run Examples

### Basic Tool Usage

```typescript
import { ReclaimTool } from "./lib/reclaim-tool";

const tool = new ReclaimTool();
const analysis = await tool.analyzeProduct("https://www.amazon.com/dp/B08N5WRWNW");

console.log(analysis.recommendation.verdict);
console.log(analysis.recommendation.score);
console.log(analysis.alternatives);
```

### REST API Usage

```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{"action": "analyze", "url": "https://www.amazon.com/dp/B08N5WRWNW"}'
```

### MCP Server

```bash
npm run mcp:server
```

### Web UI

```bash
npm run dev
# Visit http://localhost:3000
```

## 4. Deploy to Production

### Vercel
```bash
vercel
```

### Docker
```bash
docker build -t reclaim-ai .
docker run -p 3000:3000 -e TAVILY_API_KEY=your_key reclaim-ai
```

For detailed instructions, see [USAGE.md](./USAGE.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).

