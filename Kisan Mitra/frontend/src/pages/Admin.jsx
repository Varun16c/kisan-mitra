import { useState, useEffect } from 'react'
import Layout from '../components/Layout/Navbar'
import { getAdminStats } from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Users, TrendingUp, Award, FileWarning } from 'lucide-react'

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280']

export default function Admin() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getAdminStats().then(r => { setStats(r.data); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    if (loading) return (
        <Layout>
            <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="skeleton" style={{ height: 24, width: 200, margin: '0 auto 20px' }} />
                <div className="skeleton" style={{ height: 200, margin: '0 auto' }} />
            </div>
        </Layout>
    )

    if (!stats) return <Layout><div style={{ padding: 40, color: '#6b7280', textAlign: 'center' }}>Could not load admin data.</div></Layout>

    return (
        <Layout>
            <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 4 }}>🛡️ Admin Dashboard</h1>
                    <p style={{ color: '#6b7280', fontSize: '.88rem' }}>Platform-wide analytics and scheme impact tracking</p>
                </div>

                {/* KPI cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                    {[
                        { icon: Users, label: 'Total Beneficiaries', value: stats.total_farmers.toLocaleString('en-IN'), color: '#16a34a', bg: '#f0fdf4' },
                        { icon: Award, label: 'Schemes Discovered', value: stats.total_schemes_discovered.toLocaleString('en-IN'), color: '#0ea5e9', bg: '#e0f2fe' },
                        { icon: TrendingUp, label: 'Benefits Unlocked', value: `₹${stats.total_benefit_unlocked_cr}Cr`, color: '#f59e0b', bg: '#fef3c7' },
                        { icon: FileWarning, label: 'Avg Schemes/User', value: stats.avg_schemes_per_user, color: '#8b5cf6', bg: '#ede9fe' },
                    ].map(c => (
                        <div key={c.label} className="card" style={{ padding: 20, background: c.bg }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div style={{ width: 40, height: 40, background: c.color + '20', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <c.icon size={20} color={c.color} />
                                </div>
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: c.color }}>{c.value}</div>
                            <div style={{ fontSize: '.78rem', color: '#6b7280', fontWeight: 600 }}>{c.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* Top schemes bar chart */}
                    <div className="card" style={{ padding: 22 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🏆 Most Discovered Schemes</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stats.top_schemes} layout="vertical">
                                <XAxis type="number" tick={{ fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={90} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* State distribution pie */}
                    <div className="card" style={{ padding: 22 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🗺️ State Distribution</h3>
                        <PieChart width={200} height={200} style={{ margin: '0 auto' }}>
                            <Pie data={stats.state_distribution} cx={100} cy={100} outerRadius={85} dataKey="users" nameKey="state">
                                {stats.state_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v, n) => [`${v} users`, n]} />
                        </PieChart>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                            {stats.state_distribution.map((d, i) => (
                                <div key={d.state} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.72rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                                    {d.state}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Registration trend */}
                    <div className="card" style={{ padding: 22 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📈 Recent Registrations (5 days)</h3>
                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={stats.recent_registrations}>
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Missing documents */}
                    <div className="card" style={{ padding: 22 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📄 Top Missing Documents</h3>
                        {stats.top_missing_documents.map((d, i) => (
                            <div key={d.document} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.85rem', fontWeight: 600 }}>
                                    <span>{d.document}</span>
                                    <span style={{ color: '#dc2626' }}>{d.percent_missing}% users lack this</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${d.percent_missing}%`, background: `linear-gradient(90deg, #ef4444, #f87171)` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    )
}
