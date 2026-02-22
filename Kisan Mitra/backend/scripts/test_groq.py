import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

from groq import Groq

def test_groq():
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        print("❌ GROQ_API_KEY not found in .env")
        return False
    
    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say 'Groq working' and nothing else."}],
            max_tokens=20
        )
        print(f"✅ Groq working: {response.choices[0].message.content.strip()}")
        return True
    except Exception as e:
        print(f"❌ Groq failed: {e}")
        return False

if __name__ == '__main__':
    test_groq()
