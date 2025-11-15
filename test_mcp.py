#!/usr/bin/env python3
"""
Test script for Reclaim AI MCP Server
Usage: python3 test_mcp.py <product_url>
"""

import requests
import json
import sys

BASE_URL = "https://reclaim-ai-1.onrender.com"

def test_health():
    """Test health check endpoint"""
    print("=" * 60)
    print("1. Testing Health Check...")
    print("=" * 60)
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_list_tools():
    """List available tools"""
    print("\n" + "=" * 60)
    print("2. Listing Available Tools...")
    print("=" * 60)
    try:
        response = requests.get(f"{BASE_URL}/mcp/tools", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"Available tools: {len(data.get('tools', []))}")
            for tool in data.get('tools', []):
                print(f"  - {tool.get('name')}: {tool.get('description', '')[:60]}...")
            return True
        else:
            print(f"Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def analyze_product(url, user_id=None):
    """Analyze a product using the MCP server"""
    print("\n" + "=" * 60)
    print(f"3. Analyzing Product...")
    print("=" * 60)
    print(f"URL: {url}")
    print("\n⏳ Calling MCP server...")
    print("   This will take 60-120 seconds for complete analysis:")
    print("   - Web crawling with Tavily")
    print("   - Marketing claim verification")
    print("   - Alternative search")
    print("   - Detailed reasoning generation")
    print("\n   Please wait...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/mcp/tools/call",
            json={
                'name': 'analyze_product',
                'arguments': {
                    'url': url,
                    'userId': user_id
                }
            },
            timeout=180  # Allow 3 minutes for complete analysis
        )
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            analysis = json.loads(data['content'][0]['text'])
            
            print("\n" + "=" * 60)
            print("📊 ANALYSIS RESULTS")
            print("=" * 60)
            
            # Basic info
            print(f"\n📦 Product: {analysis.get('title', 'N/A')}")
            print(f"💰 Price: {analysis.get('currency', '$')} {analysis.get('price', 'N/A')}")
            
            # Recommendation
            if 'recommendation' in analysis:
                rec = analysis['recommendation']
                score = rec.get('score', 0)
                verdict = rec.get('verdict', 'N/A')
                
                print(f"\n🎯 Score: {score}/100")
                print(f"📋 Verdict: {verdict}")
                
                # Color-coded verdict
                if score >= 70:
                    verdict_emoji = "✅"
                elif score >= 40:
                    verdict_emoji = "⚠️"
                else:
                    verdict_emoji = "❌"
                
                print(f"   {verdict_emoji} Recommendation: {verdict}")
                
                # Detailed reasoning - Show full reasoning
                reasoning = rec.get('detailedReasoning', '')
                if reasoning:
                    print(f"\n📝 Detailed Reasoning (Full):")
                    print("-" * 60)
                    print(reasoning)
                    print("-" * 60)
            
            # Manipulation signals
            if 'manipulationSignals' in analysis and analysis['manipulationSignals']:
                print(f"\n🚨 Manipulation Signals Detected: {len(analysis['manipulationSignals'])}")
                for signal in analysis['manipulationSignals'][:5]:
                    print(f"   • {signal}")
            
            # Manipulation claims
            if 'manipulationClaims' in analysis and analysis['manipulationClaims']:
                print(f"\n🔍 Marketing Claims Verified: {len(analysis['manipulationClaims'])}")
                for claim in analysis['manipulationClaims'][:3]:
                    claim_type = claim.get('type', 'Unknown')
                    claim_text = claim.get('claim', '')
                    verified = claim.get('verified', False)
                    status = "✅ Verified" if verified else "❌ Not Verified"
                    print(f"   • {claim_type}: \"{claim_text}\" - {status}")
            
            # Alternatives
            if 'alternatives' in analysis and len(analysis['alternatives']) > 0:
                print(f"\n🔄 Alternatives Found: {len(analysis['alternatives'])}")
                for i, alt in enumerate(analysis['alternatives'][:5], 1):
                    desc = alt.get('description', 'N/A')
                    price = alt.get('price', 'N/A')
                    savings = alt.get('savings', 0)
                    url_alt = alt.get('url', 'N/A')
                    alt_type = alt.get('type', '')
                    
                    print(f"\n   {i}. [{alt_type.upper()}] {desc}")
                    print(f"      💵 Price: ${price}")
                    if savings > 0:
                        print(f"      💰 Savings: ${savings}")
                    print(f"      🔗 {url_alt}")
            else:
                print("\n🔄 No alternatives found")
            
            # Metadata
            if 'metadata' in analysis:
                meta = analysis['metadata']
                print(f"\n📊 Analysis Metadata:")
                print(f"   • Tavily Used: {meta.get('tavilyUsed', False)}")
                print(f"   • Cached: {meta.get('cached', False)}")
                if 'crawlStats' in meta:
                    stats = meta['crawlStats']
                    print(f"   • Cache Hits: {stats.get('cacheHits', 0)}")
                    print(f"   • Cache Misses: {stats.get('cacheMisses', 0)}")
                    print(f"   • Total Operations: {stats.get('totalOperations', 0)}")
            
            # Show raw JSON for debugging (optional)
            print(f"\n🔍 Full Analysis JSON (for reference):")
            print("-" * 60)
            print(json.dumps(analysis, indent=2)[:2000] + "..." if len(json.dumps(analysis)) > 2000 else json.dumps(analysis, indent=2))
            
            print("\n" + "=" * 60)
            print("✅ Analysis Complete!")
            print("=" * 60)
            
            return analysis
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return None
            
    except requests.exceptions.Timeout:
        print("\n❌ Error: Request timed out (server may be processing)")
        return None
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main function"""
    print("\n" + "🚀" * 30)
    print("Reclaim AI MCP Server Test")
    print("🚀" * 30)
    
    # Test health
    if not test_health():
        print("\n❌ Health check failed. Server may be down.")
        sys.exit(1)
    
    # List tools
    test_list_tools()
    
    # Get URL from command line or use default
    if len(sys.argv) > 1:
        product_url = sys.argv[1]
    else:
        print("\n" + "=" * 60)
        print("⚠️  No URL provided. Using default test URL.")
        print("=" * 60)
        product_url = "https://www.amazon.com/dp/B08N5WRWNW"
        print(f"Usage: python3 test_mcp.py <product_url>")
    
    # Analyze product
    result = analyze_product(product_url)
    
    if result:
        print("\n✅ Test completed successfully!")
    else:
        print("\n❌ Test failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()

