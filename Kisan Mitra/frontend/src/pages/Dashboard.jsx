import { useState, useEffect } from 'react'
import Layout from '../components/Layout/Navbar'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../hooks/useTranslation'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowRight, AlertTriangle, TrendingUp, FileText, Calendar, Printer } from 'lucide-react'

// Custom hook for animated numbers
function useCountUp(end, duration = 1500) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        let startTime = null
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = timestamp - startTime
            const pct = Math.min(progress / duration, 1)
            // Ease out quad
            const easeOut = pct * (2 - pct)
            setCount(Math.floor(end * easeOut))
            if (pct < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }, [end, duration])
    return count
}

const COLORS = ['#16a34a', '#f59e0b', '#9ca3af']

export default function Dashboard() {
    const { profile, eligibilityResults, eligibleSchemes, partialSchemes, totalBenefit } = useUser()
    const { t } = useTranslation()
    const navigate = useNavigate()

    if (!profile) return null

    const ineligibleCount = eligibilityResults.length - eligibleSchemes.length - partialSchemes.length
    const pieData = [
        { name: 'Eligible', value: eligibleSchemes.length },
        { name: 'Partial', value: partialSchemes.length },
        { name: 'Ineligible', value: ineligibleCount },
    ]

    const topEligible = eligibleSchemes.slice(0, 6)
    const barData = topEligible.map(s => ({ name: s.scheme_name.length > 16 ? s.scheme_name.slice(0, 16) + '…' : s.scheme_name, amount: s.benefit_amount }))

    // Check urgent deadlines
    const urgentSchemes = eligibleSchemes.filter(s => {
        if (!s.deadline) return false
        const days = (new Date(s.deadline) - new Date()) / 86400000
        return days > 0 && days < 30
    })

    // ── Profile completeness ─────────────────────────────────────────────────────
    const PROFILE_FIELDS = [
        { key: 'name', label: 'Name' },
        { key: 'state', label: 'State' },
        { key: 'occupation', label: 'Occupation' },
        { key: 'annual_income', label: 'Annual Income' },
        { key: 'land_acres', label: 'Land Size' },
        { key: 'caste', label: 'Caste Category' },
        { key: 'age', label: 'Age' },
        { key: 'bank_account', label: 'Bank Account' },
        { key: 'aadhaar', label: 'Aadhaar' },
        { key: 'crops_grown', label: 'Crops Grown' },
        { key: 'district', label: 'District' },
        { key: 'documents', label: 'Documents Checklist' },
    ]
    const filledFields = PROFILE_FIELDS.filter(f => {
        const val = profile[f.key]
        if (Array.isArray(val)) return val.length > 0
        return val !== undefined && val !== null && val !== '' && val !== false
    })
    const completeness = Math.round((filledFields.length / PROFILE_FIELDS.length) * 100)
    const missingFields = PROFILE_FIELDS.filter(f => !filledFields.find(ff => ff.key === f.key))
    // How many more schemes would unlock if income_certificate were added (partial → eligible)
    const partialUnlockCount = partialSchemes.filter(s => s.failure_reasons?.some(r => r.toLowerCase().includes('income') || r.toLowerCase().includes('certificate'))).length

    // Animated counts
    const countEligible = useCountUp(eligibleSchemes.length)
    const countBenefit = useCountUp(totalBenefit, 2000)
    const countPartial = useCountUp(partialSchemes.length)
    const countTotal = useCountUp(eligibilityResults.length)

    const handlePrint = () => {
        window.print()
    }

    return (
        <Layout>
            <div className="dashboard-container" style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
                {/* Print Styles */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body * { visibility: hidden; }
                        .dashboard-container, .dashboard-container * { visibility: visible; }
                        .dashboard-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
                        .btn, .nav-hide-print, button { display: none !important; }
                        .card { border: 1px solid #ddd !important; box-shadow: none !important; break-inside: avoid; }
                    }
                `}} />
                {/* Profile completeness indicator */}
                {completeness < 100 && (
                    <div style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '14px 18px', marginBottom: 18, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#111827' }}>Profile Completeness</span>
                                <span style={{ fontWeight: 800, fontSize: '.88rem', color: completeness >= 80 ? '#16a34a' : completeness >= 50 ? '#d97706' : '#dc2626' }}>{completeness}%</span>
                            </div>
                            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                                <div style={{ height: '100%', borderRadius: 99, background: completeness >= 80 ? '#16a34a' : completeness >= 50 ? '#f59e0b' : '#dc2626', width: `${completeness}%`, transition: 'width .5s ease' }} />
                            </div>
                            {missingFields.length > 0 && (
                                <div style={{ fontSize: '.76rem', color: '#6b7280' }}>
                                    Missing: <b style={{ color: '#374151' }}>{missingFields.slice(0, 3).map(f => f.label).join(', ')}{missingFields.length > 3 ? ` +${missingFields.length - 3} more` : ''}</b>
                                    {partialUnlockCount > 0 && <span style={{ color: '#16a34a', fontWeight: 600 }}> — completing it could unlock {partialUnlockCount} more scheme{partialUnlockCount > 1 ? 's' : ''}</span>}
                                </div>
                            )}
                        </div>
                        <button className="btn btn-sm btn-primary" style={{ flexShrink: 0 }} onClick={() => navigate('/onboarding')}>Complete Profile</button>
                    </div>
                )}

                {/* Greeting */}
                <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>
                        🌾 Namaste, {profile.name}!
                    </h1>
                    <button className="btn btn-secondary btn-sm" onClick={handlePrint} style={{ display: 'flex', gap: 6 }}>
                        <Printer size={16} /> Print Summary
                    </button>
                </div>

                {/* Greeting subtext */}
                <p style={{ color: '#6b7280', fontSize: '.92rem', marginBottom: 18 }}>
                    Based on your profile, here's your personalised scheme analysis
                </p>

                {/* Urgent alert */}
                {urgentSchemes.length > 0 && (
                    <div style={{ background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <AlertTriangle size={20} color="#f59e0b" />
                        <div>
                            <span style={{ fontWeight: 700, color: '#b45309' }}>⚠️ Urgent: </span>
                            <span style={{ color: '#92400e', fontSize: '.9rem' }}>
                                {urgentSchemes.length} eligible scheme{urgentSchemes.length > 1 ? 's' : ''} ({urgentSchemes.map(s => s.scheme_name.split(' ')[0]).join(', ')}) have deadlines within 30 days!
                            </span>
                            <button className="btn btn-sm" onClick={() => navigate('/action-plan')} style={{ marginLeft: 12, background: '#f59e0b', color: 'white' }}>Apply Now</button>
                        </div>
                    </div>
                )}

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                    {[
                        { label: t('eligible_count'), value: countEligible, color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
                        { label: t('total_benefit'), value: `₹${countBenefit.toLocaleString('en-IN')}`, color: '#0ea5e9', bg: '#e0f2fe', icon: '💰' },
                        { label: t('partial_count'), value: countPartial, color: '#f59e0b', bg: '#fef3c7', icon: '📋' },
                        { label: 'Total Schemes', value: countTotal, color: '#8b5cf6', bg: '#ede9fe', icon: '🗂️' },
                    ].map(s => (
                        <div key={s.label} className="card" style={{ padding: '20px 18px', background: s.bg, border: `1px solid ${s.color}30` }}>
                            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{s.icon}</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '.78rem', color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 28 }}>
                    {/* Bar chart */}
                    <div className="card" style={{ padding: 22 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>💰 Top Benefits Available</h3>
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={barData} margin={{ bottom: 30 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} tickFormatter={(val) => val.length > 11 ? val.substring(0, 11) + '…' : val} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                                <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Benefit']} />
                                <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie chart */}
                    <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '1rem', alignSelf: 'flex-start' }}>📊 Eligibility Breakdown</h3>
                        <PieChart width={180} height={180}>
                            <Pie data={pieData} cx={90} cy={90} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                        <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                            {pieData.map((d, i) => (
                                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.78rem' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i] }} />
                                    {d.name}: <b>{d.value}</b>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick action cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                    {[
                        { icon: TrendingUp, title: 'View All Schemes', desc: `${eligibleSchemes.length} eligible, ${partialSchemes.length} partial`, path: '/schemes', color: '#16a34a' },
                        { icon: FileText, title: 'Get Action Plan', desc: 'Prioritized apply guide + PDF download', path: '/action-plan', color: '#0ea5e9' },
                        { icon: Calendar, title: 'Deadline Tracker', desc: urgentSchemes.length > 0 ? `⚠️ ${urgentSchemes.length} urgent deadlines!` : 'No urgent deadlines', path: '/action-plan', color: '#f59e0b' },
                    ].map(c => (
                        <button key={c.title} className="card" onClick={() => navigate(c.path)}
                            style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', background: 'white', border: 'none', textAlign: 'left', transition: 'all .2s' }}>
                            <div style={{ width: 44, height: 44, background: c.color + '15', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <c.icon size={22} color={c.color} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '.92rem', color: '#111827' }}>{c.title}</div>
                                <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: 2 }}>{c.desc}</div>
                            </div>
                            <ArrowRight size={16} color="#9ca3af" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                        </button>
                    ))}
                </div>

                {/* Top eligible preview */}
                <div className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>✅ Top Eligible Schemes</h3>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/schemes')}>View All</button>
                    </div>
                    {topEligible.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                            <p>No eligible schemes yet. <button style={{ color: '#16a34a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/onboarding')}>Update your profile</button></p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 10 }}>
                            {topEligible.map(s => {
                                const daysLeft = s.deadline ? Math.round((new Date(s.deadline) - new Date()) / 86400000) : null
                                return (
                                    <div key={s.scheme_id} className="scheme-eligible" style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{s.scheme_name}</div>
                                            <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: 2 }}>{s.ministry}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '.95rem' }}>₹{s.benefit_amount.toLocaleString('en-IN')}</span>
                                            {daysLeft && daysLeft < 30 && <span className="badge badge-red">{daysLeft}d left</span>}
                                            <a href={s.apply_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" style={{ fontSize: '.75rem' }}>Apply</a>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
