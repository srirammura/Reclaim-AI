/**
 * Reclaim AI Agent Tool - Standalone API
 * Can be used directly in code without AI/LLM
 */

import { ReclaimAgent } from "./reclaim-agent";

export interface ReclaimToolConfig {
  tavilyApiKey?: string;
  redisUrl?: string;
  redisHost?: string;
  redisPort?: string;
  redisPassword?: string;
  langCacheHost?: string;
  langCacheApiKey?: string;
  langCacheId?: string;
}

export class ReclaimTool {
  private agent: ReclaimAgent;

  constructor(config?: ReclaimToolConfig) {
    // Set environment variables from config if provided
    if (config) {
      if (config.tavilyApiKey) process.env.TAVILY_API_KEY = config.tavilyApiKey;
      if (config.redisUrl) process.env.REDIS_URL = config.redisUrl;
      if (config.redisHost) process.env.REDIS_HOST = config.redisHost;
      if (config.redisPort) process.env.REDIS_PORT = config.redisPort;
      if (config.redisPassword) process.env.REDIS_PASSWORD = config.redisPassword;
      if (config.langCacheHost) process.env.REDIS_LANGCACHE_HOST = config.langCacheHost;
      if (config.langCacheApiKey) process.env.REDIS_LANGCACHE_API_KEY = config.langCacheApiKey;
      if (config.langCacheId) process.env.REDIS_LANGCACHE_ID = config.langCacheId;
    }

    this.agent = new ReclaimAgent();
  }

  /**
   * Analyze a product URL
   * @param url - Product URL to analyze
   * @param userId - Optional user ID for personalization
   * @returns Product analysis with recommendation
   */
  async analyzeProduct(url: string, userId?: string) {
    return await this.agent.analyzeProduct(url, userId);
  }

  /**
   * Get product metadata (title, price, description)
   * @param url - Product URL
   * @returns Product metadata
   */
  async getProductMetadata(url: string) {
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
  async searchAlternatives(productName: string, additionalTerms?: string) {
    return await this.agent.searchAlternatives(productName, additionalTerms);
  }

  /**
   * Get user preferences
   * @param userId - User ID
   * @returns User preferences
   */
  async getUserPreferences(userId: string) {
    return await this.agent.getUserPreferences(userId);
  }

  /**
   * Set user preferences
   * @param userId - User ID
   * @param preferences - User preferences
   */
  async setUserPreferences(userId: string, preferences: any) {
    return await this.agent.setUserPreferences(userId, preferences);
  }

  /**
   * Get browsing history
   * @param userId - User ID
   * @param limit - Number of items to return
   * @returns Browsing history
   */
  async getBrowsingHistory(userId: string, limit: number = 10) {
    return await this.agent.getBrowsingHistory(userId, limit);
  }

  /**
   * Create a price alert
   * @param userId - User ID
   * @param productId - Product ID
   * @param threshold - Price threshold
   */
  async createPriceAlert(userId: string, productId: string, threshold: number) {
    return await this.agent.createPriceAlert(userId, productId, threshold);
  }
}

// Export singleton instance
let toolInstance: ReclaimTool | null = null;

export function getReclaimTool(config?: ReclaimToolConfig): ReclaimTool {
  if (!toolInstance) {
    toolInstance = new ReclaimTool(config);
  }
  return toolInstance;
}

