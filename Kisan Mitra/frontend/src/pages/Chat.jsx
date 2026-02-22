import { useState, useRef, useEffect, useCallback } from 'react'
import Layout from '../components/Layout/Navbar'
import { useUser } from '../context/UserContext'
import { useLanguage } from '../context/LanguageContext'
import { useTranslation } from '../hooks/useTranslation'
import { useVoice } from '../hooks/useVoice'
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, ThumbsUp, ThumbsDown, Trash2, Clipboard, ClipboardCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { clearChatHistory } from '../utils/api'

const QUICK_QUESTIONS = [
    'What schemes am I eligible for?',
    'What documents do I need?',
    'Which scheme should I apply for first?',
    'How much total benefit can I get?',
]

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const CHAT_URL = `${BACKEND}/api/chat/simple`

export default function Chat() {
    const { user, profile, eligibilityResults = [] } = useUser()
    const { language } = useLanguage()
    const { t } = useTranslation()
    const { isListening, transcript, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoice()

    const getGreeting = () => {
        if (language === 'hi') return 'नमस्ते! मैं Kisan Mitra हूं। आपकी पात्र योजनाओं, दस्तावेजों, या आवेदन प्रक्रिया के बारे में कुछ भी पूछें।'
        if (language === 'mr') return 'नमस्कार! मी Kisan Mitra आहे. तुमच्या पात्र योजना, कागदपत्रे किंवा अर्ज प्रक्रियेबद्दल काहीही विचारा.'
        return 'Hello! I am Kisan Mitra. Ask me anything about your eligible schemes, required documents, or how to apply.'
    }

    const [messages, setMessages] = useState([{ role: 'assistant', content: getGreeting() }])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [voiceOutput, setVoiceOutput] = useState(false)
    const [feedbackGiven, setFeedbackGiven] = useState({})  // msgIndex → 'up'|'down'
    const [copied, setCopied] = useState({})  // msgIndex → true after copy
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const bottomRef = useRef(null)
    const abortRef = useRef(null)
    const isDemo = user?.id === 'demo'

    // ── Auto-scroll ──────────────────────────────────────────────────────────
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
    useEffect(() => { if (transcript) setInput(transcript) }, [transcript])

    // ── Load history from Supabase on mount ──────────────────────────────────
    useEffect(() => {
        if (!user?.id || isDemo) return
        setHistoryLoading(true)
        fetch(`${BACKEND}/api/chat/history?user_id=${user.id}`, { credentials: 'omit' })
            .then(r => r.json())
            .then(data => {
                const past = data.messages || []
                if (past.length > 0) {
                    // Prepend history before the greeting
                    setMessages([
                        { role: 'assistant', content: getGreeting() },
                        ...past.map(m => ({ role: m.role, content: m.content, fromHistory: true }))
                    ])
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                }
            })
            .catch(e => console.warn('[Chat] History load failed:', e))
            .finally(() => setHistoryLoading(false))
    }, [user?.id])  // eslint-disable-line react-hooks/exhaustive-deps

    // ── Save exchange to Supabase ─────────────────────────────────────────────
    const saveToHistory = useCallback(async (userMsg, aiMsg) => {
        if (!user?.id || isDemo) return
        try {
            await fetch(`${BACKEND}/api/chat/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'omit',
                body: JSON.stringify({
                    user_id: user.id,
                    user_message: userMsg,
                    ai_response: aiMsg,
                    language,
                }),
            })
        } catch (e) {
            console.warn('[Chat] Save to history failed:', e)
        }
    }, [user?.id, language, isDemo])

    // ── Send feedback ────────────────────────────────────────────────────────
    const sendFeedback = useCallback(async (msgIndex, msgContent, rating) => {
        if (feedbackGiven[msgIndex]) return
        setFeedbackGiven(prev => ({ ...prev, [msgIndex]: rating }))
        toast.success(rating === 'up' ? '👍 Thanks for the feedback!' : '👎 We\'ll improve!', { duration: 2000 })
        if (!user?.id || isDemo) return
        try {
            await fetch(`${BACKEND}/api/chat/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'omit',
                body: JSON.stringify({ user_id: user.id, ai_message: msgContent, rating }),
            })
        } catch (e) {
            console.warn('[Chat] Feedback save failed:', e)
        }
    }, [feedbackGiven, user?.id, isDemo])

    // ── Clear history ────────────────────────────────────────────────────────
    const confirmClearHistory = async () => {
        setShowDeleteConfirm(false)

        if (user?.id && !isDemo) {
            try {
                await clearChatHistory(user.id)
            } catch (err) {
                console.error("Failed to clear chat history:", err)
                toast.error("Failed to delete chat from server")
                return
            }
        }

        setMessages([{ role: 'assistant', content: getGreeting() }])
        setFeedbackGiven({})
        toast.success(t('chat_cleared') || 'Chat cleared', { duration: 1500 })
    }

    // ── Copy message ──────────────────────────────────────────────────────
    const copyMessage = useCallback(async (msgIndex, content) => {
        try {
            await navigator.clipboard.writeText(content)
            setCopied(prev => ({ ...prev, [msgIndex]: true }))
            setTimeout(() => setCopied(prev => ({ ...prev, [msgIndex]: false })), 2000)
        } catch {
            toast.error('Could not copy text')
        }
    }, [])

    /** Simulate typewriter by drip-feeding the full response */
    const typewriterEffect = useCallback((fullText, onUpdate, onDone) => {
        let i = 0
        const interval = setInterval(() => {
            i += Math.floor(Math.random() * 4) + 2  // 2-5 chars per tick
            if (i >= fullText.length) {
                onUpdate(fullText)
                onDone()
                clearInterval(interval)
            } else {
                onUpdate(fullText.slice(0, i))
            }
        }, 18)
        return interval
    }, [])

    const sendMessage = async (text) => {
        const msg = (text || input).trim()
        if (!msg || loading) return
        setInput('')

        const userMsg = { role: 'user', content: msg }
        const historyForAPI = messages
            .slice(-8)
            .filter(m => !m.fromHistory || m === messages[messages.length - 1])
            .map(m => ({ role: m.role, content: m.content }))

        // Add user message + empty assistant placeholder
        setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', typing: true }])
        setLoading(true)

        try {
            const controller = new AbortController()
            abortRef.current = controller

            const res = await fetch(CHAT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'omit',
                body: JSON.stringify({
                    message: msg,
                    history: historyForAPI,
                    user_profile: profile || {},
                    language,
                    eligibility_results: eligibilityResults.slice(0, 100),
                }),
                signal: controller.signal,
            })

            if (!res.ok) {
                const errText = await res.text().catch(() => `HTTP ${res.status}`)
                throw new Error(errText)
            }

            const data = await res.json()
            const fullResponse = data.content || '(No response)'

            // Animate the response with typewriter effect
            typewriterEffect(
                fullResponse,
                (partial) => setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: 'assistant', content: partial, typing: true }
                    return updated
                }),
                () => {
                    setMessages(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1] = { role: 'assistant', content: fullResponse }
                        return updated
                    })
                    setLoading(false)
                    if (voiceOutput) speak(fullResponse)
                    // Save to Supabase after typewriter completes
                    saveToHistory(msg, fullResponse)
                }
            )

        } catch (err) {
            if (err.name === 'AbortError') { setLoading(false); return }
            console.error('Chat error:', err)
            const errMsg = err.message?.includes('Failed to fetch')
                ? 'Cannot reach backend. Is it running on port 8000?'
                : `Error: ${err.message}`
            setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: '❌ ' + errMsg, error: true }
                return updated
            })
            toast.error('Chat failed: ' + err.message, { duration: 4000 })
            setLoading(false)
        }
    }

    const handleVoice = () => {
        if (isListening) {
            const text = stopListening()
            if (text) setTimeout(() => sendMessage(text), 400)
        } else { startListening() }
    }

    return (
        <Layout>
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 780, margin: '0 auto', width: '100%' }}>
                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={18} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Kisan Mitra AI</div>
                            <div style={{ fontSize: '.72rem', color: loading ? '#f59e0b' : '#16a34a' }}>
                                {historyLoading ? '⏳ Loading history...' : loading ? '⏳ Thinking...' : '● Online · Powered by Groq'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {!isDemo && messages.length > 1 && (
                            <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-sm btn-secondary" title="Clear chat">
                                <Trash2 size={14} />
                            </button>
                        )}
                        <button onClick={() => { setVoiceOutput(v => !v); if (isSpeaking) stopSpeaking() }}
                            className={`btn btn-sm ${voiceOutput ? 'btn-primary' : 'btn-secondary'}`}>
                            {voiceOutput ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            {voiceOutput ? 'Voice On' : 'Voice Off'}
                        </button>
                    </div>
                </div>

                {/* Quick questions */}
                <div style={{ padding: '10px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {QUICK_QUESTIONS.map(q => (
                        <button key={q} className="badge badge-blue" style={{ cursor: 'pointer', padding: '5px 12px', fontSize: '.76rem' }}
                            onClick={() => sendMessage(q)} disabled={loading}>
                            {q}
                        </button>
                    ))}
                </div>

                {/* Demo / history notice */}
                {isDemo && (
                    <div style={{ padding: '6px 20px', background: '#fef3c7', borderBottom: '1px solid #fde68a', fontSize: '.75rem', color: '#b45309', textAlign: 'center' }}>
                        Demo mode — chat history is not saved. <a href="/login" style={{ color: '#b45309', fontWeight: 700 }}>Login</a> to save your conversations.
                    </div>
                )}

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, background: '#f9fafb' }}>
                    {messages.map((m, i) => (
                        <div key={i}>
                            <div style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.role === 'user' ? '#16a34a' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {m.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="#6b7280" />}
                                </div>
                                <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                                    style={{ animation: 'fadeIn .3s ease', border: m.error ? '1px solid #fca5a5' : undefined }}>
                                    {m.content
                                        ? <>{m.content}{m.typing && <span style={{ opacity: .5 }}>▊</span>}</>
                                        : <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #16a34a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    }
                                </div>
                            </div>
                            {/* Thumbs + copy feedback — only on complete AI messages */}
                            {m.role === 'assistant' && m.content && !m.typing && !m.error && i > 0 && (
                                <div style={{ display: 'flex', gap: 6, marginTop: 4, paddingLeft: 40 }}>
                                    <button
                                        onClick={() => sendFeedback(i, m.content, 'up')}
                                        style={{ background: feedbackGiven[i] === 'up' ? '#dcfce7' : 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}
                                        title="Helpful">
                                        <ThumbsUp size={13} color={feedbackGiven[i] === 'up' ? '#16a34a' : '#9ca3af'} />
                                    </button>
                                    <button
                                        onClick={() => sendFeedback(i, m.content, 'down')}
                                        style={{ background: feedbackGiven[i] === 'down' ? '#fee2e2' : 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}
                                        title="Not helpful">
                                        <ThumbsDown size={13} color={feedbackGiven[i] === 'down' ? '#ef4444' : '#9ca3af'} />
                                    </button>
                                    <button
                                        onClick={() => copyMessage(i, m.content)}
                                        style={{ background: copied[i] ? '#dcfce7' : 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}
                                        title="Copy response">
                                        {copied[i] ? <ClipboardCheck size={13} color="#16a34a" /> : <Clipboard size={13} color="#9ca3af" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Listening indicator */}
                {isListening && (
                    <div style={{ padding: '8px 24px', background: '#fef3c7', textAlign: 'center', fontSize: '.85rem', fontWeight: 600, color: '#b45309' }}>
                        🎙️ Listening — {transcript || 'Speak now...'}
                    </div>
                )}

                {/* Input */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: 'white', display: 'flex', gap: 10 }}>
                    <button onClick={handleVoice} className={`btn ${isListening ? 'btn-danger pulse-mic' : 'btn-secondary'}`}
                        style={{ flexShrink: 0, width: 44, padding: 0 }}>
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <input className="input" value={input} onChange={e => setInput(e.target.value)}
                        placeholder={t('ask_anything') || 'Ask anything about schemes...'}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} disabled={loading} />
                    <button className="btn btn-primary" onClick={() => sendMessage()}
                        disabled={!input.trim() || loading} style={{ flexShrink: 0, width: 44, padding: 0 }}>
                        <Send size={18} />
                    </button>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card" style={{ background: 'white', padding: 24, width: '90%', maxWidth: 400, borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.2rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Trash2 color="#ef4444" size={20} /> Delete Chat History
                            </h3>
                            <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5, marginTop: 12, marginBottom: 24 }}>
                                Are you sure you want to permanently delete this chat history? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={confirmClearHistory}>Delete Permanently</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}
