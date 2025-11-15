#!/usr/bin/env node
/**
 * Standalone Production Server for Reclaim AI Agent
 * Minimal server exposing only the agent functionality
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

// Tool API endpoint (with async support for analyze)
app.post("/api/tool", async (req, res) => {
  try {
    const { action, async: useAsync, ...params } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action is required" });
    }

    switch (action) {
      case "analyze":
        if (!params.url) {
          return res.status(400).json({ error: "url is required" });
        }
        
        // Use async processing by default to avoid timeouts
        if (useAsync !== false) {
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
              console.log(`[Job ${jobId}] Starting analysis for ${params.url}`);
              
              const analysis = await tool.analyzeProduct(params.url, params.userId);
              
              job.status = "completed";
              job.result = analysis;
              console.log(`[Job ${jobId}] Analysis completed`);
            } catch (error: any) {
              job.status = "failed";
              job.error = error.message || "Analysis failed";
              console.error(`[Job ${jobId}] Analysis failed:`, error);
            }
          })();

          // Return job ID immediately
          return res.json({
            jobId,
            status: "pending",
            message: "Analysis started. Use /api/job/" + jobId + " to check status.",
            checkUrl: `/api/job/${jobId}`,
            estimatedTime: "60-120 seconds",
          });
        } else {
          // Synchronous (may timeout on long analyses)
          const analysis = await tool.analyzeProduct(params.url, params.userId);
          return res.json(analysis);
        }

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

