# Reclaim AI - Purpose over Purchase

An AI-powered agent that helps users make mindful purchasing decisions by analyzing products for manipulation tactics, finding cheaper alternatives, and providing evidence-based recommendations.

## Features

- 🔍 **Product Analysis**: Analyze any product URL for manipulation signals
- ✅ **Claim Verification**: Verify marketing claims using Tavily web search
- 💰 **Alternative Search**: Find cheaper used, refurbished, or similar products
- 🎯 **Personalized Recommendations**: Get recommendations based on budget and preferences
- 🚀 **MCP Compatible**: Works as Model Context Protocol server
- 🛠️ **Standalone Tool API**: Use without AI/LLM in your code
- 🤖 **CopilotKit Integration**: AI-powered UI with natural language interface

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
TAVILY_API_KEY=your_tavily_api_key
REDIS_LANGCACHE_HOST=your_langcache_host (optional)
REDIS_LANGCACHE_API_KEY=your_langcache_api_key (optional)
REDIS_LANGCACHE_ID=your_langcache_id (optional)
NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=your_copilotkit_key (optional)
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Usage Options

### Option 1: Standalone Tool API (No AI)

Use the tool directly via REST API:

```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "url": "https://www.amazon.com/dp/B08N5WRWNW"
  }'
```

### Option 2: Code Integration

```typescript
import { ReclaimTool } from "./lib/reclaim-tool";

const tool = new ReclaimTool();
const analysis = await tool.analyzeProduct("https://www.amazon.com/dp/B08N5WRWNW");
console.log(analysis.recommendation.verdict);
```

### Option 3: MCP Server

Run as MCP server:

```bash
npm run mcp:server
```

### Option 4: CopilotKit UI

The web UI with AI assistant is available at `http://localhost:3000`

## Examples

Run example scripts:

```bash
# Basic usage
npm run example:basic

# With user preferences
npm run example:preferences

# Search alternatives
npm run example:alternatives
```

## Deployment

### Vercel (Recommended)

```bash
vercel
```

### Docker

```bash
docker build -t reclaim-ai .
docker run -p 3000:3000 \
  -e TAVILY_API_KEY=your_key \
  reclaim-ai
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Documentation

- [USAGE.md](./USAGE.md) - Complete usage guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide

## Architecture

```
reclaim-ai/
├── lib/
│   ├── reclaim-agent.ts    # Core agent logic
│   ├── reclaim-tool.ts      # Standalone tool wrapper
│   └── copilot-actions.ts   # CopilotKit actions
├── app/
│   ├── api/
│   │   ├── tool/            # Standalone tool API
│   │   ├── analyze/         # Analysis endpoint
│   │   └── copilotkit/      # CopilotKit runtime
│   └── page.tsx             # Main UI
├── examples/                # Usage examples
├── mcp-server.ts           # MCP server
└── components/             # React components
```

## Features

### Product Analysis
- Detects marketing manipulation tactics
- Verifies claims using web search
- Provides evidence-based recommendations
- Scores products 0-100 (lower = better to avoid)

### Alternative Search
- Finds used/refurbished versions
- Locates cheaper alternatives
- Filters out search/category pages
- Returns only direct product links

### Caching
- Redis LangCache for performance
- Multi-level caching strategy
- 10-100x faster for cached items

## License

MIT
