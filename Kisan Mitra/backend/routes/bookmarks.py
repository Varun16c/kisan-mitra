from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.supabase_client import get_supabase_client
from typing import Dict, Any, List

router = APIRouter()

class BookmarkToggle(BaseModel):
    user_id: str
    scheme_id: str

@router.post("/toggle")
def toggle_bookmark(body: BookmarkToggle):
    """Toggle a bookmark for a user and scheme."""
    db = get_supabase_client()
    try:
        # Check if it already exists
        existing = db.table('user_bookmarks')\
            .select('*')\
            .eq('user_id', body.user_id)\
            .eq('scheme_id', body.scheme_id)\
            .execute()
            
        if existing.data:
            # It exists, so remove it (un-bookmark)
            db.table('user_bookmarks')\
                .delete()\
                .eq('user_id', body.user_id)\
                .eq('scheme_id', body.scheme_id)\
                .execute()
            return {"success": True, "action": "removed"}
        else:
            # It doesn't exist, so add it
            db.table('user_bookmarks')\
                .insert({"user_id": body.user_id, "scheme_id": body.scheme_id})\
                .execute()
            return {"success": True, "action": "added"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
def get_user_bookmarks(user_id: str):
    """Get all scheme IDs bookmarked by a user."""
    db = get_supabase_client()
    try:
        result = db.table('user_bookmarks')\
            .select('scheme_id')\
            .eq('user_id', user_id)\
            .execute()
            
        scheme_ids = [row['scheme_id'] for row in result.data]
        return {"success": True, "bookmarks": scheme_ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/schemes")
def get_bookmarked_schemes(user_id: str):
    """Get full scheme objects for all schemes bookmarked by a user."""
    db = get_supabase_client()
    try:
        # 1. Get the list of bookmarked scheme IDs
        bookmarks_result = db.table('user_bookmarks')\
            .select('scheme_id')\
            .eq('user_id', user_id)\
            .execute()
            
        scheme_ids = [row['scheme_id'] for row in bookmarks_result.data]
        
        if not scheme_ids:
            return {"success": True, "schemes": []}
            
        # 2. Fetch the actual schemes from the schemes table
        schemes_result = db.table('schemes')\
            .select('*')\
            .in_('id', scheme_ids)\
            .execute()
            
        return {"success": True, "schemes": schemes_result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
