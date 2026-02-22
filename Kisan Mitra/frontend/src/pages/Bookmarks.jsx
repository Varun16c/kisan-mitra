import { useState, useEffect } from 'react'
import Layout from '../components/Layout/Navbar'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../hooks/useTranslation'
import { useLanguage } from '../context/LanguageContext'
import { getUserBookmarks, toggleBookmark as apiToggleBookmark } from '../utils/api'
import { Search, X, ExternalLink, CheckCircle, XCircle, AlertCircle, Share2, BookmarkMinus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Bookmarks() {
    const { eligibilityResults, profile, user } = useUser()
    const { t } = useTranslation()
    const { language } = useLanguage()

    const [bookmarkedIds, setBookmarkedIds] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)

    // Fetch the array of bookmarked IDs from Supabase
    useEffect(() => {
        const fetchIds = async () => {
            if (!user?.id) {
                setLoading(false)
                return
            }
            try {
                const res = await getUserBookmarks(user.id)
                if (res.data?.success) {
                    setBookmarkedIds(res.data.bookmarks)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchIds()
    }, [user?.id])

    const removeBookmark = async (e, id, name) => {
        e.stopPropagation()
        try {
            await apiToggleBookmark(user.id, id)
            toast.success(`Removed bookmark`, { duration: 1500 })
            setBookmarkedIds(prev => prev.filter(b => b !== id))
            if (selected?.scheme_id === id) setSelected(null) // close drawer if open
        } catch (err) {
            toast.error("Failed to remove bookmark")
        }
    }

    const shareOnWhatsApp = (e, s) => {
        e.stopPropagation()
        const text = `🌾 *${s.scheme_name}*\n💰 Benefit: ₹${s.benefit_amount.toLocaleString('en-IN')}/yr\n📋 ${s.benefit_description?.slice(0, 120)}\n🔗 Apply: ${s.apply_url || 'kisanmitra.in'}\n\nCheck your eligibility at Kisan Mitra!`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const getName = (s) => language === 'hi' ? (s.scheme_name_hi || s.scheme_name) : language === 'mr' ? (s.scheme_name_mr || s.scheme_name) : s.scheme_name

    // 1. Filter the rich eligibility engine results down to ONLY the bookmarked ones
    let results = eligibilityResults.filter(r => bookmarkedIds.includes(r.scheme_id))

    // 2. Apply search filter
    if (search) {
        results = results.filter(r => getName(r).toLowerCase().includes(search.toLowerCase()))
    }

    const getDaysLeft = (deadline) => {
        if (!deadline) return null
        return Math.round((new Date(deadline) - new Date()) / 86400000)
    }

    return (
        <Layout>
            <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>🔖 Bookmarks ({results.length})</h1>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 24, maxWidth: 600 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input className="input" placeholder="Search saved schemes..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38, width: '100%' }} disabled={loading && bookmarkedIds.length === 0} />
                </div>

                {loading && bookmarkedIds.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>
                        <p>Loading your bookmarks...</p>
                    </div>
                ) : bookmarkedIds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af', background: '#f9fafb', borderRadius: 12, border: '2px dashed #e5e7eb' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔖</div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>No Bookmarks Yet</h3>
                        <p>You haven't saved any schemes. Go to the Schemes page and click the bookmark icon to save them here for later!</p>
                        <a href="/schemes" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Explore Schemes</a>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {results.map(s => {
                            const daysLeft = getDaysLeft(s.deadline)
                            const urgentDead = daysLeft !== null && daysLeft < 30 && daysLeft > 0
                            return (
                                <div key={s.scheme_id} className={`card ${s.eligible ? 'scheme-eligible' : s.partially_eligible ? 'scheme-partial' : 'scheme-ineligible'}`}
                                    style={{ padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
                                    onClick={() => setSelected(s)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <div style={{ fontWeight: 700, fontSize: '.9rem', lineHeight: 1.3 }}>{getName(s)}</div>
                                        <span className={`badge ${s.eligible ? 'badge-green' : s.partially_eligible ? 'badge-amber' : 'badge-gray'}`}>
                                            {s.match_percent}%
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#16a34a' }}>
                                        ₹{s.benefit_amount.toLocaleString('en-IN')}
                                        <span style={{ fontSize: '.72rem', color: '#6b7280', fontWeight: 400, marginLeft: 4 }}>/yr</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {s.category?.slice(0, 2).map(c => <span key={c} className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{c}</span>)}
                                        {urgentDead && <span className="badge badge-red">⏰ {daysLeft}d left</span>}
                                    </div>
                                    <div style={{ fontSize: '.78rem', color: '#6b7280', lineHeight: 1.4 }}>{s.benefit_description?.slice(0, 80)}…</div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', alignItems: 'center' }}>
                                        <button className="btn btn-sm btn-outline" onClick={e => { e.stopPropagation(); setSelected(s) }}>Why?</button>
                                        <button
                                            onClick={e => removeBookmark(e, s.scheme_id, getName(s))}
                                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}
                                            title="Remove from Bookmarks"
                                        >
                                            <BookmarkMinus size={16} />
                                        </button>
                                        <button
                                            onClick={e => shareOnWhatsApp(e, s)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, color: '#25d366' }}
                                            title="Share on WhatsApp">
                                            <Share2 size={16} />
                                        </button>
                                        {s.eligible && <a href={s.apply_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" onClick={e => e.stopPropagation()} style={{ flex: 1, justifyContent: 'center' }}>Apply <ExternalLink size={12} /></a>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Identical Scheme detail drawer */}
            {selected && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelected(null)}>
                    <div style={{ width: 480, background: 'white', height: '100vh', overflowY: 'auto', padding: 28, boxShadow: '-4px 0 20px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'flex-start', gap: 10 }}>
                            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{getName(selected)}</h2>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <button
                                    onClick={e => removeBookmark(e, selected.scheme_id, getName(selected))}
                                    className="btn btn-sm"
                                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
                                    title="Remove">
                                    <BookmarkMinus size={14} /> Remove
                                </button>
                                <button
                                    onClick={e => shareOnWhatsApp(e, selected)}
                                    className="btn btn-sm"
                                    style={{ background: '#25d366', color: 'white', border: 'none' }}
                                    title="Share on WhatsApp">
                                    <Share2 size={14} /> WhatsApp
                                </button>
                                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                        </div>

                        {/* Eligibility badge */}
                        <div className={`badge ${selected.eligible ? 'badge-green' : selected.partially_eligible ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: '.85rem', padding: '6px 14px', marginBottom: 16 }}>
                            {selected.eligible ? '✅ Fully Eligible' : selected.partially_eligible ? '🟡 Partially Eligible' : '❌ Not Eligible'}
                            {' · '}Match: {selected.match_percent}%
                        </div>

                        <p style={{ color: '#6b7280', fontSize: '.88rem', lineHeight: 1.6, marginBottom: 16 }}>
                            {language === 'hi' ? selected.description_hi : language === 'mr' ? selected.description_mr : selected.description}
                        </p>

                        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>💰 Benefit</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#16a34a' }}>₹{selected.benefit_amount.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: '.82rem', color: '#6b7280' }}>{selected.benefit_description}</div>
                        </div>

                        {/* Failure reasons */}
                        {selected.failure_reasons?.length > 0 && (
                            <div style={{ background: '#fef2f2', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                <div style={{ fontWeight: 700, marginBottom: 8, color: '#dc2626' }}>❌ Why Not Eligible</div>
                                {selected.failure_reasons.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '.85rem' }}>
                                        <XCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span>{r}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Documents */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>📄 Documents</div>
                            {selected.documents_you_have?.map(d => (
                                <div key={d.id} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: '.84rem', color: '#15803d' }}>
                                    <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {d.label}
                                </div>
                            ))}
                            {selected.missing_documents?.map(d => (
                                <div key={d.id} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: '.84rem', color: '#ef4444' }}>
                                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {d.label} <span style={{ color: '#9ca3af' }}>(need to get)</span>
                                </div>
                            ))}
                        </div>

                        {/* Apply button */}
                        {selected.apply_url && (
                            <a href={selected.apply_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                Apply Now <ExternalLink size={16} />
                            </a>
                        )}
                        <div style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>{selected.ministry}</div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
