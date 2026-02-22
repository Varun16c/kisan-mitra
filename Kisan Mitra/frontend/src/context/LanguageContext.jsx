/**
 * LanguageContext — manages app language (en/hi/mr).
 * Persisted to localStorage. Controls UI labels, AI responses, and voice settings.
 */
import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext(null)

export const LANGUAGES = {
    en: { code: 'en', label: 'English', flag: '🇮🇳', voice: 'en-IN', short: 'EN' },
    hi: { code: 'hi', label: 'हिंदी', flag: '🇮🇳', voice: 'hi-IN', short: 'HI' },
    mr: { code: 'mr', label: 'मराठी', flag: '🇮🇳', voice: 'mr-IN', short: 'MR' },
}

export function LanguageProvider({ children }) {
    const [language, setLanguageCode] = useState(
        () => localStorage.getItem('km_lang') || 'en'
    )

    const setLanguage = (code) => {
        if (LANGUAGES[code]) {
            setLanguageCode(code)
            localStorage.setItem('km_lang', code)
        }
    }

    const langMeta = LANGUAGES[language] || LANGUAGES.en

    return (
        <LanguageContext.Provider value={{ language, setLanguage, langMeta, LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => {
    const ctx = useContext(LanguageContext)
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
    return ctx
}
