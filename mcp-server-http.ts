#!/usr/bin/env node
/**
 * HTTP MCP Server for Reclaim AI Agent
 * Model Context Protocol compatible server over HTTP
 * Allows other tools to connect and call via HTTP endpoints
 */

import express from "express";
import cors from "cors";
import { ReclaimTool } from "./lib/reclaim-tool";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize tool
const tool = new ReclaimTool();

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "reclaim-ai-mcp-server",
    version: "1.0.0",
    protocol: "MCP over HTTP"
  });
});

// MCP-compatible endpoints

// List available tools (MCP tools/list)
app.get("/mcp/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "analyze_product",
        description: "Analyze a product URL for manipulation signals, alternatives, and provide mindful purchasing recommendations with detailed reasoning",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The product URL to analyze",
            },
            userId: {
              type: "string",
              description: "Optional user ID for personalization",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "get_product_metadata",
        description: "Get product metadata (title, price, description) from a URL",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The product URL",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "search_alternatives",
        description: "Search for cheaper or similar product alternatives",
        inputSchema: {
          type: "object",
          properties: {
            productName: {
              type: "string",
              description: "Name of the product to find alternatives for",
            },
            additionalTerms: {
              type: "string",
              description: "Additional search terms (e.g., 'used', 'cheaper')",
            },
          },
          required: ["productName"],
        },
      },
      {
        name: "get_user_preferences",
        description: "Get user preferences for personalized recommendations",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "User ID",
            },
          },
          required: ["userId"],
        },
      },
      {
        name: "set_user_preferences",
        description: "Set user preferences for personalized recommendations",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "User ID",
            },
            preferences: {
              type: "object",
              description: "User preferences object",
            },
          },
          required: ["userId", "preferences"],
        },
      },
      {
        name: "get_browsing_history",
        description: "Get user's browsing history",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "User ID",
            },
            limit: {
              type: "number",
              description: "Number of items to return",
            },
          },
          required: ["userId"],
        },
      },
      {
        name: "create_price_alert",
        description: "Create a price alert for a product",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "User ID",
            },
            productId: {
              type: "string",
              description: "Product ID",
            },
            threshold: {
              type: "number",
              description: "Price threshold",
            },
          },
          required: ["userId", "productId", "threshold"],
        },
      },
    ],
  });
});

// Call tool (MCP tools/call)
app.post("/mcp/tools/call", async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Tool name is required" });
    }

    let result: any;

    switch (name) {
      case "analyze_product":
        if (!args?.url) {
          return res.status(400).json({ error: "url is required" });
        }
        result = await tool.analyzeProduct(args.url, args.userId);
        break;

      case "get_product_metadata":
        if (!args?.url) {
          return res.status(400).json({ error: "url is required" });
        }
        result = await tool.getProductMetadata(args.url);
        break;

      case "search_alternatives":
        if (!args?.productName) {
          return res.status(400).json({ error: "productName is required" });
        }
        result = await tool.searchAlternatives(
          args.productName,
          args.additionalTerms
        );
        break;

      case "get_user_preferences":
        if (!args?.userId) {
          return res.status(400).json({ error: "userId is required" });
        }
        result = await tool.getUserPreferences(args.userId);
        break;

      case "set_user_preferences":
        if (!args?.userId || !args?.preferences) {
          return res.status(400).json({
            error: "userId and preferences are required",
          });
        }
        await tool.setUserPreferences(args.userId, args.preferences);
        result = { success: true };
        break;

      case "get_browsing_history":
        if (!args?.userId) {
          return res.status(400).json({ error: "userId is required" });
        }
        result = await tool.getBrowsingHistory(args.userId, args.limit);
        break;

      case "create_price_alert":
        if (!args?.userId || !args?.productId || !args?.threshold) {
          return res.status(400).json({
            error: "userId, productId, and threshold are required",
          });
        }
        await tool.createPriceAlert(
          args.userId,
          args.productId,
          args.threshold
        );
        result = { success: true };
        break;

      default:
        return res.status(400).json({ error: `Unknown tool: ${name}` });
    }

    // Return in MCP-compatible format
    res.json({
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    });
  } catch (error: any) {
    console.error("MCP tool call error:", error);
    res.status(500).json({
      error: {
        code: -32000,
        message: error.message || "Internal server error",
      },
    });
  }
});

// Legacy REST API endpoint (for backward compatibility)
app.post("/api/tool", async (req, res) => {
  try {
    const { action, ...params } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action is required" });
    }

    // Map legacy actions to MCP tools
    const actionToTool: Record<string, string> = {
      analyze: "analyze_product",
      metadata: "get_product_metadata",
      alternatives: "search_alternatives",
      get_preferences: "get_user_preferences",
      set_preferences: "set_user_preferences",
      history: "get_browsing_history",
      alert: "create_price_alert",
    };

    const toolName = actionToTool[action];
    if (!toolName) {
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    // Convert params to MCP args format
    const args: any = { ...params };
    if (action === "alternatives" && params.productName) {
      args.productName = params.productName;
      args.additionalTerms = params.additionalTerms;
    }

    // Call via MCP endpoint
    const result = await tool[action as keyof typeof tool](
      ...Object.values(args)
    );
    res.json(result);
  } catch (error: any) {
    console.error("Tool API error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Reclaim AI MCP Server running on port ${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  console.log(`🔧 MCP Tools: http://localhost:${port}/mcp/tools`);
  console.log(`🔧 MCP Call: POST http://localhost:${port}/mcp/tools/call`);
  console.log(`🔧 Legacy API: POST http://localhost:${port}/api/tool`);
});

