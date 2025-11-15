"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import ProductAnalyzer from "@/components/ProductAnalyzer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Reclaim AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Purpose over purchase
          </p>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            An autonomous anti-consumerism agent that helps you make mindful decisions.
            We detect manipulative patterns, suggest alternatives, and help you avoid
            impulse purchases.
          </p>
        </div>

        <ProductAnalyzer />

        <CopilotSidebar
          defaultOpen={false}
          labels={{
            title: "Reclaim AI Assistant",
            initial: "I'm here to help you make mindful purchasing decisions. Share a product URL or ask me about alternatives, price alerts, or sustainable options.",
          }}
        />
      </main>
    </div>
  );
}
