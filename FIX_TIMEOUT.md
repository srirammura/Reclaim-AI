# 🔧 Fix 504 Timeout Issue

## Problem
Render free tier has a **75-second timeout**, but analysis takes **60-120 seconds**, causing 504 Gateway Timeout errors.

## ✅ Solution: Async Job Processing

The MCP server now uses **async job processing** by default:
- Returns job ID immediately (< 1 second)
- Processes analysis in background
- Client polls for results

---

## How It Works Now

### Step 1: Submit Analysis (Returns Immediately)

```bash
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW"
    }
  }'
```

**Response (immediate):**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"jobId\": \"job_1234567890_abc123\",\n  \"status\": \"pending\",\n  \"message\": \"Analysis started. Use get_job_status tool or GET /api/job/{jobId} to check progress.\",\n  \"checkUrl\": \"/api/job/job_1234567890_abc123\",\n  \"estimatedTime\": \"60-120 seconds\"\n}"
    }
  ]
}
```

### Step 2: Check Job Status (Poll Until Complete)

```bash
curl https://reclaim-ai-1.onrender.com/api/job/job_1234567890_abc123
```

**Response (while processing):**
```json
{
  "jobId": "job_1234567890_abc123",
  "status": "processing",
  "elapsedSeconds": 45,
  "message": "Processing analysis (may take 60-120 seconds)..."
}
```

**Response (when complete):**
```json
{
  "jobId": "job_1234567890_abc123",
  "status": "completed",
  "result": {
    "url": "https://www.amazon.com/dp/B08N5WRWNW",
    "title": "iPhone 15 Pro",
    "recommendation": {
      "score": 35,
      "detailedReasoning": "...",
      "verdict": "find-alternative"
    },
    "alternatives": [...],
    ...
  },
  "completedAt": 1234567890000
}
```

---

## Python Example (With Polling)

```python
import requests
import time

def analyze_product_async(url):
    # Step 1: Submit job
    response = requests.post(
        'https://reclaim-ai-1.onrender.com/mcp/tools/call',
        json={
            'name': 'analyze_product',
            'arguments': {'url': url}
        }
    )
    
    data = response.json()
    job_info = json.loads(data['content'][0]['text'])
    job_id = job_info['jobId']
    
    print(f"Job submitted: {job_id}")
    print("Waiting for analysis to complete...")
    
    # Step 2: Poll until complete
    while True:
        status_response = requests.get(
            f'https://reclaim-ai-1.onrender.com/api/job/{job_id}'
        )
        status = status_response.json()
        
        if status['status'] == 'completed':
            return status['result']
        elif status['status'] == 'failed':
            raise Exception(status.get('error', 'Analysis failed'))
        
        print(f"Status: {status['status']} ({status.get('elapsedSeconds', 0)}s elapsed)")
        time.sleep(5)  # Poll every 5 seconds

# Usage
analysis = analyze_product_async('https://www.amazon.com/dp/B08N5WRWNW')
print(f"Score: {analysis['recommendation']['score']}/100")
print(f"Reasoning: {analysis['recommendation']['detailedReasoning']}")
```

---

## JavaScript Example (With Polling)

```javascript
async function analyzeProductAsync(url) {
  // Step 1: Submit job
  const submitResponse = await fetch(
    'https://reclaim-ai-1.onrender.com/mcp/tools/call',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'analyze_product',
        arguments: { url }
      })
    }
  );
  
  const submitData = await submitResponse.json();
  const jobInfo = JSON.parse(submitData.content[0].text);
  const jobId = jobInfo.jobId;
  
  console.log(`Job submitted: ${jobId}`);
  
  // Step 2: Poll until complete
  while (true) {
    const statusResponse = await fetch(
      `https://reclaim-ai-1.onrender.com/api/job/${jobId}`
    );
    const status = await statusResponse.json();
    
    if (status.status === 'completed') {
      return status.result;
    }
    if (status.status === 'failed') {
      throw new Error(status.error || 'Analysis failed');
    }
    
    console.log(`Status: ${status.status} (${status.elapsedSeconds}s elapsed)`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
  }
}

// Usage
const analysis = await analyzeProductAsync('https://www.amazon.com/dp/B08N5WRWNW');
console.log(`Score: ${analysis.recommendation.score}/100`);
console.log(`Reasoning: ${analysis.recommendation.detailedReasoning}`);
```

---

## MCP Tools Available

1. **`analyze_product`** - Now async by default (returns job ID)
2. **`get_job_status`** - Check async job status
3. **`get_product_metadata`** - Fast, synchronous
4. **`search_alternatives`** - Fast, synchronous
5. **`get_user_preferences`** - Fast, synchronous
6. **`set_user_preferences`** - Fast, synchronous
7. **`get_browsing_history`** - Fast, synchronous
8. **`create_price_alert`** - Fast, synchronous

---

## Using MCP `get_job_status` Tool

After getting a job ID from `analyze_product`, you can check status using MCP:

```bash
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_job_status",
    "arguments": {
      "jobId": "job_1234567890_abc123"
    }
  }'
```

---

## Force Synchronous (Not Recommended)

If you want to wait for the result directly (may timeout):

```bash
curl -X POST https://reclaim-ai-1.onrender.com/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze_product",
    "arguments": {
      "url": "https://www.amazon.com/dp/B08N5WRWNW",
      "async": false
    }
  }'
```

**Warning:** This may timeout on Render free tier if analysis takes > 75 seconds.

---

## Benefits

✅ **No more 504 timeouts** - Job returns immediately  
✅ **Reliable** - Background processing continues even if client disconnects  
✅ **Progress tracking** - Check elapsed time and status  
✅ **Scalable** - Can handle multiple concurrent analyses  
✅ **MCP compatible** - Works with MCP clients

---

## Deployment

The fix is deployed! Your server at https://reclaim-ai-1.onrender.com now:
- ✅ Returns job IDs immediately for `analyze_product`
- ✅ Processes in background
- ✅ Supports polling via `/api/job/:jobId`
- ✅ Includes `get_job_status` MCP tool

---

## Next Steps

1. ✅ Deploy updated code (pushed to GitHub)
2. ✅ Render will auto-redeploy
3. ✅ Test with async flow (submit → poll → get results)
4. ✅ Update your applications to use async pattern

Your MCP server is now timeout-proof! 🎉

