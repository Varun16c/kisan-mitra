"""Twilio WhatsApp messaging service for Kisan Mitra bot."""
import os
from twilio.rest import Client

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
FROM_NUMBER = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

def get_client() -> Client:
    return Client(ACCOUNT_SID, AUTH_TOKEN)

def send_whatsapp(to: str, message: str) -> str:
    """Send a WhatsApp message via Twilio sandbox."""
    client = get_client()
    to_number = f"whatsapp:{to}" if not to.startswith("whatsapp:") else to
    msg = client.messages.create(body=message, from_=FROM_NUMBER, to=to_number)
    return msg.sid

def format_scheme_summary(eligible_schemes: list) -> str:
    """Format top 3 eligible schemes for WhatsApp message."""
    top = [s for s in eligible_schemes if s.get("eligible")][:3]
    if not top:
        return "🌾 No fully eligible schemes found yet. Complete your profile for better results."
    lines = ["🌾 *Kisan Mitra — Your Top Schemes:*\n"]
    for i, s in enumerate(top, 1):
        lines.append(f"{i}. *{s['scheme_name']}*: ₹{s['benefit_amount']:,}/yr ✅ You qualify")
    lines.append("\nReply *1*, *2*, or *3* for details.")
    lines.append("Reply *HELP* for full scheme list.")
    return "\n".join(lines)
