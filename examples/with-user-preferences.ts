/**
 * Example with User Preferences
 * Shows how to use personalized features
 */

import { ReclaimTool } from "../lib/reclaim-tool";

async function personalizedExample() {
  const tool = new ReclaimTool();
  const userId = "user123";

  // Set user preferences
  await tool.setUserPreferences(userId, {
    budgetRange: { min: 0, max: 500 },
    values: ["sustainability", "value"],
    categories: ["electronics"],
  });

  console.log("✅ User preferences set");

  // Analyze product with user context
  const analysis = await tool.analyzeProduct(
    "https://www.amazon.com/dp/B08N5WRWNW",
    userId
  );

  console.log(`\nRecommendation: ${analysis.recommendation.verdict}`);
  console.log(`Score: ${analysis.recommendation.score}/100`);
  
  // Check if product is within budget
  if (analysis.price) {
    const userPrefs = await tool.getUserPreferences(userId);
    if (userPrefs.budgetRange) {
      const inBudget = analysis.price <= userPrefs.budgetRange.max;
      console.log(`\nWithin Budget: ${inBudget ? "✅ Yes" : "❌ No"}`);
      console.log(`Product Price: $${analysis.price}`);
      console.log(`Budget Max: $${userPrefs.budgetRange.max}`);
    }
  }

  // Get browsing history
  const history = await tool.getBrowsingHistory(userId, 5);
  console.log(`\n📚 Browsing History (${history.length} items):`);
  history.forEach((item: any, idx: number) => {
    console.log(`${idx + 1}. ${item.title || item.url}`);
  });
}

personalizedExample().catch(console.error);

