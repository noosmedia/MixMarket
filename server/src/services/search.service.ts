// Volltextsuche über alle Bereiche von MixMarket.
// Groß- und Kleinschreibung, Umlaute, Leer- und Sonderzeichen spielen keine Rolle:
// "Muster Firma" findet "MusterFirma", "mueller" findet "Müller".
// Jeder Treffer nennt Bereich, Feld und einen Textauszug mit der Fundstelle.
import { prisma } from '../db/prisma.js'
import { NO_HOOK } from './prospects.service.js'

export const SEARCH_AREAS = [
  'contacts',
  'companies',
  'prospects',
  'outbox',
  'inbox',
  'products',
  'lists',
  'templates',
  'campaigns',
  'automations',
  'cohorts',
  'searches',
  'scrapeJobs',
  'suppression',
] as const
export type SearchArea = (typeof SEARCH_AREAS)[number]

// Feld eines Datensatzes, das durchsucht wird; label ist ein Schlüssel für die Oberfläche
interface Field {
  label: string
  // Zusatz zum Feldnamen, z. B. das Produkt bei einer KI-Bewertung
  detail?: string
  text: string | null | undefined
}

export interface SearchHit {
  id: string
  title: string
  subtitle: string | null
  field: string
  fieldDetail: string | null
  snippet: { before: string; match: string; after: string } | null
  // Zusatzangaben für den Sprung zum Eintrag (z. B. Produkt eines Interessenten)
  productId?: string
}

export interface SearchGroup {
  area: SearchArea
  total: number
  items: SearchHit[]
}

// Text vereinheitlichen und je Zeichen merken, woher es im Original stammt
function fold(text: string): { value: string; map: number[] } {
  let value = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const lower = text[i]!.toLowerCase()
    let out: string
    if (lower === 'ä') out = 'ae'
    else if (lower === 'ö') out = 'oe'
    else if (lower === 'ü') out = 'ue'
    else if (lower === 'ß') out = 'ss'
    else out = lower.normalize('NFD').replace(/[^a-z0-9]/g, '')
    for (const ch of out) {
      value += ch
      map.push(i)
    }
  }
  return { value, map }
}

// Suchbegriff vorbereiten: einmal als zusammenhängende Zeichenkette, einmal als einzelne Wörter
function prepare(query: string): { compact: string; tokens: string[] } {
  const tokens = query
    .split(/\s+/)
    .map((w) => fold(w).value)
    .filter((w) => w.length > 0)
  return { compact: tokens.join(''), tokens }
}

// HTML-Vorlagen ohne Auszeichnung durchsuchen, sonst träfe "div" jede Vorlage
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// Textauszug rund um die Fundstelle, höchstens etwa 120 Zeichen
function snippetOf(text: string, start: number, end: number): SearchHit['snippet'] {
  const flat = text.replace(/\s+/g, ' ')
  // Positionen nach dem Zusammenziehen der Leerzeichen neu bestimmen
  const before = text.slice(0, start).replace(/\s+/g, ' ')
  const match = text.slice(start, end).replace(/\s+/g, ' ')
  const s = before.length
  const e = s + match.length
  const from = Math.max(0, s - 50)
  const to = Math.min(flat.length, e + 60)
  return {
    before: (from > 0 ? '…' : '') + flat.slice(from, s).trimStart(),
    match: flat.slice(s, e),
    after: flat.slice(e, to).trimEnd() + (to < flat.length ? '…' : ''),
  }
}

// Einen Datensatz prüfen: zuerst der ganze Begriff in einem Feld, sonst alle Wörter verteilt über die Felder
function matchRecord(
  fields: Field[],
  q: { compact: string; tokens: string[] },
): { field: Field; snippet: SearchHit['snippet']; rank: number } | null {
  const folded = fields
    .map((f, index) => ({ f, index }))
    .filter(({ f }) => f.text && f.text.trim())
    .map(({ f, index }) => ({ f, index, text: f.text as string, ...fold(f.text as string) }))

  // Rang: Treffer in vorderen Feldern (Name, E-Mail) zählen mehr als im Fließtext
  for (const x of folded) {
    const pos = x.value.indexOf(q.compact)
    if (pos >= 0) {
      const start = x.map[pos]!
      const end = x.map[pos + q.compact.length - 1]! + 1
      return { field: x.f, snippet: snippetOf(x.text, start, end), rank: x.index }
    }
  }
  if (q.tokens.length < 2) return null
  // Mehrere Wörter: jedes muss in irgendeinem Feld vorkommen (z. B. Name und Ort)
  let first: { field: Field; snippet: SearchHit['snippet']; rank: number } | null = null
  for (const token of q.tokens) {
    const x = folded.find((y) => y.value.includes(token))
    if (!x) return null
    if (!first) {
      const pos = x.value.indexOf(token)
      const snippet = snippetOf(x.text, x.map[pos]!, x.map[pos + token.length - 1]! + 1)
      // Verteilte Wörter liegen hinter Treffern des ganzen Begriffs
      first = { field: x.f, snippet, rank: 100 + x.index }
    }
  }
  return first
}

interface Candidate {
  id: string
  title: string
  subtitle: string | null
  fields: Field[]
  productId?: string
}

// Treffer eines Bereichs sammeln
function collect(
  area: SearchArea,
  rows: Candidate[],
  q: ReturnType<typeof prepare>,
  limit: number,
): SearchGroup & { bestRank: number } {
  const hits: Array<SearchHit & { rank: number }> = []
  for (const row of rows) {
    const m = matchRecord(row.fields, q)
    if (!m) continue
    hits.push({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      field: m.field.label,
      fieldDetail: m.field.detail ?? null,
      snippet: m.snippet,
      rank: m.rank,
      ...(row.productId ? { productId: row.productId } : {}),
    })
  }
  // Bessere Treffer zuerst, die ursprüngliche Reihenfolge bleibt innerhalb eines Rangs erhalten
  hits.sort((a, b) => a.rank - b.rank)
  const items = hits.slice(0, limit).map(({ rank: _rank, ...hit }) => hit)
  return { area, total: hits.length, items, bestRank: hits[0]?.rank ?? Infinity }
}

function joinParts(...parts: Array<string | null | undefined>): string | null {
  const text = parts.filter((p) => p && p.trim()).join(' · ')
  return text || null
}

// Datensätze eines Bereichs laden und in durchsuchbare Felder zerlegen
async function candidates(area: SearchArea): Promise<Candidate[]> {
  switch (area) {
    case 'contacts': {
      const rows = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } })
      return rows.map((c) => {
        const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
        return {
          id: c.id,
          title: name || c.email,
          subtitle: joinParts(name ? c.email : null, c.company),
          fields: [
            { label: 'name', text: name },
            { label: 'email', text: c.email },
            { label: 'company', text: c.company },
            { label: 'position', text: c.position },
            { label: 'sector', text: c.sector },
            { label: 'website', text: c.website },
            { label: 'country', text: c.country },
            { label: 'notes', text: c.notes },
          ],
        }
      })
    }
    case 'companies': {
      const rows = await prisma.company.findMany({
        orderBy: { name: 'asc' },
        include: {
          people: { select: { fullName: true, role: true } },
          scores: { select: { reason: true, hook: true, product: { select: { name: true } } } },
        },
      })
      return rows.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: joinParts(c.city, c.website?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')),
        fields: [
          { label: 'name', text: c.name },
          { label: 'website', text: c.website },
          { label: 'email', text: c.email },
          { label: 'phone', text: c.phone },
          { label: 'address', text: joinParts(c.street, [c.postalCode, c.city].filter(Boolean).join(' ')) },
          { label: 'category', text: c.category && !/^[a-z_]+$/.test(c.category) ? c.category : null },
          ...c.people.map((p) => ({ label: 'person', text: joinParts(p.fullName, p.role) })),
          ...c.scores.flatMap((s) => [
            { label: 'hook', detail: s.product.name, text: s.hook === NO_HOOK ? null : s.hook },
            { label: 'reason', detail: s.product.name, text: s.reason },
          ]),
          { label: 'website_text', text: c.profileText },
        ],
      }))
    }
    case 'prospects': {
      const rows = await prisma.prospect.findMany({
        include: { company: { select: { name: true, city: true } }, product: { select: { name: true } } },
      })
      return rows.map((p) => ({
        id: p.id,
        title: p.company.name,
        subtitle: joinParts(p.product.name, p.company.city),
        productId: p.productId,
        fields: [
          { label: 'company', text: p.company.name },
          { label: 'person', text: p.personName },
          { label: 'notes', text: p.notes },
        ],
      }))
    }
    case 'outbox': {
      // Mails des Postausgangs: Betreff, Text und Empfänger
      const rows = await prisma.outboxMessage.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { prospect: { select: { company: { select: { name: true } } } } },
      })
      return rows.map((m) => ({
        id: m.id,
        title: m.prospect.company.name,
        subtitle: m.subject || null,
        fields: [
          { label: 'company', text: m.prospect.company.name },
          { label: 'subject', text: m.subject },
          { label: 'email', text: m.toEmail },
          { label: 'body', text: m.body },
        ],
      }))
    }
    case 'inbox': {
      // Eingegangene Antworten: Absender, Betreff und Text
      const rows = await prisma.inboxMessage.findMany({ orderBy: { receivedAt: 'desc' }, include: { contact: { select: { company: true } } } })
      return rows.map((m) => ({
        id: m.id,
        title: m.contact?.company || m.fromName || m.fromEmail,
        subtitle: m.subject || null,
        fields: [
          { label: 'name', text: m.fromName },
          { label: 'email', text: m.fromEmail },
          { label: 'subject', text: m.subject },
          { label: 'body', text: m.text },
        ],
      }))
    }
    case 'products': {
      const rows = await prisma.product.findMany({ orderBy: { name: 'asc' } })
      return rows.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.website,
        fields: [
          { label: 'name', text: p.name },
          { label: 'website', text: p.website },
          { label: 'description', text: p.description },
          { label: 'idealCustomer', text: p.idealCustomer },
        ],
      }))
    }
    case 'lists': {
      const rows = await prisma.list.findMany({ orderBy: { createdAt: 'desc' } })
      return rows.map((l) => ({
        id: l.id,
        title: l.name,
        subtitle: l.description,
        fields: [
          { label: 'name', text: l.name },
          { label: 'description', text: l.description },
        ],
      }))
    }
    case 'templates': {
      const rows = await prisma.template.findMany({ orderBy: { updatedAt: 'desc' } })
      return rows.map((tpl) => ({
        id: tpl.id,
        title: tpl.name,
        subtitle: tpl.subject,
        fields: [
          { label: 'name', text: tpl.name },
          { label: 'subject', text: tpl.subject },
          { label: 'body', text: stripHtml(tpl.htmlBody) },
          { label: 'textBody', text: tpl.textBody },
        ],
      }))
    }
    case 'campaigns': {
      const rows = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } })
      return rows.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.subject,
        fields: [
          { label: 'name', text: c.name },
          { label: 'subject', text: c.subject },
          { label: 'sender', text: joinParts(c.fromName, c.fromEmail) },
        ],
      }))
    }
    case 'automations': {
      const rows = await prisma.automation.findMany({ orderBy: { createdAt: 'desc' } })
      return rows.map((a) => ({
        id: a.id,
        title: a.name,
        subtitle: a.subject,
        fields: [
          { label: 'name', text: a.name },
          { label: 'subject', text: a.subject },
          { label: 'sender', text: joinParts(a.fromName, a.fromEmail) },
        ],
      }))
    }
    case 'cohorts': {
      const rows = await prisma.cohort.findMany({ include: { product: { select: { name: true } } } })
      return rows.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.product?.name ?? null,
        ...(c.productId ? { productId: c.productId } : {}),
        fields: [
          { label: 'name', text: c.name },
          { label: 'description', text: c.description },
        ],
      }))
    }
    case 'searches': {
      const rows = await prisma.discoverySearch.findMany({ orderBy: { createdAt: 'desc' } })
      return rows.map((s) => ({
        id: s.id,
        title: `${s.term} · ${s.location}`,
        subtitle: null,
        fields: [
          { label: 'term', text: s.term },
          { label: 'location', text: s.location },
        ],
      }))
    }
    case 'scrapeJobs': {
      const rows = await prisma.scrapeJob.findMany({ orderBy: { createdAt: 'desc' } })
      return rows.map((j) => ({
        id: j.id,
        title: j.name,
        subtitle: null,
        fields: [{ label: 'name', text: j.name }],
      }))
    }
    case 'suppression': {
      const rows = await prisma.suppression.findMany({ orderBy: { createdAt: 'desc' } })
      return rows.map((s) => ({
        id: s.id,
        title: s.email,
        subtitle: s.note,
        fields: [
          { label: 'email', text: s.email },
          { label: 'notes', text: s.note },
        ],
      }))
    }
  }
}

// Suche ausführen: alle Bereiche oder nur einer, je Bereich höchstens "limit" Treffer
export async function searchAll(query: string, area: SearchArea | null, limit: number): Promise<SearchGroup[]> {
  const q = prepare(query)
  if (q.compact.length < 2) return []
  const areas = area ? [area] : [...SEARCH_AREAS]
  const groups = await Promise.all(areas.map(async (a) => collect(a, await candidates(a), q, limit)))
  // Bereiche mit Treffern im Namen zuerst, sonst feste Reihenfolge der Bereiche
  return groups
    .filter((g) => g.total > 0)
    .sort((a, b) => Math.min(a.bestRank, 1) - Math.min(b.bestRank, 1))
    .map(({ bestRank: _bestRank, ...group }) => group)
}
