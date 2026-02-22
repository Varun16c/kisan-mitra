"""Auth routes — wraps Supabase Auth for register and login."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from supabase import create_client

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise HTTPException(status_code=503, detail="Supabase not configured. Add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env")
    return create_client(url, key)

class RegisterBody(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""
    language_preference: str = "en"

class LoginBody(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(body: RegisterBody):
    try:
        sb = get_supabase()
        auth_response = sb.auth.sign_up({"email": body.email, "password": body.password})
        if auth_response.user:
            # Create user profile row
            sb.table("users").insert({
                "id": auth_response.user.id,
                "email": body.email,
                "name": body.name,
                "phone": body.phone,
                "language_preference": body.language_preference,
                "profile": {}
            }).execute()
        return {"user": auth_response.user, "session": auth_response.session}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(body: LoginBody):
    try:
        sb = get_supabase()
        response = sb.auth.sign_in_with_password({"email": body.email, "password": body.password})
        return {"user": response.user, "session": response.session}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")
