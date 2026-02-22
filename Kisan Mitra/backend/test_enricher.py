import asyncio
from services.enricher import SchemeEnricher
import json

async def test():
    enricher = SchemeEnricher()
    # A dummy scheme with missing details to force enrichment
    raw = {
        "name": "PM Vishwakarma Yojana",
        "description": "A central sector scheme to support traditional artisans.",
        "eligibility_raw": "",
        "benefits_raw": ""
    }
    
    try:
        result = await enricher.enrich(raw)
        
        print("\n--- Enrichment Result ---")
        if 'web_context' in result:
            print(f"✅ Successfully extracted {len(result['web_context'])} characters of context from the web!")
            print("Preview:")
            print(result['web_context'][:500] + "...\n")
        else:
            print("❌ Failed or skipped enrichment.")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
