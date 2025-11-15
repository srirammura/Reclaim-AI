# 🛡️ Reclaim AI - Purpose Over Purchase

**An intelligent product analysis agent that helps you make mindful purchasing decisions by detecting marketing manipulation, finding cheaper alternatives, and providing detailed reasoning.**

[![Production URL](https://img.shields.io/badge/Production-Reclaim--AI--1.onrender.com-blue)](https://reclaim-ai-1.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🌟 Overview

Reclaim AI analyzes product URLs and provides:
- **Marketing manipulation detection** - Identifies urgency/scarcity tactics, fake exclusivity claims, and price manipulation
- **Verified claims** - Uses Tavily web search to verify marketing claims with evidence
- **Cheaper alternatives** - Finds used, refurbished, and similar products at better prices
- **Price drop analysis** - Analyzes product lifecycle, seasonal trends, and competition to predict price drops
- **Detailed reasoning** - Explains exactly why you should or shouldn't buy with precise scoring
- **Instant caching** - Three-tier caching system for lightning-fast repeated requests

---

## ✨ Key Features

### 🎯 Intelligent Analysis
- **Semantic caching** - Instant results for same/similar URLs (< 0.1s for exact matches)
- **Multi-tier caching** - Memory cache → LangCache semantic search → Fresh analysis
- **Precise scoring** - Decimal scores (e.g., 87.3/100) instead of whole numbers
- **Evidence-based reasoning** - Every recommendation includes detailed analysis

### 🚨 Manipulation Detection
- Urgency/scarcity pressure ("Limited time", "Only 3 left")
- Fake exclusivity claims ("One-time offer", "Members only")
- Impulse purchase triggers ("Buy now", "Flash sale")
- Price manipulation tactics (Fake discounts, inflated original prices)
- **Verified with web search** - Claims are cross-checked using Tavily

### 💰 Alternative Discovery
- Used/pre-owned options
- Refurbished/renewed products
- Generic/off-brand alternatives
- Filters out search pages - only direct product links
- Calculates exact savings amounts

### 📉 Price Drop Analysis
- Product lifecycle analysis (new versions coming?)
- Seasonal trend detection (holiday sales, clearance periods)
- Competition analysis (price wars, market pressure)
- Technology lifecycle patterns (electronics discount cycles)
- Specific recommendations with timeframes and expected discounts

### ⚡ Performance
- **Async job processing** - No 504 timeouts on long analyses
- **Memory cache** - Instant results for repeated requests
- **LangCache integration** - Semantic caching for similar products
- **Optimized API calls** - Cached Tavily searches and claim verifications

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Reclaim AI Agent                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐    ┌──────────────┐   ┌──────────┐  │
│  │   Tavily     │    │  LangCache   │   │  Redis   │  │
│  │  Web Crawl   │───▶│   Semantic   │──▶│  State   │  │
│  │   & Search   │    │    Cache     │   │   Mgr    │  │
│  └──────────────┘    └──────────────┘   └──────────┘  │
│         │                    │                 │         │
│         └────────────────────┴─────────────────┘         │
│                           │                               │
│                           ▼                               │
│              ┌─────────────────────────┐                 │
│              │  Product Analysis       │                 │
│              │  • Manipulation Detect  │                 │
│              │  • Alternative Search   │                 │
│              │  • Price Drop Analysis  │                 │
│              │  • Score Calculation    │                 │
│              └─────────────────────────┘                 │
│                           │                               │
│                           ▼                               │
│              ┌─────────────────────────┐                 │
│              │  Recommendation Engine  │                 │
│              │  • Precise Scoring      │                 │
│              │  • Detailed Reasoning   │                 │
│              │  • Buy/Wait/Avoid       │                 │
│              └─────────────────────────┘                 │
└───────────────────────────────────────────────────────────┘
```

### Components

- **`ReclaimAgent`** - Core analysis engine with Tavily, LangCache, and Redis integration
- **`ReclaimTool`** - Standalone API wrapper for direct code integration
- **MCP Server** - Model Context Protocol compatible HTTP server
- **Express Server** - REST API endpoints
- **In-Memory Cache** - Fast lookup for exact URL matches

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.9.0 or higher
- **Redis** (optional, for state management)
- **Tavily API Key** - [Get one here](https://tavily.com)
- **Redis LangCache** (optional, for semantic caching) - [Get one here](https://redis.io/docs/latest/develop/ai/langcache/)

### Installation

```bash
# Clone the repository
git clone https://github.com/srirammura/Reclaim-AI.git
cd Reclaim-AI

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local and add your API keys
# TAVILY_API_KEY=your_tavily_key
# REDIS_LANGCACHE_HOST=your_langcache_host
# REDIS_LANGCACHE_API_KEY=your_langcache_key
# REDIS_LANGCACHE_ID=your_cache_id
```

### Running Locally

```bash
# Start the MCP server (default)
npm run mcp:start

# Or start the development server
npm run mcp:dev

# Server runs on http://localhost:3000
```

---

## 📚 Usage

### Python Example (Recommended)

```python
import requests
import json
import time

BASE_URL = "https://reclaim-ai-1.onrender.com"

# Step 1: Submit analysis (returns immediately)
response = requests.post(
    f"{BASE_URL}/mcp/tools/call",
    json={
        "name": "analyze_product",
        "arguments": {
            "url": "https://www.amazon.com/dp/B08N5WRWNW"
        }
    }
)

# Get job ID
data = response.json()
job_info = json.loads(data["content"][0]["text"])
job_id = job_info["jobId"]

# Step 2: Poll for results
while True:
    status = requests.get(f"{BASE_URL}/api/job/{job_id}").json()
    
    if status["status"] == "completed":
        analysis = status["result"]
        print(f"Score: {analysis['recommendation']['score']}/100")
        print(f"Verdict: {analysis['recommendation']['verdict']}")
        print(f"Reasoning: {analysis['recommendation']['detailedReasoning']}")
        break
    elif status["status"] == "failed":
        print(f"Error: {status['error']}")
        break
    
    time.sleep(5)  # Poll every 5 seconds
```

See [`examples/async_analysis.py`](examples/async_analysis.py) for a complete example.

### JavaScript/Node.js Example

```javascript
// Using the ReclaimTool directly
import { ReclaimTool } from './lib/reclaim-tool';

const tool = new ReclaimTool();

const analysis = await tool.analyzeProduct(
  'https://www.amazon.com/dp/B08N5WRWNW',
  'user123'
);

console.log(`Score: ${analysis.recommendation.score}/100`);
console.log(`Verdict: ${analysis.recommendation.verdict}`);
console.log(analysis.recommendation.detailedReasoning);
```

### cURL Example

```bash
# Submit analysis job
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW"
    }
  }'

# Check job status (replace {jobId} with actual job ID)
curl https://reclaim-ai-1.onrender.com/api/job/{jobId}
```

---

## 🔌 API Reference

### MCP Protocol Endpoints

#### Health Check
```bash
GET /health
```

#### List Available Tools
```bash
GET /mcp/tools
```

#### Call Tool (Analyze Product)
```bash
POST /mcp/tools/call
Content-Type: application/json

{
  "name": "analyze_product",
  "arguments": {
    "url": "https://www.amazon.com/dp/B08N5WRWNW",
    "userId": "optional_user_id",
    "async": true  // Default: true (recommended)
  }
}
```

#### Check Job Status
```bash
GET /api/job/{jobId}
```

### REST API Endpoints

#### Analyze Product (Async)
```bash
POST /api/tool
Content-Type: application/json

{
  "action": "analyze",
  "url": "https://www.amazon.com/dp/B08N5WRWNW",
  "userId": "optional_user_id",
  "async": true  // Default: true
}
```

For complete API documentation, see [`MCP_API.md`](MCP_API.md) and [`HOW_TO_USE.md`](HOW_TO_USE.md).

---

## 📊 Response Format

### Analysis Result

```json
{
  "url": "https://www.amazon.com/dp/B08N5WRWNW",
  "title": "iPhone 15 Pro",
  "price": 999,
  "currency": "USD",
  "manipulationSignals": [
    "Urgency/scarcity pressure",
    "Fake exclusivity claims"
  ],
  "manipulationClaims": [
    {
      "type": "Urgency/scarcity pressure",
      "claim": "limited time",
      "verified": false,
      "verificationEvidence": "This type of claim is commonly used in marketing..."
    }
  ],
  "alternatives": [
    {
      "type": "used",
      "description": "iPhone 15 Pro - Used - Excellent Condition",
      "url": "https://www.ebay.com/itm/123456789",
      "price": 750,
      "savings": 249
    }
  ],
  "recommendation": {
    "score": 47.3,
    "verdict": "find-alternative",
    "detailedReasoning": "📊 SCORE BREAKDOWN: 47.3/100\n..."
  },
  "metadata": {
    "cached": false,
    "tavilyUsed": true,
    "redisStored": false
  }
}
```

---

## 🎯 Scoring System

### Score Ranges

- **0-29**: ❌ **Avoid** - Multiple red flags detected
- **30-49**: ⚠️ **Find Alternative** - Better options available
- **50-74**: 🤔 **Wait** - Some concerns, consider waiting
- **75-84**: ✅ **Buy** - Good purchase, no major concerns
- **85-100**: ✅ **Strong Buy** - Excellent purchase

### Scoring Factors

**Positive Indicators (+ points):**
- No manipulation detected: +5.0
- No cheaper alternatives: +3.5
- Within budget: +4.0
- Low price drop likelihood: +0 (no deduction)

**Negative Indicators (- points):**
- Marketing claims detected: -14.5 to -18.0 per claim (based on severity)
- Verified false claims: Additional -3.2 per claim
- Cheaper alternatives: -9.5 to -13.0 per alternative (based on savings)
- Over budget: -18.5 to -23.0 (scales with overage percentage)
- Price drop likelihood: -12.5 (high) to -6.3 (medium)

**Starting Score**: 75.0 (assumes reasonable unless proven otherwise)

---

## 🚀 Deployment

### Production URL
**https://reclaim-ai-1.onrender.com**

### Deploy to Render

1. Fork or connect this repository to Render
2. Create a new Web Service
3. Set environment variables:
   - `TAVILY_API_KEY`
   - `REDIS_LANGCACHE_HOST`
   - `REDIS_LANGCACHE_API_KEY`
   - `REDIS_LANGCACHE_ID`
   - `PORT=3000`
   - `NODE_ENV=production`
4. Set build command: `npm install`
5. Set start command: `npm run mcp:start`

See [`PRODUCTION_DEPLOYMENT.md`](PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

---

## 🏗️ Project Structure

```
reclaim-ai/
├── lib/
│   ├── reclaim-agent.ts      # Core analysis engine
│   ├── reclaim-tool.ts        # Standalone API wrapper
│   └── copilot-actions.ts     # CopilotKit integration
├── app/                       # Next.js app (optional UI)
├── components/                # React components
├── examples/                  # Usage examples
│   ├── async_analysis.py     # Full Python example
│   └── simple_async_example.py
├── mcp-server-http.ts         # HTTP MCP server
├── server.ts                  # Express REST API server
├── test_mcp.py               # Python test script
├── package.json
└── README.md                  # This file
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
TAVILY_API_KEY=your_tavily_api_key

# Optional - Redis LangCache (for semantic caching)
REDIS_LANGCACHE_HOST=your_langcache_host
REDIS_LANGCACHE_API_KEY=your_langcache_api_key
REDIS_LANGCACHE_ID=your_cache_id

# Optional - Standard Redis (for state management)
REDIS_URL=redis://...
# OR
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=production
```

---

## 📈 Performance

### Caching Strategy

1. **Memory Cache** (< 0.1s)
   - Exact URL matches
   - In-memory Map
   - 1-hour TTL

2. **LangCache** (~1-2s)
   - Semantic similarity (0.85 threshold)
   - Similar products/URLs
   - Persistent across restarts

3. **Fresh Analysis** (60-120s)
   - New products
   - Full Tavily crawling
   - Claim verification
   - Alternative search

### Typical Response Times

- **Cached (same URL)**: < 0.1 seconds ⚡
- **Cached (similar URL)**: 1-2 seconds 🚀
- **Fresh analysis**: 60-120 seconds (async job)

---

## 🧪 Testing

```bash
# Run Python test script
python3 test_mcp.py "https://www.amazon.com/dp/B08N5WRWNW"

# Or use the example scripts
python3 examples/async_analysis.py "https://www.amazon.com/dp/B08N5WRWNW"
```

---

## 📖 Examples

See the [`examples/`](examples/) directory for:
- [Complete async analysis](examples/async_analysis.py) - Full-featured Python example
- [Simple async example](examples/simple_async_example.py) - Minimal Python example
- [Basic usage](examples/basic-usage.ts) - TypeScript/Node.js example
- [With user preferences](examples/with-user-preferences.ts) - Personalized analysis

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run mcp:dev

# Build TypeScript
npm run agent:build

# Run tests
python3 test_mcp.py
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

## 🔗 Links

- **Production API**: https://reclaim-ai-1.onrender.com
- **GitHub Repository**: https://github.com/srirammura/Reclaim-AI
- **API Documentation**: [`MCP_API.md`](MCP_API.md)
- **Usage Guide**: [`HOW_TO_USE.md`](HOW_TO_USE.md)
- **Deployment Guide**: [`PRODUCTION_DEPLOYMENT.md`](PRODUCTION_DEPLOYMENT.md)

---

## 🙏 Acknowledgments

- **Tavily** - Web crawling and search
- **Redis LangCache** - Semantic caching
- **CopilotKit** - AI agent framework
- **Model Context Protocol** - Agent interoperability standard

---

## 📧 Contact

For questions or issues, please open an issue on [GitHub](https://github.com/srirammura/Reclaim-AI/issues).

---

**Made with ❤️ to help you make mindful purchasing decisions**
