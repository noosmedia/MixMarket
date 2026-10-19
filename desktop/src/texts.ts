// Texte der Programmhülle (Startbildschirm, Fehleranzeige, Menü, Fenster "Passwort neu setzen") auf
// Deutsch oder Englisch. Die Sprache folgt dem Betriebssystem; die Oberfläche von MixMarket hat ihre eigene
// Umschaltung und gibt ihre Sprache an das Fenster "Passwort neu setzen" weiter.
import { app } from 'electron'
import de from './i18n/de.json'
import en from './i18n/en.json'

export type TextKey = keyof typeof de

// Deutsch für deutschsprachige Systeme, sonst Englisch
export function language(): 'de' | 'en' {
  return app.getLocale().toLowerCase().startsWith('de') ? 'de' : 'en'
}

export function text(key: TextKey): string {
  return (language() === 'de' ? de : en)[key]
}

// Alle Texte einer Sprache, z. B. für den Startbildschirm (ohne Angabe die Sprache des Systems)
export function allTexts(lang: 'de' | 'en' = language()): Record<TextKey, string> {
  return lang === 'de' ? de : en
}
