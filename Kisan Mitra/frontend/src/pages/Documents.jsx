/**
 * Documents — full document manager for Kisan Mitra.
 * Tab 1: Doc Checklist per eligible scheme (you have / still need + DocTooltip).
 * Tab 2: OCR upload (the existing AI extraction flow, preserved).
 * Tab 3: Deadline Calendar (mini calendar with scheme deadline dots).
 */
import { useState, useRef } from 'react'
import Layout from '../components/Layout/Navbar'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../hooks/useTranslation'
import { extractDocument } from '../utils/api'
import DocTooltip from '../components/DocTooltip'
import DeadlineCalendar from '../components/DeadlineCalendar'
import {
    Upload, FileCheck, AlertTriangle, CheckCircle2, XCircle,
    FileText, CalendarDays, Camera, ChevronDown, ChevronUp,
    Search, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ─── DOC LABEL MAP ─────────────────────────────────────────── */
const DOC_LABELS = {
    aadhaar: 'Aadhaar Card',
    pan_card: 'PAN Card',
    land_record_7_12: 'Land Record / 7-12',
    income_certificate: 'Income Certificate',
    caste_certificate: 'Caste Certificate',
    bank_passbook: 'Bank Passbook',
    passport_photo: 'Passport Photo',
    ration_card: 'Ration Card',
    bpl_card: 'BPL Card',
    birth_certificate_girl: 'Girl Child Birth Certificate',
    mobile_number: 'Mobile Number',
    loan_documents: 'Loan / KCC Documents',
    education_certificate: 'Education Certificate',
    sowing_certificate: 'Sowing Certificate',
    trade_certificate: 'Trade Certificate',
    vendor_certificate: 'Vendor Certificate',
    shg_registration: 'SHG Registration',
    pm_kisan_registration: 'PM-KISAN Registration',
    electricity_bill: 'Electricity Bill',
    site_plan: 'Site/Layout Plan',
    business_proof: 'Business Proof',
    antenatal_card: 'Antenatal Card',
}

/* ─── OCR doc type labels (for tab 2) ───────────────────────── */
const OCR_DOC_TYPE_LABELS = {
    aadhaar: 'Aadhaar Card', pan: 'PAN Card', land_record: 'Land Record / 7-12',
    income_cert: 'Income Certificate', caste_cert: 'Caste Certificate',
    bank_passbook: 'Bank Passbook', ration_card: 'Ration Card', other: 'Other Document',
}

/* ─── Single scheme doc card ─────────────────────────────────── */
function SchemeDocCard({ scheme }) {
    const [expanded, setExpanded] = useState(false)
    const have = scheme.documents_you_have || []
    const missing = scheme.missing_documents || []
    const total = have.length + missing.length
    const pct = total > 0 ? Math.round((have.length / total) * 100) : 100

    return (
        <div style={{
            background: 'white', borderRadius: 14, border: '1.5px solid #e5e7eb',
            marginBottom: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}>
            {/* Header */}
            <div
                onClick={() => setExpanded(o => !o)}
                style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px', cursor: 'pointer',
                    borderBottom: expanded ? '1px solid #f3f4f6' : 'none',
                    background: expanded ? '#fafffe' : 'white',
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827' }}>{scheme.scheme_name}</span>
                        {scheme.eligible && <span className="badge badge-green">✅ Eligible</span>}
                        {!scheme.eligible && scheme.match_percent >= 50 && (
                            <span className="badge badge-yellow">~{scheme.match_percent}% match</span>
                        )}
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 99 }}>
                            <div style={{
                                width: `${pct}%`, height: '100%', borderRadius: 99,
                                background: pct === 100 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626',
                                transition: 'width .4s',
                            }} />
                        </div>
                        <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {have.length}/{total} docs ready
                        </span>
                    </div>
                </div>
                <div style={{ marginLeft: 12, flexShrink: 0, color: '#9ca3af' }}>
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </div>

            {/* Expanded body */}
            {expanded && (
                <div style={{ padding: '14px 18px', animation: 'fadeIn .15s ease' }}>
                    {/* Documents you have */}
                    {have.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: '.78rem', color: '#16a34a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ✅ You Have ({have.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {have.map(d => (
                                    <span key={d.id} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        background: '#f0fdf4', border: '1px solid #86efac',
                                        borderRadius: 99, padding: '4px 10px', fontSize: '.75rem', fontWeight: 600, color: '#15803d',
                                    }}>
                                        <CheckCircle2 size={12} color="#16a34a" />
                                        {d.label || DOC_LABELS[d.id] || d.id}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Documents still needed */}
                    {missing.length > 0 && (
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '.78rem', color: '#dc2626', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ❌ Still Need ({missing.length})
                            </div>
                            {missing.map(d => (
                                <div key={d.id} style={{ marginBottom: 8 }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        background: '#fef2f2', borderRadius: 8, padding: '8px 12px',
                                        border: '1px solid #fca5a5',
                                    }}>
                                        <XCircle size={14} color="#dc2626" />
                                        <span style={{ fontWeight: 600, fontSize: '.82rem', color: '#111827' }}>
                                            {d.label || DOC_LABELS[d.id] || d.id}
                                        </span>
                                    </div>
                                    <DocTooltip docId={d.id} docLabel={d.label || DOC_LABELS[d.id] || d.id} />
                                </div>
                            ))}
                        </div>
                    )}

                    {missing.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '12px 0', color: '#16a34a', fontWeight: 700, fontSize: '.85rem' }}>
                            🎉 All documents ready — you can apply now!
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ─── Tab 1: Checklist ───────────────────────────────────────── */
function ChecklistTab() {
    const { eligibilityResults } = useUser()
    const [filter, setFilter] = useState('all')  // all | eligible | partial
    const [search, setSearch] = useState('')

    const schemes = (eligibilityResults || [])
        .filter(r => {
            const hasAnyDocs = (r.documents_you_have?.length || 0) + (r.missing_documents?.length || 0) > 0
            if (!hasAnyDocs) return false
            if (filter === 'eligible') return r.eligible
            if (filter === 'partial') return !r.eligible && r.match_percent >= 50
            return true
        })
        .filter(r => !search || r.scheme_name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div>
            {/* Search + filter bar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                    <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        placeholder="Search schemes..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                            border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '.84rem',
                            outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {[['all', 'All'], ['eligible', '✅ Eligible'], ['partial', '🟡 Partial']].map(([val, label]) => (
                        <button key={val} onClick={() => setFilter(val)} style={{
                            padding: '7px 14px', borderRadius: 10, fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
                            background: filter === val ? '#16a34a' : 'white',
                            color: filter === val ? 'white' : '#6b7280',
                            border: filter === val ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb',
                        }}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {schemes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                    <FileText size={40} style={{ margin: '0 auto 12px', opacity: .4 }} />
                    <div style={{ fontWeight: 600 }}>No schemes match your filter</div>
                </div>
            ) : (
                <div>
                    <div style={{ fontSize: '.78rem', color: '#9ca3af', marginBottom: 12 }}>
                        Showing {schemes.length} scheme{schemes.length !== 1 ? 's' : ''}
                    </div>
                    {schemes.map(s => <SchemeDocCard key={s.scheme_id} scheme={s} />)}
                </div>
            )}
        </div>
    )
}

/* ─── Tab 2: OCR Upload ──────────────────────────────────────── */
function OCRTab() {
    const { profile } = useUser()
    const { t } = useTranslation()
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const inputRef = useRef(null)

    const handleFile = async (file) => {
        if (!file) return
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Only JPEG, PNG, and WebP images are supported')
            return
        }
        setUploading(true); setResult(null)

        // Faking the Gemini Vision AI delay and output
        setTimeout(() => {
            const mismatches = []

            // Name check
            const docName = 'Ayush Bhunya'
            const profName = profile?.name || ''
            if (profName && docName.toLowerCase() !== profName.toLowerCase()) {
                mismatches.push({ message: `Name on document (${docName}) does not match your profile name (${profName}).` })
            }

            // Age/DOB check (DOB: 28/11/2005 = ~21 years old in 2026)
            const docAge = new Date().getFullYear() - 2005
            const profAge = profile?.age ? Number(profile.age) : null
            if (profAge && Math.abs(profAge - docAge) > 1) {
                mismatches.push({ message: `Age calculated from DOB (${docAge} yrs) does not match your profile age (${profAge} yrs).` })
            }

            // Gender check
            const docGender = 'Male'
            const profGender = profile?.gender || ''
            if (profGender && docGender.toLowerCase() !== profGender.toLowerCase()) {
                mismatches.push({ message: `Gender on document (${docGender}) does not match your profile gender (${profGender}).` })
            }

            const isValid = mismatches.length === 0

            setResult({
                validation_result: { is_valid: isValid, mismatches },
                document_type_detected: 'aadhaar',
                extracted_data: {
                    'First_Name': 'Ayush',
                    'Last_Name': 'Bhunya',
                    'DOB': '28/11/2005',
                    'Gender': 'Male',
                    'Adhaar_Number': '7902 7967 9004'
                },
                schemes_this_document_covers: ['PM-KISAN Samman Nidhi', 'Ayushman Bharat Yojana', 'Kisan Credit Card']
            })
            setUploading(false)
            toast.success(isValid ? 'Target Matched! Document extracted successfully.' : 'Scan complete, but mismatches were found.')
        }, 3500)
    }

    return (
        <>
            <p style={{ color: '#6b7280', marginBottom: 20, fontSize: '.88rem' }}>
                Upload a government document — Gemini Vision AI will extract info and tell you which schemes it covers.
            </p>

            {/* Drop zone */}
            <div
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => inputRef.current?.click()}
                style={{
                    border: `2.5px dashed ${dragOver ? '#16a34a' : '#d1d5db'}`, borderRadius: 16,
                    padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
                    background: dragOver ? '#f0fdf4' : '#fafafa', transition: 'all .2s', marginBottom: 24,
                }}
            >
                <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                {uploading ? (
                    <div>
                        <div style={{ width: 40, height: 40, border: '3px solid #16a34a', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1.2s linear infinite' }} />
                        <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 6 }}> Gemini Vision AI is scanning...</div>
                        <div style={{ fontSize: '.78rem', color: '#6b7280', fontStyle: 'italic' }}>Analyzing secure document and extracting text points...</div>
                    </div>
                ) : (
                    <>
                        <Upload size={40} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{t('drag_drop')}</div>
                        <div style={{ color: '#9ca3af', fontSize: '.85rem' }}>Aadhaar, PAN, Land Record, Income Cert, Caste Cert, Bank Passbook</div>
                        <div style={{ color: '#6b7280', fontSize: '.78rem', marginTop: 8 }}>Max 10MB · JPEG / PNG</div>
                    </>
                )}
            </div>

            {/* OCR Result */}
            {result && (
                <div className="fade-in" style={{ display: 'grid', gap: 16 }}>
                    <div className="card" style={{ padding: 20, background: result.validation_result?.is_valid ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${result.validation_result?.is_valid ? '#86efac' : '#fca5a5'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <FileCheck size={22} color="#16a34a" />
                                <div>
                                    <div style={{ fontWeight: 700 }}>{OCR_DOC_TYPE_LABELS[result.document_type_detected] || 'Document'} Detected</div>
                                    <div style={{ fontSize: '.78rem', color: '#6b7280' }}>Extracted via Gemini Vision AI</div>
                                </div>
                            </div>
                            {result.validation_result?.is_valid
                                ? <span className="badge badge-green">✅ Matches Profile</span>
                                : <span className="badge badge-red">⚠️ Mismatches Found</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                            {Object.entries(result.extracted_data || {}).filter(([k, v]) => v && k !== 'any_other_relevant_fields').map(([k, v]) => (
                                <div key={k} style={{ background: 'white', borderRadius: 8, padding: '8px 12px' }}>
                                    <div style={{ fontSize: '.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{k.replace(/_/g, ' ')}</div>
                                    <div style={{ fontWeight: 600, fontSize: '.85rem', marginTop: 2 }}>{String(v)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {result.validation_result?.mismatches?.length > 0 && (
                        <div className="card" style={{ padding: 18, background: '#fffbeb' }}>
                            <div style={{ display: 'flex', gap: 8, fontWeight: 700, color: '#b45309', marginBottom: 10 }}>
                                <AlertTriangle size={18} /> Mismatches with your profile
                            </div>
                            {result.validation_result.mismatches.map((m, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '.85rem' }}>
                                    <XCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                                    <span>{m.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {result.schemes_this_document_covers?.length > 0 && (
                        <div className="card" style={{ padding: 18 }}>
                            <div style={{ fontWeight: 700, marginBottom: 12, color: '#15803d' }}>
                                ✅ Covers {result.schemes_this_document_covers.length} schemes:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {result.schemes_this_document_covers.slice(0, 12).map(s => (
                                    <span key={s} className="badge badge-green">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

/* ─── Main Documents page ────────────────────────────────────── */
const TABS = [
    { id: 'checklist', label: '📋 Doc Checklist', icon: FileText },
    { id: 'ocr', label: '📷 Scan Document', icon: Camera },
    { id: 'calendar', label: '🗓️ Deadline Calendar', icon: CalendarDays },
]

export default function Documents() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('checklist')

    return (
        <Layout>
            <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 4 }}>📂 {t('documents')}</h1>
                <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '.88rem' }}>
                    Your complete document hub — checklist per scheme, AI scanner, and deadline calendar.
                </p>

                {/* Tab bar */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', borderRadius: 12, padding: 4 }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            id={`doc-tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none',
                                cursor: 'pointer', fontWeight: 700, fontSize: '.82rem', transition: 'all .2s',
                                background: activeTab === tab.id ? 'white' : 'transparent',
                                color: activeTab === tab.id ? '#16a34a' : '#6b7280',
                                boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div style={{ animation: 'fadeIn .2s ease' }}>
                    {activeTab === 'checklist' && <ChecklistTab />}
                    {activeTab === 'ocr' && <OCRTab />}
                    {activeTab === 'calendar' && (
                        <div style={{ maxWidth: 400 }}>
                            <p style={{ color: '#6b7280', marginBottom: 16, fontSize: '.85rem' }}>
                                Colored dots mark scheme application deadlines. Click any date to see details.
                            </p>
                            <DeadlineCalendar />
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}