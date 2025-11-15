# MCP API Documentation

Model Context Protocol (MCP) API for Reclaim AI Agent.

## Overview

The Reclaim AI Agent exposes its functionality via MCP (Model Context Protocol), allowing integration with MCP-compatible clients and AI systems.

## Server Setup

### Starting the MCP Server

```bash
npm run mcp:server
```

Or directly:
```bash
node --loader ts-node/esm mcp-server.ts
```

## Available Tools

### 1. analyze_product

Analyze a product URL for manipulation signals, alternatives, and recommendations.

#### Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW",
      "userId": "user123"
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"url\": \"https://www.amazon.com/dp/B08N5WRWNW\",\n  \"title\": \"iPhone 15 Pro\",\n  \"price\": 999,\n  \"currency\": \"USD\",\n  \"manipulationSignals\": [\n    \"Urgency/scarcity pressure\",\n    \"Fake exclusivity claims\"\n  ],\n  \"manipulationClaims\": [\n    {\n      \"type\": \"Urgency/scarcity pressure\",\n      \"claim\": \"limited time\",\n      \"foundText\": \"limited time\",\n      \"verified\": false,\n      \"verificationEvidence\": \"This type of claim is commonly used in marketing and may not reflect actual scarcity or exclusivity.\"\n    }\n  ],\n  \"alternatives\": [\n    {\n      \"type\": \"used\",\n      \"description\": \"iPhone 15 Pro - Used - Excellent Condition\",\n      \"url\": \"https://www.ebay.com/itm/123456789\",\n      \"price\": 750,\n      \"savings\": 249\n    }\n  ],\n  \"recommendation\": {\n    \"score\": 35,\n    \"reasoning\": \"⚠️ CONSIDER ALTERNATIVES\",\n    \"detailedReasoning\": \"📊 SCORE BREAKDOWN: 35/100\\n-30 points: 2 marketing claim(s) detected\\n-20 points: 1 cheaper alternative(s) available\\n\\n🚨 MARKETING CLAIMS DETECTED (30 points deducted):\\n  • \\\"limited time\\\" - Urgency/scarcity pressure\\n    ❌ VERIFICATION: This type of claim is commonly used in marketing...\",\n    \"verdict\": \"find-alternative\"\n  },\n  \"metadata\": {\n    \"crawledAt\": 1704067200000,\n    \"tavilyUsed\": true,\n    \"redisStored\": false\n  }\n}"
    }
  ]
}
```

---

### 2. get_product_metadata

Get product metadata (title, price, description) from a URL.

#### Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_product_metadata",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW"
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"url\": \"https://www.amazon.com/dp/B08N5WRWNW\",\n  \"title\": \"iPhone 15 Pro\",\n  \"content\": \"Apple iPhone 15 Pro with 256GB storage. Features A17 Pro chip, titanium design, and advanced camera system...\"\n}"
    }
  ]
}
```

---

### 3. search_alternatives

Search for cheaper or similar product alternatives.

#### Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_alternatives",
    "arguments": {
      "productName": "iPhone 15 Pro",
      "additionalTerms": "used pre-owned cheaper"
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true,\n  \"results\": [\n    {\n      \"title\": \"iPhone 15 Pro - Used - Excellent Condition\",\n      \"url\": \"https://www.ebay.com/itm/123456789\",\n      \"content\": \"Apple iPhone 15 Pro 256GB used in excellent condition...\"\n    },\n    {\n      \"title\": \"iPhone 15 Pro - Refurbished - Like New\",\n      \"url\": \"https://www.amazon.com/dp/B08N5WRWNW/refurbished\",\n      \"content\": \"Certified refurbished iPhone 15 Pro with warranty...\"\n    }\n  ],\n  \"query\": \"iPhone 15 Pro used pre-owned cheaper\",\n  \"cached\": false\n}"
    }
  ]
}
```

---

### 4. get_user_preferences

Get user preferences for personalized recommendations.

#### Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_user_preferences",
    "arguments": {
      "userId": "user123"
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"budgetRange\": {\n    \"min\": 0,\n    \"max\": 500\n  },\n  \"values\": [\"sustainability\", \"value\"],\n  \"categories\": [\"electronics\"]\n}"
    }
  ]
}
```

---

### 5. set_user_preferences

Set user preferences (budget, values, categories).

#### Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "set_user_preferences",
    "arguments": {
      "userId": "user123",
      "preferences": {
        "budgetRange": {
          "min": 0,
          "max": 500
        },
        "values": ["sustainability", "value"],
        "categories": ["electronics"]
      }
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true\n}"
    }
  ]
}
```

---

### 6. get_browsing_history

Get user's browsing history.

#### Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_browsing_history",
    "arguments": {
      "userId": "user123",
      "limit": 10
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "[\n  {\n    \"url\": \"https://www.amazon.com/dp/B08N5WRWNW\",\n    \"title\": \"iPhone 15 Pro\",\n    \"price\": 999,\n    \"recommendation\": {\n      \"score\": 35,\n      \"verdict\": \"find-alternative\"\n    },\n    \"analyzedAt\": 1704067200000\n  }\n]"
    }
  ]
}
```

---

### 7. create_price_alert

Create a price alert for a product.

#### Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_price_alert",
    "arguments": {
      "userId": "user123",
      "productId": "B08N5WRWNW",
      "threshold": 800
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true\n}"
    }
  ]
}
```

---

## Complete MCP Client Example

### Node.js Client

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  // Create MCP client
  const client = new Client(
    {
      name: "reclaim-ai-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  // Connect to MCP server
  const transport = new StdioClientTransport({
    command: "node",
    args: ["--loader", "ts-node/esm", "./mcp-server.ts"],
  });

  await client.connect(transport);

  // List available tools
  const tools = await client.listTools();
  console.log("Available tools:", tools.tools.map((t) => t.name));

  // Call analyze_product tool
  const result = await client.callTool({
    name: "analyze_product",
    arguments: {
      url: "https://www.amazon.com/dp/B08N5WRWNW",
      userId: "user123",
    },
  });

  console.log("Analysis result:", JSON.parse(result.content[0].text));
}

main().catch(console.error);
```

### Python Client

```python
import json
import subprocess
from mcp import ClientSession, StdioServerParameters

async def main():
    # Start MCP server
    server_params = StdioServerParameters(
        command="node",
        args=["--loader", "ts-node/esm", "./mcp-server.ts"]
    )
    
    async with ClientSession(server_params) as session:
        # List tools
        tools = await session.list_tools()
        print("Available tools:", [t.name for t in tools.tools])
        
        # Call analyze_product
        result = await session.call_tool(
            name="analyze_product",
            arguments={
                "url": "https://www.amazon.com/dp/B08N5WRWNW",
                "userId": "user123"
            }
        )
        
        data = json.loads(result.content[0].text)
        print("Analysis:", data)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## Error Responses

### Tool Not Found
```json
{
  "error": {
    "code": -32601,
    "message": "Method not found: unknown_tool"
  }
}
```

### Invalid Arguments
```json
{
  "error": {
    "code": -32602,
    "message": "Invalid params: url is required"
  }
}
```

### Internal Error
```json
{
  "error": {
    "code": -32603,
    "message": "Internal error: Failed to crawl URL"
  }
}
```

---

## List Tools

Get list of all available tools:

#### Request
```json
{
  "method": "tools/list",
  "params": {}
}
```

#### Response
```json
{
  "tools": [
    {
      "name": "analyze_product",
      "description": "Analyze a product URL for manipulation signals, alternatives, and provide mindful purchasing recommendations",
      "inputSchema": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "description": "The product URL to analyze"
          },
          "userId": {
            "type": "string",
            "description": "Optional user ID for personalization"
          }
        },
        "required": ["url"]
      }
    },
    {
      "name": "get_product_metadata",
      "description": "Get product metadata (title, price, description) from a URL",
      "inputSchema": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "description": "The product URL"
          }
        },
        "required": ["url"]
      }
    }
    // ... more tools
  ]
}
```

---

## Environment Variables

Set these environment variables before starting the MCP server:

```env
TAVILY_API_KEY=your_tavily_api_key
REDIS_LANGCACHE_HOST=your_langcache_host (optional)
REDIS_LANGCACHE_API_KEY=your_langcache_api_key (optional)
REDIS_LANGCACHE_ID=your_langcache_id (optional)
```

---

## Testing

Test the MCP server using the MCP client example:

```bash
npm run example:mcp
```

Or use the MCP inspector:
```bash
npx @modelcontextprotocol/inspector node --loader ts-node/esm mcp-server.ts
```

