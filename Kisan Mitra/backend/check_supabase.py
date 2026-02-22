"""Check what's stored in Supabase users table."""
import os
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

sb = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("=" * 60)
print("SUPABASE CHECK")
print("=" * 60)

# Auth users
try:
    auth_users = sb.auth.admin.list_users()
    print(f"\n[AUTH] Registered users: {len(auth_users)}")
    for u in auth_users:
        print(f"  • {u.email} | id: {str(u.id)[:8]}... | created: {str(u.created_at)[:10]}")
except Exception as e:
    print(f"[AUTH] Error: {e}")

# Public users table
try:
    rows = sb.table('users').select('*').execute()
    print(f"\n[TABLE users] Rows: {len(rows.data)}")
    for r in rows.data:
        profile = r.get('profile', {}) or {}
        print(f"  • Name: {r.get('name')} | Email: {r.get('email')}")
        print(f"    Profile keys: {list(profile.keys()) if profile else 'EMPTY'}")
        print(f"    State: {profile.get('state')} | Occupation: {profile.get('occupation')}")
        print(f"    Income: ₹{profile.get('annual_income', 'N/A')}")
except Exception as e:
    print(f"[TABLE users] Error (table might not exist): {e}")

# Chat history
try:
    chats = sb.table('chat_history').select('*').limit(5).execute()
    print(f"\n[TABLE chat_history] Total rows: {len(chats.data)}")
except Exception as e:
    print(f"[TABLE chat_history] Error: {e}")

print("\n" + "=" * 60)
