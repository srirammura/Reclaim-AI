/**
 * MCP Client Example
 * Shows how to use Reclaim AI Agent via MCP protocol
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function mcpClientExample() {
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
    args: ["./mcp-server.ts"],
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

  console.log("\n=== Analysis Result ===");
  console.log(result.content?.[0]?.text);

  // Call search_alternatives tool
  const alternatives = await client.callTool({
    name: "search_alternatives",
    arguments: {
      productName: "iPhone 15 Pro",
      additionalTerms: "used cheaper",
    },
  });

  console.log("\n=== Alternatives ===");
  console.log(alternatives.content?.[0]?.text);
}

mcpClientExample().catch(console.error);

