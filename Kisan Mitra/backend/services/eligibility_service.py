"""
Eligibility Engine — evaluates user profile against all 57 schemes.
Returns per-scheme eligibility, match percent, failure reasons, and missing documents.
This mirrors the frontend JS eligibility engine for consistency.
"""
import json
import os
from typing import Any

# Load schemes once at module level
from functools import lru_cache

def _load_schemes_from_supabase() -> list:
    try:
        from database.supabase_client import supabase
        result = supabase.table('schemes')\
            .select('*')\
            .eq('is_active', True)\
            .order('benefit_amount', desc=True)\
            .execute()
        if result.data:
            print(f"✅ Loaded {len(result.data)} schemes from Supabase")
            return result.data
    except Exception as e:
        print(f"⚠️  Supabase load failed: {e}")
    
    # Fallback to JSON
    print("⚠️  Falling back to local schemes.json")
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'schemes.json')
    if os.path.exists(json_path):
        with open(json_path, encoding='utf-8') as f:
            data = json.load(f)
            return data.get('schemes') if isinstance(data, dict) else data
    return []

ALL_SCHEMES = _load_schemes_from_supabase()

DOCUMENT_LABELS = {
    "aadhaar": "Aadhaar Card",
    "pan_card": "PAN Card",
    "land_record_7_12": "Land Record / 7-12 Extract",
    "income_certificate": "Income Certificate",
    "caste_certificate": "Caste Certificate",
    "bank_passbook": "Bank Passbook",
    "passport_photo": "Passport Photo",
    "ration_card": "Ration Card",
    "birth_certificate_girl": "Girl Child Birth Certificate",
    "mobile_number": "Mobile Number (Aadhaar-linked)",
    "bpl_card": "BPL Card",
    "loan_documents": "Loan Documents",
    "education_certificate": "Education Certificate",
    "sowing_certificate": "Sowing Certificate",
    "trade_certificate": "Trade / Craft Certificate",
    "vendor_certificate": "Vendor Certificate / Identity Card",
    "shg_registration": "SHG Registration Certificate",
    "pm_kisan_registration": "PM-KISAN Registration Proof",
    "electricity_bill": "Electricity Bill",
    "site_plan": "Site / Layout Plan",
    "irrigation_plan": "Irrigation Plan Approval",
    "business_proof": "Business Proof / Registration",
    "antenatal_card": "Antenatal Care Card",
    "no_house_certificate": "No House / Homeless Certificate",
    "admission_letter": "College Admission Letter",
    "gram_panchayat_resolution": "Gram Panchayat Resolution",
    "quotation_machinery": "Machinery Quotation",
    "cluster_registration": "Organic Cluster Registration",
    "guardian_id": "Guardian ID Proof",
}

def _user_has_doc(profile: dict, doc: str) -> bool:
    """Check if user profile indicates they have a document."""
    doc_map = {
        "aadhaar": profile.get("has_aadhaar", False),
        "pan_card": profile.get("has_pan", False),
        "land_record_7_12": profile.get("has_land_record", False),
        "income_certificate": profile.get("has_income_certificate", False),
        "caste_certificate": profile.get("has_caste_certificate", False),
        "bank_passbook": profile.get("has_bank_account", False),
        "passport_photo": profile.get("has_passport_photo", True),  # assume true
        "ration_card": profile.get("has_ration_card", False),
        "mobile_number": profile.get("has_mobile", True),
        "bpl_card": profile.get("has_bpl_card", False),
        "birth_certificate_girl": profile.get("has_girl_birth_cert", False),
        "shg_registration": profile.get("is_shg_member", False),
        "trade_certificate": profile.get("has_trade_cert", False),
        "vendor_certificate": profile.get("has_vendor_cert", False),
        "education_certificate": profile.get("has_education_cert", False),
        "loan_documents": profile.get("has_loan_documents", False),
        "pm_kisan_registration": profile.get("is_pm_kisan_beneficiary", False),
    }
    return doc_map.get(doc, False)

def check_eligibility(profile: dict, scheme: dict) -> dict:
    """Run all eligibility checks for a single scheme. Returns detailed result."""
    e = scheme.get("eligibility", {})
    failures = []
    warnings = []
    checks_passed = 0
    total_checks = 0

    # Safely coerce numeric fields — Supabase JSONB can return strings
    def _int(val, default=0):
        try: return int(val) if val not in (None, "") else default
        except (TypeError, ValueError): return default
    def _float(val, default=0.0):
        try: return float(val) if val not in (None, "") else default
        except (TypeError, ValueError): return default

    user_age     = _int(profile.get("age", 0))
    user_income  = _int(profile.get("annual_income", 0))
    user_land    = _float(profile.get("land_acres", 0))
    # Helper: track check
    def check(condition: bool, failure_msg: str, is_hard: bool = True) -> bool:
        nonlocal checks_passed, total_checks
        total_checks += 1
        if condition:
            checks_passed += 1
            return True
        else:
            if is_hard:
                failures.append(failure_msg)
            else:
                warnings.append(failure_msg)
            return False

    # 1. Occupation
    allowed_occ = e.get("occupation", ["all"])
    if "all" not in allowed_occ:
        user_occ = profile.get("occupation", "")
        check(
            user_occ in allowed_occ,
            scheme.get("ineligibility_rules", {}).get("occupation",
                f"This scheme requires occupation: {', '.join(allowed_occ)}")
        )
    else:
        checks_passed += 1
        total_checks += 1

    # 2. Age
    age_min = e.get("age_min")
    age_max = e.get("age_max")
    if age_min is not None:
        check(user_age >= age_min, f"Minimum age required is {age_min} years. You are {user_age}.")
    if age_max is not None:
        check(user_age <= age_max, f"Maximum age allowed is {age_max} years. You are {user_age}.")

    # 3. Gender
    allowed_gender = e.get("gender", ["all"])
    if "all" not in allowed_gender:
        user_gender = profile.get("gender", "male").lower()
        gender_map = {"male": "male", "female": "female", "other": "other"}
        check(
            gender_map.get(user_gender, user_gender) in allowed_gender,
            scheme.get("ineligibility_rules", {}).get("gender", f"This scheme is for {', '.join(allowed_gender)} only")
        )
    else:
        checks_passed += 1
        total_checks += 1

    # 4. Caste
    allowed_caste = e.get("caste", ["all"])
    if "all" not in allowed_caste:
        user_caste = profile.get("caste", "General")
        check(
            user_caste in allowed_caste,
            f"This scheme is for {', '.join(allowed_caste)} category only. Your category: {user_caste}"
        )
    else:
        checks_passed += 1
        total_checks += 1

    # 5. State restriction
    allowed_states = scheme.get("states", ["all"])
    if "all" not in allowed_states:
        user_state = profile.get("state", "")
        check(
            user_state in allowed_states,
            f"This scheme is only available in {', '.join(allowed_states)}. You are from {user_state}."
        )
    else:
        checks_passed += 1
        total_checks += 1

    # 6. Land size
    min_land = e.get("min_land_acres")
    max_land = e.get("max_land_acres")
    if min_land is not None and min_land > 0:
        check(user_land >= min_land, f"Minimum {min_land} acres of land required. You have {user_land} acres.")
    if max_land is not None:
        check(user_land <= max_land, f"Maximum land limit is {max_land} acres. You have {user_land} acres.")

    # 7. Income
    max_income = e.get("max_annual_income")
    if max_income is not None:
        user_income = profile.get("annual_income", 0)
        check(
            user_income <= max_income,
            f"Income limit is ₹{max_income:,}/year. Your income ₹{user_income:,} exceeds the limit."
        )

    # 8. Disqualifiers
    disqualifiers = e.get("disqualifiers", [])
    if "government_employee" in disqualifiers and profile.get("is_government_employee", False):
        check(False, "Government employees are not eligible for this scheme.")
    if "income_tax_payer" in disqualifiers and profile.get("is_income_tax_payer", False):
        check(False, "Income tax payers are not eligible for this scheme.")
    if "institutional_landowner" in disqualifiers and profile.get("is_institutional_landowner", False):
        check(False, "Institutional land owners are not eligible.")
    if "defaulter" in disqualifiers and profile.get("is_loan_defaulter", False):
        check(False, "Loan defaulters are not eligible for this scheme.")

    # 9. Special conditions
    if e.get("must_be_rural") and not profile.get("is_rural", True):
        check(False, "This scheme is only for rural area residents.")
    if e.get("must_be_bpl") and not profile.get("is_bpl", False):
        check(False, "Must be from a BPL (Below Poverty Line) household.", is_hard=True)
    if e.get("must_be_bpl_or_kutcha_house") and not (profile.get("is_bpl", False) or profile.get("has_kutcha_house", False)):
        check(False, "Must be from a BPL household or living in a kutcha/dilapidated house.", is_hard=True)
    if e.get("must_be_shg_member") and not profile.get("is_shg_member", False):
        check(False, "Must be an active member of a registered Women Self Help Group.", is_hard=True)
    if e.get("must_have_farm_loan") and not profile.get("has_farm_loan", False):
        check(False, "Must have an outstanding agricultural loan from a bank.", is_hard=True)
    if e.get("must_be_pm_kisan_beneficiary") and not profile.get("is_pm_kisan_beneficiary", False):
        check(False, "Must already be enrolled in PM-KISAN scheme.", is_hard=False)
    if e.get("girl_child_age_max") is not None:
        raw_girl_age = profile.get("girl_child_age")
        girl_age = _int(raw_girl_age, default=-1)  # -1 means not provided / empty
        if girl_age < 0:
            check(False, "Must have a girl child with valid age for this scheme.", is_hard=True)
        elif girl_age > e["girl_child_age_max"]:
            check(False, f"Girl child must be under {e['girl_child_age_max']} years. Your girl child is {girl_age}.", is_hard=True)
        else:
            checks_passed += 1; total_checks += 1
    if e.get("must_have_girl_child") and not profile.get("has_girl_child", False):
        check(False, "Must have a girl child in the family.", is_hard=True)
    if e.get("no_existing_lpg") and profile.get("has_lpg_connection", False):
        check(False, "Household already has an LPG connection. Not eligible.", is_hard=True)
    if e.get("no_existing_bank_account") and profile.get("has_bank_account", False):
        check(False, "Already has a bank account. PM Jan Dhan is for unbanked individuals.", is_hard=False)
    if e.get("must_be_secc_listed") and not profile.get("is_secc_listed", False):
        check(False, "Must be listed in SECC 2011 or belong to identified vulnerable group.", is_hard=False)

    # 10. Document check
    required_docs = scheme.get("documents_required", [])
    docs_have = [d for d in required_docs if _user_has_doc(profile, d)]
    docs_missing = [d for d in required_docs if not _user_has_doc(profile, d)]

    # Calculate eligibility
    eligible = len(failures) == 0
    match_percent = round((checks_passed / max(total_checks, 1)) * 100)

    # Priority score: benefit_amount × match_percent / 100 weighted by deadline urgency
    from datetime import datetime
    deadline_str = scheme.get("deadline", "2026-12-31")
    try:
        deadline_dt = datetime.strptime(deadline_str, "%Y-%m-%d")
        days_left = (deadline_dt - datetime.now()).days
        urgency = max(1.5 - (days_left / 365), 0.5)  # Higher score for sooner deadlines
    except Exception:
        urgency = 1.0

    benefit = scheme.get("benefit_amount", 0)
    priority_score = round((benefit * (match_percent / 100) * urgency) / 1000, 2)

    return {
        "scheme_id": scheme["id"],
        "scheme_name": scheme["name"],
        "eligible": eligible,
        "partially_eligible": not eligible and match_percent >= 50,
        "match_percent": match_percent,
        "failure_reasons": failures,
        "warnings": warnings,
        "missing_documents": [{"id": d, "label": DOCUMENT_LABELS.get(d, d)} for d in docs_missing],
        "documents_you_have": [{"id": d, "label": DOCUMENT_LABELS.get(d, d)} for d in docs_have],
        "benefit_amount": benefit,
        "benefit_description": scheme.get("benefit_description", ""),
        "priority_score": priority_score,
        "deadline": scheme.get("deadline"),
        "deadline_label": scheme.get("deadline_label", ""),
        "category": scheme.get("category", []),
        "apply_url": scheme.get("apply_url", ""),
        "ministry": scheme.get("ministry", ""),
        "tags": scheme.get("tags", []),
    }

def run_eligibility(profile: dict) -> list[dict]:
    """Run eligibility check for all schemes. Returns sorted by priority_score desc."""
    results = [check_eligibility(profile, s) for s in ALL_SCHEMES]
    results.sort(key=lambda x: x["priority_score"], reverse=True)
    return results

def run_whatif(profile: dict, changes: dict) -> dict:
    """Run eligibility with hypothetical profile changes. Returns diff of gained/lost schemes."""
    modified_profile = {**profile, **changes}
    original = {r["scheme_id"]: r for r in run_eligibility(profile)}
    modified = {r["scheme_id"]: r for r in run_eligibility(modified_profile)}

    gained = []
    lost = []
    for sid, mod_result in modified.items():
        orig_result = original.get(sid, {})
        was_eligible = orig_result.get("eligible", False)
        now_eligible = mod_result.get("eligible", False)
        if now_eligible and not was_eligible:
            gained.append(mod_result)
        elif not now_eligible and was_eligible:
            lost.append(mod_result)

    return {
        "original_eligible_count": sum(1 for r in original.values() if r["eligible"]),
        "modified_eligible_count": sum(1 for r in modified.values() if r["eligible"]),
        "gained_eligibility": gained,
        "lost_eligibility": lost,
        "all_results": list(modified.values()),
    }

def refresh_schemes():
    """Call this to reload schemes from Supabase without restarting server."""
    global ALL_SCHEMES
    ALL_SCHEMES = _load_schemes_from_supabase()
    return len(ALL_SCHEMES)
