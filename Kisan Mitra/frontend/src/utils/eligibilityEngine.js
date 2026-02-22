/**
 * Client-side eligibility engine — mirrors backend eligibility_service.py exactly.
 * Runs against all 57 schemes in real time from local schemes.json.
 */
import SCHEMES from '../data/schemes.json'

const DOCUMENT_LABELS = {
    aadhaar: 'Aadhaar Card', pan_card: 'PAN Card', land_record_7_12: 'Land Record / 7-12',
    income_certificate: 'Income Certificate', caste_certificate: 'Caste Certificate',
    bank_passbook: 'Bank Passbook', passport_photo: 'Passport Photo', ration_card: 'Ration Card',
    birth_certificate_girl: 'Girl Child Birth Certificate', mobile_number: 'Mobile Number',
    bpl_card: 'BPL Card', loan_documents: 'Loan Documents', education_certificate: 'Education Certificate',
    sowing_certificate: 'Sowing Certificate', trade_certificate: 'Trade Certificate',
    vendor_certificate: 'Vendor Certificate', shg_registration: 'SHG Registration',
    pm_kisan_registration: 'PM-KISAN Registration', electricity_bill: 'Electricity Bill',
    site_plan: 'Site/Layout Plan', business_proof: 'Business Proof', antenatal_card: 'Antenatal Card',
}

function userHasDoc(profile, doc) {
    const m = {
        aadhaar: profile.has_aadhaar, pan_card: profile.has_pan,
        land_record_7_12: profile.has_land_record, income_certificate: profile.has_income_certificate,
        caste_certificate: profile.has_caste_certificate, bank_passbook: profile.has_bank_account,
        passport_photo: true, ration_card: profile.has_ration_card, mobile_number: true,
        bpl_card: profile.has_bpl_card, birth_certificate_girl: profile.has_girl_birth_cert,
        shg_registration: profile.is_shg_member, trade_certificate: profile.has_trade_cert,
        education_certificate: profile.has_education_cert, loan_documents: profile.has_loan_documents,
        pm_kisan_registration: profile.is_pm_kisan_beneficiary,
    }
    return !!m[doc]
}

export function checkEligibility(profile, scheme) {
    const e = scheme.eligibility || {}
    const failures = [], warnings = []
    let passed = 0, total = 0

    const check = (cond, msg, hard = true) => {
        total++
        if (cond) { passed++; return true }
        hard ? failures.push(msg) : warnings.push(msg)
        return false
    }

    // Occupation
    const occ = e.occupation || ['all']
    if (!occ.includes('all')) {
        check(occ.includes(profile.occupation), e.ineligibility_rules?.occupation || `Requires: ${occ.join(', ')}`)
    } else { passed++; total++ }

    // Age
    if (e.age_min) check(+profile.age >= e.age_min, `Minimum age is ${e.age_min} years`)
    if (e.age_max) check(+profile.age <= e.age_max, `Maximum age is ${e.age_max} years`)

    // Gender
    const genList = e.gender || ['all']
    if (!genList.includes('all')) {
        check(genList.includes(profile.gender?.toLowerCase()), `This scheme is for ${genList.join('/')} only`)
    } else { passed++; total++ }

    // Caste
    const casteList = e.caste || ['all']
    if (!casteList.includes('all')) {
        check(casteList.includes(profile.caste), `Only ${casteList.join('/')} category eligible`)
    } else { passed++; total++ }

    // State
    const states = scheme.states || ['all']
    if (!states.includes('all')) {
        check(states.includes(profile.state), `Only available in ${states.join(', ')}`)
    } else { passed++; total++ }

    // Land
    if (e.min_land_acres > 0) check(+profile.land_acres >= e.min_land_acres, `Min ${e.min_land_acres} acres required`)
    if (e.max_land_acres) check(+profile.land_acres <= e.max_land_acres, `Land exceeds limit of ${e.max_land_acres} acres`)

    // Income
    if (e.max_annual_income != null) {
        check(+profile.annual_income <= e.max_annual_income, `Income ₹${profile.annual_income} exceeds limit ₹${e.max_annual_income}`)
    }

    // Disqualifiers
    const disq = e.disqualifiers || []
    if (disq.includes('government_employee') && profile.is_government_employee) check(false, 'Government employees not eligible')
    if (disq.includes('income_tax_payer') && profile.is_income_tax_payer) check(false, 'Income tax payers not eligible')
    if (disq.includes('defaulter') && profile.is_loan_defaulter) check(false, 'Loan defaulters not eligible')

    // Special conditions
    if (e.must_be_bpl && !profile.is_bpl) check(false, 'Must be from BPL household')
    if (e.must_be_bpl_or_kutcha_house && !profile.is_bpl && !profile.has_kutcha_house) check(false, 'Must be BPL or in kutcha house')
    if (e.must_be_shg_member && !profile.is_shg_member) check(false, 'Must be Women SHG member')
    if (e.must_have_farm_loan && !profile.has_farm_loan) check(false, 'Must have outstanding agricultural loan')
    if (e.girl_child_age_max != null) {
        if (!profile.has_girl_child) check(false, 'Must have a girl child')
        else check(+profile.girl_child_age <= e.girl_child_age_max, `Girl child must be under ${e.girl_child_age_max} years`)
    }
    if (e.must_have_girl_child && !profile.has_girl_child) check(false, 'Must have a girl child')
    if (e.no_existing_lpg && profile.has_lpg_connection) check(false, 'Household already has LPG connection', false)
    if (e.must_be_secc_listed && !profile.is_secc_listed) check(false, 'Not in SECC 2011 list', false)

    // Documents
    const reqDocs = scheme.documents_required || []
    const docsHave = reqDocs.filter(d => userHasDoc(profile, d))
    const docsMissing = reqDocs.filter(d => !userHasDoc(profile, d))

    const eligible = failures.length === 0
    const matchPercent = Math.round((passed / Math.max(total, 1)) * 100)

    // Priority score
    const benefit = scheme.benefit_amount || 0
    let urgency = 1
    try {
        const daysLeft = (new Date(scheme.deadline) - new Date()) / 86400000
        urgency = Math.max(1.5 - daysLeft / 365, 0.5)
    } catch { }
    const priorityScore = Math.round(benefit * (matchPercent / 100) * urgency / 1000 * 100) / 100

    return {
        scheme_id: scheme.id,
        scheme_name: scheme.name,
        scheme_name_hi: scheme.name_hi,
        scheme_name_mr: scheme.name_mr,
        eligible,
        partially_eligible: !eligible && matchPercent >= 50,
        match_percent: matchPercent,
        failure_reasons: failures,
        warnings,
        missing_documents: docsMissing.map(d => ({ id: d, label: DOCUMENT_LABELS[d] || d })),
        documents_you_have: docsHave.map(d => ({ id: d, label: DOCUMENT_LABELS[d] || d })),
        benefit_amount: benefit,
        benefit_description: scheme.benefit_description,
        benefit_type: scheme.benefit_type,
        priority_score: priorityScore,
        deadline: scheme.deadline,
        deadline_label: scheme.deadline_label,
        category: scheme.category || [],
        tags: scheme.tags || [],
        apply_url: scheme.apply_url,
        apply_mode: scheme.apply_mode || [],
        ministry: scheme.ministry,
        beneficiary_type: scheme.beneficiary_type || [],
        description: scheme.description,
        description_hi: scheme.description_hi,
        description_mr: scheme.description_mr,
    }
}

export function runEligibility(profile) {
    if (!profile) return []
    const results = SCHEMES.map(s => checkEligibility(profile, s))
    return results.sort((a, b) => b.priority_score - a.priority_score)
}

export function runWhatIf(profile, changes) {
    const modified = { ...profile, ...changes }
    const original = Object.fromEntries(runEligibility(profile).map(r => [r.scheme_id, r]))
    const modifiedResults = runEligibility(modified)
    const gained = modifiedResults.filter(r => r.eligible && !original[r.scheme_id]?.eligible)
    const lost = modifiedResults.filter(r => !r.eligible && original[r.scheme_id]?.eligible)
    return { gained, lost, all: modifiedResults }
}

export { SCHEMES }
