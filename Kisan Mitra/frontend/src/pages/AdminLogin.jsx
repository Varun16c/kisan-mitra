/**
 * AdminLogin — fixed credentials login for admin dashboard access.
 * Credentials: admin@kisanmitra.in / Admin@1234
 * Stores admin session in sessionStorage (cleared on tab close).
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Lock, Mail, Eye, EyeOff, Leaf } from 'lucide-react'
import toast from 'react-hot-toast'

const ADMIN_EMAIL = 'admin@kisanmitra.in'
const ADMIN_PASSWORD = 'Admin@1234'

export function isAdminLoggedIn() {
    return sessionStorage.getItem('km_admin') === 'true'
}

export default function AdminLogin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [attempts, setAttempts] = useState(0)

    const handleLogin = (e) => {
        e.preventDefault()
        if (attempts >= 5) return toast.error('Too many attempts. Please wait.')
        setLoading(true)
        // Simulate slight delay for UX
        setTimeout(() => {
            if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                sessionStorage.setItem('km_admin', 'true')
                toast.success('Welcome, Admin!')
                navigate('/admin')
            } else {
                setAttempts(a => a + 1)
                toast.error(`Invalid credentials. ${5 - attempts - 1} attempts remaining.`)
            }
            setLoading(false)
        }, 600)
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
            {/* Background Accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50vh', background: 'radial-gradient(ellipse at 50% 0%, #e0e7ff 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className="fade-in"
                style={{ position: 'absolute', top: 24, left: 32, display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '.9rem', color: '#475569', boxShadow: '0 2px 4px rgba(0,0,0,.02)', zIndex: 10, transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,.02)'; }}
            >
                <ArrowLeft size={18} /> Back to Home
            </button>

            <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: '#4f46e5', borderRadius: '16px', boxShadow: '0 4px 12px rgba(79,70,229,0.2)', marginBottom: 16 }}>
                            <ShieldCheck size={28} color="white" />
                        </div>
                        <h2 style={{ fontWeight: 900, fontSize: '1.6rem', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Admin Portal</h2>
                    </Link>
                    <p style={{ color: '#64748b', fontSize: '.95rem', margin: 0, fontWeight: 500 }}>Secure Access Required</p>
                </div>

                {/* Card */}
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '36px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
                    <form onSubmit={handleLogin} style={{ display: 'grid', gap: 20 }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '.85rem', color: '#334155', marginBottom: 6 }}>Admin Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    style={{ width: '100%', padding: '12px 14px 12px 42px', background: 'white', border: '1.5px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontSize: '.95rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    type="email" placeholder="admin@kisanmitra.in" value={email}
                                    onChange={e => setEmail(e.target.value)} autoComplete="username"
                                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '.85rem', color: '#334155', marginBottom: 6 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    style={{ width: '100%', padding: '12px 42px 12px 42px', background: 'white', border: '1.5px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontSize: '.95rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                                    onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                                />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {attempts > 0 && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '.85rem', color: '#dc2626', fontWeight: 500 }}>
                                ⚠️ {attempts} failed attempt{attempts > 1 ? 's' : ''}. Account locks after 5.
                            </div>
                        )}

                        <button type="submit" disabled={loading || attempts >= 5}
                            style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 800, fontSize: '1.05rem', cursor: loading ? 'wait' : 'pointer', opacity: attempts >= 5 ? .5 : 1, fontFamily: 'inherit', transition: 'all .2s', boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}>
                            {loading ? 'Verifying...' : 'Access Admin Dashboard'}
                        </button>
                    </form>

                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <Link to="/login" style={{ color: '#4f46e5', fontSize: '.9rem', fontWeight: 600, textDecoration: 'none' }}>
                            ← Back to User Login
                        </Link>
                    </div>
                </div>

                {/* Hint */}
                <div style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: '.8rem', fontWeight: 500 }}>
                    <Leaf size={14} style={{ display: 'inline', marginRight: 6 }} color="#16a34a" />
                    Kisan Mitra Admin · Authorized Personnel Only
                </div>
            </div>
        </div>
    )
}
