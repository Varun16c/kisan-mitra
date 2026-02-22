import httpx
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS

class SchemeEnricher:
    """Enriches sparse scheme data by searching the web for official eligibility criteria."""
    
    def __init__(self):
        self.ddgs = DDGS()
        # Common official Indian government domains to prioritize if possible
        self.govt_domains = ['gov.in', 'nic.in', 'india.gov.in']

    async def enrich(self, raw_scheme: dict) -> dict:
        """
        If the scheme has very little text data, search the web to find its details.
        Returns the scheme dict with an added 'web_context' field containing scraped text.
        """
        name = raw_scheme.get('name', '').strip()
        if not name:
            return raw_scheme
            
        # Check if we actually need enrichment (is the current text too short?)
        existing_text = f"{raw_scheme.get('description', '')} {raw_scheme.get('eligibility_raw', '')} {raw_scheme.get('benefits_raw', '')}"
        
        # If we already have a decent amount of text (e.g. from a HuggingFace PDF), skip enrichment
        if len(existing_text.strip()) > 800:
            print(f"Skipping enrichment for {name} (already has {len(existing_text)} chars of context)")
            return raw_scheme
            
        print(f"Enriching {name} via Web Search...")
        
        search_query = f"{name} scheme eligibility criteria official benefits"
        
        try:
            # Get top 2 search results
            results = self.ddgs.text(search_query, region='in-en', max_results=2)
            if not results:
                return raw_scheme
                
            web_context = ""
            
            async with httpx.AsyncClient(timeout=10.0, verify=False, follow_redirects=True) as client:
                for res in list(results):
                    url = res.get('href')
                    if not url: continue
                    
                    try:
                        resp = await client.get(url)
                        if resp.status_code == 200:
                            soup = BeautifulSoup(resp.text, 'html.parser')
                            
                            # Clean up noisy elements
                            for tag in soup(['nav', 'footer', 'script', 'style', 'header', 'aside', 'noscript']):
                                tag.decompose()
                            
                            # Extract viewable text
                            text = soup.get_text(separator=' ', strip=True)
                            
                            # Take first 4000 chars from this page to avoid blowing up the LLM token limit
                            web_context += f"\n--- Source: {url} ---\n{text[:4000]}\n"
                    except Exception as e:
                        print(f"   [Enricher] Failed to scrape {url}: {e}")
            
            if web_context:
                raw_scheme['web_context'] = web_context
                
        except Exception as e:
            print(f"   [Enricher] Web search failed for {name}: {e}")
            
        return raw_scheme
