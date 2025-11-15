# Testing Guide

## Prerequisites

1. ✅ Redis server running
2. ✅ Tavily API key set in `.env.local`
3. ✅ Development server running (`npm run dev`)

## Test Scenarios

### 1. Basic Product Analysis

**Test URL:** Any e-commerce product URL (Amazon, Best Buy, etc.)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.amazon.com/dp/B08N5WRWNW"}'
```

**Expected:**
- Product info extracted
- Manipulation signals detected (if any)
- Alternatives found
- Recommendation generated
- Analysis stored in Redis (if user ID provided)

### 2. Tavily Web Crawling

Test the Tavily integration directly:

```bash
# Via CopilotKit sidebar
"Can you crawl this URL: https://example.com/product"
```

Or test via API:

```typescript
const agent = new ReclaimAgent();
const result = await agent.crawlWithTavily("https://example.com");
console.log(result);
```

**Expected:**
- Content extracted from URL
- Title and description available
- Price detected (if present)

### 3. Alternative Search

Test searching for alternatives:

```bash
# Via CopilotKit sidebar
"Find used alternatives for iPhone 15"
```

**Expected:**
- Search results from Tavily
- Used/refurbished options found
- Links to alternative products

### 4. Redis State Management

Test Redis functionality:

```bash
# Create user session
redis-cli SET "session:test-user" '{"userId":"test-user","createdAt":1234567890}'

# Store analysis
redis-cli SET "analysis:test-user:1234567890" '{"url":"https://example.com","title":"Test Product"}'

# Get browsing history
redis-cli LRANGE "user:test-user:history" 0 -1
```

### 5. User Preferences

Test preference management:

```bash
# Via CopilotKit sidebar
"Set my budget to $500 maximum"
"Update my preferences to value sustainability"
```

**Expected:**
- Preferences stored in Redis
- Preferences applied to recommendations
- Budget checks working

### 6. Price Alerts

Test price alert creation:

```bash
# Via CopilotKit sidebar
"Create a price alert for this product at $100"
```

**Expected:**
- Alert stored in Redis
- Alert associated with user
- Alert can be retrieved later

## Integration Testing

### End-to-End Workflow

1. **User visits product page**
   - Analyze product via UI
   - Check Redis for stored analysis
   - Verify Tavily crawling worked

2. **User interacts with CopilotKit**
   - Open sidebar
   - Ask to analyze product
   - Request alternatives
   - Check browsing history

3. **State Persistence**
   - Analyze multiple products
   - Check Redis for history
   - Verify session updates
   - Test preferences persistence

## Troubleshooting

### Tavily Not Working

```bash
# Check API key
echo $TAVILY_API_KEY

# Test Tavily directly
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your_key",
    "query": "test",
    "max_results": 1
  }'
```

### Redis Not Connecting

```bash
# Check Redis status
redis-cli ping

# Check connection
redis-cli INFO server

# Test connection from app
node -e "
const Redis = require('ioredis');
const r = new Redis();
r.ping().then(console.log).catch(console.error);
"
```

### CopilotKit Actions Not Working

- Check browser console for errors
- Verify `/api/copilotkit` route is accessible
- Check that actions are properly registered
- Verify action metadata is returned

## Performance Testing

### Load Test

```bash
# Test multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"https://example.com/product$i\"}" &
done
wait
```

### Redis Performance

```bash
# Monitor Redis
redis-cli --stat

# Check memory usage
redis-cli INFO memory
```

## Expected Behavior

✅ **Tavily Integration:**
- Successfully crawls product pages
- Extracts title, description, price
- Finds alternatives across marketplaces
- Handles errors gracefully with retries

✅ **Redis State Management:**
- Stores user sessions
- Maintains browsing history
- Saves product analyses
- Updates preferences
- Creates price alerts

✅ **CopilotKit Orchestration:**
- Exposes all actions
- Handles multi-step workflows
- Manages state between actions
- Provides helpful error messages

✅ **Product Analysis:**
- Detects manipulation signals
- Finds meaningful alternatives
- Generates honest recommendations
- Considers user preferences

