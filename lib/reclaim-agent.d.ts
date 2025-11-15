interface UserPreferences {
    budgetRange?: {
        min: number;
        max: number;
    };
    values?: string[];
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
    cached?: boolean;
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
        score: number;
        reasoning: string;
        detailedReasoning?: string;
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
export declare class ReclaimAgent {
    private tavilyClient;
    private redis;
    private langCache;
    constructor();
    getActionsMetadata(): CopilotActionMetadata[];
    getActions(): {
        analyzeProduct: (url: string, userId?: string) => Promise<ProductAnalysis>;
        crawlWithTavily: (url: string) => Promise<any>;
        searchAlternatives: (productName: string, additionalTerms?: string) => Promise<any>;
        getUserSession: (userId: string) => Promise<any>;
        storeAnalysis: (userId: string, analysis: ProductAnalysis) => Promise<void>;
        getBrowsingHistory: (userId: string, limit?: number) => Promise<any[]>;
        updateUserPreferences: (userId: string, preferences: Partial<UserPreferences>) => Promise<void>;
        createPriceAlert: (userId: string, productId: string, threshold: number) => Promise<void>;
    };
    crawlWithTavily(url: string): Promise<any>;
    searchAlternatives(productName: string, additionalTerms?: string): Promise<any>;
    getUserSession(userId: string): Promise<any>;
    storeAnalysis(userId: string, analysis: ProductAnalysis): Promise<void>;
    getBrowsingHistory(userId: string, limit?: number): Promise<any[]>;
    updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void>;
    createPriceAlert(userId: string, productId: string, threshold: number): Promise<void>;
    analyzeProduct(url: string, userId?: string): Promise<ProductAnalysis>;
    private detectManipulation;
    private verifyClaim;
    private generateRecommendation;
    private isRedisReady;
    getUserPreferences(userId: string): Promise<UserPreferences>;
    setUserPreferences(userId: string, prefs: UserPreferences): Promise<void>;
}
export {};
//# sourceMappingURL=reclaim-agent.d.ts.map