PIB_RSS = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3"
SCHEME_KEYWORDS = [
    'scheme', 'yojana', 'launch', 'kisan', 'kisaan', 'krishi',
    'farmer', 'rural', 'subsidy', 'bima', 'awas', 'pension',
    'benefit', 'welfare', 'seva'
]

async def fetch_new_pib_schemes(db) -> list[dict]:
    """
    Check PIB RSS for new scheme announcements.
    Returns only entries not yet processed.
    """
    import feedparser, httpx, json, os
    from bs4 import BeautifulSoup
    from groq import AsyncGroq
    from dotenv import load_dotenv
    load_dotenv()
    
    client = AsyncGroq(api_key=os.getenv('GROQ_API_KEY'))
    
    try:
        # Avoid blocking the event loop with feedparser by doing it sync for now 
        # (in production might want asyncio.to_thread)
        feed = feedparser.parse(PIB_RSS)
    except Exception as e:
        print(f"PIB RSS fetch failed: {e}")
        return []
    
    new_schemes = []
    
    for entry in feed.entries[:30]:
        title_lower = entry.title.lower()
        if not any(kw in title_lower for kw in SCHEME_KEYWORDS):
            continue
        
        # Already processed?
        try:
            logged = db.table('ingestion_logs')\
                .select('id').eq('source', entry.link).execute()
            if logged.data:
                continue
        except:
            pass
        
        # Fetch and extract scheme data from PIB page
        try:
            async with httpx.AsyncClient(timeout=15.0) as http_client:
                resp = await http_client.get(entry.link)
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            for tag in soup(['nav','footer','script','style','header','aside']):
                tag.decompose()
            text = soup.get_text(separator=' ', strip=True)[:5000]
            
            prompt = f"""
            Read this government press release.
            If NOT about launching/announcing a new scheme: return {{"is_scheme": false}}
            If IS about a scheme: return {{
              "is_scheme": true,
              "name": "scheme name",
              "description": "what the scheme does in 2-3 sentences",
              "eligibility_raw": "who qualifies (exact text)",
              "benefits_raw": "what benefit is given",
              "ministry": "which ministry",
              "official_url": null
            }}
            Title: {entry.title}
            Content: {text}
            Return ONLY JSON.
            """
            
            response = await client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            clean = response.choices[0].message.content.strip()
            if clean.startswith('```'):
                clean = clean.split('```')[1]
                if clean.startswith('json'): clean = clean[4:]
            
            result = json.loads(clean)
            
            if result.get('is_scheme'):
                del result['is_scheme']
                result['pib_url'] = entry.link
                result['pib_title'] = entry.title
                new_schemes.append(result)
                
        except Exception as e:
            print(f"PIB entry failed ({entry.title[:40]}): {e}")
    
    return new_schemes
