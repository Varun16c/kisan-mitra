import logging
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

def search_gov_schemes(query: str, max_results: int = 3) -> str:
    """
    Searches the web for government scheme information using a custom DDG HTML scraper.
    Returns a formatted string of the search results for the LLM context.
    """
    try:
        logger.info(f"[Web Search] Executing Custom Scraper: {query}")
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        res = requests.get(f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}", headers=headers, timeout=10)
        
        if res.status_code != 200:
            return f"Search service unavailable (Status: {res.status_code})"
            
        soup = BeautifulSoup(res.text, 'html.parser')
        results = soup.find_all('div', class_='result__body')
        
        if not results:
            return "No useful web search results found for this query."
            
        formatted = []
        for i, r in enumerate(results[:max_results], 1):
            title = r.find('h2', class_='result__title')
            title_text = title.text.strip() if title else 'No Title'
            
            snippet = r.find('a', class_='result__snippet')
            snippet_text = snippet.text.strip() if snippet else 'No Snippet'
            
            url = r.find('a', class_='result__url')
            url_text = url.get('href', '').strip() if url else ''
            
            formatted.append(f"Source {i}: {title_text}\nURL: {url_text}\nSnippet: {snippet_text}\n")
            
        print(f"[Search Engine] Found {len(formatted)} results.")
        return "\n".join(formatted)
        
    except Exception as e:
        logger.error(f"[Web Search] Failed: {e}")
        return f"Error performing web search: {str(e)}"
