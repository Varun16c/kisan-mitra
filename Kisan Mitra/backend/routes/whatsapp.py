"""WhatsApp webhook — Twilio sandbox bot with conversation state machine."""
import os
from fastapi import APIRouter, Request, Response
from twilio.twiml.messaging_response import MessagingResponse
from services.eligibility_service import run_eligibility

router = APIRouter()
# In-memory conversation state (use Supabase for production persistence)
_sessions: dict = {}

ONBOARDING_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    form = await request.form()
    from_number = form.get("From", "")
    body = (form.get("Body") or "").strip()
    phone = from_number.replace("whatsapp:", "")

    resp = MessagingResponse()
    session = _sessions.get(phone, {})

    if not session.get("has_profile"):
        # New user — send onboarding link
        msg = (
            f"🌾 *Kisan Mitra* — Find all government schemes you qualify for!\n\n"
            f"Complete your profile (2 min) to get your personalised scheme list:\n"
            f"{ONBOARDING_URL}?phone={phone}\n\n"
            f"Already registered? Reply *STATUS* to check your schemes."
        )
        _sessions[phone] = {"has_profile": False, "last_schemes": []}
    elif body.upper() == "STATUS" or body.upper() == "HELP":
        profile = session.get("profile", {})
        results = run_eligibility(profile)
        eligible = [r for r in results if r["eligible"]][:3]
        lines = ["🌾 *Kisan Mitra — Your Top Schemes:*\n"]
        for i, s in enumerate(eligible, 1):
            lines.append(f"{i}. *{s['scheme_name']}*: ₹{s['benefit_amount']:,}/yr ✅")
        lines.append("\nReply *1*, *2*, or *3* for details. Reply *HELP* for full list.")
        msg = "\n".join(lines) if eligible else "No eligible schemes found. Complete your profile first."
        _sessions[phone]["last_schemes"] = eligible
    elif body in ["1", "2", "3"]:
        idx = int(body) - 1
        schemes = session.get("last_schemes", [])
        if idx < len(schemes):
            s = schemes[idx]
            msg = (
                f"📋 *{s['scheme_name']}*\n\n"
                f"💰 Benefit: ₹{s['benefit_amount']:,}\n"
                f"📅 Deadline: {s.get('deadline', 'N/A')}\n"
                f"📝 {s.get('benefit_description', '')}\n\n"
                f"Apply at: {s.get('apply_url', 'Contact local office')}\n\n"
                f"Reply *HELP* to see all your schemes."
            )
        else:
            msg = "Please reply 1, 2, or 3 to see scheme details."
    else:
        msg = (
            "🌾 *Kisan Mitra* — Reply:\n"
            "• *STATUS* — See your eligible schemes\n"
            "• *1, 2, 3* — Get scheme details\n"
            "• *HELP* — Full scheme list\n\n"
            f"Or visit: {ONBOARDING_URL}"
        )

    resp.message(msg)
    return Response(content=str(resp), media_type="application/xml")
