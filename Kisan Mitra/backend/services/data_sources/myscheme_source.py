MYSCHEME_BASE = "https://www.myscheme.gov.in"

async def fetch_myscheme_schemes() -> list[dict]:
    """
    Fetch schemes from MyScheme.gov.in internal API.
    MyScheme is a React app — find its API endpoints by inspecting network calls.
    Common endpoint patterns to try:
    """
    import httpx
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; research-bot)',
        'Accept': 'application/json',
        'Referer': 'https://www.myscheme.gov.in'
    }
    
    # Try these endpoint patterns (inspect myscheme.gov.in Network tab to find real ones)
    endpoints_to_try = [
        f"{MYSCHEME_BASE}/api/schemes",
        f"{MYSCHEME_BASE}/_next/data/schemes.json",
        f"{MYSCHEME_BASE}/api/scheme/getAll",
        f"{MYSCHEME_BASE}/api/v1/schemes/all",
    ]
    
    async with httpx.AsyncClient(timeout=30, headers=headers) as client:
        # First fetch the main page to get any auth tokens/cookies
        await client.get(MYSCHEME_BASE)
        
        all_schemes = []
        
        for endpoint in endpoints_to_try:
            try:
                resp = await client.get(endpoint)
                if resp.status_code == 200:
                    data = resp.json()
                    # Extract scheme list from response
                    if isinstance(data, list):
                        all_schemes = data
                        print(f"✅ MyScheme API found at: {endpoint} ({len(data)} schemes)")
                        break
                    elif isinstance(data, dict):
                        # Try common wrapper keys
                        for key in ['schemes', 'data', 'result', 'schemes_data']:
                            if key in data and isinstance(data[key], list):
                                all_schemes = data[key]
                                print(f"✅ MyScheme API: {endpoint} → {key} ({len(all_schemes)} schemes)")
                                break
            except Exception as e:
                continue
        
        if not all_schemes:
            # Fallback: scrape the scheme listing page
            print("API endpoints not found — falling back to page scraping")
            all_schemes = await _scrape_myscheme_listing(client)
        
        return all_schemes

async def _scrape_myscheme_listing(client) -> list[dict]:
    """Scrape MyScheme scheme listing pages as fallback."""
    from bs4 import BeautifulSoup
    
    schemes = []
    page = 1
    
    while True:
        try:
            resp = await client.get(f"{MYSCHEME_BASE}/schemes?page={page}")
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # Find scheme cards — inspect actual HTML for correct selectors
            scheme_cards = soup.select('[class*="scheme-card"], [class*="SchemeCard"], article')
            
            if not scheme_cards:
                break
            
            for card in scheme_cards:
                name_el = card.select_one('h2, h3, [class*="title"], [class*="name"]')
                desc_el = card.select_one('p, [class*="desc"]')
                link_el = card.select_one('a')
                
                if name_el:
                    schemes.append({
                        'name': name_el.get_text(strip=True),
                        'description': desc_el.get_text(strip=True) if desc_el else '',
                        'detail_url': MYSCHEME_BASE + link_el['href'] if link_el else ''
                    })
            
            page += 1
            if page > 50:  # Safety limit
                break
                
        except Exception as e:
            print(f"Scraping page {page} failed: {e}")
            break
    
    print(f"Scraped {len(schemes)} schemes from MyScheme listing")
    return schemes
