// Größe einer Firma (Mitarbeiterzahl) aus Hinweisen auf ihrer Webseite.
// Keine unserer Quellen liefert die echte Zahl. Deshalb drei Stufen:
// 1. ausdrücklich genannt ("über 80 Mitarbeiter") gilt als verlässlich
// 2. Schätzung der KI bei der Bewertung (Größenklasse)
// 3. grobe Untergrenze aus Hinweisen (Abteilungen, Team, Stellen, Standorte)

// Größenklassen der KI mit Unter- und Obergrenze
export const SIZE_CLASSES: Record<string, [number, number]> = {
  '1-5': [1, 5],
  '6-20': [6, 20],
  '21-50': [21, 50],
  '51-250': [51, 250],
  '250+': [251, Number.POSITIVE_INFINITY],
}

// Wörter für Beschäftigte nach einer Zahl
const STAFF_WORDS =
  '(?:engagierte[n]?\\s+|qualifizierte[n]?\\s+|motivierte[n]?\\s+|erfahrene[n]?\\s+|festangestellte[n]?\\s+|kompetente[n]?\\s+)?' +
  '(?:Mitarbeiter(?:innen)?(?:\\s+und\\s+Mitarbeiter(?:innen)?)?|Mitarbeiter\\*innen|Mitarbeitende[n]?|Beschäftigte[n]?|Angestellte[n]?|Fachkräfte[n]?|Kolleginnen\\s+und\\s+Kollegen|Teammitglieder[n]?|Menschen\\s+arbeiten)'

const STATED_PATTERNS = [
  new RegExp(`(\\d{1,3}(?:\\.\\d{3})?|\\d{1,6})\\s*\\+?\\s*${STAFF_WORDS}`, 'giu'),
  /Team\s+(?:aus|von|mit)\s+(?:über\s+|mehr\s+als\s+|rund\s+)?(\d{1,5})/giu,
  /(\d{1,5})\s*-?\s*(?:köpfiges|köpfigen|köpfige)\s+Team/giu,
]

// Ausdrücklich genannte Mitarbeiterzahl (größter plausibler Wert), sonst null
export function extractStatedEmployees(lines: string[]): { count: number; text: string } | null {
  let best: { count: number; text: string } | null = null
  for (const line of lines) {
    if (line.length > 400) continue
    for (const re of STATED_PATTERNS) {
      re.lastIndex = 0
      for (const m of line.matchAll(re)) {
        const raw = m[1].replace(/\./g, '')
        const count = Number(raw)
        // Jahreszahlen und Unsinn ausschließen
        if (!Number.isFinite(count) || count < 2 || count > 200_000) continue
        if (raw.length === 4 && count >= 1900 && count <= 2100) continue
        if (!best || count > best.count) best = { count, text: m[0].replace(/\s+/g, ' ').trim().slice(0, 80) }
      }
    }
  }
  return best
}

// Abteilungen aus E-Mail-Adressen und kurzen Überschriften auf Kontakt- und Teamseiten
const DEPARTMENTS: Array<[string, RegExp]> = [
  ['Buchhaltung', /^(buchhaltung|finanzbuchhaltung|fibu|rechnungswesen|accounting|finanzen|controlling)$/i],
  ['Personal', /^(personal|personalabteilung|hr|human resources|personalwesen)$/i],
  ['Vertrieb', /^(vertrieb|sales|verkauf|innendienst|aussendienst|außendienst)$/i],
  ['Marketing', /^(marketing|presse|kommunikation|pr)$/i],
  ['Einkauf', /^(einkauf|purchasing|beschaffung|disposition)$/i],
  ['Ausbildung', /^(ausbildung|azubi|azubis|nachwuchs)$/i],
  ['Logistik', /^(logistik|versand|lager|spedition)$/i],
  ['Qualität', /^(qualität|qualitaet|qm|qualitätsmanagement|qs)$/i],
  ['IT', /^(it|edv|it-abteilung)$/i],
  ['Technik', /^(technik|konstruktion|entwicklung|engineering|produktion|fertigung|arbeitsvorbereitung)$/i],
  ['Kundendienst', /^(kundendienst|kundenservice|support|reklamation|reklamationen)$/i],
]

export function extractDepartments(emails: string[], lines: string[]): string[] {
  const found = new Set<string>()
  const check = (word: string) => {
    const w = word.trim().toLowerCase().replace(/^abteilung\s+/, '')
    for (const [label, re] of DEPARTMENTS) if (re.test(w)) found.add(label)
  }
  for (const email of emails) check(email.split('@')[0].replace(/[._-]?\d+$/, ''))
  for (const line of lines) if (line.length <= 40) check(line.replace(/[:.]$/, ''))
  return [...found]
}

// Zahl der Standorte, Niederlassungen oder Filialen, falls genannt
export function extractLocations(lines: string[]): number | null {
  let best: number | null = null
  for (const line of lines) {
    for (const m of line.matchAll(/(\d{1,3})\s+(?:Standorte|Niederlassungen|Filialen|Werke|Betriebsstätten)/giu)) {
      const n = Number(m[1])
      if (n >= 2 && n <= 999 && (best === null || n > best)) best = n
    }
  }
  return best
}

// Grobe Untergrenze aus Hinweisen; 0 = keine verwertbaren Hinweise
export function lowerBoundFromHints(h: { teamCount: number; departments: number; jobs: number; locations: number | null }): number {
  return Math.max(
    h.teamCount,
    h.departments >= 5 ? 20 : h.departments >= 3 ? 10 : h.departments >= 2 ? 6 : 0,
    h.jobs >= 6 ? 20 : h.jobs >= 3 ? 10 : 0,
    (h.locations ?? 0) >= 3 ? 50 : (h.locations ?? 0) >= 2 ? 20 : 0,
  )
}

// Ist die Firma mindestens so groß? true / false / null (unbekannt)
export function meetsMinimum(
  minimum: number,
  facts: { stated: number | null; kiClass: string | null; lowerBound: number | null },
): boolean | null {
  if (facts.stated !== null) return facts.stated >= minimum
  const bounds = facts.kiClass ? SIZE_CLASSES[facts.kiClass] : undefined
  if (bounds) {
    if (bounds[0] >= minimum) return true
    if (bounds[1] < minimum) return false
  }
  if (facts.lowerBound !== null && facts.lowerBound >= minimum) return true
  return null
}
