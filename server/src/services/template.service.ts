// Ersetzt Platzhalter wie {{firstName}} im Vorlagentext durch Kontaktdaten.
import type { Contact } from '../generated/prisma/client.js'

// Zusätzliche Angaben, die nicht am Kontakt hängen (z. B. Ansatzpunkt der KI je Produkt)
export interface RenderContext {
  ansatz?: string | null
  // Sprache der Vorlage: bestimmt die Briefanrede {{anrede}}
  language?: 'de' | 'en'
  // Ziel ist HTML: eingesetzte Werte werden maskiert, damit fremde Angaben (z. B. ein Firmenname aus
  // einer Webseite) keine Links oder Formulare in die Mail einschleusen
  html?: boolean
}

function escapeHtmlValue(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Briefanrede aus Anrede, Titel und Name in der Sprache der Vorlage. Ist das Geschlecht unbekannt,
// aber der Name bekannt, die neutrale Form mit vollem Namen; ohne Namen die allgemeine Anrede.
export function salutationLine(contact: Contact, language: 'de' | 'en' = 'de'): string {
  const lastName = contact.lastName?.trim()
  const title = contact.academicTitle?.trim()
  const name = [title, lastName].filter(Boolean).join(' ')
  const fullName = [title, contact.firstName?.trim(), lastName].filter(Boolean).join(' ')
  if (language === 'en') {
    // Im Englischen ersetzt ein Titel Mr bzw. Ms: "Dear Dr. Smith"
    if (lastName && title) return `Dear ${name}`
    if (lastName && contact.salutation === 'herr') return `Dear Mr ${name}`
    if (lastName && contact.salutation === 'frau') return `Dear Ms ${name}`
    if (lastName) return `Dear ${fullName}`
    return 'Dear Sir or Madam'
  }
  if (lastName && contact.salutation === 'herr') return `Sehr geehrter Herr ${name}`
  if (lastName && contact.salutation === 'frau') return `Sehr geehrte Frau ${name}`
  if (lastName) return `Guten Tag ${fullName}`
  return 'Sehr geehrte Damen und Herren'
}

// Erlaubte Platzhalter und ihre Quelle
const FIELDS: Record<string, (c: Contact, ctx: RenderContext) => string> = {
  firstName: (c) => c.firstName ?? '',
  lastName: (c) => c.lastName ?? '',
  email: (c) => c.email,
  company: (c) => c.company ?? '',
  position: (c) => c.position ?? '',
  country: (c) => c.country ?? '',
  sector: (c) => c.sector ?? '',
  anrede: (c, ctx) => salutationLine(c, ctx.language),
  ansatz: (_c, ctx) => ctx.ansatz ?? '',
}

// Platzhalter im Text durch echte Werte ersetzen.
// Unbekannte Platzhalter bleiben unverändert stehen.
export function renderTemplate(text: string, contact: Contact, ctx: RenderContext = {}): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const resolver = FIELDS[key]
    if (!resolver) return match
    const value = resolver(contact, ctx)
    // Im Betreff (reiner Text) keine Zeilenumbrüche zulassen
    return ctx.html ? escapeHtmlValue(value) : value.replace(/[\r\n]+/g, ' ')
  })
}

// Kommt ein Platzhalter im Text vor?
export function usesPlaceholder(text: string | null | undefined, key: string): boolean {
  return !!text && new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`).test(text)
}

// Liste der verfügbaren Platzhalter (für die UI)
export function availablePlaceholders(): string[] {
  return Object.keys(FIELDS)
}
