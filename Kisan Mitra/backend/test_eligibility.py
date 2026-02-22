import sys
sys.path.insert(0, '.')
from services.eligibility_service import run_eligibility, ALL_SCHEMES

profile = {
    'name': 'Test Farmer', 'age': 38, 'state': 'Maharashtra',
    'occupation': 'farmer', 'land_acres': 3, 'annual_income': 80000,
    'gender': 'male', 'caste': 'OBC',
    'has_aadhaar': True, 'has_bank_account': True, 'has_land_record': True
}

results = run_eligibility(profile)
eligible = [r for r in results if r['eligible']]
partial = [r for r in results if r.get('partially_eligible') and not r['eligible']]

print(f"Total schemes loaded: {len(ALL_SCHEMES)}")
print(f"Eligible: {len(eligible)}")
print(f"Partial: {len(partial)}")
print(f"Top 5 eligible:")
for r in eligible[:5]:
    print(f"  - {r['scheme_name']}: Rs{r['benefit_amount']:,} ({r['match_percent']}% match)")
