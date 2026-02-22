import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useTranslation } from '../../hooks/useTranslation'
import { LayoutDashboard, BookOpen, MessageCircle, FileText, ListChecks, Sliders, Leaf } from 'lucide-react'

const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { to: '/schemes', icon: BookOpen, key: 'schemes' },
    { to: '/chat', icon: MessageCircle, key: 'chat' },
    { to: '/documents', icon: FileText, key: 'documents' },
    { to: '/action-plan', icon: ListChecks, key: 'action_plan' },
    { to: '/simulator', icon: Sliders, key: 'simulator' },
]

export default function Sidebar() {
    const { pathname } = useLocation()
    const { language, setLanguage, LANGUAGES: LANGS } = useLanguage()
    const { t } = useTranslation()

    return (
        <aside className="sidebar flex flex-col" style={{ minHeight: '100vh', width: 250, borderRight: '1px solid #e5e7eb', background: 'white' }}>
            {/* Logo */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: '#16a34a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Leaf size={22} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#16a34a', lineHeight: 1 }}>Kisan Mitra</div>
                        <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: 4 }}>Rural Scheme Guide</div>
                    </div>
                </div>
            </div>

            {/* Nav links */}
            <nav style={{ padding: '0 12px', flex: 1 }}>
                {navLinks.map(({ to, icon: Icon, key, label }) => (
                    <Link key={to} to={to} className={`sidebar-link ${pathname === to ? 'active' : ''}`} style={{ marginBottom: 4, padding: '12px 16px' }}>
                        <Icon size={18} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '.9rem', fontWeight: 600 }}>{label || t(key)}</span>
                    </Link>
                ))}
            </nav>

            {/* Language switcher */}
            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', marginTop: 'auto' }}>
                <div style={{ fontSize: '.72rem', color: '#9ca3af', marginBottom: 8, fontWeight: 700 }}>LANGUAGE</div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {Object.values(LANGS).map(l => (
                        <button key={l.code} onClick={() => setLanguage(l.code)}
                            style={{
                                flex: 1, padding: '6px 0', borderRadius: 6, fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                border: language === l.code ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
                                background: language === l.code ? '#dcfce7' : 'white',
                                color: language === l.code ? '#15803d' : '#6b7280'
                            }}>
                            {l.short}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    )
}