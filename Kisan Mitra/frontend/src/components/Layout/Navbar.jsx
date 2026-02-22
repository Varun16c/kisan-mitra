import { useState, useRef, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useUser } from '../../context/UserContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit3, User, ChevronDown } from 'lucide-react'
import NotificationBell from '../NotificationBell'

/** Layout wrapper for all authenticated pages. */
export default function Layout({ children }) {
    const { user, profile, logout } = useUser()
    const navigate = useNavigate()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    // Close click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top Header / Navbar */}
                <header className="nav-hide-print" style={{ height: 64, background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px', zIndex: 10, gap: 20 }}>

                    <NotificationBell />

                    {profile && (
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 30, transition: 'background 0.2s', border: dropdownOpen ? '1px solid #e5e7eb' : '1px solid transparent' }}
                                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseOut={e => e.currentTarget.style.background = dropdownOpen ? '#f1f5f9' : 'transparent'}
                            >
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                                    {profile.name ? profile.name.charAt(0).toUpperCase() : <User size={18} />}
                                </div>
                                <div style={{ textAlign: 'left', display: 'none', '@media (minWidth: 640px)': { display: 'block' } }}>
                                    <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#111827' }}>{profile.name}</div>
                                </div>
                                <ChevronDown size={14} color="#6b7280" />
                            </button>

                            {dropdownOpen && (
                                <div style={{ position: 'absolute', top: '120%', right: 0, width: 240, background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: 8, zIndex: 50 }}>

                                    {/* Profile Info Header */}
                                    <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid #f3f4f6', marginBottom: 4 }}>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '.9rem' }}>{profile.name}</div>
                                        {user?.email && user.id !== 'demo' && (
                                            <div style={{ fontSize: '.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                                        )}
                                        {user?.id === 'demo' && (
                                            <div style={{ fontSize: '.7rem', color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4, fontWeight: 700 }}>DEMO ACCOUNT</div>
                                        )}
                                    </div>

                                    {/* Edit Profile Action */}
                                    <button onClick={() => { setDropdownOpen(false); navigate('/profile/edit') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#374151', fontSize: '.85rem', fontWeight: 600, transition: 'background 0.2s', textAlign: 'left' }} onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <Edit3 size={16} color="#6b7280" /> Edit Profile
                                    </button>

                                    <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />

                                    {/* Logout Action */}
                                    <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#ef4444', fontSize: '.85rem', fontWeight: 600, transition: 'background 0.2s', textAlign: 'left' }} onMouseOver={e => e.currentTarget.style.background = '#fef2f2'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </header>

                {/* Main Content Pane */}
                <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}
