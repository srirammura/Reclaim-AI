#!/bin/bash

# Test Reclaim AI API endpoints

API_URL="http://localhost:3000"
PRODUCT_URL="${1:-https://www.amazon.com/dp/B08N5WRWNW}"

echo "🧪 Testing Reclaim AI API"
echo "========================"
echo ""

# Test analyze endpoint
echo "📊 Testing /api/analyze..."
echo "Product URL: $PRODUCT_URL"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$PRODUCT_URL\"}")

if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
    echo "✅ Analysis successful!"
    echo ""
    echo "📋 Results:"
    echo "$RESPONSE" | jq '{
        title: .title,
        price: .price,
        manipulationSignals: .manipulationSignals,
        alternativesCount: (.alternatives | length),
        recommendation: .recommendation.verdict,
        score: .recommendation.score
    }' 2>/dev/null || echo "$RESPONSE" | head -20
fi

echo ""
echo "💾 Testing Redis connection..."
if command -v redis-cli &> /dev/null && redis-cli ping &> /dev/null; then
    echo "✅ Redis is connected"
    echo ""
    echo "Recent keys:"
    redis-cli KEYS "session:*" | head -5
    redis-cli KEYS "user:*:history" | head -5
else
    echo "⚠️  Redis not available"
fi

echo ""
echo "✅ Testing complete!"

