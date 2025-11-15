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
  // In-memory cache for instant results (exact URL matches)
  private memoryCache: Map<string, { result: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
   * Check if analysis is cached (in-memory first, then semantic search)
   * @param url - Product URL to check
   * @returns Cached analysis if found, null otherwise
   */
  async checkCachedAnalysis(url: string): Promise<any | null> {
    // 1. Check in-memory cache first (instant - exact URL match)
    const cached = this.memoryCache.get(url);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.CACHE_TTL) {
        console.log(`⚡ [MEMORY CACHE] Instant hit for ${url} (${Math.round(age / 1000)}s old)`);
        return cached.result;
      } else {
        // Expired - remove from memory
        this.memoryCache.delete(url);
      }
    }

    // 2. Check LangCache (semantic search - 1-2 seconds)
    const agent = this.agent as any;
    
    if (!agent.langCache) {
      return null;
    }

    try {
      const cacheResult = await agent.langCache.search({
        prompt: `Analyze product: ${url}`,
        similarityThreshold: 0.85, // High threshold for similar URLs
      });

      // Handle LangCache response - it may be an array or object
      const cacheArray = Array.isArray(cacheResult) 
        ? cacheResult 
        : (cacheResult && typeof cacheResult === 'object' && 'results' in cacheResult 
          ? (cacheResult as any).results 
          : []);

      if (cacheArray.length > 0 && cacheArray[0]?.response) {
        try {
          const cachedAnalysis = JSON.parse(cacheArray[0].response);
          // Verify it's a valid analysis result
          if (cachedAnalysis && cachedAnalysis.url && cachedAnalysis.recommendation) {
            console.log(`✅ [LANGCA CHE] Semantic cache hit for ${url}`);
            
            // Store in memory cache for next time (instant)
            this.memoryCache.set(url, {
              result: cachedAnalysis,
              timestamp: Date.now(),
            });
            
            return cachedAnalysis;
          }
        } catch (parseErr) {
          // Invalid cache, continue
        }
      }
    } catch (err: any) {
      console.warn("⚠️ [CACHE] LangCache search error:", err.message);
    }

    return null;
  }

  /**
   * Store analysis in memory cache for instant future access
   * @param url - Product URL
   * @param analysis - Analysis result to cache
   */
  storeInMemoryCache(url: string, analysis: any): void {
    this.memoryCache.set(url, {
      result: analysis,
      timestamp: Date.now(),
    });
    
    // Cleanup old entries (older than TTL)
    for (const [key, value] of this.memoryCache.entries()) {
      if (Date.now() - value.timestamp > this.CACHE_TTL) {
        this.memoryCache.delete(key);
      }
    }
    
    console.log(`💾 [MEMORY CACHE] Stored analysis for ${url} (${this.memoryCache.size} items in cache)`);
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

