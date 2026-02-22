/** useTranslation — returns translated string for a key based on current language. */
import { useLanguage } from '../context/LanguageContext'
import T from '../utils/translations'

export function useTranslation() {
    const { language } = useLanguage()
    const t = (key) => T[key]?.[language] || T[key]?.en || key
    return { t, language }
}
