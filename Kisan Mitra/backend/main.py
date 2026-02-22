"""
Kisan Mitra — FastAPI backend entry point.
"""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from routes import schemes, chat, ocr, whatsapp, auth, reports, profile, bookmarks

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from database.supabase_client import supabase
    from services.scheduler import setup_scheduler
    setup_scheduler(supabase)
    yield
    # Shutdown (cleanup if needed)

app = FastAPI(
    title="Kisan Mitra API",
    description="AI-powered Rural Government Scheme Discovery Platform",
    version="1.0.0",
    lifespan=lifespan
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global exception handler → always includes CORS headers ─────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Headers"] = "*"
        headers["Access-Control-Allow-Methods"] = "*"
    import traceback
    print(f"[ERROR] Unhandled exception on {request.url}:")
    traceback.print_exc()
    return JSONResponse(
        {"detail": f"Internal server error: {str(exc)}"},
        status_code=500,
        headers=headers
    )

# ─── Routes ──────────────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(schemes.router,   prefix="/api/schemes",   tags=["Schemes"])
app.include_router(chat.router,      prefix="/api/chat",      tags=["Chat"])
app.include_router(ocr.router,       prefix="/api/ocr",       tags=["OCR"])
app.include_router(whatsapp.router,  prefix="/api/whatsapp",  tags=["WhatsApp"])
app.include_router(reports.router,   prefix="/api/reports",   tags=["Reports"])
app.include_router(profile.router,   prefix="/api/profile",   tags=["Profile"])
app.include_router(bookmarks.router, prefix="/api/bookmarks", tags=["Bookmarks"])

@app.get("/")
def root():
    return {"message": "Kisan Mitra API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
