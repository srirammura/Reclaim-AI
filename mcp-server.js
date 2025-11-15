#!/usr/bin/env node
/**
 * MCP Server for Reclaim AI Agent
 * Model Context Protocol compatible server
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { ReclaimTool } from "./lib/reclaim-tool.js";
const server = new Server({
    name: "reclaim-ai-agent",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
const reclaimTool = new ReclaimTool();
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "analyze_product",
                description: "Analyze a product URL for manipulation signals, alternatives, and provide mindful purchasing recommendations",
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
                            description: "Additional search terms (e.g., 'used', 'refurbished', 'cheaper')",
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
                description: "Set user preferences (budget, values, categories)",
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
                            default: 10,
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
                            description: "Product ID or URL",
                        },
                        threshold: {
                            type: "number",
                            description: "Price threshold to alert at",
                        },
                    },
                    required: ["userId", "productId", "threshold"],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "analyze_product":
                const analysis = await reclaimTool.analyzeProduct(args.url, args.userId);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(analysis, null, 2),
                        },
                    ],
                };
            case "get_product_metadata":
                const metadata = await reclaimTool.getProductMetadata(args.url);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(metadata, null, 2),
                        },
                    ],
                };
            case "search_alternatives":
                const alternatives = await reclaimTool.searchAlternatives(args.productName, args.additionalTerms);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(alternatives, null, 2),
                        },
                    ],
                };
            case "get_user_preferences":
                const prefs = await reclaimTool.getUserPreferences(args.userId);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(prefs, null, 2),
                        },
                    ],
                };
            case "set_user_preferences":
                await reclaimTool.setUserPreferences(args.userId, args.preferences);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ success: true }),
                        },
                    ],
                };
            case "get_browsing_history":
                const history = await reclaimTool.getBrowsingHistory(args.userId, args.limit || 10);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(history, null, 2),
                        },
                    ],
                };
            case "create_price_alert":
                await reclaimTool.createPriceAlert(args.userId, args.productId, args.threshold);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ success: true }),
                        },
                    ],
                };
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Reclaim AI MCP server running on stdio");
}
main().catch(console.error);
//# sourceMappingURL=mcp-server.js.map