import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai

def test_gemini():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env")
        return False
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content("Say 'Gemini working' and nothing else.")
        print(f"✅ Gemini working: {response.text.strip()}")
        return True
    except Exception as e:
        print(f"❌ Gemini failed: {e}")
        return False

if __name__ == '__main__':
    test_gemini()
