import json, os
from datetime import datetime

NORMALIZATION_PROMPT = """
You are a data normalization engine for Indian government schemes.
Convert the raw input to this exact JSON structure.

FIELD MAPPING RULES:
1. "name" → short common name (e.g. "PM-KISAN", "PMFBY")
2. "canonical_name" → full official name
3. "states" → list of state names OR ["all"] for national schemes
   Use full state names: ["Maharashtra", "Uttar Pradesh"] NOT codes
   National/all states → ["all"]
4. "benefit_amount" → annual INR as plain float
   Monthly ×12, one-time as-is, unknown → 0
5. "deadline" → "YYYY-MM-DD" string or null
6. "eligibility" object MUST use these exact keys:
   occupation: list — allowed: ["all","farmer","laborer","woman","student","artisan","self_employed","daily_wage"]
   age_min: int or null
   age_max: int or null  
   gender: list — allowed: ["all","male","female"]
   caste: list — allowed: ["all","General","OBC","SC","ST"]
   min_land_acres: float or null
   max_land_acres: float or null
   max_annual_income: int or null (INR)
   disqualifiers: list — values from: ["government_employee","income_tax_payer","institutional_landowner","defaulter"]
   must_be_rural: bool or null
   must_be_bpl: bool or null
   must_be_bpl_or_kutcha_house: bool or null
   must_be_shg_member: bool or null
   must_have_farm_loan: bool or null
   must_be_pm_kisan_beneficiary: bool or null
   girl_child_age_max: int or null
   must_have_girl_child: bool or null
   no_existing_lpg: bool or null
   no_existing_bank_account: bool or null
   must_be_secc_listed: bool or null
7. "documents_required" → list using ONLY these ids:
   aadhaar, pan_card, land_record_7_12, income_certificate,
   caste_certificate, bank_passbook, passport_photo, ration_card,
   birth_certificate_girl, mobile_number, bpl_card, loan_documents,
   education_certificate, sowing_certificate, trade_certificate,
   vendor_certificate, shg_registration, pm_kisan_registration,
   electricity_bill, site_plan, irrigation_plan, business_proof,
   antenatal_card, no_house_certificate, admission_letter,
   gram_panchayat_resolution, quotation_machinery,
   cluster_registration, guardian_id
8. "category" → list from: agriculture, housing, finance, education,
   health, women, sc_st, insurance, pension, employment, skill_development
9. "ineligibility_rules" → dict with plain-language failure messages:
   {"occupation": "This scheme is only for farmers",
    "caste": "This scheme is for SC/ST only", ...}
10. "benefit_type" → cash/subsidy/loan/insurance/asset/service/scholarship
11. "confidence_score" → 0.0-1.0 completeness rating
12. null for unknown fields — never guess

OUTPUT FORMAT:
{
  "id": "url-safe-slug-here",
  "name": "Short Name",
  "canonical_name": "Full Official Name",
  "aliases": [],
  "category": [],
  "tags": [],
  "states": ["all"],
  "level": "central or state",
  "state_specific": null,
  "ministry": "Ministry name",
  "benefit_amount": 0.0,
  "benefit_description": "What farmer gets",
  "benefit_type": "cash",
  "benefit_frequency": "annual",
  "eligibility": {
    "occupation": ["all"],
    "age_min": null,
    "age_max": null,
    "gender": ["all"],
    "caste": ["all"],
    "min_land_acres": null,
    "max_land_acres": null,
    "max_annual_income": null,
    "disqualifiers": [],
    "must_be_rural": null,
    "must_be_bpl": null,
    "must_be_bpl_or_kutcha_house": null,
    "must_be_shg_member": null,
    "must_have_farm_loan": null,
    "must_be_pm_kisan_beneficiary": null,
    "girl_child_age_max": null,
    "must_have_girl_child": null,
    "no_existing_lpg": null,
    "no_existing_bank_account": null,
    "must_be_secc_listed": null
  },
  "documents_required": [],
  "documents_optional": [],
  "apply_url": "",
  "apply_mode": [],
  "apply_steps": [],
  "deadline": null,
  "deadline_label": "",
  "deadline_type": "rolling",
  "ineligibility_rules": {},
  "description": "",
  "summary": "",
  "confidence_score": 0.5
}

RAW INPUT DATA:
{raw_data}

If the raw data contains a "web_context" field, use that scraped web text to fill in the exact eligibility constraints like missing income limits, deadlines, or land acres.
Return ONLY valid JSON. No markdown. No explanation. No extra text.
"""

class SchemeNormalizer:
    def __init__(self):
        from groq import AsyncGroq
        from dotenv import load_dotenv
        load_dotenv()
        self.client = AsyncGroq(api_key=os.getenv('GROQ_API_KEY'))
    
    def _make_id(self, name: str) -> str:
        import re
        slug = name.lower()
        replacements = {
            'pradhan mantri ': 'pm-', 'pradhanmantri ': 'pm-',
            ' yojana': '', ' scheme': '', ' abhiyan': '', ' mission': '',
            ' nidhi': '', ' samman': ''
        }
        for old, new in replacements.items():
            slug = slug.replace(old, new)
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug.strip())
        slug = re.sub(r'-+', '-', slug).strip('-')
        return slug[:60]  # max 60 chars
    
    def _clean_json_response(self, text: str) -> str:
        text = text.strip()
        if text.startswith('```'):
            lines = text.split('\n')
            text = '\n'.join(lines[1:-1])
            if text.startswith('json'): text = text[4:]
        return text
    
    async def normalize(self, raw_data: dict, source_url: str) -> dict:
        prompt = NORMALIZATION_PROMPT.replace('{raw_data}', 
            json.dumps(raw_data, indent=2, ensure_ascii=False))
        
        try:
            response = await self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"},
                timeout=30.0
            )
            clean = self._clean_json_response(response.choices[0].message.content)
            normalized = json.loads(clean)
            
            # Ensure ID exists
            if not normalized.get('id'):
                name = normalized.get('name') or normalized.get('canonical_name', '')
                normalized['id'] = self._make_id(name)
            
        except (json.JSONDecodeError, Exception) as e:
            # Fallback — preserve what we can, flag for review
            name = raw_data.get('name') or raw_data.get('scheme_name', 'Unknown Scheme')
            normalized = {
                'id': self._make_id(name),
                'name': name,
                'canonical_name': name,
                'description': raw_data.get('description', ''),
                'eligibility': {},
                'documents_required': [],
                'states': ['all'],
                'category': [],
                'tags': [],
                'benefit_amount': 0,
                'benefit_description': raw_data.get('benefits_raw', ''),
                'confidence_score': 0.1,
                'needs_review': True,
                'review_reason': f'Normalization failed: {str(e)[:100]}'
            }
        
        # Add pipeline metadata
        normalized.setdefault('sources', [])
        normalized['sources'] = list(set(normalized['sources'] + [source_url]))
        normalized.setdefault('source_ids', {})
        normalized.setdefault('is_active', True)
        normalized.setdefault('needs_review', False)
        normalized['last_updated'] = datetime.utcnow().isoformat()
        normalized['created_at'] = datetime.utcnow().isoformat()
        
        return normalized
