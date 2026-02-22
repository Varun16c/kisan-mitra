"""
Chat route — endpoints:
  POST /api/chat         → SSE streaming
  POST /api/chat/simple  → Single JSON response (used by frontend)
  GET  /api/chat/history → Load past messages for a user
  POST /api/chat/save    → Save a user+assistant exchange to Supabase
  POST /api/chat/feedback → Thumbs up/down per AI message

Accepts optional `eligibility_results` from frontend so the AI uses the
exact same eligibility data as the Dashboard (no divergence between engines).
"""
import json
import os
import traceback
from fastapi import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
from services.groq_service import stream_chat, simple_chat
from services.eligibility_service import run_eligibility

router = APIRouter()

# Supabase client (service key — bypasses RLS)
_sb = create_client(os.getenv("SUPABASE_URL", ""), os.getenv("SUPABASE_SERVICE_KEY", ""))

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: list = []
    user_profile: dict = {}
    language: str = "en"
    eligibility_results: Optional[list] = None  # Pre-computed from frontend Dashboard

class SaveChatRequest(BaseModel):
    user_id: str
    user_message: str
    ai_response: str
    language: str = "en"

class FeedbackRequest(BaseModel):
    user_id: str
    ai_message: str
    rating: str  # "up" or "down"

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_eligibility(req: ChatRequest) -> list:
    """Use frontend-provided eligibility results if available, else run Python engine."""
    if req.eligibility_results and len(req.eligibility_results) > 0:
        return req.eligibility_results  # Trust the frontend JS engine (same as Dashboard)
    try:
        return run_eligibility(req.user_profile)
    except Exception as e:
        print(f"[WARN] run_eligibility failed: {e}")
        return []

# ─────────────────────────────────────────────────────────────────────────────
# Chat endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("")
async def chat(req: ChatRequest):
    eligibility_results = get_eligibility(req)

    async def event_generator():
        try:
            async for chunk in stream_chat(
                req.message, req.history, req.user_profile, eligibility_results, req.language
            ):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/simple")
async def chat_simple(req: ChatRequest):
    """Non-streaming endpoint — reliable, used by the React frontend."""
    try:
        eligibility_results = get_eligibility(req)
        response = await simple_chat(
            req.message, req.history, req.user_profile, eligibility_results, req.language
        )
        return JSONResponse({"content": response})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"detail": str(e)}, status_code=500)


# ─────────────────────────────────────────────────────────────────────────────
# History endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/history")
async def get_history(user_id: str):
    """Fetch the last 20 messages for a user, ordered chronologically."""
    if not user_id or user_id == "demo":
        return JSONResponse({"messages": []})
    try:
        res = _sb.table("chat_history") \
            .select("role, content, language, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=False) \
            .limit(40) \
            .execute()
        return JSONResponse({"messages": res.data or []})
    except Exception as e:
        print(f"[Chat History] Load failed: {e}")
        return JSONResponse({"messages": [], "error": str(e)})

@router.delete("/history")
async def delete_history(user_id: str):
    """Delete all chat history for a given user."""
    if not user_id or user_id == "demo":
        return JSONResponse({"ok": True, "skipped": "demo user"})
    try:
        _sb.table("chat_history").delete().eq("user_id", user_id).execute()
        return JSONResponse({"ok": True})
    except Exception as e:
        print(f"[Chat History] Delete failed: {e}")
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


@router.post("/save")
async def save_chat(req: SaveChatRequest):
    """Save a user+assistant exchange (2 rows) to chat_history."""
    if not req.user_id or req.user_id == "demo":
        return JSONResponse({"ok": True, "skipped": "demo user"})
    try:
        rows = [
            {"user_id": req.user_id, "role": "user",      "content": req.user_message, "language": req.language},
            {"user_id": req.user_id, "role": "assistant",  "content": req.ai_response,  "language": req.language},
        ]
        _sb.table("chat_history").insert(rows).execute()
        return JSONResponse({"ok": True})
    except Exception as e:
        print(f"[Chat History] Save failed: {e}")
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


@router.post("/feedback")
async def chat_feedback(req: FeedbackRequest):
    """Store thumbs up/down feedback for an AI message."""
    if not req.user_id or req.user_id == "demo":
        return JSONResponse({"ok": True, "skipped": "demo user"})
    if req.rating not in ("up", "down"):
        return JSONResponse({"ok": False, "error": "rating must be 'up' or 'down'"}, status_code=400)
    try:
        _sb.table("chat_feedback").insert({
            "user_id": req.user_id,
            "ai_message": req.ai_message[:500],  # truncate to avoid huge rows
            "rating": req.rating,
        }).execute()
        return JSONResponse({"ok": True})
    except Exception as e:
        print(f"[Chat Feedback] Save failed: {e}")
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)
