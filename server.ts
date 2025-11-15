#!/usr/bin/env node
/**
 * Standalone Production Server for Reclaim AI Agent
 * Minimal server exposing only the agent functionality
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
  res.json({ status: "ok", service: "reclaim-ai-agent" });
});

// Tool API endpoint
app.post("/api/tool", async (req, res) => {
  try {
    const { action, ...params } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action is required" });
    }

    switch (action) {
      case "analyze":
        if (!params.url) {
          return res.status(400).json({ error: "url is required" });
        }
        const analysis = await tool.analyzeProduct(params.url, params.userId);
        return res.json(analysis);

      case "metadata":
        if (!params.url) {
          return res.status(400).json({ error: "url is required" });
        }
        const metadata = await tool.getProductMetadata(params.url);
        return res.json(metadata);

      case "alternatives":
        if (!params.productName) {
          return res.status(400).json({ error: "productName is required" });
        }
        const alternatives = await tool.searchAlternatives(
          params.productName,
          params.additionalTerms
        );
        return res.json(alternatives);

      case "get_preferences":
        if (!params.userId) {
          return res.status(400).json({ error: "userId is required" });
        }
        const prefs = await tool.getUserPreferences(params.userId);
        return res.json(prefs);

      case "set_preferences":
        if (!params.userId || !params.preferences) {
          return res.status(400).json({ error: "userId and preferences are required" });
        }
        await tool.setUserPreferences(params.userId, params.preferences);
        return res.json({ success: true });

      case "history":
        if (!params.userId) {
          return res.status(400).json({ error: "userId is required" });
        }
        const history = await tool.getBrowsingHistory(params.userId, params.limit || 10);
        return res.json(history);

      case "alert":
        if (!params.userId || !params.productId || !params.threshold) {
          return res.status(400).json({ error: "userId, productId, and threshold are required" });
        }
        await tool.createPriceAlert(params.userId, params.productId, params.threshold);
        return res.json({ success: true });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error: any) {
    console.error("Tool API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Reclaim AI Agent server running on port ${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  console.log(`🔧 Tool API: http://localhost:${port}/api/tool`);
});

