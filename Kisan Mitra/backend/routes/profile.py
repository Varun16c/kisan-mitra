from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.supabase_client import get_supabase_client
from typing import Dict, Any

router = APIRouter()

class ProfileUpdate(BaseModel):
    user_id: str
    profile: Dict[str, Any]

@router.put("/update")
def update_profile(body: ProfileUpdate):
    """Upsert a user's full profile data into Supabase."""
    db = get_supabase_client()
    try:
        # We upsert based on user_id, replacing the whole profile_data JSONB
        result = db.table('profiles').upsert(
            {"user_id": body.user_id, "profile_data": body.profile}
        ).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        # Supabase raises on failure
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
def get_profile(user_id: str):
    """Retrieve a user's saved profile."""
    db = get_supabase_client()
    try:
        result = db.table('profiles').select('*').eq('user_id', user_id).execute()
        if not result.data:
            return {"user_id": user_id, "profile_data": {}}
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
