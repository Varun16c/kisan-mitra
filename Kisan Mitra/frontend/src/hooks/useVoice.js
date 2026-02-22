/**
 * useVoice hook — Web Speech API for voice input (recognition) and voice output (synthesis).
 * Language-aware: uses LanguageContext to set correct locale (en-IN/hi-IN/mr-IN).
 */
import { useState, useRef, useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'

export function useVoice() {
    const { langMeta } = useLanguage()
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [error, setError] = useState(null)
    const recognitionRef = useRef(null)

    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            setError('Voice input not supported in this browser. Use Chrome.')
            return
        }
        const recognition = new SpeechRecognition()
        recognition.lang = langMeta.voice // en-IN | hi-IN | mr-IN
        recognition.continuous = false
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => { setIsListening(true); setTranscript(''); setError(null) }
        recognition.onresult = (e) => {
            const t = Array.from(e.results)
                .map(r => r[0].transcript)
                .join('')
            setTranscript(t)
        }
        recognition.onerror = (e) => { setError(e.error); setIsListening(false) }
        recognition.onend = () => setIsListening(false)

        recognitionRef.current = recognition
        recognition.start()
    }, [langMeta.voice])

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop()
        setIsListening(false)
        return transcript
    }, [transcript])

    const speak = useCallback((text) => {
        if (!window.speechSynthesis || !text) return
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = langMeta.voice
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
    }, [langMeta.voice])

    const stopSpeaking = useCallback(() => {
        window.speechSynthesis?.cancel()
        setIsSpeaking(false)
    }, [])

    return { isListening, transcript, isSpeaking, error, startListening, stopListening, speak, stopSpeaking }
}
