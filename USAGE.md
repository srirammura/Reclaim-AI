# Reclaim AI Agent - Usage Guide

## Overview

Reclaim AI Agent can be used in three ways:
1. **Standalone Tool API** - Direct REST API calls (no AI needed)
2. **Code Integration** - Import and use in your TypeScript/JavaScript code
3. **MCP Server** - Model Context Protocol compatible server
4. **CopilotKit** - AI-powered UI integration (production)

---

## 1. Standalone Tool API (REST)

Use the tool via HTTP API without any AI/LLM.

### Base URL
- Development: `http://localhost:3000/api/tool`
- Production: `https://your-domain.com/api/tool`

### Endpoints

#### Analyze Product
```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "url": "https://www.amazon.com/dp/B08N5WRWNW",
    "userId": "user123"
  }'
```

#### Get Product Metadata
```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "metadata",
    "url": "https://www.amazon.com/dp/B08N5WRWNW"
  }'
```

#### Search Alternatives
```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "alternatives",
    "productName": "iPhone 15 Pro",
    "additionalTerms": "used cheaper"
  }'
```

#### Get User Preferences
```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_preferences",
    "userId": "user123"
  }'
```

#### Set User Preferences
```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set_preferences",
    "userId": "user123",
    "preferences": {
      "budgetRange": { "min": 0, "max": 500 },
      "values": ["sustainability", "value"]
    }
  }'
```

#### Get Browsing History
```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "history",
    "userId": "user123",
    "limit": 10
  }'
```

#### Create Price Alert
```bash
curl -X POST http://localhost:3000/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "alert",
    "userId": "user123",
    "productId": "B08N5WRWNW",
    "threshold": 100
  }'
```

---

## 2. Code Integration

### Basic Usage

```typescript
import { ReclaimTool } from "./lib/reclaim-tool";

// Initialize tool
const tool = new ReclaimTool({
  tavilyApiKey: process.env.TAVILY_API_KEY,
  langCacheHost: process.env.REDIS_LANGCACHE_HOST,
  langCacheApiKey: process.env.REDIS_LANGCACHE_API_KEY,
  langCacheId: process.env.REDIS_LANGCACHE_ID,
});

// Analyze product
const analysis = await tool.analyzeProduct(
  "https://www.amazon.com/dp/B08N5WRWNW",
  "user123"
);

console.log(`Verdict: ${analysis.recommendation.verdict}`);
console.log(`Score: ${analysis.recommendation.score}/100`);
console.log(`Alternatives: ${analysis.alternatives.length}`);
```

### With User Preferences

```typescript
// Set preferences
await tool.setUserPreferences("user123", {
  budgetRange: { min: 0, max: 500 },
  values: ["sustainability"],
});

// Analyze with context
const analysis = await tool.analyzeProduct(url, "user123");

// Check budget
if (analysis.price && analysis.price > 500) {
  console.log("Over budget!");
}
```

### Search Alternatives

```typescript
// Search for used products
const usedResults = await tool.searchAlternatives(
  "iPhone 15 Pro",
  "used pre-owned"
);

// Search for cheaper alternatives
const cheaperResults = await tool.searchAlternatives(
  "iPhone 15 Pro",
  "cheaper alternative budget"
);
```

### Run Examples

```bash
# Basic usage
npm run example:basic

# With user preferences
npm run example:preferences

# Search alternatives
npm run example:alternatives
```

---

## 3. MCP Server

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (`.env.local`):
```env
TAVILY_API_KEY=your_key
REDIS_LANGCACHE_HOST=your_host
REDIS_LANGCACHE_API_KEY=your_key
REDIS_LANGCACHE_ID=your_id
```

3. Start MCP server:
```bash
npm run mcp:server
```

### MCP Client Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "reclaim-ai": {
      "command": "node",
      "args": ["./mcp-server.ts"],
      "env": {
        "TAVILY_API_KEY": "your_key",
        "REDIS_LANGCACHE_HOST": "your_host",
        "REDIS_LANGCACHE_API_KEY": "your_key",
        "REDIS_LANGCACHE_ID": "your_id"
      }
    }
  }
}
```

### Using MCP Client

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client(...);

// List tools
const tools = await client.listTools();

// Call tool
const result = await client.callTool({
  name: "analyze_product",
  arguments: {
    url: "https://www.amazon.com/dp/B08N5WRWNW",
  },
});
```

---

## 4. CopilotKit Integration (Production)

### Frontend Component

```typescript
import { CopilotSidebar } from "@copilotkit/react-ui";
import ProductAnalyzer from "@/components/ProductAnalyzer";

export default function Page() {
  return (
    <div>
      <CopilotSidebar
        instructions="You are Reclaim AI, helping users make mindful purchasing decisions."
        defaultOpen={true}
        labels={{
          title: "Reclaim AI Assistant",
          initial: "Ask me about any product...",
        }}
      />
      <ProductAnalyzer />
    </div>
  );
}
```

### API Route

The CopilotKit route is already set up at `/app/api/copilotkit/route.ts`.

### Environment Variables

```env
NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=your_key
TAVILY_API_KEY=your_key
REDIS_LANGCACHE_HOST=your_host
REDIS_LANGCACHE_API_KEY=your_key
REDIS_LANGCACHE_ID=your_id
```

---

## Production Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

### Deploy to Docker

1. Build:
```bash
docker build -t reclaim-ai .
```

2. Run:
```bash
docker run -p 3000:3000 \
  -e TAVILY_API_KEY=your_key \
  -e REDIS_LANGCACHE_HOST=your_host \
  -e REDIS_LANGCACHE_API_KEY=your_key \
  -e REDIS_LANGCACHE_ID=your_id \
  reclaim-ai
```

### Environment Variables Required

```env
# Required
TAVILY_API_KEY=your_tavily_api_key

# Optional (for caching)
REDIS_LANGCACHE_HOST=your_langcache_host
REDIS_LANGCACHE_API_KEY=your_langcache_api_key
REDIS_LANGCACHE_ID=your_langcache_cache_id

# Optional (for CopilotKit)
NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=your_copilotkit_key
```

---

## Response Format

### Analysis Response

```typescript
{
  url: string;
  title?: string;
  price?: number;
  manipulationSignals: string[];
  manipulationClaims?: Array<{
    type: string;
    claim: string;
    foundText: string;
    verified?: boolean;
    verificationEvidence?: string;
  }>;
  alternatives: Array<{
    type: "used" | "rent" | "repair" | "alternative";
    description: string;
    url?: string;
    price?: number;
    savings?: number;
  }>;
  recommendation: {
    score: number; // 0-100
    reasoning: string;
    detailedReasoning?: string;
    verdict: "buy" | "wait" | "avoid" | "find-alternative";
  };
}
```

---

## Examples

See the `examples/` directory for complete working examples:
- `basic-usage.ts` - Basic product analysis
- `with-user-preferences.ts` - Personalized analysis
- `search-alternatives.ts` - Finding alternatives
- `mcp-client-example.ts` - MCP client usage

Run with:
```bash
npm run example:basic
npm run example:preferences
npm run example:alternatives
```

