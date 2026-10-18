// Zielgruppen: Firmen über Merkmale auswählen und live zählen.
// Jedes Merkmal liefert ja, nein oder unbekannt. "Muss" verlangt ja, "darf nicht"
// verlangt ein bekanntes Nein. Firmen, bei denen ein Merkmal unbekannt ist (zum
// Beispiel weil sie noch nicht durchleuchtet wurden), fallen bei diesem Merkmal
// heraus, statt stillschweigend mitgezählt zu werden.
import { z } from 'zod'
import { prisma } from '../../db/prisma.js'
import { meetsMinimum } from './size.js'

// --- Filter einer Zielgruppe ---

export const conditionSchema = z.object({
  key: z.string().min(1).max(40),
  value: z.string().max(80).optional().nullable(),
  mode: z.enum(['must', 'mustNot']),
})

export const filterSchema = z.object({
  // Produkt, dessen KI-Bewertungen gezeigt und gefiltert werden
  productId: z.string().max(40).optional().nullable(),
  searchIds: z.array(z.string()).max(200).default([]),
  conditions: z.array(conditionSchema).max(40).default([]),
})

export type CohortFilter = z.infer<typeof filterSchema>

// --- Fakten einer Firma, aus denen die Merkmale berechnet werden ---

type CompanyWithData = Awaited<ReturnType<typeof loadCompanies>>[number]

interface Facts {
  profiled: boolean
  num: (code: string) => number | null
  text: (code: string) => string | null
  has: (code: string) => boolean
  company: CompanyWithData
  bestRank: number | null
  // Bewertung für das gewählte Produkt und KI-Größenschätzung aus beliebiger Bewertung
  productScore: CompanyWithData['scores'][number] | null
  kiSizeClass: string | null
}

type Tri = boolean | null

interface ConditionDef {
  key: string
  group: 'contact' | 'website' | 'company' | 'search' | 'ai'
  param?: 'cms' | 'legalForm' | 'score' | 'size'
  // Ja/nein/unbekannt, bei Merkmalen mit Auswahlwert der gefundene Wert
  evaluate: (f: Facts) => Tri | string
}

// Merkmal aus der Webseite: nur bekannt, wenn die Firma durchleuchtet wurde
const fromProfile = (fn: (f: Facts) => Tri | string) => (f: Facts) => (f.profiled ? fn(f) : null)

export const CONDITIONS: ConditionDef[] = [
  // Kontakt
  { key: 'HAS_WEBSITE', group: 'contact', evaluate: (f) => Boolean(f.company.website) },
  { key: 'HAS_EMAIL', group: 'contact', evaluate: (f) => Boolean(f.company.email) || f.has('EMAIL') },
  {
    key: 'HAS_PERSONAL_EMAIL',
    group: 'contact',
    evaluate: fromProfile((f) => f.company.signals.some((s) => s.code === 'EMAIL' && s.valueNum === 1)),
  },
  { key: 'HAS_PHONE', group: 'contact', evaluate: (f) => Boolean(f.company.phone) },
  { key: 'HAS_DECISION_MAKER', group: 'contact', evaluate: fromProfile((f) => f.company.people.some((p) => p.isDecisionMaker)) },
  { key: 'HAS_CONTACT_FORM', group: 'contact', evaluate: fromProfile((f) => f.num('CONTACT_FORM') === 1) },
  // Webseite
  { key: 'GOOGLE_ADS', group: 'website', evaluate: fromProfile((f) => f.num('GOOGLE_ADS') === 1) },
  { key: 'META_PIXEL', group: 'website', evaluate: fromProfile((f) => f.num('META_PIXEL') === 1) },
  { key: 'ONLINE_BOOKING', group: 'website', evaluate: fromProfile((f) => f.num('ONLINE_BOOKING') === 1) },
  { key: 'MOBILE', group: 'website', evaluate: fromProfile((f) => f.num('MOBILE_VIEWPORT') === 1) },
  { key: 'HTTPS', group: 'website', evaluate: fromProfile((f) => f.num('HTTPS') === 1) },
  { key: 'SCHEMA', group: 'website', evaluate: fromProfile((f) => f.num('SCHEMA_MARKUP') === 1) },
  { key: 'SOCIAL', group: 'website', evaluate: fromProfile((f) => f.has('SOCIAL')) },
  { key: 'AGENCY', group: 'website', evaluate: fromProfile((f) => f.has('AGENCY')) },
  {
    key: 'OLD_SITE',
    group: 'website',
    evaluate: fromProfile((f) => {
      const year = f.num('COPYRIGHT_YEAR')
      return year === null ? null : year < new Date().getFullYear() - 2
    }),
  },
  {
    key: 'STALE_CONTENT',
    group: 'website',
    evaluate: fromProfile((f) => {
      const age = f.num('LAST_UPDATE')
      return age === null ? null : age > 365
    }),
  },
  {
    key: 'CMS_IS',
    group: 'website',
    param: 'cms',
    evaluate: fromProfile((f) => {
      const cms = f.text('CMS')
      return cms ? cms : false
    }),
  },
  // Unternehmen
  { key: 'HIRING', group: 'company', evaluate: fromProfile((f) => (f.num('HIRING') ?? 0) > 0) },
  {
    key: 'LEGAL_FORM_IS',
    group: 'company',
    param: 'legalForm',
    evaluate: fromProfile((f) => f.text('LEGAL_FORM')),
  },
  // Suche und Google-Profil
  {
    key: 'RANK_11_30',
    group: 'search',
    evaluate: (f) => (f.bestRank === null ? null : f.bestRank >= 11 && f.bestRank <= 30),
  },
  { key: 'RANK_TOP_10', group: 'search', evaluate: (f) => (f.bestRank === null ? null : f.bestRank <= 10) },
  { key: 'GOOD_RATING', group: 'search', evaluate: (f) => (f.company.rating === null ? null : f.company.rating >= 4) },
  { key: 'FEW_REVIEWS', group: 'search', evaluate: (f) => (f.company.reviewCount === null ? null : f.company.reviewCount < 10) },
  { key: 'UNCLAIMED', group: 'search', evaluate: (f) => (f.company.isClaimed === null ? null : !f.company.isClaimed) },
  // KI-Bewertung: Passung mindestens X (unbekannt, solange nicht bewertet)
  { key: 'AI_SCORE_MIN', group: 'ai', param: 'score', evaluate: (f) => (f.productScore ? String(f.productScore.score) : null) },
  // Geschätzte Größe: genannte Zahl, sonst KI-Schätzung, sonst Untergrenze aus Hinweisen
  { key: 'SIZE_MIN', group: 'company', param: 'size', evaluate: () => null },
]

// Merkmale mit Auswahlwert (System, Rechtsform) liefern den Wert statt ja/nein
function evaluateCondition(def: ConditionDef, facts: Facts, value?: string | null): Tri {
  const raw = def.evaluate(facts)
  if (!def.param) return typeof raw === 'string' ? true : raw
  // Mindestwert der KI-Passung (Standard 7)
  if (def.param === 'score') return raw === null || raw === false ? null : Number(raw) >= Number(value || 7)
  // Mindestgröße in Mitarbeitern (Standard 20)
  if (def.param === 'size') {
    return meetsMinimum(Number(value || 20), {
      stated: facts.num('EMPLOYEES_STATED'),
      kiClass: facts.kiSizeClass,
      lowerBound: facts.num('SIZE_HINT'),
    })
  }
  if (raw === null || raw === undefined) return null
  if (raw === false) return value ? false : null
  return value ? String(raw).toLowerCase() === value.toLowerCase() : true
}

// --- Daten laden ---

async function loadCompanies(searchIds: string[]) {
  return prisma.company.findMany({
    where: searchIds.length ? { finds: { some: { searchId: { in: searchIds } } } } : {},
    include: {
      signals: true,
      people: { orderBy: [{ isDecisionMaker: 'desc' }, { source: 'asc' }, { createdAt: 'asc' }] },
      finds: true,
      // Nur die Bewertung des gewählten Produkts (ohne Produkt keine)
      // Alle Bewertungen: die des gewählten Produkts für Passung, alle für die Größenschätzung
      scores: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { name: 'asc' },
  })
}

function buildFacts(company: CompanyWithData, searchIds: string[], productId: string | null): Facts {
  const signal = (code: string) => company.signals.find((s) => s.code === code)
  const ranks = company.finds
    .filter((fd) => !searchIds.length || searchIds.includes(fd.searchId))
    .map((fd) => fd.rank)
    .filter((r): r is number => r !== null)
  return {
    profiled: company.profileStatus === 'ok',
    num: (code) => signal(code)?.valueNum ?? null,
    text: (code) => signal(code)?.valueText ?? null,
    has: (code) => Boolean(signal(code)),
    company,
    bestRank: ranks.length ? Math.min(...ranks) : null,
    productScore: company.scores.find((sc) => sc.productId === productId) ?? null,
    kiSizeClass: company.scores.find((sc) => sc.sizeClass && sc.sizeClass !== 'unbekannt')?.sizeClass ?? null,
  }
}

// --- Auswertung ---

export interface CohortResult {
  total: number // Firmen im gewählten Umfang
  count: number // davon passend
  stats: Record<string, { yes: number; no: number; unknown: number }>
  options: { cms: Array<{ value: string; count: number }>; legalForm: Array<{ value: string; count: number }> }
  items: Array<CompanyWithData & { rank: number | null; score: CompanyWithData['scores'][number] | null; sizeClass: string | null }>
}

export async function evaluateCohort(filter: CohortFilter, limit = 200): Promise<CohortResult> {
  const companies = await loadCompanies(filter.searchIds)
  const facts = companies.map((c) => buildFacts(c, filter.searchIds, filter.productId ?? null))
  const defs = new Map(CONDITIONS.map((d) => [d.key, d]))

  // Verteilung je Merkmal im gewählten Umfang (Hilfe beim Zusammenstellen)
  const stats: CohortResult['stats'] = {}
  for (const def of CONDITIONS) {
    if (def.param) continue
    const s = { yes: 0, no: 0, unknown: 0 }
    for (const f of facts) {
      const v = def.evaluate(f)
      if (v === true) s.yes++
      else if (v === false) s.no++
      else s.unknown++
    }
    stats[def.key] = s
  }

  // Auswahlwerte für System und Rechtsform mit Häufigkeit
  const tally = (code: string) => {
    const counts = new Map<string, number>()
    for (const f of facts) {
      const v = f.profiled ? f.text(code) : null
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
    }
    return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)
  }

  // Filter anwenden: unbekannte Merkmale zählen nie als passend
  const matches = facts.filter((f) =>
    filter.conditions.every((cond) => {
      const def = defs.get(cond.key)
      if (!def) return true
      const v = evaluateCondition(def, f, cond.value)
      return cond.mode === 'must' ? v === true : v === false
    }),
  )

  return {
    total: facts.length,
    count: matches.length,
    stats,
    options: { cms: tally('CMS'), legalForm: tally('LEGAL_FORM') },
    // Bewertete Firmen nach Passung zuerst, danach alphabetisch
    items: [...matches]
      .sort((a, b) => (b.productScore?.score ?? 0) - (a.productScore?.score ?? 0) || a.company.name.localeCompare(b.company.name, 'de'))
      .slice(0, limit)
      .map((f) => ({ ...f.company, rank: f.bestRank, score: f.productScore, sizeClass: f.kiSizeClass })),
  }
}
