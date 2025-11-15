import { NextRequest, NextResponse } from "next/server";
import { ReclaimAgent } from "@/lib/reclaim-agent";

const agent = new ReclaimAgent();

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Analyze the product
    const analysis = await agent.analyzeProduct(url);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing product:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze product",
      },
      { status: 500 }
    );
  }
}

