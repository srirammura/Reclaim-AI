import { NextRequest, NextResponse } from "next/server";
import { copilotKitActions } from "@/lib/copilot-actions";

// CopilotKit runtime endpoint
// Actions are automatically exposed through CopilotKit provider
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "CopilotKit runtime endpoint",
    actions: Object.keys(copilotKitActions),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, args } = body;

    if (!action || !copilotKitActions[action as keyof typeof copilotKitActions]) {
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
    }

    const handler = copilotKitActions[action as keyof typeof copilotKitActions];
    const result = await handler(args);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("CopilotKit action error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
