# 🚀 How to Use Reclaim AI MCP Server

## ✅ Your Server is Live!

**Production URL:** https://reclaim-ai-1.onrender.com

---

## 📡 Available Endpoints

### 1. Health Check
```bash
curl https://reclaim-ai-1.onrender.com/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "reclaim-ai-mcp-server",
  "version": "1.0.0",
  "protocol": "MCP over HTTP"
}
```

### 2. List Available Tools (MCP Protocol)
```bash
curl https://reclaim-ai-1.onrender.com/mcp/tools
```

**Response:**
```json
{
  "tools": [
    {
      "name": "analyze_product",
      "description": "Analyze a product URL for manipulation signals, alternatives, and provide mindful purchasing recommendations with detailed reasoning",
      ...
    },
    ...
  ]
}
```

### 3. Call MCP Tool (Main Endpoint)
```bash
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW"
    }
  }'
```

---

## 🎯 Main Use Case: Analyze Product

### Request
```bash
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW",
      "userId": "user123"
    }
  }'
```

### Response Structure
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"url\": \"https://www.amazon.com/dp/B08N5WRWNW\",\n  \"title\": \"iPhone 15 Pro\",\n  \"price\": 999,\n  \"manipulationSignals\": [...],\n  \"manipulationClaims\": [...],\n  \"recommendation\": {\n    \"score\": 35,\n    \"detailedReasoning\": \"📊 SCORE BREAKDOWN...\",\n    \"verdict\": \"find-alternative\"\n  },\n  \"alternatives\": [...]\n}"
    }
  ]
}
```

**Parse the response:**
```javascript
const response = await fetch('https://reclaim-ai-1.onrender.com/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'analyze_product',
    arguments: { url: 'https://www.amazon.com/dp/B08N5WRWNW' }
  })
});

const data = await response.json();
const analysis = JSON.parse(data.content[0].text);

console.log('Score:', analysis.recommendation.score);
console.log('Reasoning:', analysis.recommendation.detailedReasoning);
console.log('Verdict:', analysis.recommendation.verdict);
```

---

## 📋 Available Tools

### 1. `analyze_product` (Main Tool)
Analyze a product URL and get:
- Manipulation signals detected
- Marketing claims verification
- Detailed reasoning for score
- Recommendations
- Cheaper alternatives

**Example:**
```bash
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW"
    }
  }'
```

### 2. `get_product_metadata`
Get basic product info (title, price, description)

**Example:**
```bash
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_product_metadata",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW"
    }
  }'
```

### 3. `search_alternatives`
Find cheaper or similar alternatives

**Example:**
```bash
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search_alternatives",
    "arguments": {
      "productName": "iPhone 15 Pro",
      "additionalTerms": "used pre-owned cheaper"
    }
  }'
```

### 4. `get_user_preferences`
Get user preferences for personalization

### 5. `set_user_preferences`
Set user preferences

### 6. `get_browsing_history`
Get user's browsing history

### 7. `create_price_alert`
Create a price alert for a product

---

## 💻 Integration Examples

### JavaScript/TypeScript

```javascript
class ReclaimAIClient {
  constructor(baseUrl = 'https://reclaim-ai-1.onrender.com') {
    this.baseUrl = baseUrl;
  }

  async analyzeProduct(url, userId = null) {
    const response = await fetch(`${this.baseUrl}/mcp/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'analyze_product',
        arguments: { url, userId }
      })
    });

    const data = await response.json();
    return JSON.parse(data.content[0].text);
  }

  async searchAlternatives(productName, additionalTerms = '') {
    const response = await fetch(`${this.baseUrl}/mcp/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'search_alternatives',
        arguments: { productName, additionalTerms }
      })
    });

    const data = await response.json();
    return JSON.parse(data.content[0].text);
  }
}

// Usage
const client = new ReclaimAIClient();
const analysis = await client.analyzeProduct('https://www.amazon.com/dp/B08N5WRWNW');

console.log(`Score: ${analysis.recommendation.score}/100`);
console.log(`Verdict: ${analysis.recommendation.verdict}`);
console.log(`Reasoning: ${analysis.recommendation.detailedReasoning}`);
```

### Python

```python
import requests
import json

class ReclaimAIClient:
    def __init__(self, base_url='https://reclaim-ai-1.onrender.com'):
        self.base_url = base_url

    def analyze_product(self, url, user_id=None):
        response = requests.post(
            f'{self.base_url}/mcp/tools/call',
            json={
                'name': 'analyze_product',
                'arguments': {'url': url, 'userId': user_id}
            }
        )
        data = response.json()
        return json.loads(data['content'][0]['text'])

    def search_alternatives(self, product_name, additional_terms=''):
        response = requests.post(
            f'{self.base_url}/mcp/tools/call',
            json={
                'name': 'search_alternatives',
                'arguments': {
                    'productName': product_name,
                    'additionalTerms': additional_terms
                }
            }
        )
        data = response.json()
        return json.loads(data['content'][0]['text'])

# Usage
client = ReclaimAIClient()
analysis = client.analyze_product('https://www.amazon.com/dp/B08N5WRWNW')

print(f"Score: {analysis['recommendation']['score']}/100")
print(f"Verdict: {analysis['recommendation']['verdict']}")
print(f"Reasoning: {analysis['recommendation']['detailedReasoning']}")
```

### cURL (Command Line)

```bash
# Analyze a product
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW"
    }
  }' | jq -r '.content[0].text' | jq .

# Get alternatives
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search_alternatives",
    "arguments": {
      "productName": "iPhone 15 Pro",
      "additionalTerms": "used cheaper"
    }
  }' | jq -r '.content[0].text' | jq .
```

---

## 🔧 Legacy REST API (Backward Compatible)

For simpler integration, you can also use the legacy REST API:

```bash
curl -X POST https://reclaim-ai-1.onrender.com/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "url": "https://www.amazon.com/dp/B08N5WRWNW"
  }'
```

**Available actions:**
- `analyze` - Analyze product (same as `analyze_product`)
- `metadata` - Get product metadata
- `alternatives` - Search alternatives
- `get_preferences` - Get user preferences
- `set_preferences` - Set user preferences
- `history` - Get browsing history
- `alert` - Create price alert

---

## 📊 Response Format

### Success Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{ ... JSON string with analysis ... }"
    }
  ]
}
```

### Error Response
```json
{
  "error": {
    "code": -32000,
    "message": "Error message here"
  }
}
```

---

## 🎯 Quick Test

```bash
# 1. Test health
curl https://reclaim-ai-1.onrender.com/health

# 2. List tools
curl https://reclaim-ai-1.onrender.com/mcp/tools

# 3. Analyze a product
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW"
    }
  }'
```

---

## 🔗 Integration with Other Tools

### From a Web App
```javascript
// In your React/Vue/Angular app
const analyzeProduct = async (url) => {
  const response = await fetch('https://reclaim-ai-1.onrender.com/mcp/tools/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'analyze_product',
      arguments: { url }
    })
  });
  
  const data = await response.json();
  return JSON.parse(data.content[0].text);
};
```

### From a Browser Extension
```javascript
// Chrome/Firefox extension
chrome.runtime.sendMessage({
  action: 'analyzeProduct',
  url: productUrl
}, async (response) => {
  const analysis = await fetch('https://reclaim-ai-1.onrender.com/mcp/tools/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'analyze_product',
      arguments: { url: productUrl }
    })
  }).then(r => r.json()).then(d => JSON.parse(d.content[0].text));
  
  // Display analysis to user
});
```

### From a CLI Tool
```bash
#!/bin/bash
# reclaim-analyze.sh

URL=$1

RESPONSE=$(curl -s -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"analyze_product\",
    \"arguments\": {
      \"url\": \"$URL\"
    }
  }")

echo "$RESPONSE" | jq -r '.content[0].text' | jq .
```

---

## 📚 Full Documentation

For complete API documentation, see:
- **MCP API Docs:** [MCP_API.md](./MCP_API.md)
- **Production Deployment:** [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

---

## ✅ Your Server is Ready!

**Production URL:** https://reclaim-ai-1.onrender.com

Start analyzing products and getting mindful purchasing recommendations! 🎉

