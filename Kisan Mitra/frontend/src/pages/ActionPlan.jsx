import { useState } from 'react'
import Layout from '../components/Layout/Navbar'
import { useUser } from '../context/UserContext'
import { downloadActionPlan } from '../utils/api'
import { Download, ExternalLink, CheckCircle, AlertCircle, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ActionPlan() {
    const { profile, eligibleSchemes, partialSchemes, totalBenefit } = useUser()

    const sorted = [...eligibleSchemes].sort((a, b) => b.priority_score - a.priority_score)

    // ── Mark as complete (localStorage) ────────────────────────────────────────
    const [completed, setCompleted] = useState(() => {
        try { return JSON.parse(localStorage.getItem('km_plan_completed') || '[]') }
        catch { return [] }
    })
    const isDone = (id) => completed.includes(id)
    const toggleDone = (id, name) => {
        setCompleted(prev => {
            const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
            localStorage.setItem('km_plan_completed', JSON.stringify(next))
            toast.success(next.includes(id) ? `✅ Marked applied: ${name}` : `Unmarked: ${name}`, { duration: 1500 })
            return next
        })
    }

    // Deduplicated document list across all eligible schemes
    const allMissingDocs = {}
    sorted.forEach(s => {
        s.missing_documents?.forEach(d => {
            if (!allMissingDocs[d.id]) allMissingDocs[d.id] = { ...d, schemes: [] }
            allMissingDocs[d.id].schemes.push(s.scheme_name)
        })
    })

    const getDaysLeft = (deadline) => {
        if (!deadline) return null
        return Math.round((new Date(deadline) - new Date()) / 86400000)
    }

    // ── WhatsApp share full plan ────────────────────────────────────────────
    const shareOnWhatsApp = () => {
        const lines = [`🌾 *Kisan Mitra — My Action Plan*`, `Total Benefit: ₹${totalBenefit.toLocaleString('en-IN')}/yr`, ``]
        sorted.slice(0, 5).forEach((s, i) => lines.push(`${i + 1}. ${s.scheme_name} — ₹${s.benefit_amount.toLocaleString('en-IN')}/yr`))
        lines.push(``, `Apply at: ${sorted[0]?.apply_url || 'pmkisan.gov.in'}`)
        window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')
    }

    const handleDownloadPDF = async () => {
        if (!profile) return toast.error('Complete profile first')
        try {
            await downloadActionPlan(profile)
        } catch (err) {
            toast.error('PDF download failed. Is backend running?')
        }
    }

    return (
        <Layout>
            <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 4 }}>📋 Action Plan</h1>
                        <p style={{ color: '#6b7280', fontSize: '.88rem' }}>
                            {sorted.length} eligible schemes · ₹{totalBenefit.toLocaleString('en-IN')} total potential benefit/yr
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary btn-sm" onClick={shareOnWhatsApp}>
                            <Share2 size={15} /> WhatsApp
                        </button>
                        <button className="btn btn-primary" onClick={handleDownloadPDF}>
                            <Download size={16} /> Download PDF
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                {sorted.length > 0 && (
                    <div className="card" style={{ padding: '12px 18px', marginBottom: 20, background: '#f0fdf4', border: '1.5px solid #86efac' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#15803d' }}>📋 Application Progress</span>
                            <span style={{ fontWeight: 800, color: '#16a34a' }}>{completed.length}/{sorted.length} applied</span>
                        </div>
                        <div style={{ background: '#dcfce7', borderRadius: 20, height: 8, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#16a34a', borderRadius: 20, width: `${sorted.length ? (completed.filter(c => sorted.find(s => s.scheme_id === c)).length / sorted.length) * 100 : 0}%`, transition: 'width .4s ease' }} />
                        </div>
                    </div>
                )}

                {/* Comparison */}
                <div className="card" style={{ padding: 18, background: '#f0fdf4', border: '1.5px solid #86efac', marginBottom: 24 }}>
                    <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 6 }}>🚀 Your Impact vs. Average</div>
                    <p style={{ color: '#166534', fontSize: '.9rem', lineHeight: 1.6, margin: 0 }}>
                        Average rural Indian claims only <b>1.2 schemes</b> worth ~<b>₹6000/year</b>.
                        With Kisan Mitra, you're eligible for <b>{sorted.length} schemes</b> worth <b>₹{totalBenefit.toLocaleString('en-IN')}/year</b> —
                        that's <b>{Math.round(totalBenefit / 6000)}x more</b> than average!
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
                    {/* Priority action plan */}
                    <div>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14 }}>⚡ Prioritized Apply List</h2>
                        {sorted.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                                <p>No eligible schemes yet. Complete your onboarding profile.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {sorted.map((s, i) => {
                                    const daysLeft = getDaysLeft(s.deadline)
                                    const urgent = daysLeft !== null && daysLeft < 30 && daysLeft > 0
                                    return (
                                        <div key={s.scheme_id} className="card" style={{
                                            padding: '14px 16px',
                                            opacity: isDone(s.scheme_id) ? 0.6 : 1,
                                            transition: 'opacity .2s',
                                            background: isDone(s.scheme_id) ? '#f0fdf4' : 'white'
                                        }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                                {/* Step number / done toggle */}
                                                <button
                                                    onClick={() => toggleDone(s.scheme_id, s.scheme_name)}
                                                    style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.8rem', flexShrink: 0, border: 'none', cursor: 'pointer', background: isDone(s.scheme_id) ? '#16a34a' : '#e5e7eb', color: isDone(s.scheme_id) ? 'white' : '#6b7280' }}
                                                    title={isDone(s.scheme_id) ? 'Mark as not done' : 'Mark as applied'}>
                                                    {isDone(s.scheme_id) ? '✓' : i + 1}
                                                </button>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '.9rem', textDecoration: isDone(s.scheme_id) ? 'line-through' : 'none', color: isDone(s.scheme_id) ? '#9ca3af' : '#111827' }}>{s.scheme_name}</div>
                                                    <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 800, color: '#16a34a' }}>₹{s.benefit_amount.toLocaleString('en-IN')}</span>
                                                        {urgent && <span className="badge badge-red">⏰ {daysLeft}d left!</span>}
                                                        {s.missing_documents?.length === 0
                                                            ? <span className="badge badge-green">✅ Ready to apply</span>
                                                            : <span className="badge badge-amber">Need {s.missing_documents.length} doc{s.missing_documents.length > 1 ? 's' : ''}</span>}
                                                    </div>
                                                    {s.missing_documents?.length > 0 && (
                                                        <div style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 4 }}>
                                                            Need: {s.missing_documents.map(d => d.label).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                                {!isDone(s.scheme_id) && (
                                                    <a href={s.apply_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" style={{ flexShrink: 0 }}>
                                                        Apply <ExternalLink size={12} />
                                                    </a>
                                                )}
                                                {isDone(s.scheme_id) && (
                                                    <span className="badge badge-green" style={{ flexShrink: 0 }}>Applied ✓</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Partial eligible */}
                        {partialSchemes.length > 0 && (
                            <div style={{ marginTop: 20 }}>
                                <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 12 }}>🟡 Close to Eligible ({partialSchemes.length})</h2>
                                {partialSchemes.slice(0, 4).map(s => (
                                    <div key={s.scheme_id} className="card scheme-partial" style={{ padding: '12px 16px', marginBottom: 10 }}>
                                        <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{s.scheme_name}</div>
                                        <div style={{ fontSize: '.78rem', color: '#9ca3af', marginTop: 4 }}>{s.failure_reasons?.[0]}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Unified document checklist */}
                    <div>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14 }}>📄 Documents You Need</h2>
                        <div className="card" style={{ padding: 18 }}>
                            {Object.keys(allMissingDocs).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 20, color: '#16a34a' }}>
                                    <CheckCircle size={32} style={{ margin: '0 auto 10px' }} />
                                    <div style={{ fontWeight: 700 }}>🎉 You have all required documents!</div>
                                    <div style={{ fontSize: '.82rem', color: '#6b7280', marginTop: 4 }}>Ready to apply for all eligible schemes</div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontWeight: 700, marginBottom: 12, color: '#374151', fontSize: '.9rem' }}>
                                        Get these {Object.keys(allMissingDocs).length} documents → unlock all {sorted.length} schemes:
                                    </div>
                                    {Object.values(allMissingDocs).map(doc => (
                                        <div key={doc.id} style={{ display: 'flex', gap: 10, marginBottom: 12, padding: '10px 12px', background: '#fef9f0', borderRadius: 8 }}>
                                            <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '.85rem' }}>{doc.label}</div>
                                                <div style={{ fontSize: '.72rem', color: '#9ca3af', marginTop: 2 }}>
                                                    Needed for: {doc.schemes.slice(0, 2).join(', ')}{doc.schemes.length > 2 ? ` +${doc.schemes.length - 2} more` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* 5-year projection */}
                        <div className="card" style={{ padding: 18, marginTop: 16, background: '#e0f2fe', border: '1.5px solid #bae6fd' }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, color: '#0369a1' }}>📈 5-Year Benefit Projection</div>
                            {[1, 3, 5].map(yr => (
                                <div key={yr} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #bae6fd', fontSize: '.88rem' }}>
                                    <span style={{ color: '#374151' }}>{yr} Year{yr > 1 ? 's' : ''}</span>
                                    <span style={{ fontWeight: 800, color: '#0369a1' }}>₹{(totalBenefit * yr).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
