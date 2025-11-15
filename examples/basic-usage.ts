/**
 * Basic Usage Example
 * How to use ReclaimTool directly in your code
 */

import { ReclaimTool } from "../lib/reclaim-tool";

async function basicExample() {
  // Initialize the tool with optional config
  const tool = new ReclaimTool({
    tavilyApiKey: process.env.TAVILY_API_KEY,
    langCacheHost: process.env.REDIS_LANGCACHE_HOST,
    langCacheApiKey: process.env.REDIS_LANGCACHE_API_KEY,
    langCacheId: process.env.REDIS_LANGCACHE_ID,
  });

  // Analyze a product
  const productUrl = "https://www.amazon.com/dp/B08N5WRWNW";
  console.log(`Analyzing product: ${productUrl}`);
  
  const analysis = await tool.analyzeProduct(productUrl);
  
  console.log("\n=== Analysis Results ===");
  console.log(`Title: ${analysis.title}`);
  console.log(`Price: ${analysis.price}`);
  console.log(`Score: ${analysis.recommendation.score}/100`);
  console.log(`Verdict: ${analysis.recommendation.verdict}`);
  console.log(`Reasoning: ${analysis.recommendation.reasoning}`);
  
  if (analysis.manipulationClaims && analysis.manipulationClaims.length > 0) {
    console.log("\n=== Marketing Claims Detected ===");
    analysis.manipulationClaims.forEach((claim, idx) => {
      console.log(`${idx + 1}. ${claim.foundText} - ${claim.type}`);
      if (claim.verificationEvidence) {
        console.log(`   Evidence: ${claim.verificationEvidence}`);
      }
    });
  }
  
  if (analysis.alternatives.length > 0) {
    console.log("\n=== Alternatives Found ===");
    analysis.alternatives.forEach((alt, idx) => {
      console.log(`${idx + 1}. ${alt.description}`);
      console.log(`   URL: ${alt.url}`);
      if (alt.price) {
        console.log(`   Price: $${alt.price}`);
        if (alt.savings) {
          console.log(`   Savings: $${alt.savings.toFixed(2)}`);
        }
      }
    });
  }
}

// Run example
basicExample().catch(console.error);

