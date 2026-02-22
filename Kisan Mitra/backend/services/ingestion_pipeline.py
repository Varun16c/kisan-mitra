import asyncio, uuid, json, os, time
from datetime import datetime
from services.normalizer import SchemeNormalizer
from services.deduplicator import DeduplicationEngine
from services.enricher import SchemeEnricher
from database.supabase_client import supabase

class IngestionPipeline:
    
    def __init__(self):
        self.db = supabase
        self.enricher = SchemeEnricher()
        self.normalizer = SchemeNormalizer()
        self.dedup = DeduplicationEngine()
        self._reset_stats()
        self._start_time = time.time()
    
    def _reset_stats(self):
        self.stats = {'processed':0,'new':0,'merged':0,'failed':0,'needs_review':0}
    
    async def ingest_one(self, raw: dict, source_url: str, source_name: str):
        try:
            # Dynamically pull more info from the web if the source API is dry
            raw = await self.enricher.enrich(raw)
            
            normalized = await self.normalizer.normalize(raw, source_url)
            normalized['source_ids'][source_name] = raw.get('id', normalized.get('id',''))
            
            if not normalized.get('name') or not normalized.get('id'):
                normalized['needs_review'] = True
                normalized['review_reason'] = normalized.get('review_reason', 'Missing name or id')
            
            if normalized.get('needs_review'):
                self.stats['needs_review'] += 1
            
            existing = self.dedup.find_duplicate(normalized, self.db)
            
            if existing:
                merged = self.dedup.merge_schemes(existing, normalized)
                # Overwrite review status to reflect the successful retry 
                merged['needs_review'] = normalized.get('needs_review', False)
                if not merged['needs_review']:
                    merged['review_reason'] = None
                self.db.table('schemes').update(merged).eq('id', existing['id']).execute()
                self.stats['merged'] += 1
            else:
                self.db.table('schemes').insert(normalized).execute()
                self.stats['new'] += 1
            
            self.stats['processed'] += 1
            
        except Exception as e:
            self.stats['failed'] += 1
            try:
                self.db.table('failed_ingestions').insert({
                    'raw_data': raw,
                    'source_url': source_url,
                    'source_name': source_name,
                    'error': str(e)[:500],
                    'created_at': datetime.utcnow().isoformat()
                }).execute()
            except: pass
    
    async def run_source(self, source_name: str, raw_schemes: list, source_url: str):
        print(f"\n━━━ {source_name}: {len(raw_schemes)} schemes ━━━")
        self._reset_stats()
        self._start_time = time.time()
        
        for i, raw in enumerate(raw_schemes):
            name = raw.get('name') or raw.get('scheme_name', f'Item {i}')
            
            # Pre-check to skip already successfully processed schemes
            temp_id = self.normalizer._make_id(name)
            check = self.db.table('schemes').select('id, needs_review').eq('id', temp_id).execute()
            if check.data and not check.data[0].get('needs_review'):
                print(f"  [{i+1}/{len(raw_schemes)}] Skipping (Already in DB): {name[:50]}...")
                self.stats['processed'] += 1
                continue
                
            print(f"  [{i+1}/{len(raw_schemes)}] Processing: {name[:50]}...")
            
            if i % 25 == 0 and i > 0:
                print(f"  → Stats: New:{self.stats['new']} Merged:{self.stats['merged']} Failed:{self.stats['failed']}")
            
            await self.ingest_one(raw, source_url, source_name.lower().replace(' ','_'))
        
        self._log_run(source_name)
        self.print_stats()
    
    def _log_run(self, source: str, notes: str = None):
        duration = round(time.time() - self._start_time, 2)
        try:
            self.db.table('ingestion_logs').insert({
                'source': source,
                'processed': self.stats['processed'],
                'new_schemes': self.stats['new'],
                'merged': self.stats['merged'],
                'failed': self.stats['failed'],
                'needs_review_count': self.stats['needs_review'],
                'duration_seconds': duration,
                'notes': notes
            }).execute()
        except Exception as e:
            print(f"Warning: log failed: {e}")
    
    def print_stats(self):
        print(f"  Result → New:{self.stats['new']} | Merged:{self.stats['merged']} | NeedsReview:{self.stats['needs_review']} | Failed:{self.stats['failed']}")
