/**
 * Search Alternatives Example
 * Shows how to search for product alternatives
 */

import { ReclaimTool } from "../lib/reclaim-tool";

async function searchAlternativesExample() {
  const tool = new ReclaimTool();
  const productName = "iPhone 15 Pro";

  console.log(`Searching for alternatives to: ${productName}\n`);

  // Search for used versions
  console.log("=== Searching for Used Versions ===");
  const usedResults = await tool.searchAlternatives(
    productName,
    "used pre-owned secondhand"
  );
  console.log(`Found ${usedResults.results?.length || 0} results`);
  usedResults.results?.slice(0, 3).forEach((result: any, idx: number) => {
    console.log(`${idx + 1}. ${result.title}`);
    console.log(`   URL: ${result.url}`);
  });

  // Search for refurbished versions
  console.log("\n=== Searching for Refurbished Versions ===");
  const refurbishedResults = await tool.searchAlternatives(
    productName,
    "refurbished renewed open box"
  );
  console.log(`Found ${refurbishedResults.results?.length || 0} results`);
  refurbishedResults.results?.slice(0, 3).forEach((result: any, idx: number) => {
    console.log(`${idx + 1}. ${result.title}`);
    console.log(`   URL: ${result.url}`);
  });

  // Search for cheaper alternatives
  console.log("\n=== Searching for Cheaper Alternatives ===");
  const cheaperResults = await tool.searchAlternatives(
    productName,
    "cheaper alternative budget"
  );
  console.log(`Found ${cheaperResults.results?.length || 0} results`);
  cheaperResults.results?.slice(0, 3).forEach((result: any, idx: number) => {
    console.log(`${idx + 1}. ${result.title}`);
    console.log(`   URL: ${result.url}`);
  });
}

searchAlternativesExample().catch(console.error);

