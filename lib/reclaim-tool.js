/**
 * Reclaim AI Agent Tool - Standalone API
 * Can be used directly in code without AI/LLM
 */
import { ReclaimAgent } from "./reclaim-agent";
export class ReclaimTool {
    constructor(config) {
        // Set environment variables from config if provided
        if (config) {
            if (config.tavilyApiKey)
                process.env.TAVILY_API_KEY = config.tavilyApiKey;
            if (config.redisUrl)
                process.env.REDIS_URL = config.redisUrl;
            if (config.redisHost)
                process.env.REDIS_HOST = config.redisHost;
            if (config.redisPort)
                process.env.REDIS_PORT = config.redisPort;
            if (config.redisPassword)
                process.env.REDIS_PASSWORD = config.redisPassword;
            if (config.langCacheHost)
                process.env.REDIS_LANGCACHE_HOST = config.langCacheHost;
            if (config.langCacheApiKey)
                process.env.REDIS_LANGCACHE_API_KEY = config.langCacheApiKey;
            if (config.langCacheId)
                process.env.REDIS_LANGCACHE_ID = config.langCacheId;
        }
        this.agent = new ReclaimAgent();
    }
    /**
     * Analyze a product URL
     * @param url - Product URL to analyze
     * @param userId - Optional user ID for personalization
     * @returns Product analysis with recommendation
     */
    async analyzeProduct(url, userId) {
        return await this.agent.analyzeProduct(url, userId);
    }
    /**
     * Get product metadata (title, price, description)
     * @param url - Product URL
     * @returns Product metadata
     */
    async getProductMetadata(url) {
        const result = await this.agent.crawlWithTavily(url);
        return {
            url: result.url,
            title: result.title,
            content: result.content,
        };
    }
    /**
     * Search for product alternatives
     * @param productName - Name of the product
     * @param additionalTerms - Additional search terms (e.g., "used", "refurbished")
     * @returns List of alternative products
     */
    async searchAlternatives(productName, additionalTerms) {
        return await this.agent.searchAlternatives(productName, additionalTerms);
    }
    /**
     * Get user preferences
     * @param userId - User ID
     * @returns User preferences
     */
    async getUserPreferences(userId) {
        return await this.agent.getUserPreferences(userId);
    }
    /**
     * Set user preferences
     * @param userId - User ID
     * @param preferences - User preferences
     */
    async setUserPreferences(userId, preferences) {
        return await this.agent.setUserPreferences(userId, preferences);
    }
    /**
     * Get browsing history
     * @param userId - User ID
     * @param limit - Number of items to return
     * @returns Browsing history
     */
    async getBrowsingHistory(userId, limit = 10) {
        return await this.agent.getBrowsingHistory(userId, limit);
    }
    /**
     * Create a price alert
     * @param userId - User ID
     * @param productId - Product ID
     * @param threshold - Price threshold
     */
    async createPriceAlert(userId, productId, threshold) {
        return await this.agent.createPriceAlert(userId, productId, threshold);
    }
}
// Export singleton instance
let toolInstance = null;
export function getReclaimTool(config) {
    if (!toolInstance) {
        toolInstance = new ReclaimTool(config);
    }
    return toolInstance;
}
//# sourceMappingURL=reclaim-tool.js.map