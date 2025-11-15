"use client";

import { useState } from "react";

interface ManipulationClaim {
  type: string;
  claim: string;
  foundText: string;
  verified?: boolean;
  verificationEvidence?: string;
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
}

export default function ProductAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a product URL");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze product");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze product"
      );
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "avoid":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "wait":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "find-alternative":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "buy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Analyze a Product
        </h2>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a product URL here..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {analysis.title || "Product Analysis"}
                </h3>
                {analysis.price && (
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {analysis.currency || "$"}
                    {analysis.price.toFixed(2)}
                  </p>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getVerdictColor(
                  analysis.recommendation.verdict
                )}`}
              >
                {analysis.recommendation.verdict.toUpperCase()}
              </span>
            </div>

            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">
                {analysis.recommendation.reasoning}
              </p>
              
              {analysis.recommendation.detailedReasoning && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    📊 Detailed Analysis:
                  </h4>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {analysis.recommendation.detailedReasoning}
                  </pre>
                </div>
              )}
              
              <div className="mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Recommendation Score: {analysis.recommendation.score}/100
                </span>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      analysis.recommendation.score < 30
                        ? "bg-red-600"
                        : analysis.recommendation.score < 50
                        ? "bg-orange-600"
                        : analysis.recommendation.score < 70
                        ? "bg-yellow-600"
                        : "bg-green-600"
                    }`}
                    style={{
                      width: `${analysis.recommendation.score}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {analysis.manipulationClaims && analysis.manipulationClaims.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3">
                  🚨 Marketing Claims Detected & Verified:
                </h4>
                <div className="space-y-3">
                  {analysis.manipulationClaims.map((claim, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-700">
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                        <div className="flex-1">
                          <p className="font-medium text-red-800 dark:text-red-300">
                            "{claim.foundText}"
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                            Type: {claim.type}
                          </p>
                          {claim.verificationEvidence && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <p className={`text-xs font-medium ${
                                claim.verified === false || claim.verificationEvidence.includes("misleading") || claim.verificationEvidence.includes("commonly used")
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}>
                                {claim.verified === false || claim.verificationEvidence.includes("misleading") || claim.verificationEvidence.includes("commonly used")
                                  ? "❌ VERIFICATION:"
                                  : "✅ VERIFICATION:"}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {claim.verificationEvidence}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.manipulationSignals.length > 0 && (!analysis.manipulationClaims || analysis.manipulationClaims.length === 0) && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                  ⚠️ Manipulation Signals Detected:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300">
                  {analysis.manipulationSignals.map((signal, idx) => (
                    <li key={idx}>{signal}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.alternatives.length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">
                  🌱 Mindful Alternatives:
                </h4>
                <div className="space-y-2">
                  {analysis.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-gray-700 rounded border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">
                            {alt.type}
                          </span>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">
                            {alt.description}
                          </p>
                        </div>
                        {alt.url && (
                          <a
                            href={alt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 dark:text-green-400 hover:underline ml-4"
                          >
                            View →
                          </a>
                        )}
                      </div>
                      {alt.savings && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          Save ${alt.savings.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

