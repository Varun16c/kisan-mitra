import os
import json
from datetime import datetime
from difflib import SequenceMatcher

class DeduplicationEngine:
    
    def find_duplicate(self, new_scheme: dict, db) -> dict | None:
        scheme_id = new_scheme.get('id', '')
        
        # Layer 1: Exact ID match
        if scheme_id:
            result = db.table('schemes').select('*').eq('id', scheme_id).execute()
            if result.data:
                return result.data[0]
        
        # Layer 2: Alias check (id in existing aliases array)
        result = db.table('schemes')\
            .select('*')\
            .contains('aliases', [scheme_id])\
            .execute()
        if result.data:
            return result.data[0]
        
        # Layer 3: Fuzzy name match
        all_existing = db.table('schemes')\
            .select('id, name, canonical_name, aliases, ministry, benefit_amount')\
            .execute()
        
        if not all_existing.data:
            return None
        
        new_names = [
            (new_scheme.get('name') or '').lower(),
            (new_scheme.get('canonical_name') or '').lower(),
            new_scheme.get('id', '').lower(),
            *[(a or '').lower() for a in new_scheme.get('aliases', [])]
        ]
        new_names = [n for n in new_names if n]
        
        best_score = 0.0
        best_match = None
        
        for ex in all_existing.data:
            ex_names = [
                (ex.get('name') or '').lower(),
                (ex.get('canonical_name') or '').lower(),
                (ex.get('id') or '').lower(),
                *[(a or '').lower() for a in (ex.get('aliases') or [])]
            ]
            ex_names = [n for n in ex_names if n]
            
            score = max(
                (SequenceMatcher(None, n, e).ratio() 
                 for n in new_names for e in ex_names),
                default=0
            )
            
            # Ministry boost
            nm = (new_scheme.get('ministry') or '')[:8].lower()
            em = (ex.get('ministry') or '')[:8].lower()
            if nm and em and nm == em:
                score = min(1.0, score + 0.08)
            
            if score > best_score:
                best_score = score
                best_match = ex
        
        # Layer 4 thresholds
        if best_score >= 0.88:
            return best_match  # High confidence duplicate
        
        if 0.65 <= best_score < 0.88 and best_match:
            # Ask Groq LLM to decide
            try:
                # We need an async call here if we are inside an async pipeline. Wait, this function wasn't async in the prompt.
                # Since IngestionPipeline calls find_duplicate synchronously, we either make it async or use a sync client.
                # Let's use a sync Groq client for this specific call so we don't have to rewrite the calling logic.
                verdict = self._llm_verdict(new_scheme, best_match)
                if verdict == 'duplicate':
                    return best_match
            except:
                pass
        
        return None
    
    def _llm_verdict(self, new_scheme: dict, existing: dict) -> str:
        from groq import Groq
        from dotenv import load_dotenv
        load_dotenv()
        
        client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        
        prompt = f"""Are these two entries the same Indian government scheme?
Answer with ONLY the word "duplicate" or "new_scheme". Nothing else.

Entry A: name="{new_scheme.get('name')}", ministry="{new_scheme.get('ministry')}", benefit={new_scheme.get('benefit_amount')}, state={new_scheme.get('state_specific')}
Entry B: name="{existing.get('name')}", ministry="{existing.get('ministry')}", benefit={existing.get('benefit_amount')}, state={existing.get('state_specific')}"""
        
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.0
            )
            verdict = response.choices[0].message.content.strip().lower()
            return 'duplicate' if 'duplicate' in verdict else 'new_scheme'
        except:
            return 'new_scheme'  # Default to treating as new if LLM fails
    
    def merge_schemes(self, existing: dict, new_scheme: dict) -> dict:
        merged = existing.copy()
        
        # Merge list fields — union, preserve order, no duplicates
        for field in ['sources', 'aliases', 'category', 'tags',
                      'documents_required', 'apply_steps', 'apply_mode', 'states']:
            ex_list = existing.get(field) or []
            new_list = new_scheme.get(field) or []
            merged[field] = list(dict.fromkeys(ex_list + new_list))
        
        # Merge dicts
        merged['source_ids'] = {
            **(existing.get('source_ids') or {}),
            **(new_scheme.get('source_ids') or {})
        }
        merged['ineligibility_rules'] = {
            **(existing.get('ineligibility_rules') or {}),
            **(new_scheme.get('ineligibility_rules') or {})
        }
        
        # Fill nulls only — NEVER overwrite existing non-null data
        protected = {'id', 'created_at', 'sources', 'aliases', 'source_ids',
                    'category', 'tags', 'documents_required', 'apply_steps',
                    'apply_mode', 'states', 'ineligibility_rules'}
        
        for field, value in new_scheme.items():
            if field in protected:
                continue
            # Only fill if existing is null/empty/zero
            existing_val = existing.get(field)
            is_empty = existing_val is None or existing_val == '' or existing_val == [] or existing_val == {}
            has_value = value is not None and value != '' and value != [] and value != {}
            if is_empty and has_value:
                merged[field] = value
        
        # Add new scheme's aliases to alias list for future dedup
        new_id = new_scheme.get('id', '')
        if new_id and new_id not in merged['aliases']:
            merged['aliases'].append(new_id)
        
        # Recalculate confidence (take higher of the two)
        merged['confidence_score'] = max(
            existing.get('confidence_score', 0),
            new_scheme.get('confidence_score', 0)
        )
        merged['last_updated'] = datetime.utcnow().isoformat()
        
        return merged
