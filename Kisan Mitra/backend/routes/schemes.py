"""Schemes routes — get all schemes, check eligibility, what-if simulator."""
import json, os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.supabase_client import get_supabase_client
from services.eligibility_service import run_eligibility, run_whatif, ALL_SCHEMES

router = APIRouter()

class ProfileBody(BaseModel):
    profile: dict

class WhatIfBody(BaseModel):
    profile: dict
    changes: dict

@router.get("/all")
def get_all_schemes():
    return {"schemes": ALL_SCHEMES, "count": len(ALL_SCHEMES)}

@router.post("/check-eligibility")
def check_eligibility(body: ProfileBody):
    results = run_eligibility(body.profile)
    eligible = [r for r in results if r["eligible"]]
    partial = [r for r in results if r.get("partially_eligible") and not r["eligible"]]
    total_benefit = sum(r["benefit_amount"] for r in eligible)
    return {
        "results": results,
        "summary": {
            "eligible_count": len(eligible),
            "partial_count": len(partial),
            "ineligible_count": len(results) - len(eligible) - len(partial),
            "total_annual_benefit": total_benefit,
        }
    }

@router.post("/whatif")
def whatif_simulator(body: WhatIfBody):
    return run_whatif(body.profile, body.changes)

@router.get("/{scheme_id}")
def get_scheme(scheme_id: str):
    scheme = next((s for s in ALL_SCHEMES if s["id"] == scheme_id), None)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme

@router.post("/refresh")
def refresh_scheme_cache():
    """Reload schemes from Supabase into memory."""
    from services.eligibility_service import refresh_schemes
    count = refresh_schemes()
    return {"success": True, "schemes_loaded": count}

@router.get("/stats")
def get_scheme_stats():
    """Pipeline and coverage stats."""
    try:
        db = get_supabase_client()
        total = db.table('schemes').select('id', count='exact').execute()
        active = db.table('schemes').select('id', count='exact').eq('is_active', True).execute()
        needs_review = db.table('schemes').select('id', count='exact').eq('needs_review', True).execute()
        last_log = db.table('ingestion_logs').select('*').order('run_at', desc=True).limit(1).execute()
        
        return {
            "total_schemes": total.count,
            "active_schemes": active.count,
            "needs_review": needs_review.count,
            "last_ingestion": last_log.data[0] if last_log.data else None
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/admin/trigger-sync")
def trigger_sync(source: str = "huggingface"):
    """Manually trigger scheme ingestion."""
    import asyncio
    from services.ingestion_pipeline import IngestionPipeline
    
    async def run_sync():
        pipeline = IngestionPipeline()
        if source == "huggingface":
            from services.data_sources.huggingface_source import fetch_huggingface
            schemes = await fetch_huggingface()
            await pipeline.run_source('HuggingFace_Manual', schemes,
                'https://huggingface.co/datasets/shrijayan/gov_myscheme')
        elif source == "pib":
            from services.data_sources.pib_source import fetch_new_pib_schemes
            db = get_supabase_client()
            schemes = await fetch_new_pib_schemes(db)
            await pipeline.run_source('PIB_Manual', schemes, 'https://pib.gov.in')
        return pipeline.stats
    
    stats = asyncio.run(run_sync())
    # Refresh in-memory cache after sync
    from services.eligibility_service import refresh_schemes
    count = refresh_schemes()
    return {"success": True, "ingestion_stats": stats, "schemes_in_memory": count}

@router.get("/admin/ingestion-logs")
def get_ingestion_logs():
    db = get_supabase_client()
    logs = db.table('ingestion_logs').select('*').order('run_at', desc=True).limit(20).execute()
    return {"logs": logs.data}

@router.get("/admin/needs-review")
def get_needs_review():
    db = get_supabase_client()
    schemes = db.table('schemes').select(
        'id, name, review_reason, confidence_score, sources'
    ).eq('needs_review', True).execute()
    return {"schemes": schemes.data, "count": len(schemes.data)}
