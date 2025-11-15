/**
 * Standalone Tool API Route
 * REST API for using Reclaim Agent as a tool (no CopilotKit needed)
 */

import { NextRequest, NextResponse } from "next/server";
import { ReclaimTool } from "@/lib/reclaim-tool";

const tool = new ReclaimTool();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "analyze":
        if (!params.url) {
          return NextResponse.json(
            { error: "URL is required" },
            { status: 400 }
          );
        }
        const analysis = await tool.analyzeProduct(params.url, params.userId);
        return NextResponse.json(analysis);

      case "metadata":
        if (!params.url) {
          return NextResponse.json(
            { error: "URL is required" },
            { status: 400 }
          );
        }
        const metadata = await tool.getProductMetadata(params.url);
        return NextResponse.json(metadata);

      case "alternatives":
        if (!params.productName) {
          return NextResponse.json(
            { error: "productName is required" },
            { status: 400 }
          );
        }
        const alternatives = await tool.searchAlternatives(
          params.productName,
          params.additionalTerms
        );
        return NextResponse.json(alternatives);

      case "get_preferences":
        if (!params.userId) {
          return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
          );
        }
        const prefs = await tool.getUserPreferences(params.userId);
        return NextResponse.json(prefs);

      case "set_preferences":
        if (!params.userId || !params.preferences) {
          return NextResponse.json(
            { error: "userId and preferences are required" },
            { status: 400 }
          );
        }
        await tool.setUserPreferences(params.userId, params.preferences);
        return NextResponse.json({ success: true });

      case "history":
        if (!params.userId) {
          return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
          );
        }
        const history = await tool.getBrowsingHistory(
          params.userId,
          params.limit || 10
        );
        return NextResponse.json(history);

      case "alert":
        if (!params.userId || !params.productId || !params.threshold) {
          return NextResponse.json(
            { error: "userId, productId, and threshold are required" },
            { status: 400 }
          );
        }
        await tool.createPriceAlert(
          params.userId,
          params.productId,
          params.threshold
        );
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Tool API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

