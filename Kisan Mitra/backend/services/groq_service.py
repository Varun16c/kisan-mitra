"""
Groq AI service — streaming chat with the llama-3.3-70b-versatile model.
Uses AsyncGroq for proper async streaming within FastAPI's async event loop.
"""
import os
import json
from groq import AsyncGroq
from services.search_service import search_gov_schemes

# Use AsyncGroq for non-blocking streaming inside FastAPI async routes
client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY", ""))

def build_system_prompt(user_profile: dict, eligible_schemes: list, language: str = "en") -> str:
    lang_name = {"en": "English", "hi": "Hindi", "mr": "Marathi"}.get(language, "English")

    eligible_items   = [s for s in eligible_schemes if s.get("eligible")]
    partial_items    = [s for s in eligible_schemes if not s.get("eligible") and s.get("match_percent", 0) >= 50]
    ineligible_items = [s for s in eligible_schemes if not s.get("eligible") and s.get("match_percent", 0) < 50]
    total = len(eligible_schemes)

    eligible_summary = "\n".join([
        f"- {s.get('scheme_name', s.get('name','?'))}: ₹{s.get('benefit_amount',0):,} — {str(s.get('benefit_description',''))[:80]}"
        for s in eligible_items
    ][:20]) or "No fully eligible schemes found yet."

    partial_summary = "\n".join([
        f"- {s.get('scheme_name', s.get('name','?'))}: {s.get('match_percent',0)}% match — Missing: {', '.join(s.get('failure_reasons', [])[:1])}"
        for s in partial_items
    ][:10]) or "None."

    ineligible_summary = "\n".join([
        f"- {s.get('scheme_name', s.get('name','?'))}: {s.get('failure_reasons', ['?'])[0] if s.get('failure_reasons') else 'Not eligible'}"
        for s in ineligible_items
    ][:8]) or "None."

    profile_str = json.dumps({
        "name": user_profile.get("name", "Farmer"),
        "age": user_profile.get("age"),
        "state": user_profile.get("state"),
        "occupation": user_profile.get("occupation"),
        "land_acres": user_profile.get("land_acres"),
        "annual_income": user_profile.get("annual_income"),
        "caste": user_profile.get("caste"),
        "gender": user_profile.get("gender"),
    }, ensure_ascii=False, indent=2)

    return f"""You are Kisan Mitra, a friendly and knowledgeable government scheme advisor helping rural Indians.
You speak ONLY in {lang_name}. Always respond in {lang_name} only.

User Profile:
{profile_str}

IMPORTANT COUNTS (use these EXACT numbers, do not guess):
- Total schemes in database: {total}
- FULLY ELIGIBLE: {len(eligible_items)} schemes
- PARTIALLY ELIGIBLE (close, missing 1-2 criteria): {len(partial_items)} schemes
- NOT ELIGIBLE: {len(ineligible_items)} schemes

Schemes this user IS FULLY ELIGIBLE for ({len(eligible_items)} total):
{eligible_summary}

Schemes this user is PARTIALLY ELIGIBLE for (top {min(len(partial_items),10)}):
{partial_summary}

Schemes this user is NOT eligible for ({len(ineligible_items)} total, showing top reasons):
{ineligible_summary}

Rules you MUST follow:
1. Only discuss Indian government schemes and rural welfare — politely decline other topics.
2. Always use the EXACT counts above when asked about number of eligible schemes.
3. If the user asks for LATEST UPDATES, INSTALLMENT DATES, DEADLINES, or NEWS, you MUST use the web search tool!
   To search the web, you MUST reply with exactly and only this JSON format:
   {{"SEARCH_TOOL": "your specific search query here"}}
   Do NOT output any other text when invoking the tool.
4. When user asks why they are ineligible, cite the EXACT rule that failed.
5. If user asks "what if I have X land/income/document" — re-evaluate hypothetically.
6. Keep responses under 4 sentences unless user asks for detail.
7. Always end with one concrete next step the user can take today.
8. NEVER make up schemes not in the provided list.
9. Use simple language — speak like advising a rural farmer/worker.
10. When listing schemes, always mention the benefit amount clearly in ₹.
11. Always be warm, encouraging, and empathetic."""


async def stream_chat(message: str, history: list, user_profile: dict, eligibility_results: list, language: str = "en"):
    """Stream chat response from Groq using AsyncGroq. Yields text chunks."""
    system_prompt = build_system_prompt(user_profile, eligibility_results, language)

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-10:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    # AsyncGroq returns an async stream — properly awaitable inside FastAPI
    stream = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=512,
        temperature=0.7,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def simple_chat(message: str, history: list, user_profile: dict, eligibility_results: list, language: str = "en") -> str:
    """Non-streaming chat for Web UI and WhatsApp bot. Supports Web Search Tool Calling."""
    system_prompt = build_system_prompt(user_profile, eligibility_results, language)
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-4:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=512,
        temperature=0.7,
    )
    
    content = response.choices[0].message.content.strip()
    
    # Check if Groq used our custom SEARCH_TOOL format
    import re
    search_match = re.search(r'\{\s*"SEARCH_TOOL"\s*:\s*"([^"]+)"\s*\}', content)
    
    if search_match:
        query = search_match.group(1)
        print(f"[Groq Web Search] Triggered for query: {query}")
        
        # Append the assistant's JSON response
        messages.append({"role": "assistant", "content": content})
        
        # Perform actual search
        search_result = search_gov_schemes(query)
        
        # Give results back to Groq as completely new system message context
        messages.append({
            "role": "user",
            "content": f"WEB SEARCH RESULTS FOR '{query}':\n{search_result}\n\nBased on these official results, answer my original question."
        })
        
        # Second call to synthesize answer
        final_response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=512,
            temperature=0.7,
        )
        return final_response.choices[0].message.content

    return content


    return response_message.content
