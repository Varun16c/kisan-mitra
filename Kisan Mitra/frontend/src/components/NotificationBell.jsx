/**
 * NotificationBell — reads eligibilityResults from useUser() (local, no API call).
 * Shows upcoming scheme deadlines (≤30 days) and newly-missed mismatches as alerts.
 */
import { useState, useRef, useEffect } from 'react'
import { Bell, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../hooks/useTranslation'

function daysLeft(deadline) {
    if (!deadline) return null
    const diff = (new Date(deadline) - new Date()) / 86400000
    return Math.ceil(diff)
}

function urgencyColor(days) {
    if (days <= 7) return { bg: '#fef2f2', border: '#fca5a5', dot: '#dc2626', text: '#dc2626' }
    if (days <= 14) return { bg: '#fffbeb', border: '#fde68a', dot: '#d97706', text: '#d97706' }
    return { bg: '#f0fdf4', border: '#86efac', dot: '#16a34a', text: '#15803d' }
}

export default function NotificationBell() {
    const { eligibilityResults } = useUser()
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    // Build notifications: eligible schemes with deadline ≤30 days
    const notifications = (eligibilityResults || [])
        .filter(r => r.eligible && r.deadline)
        .map(r => ({ ...r, days: daysLeft(r.deadline) }))
        .filter(r => r.days !== null && r.days >= 0 && r.days <= 30)
        .sort((a, b) => a.days - b.days)

    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Bell button */}
            <button
                id="notification-bell-btn"
                onClick={() => setOpen(o => !o)}
                title="Notifications"
                style={{
                    position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px 8px', borderRadius: 8, color: '#6b7280', display: 'flex',
                    alignItems: 'center', transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
                <Bell size={19} />
                {notifications.length > 0 && (
                    <span style={{
                        position: 'absolute', top: 2, right: 2,
                        minWidth: 16, height: 16, background: '#dc2626',
                        color: 'white', fontSize: '.6rem', fontWeight: 800,
                        borderRadius: 99, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: '0 3px', lineHeight: 1,
                    }}>
                        {notifications.length}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: '110%', zIndex: 999,
                    width: 340, maxHeight: 420, overflowY: 'auto',
                    background: 'white', borderRadius: 14,
                    boxShadow: '0 8px 32px rgba(0,0,0,.14)',
                    border: '1.5px solid #e5e7eb',
                    animation: 'fadeIn .15s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 16px 10px', borderBottom: '1px solid #f3f4f6',
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827' }}>
                            🔔 Deadline Alerts
                        </div>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
                            <X size={16} />
                        </button>
                    </div>

                    {notifications.length === 0 ? (
                        <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af' }}>
                            <CheckCircle2 size={32} color="#86efac" style={{ margin: '0 auto 10px' }} />
                            <div style={{ fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>All clear!</div>
                            <div style={{ fontSize: '.82rem' }}>No deadlines in the next 30 days.</div>
                        </div>
                    ) : (
                        <div style={{ padding: '8px 10px' }}>
                            {notifications.map(r => {
                                const c = urgencyColor(r.days)
                                return (
                                    <div key={r.scheme_id} style={{
                                        background: c.bg, border: `1.5px solid ${c.border}`,
                                        borderRadius: 10, padding: '10px 13px', marginBottom: 8,
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                    }}>
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: c.dot, flexShrink: 0, marginTop: 5,
                                        }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '.83rem', color: '#111827', marginBottom: 2, lineHeight: 1.3 }}>
                                                {r.scheme_name}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: c.text, fontSize: '.76rem', fontWeight: 600 }}>
                                                <Clock size={12} />
                                                {r.days === 0 ? 'Deadline TODAY!' : `${r.days} ${t('days_left')}`}
                                                {r.days <= 7 && <AlertCircle size={12} />}
                                            </div>
                                            {r.deadline_label && (
                                                <div style={{ fontSize: '.72rem', color: '#6b7280', marginTop: 2 }}>
                                                    {r.deadline_label}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Footer hint */}
                    <div style={{
                        padding: '8px 16px', borderTop: '1px solid #f3f4f6',
                        fontSize: '.72rem', color: '#9ca3af', textAlign: 'center'
                    }}>
                        Showing deadlines within 30 days · from your {(eligibilityResults || []).filter(r => r.eligible).length} eligible schemes
                    </div>
                </div>
            )}
        </div>
    )
}