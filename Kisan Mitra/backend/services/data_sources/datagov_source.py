import os

DATA_GOV_BASE = "https://api.data.gov.in/resource"

async def fetch_datagov_schemes() -> list[dict]:
    """
    Fetch agriculture/rural schemes from data.gov.in OGD API.
    Requires DATA_GOV_API_KEY in .env (free registration at data.gov.in)
    """
    import httpx
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv('DATA_GOV_API_KEY')
    if not api_key:
        print("⚠️  DATA_GOV_API_KEY not set — skipping data.gov.in source")
        print("   Register free at: https://data.gov.in/user/register")
        return []
    
    # Resource IDs for relevant datasets on data.gov.in
    # Find these by searching data.gov.in for "agriculture schemes"
    RESOURCE_IDS = [
        # Add actual resource IDs after searching data.gov.in
        # Example: "9ef84268-d588-465a-a308-a864a43d0070"
    ]
    
    if not RESOURCE_IDS:
        print("⚠️  No data.gov.in resource IDs configured")
        print("   Search data.gov.in/catalogs for agriculture/rural scheme datasets")
        print("   Add resource IDs to RESOURCE_IDS list in datagov_source.py")
        return []
    
    all_schemes = []
    
    async with httpx.AsyncClient(timeout=30) as client:
        for resource_id in RESOURCE_IDS:
            try:
                resp = await client.get(
                    f"{DATA_GOV_BASE}/{resource_id}",
                    params={
                        'api-key': api_key,
                        'format': 'json',
                        'limit': 1000
                    }
                )
                data = resp.json()
                records = data.get('records', data.get('data', []))
                all_schemes.extend(records)
                print(f"data.gov.in {resource_id}: {len(records)} records")
            except Exception as e:
                print(f"data.gov.in {resource_id} failed: {e}")
    
    return all_schemes
