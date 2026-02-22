/**
 * DeadlineCalendar — mini calendar showing scheme deadlines as colored dots.
 * Reads from useUser() eligibilityResults — no API call.
 */
import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getSchemesOnDate(eligibilityResults, year, month, day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return (eligibilityResults || []).filter(r => r.deadline && r.deadline.startsWith(dateStr))
}

function urgencyDot(eligible, matchPercent) {
    if (eligible) return '#16a34a'
    if (matchPercent >= 50) return '#d97706'
    return '#9ca3af'
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DeadlineCalendar() {
    const { eligibilityResults } = useUser()
    const today = new Date()
    const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() })
    const [selected, setSelected] = useState(null)

    const { year, month } = current

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const prevMonth = () => setCurrent(c => {
        const m = c.month === 0 ? 11 : c.month - 1
        const y = c.month === 0 ? c.year - 1 : c.year
        return { year: y, month: m }
    })
    const nextMonth = () => setCurrent(c => {
        const m = c.month === 11 ? 0 : c.month + 1
        const y = c.month === 11 ? c.year + 1 : c.year
        return { year: y, month: m }
    })

    const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

    const selectedSchemes = selected
        ? getSchemesOnDate(eligibilityResults, year, month, selected)
        : []

    return (
        <div style={{
            background: 'white', borderRadius: 16, border: '1.5px solid #e5e7eb',
            boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            }}>
                <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                    <ChevronLeft size={16} />
                </button>
                <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'white', letterSpacing: '0.03em' }}>
                    {MONTH_NAMES[month]} {year}
                </div>
                <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 10px 4px' }}>
                {DAY_LABELS.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '.68rem', fontWeight: 700, color: '#9ca3af', paddingBottom: 4 }}>{d}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 10px 10px', gap: 2 }}>
                {/* Empty cells for first row */}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const schemes = getSchemesOnDate(eligibilityResults, year, month, day)
                    const isSelected = selected === day
                    const isTod = isToday(day)

                    return (
                        <div
                            key={day}
                            id={`cal-day-${year}-${month + 1}-${day}`}
                            onClick={() => setSelected(isSelected ? null : day)}
                            style={{
                                position: 'relative', textAlign: 'center', padding: '6px 2px',
                                borderRadius: 8, cursor: schemes.length > 0 ? 'pointer' : 'default',
                                background: isSelected ? '#dcfce7' : isTod ? '#f0fdf4' : 'transparent',
                                border: isSelected ? '1.5px solid #16a34a' : isTod ? '1.5px solid #86efac' : '1.5px solid transparent',
                                transition: 'background .15s',
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f9fafb' }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isTod ? '#f0fdf4' : 'transparent' }}
                        >
                            <div style={{
                                fontSize: '.78rem', fontWeight: isTod ? 800 : schemes.length > 0 ? 700 : 400,
                                color: isTod ? '#16a34a' : schemes.length > 0 ? '#111827' : '#6b7280',
                            }}>
                                {day}
                            </div>
                            {/* Deadline dots */}
                            {schemes.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                                    {schemes.slice(0, 3).map((s, idx) => (
                                        <span key={idx} style={{
                                            width: 5, height: 5, borderRadius: '50%',
                                            background: urgencyDot(s.eligible, s.match_percent),
                                            display: 'inline-block',
                                        }} />
                                    ))}
                                    {schemes.length > 3 && (
                                        <span style={{ fontSize: '.5rem', color: '#9ca3af', lineHeight: '5px' }}>+</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Selected day detail */}
            {selected && (
                <div style={{ borderTop: '1px solid #e5e7eb', padding: '12px 16px', animation: 'fadeIn .15s ease' }}>
                    <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: 8 }}>
                        📅 Deadlines on {MONTH_NAMES[month]} {selected}
                    </div>
                    {selectedSchemes.length === 0 ? (
                        <div style={{ color: '#9ca3af', fontSize: '.78rem' }}>No scheme deadlines on this date.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {selectedSchemes.map(s => (
                                <div key={s.scheme_id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: s.eligible ? '#f0fdf4' : '#fffbeb',
                                    borderRadius: 8, padding: '7px 10px',
                                    border: `1px solid ${s.eligible ? '#86efac' : '#fde68a'}`,
                                }}>
                                    <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#111827', flex: 1, marginRight: 8 }}>
                                        {s.scheme_name}
                                    </div>
                                    <span style={{
                                        fontSize: '.7rem', fontWeight: 700, padding: '2px 8px',
                                        borderRadius: 99, flexShrink: 0,
                                        background: s.eligible ? '#dcfce7' : '#fef3c7',
                                        color: s.eligible ? '#15803d' : '#b45309',
                                    }}>
                                        {s.eligible ? '✅ Eligible' : `${s.match_percent}% match`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, padding: '8px 16px 12px', borderTop: '1px solid #f3f4f6' }}>
                {[
                    { color: '#16a34a', label: 'Eligible' },
                    { color: '#d97706', label: 'Partial' },
                    { color: '#9ca3af', label: 'Ineligible' },
                ].map(({ color, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.7rem', color: '#6b7280' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    )
}