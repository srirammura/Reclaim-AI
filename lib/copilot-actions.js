/**
 * CopilotKit Actions for Reclaim AI
 * These actions are exposed to the CopilotKit runtime
 */
import { ReclaimAgent } from "./reclaim-agent";
// Initialize singleton agent
const agent = new ReclaimAgent();
// Export actions for CopilotKit
export const copilotKitActions = {
    // Main workflow: analyze product
    analyzeProduct: async (args) => {
        return await agent.analyzeProduct(args.url, args.userId);
    },
    // Web crawling with Tavily
    crawlWithTavily: async (args) => {
        return await agent.crawlWithTavily(args.url);
    },
    // Search for alternatives
    searchAlternatives: async (args) => {
        return await agent.searchAlternatives(args.productName, args.query);
    },
    // Session management
    getUserSession: async (args) => {
        return await agent.getUserSession(args.userId);
    },
    // Store analysis
    storeAnalysis: async (args) => {
        await agent.storeAnalysis(args.userId, args.analysis);
        return { success: true };
    },
    // Get browsing history
    getBrowsingHistory: async (args) => {
        return await agent.getBrowsingHistory(args.userId, args.limit);
    },
    // Update preferences
    updateUserPreferences: async (args) => {
        await agent.updateUserPreferences(args.userId, args.preferences);
        return { success: true };
    },
    // Create price alert
    createPriceAlert: async (args) => {
        await agent.createPriceAlert(args.userId, args.productId, args.threshold);
        return { success: true };
    },
};
//# sourceMappingURL=copilot-actions.js.map