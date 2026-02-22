import asyncio, argparse, sys, os, json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

from services.ingestion_pipeline import IngestionPipeline
from database.supabase_client import supabase

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', 
        choices=['json','huggingface','myscheme','pib','datagov','csv','all'], 
        default='all')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    
    pipeline = IngestionPipeline()
    
    if args.dry_run:
        print("🔍 DRY RUN — normalizing first 3 schemes, no DB writes\n")
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'schemes.json')
        with open(json_path, encoding='utf-8') as f:
            schemes = json.load(f)
        for scheme in schemes[:3]:
            normalized = await pipeline.normalizer.normalize(scheme, 'dry_run')
            print(f"Input:  {scheme.get('name','?')}")
            print(f"Output: {json.dumps(normalized, indent=2, ensure_ascii=False)}\n")
        return
    
    # SOURCE 1: Existing JSON (always run first — fastest, your own data)
    if args.source in ('json', 'all'):
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'schemes.json')
        with open(json_path, encoding='utf-8') as f:
            existing = json.load(f)
        if isinstance(existing, dict):
            existing = existing.get('schemes', list(existing.values()))
        await pipeline.run_source('existing_json', existing, 'local_json_migration')
    
    # SOURCE 2: HuggingFace (700+ schemes)
    if args.source in ('huggingface', 'all'):
        from services.data_sources.huggingface_source import fetch_huggingface
        hf_schemes = await fetch_huggingface()
        await pipeline.run_source(
            'HuggingFace', hf_schemes,
            'https://huggingface.co/datasets/shrijayan/gov_myscheme'
        )
    
    # SOURCE 3: MyScheme.gov.in API/scrape
    if args.source in ('myscheme', 'all'):
        from services.data_sources.myscheme_source import fetch_myscheme_schemes
        ms_schemes = await fetch_myscheme_schemes()
        await pipeline.run_source('MyScheme', ms_schemes, 'https://www.myscheme.gov.in')
    
    # SOURCE 4: PIB RSS (new scheme announcements)
    if args.source in ('pib', 'all'):
        from services.data_sources.pib_source import fetch_new_pib_schemes
        pib_schemes = await fetch_new_pib_schemes(supabase)
        await pipeline.run_source('PIB_RSS', pib_schemes, 'https://pib.gov.in')
    
    # SOURCE 5: data.gov.in
    if args.source in ('datagov', 'all'):
        from services.data_sources.datagov_source import fetch_datagov_schemes
        dg_schemes = await fetch_datagov_schemes()
        await pipeline.run_source('DataGovIn', dg_schemes, 'https://api.data.gov.in')
        
    # SOURCE 6: Kaggle CSV (3400+ schemes)
    if args.source in ('csv', 'all'):
        from services.data_sources.csv_source import fetch_csv_schemes
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'updated_data.csv')
        csv_schemes = await fetch_csv_schemes(csv_path)
        await pipeline.run_source('Kaggle_CSV', csv_schemes, 'local_csv')
    
    # Final summary
    count = supabase.table('schemes').select('id', count='exact').execute()
    review = supabase.table('schemes').select('id').eq('needs_review', True).execute()
    
    print(f"""
╔══════════════════════════════════════╗
║         PIPELINE COMPLETE            ║
╠══════════════════════════════════════╣
║  Total in Supabase: {count.count:<17} ║
║  Needs Review:      {len(review.data):<17} ║
╚══════════════════════════════════════╝
    """)

if __name__ == '__main__':
    asyncio.run(main())
