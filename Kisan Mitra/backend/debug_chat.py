"""Debug: test the exact chat_simple code path with a Supabase-like profile."""
import asyncio
import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()

# Simulate the exact profile stored in Supabase for the logged-in user
profile = {
    "name": "Anupras Davane",
    "age": 28,                         # sometimes stored as int, sometimes string
    "state": "Maharashtra",
    "district": "",
    "language": "hi",
    "gender": "male",
    "caste": "OBC",
    "occupation": "agricultural_laborer",
    "land_ownership": "owned",
    "land_acres": 2,
    "crops": [],
    "irrigation": "borewell",
    "craft_type": "",
    "annual_income": 100000,
    "has_bank_account": True,
    "has_aadhaar_doc": True,
    "is_income_tax_payer": False,
    "is_government_employee": False,
    "has_kcc": False,
    "is_bpl": False,
    "has_farm_loan": False,
    "is_shg_member": False,
    "has_lpg_connection": False,
    "has_kutcha_house": False,
    "has_girl_child": False,
    "girl_child_age": "",
    "has_aadhaar": True,
    "has_pan": False,
    "has_land_record": True,
    "has_income_certificate": False,
    "has_caste_certificate": False,
    "has_ration_card": False,
    "has_bpl_card": False,
    "has_education_cert": False,
    "is_rural": True,
}

print("Step 1: Testing run_eligibility...")
try:
    from services.eligibility_service import run_eligibility
    results = run_eligibility(profile)
    eligible = [r for r in results if r['eligible']]
    print(f"  ✅ OK — {len(eligible)} eligible schemes")
except Exception as e:
    import traceback
    print(f"  ❌ FAILED: {e}")
    traceback.print_exc()

print("\nStep 2: Testing simple_chat (Groq)...")
async def test_chat():
    try:
        from services.groq_service import simple_chat
        from services.eligibility_service import run_eligibility
        results = run_eligibility(profile)
        response = await simple_chat("What is the latest PRADHAN MANTRI KISAN SAMMAN NIDHI installment date in 2026? Give me the exact date from the news.", [], profile, results, "en")
        print(f"  ✅ OK — Response: {response[:100]}...")
    except Exception as e:
        import traceback
        print("  ❌ FAILED:", str(e))
        if hasattr(e, 'response'):
            print("  ❌ RESPONSE BODY:", e.response.json())
        traceback.print_exc()

asyncio.run(test_chat())
