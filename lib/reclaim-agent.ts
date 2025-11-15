import { tavily } from "@tavily/core";
import Redis from "ioredis";
import { LangCache } from "@redis-ai/langcache";

interface UserPreferences {
  budgetRange?: { min: number; max: number };
  values?: string[]; // e.g., ["sustainability", "minimalism", "value"]
  categories?: string[];
  alerts?: Array<{
    productId: string;
    condition: string;
    threshold?: number;
  }>;
}

interface ManipulationClaim {
  type: string;
  claim: string;
  foundText: string;
  verified?: boolean;
  verificationEvidence?: string;
  cached?: boolean; // Indicates if this claim was retrieved from cache
}

interface ProductAnalysis {
  url: string;
  title?: string;
  price?: number;
  currency?: string;
  manipulationSignals: string[];
  manipulationClaims?: ManipulationClaim[];
  alternatives: Array<{
    type: "used" | "rent" | "repair" | "alternative" | "wait";
    description: string;
    url?: string;
    price?: number;
    savings?: number;
  }>;
  recommendation: {
    score: number; // 0-100, lower = better to buy
    reasoning: string;
    detailedReasoning?: string; // Detailed breakdown with evidence
    verdict: "buy" | "wait" | "avoid" | "find-alternative";
  };
  metadata?: {
    crawledAt: number;
    tavilyUsed: boolean;
    redisStored: boolean;
  };
}

interface CopilotActionMetadata {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    };
  };
}

export class ReclaimAgent {
  private tavilyClient: ReturnType<typeof tavily> | null;
  private redis: Redis | null;
  private langCache: LangCache | null;

  constructor() {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (tavilyApiKey) {
      try {
        this.tavilyClient = tavily({ apiKey: tavilyApiKey });
        console.log("✅ Tavily initialized successfully");
      } catch (err) {
        console.error("Failed to initialize Tavily:", err);
        this.tavilyClient = null;
      }
    } else {
      console.warn("⚠️ TAVILY_API_KEY not set. Tavily features will be limited.");
      this.tavilyClient = null;
    }

    // Use Redis LangCache connection if API key and URL are provided, otherwise use local/optional
    const langcacheApiKey = process.env.REDIS_LANGCACHE_API_KEY;
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;
    
    // Only create Redis connection if we have a valid configuration
    if (langcacheApiKey && (redisUrl || redisHost)) {
      // Redis LangCache connection with explicit host/URL
      const connectionUrl = redisUrl || `redis://default:${langcacheApiKey}@${redisHost}:${process.env.REDIS_PORT || '6379'}`;
      
      this.redis = new Redis(connectionUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false, // Don't queue commands when disconnected
      });
      console.log("✅ Redis LangCache connection configured");
    } else if (redisHost || redisUrl) {
      // Standard Redis connection if host/URL provided
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
        });
      } else {
        this.redis = new Redis({
          host: redisHost || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379"),
          password: process.env.REDIS_PASSWORD || undefined,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
        });
      }
    } else {
      // No Redis configuration - create a dummy client that will gracefully fail
      // This allows the app to work without Redis
      console.warn("⚠️ No Redis configuration found. App will run without persistence.");
      this.redis = null as any;
    }

    // Handle Redis connection events only if Redis is configured
    if (this.redis) {
      this.redis.on("connect", () => {
        console.log("✅ Redis connected successfully");
      });

      this.redis.on("error", (err) => {
        console.error("❌ Redis connection error:", err.message);
        console.warn("⚠️ App will continue without Redis persistence");
      });

      this.redis.on("ready", () => {
        console.log("✅ Redis is ready");
      });

      // Connect to Redis (non-blocking)
      this.redis.connect().catch((err) => {
        console.warn("⚠️ Could not connect to Redis:", err.message);
        console.warn("⚠️ Continuing without Redis persistence...");
      });
    }

    // Initialize LangCache for semantic caching (if configured)
    const langCacheHost = process.env.REDIS_LANGCACHE_HOST;
    const langCacheApiKey = process.env.REDIS_LANGCACHE_API_KEY;
    const langCacheId = process.env.REDIS_LANGCACHE_ID;

    if (langCacheHost && langCacheApiKey && langCacheId) {
      try {
        // Handle host URL with or without protocol
        const serverURL = langCacheHost.startsWith('http')
          ? langCacheHost
          : `https://${langCacheHost}`;
        
        this.langCache = new LangCache({
          serverURL: serverURL,
          cacheId: langCacheId,
          apiKey: langCacheApiKey,
        });
        console.log("✅ LangCache initialized successfully");
      } catch (err: any) {
        console.error("Failed to initialize LangCache:", err.message);
        this.langCache = null;
      }
    } else {
      console.warn("⚠️ LangCache not configured. Missing HOST, API_KEY, or CACHE_ID.");
      this.langCache = null;
    }
  }

  // Get actions metadata for CopilotKit
  getActionsMetadata(): CopilotActionMetadata[] {
    return [
      {
        name: "analyzeProduct",
        description: "Analyze a product URL for manipulation signals, alternatives, and provide mindful purchasing recommendations",
        parameters: {
          url: {
            type: "string",
            description: "The product URL to analyze",
            required: true,
          },
          userId: {
            type: "string",
            description: "Optional user ID for storing history and preferences",
          },
        },
      },
      {
        name: "crawlWithTavily",
        description: "Crawl and extract information from a URL using Tavily web crawler",
        parameters: {
          url: {
            type: "string",
            description: "The URL to crawl",
            required: true,
          },
        },
      },
      {
        name: "searchAlternatives",
        description: "Search for used, refurbished, or alternative products using Tavily",
        parameters: {
          productName: {
            type: "string",
            description: "The product name to search for",
            required: true,
          },
          query: {
            type: "string",
            description: "Additional search query (e.g., 'used', 'refurbished', 'rent')",
          },
        },
      },
      {
        name: "getUserSession",
        description: "Get or create a user session from Redis",
        parameters: {
          userId: {
            type: "string",
            description: "The user ID",
            required: true,
          },
        },
      },
      {
        name: "storeAnalysis",
        description: "Store product analysis results in Redis",
        parameters: {
          userId: {
            type: "string",
            description: "The user ID",
            required: true,
          },
          analysis: {
            type: "object",
            description: "The product analysis result",
            required: true,
          },
        },
      },
      {
        name: "getBrowsingHistory",
        description: "Get user's browsing history from Redis",
        parameters: {
          userId: {
            type: "string",
            description: "The user ID",
            required: true,
          },
          limit: {
            type: "number",
            description: "Maximum number of items to return",
          },
        },
      },
      {
        name: "updateUserPreferences",
        description: "Update user preferences in Redis",
        parameters: {
          userId: {
            type: "string",
            description: "The user ID",
            required: true,
          },
          preferences: {
            type: "object",
            description: "User preferences to update",
            required: true,
          },
        },
      },
      {
        name: "createPriceAlert",
        description: "Create a price alert for a product",
        parameters: {
          userId: {
            type: "string",
            description: "The user ID",
            required: true,
          },
          productId: {
            type: "string",
            description: "The product identifier or URL",
            required: true,
          },
          threshold: {
            type: "number",
            description: "Price threshold to trigger alert",
            required: true,
          },
        },
      },
    ];
  }

  getActions() {
    return {
      analyzeProduct: this.analyzeProduct.bind(this),
      crawlWithTavily: this.crawlWithTavily.bind(this),
      searchAlternatives: this.searchAlternatives.bind(this),
      getUserSession: this.getUserSession.bind(this),
      storeAnalysis: this.storeAnalysis.bind(this),
      getBrowsingHistory: this.getBrowsingHistory.bind(this),
      updateUserPreferences: this.updateUserPreferences.bind(this),
      createPriceAlert: this.createPriceAlert.bind(this),
    };
  }

  // Enhanced Tavily crawling with retries and caching
  async crawlWithTavily(url: string): Promise<any> {
    if (!this.tavilyClient) {
      throw new Error("Tavily is not configured. Please set TAVILY_API_KEY.");
    }

    // Check LangCache for cached crawl result
    if (this.langCache) {
      try {
        const cacheResult = await this.langCache.search({
          prompt: `Crawl URL content: ${url}`,
          similarityThreshold: 0.98, // Very high threshold for exact URL match
        });

        const cacheArray = Array.isArray(cacheResult)
          ? cacheResult
          : (cacheResult && typeof cacheResult === 'object' && 'results' in cacheResult
            ? (cacheResult as any).results
            : []);

        if (cacheArray.length > 0 && cacheArray[0]?.response) {
          try {
            const cached = JSON.parse(cacheArray[0].response);
            // Verify it's a valid crawl result
            if (cached && (cached.content || cached.text || cached.title)) {
              console.log(`✅ [LANGCA CHE] Tavily crawl CACHE HIT for ${url}`);
              return {
                success: true,
                content: cached.content || cached.text || "",
                title: cached.title || url,
                url: cached.url || url,
                cached: true,
              };
            }
          } catch (parseErr) {
            // Invalid cache, continue with fresh crawl
          }
        }
      } catch (err: any) {
        console.warn("⚠️ [LANGCA CHE] LangCache search error for crawl:", err.message);
        // Continue with fresh crawl if cache fails
      }
    }

    // Cache miss - perform fresh crawl
    console.log(`🔍 [LANGCA CHE] Tavily crawl CACHE MISS - fetching fresh for ${url}`);
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Use extract method: extract(urls, options)
        const result = await this.tavilyClient.extract([url], {});

        // Handle Tavily extract response - it may be an object or array
        const extracted = Array.isArray(result) ? result[0] : result;
        if (extracted && (extracted.content || extracted.text)) {
          const crawlResult = {
            success: true,
            content: extracted.content || extracted.text || "",
            title: extracted.title || url,
            url: extracted.url || url,
            cached: false,
          };

          // Cache the result in LangCache
          if (this.langCache) {
            try {
              await this.langCache.set({
                prompt: `Crawl URL content: ${url}`,
                response: JSON.stringify(crawlResult),
              });
              console.log(`💾 [LANGCA CHE] Cached Tavily crawl result for ${url}`);
            } catch (cacheErr: any) {
              console.warn("Failed to cache crawl result:", cacheErr.message);
              // Continue without caching
            }
          }

          return crawlResult;
        }

        throw new Error("No content returned from Tavily");
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw new Error(`Failed to crawl URL after ${maxRetries} attempts: ${lastError?.message}`);
  }

  // Search for alternatives using Tavily - product-specific search with caching
  async searchAlternatives(productName: string, additionalTerms?: string): Promise<any> {
    if (!this.tavilyClient) {
      return { success: false, results: [] };
    }

    // Build specific product-focused search query
    // Remove generic terms and focus on the actual product
    const cleanProductName = productName
      .replace(/\s*-\s*Amazon.*/i, "")
      .replace(/\s*\|\s*.*/i, "")
      .replace(/Amazon.*$/i, "")
      .replace(/^Buy\s+/i, "")
      .trim();
    
    if (!cleanProductName || cleanProductName.length < 3) {
      return { success: false, results: [] };
    }

    // Build focused search query - prioritize cheaper and similar options
    const searchQuery = additionalTerms
      ? `${cleanProductName} ${additionalTerms}`
      : `${cleanProductName} cheaper alternative similar same function`;

    // Check LangCache for cached search results
    if (this.langCache) {
      try {
        const cacheResult = await this.langCache.search({
          prompt: `Search alternatives: ${searchQuery}`,
          similarityThreshold: 0.85, // Allow some variation in search terms
        });

        const cacheArray = Array.isArray(cacheResult)
          ? cacheResult
          : (cacheResult && typeof cacheResult === 'object' && 'results' in cacheResult
            ? (cacheResult as any).results
            : []);

        if (cacheArray.length > 0 && cacheArray[0]?.response) {
          try {
            const cached = JSON.parse(cacheArray[0].response);
            // Verify it's a valid search result
            if (cached && (cached.success !== undefined || cached.results)) {
              console.log(`✅ [LANGCA CHE] Alternatives search CACHE HIT for "${cleanProductName}"`);
              return { ...cached, cached: true };
            }
          } catch (parseErr) {
            // Invalid cache, continue with fresh search
          }
        }
      } catch (err: any) {
        console.warn("⚠️ [LANGCA CHE] LangCache search error for alternatives:", err.message);
        // Continue with fresh search if cache fails
      }
    }

    // Cache miss - perform fresh search
    console.log(`🔍 [LANGCA CHE] Alternatives search CACHE MISS - searching for "${cleanProductName}" with Tavily`);
    try {
      // Tavily search: search(query, options)
      // Focus on marketplaces and alternative sources
      // Use more specific queries to find product pages
      const enhancedQuery = `${searchQuery} product page buy now`;
      const result = await this.tavilyClient.search(enhancedQuery, {
        searchDepth: "advanced",
        maxResults: 20, // Get more results to filter for product pages
        includeDomains: [
          "ebay.com",
          "facebook.com/marketplace",
          "craigslist.org",
          "offerup.com",
          "mercari.com",
          "poshmark.com",
          "amazon.com",
        ],
      });

      const searchResult = {
        success: true,
        results: result.results || [],
        query: searchQuery,
        cached: false,
      };

      // Cache the search results
      if (this.langCache) {
        try {
          await this.langCache.set({
            prompt: `Search alternatives: ${searchQuery}`,
            response: JSON.stringify(searchResult),
          });
          console.log(`💾 [LANGCA CHE] Cached alternatives search for "${cleanProductName}"`);
        } catch (cacheErr: any) {
          console.warn("Failed to cache alternatives search:", cacheErr.message);
          // Continue without caching
        }
      }

      return searchResult;
    } catch (err: any) {
      // Don't throw error, just return empty results so app continues
      console.warn("Tavily search failed:", err.message);
      return {
        success: false,
        results: [],
        query: searchQuery,
        cached: false,
      };
    }
  }

  // Get or create user session
  async getUserSession(userId: string): Promise<any> {
    if (!this.isRedisReady()) {
      return { userId, sessionCreated: false };
    }

    try {
      const sessionKey = `session:${userId}`;
      const existing = await this.redis.get(sessionKey);

      if (existing) {
        return JSON.parse(existing);
      }

      const session = {
        userId,
        createdAt: Date.now(),
        lastActive: Date.now(),
        productCount: 0,
      };

      await this.redis.set(sessionKey, JSON.stringify(session));
      await this.redis.expire(sessionKey, 60 * 60 * 24 * 7); // 7 days

      return { ...session, sessionCreated: true };
    } catch (err: any) {
      console.error("Error getting user session:", err);
      return { userId, sessionCreated: false, error: err.message };
    }
  }

  // Store analysis in Redis
  async storeAnalysis(userId: string, analysis: ProductAnalysis): Promise<void> {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      const analysisKey = `analysis:${userId}:${Date.now()}`;
      await this.redis.set(analysisKey, JSON.stringify(analysis));
      await this.redis.expire(analysisKey, 60 * 60 * 24 * 30); // 30 days

      // Update browsing history
      const historyKey = `user:${userId}:history`;
      await this.redis.lpush(historyKey, analysisKey);
      await this.redis.ltrim(historyKey, 0, 99);

      // Update session
      const sessionKey = `session:${userId}`;
      const session = await this.getUserSession(userId);
      session.productCount = (session.productCount || 0) + 1;
      session.lastActive = Date.now();
      await this.redis.set(sessionKey, JSON.stringify(session));
    } catch (err) {
      console.error("Error storing analysis:", err);
    }
  }

  // Get browsing history
  async getBrowsingHistory(userId: string, limit: number = 10): Promise<any[]> {
    if (!this.isRedisReady()) {
      return [];
    }

    try {
      const historyKey = `user:${userId}:history`;
      const analysisKeys = await this.redis.lrange(historyKey, 0, limit - 1);

      const analyses = [];
      for (const key of analysisKeys) {
        const data = await this.redis.get(key);
        if (data) {
          analyses.push(JSON.parse(data));
        }
      }

      return analyses;
    } catch (err) {
      console.error("Error getting browsing history:", err);
      return [];
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      const existing = await this.getUserPreferences(userId);
      const updated = { ...existing, ...preferences };

      await this.redis.set(
        `user:${userId}:preferences`,
        JSON.stringify(updated)
      );
    } catch (err) {
      console.error("Error updating user preferences:", err);
    }
  }

  // Create price alert
  async createPriceAlert(userId: string, productId: string, threshold: number): Promise<void> {
    if (!this.isRedisReady()) {
      return;
    }

    try {
      const alertKey = `alert:${productId}`;
      const alert = {
        userId,
        productId,
        threshold,
        createdAt: Date.now(),
        triggered: false,
      };

      await this.redis.lpush(alertKey, JSON.stringify(alert));
      await this.redis.sadd(`user:${userId}:alerts`, alertKey);
    } catch (err) {
      console.error("Error creating price alert:", err);
    }
  }

  // Main product analysis workflow
  async analyzeProduct(url: string, userId?: string): Promise<ProductAnalysis> {
    const metadata: ProductAnalysis["metadata"] = {
      crawledAt: Date.now(),
      tavilyUsed: false,
      redisStored: false,
    };

    // Check LangCache for similar previous analyses
    let cachedAnalysis: ProductAnalysis | null = null;
    let cacheStats = {
      fullAnalysisCached: false,
      crawlCached: false,
      alternativesCached: false,
      verificationsCached: 0,
      totalCacheHits: 0,
    };

    if (this.langCache) {
      try {
        const cacheResult = await this.langCache.search({
          prompt: `Analyze product: ${url}`,
          similarityThreshold: 0.85,
        });

        // Handle LangCache response - it may be an array or object
        const cacheArray = Array.isArray(cacheResult) 
          ? cacheResult 
          : (cacheResult && typeof cacheResult === 'object' && 'results' in cacheResult 
            ? (cacheResult as any).results 
            : []);
        if (cacheArray.length > 0 && cacheArray[0]?.response) {
          // Found a similar cached analysis
          try {
            cachedAnalysis = JSON.parse(cacheArray[0].response);
            if (cachedAnalysis) {
              cacheStats.fullAnalysisCached = true;
              cacheStats.totalCacheHits = 1;
              console.log("✅ [LANGCA CHE] Full analysis retrieved from cache");
              console.log(`📊 [LANGCA CHE] Cache Stats: Full Analysis = CACHED`);
              return cachedAnalysis;
            }
          } catch (parseErr) {
            // If parse fails, continue with fresh analysis
          }
        }
      } catch (err: any) {
        console.warn("⚠️ [LANGCA CHE] LangCache search error:", err.message);
        // Continue with fresh analysis if cache fails
      }
    }
    
    console.log("🔍 [LANGCA CHE] Full analysis not found in cache, performing fresh analysis");

    // 1. Extract product info using Tavily
    let productInfo: any = { url, title: url };
    let productName = "";
    
    try {
      const tavilyResult = await this.crawlWithTavily(url);
      if (tavilyResult.cached) {
        cacheStats.crawlCached = true;
        cacheStats.totalCacheHits++;
      }
      const content = tavilyResult.content || "";
      
      // Extract product name - look for product title patterns
      // Remove site names and common prefixes
      let title = tavilyResult.title || url;
      title = title.replace(/^Amazon\.com:|^Amazon:/i, "").trim();
      title = title.replace(/^Buy\s+/i, "").trim();
      title = title.split("|")[0].split("-")[0].trim(); // Get first part before | or -
      
      // Extract product name from content if title is too generic
      if (title.toLowerCase().includes("amazon") || title === url || title.length < 5) {
        // Try to find product name in content
        const productNameMatch = content.match(/product[:\s]+([^.\n]+)|title[:\s]+([^.\n]+)|name[:\s]+([^.\n]+)/i);
        if (productNameMatch) {
          title = (productNameMatch[1] || productNameMatch[2] || productNameMatch[3] || title).trim();
        }
      }
      
      productInfo = {
        url,
        title: title || url,
        description: content.substring(0, 2000) || "",
      };
      productName = title || url;
      metadata.tavilyUsed = true;

      // Extract price from content
      const priceMatch = content.match(/\$[\d,]+\.?\d*/);
      if (priceMatch) {
        productInfo.price = parseFloat(priceMatch[0].replace(/[$,]/g, ""));
        productInfo.currency = "USD";
      }
      
      // Extract brand/model if available
      const brandMatch = content.match(/(?:brand|made by|manufacturer)[:\s]+([A-Z][a-zA-Z\s]+)/i);
      if (brandMatch) {
        productInfo.brand = brandMatch[1].trim();
      }
    } catch (err: any) {
      console.warn("Tavily crawl failed, using fallback:", err.message);
      // Fallback: simple fetch
      try {
        const response = await fetch(url);
        const html = await response.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          let title = titleMatch[1];
          title = title.replace(/^Amazon\.com:|^Amazon:/i, "").trim();
          title = title.replace(/^Buy\s+/i, "").trim();
          title = title.split("|")[0].split("-")[0].trim();
          productInfo.title = title;
          productName = title;
        }
      } catch (fetchErr) {
        console.error("Fallback fetch also failed:", fetchErr);
      }
    }

    // Clean product name for better search
    productName = productName
      .replace(/\s*-\s*Amazon.*/i, "")
      .replace(/\s*\|\s*Amazon.*/i, "")
      .replace(/\s*on\s+Amazon.*/i, "")
      .replace(/Amazon.*$/, "")
      .trim();
    
    // 2. Search for alternatives using Tavily - with specific product-focused queries
    let alternatives: ProductAnalysis["alternatives"] = [];
    
    if (productName && productName.length > 3 && productName.toLowerCase() !== "amazon.com") {
      try {
        // Search for used version (cheaper)
        const usedResult = await this.searchAlternatives(
          productName,
          `used pre-owned secondhand cheaper price buy sell`
        );
        if (usedResult.cached) {
          cacheStats.alternativesCached = true;
          cacheStats.totalCacheHits++;
        }
        
        // Search for refurbished version (cheaper)
        const refurbishedResult = await this.searchAlternatives(
          productName,
          `refurbished renewed open box cheaper price discount`
        );
        if (refurbishedResult.cached && !cacheStats.alternativesCached) {
          cacheStats.alternativesCached = true;
          cacheStats.totalCacheHits++;
        }
        
        // Search for cheaper similar products that serve the same function
        const similarCheaperResult = await this.searchAlternatives(
          productName,
          `cheaper alternative similar product same function lower price budget`
        );
        if (similarCheaperResult.cached && !cacheStats.alternativesCached) {
          cacheStats.alternativesCached = true;
          cacheStats.totalCacheHits++;
        }
        
        // Search for generic/off-brand alternatives (usually cheaper)
        const genericResult = await this.searchAlternatives(
          productName,
          `generic alternative off brand cheaper price same use`
        );
        if (genericResult.cached && !cacheStats.alternativesCached) {
          cacheStats.alternativesCached = true;
          cacheStats.totalCacheHits++;
        }
        
        // Combine and deduplicate results - focus on cheaper options
        const allResults = [
          ...(usedResult?.results || []),
          ...(refurbishedResult?.results || []),
          ...(similarCheaperResult?.results || []),
          ...(genericResult?.results || []),
        ];
        
        const seenUrls = new Set<string>();
        const productNameLower = productName.toLowerCase();
        
        // Helper function to check if URL is a direct product link (not search/category page)
        const isProductPage = (url: string): boolean => {
          const urlLower = url.toLowerCase();
          
          // Exclude search pages
          if (urlLower.includes('/search') || 
              urlLower.includes('/s?') || 
              urlLower.includes('?q=') || 
              urlLower.includes('&q=') ||
              urlLower.includes('query=') ||
              urlLower.includes('search=') ||
              urlLower.includes('/s/')) {
            return false;
          }
          
          // Exclude category/browse pages
          if (urlLower.includes('/category/') ||
              urlLower.includes('/browse/') ||
              urlLower.includes('/shop/') ||
              urlLower.includes('/c/') ||
              urlLower.includes('/department/') ||
              urlLower.includes('/list/') ||
              urlLower.includes('/collections/')) {
            return false;
          }
          
          // Exclude home pages and generic pages
          if (urlLower.match(/^https?:\/\/[^\/]+\/?$/) || // Just domain
              urlLower.endsWith('/') && urlLower.split('/').length <= 4 || // Too short path
              urlLower.includes('/home') ||
              urlLower.includes('/index')) {
            return false;
          }
          
          // Include URLs that look like product pages
          // Amazon: /dp/, /gp/product/, /product/
          // eBay: /itm/, /p/, /ebaymotors/
          // Facebook Marketplace: /marketplace/item/
          // Other: /product/, /products/, /item/, /items/, /p/
          const productPagePatterns = [
            /\/dp\/[^\/]+/i,           // Amazon /dp/B08N5WRWNW
            /\/gp\/product\/[^\/]+/i,  // Amazon /gp/product/
            /\/product\/[^\/]+/i,       // Generic /product/123
            /\/products\/[^\/]+/i,      // Generic /products/123
            /\/itm\/[^\/]+/i,          // eBay /itm/123456789
            /\/p\/[^\/]+/i,            // Generic /p/product-name
            /\/item\/[^\/]+/i,         // Generic /item/123
            /\/items\/[^\/]+/i,        // Generic /items/123
            /\/marketplace\/item\/[^\/]+/i, // Facebook Marketplace
            /\/listing\/[^\/]+/i,      // Generic /listing/123
            /\/offer\/[^\/]+/i,        // Generic /offer/123
            /\/warehouse-deals\/[^\/]+/i, // Amazon Warehouse
            /\/outlet\/[^\/]+/i,       // Amazon Outlet
            /\/gp\/offer-listing\/[^\/]+/i, // Amazon offer listing
          ];
          
          return productPagePatterns.some(pattern => pattern.test(url));
        };
        
        for (const result of allResults) {
          if (!result.url || seenUrls.has(result.url)) continue;
          
          const title = (result.title || "").toLowerCase();
          const content = (result.content || "").toLowerCase();
          const url = result.url.toLowerCase();
          
          // Filter out non-product pages (search, category, home pages)
          if (!isProductPage(result.url)) {
            console.log(`🚫 [FILTER] Excluding non-product page: ${result.url}`);
            continue;
          }
          
          // Check if result is actually related to the product
          const productKeywords = productNameLower.split(/\s+/).filter(w => w.length > 3);
          const hasProductMatch = productKeywords.some(keyword => 
            title.includes(keyword) || content.includes(keyword) || url.includes(keyword)
          );
          
          if (!hasProductMatch && productKeywords.length > 0) continue;
          
          seenUrls.add(result.url);
          
          // Determine type based on content - focus on cheaper options
          let type: "used" | "rent" | "repair" | "alternative" | "wait" = "alternative";
          
          if (title.includes("used") || title.includes("pre-owned") || title.includes("secondhand") ||
              content.includes("used") || content.includes("pre-owned") || 
              url.includes("used") || url.includes("warehouse")) {
            type = "used";
          } else if (title.includes("refurbished") || title.includes("renewed") || title.includes("open box") ||
                     content.includes("refurbished") || content.includes("renewed")) {
            type = "used"; // Refurbished is a type of used
          } else if (title.includes("cheaper") || title.includes("budget") || title.includes("affordable") ||
                     content.includes("cheaper") || content.includes("lower price") || 
                     title.includes("generic") || title.includes("off brand")) {
            type = "alternative"; // Cheaper alternative product
          } else if (title.includes("similar") || title.includes("alternative") || 
                     content.includes("similar product") || content.includes("alternative to")) {
            type = "alternative"; // Similar product
          }
          
          // Extract price if available
          let price: number | undefined;
          const priceText = title + " " + content;
          const priceMatch = priceText.match(/\$[\d,]+\.?\d*/);
          if (priceMatch) {
            price = parseFloat(priceMatch[0].replace(/[$,]/g, ""));
          }
          
          alternatives.push({
            type,
            description: result.title || "Alternative option",
            url: result.url,
            price,
            savings: productInfo.price && price ? productInfo.price - price : undefined,
          });
          
          console.log(`✅ [FILTER] Added product page: ${result.url}`);
          
          if (alternatives.length >= 8) break; // Limit to 8 best alternatives
        }
      } catch (err) {
        console.warn("Could not find alternatives:", err);
      }
      
      if (alternatives.length > 0) {
        console.log(`✅ [FILTER] Found ${alternatives.length} valid product page alternatives (filtered from search results)`);
      } else {
        console.warn(`⚠️ [FILTER] No valid product pages found after filtering. All results were search/category pages.`);
      }
    }

    // 3. Detect manipulation signals and claims
    const manipulationData = this.detectManipulation(productInfo);
    const manipulationSignals = manipulationData.signals;
    let manipulationClaims = manipulationData.claims;

    // Verify claims using Tavily
    let verifiedClaimsCount = 0;
    if (manipulationClaims.length > 0 && this.tavilyClient) {
      try {
        const verifiedClaims = await Promise.all(
          manipulationClaims.map(async (claim) => {
            const verified = await this.verifyClaim(claim, productName || productInfo.title || "");
            if (verified.cached) {
              verifiedClaimsCount++;
              cacheStats.verificationsCached++;
            }
            return verified;
          })
        );
        manipulationClaims = verifiedClaims;
        if (verifiedClaimsCount > 0) {
          console.log(`✅ [LANGCA CHE] Verified ${verifiedClaimsCount}/${manipulationClaims.length} claims from cache`);
        } else {
          console.log(`🔍 [LANGCA CHE] Verified ${manipulationClaims.length} claims with fresh Tavily searches`);
        }
      } catch (err) {
        console.warn("⚠️ [LANGCA CHE] Failed to verify claims:", err);
      }
    }

    // 4. Get user preferences if userId provided
    let userPrefs: UserPreferences = {};
    if (userId) {
      userPrefs = await this.getUserPreferences(userId);
    }

    // 5. Generate recommendation with detailed reasoning
    const recommendation = await this.generateRecommendation(
      productInfo,
      manipulationSignals,
      manipulationClaims,
      alternatives,
      userPrefs,
      productName
    );

    // 6. Store in Redis if userId provided
    if (userId) {
      try {
        await this.storeAnalysis(userId, {
          url,
          ...productInfo,
          manipulationSignals,
          alternatives,
          recommendation,
          metadata: { ...metadata, redisStored: true },
        });
        metadata.redisStored = true;
      } catch (err) {
        console.error("Failed to store analysis:", err);
      }
    }

    const analysis: ProductAnalysis = {
      url,
      ...productInfo,
      manipulationSignals,
      manipulationClaims,
      alternatives,
      recommendation,
      metadata,
    };

    // Store full analysis in LangCache for semantic caching (if configured)
    // This provides a fast path for exact or very similar product URLs
    if (this.langCache) {
      try {
        // Enhanced cache with metadata for smarter retrieval
        const cacheableAnalysis = {
          ...analysis,
          metadata: {
            ...analysis.metadata,
            cachedAt: Date.now(),
            productUrl: url,
            productName: productName || productInfo.title || "",
            price: productInfo.price,
          },
        };

        await this.langCache.set({
          prompt: `Analyze product: ${url} ${productName || productInfo.title || ""}`,
          response: JSON.stringify(cacheableAnalysis),
        });
        console.log("💾 [LANGCA CHE] Full analysis cached in LangCache");
        
        // Log final cache statistics
        console.log("\n📊 [LANGCA CHE] Final Cache Statistics:");
        console.log(`   Full Analysis: ${cacheStats.fullAnalysisCached ? '✅ CACHED' : '❌ Fresh'}`);
        console.log(`   Tavily Crawl: ${cacheStats.crawlCached ? '✅ CACHED' : '❌ Fresh'}`);
        console.log(`   Alternatives Search: ${cacheStats.alternativesCached ? '✅ CACHED' : '❌ Fresh'}`);
        console.log(`   Claim Verifications: ${cacheStats.verificationsCached} cached out of ${manipulationClaims.length} total`);
        console.log(`   Total Cache Hits: ${cacheStats.totalCacheHits + (cacheStats.fullAnalysisCached ? 1 : 0)}`);
        console.log(`   Performance: ${cacheStats.totalCacheHits > 0 ? '⚡ Optimized' : '🔄 All Fresh'}\n`);
      } catch (err: any) {
        console.warn("Failed to cache full analysis in LangCache:", err.message);
        // Continue without caching - app still works
      }
    }

    return analysis;
  }

  private detectManipulation(productInfo: any): { signals: string[]; claims: ManipulationClaim[] } {
    const signals: string[] = [];
    const claims: ManipulationClaim[] = [];
    const fullText = ((productInfo.description || "") + " " + (productInfo.title || "")).toLowerCase();
    const originalText = (productInfo.description || "") + " " + (productInfo.title || "");

    // Check for urgency/scarcity
    const urgencyPatterns = [
      /\b(limited time|act now|only \d+ left|hurry|expires|countdown|ending soon)\b/gi,
      /\b(only \d+ in stock|almost gone|selling fast|last chance)\b/gi,
    ];
    for (const pattern of urgencyPatterns) {
      const matches = originalText.match(pattern);
      if (matches) {
        signals.push("Urgency/scarcity pressure");
        claims.push({
          type: "Urgency/scarcity pressure",
          claim: matches[0],
          foundText: matches[0],
        });
        break;
      }
    }

    // Check for fake exclusivity
    const exclusivityPatterns = [
      /\b(one-time offer|never again|exclusive deal|members only)\b/gi,
      /\b(exclusive|limited edition|special offer|once in a lifetime)\b/gi,
    ];
    for (const pattern of exclusivityPatterns) {
      const matches = originalText.match(pattern);
      if (matches) {
        signals.push("Fake exclusivity claims");
        claims.push({
          type: "Fake exclusivity claims",
          claim: matches[0],
          foundText: matches[0],
        });
        break;
      }
    }

    // Check for impulse triggers
    const impulsePatterns = [
      /\b(buy now|order today|don't miss out|deal of the day)\b/gi,
      /\b(flash sale|today only|instant savings)\b/gi,
    ];
    for (const pattern of impulsePatterns) {
      const matches = originalText.match(pattern);
      if (matches) {
        signals.push("Impulse purchase triggers");
        claims.push({
          type: "Impulse purchase triggers",
          claim: matches[0],
          foundText: matches[0],
        });
        break;
      }
    }

    // Check for fake reviews indicators
    const reviewPatterns = [
      /\b(trusted by millions|5-star rated|best seller)\b/gi,
      /\b(\d+% satisfied|thousands of reviews|award winning)\b/gi,
    ];
    for (const pattern of reviewPatterns) {
      const matches = originalText.match(pattern);
      if (matches) {
        signals.push("Potential review manipulation");
        claims.push({
          type: "Potential review manipulation",
          claim: matches[0],
          foundText: matches[0],
        });
        break;
      }
    }

    // Check for price manipulation
    const pricePatterns = [
      /\b(was \$[\d,]+\.?\d* now \$[\d,]+\.?\d*|save \d+%|discount|markdown)\b/gi,
      /\b(original price|compare at|list price|you save)\b/gi,
    ];
    for (const pattern of pricePatterns) {
      const matches = originalText.match(pattern);
      if (matches) {
        signals.push("Price manipulation tactics");
        claims.push({
          type: "Price manipulation tactics",
          claim: matches[0],
          foundText: matches[0],
        });
        break;
      }
    }

    return { signals, claims };
  }

  // Verify marketing claims using Tavily web search with caching
  private async verifyClaim(claim: ManipulationClaim, productName: string): Promise<ManipulationClaim> {
    if (!this.tavilyClient) {
      return { ...claim, verified: false, verificationEvidence: "Tavily not configured" };
    }

    // Create cache key for this claim verification
    const verificationKey = `verify:${productName}:${claim.type}:${claim.claim}`;

    // Check LangCache for cached verification
    if (this.langCache) {
      try {
        const cacheResult = await this.langCache.search({
          prompt: `Verify marketing claim: ${productName} ${claim.type} "${claim.claim}"`,
          similarityThreshold: 0.90, // High threshold for claim verification
        });

        const cacheArray = Array.isArray(cacheResult)
          ? cacheResult
          : (cacheResult && typeof cacheResult === 'object' && 'results' in cacheResult
            ? (cacheResult as any).results
            : []);

        if (cacheArray.length > 0 && cacheArray[0]?.response) {
          try {
            const cached = JSON.parse(cacheArray[0].response);
            // Verify it's a valid claim verification result
            if (cached && (cached.verified !== undefined || cached.verificationEvidence)) {
              console.log(`✅ [LANGCA CHE] Claim verification CACHE HIT for "${claim.claim}"`);
              return { ...claim, ...cached, cached: true };
            }
          } catch (parseErr) {
            // Invalid cache, continue with fresh verification
          }
        }
      } catch (err: any) {
        console.warn("⚠️ [LANGCA CHE] LangCache search error for claim verification:", err.message);
        // Continue with fresh verification if cache fails
      }
    }

    // Cache miss - perform fresh verification
    console.log(`🔍 [LANGCA CHE] Claim verification CACHE MISS - verifying "${claim.claim}" with Tavily`);
    try {
      // Build verification query
      const verificationQuery = `${productName} ${claim.type} ${claim.claim} verify check`;
      
      // Search for evidence
      const result = await this.tavilyClient.search(verificationQuery, {
        searchDepth: "advanced",
        maxResults: 5,
      });

      // Analyze results to determine if claim is verified or debunked
      // Handle Tavily search response - it may have results array or be the array itself
      const results = Array.isArray(result) ? result : (result.results || []);
      let evidenceFound = false;
      let evidenceText = "";

      for (const res of results) {
        const content = (res.content || "").toLowerCase();
        const title = (res.title || "").toLowerCase();
        const combined = content + " " + title;

        // Look for evidence that contradicts the claim
        const debunkingTerms = ["not true", "false", "misleading", "scam", "fake", "exaggerated", "not verified"];
        const verifyingTerms = ["confirmed", "verified", "true", "legitimate", "real"];

        const hasDebunking = debunkingTerms.some(term => combined.includes(term));
        const hasVerifying = verifyingTerms.some(term => combined.includes(term));

        if (hasDebunking) {
          evidenceFound = true;
          evidenceText = `Found evidence suggesting this claim may be misleading: ${res.title}`;
          break;
        } else if (hasVerifying && !hasDebunking) {
          evidenceFound = true;
          evidenceText = `Found supporting evidence: ${res.title}`;
        }
      }

      // If no clear evidence, check if the claim type is inherently suspicious
      const suspiciousTypes = ["Urgency/scarcity pressure", "Fake exclusivity claims", "Impulse purchase triggers"];
      if (suspiciousTypes.includes(claim.type) && !evidenceFound) {
        evidenceText = `This type of claim (${claim.type}) is commonly used in marketing and may not reflect actual scarcity or exclusivity.`;
      }

      const verifiedClaim = {
        ...claim,
        verified: evidenceFound && !evidenceText.includes("misleading"),
        verificationEvidence: evidenceText || "No clear verification found",
        cached: false,
      };

      // Cache the verification result
      if (this.langCache) {
        try {
          await this.langCache.set({
            prompt: `Verify marketing claim: ${productName} ${claim.type} "${claim.claim}"`,
            response: JSON.stringify(verifiedClaim),
          });
          console.log(`💾 [LANGCA CHE] Cached claim verification for "${claim.claim}"`);
        } catch (cacheErr: any) {
          console.warn("Failed to cache claim verification:", cacheErr.message);
          // Continue without caching
        }
      }

      return verifiedClaim;
    } catch (err: any) {
      return {
        ...claim,
        verified: false,
        verificationEvidence: `Verification failed: ${err.message}`,
        cached: false,
      };
    }
  }

  // Analyze price drop likelihood and provide detailed reasoning
  private async analyzePriceDropLikelihood(
    productName: string,
    currentPrice?: number
  ): Promise<{
    likelihood: "high" | "medium" | "low";
    reasons: string[];
    scoreAdjustment: number;
  }> {
    if (!this.tavilyClient) {
      return {
        likelihood: "medium",
        reasons: ["Unable to analyze price trends - web search not available"],
        scoreAdjustment: 0,
      };
    }

    const reasons: string[] = [];
    let likelihood: "high" | "medium" | "low" = "medium";
    let evidencePoints = 0;

    try {
      // Search for product lifecycle information
      const lifecycleQuery = `${productName} product lifecycle release date new version upcoming`;
      const lifecycleResult = await this.tavilyClient.search(lifecycleQuery, {
        searchDepth: "advanced",
        maxResults: 5,
      });

      const lifecycleResults = Array.isArray(lifecycleResult) ? lifecycleResult : (lifecycleResult.results || []);
      
      for (const result of lifecycleResults) {
        const content = (result.content || "").toLowerCase();
        const title = (result.title || "").toLowerCase();
        const combined = content + " " + title;

        // Check for new version/upcoming release indicators
        if (combined.match(/\b(new version|upcoming|release|refresh|model|generation|next|coming soon)\b/i)) {
          if (!reasons.some(r => r.includes("new version"))) {
            reasons.push("New version or refresh may be coming soon, which typically causes current model prices to drop 15-30%");
            evidencePoints += 3;
          }
        }

        // Check for product age indicators
        const yearMatch = combined.match(/\b(20\d{2})\b/);
        if (yearMatch) {
          const mentionedYear = parseInt(yearMatch[1]);
          const currentYear = new Date().getFullYear();
          const age = currentYear - mentionedYear;
          
          if (age >= 2 && age <= 4) {
            if (!reasons.some(r => r.includes("product age"))) {
              reasons.push(`Product is approximately ${age} years old - nearing typical discount period as newer models approach`);
              evidencePoints += 2;
            }
          } else if (age > 4) {
            if (!reasons.some(r => r.includes("older product"))) {
              reasons.push(`Product appears to be ${age}+ years old - likely at maximum discount, but may drop further during clearance`);
              evidencePoints += 1;
            }
          }
        }
      }

      // Search for seasonal/competitive pricing trends
      const trendsQuery = `${productName} price drop discount sale trend competitor pricing`;
      const trendsResult = await this.tavilyClient.search(trendsQuery, {
        searchDepth: "advanced",
        maxResults: 5,
      });

      const trendsResults = Array.isArray(trendsResult) ? trendsResult : (trendsResult.results || []);

      for (const result of trendsResults) {
        const content = (result.content || "").toLowerCase();
        const title = (result.title || "").toLowerCase();
        const combined = content + " " + title;

        // Check for competitive pressure
        if (combined.match(/\b(competitor|rival|alternative|similar product|cheaper|price war|market competition)\b/i)) {
          if (!reasons.some(r => r.includes("competition"))) {
            reasons.push("High competition in this product category may drive prices down as retailers compete");
            evidencePoints += 2;
          }
        }

        // Check for seasonal trends
        const currentMonth = new Date().getMonth(); // 0-11
        const monthNames = ["january", "february", "march", "april", "may", "june", 
                           "july", "august", "september", "october", "november", "december"];
        
        // Black Friday / Holiday season (Oct-Dec)
        if (currentMonth >= 9 && currentMonth <= 11) {
          if (!reasons.some(r => r.includes("holiday"))) {
            reasons.push(`Holiday shopping season (${monthNames[currentMonth]}) typically brings major sales - waiting 2-8 weeks may yield 20-40% discounts`);
            evidencePoints += 4;
          }
        }
        // Post-holiday clearance (Jan-Feb)
        else if (currentMonth === 0 || currentMonth === 1) {
          if (!reasons.some(r => r.includes("clearance"))) {
            reasons.push(`Post-holiday clearance period (${monthNames[currentMonth]}) often has steep discounts as retailers clear inventory`);
            evidencePoints += 3;
          }
        }
        // Back-to-school / summer sales
        else if (currentMonth >= 6 && currentMonth <= 8) {
          if (!reasons.some(r => r.includes("summer"))) {
            reasons.push(`Summer sales period (${monthNames[currentMonth]}) often includes promotional pricing for electronics and popular items`);
            evidencePoints += 2;
          }
        }

        // Check for technology/electronics specific trends
        if (combined.match(/\b(electronics|tech|smartphone|laptop|gadget)\b/i)) {
          if (!reasons.some(r => r.includes("tech lifecycle"))) {
            reasons.push("Electronics typically see price drops 6-12 months after release as manufacturing costs decrease and competition increases");
            evidencePoints += 2;
          }
        }
      }

      // Search for price history and patterns
      if (currentPrice) {
        const priceHistoryQuery = `${productName} price history chart lowest price best deal`;
        try {
          const priceResult = await this.tavilyClient.search(priceHistoryQuery, {
            searchDepth: "advanced",
            maxResults: 3,
          });

          const priceResults = Array.isArray(priceResult) ? priceResult : (priceResult.results || []);

          for (const result of priceResults) {
            const content = (result.content || "").toLowerCase();
            if (content.match(/\b(lowest|best price|price drop|discount|sale|clearance)\b/i)) {
              if (!reasons.some(r => r.includes("price history"))) {
                reasons.push("Price tracking suggests this product has had significant discounts in the past - current price may not be optimal");
                evidencePoints += 2;
              }
            }
          }
        } catch (err) {
          // Continue without price history
        }
      }

      // Determine likelihood based on evidence points
      if (evidencePoints >= 7) {
        likelihood = "high";
      } else if (evidencePoints >= 4) {
        likelihood = "medium";
      } else {
        likelihood = "low";
      }

      // Add default reasoning if no specific reasons found
      if (reasons.length === 0) {
        reasons.push("Standard market dynamics suggest prices may fluctuate, but no strong indicators of imminent price drops");
        reasons.push("Consider setting up price alerts if you're interested in this product");
      }

    } catch (err: any) {
      console.warn("Error analyzing price drop likelihood:", err);
      reasons.push("Unable to complete detailed price trend analysis - web search encountered an error");
    }

    return {
      likelihood,
      reasons,
      scoreAdjustment: 0, // Score adjustment handled in generateRecommendation
    };
  }

  private async generateRecommendation(
    productInfo: any,
    manipulationSignals: string[],
    manipulationClaims: ManipulationClaim[],
    alternatives: ProductAnalysis["alternatives"],
    userPrefs: UserPreferences,
    productName: string
  ): Promise<ProductAnalysis["recommendation"]> {
    let score = 75.0; // Start with a positive score (higher = better to buy) - assume it's reasonable unless proven otherwise
    const reasoningParts: string[] = [];
    const scoreBreakdown: string[] = [];
    
    // Analyze price drop likelihood and reasons
    let priceDropAnalysis: {
      likelihood: "high" | "medium" | "low";
      reasons: string[];
      scoreAdjustment: number;
    } = {
      likelihood: "medium",
      reasons: [],
      scoreAdjustment: 0,
    };

    // Analyze price drop likelihood using Tavily if available
    if (this.tavilyClient && productName) {
      try {
        priceDropAnalysis = await this.analyzePriceDropLikelihood(productName, productInfo.price);
        
        // Adjust score based on price drop likelihood (reduces score to suggest waiting)
        if (priceDropAnalysis.likelihood === "high") {
          score -= 12.5; // More precise: suggest waiting if high likelihood of price drop
          scoreBreakdown.push(`-12.5 points: High likelihood of price drop (see analysis below)`);
        } else if (priceDropAnalysis.likelihood === "medium") {
          score -= 6.3; // Moderate suggestion to wait
          scoreBreakdown.push(`-6.3 points: Moderate likelihood of price drop`);
        } else {
          // Low likelihood - no adjustment needed, product is likely at good price
          scoreBreakdown.push(`+0 points: Low likelihood of price drop - current price appears stable`);
        }
      } catch (err) {
        console.warn("Failed to analyze price drop likelihood:", err);
        // Continue without price drop analysis - assume neutral
      }
    }

    // Build detailed reasoning for manipulation signals (with precise deductions)
    if (manipulationClaims.length > 0) {
      // More precise scoring: base deduction per claim, with severity adjustments
      let totalDeduction = 0;
      
      for (const claim of manipulationClaims) {
        let claimDeduction = 14.5; // Base deduction per claim
        
        // Adjust based on claim type severity
        if (claim.type === "Urgency/scarcity pressure") {
          claimDeduction += 2.3; // More severe
        } else if (claim.type === "Price manipulation tactics") {
          claimDeduction += 1.8; // Moderately severe
        } else if (claim.type === "Fake exclusivity claims") {
          claimDeduction += 1.5;
        }
        
        // Additional deduction if claim is verified as false/misleading
        if (claim.verified === false || claim.verificationEvidence?.includes("misleading")) {
          claimDeduction += 3.2; // Extra penalty for verified false claims
        }
        
        totalDeduction += claimDeduction;
      }
      
      score -= totalDeduction;
      
      const roundedDeduction = Math.round(totalDeduction * 10) / 10;
      reasoningParts.push(`\n🚨 MARKETING CLAIMS DETECTED (${roundedDeduction.toFixed(1)} points deducted):`);
      scoreBreakdown.push(`-${roundedDeduction.toFixed(1)} points: ${manipulationClaims.length} marketing claim(s) detected with severity analysis`);

      for (const claim of manipulationClaims) {
        reasoningParts.push(`\n  • "${claim.foundText}" - ${claim.type}`);
        
        if (claim.verificationEvidence) {
          if (claim.verified === false || claim.verificationEvidence.includes("misleading") || claim.verificationEvidence.includes("commonly used")) {
            reasoningParts.push(`    ❌ VERIFICATION: ${claim.verificationEvidence}`);
            reasoningParts.push(`    This claim appears to be a marketing tactic and may not be accurate.`);
          } else {
            reasoningParts.push(`    ✅ VERIFICATION: ${claim.verificationEvidence}`);
          }
        }
      }
    }

    // Build reasoning for alternatives (with precise scoring)
    if (alternatives.length > 0) {
      // Calculate average savings to adjust deduction
      const avgSavings = alternatives
        .filter(alt => alt.savings && alt.savings > 0)
        .reduce((sum, alt) => sum + (alt.savings || 0), 0) / alternatives.length || 0;
      
      // More precise: base deduction + percentage based on savings
      let deduction = 9.5 * alternatives.length; // Base deduction per alternative
      
      // Additional deduction based on savings percentage
      if (productInfo.price && avgSavings > 0) {
        const savingsPercent = (avgSavings / productInfo.price) * 100;
        if (savingsPercent > 30) {
          deduction += 3.5 * alternatives.length; // High savings = more deduction
        } else if (savingsPercent > 15) {
          deduction += 1.8 * alternatives.length; // Medium savings
        }
      }
      
      score -= deduction;
      const roundedDeduction = Math.round(deduction * 10) / 10;
      reasoningParts.push(`\n💰 CHEAPER ALTERNATIVES FOUND (${roundedDeduction.toFixed(1)} points deducted):`);
      scoreBreakdown.push(`-${roundedDeduction.toFixed(1)} points: ${alternatives.length} cheaper alternative(s) available${avgSavings > 0 ? ` (avg savings: $${avgSavings.toFixed(2)})` : ''}`);
      reasoningParts.push(`  Found ${alternatives.length} cheaper or similar options that could save you money.`);
      
      // Show top alternatives
      const topAlternatives = alternatives.slice(0, 3);
      for (const alt of topAlternatives) {
        if (alt.savings && alt.savings > 0) {
          reasoningParts.push(`    - ${alt.description}: Save $${alt.savings.toFixed(2)} (${((alt.savings / (productInfo.price || 1)) * 100).toFixed(1)}% off)`);
        }
      }
    }

    // Build reasoning for budget (with precise scoring)
    if (
      userPrefs.budgetRange &&
      productInfo.price &&
      productInfo.price > userPrefs.budgetRange.max
    ) {
      const overage = productInfo.price - userPrefs.budgetRange.max;
      const overagePercent = (overage / userPrefs.budgetRange.max) * 100;
      
      // More precise: deduction scales with how much over budget
      let deduction = 18.5; // Base deduction
      if (overagePercent > 50) {
        deduction += 4.5; // Very over budget
      } else if (overagePercent > 25) {
        deduction += 2.3; // Moderately over budget
      }
      
      score -= deduction;
      const roundedDeduction = Math.round(deduction * 10) / 10;
      reasoningParts.push(`\n💸 OVER BUDGET (${roundedDeduction.toFixed(1)} points deducted):`);
      scoreBreakdown.push(`-${roundedDeduction.toFixed(1)} points: Price ($${productInfo.price.toFixed(2)}) exceeds your budget ($${userPrefs.budgetRange.max}) by $${overage.toFixed(2)} (${overagePercent.toFixed(1)}%)`);
      reasoningParts.push(`  This product costs $${productInfo.price.toFixed(2)}, which exceeds your budget of $${userPrefs.budgetRange.max} by $${overage.toFixed(2)}.`);
    }

    // Add price drop analysis to reasoning
    if (priceDropAnalysis.reasons.length > 0) {
      reasoningParts.push(`\n📉 PRICE DROP ANALYSIS (${priceDropAnalysis.likelihood.toUpperCase()} likelihood):`);
      
      for (const reason of priceDropAnalysis.reasons) {
        reasoningParts.push(`  • ${reason}`);
      }
      
      reasoningParts.push(`\n  💡 RECOMMENDATION: ${priceDropAnalysis.likelihood === "high" ? "Consider waiting - prices are likely to drop soon due to the factors above." : priceDropAnalysis.likelihood === "medium" ? "Prices may drop in the near future. Consider waiting if you're not in urgent need." : "Price stability is expected, though minor discounts may occur."}`);
    }

    // Add positive points for clean products (no manipulation, good indicators)
    let positiveFactors = 0;
    
    if (manipulationClaims.length === 0) {
      // No manipulation detected - this is good!
      const bonus = 5.0;
      score += bonus;
      positiveFactors++;
      scoreBreakdown.push(`+${bonus.toFixed(1)} points: No marketing manipulation tactics detected`);
      reasoningParts.push(`\n✅ CLEAN PRODUCT INDICATORS:`);
      reasoningParts.push(`  • No urgency/scarcity pressure detected`);
      reasoningParts.push(`  • No fake exclusivity claims found`);
      reasoningParts.push(`  • No aggressive impulse triggers identified`);
      reasoningParts.push(`  • Marketing appears straightforward and honest`);
    }
    
    if (alternatives.length === 0) {
      // No cheaper alternatives found - this suggests it's a good price
      const bonus = 3.5;
      score += bonus;
      positiveFactors++;
      scoreBreakdown.push(`+${bonus.toFixed(1)} points: No cheaper alternatives found - current price appears competitive`);
      reasoningParts.push(`\n💰 PRICE COMPETITIVENESS:`);
      reasoningParts.push(`  • No cheaper alternatives detected in the market`);
      reasoningParts.push(`  • Current price appears competitive`);
    }
    
    if (userPrefs.budgetRange && productInfo.price && productInfo.price <= userPrefs.budgetRange.max) {
      // Within budget - positive indicator
      const bonus = 4.0;
      score += bonus;
      positiveFactors++;
      const remainingBudget = userPrefs.budgetRange.max - productInfo.price;
      scoreBreakdown.push(`+${bonus.toFixed(1)} points: Within your budget ($${remainingBudget.toFixed(2)} remaining)`);
      reasoningParts.push(`\n✅ WITHIN BUDGET:`);
      reasoningParts.push(`  • Price ($${productInfo.price.toFixed(2)}) is within your budget ($${userPrefs.budgetRange.max})`);
      reasoningParts.push(`  • You have $${remainingBudget.toFixed(2)} remaining in your budget`);
    }
    
    if (positiveFactors >= 3) {
      reasoningParts.push(`\n✅ MULTIPLE POSITIVE INDICATORS: This product shows good signs - honest marketing, competitive pricing, and fits your budget.`);
    }

    // Clamp score to 2 decimal places
    score = Math.max(0.0, Math.min(100.0, Math.round(score * 100) / 100));

    // Determine verdict and build final reasoning
    // Adjusted thresholds: Higher scores = better to buy, but we're more lenient now
    let verdict: "buy" | "wait" | "avoid" | "find-alternative" = "buy";
    let summaryReasoning = "";

    if (score < 30) {
      verdict = "avoid";
      summaryReasoning = "❌ STRONG RECOMMENDATION TO AVOID";
    } else if (score < 50) {
      verdict = "find-alternative";
      summaryReasoning = "⚠️ CONSIDER ALTERNATIVES";
    } else if (score < 75) {
      verdict = "wait";
      summaryReasoning = "⏳ CONSIDER WAITING - Some concerns detected";
    } else {
      // Score >= 75: Good to buy
      verdict = "buy";
      if (score >= 85) {
        summaryReasoning = "✅ EXCELLENT PURCHASE - Strong recommendation to buy";
      } else {
        summaryReasoning = "✅ GOOD PURCHASE - Reasonable to buy";
      }
    }

    // Build complete reasoning with precise score
    const preciseScore = score.toFixed(2);
    const detailedReasoning = `
📊 SCORE BREAKDOWN: ${preciseScore}/100
${scoreBreakdown.length > 0 ? scoreBreakdown.join('\n') : 'No adjustments applied'}

${reasoningParts.join('\n')}

${summaryReasoning}

📈 FINAL ASSESSMENT:
Final Score: ${preciseScore}/100
${score < 30 ? '🚨 MULTIPLE RED FLAGS DETECTED: This product shows significant manipulation tactics, better alternatives exist, and waiting may save you money. Strong recommendation to avoid or find alternatives.' : ''}
${score >= 30 && score < 50 ? '⚠️ HIGH RISK PURCHASE: Better alternatives are available, and price drops are likely. Consider waiting or choosing an alternative to save money.' : ''}
${score >= 50 && score < 75 ? '🤔 MODERATE CONCERNS: Some concerns detected. Take time to consider alternatives and potential price drops. Not urgent - waiting may benefit you.' : ''}
${score >= 75 && score < 85 ? '✅ GOOD PURCHASE: No major red flags detected. This appears to be a reasonable purchase. As always, consider if you really need it, but there\'s no strong reason to avoid or wait.' : ''}
${score >= 85 ? '✅ EXCELLENT PURCHASE: Clean product with honest marketing, competitive pricing, and no major concerns. Strong recommendation to proceed with purchase if you need this item.' : ''}
    `.trim();

    return {
      score,
      reasoning: summaryReasoning,
      detailedReasoning,
      verdict,
    };
  }

  private isRedisReady(): boolean {
    return this.redis !== null && this.redis.status === "ready";
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    if (!this.isRedisReady() || !this.redis) {
      return {};
    }
    try {
      const data = await this.redis.get(`user:${userId}:preferences`);
      return data ? JSON.parse(data) : {};
    } catch (err) {
      console.error("Error getting user preferences:", err);
      return {};
    }
  }

  async setUserPreferences(
    userId: string,
    prefs: UserPreferences
  ): Promise<void> {
    if (!this.isRedisReady() || !this.redis) {
      return;
    }
    try {
      await this.redis.set(
        `user:${userId}:preferences`,
        JSON.stringify(prefs)
      );
    } catch (err) {
      console.error("Error setting user preferences:", err);
    }
  }
}
