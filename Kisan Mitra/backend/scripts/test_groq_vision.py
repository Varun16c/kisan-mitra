import os, sys, base64
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

from groq import Groq

def test_groq_vision():
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        print("❌ GROQ_API_KEY not found in .env")
        return False
    
    try:
        # Create a tiny 1x1 black pixel PNG in base64
        pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is in this image?"},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{pixel}"}}
                ]
            }],
            max_tokens=20
        )
        print(f"✅ Groq Vision working: {response.choices[0].message.content.strip()}")
        return True
    except Exception as e:
        print(f"❌ Groq Vision failed: {e}")
        return False

if __name__ == '__main__':
    test_groq_vision()
