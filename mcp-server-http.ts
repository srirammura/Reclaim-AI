#!/usr/bin/env node
/**
 * HTTP MCP Server for Reclaim AI Agent
 * Model Context Protocol compatible server over HTTP
 * Supports async processing to avoid timeouts
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

// In-memory job queue (for production use Redis)
interface Job {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: number;
  result?: any;
  error?: string;
}

const jobs = new Map<string, Job>();

// Cleanup old jobs (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt < oneHourAgo) {
      jobs.delete(id);
    }
  }
}, 60 * 1000);

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "reclaim-ai-mcp-server",
    version: "1.0.0",
    protocol: "MCP over HTTP",
    jobs: {
      pending: Array.from(jobs.values()).filter(j => j.status === "pending").length,
      processing: Array.from(jobs.values()).filter(j => j.status === "processing").length,
      completed: Array.from(jobs.values()).filter(j => j.status === "completed").length,
    }
  });
});

// Job status endpoint
app.get("/api/job/:jobId", (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status === "completed") {
      return res.json({
        jobId,
        status: "completed",
        result: job.result,
        completedAt: Date.now(),
      });
    }

    if (job.status === "failed") {
      return res.json({
        jobId,
        status: "failed",
        error: job.error,
        failedAt: Date.now(),
      });
    }

    const elapsed = Date.now() - job.createdAt;
    return res.json({
      jobId,
      status: job.status,
      elapsedSeconds: Math.floor(elapsed / 1000),
      message: job.status === "pending" 
        ? "Waiting to start..." 
        : "Processing analysis (may take 60-120 seconds)...",
    });
  } catch (error: any) {
    console.error("Error checking job:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
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
            async: {
              type: "boolean",
              description: "If true (default), returns job ID immediately and processes in background (recommended to avoid timeouts)",
              default: true,
            },
          },
          required: ["url"],
        },
      },
      {
        name: "get_job_status",
        description: "Check the status of an async analysis job",
        inputSchema: {
          type: "object",
          properties: {
            jobId: {
              type: "string",
              description: "The job ID returned from analyze_product",
            },
          },
          required: ["jobId"],
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

// Call tool (MCP tools/call) - with async support for analyze_product
app.post("/mcp/tools/call", async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Tool name is required" });
    }

    // Handle async analyze_product (default behavior to avoid timeouts)
    if (name === "analyze_product") {
      // Default to async unless explicitly set to false
      const useAsync = args?.async !== false;
      
      if (useAsync) {
        const jobId = generateJobId();
        const job: Job = {
          id: jobId,
          status: "pending",
          createdAt: Date.now(),
        };

        jobs.set(jobId, job);

        // Process in background (don't await)
        (async () => {
          try {
            job.status = "processing";
            console.log(`[Job ${jobId}] Starting MCP analysis for ${args.url}`);
            
            const analysis = await tool.analyzeProduct(args.url, args.userId);
            
            job.status = "completed";
            job.result = analysis;
            console.log(`[Job ${jobId}] MCP analysis completed`);
          } catch (error: any) {
            job.status = "failed";
            job.error = error.message || "Analysis failed";
            console.error(`[Job ${jobId}] MCP analysis failed:`, error);
          }
        })();

        // Return job ID immediately in MCP format
        return res.json({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                jobId,
                status: "pending",
                message: "Analysis started. Use get_job_status tool or GET /api/job/{jobId} to check progress.",
                checkUrl: `/api/job/${jobId}`,
                estimatedTime: "60-120 seconds",
              }, null, 2),
            },
          ],
        });
      } else {
        // Synchronous (may timeout on Render - not recommended)
        try {
          const analysis = await tool.analyzeProduct(args.url, args.userId);
          return res.json({
            content: [
              {
                type: "text",
                text: JSON.stringify(analysis, null, 2),
              },
            ],
          });
        } catch (error: any) {
          return res.status(500).json({
            error: {
              code: -32000,
              message: error.message || "Analysis failed",
            },
          });
        }
      }
    }

    // Handle get_job_status
    if (name === "get_job_status") {
      const { jobId } = args || {};
      if (!jobId) {
        return res.status(400).json({
          error: {
            code: -32602,
            message: "jobId is required",
          },
        });
      }

      const job = jobs.get(jobId);
      if (!job) {
        return res.json({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "not_found",
                error: "Job not found",
              }, null, 2),
            },
          ],
        });
      }

      if (job.status === "completed") {
        return res.json({
          content: [
            {
              type: "text",
              text: JSON.stringify(job.result, null, 2),
            },
          ],
        });
      }

      if (job.status === "failed") {
        return res.json({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "failed",
                error: job.error,
              }, null, 2),
            },
          ],
          isError: true,
        });
      }

      const elapsed = Date.now() - job.createdAt;
      return res.json({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: job.status,
              elapsedSeconds: Math.floor(elapsed / 1000),
              message: job.status === "pending"
                ? "Waiting to start..."
                : "Processing analysis...",
            }, null, 2),
          },
        ],
      });
    }

    // Handle other tools synchronously (they're fast)
    let result: any;

    switch (name) {
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

// Legacy REST API endpoint (with async support)
app.post("/api/tool", async (req, res) => {
  try {
    const { action, async: useAsync, ...params } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action is required" });
    }

    if (action === "analyze") {
      if (!params.url) {
        return res.status(400).json({ error: "url is required" });
      }
      
      // Use async by default to avoid timeouts
      if (useAsync !== false) {
        const jobId = generateJobId();
        const job: Job = {
          id: jobId,
          status: "pending",
          createdAt: Date.now(),
        };

        jobs.set(jobId, job);

        // Process in background
        (async () => {
          try {
            job.status = "processing";
            const analysis = await tool.analyzeProduct(params.url, params.userId);
            job.status = "completed";
            job.result = analysis;
          } catch (error: any) {
            job.status = "failed";
            job.error = error.message || "Analysis failed";
          }
        })();

        return res.json({
          jobId,
          status: "pending",
          message: "Analysis started. Check status at /api/job/" + jobId,
          checkUrl: `/api/job/${jobId}`,
        });
      } else {
        // Synchronous (may timeout)
        const analysis = await tool.analyzeProduct(params.url, params.userId);
        return res.json(analysis);
      }
    }

    // Map other actions to tools
    const actionToTool: Record<string, string> = {
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

    // Handle other actions synchronously
    let result: any;
    switch (action) {
      case "metadata":
        result = await tool.getProductMetadata(params.url);
        break;
      case "alternatives":
        result = await tool.searchAlternatives(params.productName, params.additionalTerms);
        break;
      case "get_preferences":
        result = await tool.getUserPreferences(params.userId);
        break;
      case "set_preferences":
        await tool.setUserPreferences(params.userId, params.preferences);
        result = { success: true };
        break;
      case "history":
        result = await tool.getBrowsingHistory(params.userId, params.limit);
        break;
      case "alert":
        await tool.createPriceAlert(params.userId, params.productId, params.threshold);
        result = { success: true };
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.json(result);
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
  console.log(`🔧 Job Status: GET http://localhost:${port}/api/job/:jobId`);
  console.log(`🔧 Legacy API: POST http://localhost:${port}/api/tool`);
});

