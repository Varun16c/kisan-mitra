import csv
import os

async def fetch_csv_schemes(filepath: str) -> list[dict]:
    """
    Parse the uploaded Kaggle CSV containing 3,400+ government schemes.
    Maps columns like 'scheme_name', 'details', 'benefits' into the raw dict format
    expected by the IngestionPipeline and normalizer.
    """
    if not os.path.exists(filepath):
        print(f"❌ CSV file not found at: {filepath}")
        return []

    all_schemes = []
    
    # We use utf-8 encoding and the standard csv DictReader
    with open(filepath, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Map the CSV columns to the raw fields that SchemeNormalizer expects.
            # Any missing fields or short strings will automatically trigger duckduckgo Web Enrichment!
            raw_scheme = {
                'name': row.get('scheme_name', '').strip(),
                'description': row.get('details', '').strip(),
                'benefits_raw': row.get('benefits', '').strip(),
                'eligibility_raw': row.get('eligibility', '').strip(),
                'documents_raw': row.get('documents', '').strip(),
                'application_process': row.get('application', '').strip(),
                'level': row.get('level', '').strip(),
                'category': row.get('schemeCategory', '').strip(),
                'tags': row.get('tags', '').strip()
            }
            
            # Only add if there is actually a scheme name
            if raw_scheme['name']:
                all_schemes.append(raw_scheme)
                
    return all_schemes
