/**
 * AuthPage — Login & Register tabs using Supabase Auth.
 * After login: loads profile from Supabase → Dashboard or Onboarding.
 * After register: → Onboarding (to create profile).
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { ArrowLeft, Leaf, Eye, EyeOff, Mail, Lock, User, Phone, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage() {
    const { supabase, setDemoProfile, loadProfileFromSupabase } = useUser()
    const navigate = useNavigate()
    const [tab, setTab] = useState('login')
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)

    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const friendlyError = (msg = '') => {
        if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed'))
            return '⚠️ Please confirm your email first — check your inbox, OR go to Supabase Dashboard → Auth → Settings and disable "Email confirmations"'
        if (msg.includes('Invalid login credentials'))
            return '❌ Wrong email or password. Please check and try again.'
        if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit') || msg.includes('too many requests'))
            return '⏳ Too many attempts. Supabase limits 3 emails/hr on free plan. Wait 1 hour OR disable email confirmation in Supabase Dashboard → Auth → Settings.'
        if (msg.includes('User already registered') || msg.includes('already registered'))
            return '📧 This email is already registered. Switch to the Login tab.'
        if (msg.includes('Password should be'))
            return '🔒 Password must be at least 8 characters.'
        return msg || 'Something went wrong. Please try again.'
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!form.email || !form.password) return toast.error('Please enter email and password')
        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: form.email, password: form.password
            })
            if (error) throw error
            const hasProfile = await loadProfileFromSupabase(data.user.id)
            toast.success(`Welcome back, ${data.user.email.split('@')[0]}!`)
            navigate(hasProfile ? '/dashboard' : '/onboarding')
        } catch (err) {
            toast.error(friendlyError(err.message), { duration: 6000 })
        } finally { setLoading(false) }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields')
        if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: { data: { name: form.name, phone: form.phone } }
            })
            if (error) throw error

            // If identities is empty, user already exists (Supabase quirk)
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                toast.error('📧 This email is already registered. Switch to Login tab.', { duration: 5000 })
                setTab('login')
                setLoading(false)
                return
            }

            // Save user row in public.users
            if (data.user) {
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email: form.email,
                    name: form.name,
                    phone: form.phone,
                    language_preference: 'en',
                    profile: {}
                }).select()
            }
            toast.success('🎉 Account created! Let\'s set up your profile.')
            navigate('/onboarding')
        } catch (err) {
            toast.error(friendlyError(err.message), { duration: 6000 })
        } finally { setLoading(false) }
    }

    const handleDemo = () => {
        setDemoProfile({
            name: 'Demo Farmer', age: 38, state: 'Maharashtra', district: 'Nashik',
            gender: 'male', caste: 'OBC', occupation: 'farmer', land_acres: 3,
            annual_income: 80000, has_aadhaar: true, has_bank_account: true,
            has_land_record: true, has_ration_card: true, is_bpl: false, language: 'en',
        })
        navigate('/dashboard')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
            {/* Background Accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50vh', background: 'radial-gradient(ellipse at 50% 0%, #dcfce7 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

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

            <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 10 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: '#16a34a', borderRadius: '16px', boxShadow: '0 4px 12px rgba(22,163,74,0.2)', marginBottom: 16 }}>
                            <Leaf size={28} color="white" />
                        </div>
                        <h2 style={{ fontWeight: 900, fontSize: '1.6rem', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Welcome to Kisan Mitra</h2>
                    </Link>
                    <p style={{ color: '#64748b', fontSize: '.95rem', margin: 0, fontWeight: 500 }}>Access your rural schemes dashboard</p>
                </div>

                {/* Card */}
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '36px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 24 }}>
                        {[['login', 'Login'], ['register', 'Register']].map(([v, l]) => (
                            <button key={v} onClick={() => setTab(v)}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '.9rem', transition: 'all .2s',
                                    background: tab === v ? 'white' : 'transparent',
                                    color: tab === v ? '#16a34a' : '#6b7280',
                                    boxShadow: tab === v ? '0 1px 4px rgba(0,0,0,.1)' : 'none'
                                }}>
                                {l}
                            </button>
                        ))}
                    </div>

                    {/* LOGIN FORM */}
                    {tab === 'login' && (
                        <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
                            <div>
                                <label className="label">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input className="input" type="email" placeholder="ram@example.com" value={form.email}
                                        onChange={e => set('email', e.target.value)} style={{ paddingLeft: 38 }} autoComplete="email" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                                        onChange={e => set('password', e.target.value)} style={{ paddingLeft: 38, paddingRight: 42 }} autoComplete="current-password" />
                                    <button type="button" onClick={() => setShowPass(v => !v)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
                                {loading ? 'Logging in...' : '🔑 Login'}
                            </button>
                        </form>
                    )}

                    {/* REGISTER FORM */}
                    {tab === 'register' && (
                        <form onSubmit={handleRegister} style={{ display: 'grid', gap: 14 }}>
                            <div>
                                <label className="label">Full Name *</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input className="input" placeholder="Ramesh Kumar Patil" value={form.name}
                                        onChange={e => set('name', e.target.value)} style={{ paddingLeft: 38 }} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Mobile Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input className="input" type="tel" placeholder="9876543210" value={form.phone}
                                        onChange={e => set('phone', e.target.value)} style={{ paddingLeft: 38 }} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Email Address *</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input className="input" type="email" placeholder="ram@example.com" value={form.email}
                                        onChange={e => set('email', e.target.value)} style={{ paddingLeft: 38 }} autoComplete="email" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Password * (min 8 characters)</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input className="input" type={showPass ? 'text' : 'password'} placeholder="Create a strong password" value={form.password}
                                        onChange={e => set('password', e.target.value)} style={{ paddingLeft: 38, paddingRight: 42 }} autoComplete="new-password" />
                                    <button type="button" onClick={() => setShowPass(v => !v)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {/* Password strength indicator */}
                                {form.password && (
                                    <div style={{ marginTop: 6 }}>
                                        <div className="progress-bar" style={{ height: 4 }}>
                                            <div className="progress-fill" style={{
                                                width: form.password.length < 6 ? '25%' : form.password.length < 8 ? '50%' : form.password.length < 12 ? '75%' : '100%',
                                                background: form.password.length < 8 ? '#ef4444' : form.password.length < 12 ? '#f59e0b' : '#16a34a'
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '.7rem', color: form.password.length < 8 ? '#ef4444' : '#16a34a' }}>
                                            {form.password.length < 6 ? 'Too weak' : form.password.length < 8 ? 'Weak' : form.password.length < 12 ? 'Good' : 'Strong'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
                                {loading ? 'Creating account...' : '🌾 Create Account'}
                            </button>
                            <p style={{ fontSize: '.75rem', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                                By registering, you'll be guided through a 2-minute profile setup to find your eligible schemes.
                            </p>

                        </form>
                    )}

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
                        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                        <span style={{ color: '#9ca3af', fontSize: '.78rem', fontWeight: 600 }}>OR</span>
                        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    </div>

                    {/* Demo */}
                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleDemo}>
                        🔍 Try Demo (No account needed)
                    </button>
                </div>

                {/* Admin link */}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Link to="/admin-login" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.8rem', color: '#9ca3af', textDecoration: 'none' }}>
                        <ShieldCheck size={14} /> Admin Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
