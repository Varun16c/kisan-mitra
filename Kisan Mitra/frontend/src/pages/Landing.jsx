import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../hooks/useTranslation'
import { useLanguage } from '../context/LanguageContext'
import { Leaf, Mic, FileSearch, MessageCircle, ArrowRight, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react'

export default function Landing() {
    const navigate = useNavigate()
    const { setDemoProfile, user } = useUser()
    const { t } = useTranslation()
    const { language, setLanguage, LANGUAGES } = useLanguage()
    const bgRef = useRef(null)

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (bgRef.current) {
                const x = e.clientX;
                const y = e.clientY;
                // Full screen gradient shifting from bright green to white
                bgRef.current.style.background = `radial-gradient(1200px circle at ${x}px ${y}px, #bbf7d0 0%, #dcfce7 25%, #ffffff 80%)`;
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleStart = () => {
        if (user) navigate('/dashboard')
        else navigate('/login')
    }

    const handleDemo = () => {
        setDemoProfile({
            name: 'Demo Farmer', age: 38, state: 'Maharashtra', district: 'Nashik',
            gender: 'male', caste: 'OBC', occupation: 'farmer', land_acres: 3,
            annual_income: 80000, has_aadhaar: true, has_bank_account: true,
            has_land_record: true, has_ration_card: true, is_bpl: false, language,
        })
        navigate('/dashboard')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', fontFamily: 'Inter, sans-serif', overflowX: 'hidden', position: 'relative' }}>
            {/* Dynamic Interactive Mouse-Following Glow */}
            <div ref={bgRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'radial-gradient(1200px circle at 50% 0%, #bbf7d0 0%, #dcfce7 25%, #ffffff 80%)', zIndex: 0, pointerEvents: 'none', transition: 'background 0.1s ease-out' }} />

            {/* Subtle Dot Grid Pattern */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(#16a34a 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.06, maskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)', WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)' }} />

            {/* Navbar */}
            <nav style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: '#16a34a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,163,74,0.2)' }}>
                        <Leaf size={20} color="white" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#16a34a', letterSpacing: '-0.02em' }}>Kisan Mitra</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 4, background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        {Object.values(LANGUAGES).map(l => (
                            <button key={l.code} onClick={() => setLanguage(l.code)}
                                style={{
                                    padding: '6px 14px', borderRadius: '8px', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', border: 'none',
                                    background: language === l.code ? '#16a34a' : 'transparent',
                                    color: language === l.code ? '#fff' : '#64748b'
                                }}>
                                {l.short}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleStart}
                        style={{ background: 'white', color: '#16a34a', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        Log in
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{ position: 'relative', zIndex: 10, padding: '100px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '75vh', justifyContent: 'center' }}>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '8px 20px', borderRadius: 999, fontSize: '.85rem', fontWeight: 700, marginBottom: 40 }}>
                    <Sparkles size={16} />
                    <span>Discover 57+ Schemes instantly with AI Matching</span>
                </div>

                <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.15, color: '#0f172a', marginBottom: 24, letterSpacing: '-0.03em', maxWidth: 900 }}>
                    Your Trusted Guide to <span style={{ color: '#16a34a' }}>Rural Benefits.</span>
                </h1>

                <p style={{ fontSize: '1.25rem', color: '#475569', marginBottom: 50, lineHeight: 1.6, maxWidth: 650, fontWeight: 500 }}>
                    No more endless bureaucracy. Tell us about your livelihood, and our AI instantly curates the exact government schemes you are eligible for. Zero jargon.
                </p>

                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={handleStart}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#16a34a', color: 'white', padding: '18px 36px', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', border: 'none', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.3)' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(22, 163, 74, 0.4)'; e.currentTarget.style.background = '#15803d'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(22, 163, 74, 0.3)'; e.currentTarget.style.background = '#16a34a'; }}
                    >
                        Find My Schemes <ArrowRight size={20} />
                    </button>

                    <button
                        onClick={handleDemo}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', color: '#334155', padding: '18px 36px', borderRadius: '14px', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', border: '2px solid #e2e8f0', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        Try Demo Dashboard
                    </button>
                </div>
            </section>

            {/* Seamless Value Prop Row - Bright Theme */}
            <section style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', padding: '50px 0', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 40, padding: '0 40px' }}>
                    {[
                        { icon: FileSearch, title: 'Instant Matching', text: 'Real-time eligibility scoring.' },
                        { icon: MessageCircle, title: 'Hindi & Marathi', text: 'Talk naturally in your language.' },
                        { icon: Mic, title: 'Voice Powered', text: 'Skip typing entirely.' },
                    ].map((feature, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 56, height: 56, background: '#ffffff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <feature.icon size={26} color="#16a34a" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px', color: '#1e293b' }}>{feature.title}</h3>
                                <p style={{ fontSize: '.9rem', color: '#64748b', margin: 0, fontWeight: 500 }}>{feature.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '60px 48px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 10, background: '#ffffff' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 28, height: 28, background: '#f0fdf4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Leaf size={16} color="#16a34a" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>Kisan Mitra</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '.85rem', fontWeight: 500 }}>© 2026. Empowering Rural India.</span>
                </div>

                <div style={{ display: 'flex', gap: 32 }}>
                    <div style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '.85rem', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#1e293b'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        onClick={() => navigate('/admin-login')}
                    >
                        <ShieldCheck size={16} /> Admin Portal
                    </div>
                </div>
            </footer>
        </div>
    )
}
