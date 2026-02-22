"""Quick test of the chat SSE endpoint."""
import httpx
import json

payload = {
    "message": "What is PM-KISAN?",
    "history": [],
    "user_profile": {
        "name": "Ramesh", "age": 38, "state": "Maharashtra",
        "occupation": "farmer", "land_acres": 3, "annual_income": 80000,
        "gender": "male", "caste": "OBC",
        "has_aadhaar": True, "has_bank_account": True
    },
    "language": "en"
}

chunks = []
with httpx.Client(timeout=30) as c:
    with c.stream("POST", "http://localhost:8000/api/chat",
                  json=payload, headers={"Content-Type": "application/json"}) as r:
        print(f"Status: {r.status_code}")
        for line in r.iter_lines():
            if line.startswith("data: ") and line != "data: [DONE]":
                d = json.loads(line[6:])
                chunk = d.get("content", "")
                chunks.append(chunk)
                print(chunk, end="", flush=True)
            elif line == "data: [DONE]":
                break

print(f"\n\n✅ Total chunks received: {len(chunks)}")
print(f"✅ Total chars: {sum(len(c) for c in chunks)}")
