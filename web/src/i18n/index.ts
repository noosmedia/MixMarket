// i18next-Konfiguration. Deutsch und Englisch, Standard Deutsch.
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './de.json'
import en from './en.json'

// Gespeicherte Sprache aus dem lokalen Speicher lesen
const savedLanguage = localStorage.getItem('mixmarket-language') || 'de'

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: savedLanguage,
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
})

export default i18n
