/**
 * Axios API client with all backend endpoints.
 * Falls back gracefully if backend is offline (demo mode).
 */
import axios from 'axios'

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE, timeout: 30000 })

// Schemes
export const getAllSchemes = () => api.get('/api/schemes/all')
export const checkEligibilityAPI = (profile) => api.post('/api/schemes/check-eligibility', { profile })
export const whatIfAPI = (profile, changes) => api.post('/api/schemes/whatif', { profile, changes })

// Auth
export const register = (data) => api.post('/api/auth/register', data)
export const login = (data) => api.post('/api/auth/login', data)

// Chat (streaming via fetch — uses relative URL to go through Vite proxy for proper SSE)
// In production, VITE_BACKEND_URL should be set to backend URL
const CHAT_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || '')

export async function* streamChat(message, history, userProfile, language) {
    const res = await fetch(`${CHAT_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, user_profile: userProfile, language }),
    })
    if (!res.ok) {
        const err = await res.text().catch(() => res.statusText)
        throw new Error(`Chat API error ${res.status}: ${err}`)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
            if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
                try {
                    const data = JSON.parse(line.slice(6))
                    if (data.content) yield data.content
                } catch { /* skip malformed lines */ }
            }
        }
    }
}

export const clearChatHistory = (userId) => api.delete(`/api/chat/history?user_id=${userId}`)

// OCR
export const extractDocument = (file, profile) => {
    const form = new FormData()
    form.append('file', file)
    form.append('profile', JSON.stringify(profile))
    return api.post('/api/ocr/extract', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// Reports
export const downloadActionPlan = async (profile) => {
    const res = await fetch(`${BASE}/api/reports/action-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
    })
    if (!res.ok) throw new Error('PDF generation failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kisan_mitra_action_plan.pdf`
    a.click()
    URL.revokeObjectURL(url)
}

// Admin
export const getAdminStats = () => api.get('/api/reports/admin/stats')

// Bookmarks
export const toggleBookmark = (userId, schemeId) => api.post('/api/bookmarks/toggle', { user_id: userId, scheme_id: schemeId })
export const getUserBookmarks = (userId) => api.get(`/api/bookmarks/${userId}`)
export const getBookmarkedSchemes = (userId) => api.get(`/api/bookmarks/${userId}/schemes`)

export default api
