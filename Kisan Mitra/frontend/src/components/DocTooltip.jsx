/**
 * DocTooltip — accordion card showing "how to get" info for a document.
 * Hardcoded per doc type: office, time, cost, steps. No API call.
 */
import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, Clock, IndianRupee, CheckSquare } from 'lucide-react'

const DOC_GUIDE = {
    aadhaar: {
        label: 'Aadhaar Card',
        emoji: '🪪',
        office: 'Aadhaar Seva Kendra / nearby post office',
        time: '15–30 days (new enrolment)',
        cost: 'Free (first time) · ₹50 for reprint',
        steps: [
            'Visit nearest Aadhaar enrolment centre (find via uidai.gov.in)',
            'Carry proof of identity (passport / Voter ID) and proof of address',
            'Biometrics and photo captured; receive enrolment slip',
            'Download e-Aadhaar from uidai.gov.in in ~15 days',
        ],
    },
    pan_card: {
        label: 'PAN Card',
        emoji: '🗂️',
        office: 'TIN-FC / NSDL centre / online at onlineservices.nsdl.com',
        time: '10–15 business days',
        cost: '₹107 (physical) · ₹66 (email only)',
        steps: [
            'Apply online at nsdlpan.utiitsl.com or visit NSDL centre',
            'Fill Form 49A, attach identity proof, address proof, 2 photos',
            'Pay application fee and submit',
            'PAN sent to registered address within 15 days',
        ],
    },
    land_record_7_12: {
        label: 'Land Record / 7-12',
        emoji: '🌾',
        office: 'Talathi (village revenue officer) or Mahabhulekh portal (MH)',
        time: 'Same day (when downloaded online)',
        cost: 'Free online · ₹15–30 at office',
        steps: [
            'Visit mahabhulekh.maharashtra.gov.in (MH) or your state land portal',
            'Select district → taluka → village → survey number',
            'Download digitally signed 7/12 extract',
            'For certified copy: visit Talathi office with₹30 fee',
        ],
    },
    income_certificate: {
        label: 'Income Certificate',
        emoji: '📃',
        office: 'Tehsildar / SDO office or state Aaple Sarkar portal',
        time: '7–15 working days',
        cost: '₹20–50 (stamp fee)',
        steps: [
            'Fill application at Tehsildar office or apply online via state portal',
            'Attach Aadhaar, ration card, salary slips or self-declaration',
            'Verification by revenue officer',
            'Collect certificate from office or download from portal',
        ],
    },
    caste_certificate: {
        label: 'Caste Certificate',
        emoji: '📜',
        office: 'SDO / Tehsildar office or state online service portal',
        time: '15–30 working days',
        cost: '₹30–100 (stamp & verification fee)',
        steps: [
            'Apply online at state portal (e.g. aaplesarkar.mahaonline.gov.in) or in-person',
            'Attach Aadhaar, school leaving certificate, family caste proof',
            'Inquiry by revenue officer at village level',
            'Collect from office or download digital certificate',
        ],
    },
    bank_passbook: {
        label: 'Bank Passbook / Account',
        emoji: '🏦',
        office: 'Nearest SBI / Bank of Maharashtra / cooperative bank branch',
        time: '1–3 days (Jan Dhan account instant)',
        cost: 'Zero-balance Jan Dhan account is FREE',
        steps: [
            'Visit nearest bank branch with Aadhaar and one photo',
            'Request Pradhan Mantri Jan Dhan Yojana (PMJDY) account',
            'Account opened same day; passbook issued immediately',
            'Link with Aadhaar for DBT within 48 hours',
        ],
    },
    ration_card: {
        label: 'Ration Card',
        emoji: '🍚',
        office: 'Talathi / village panchayat / district Food Supply office',
        time: '30–45 days',
        cost: '₹5–20 application fee',
        steps: [
            'Obtain application form from village panchayat or state food portal',
            'Attach family photos, Aadhaar copies of all members, address proof',
            'Submit at district Food & Civil Supplies office',
            'Field verification; card issued by post or collect at panchayat',
        ],
    },
    passport_photo: {
        label: 'Passport-size Photo',
        emoji: '📸',
        office: 'Any photo studio',
        time: 'Immediate',
        cost: '₹30–80 for 4 photos',
        steps: [
            'Visit any local photo studio',
            'White or light blue background, ears visible',
            'Specify "passport size" (3.5×4.5 cm)',
            'Get at least 6 copies for multiple scheme applications',
        ],
    },
    bpl_card: {
        label: 'BPL Card',
        emoji: '🪪',
        office: 'Gram Panchayat / District Collector office',
        time: '30–60 days (linked to BPL survey)',
        cost: 'Free',
        steps: [
            'BPL status is determined by SECC survey — no direct application',
            'Verify your name in SECC list at gram panchayat',
            'If eligible: contact BDO office to get BPL certificate',
            'Carry income certificate and ration card for verification',
        ],
    },
    loan_documents: {
        label: 'Loan Documents / KCC',
        emoji: '📋',
        office: 'Nearest agricultural / cooperative bank branch',
        time: '7–21 days (KCC)',
        cost: 'Processing fee: ₹200–500 depending on bank',
        steps: [
            'Visit bank with land record (7-12), Aadhaar, PAN, ration card',
            'Fill KCC or agricultural loan application',
            'Bank officer inspects land and crop details',
            'Loan sanctioned and passbook issued within 21 days',
        ],
    },
    education_certificate: {
        label: 'Education Certificate',
        emoji: '🎓',
        office: 'School / college that issued the certificate',
        time: '3–7 days',
        cost: '₹50–200 for attested copy',
        steps: [
            'Contact the school/college office',
            'Apply for bonafide certificate or mark sheet duplicate',
            'Pay prescribed fee',
            'Attest the copy from a gazetted officer or notary',
        ],
    },
    trade_certificate: {
        label: 'Trade Certificate',
        emoji: '🔨',
        office: 'ITI / DTET office or MSME registration portal',
        time: '7–30 days',
        cost: 'Free (MSME Udyam) · ₹200–500 (ITI)',
        steps: [
            'For Udyam: register free at udyamregistration.gov.in',
            'For ITI trade certificate: collect from the ITI you attended',
            'For artisans: register at DC Handicrafts or state craft board',
        ],
    },
    shg_registration: {
        label: 'SHG Registration',
        emoji: '👩‍🤝‍👩',
        office: 'Block Development Office (BDO) / NRLM office',
        time: '14–30 days',
        cost: '₹100–300 registration fee',
        steps: [
            'Form a group of 10–20 women from the same village',
            'Apply for registration at BDO / NRLM block office',
            'Open a savings bank account in the group name',
            'Maintain meeting minutes and savings passbook',
        ],
    },
}

const UNKNOWN_GUIDE = {
    label: 'Document',
    emoji: '📄',
    office: 'Gram Panchayat or nearest government office',
    time: 'Varies (7–30 days typically)',
    cost: 'Nominal fee (₹20–100)',
    steps: [
        'Visit your nearest Gram Panchayat or Tehsildar office',
        'Enquire about the specific document requirement',
        'Carry Aadhaar and any relevant supporting document',
    ],
}

export default function DocTooltip({ docId, docLabel }) {
    const [open, setOpen] = useState(false)
    const guide = DOC_GUIDE[docId] || { ...UNKNOWN_GUIDE, label: docLabel || 'Document' }

    return (
        <div style={{ marginTop: 6, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            {/* Toggle row */}
            <button
                id={`doc-tooltip-${docId}`}
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: open ? '#f0fdf4' : '#fafafa',
                    border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .15s',
                }}
            >
                <span style={{ fontWeight: 600, fontSize: '.8rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{guide.emoji}</span>
                    How to get: {guide.label}
                </span>
                {open ? <ChevronUp size={15} color="#16a34a" /> : <ChevronDown size={15} color="#9ca3af" />}
            </button>

            {/* Content */}
            {open && (
                <div style={{ padding: '12px 14px', background: '#fafffe', borderTop: '1px solid #e5e7eb', animation: 'fadeIn .15s ease' }}>
                    {/* Meta row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.78rem', color: '#374151' }}>
                            <MapPin size={13} color="#16a34a" />
                            <span>{guide.office}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.78rem', color: '#374151' }}>
                            <Clock size={13} color="#d97706" />
                            <span>{guide.time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.78rem', color: '#374151' }}>
                            <IndianRupee size={13} color="#7c3aed" />
                            <span>{guide.cost}</span>
                        </div>
                    </div>

                    {/* Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {guide.steps.map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <CheckSquare size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                                <span style={{ fontSize: '.78rem', color: '#374151', lineHeight: 1.4 }}>{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}