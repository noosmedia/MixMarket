// Ablauf der Firmensuche: Zugänge laden, Ort bestimmen, Kosten schätzen,
// Quelle abfragen, Verzeichnisse aussortieren und Firmen speichern.
// Gefundene Firmen werden sofort je Treffer gesichert, damit ein Abbruch
// nichts verliert, was schon gefunden wurde.
import { prisma } from '../../db/prisma.js'
import { logger } from '../../utils/logger.js'
import { decryptSecret } from '../../utils/secrets.js'
import { findBranch } from './branches.js'
import { SYSTEM, logActivity } from '../activity.service.js'
import {
  PROVIDERS,
  geocodeOnline,
  isJunk,
  type DiscoveryQuery,
  type FoundBusiness,
  type ProviderCredentials,
  type ProviderKey,
} from './providers.js'

// Eingaben für eine neue Suche (aus dem Formular)
export interface SearchInput {
  provider: ProviderKey
  branchKey?: string | null
  term?: string | null
  location: string
  radiusKm: number
  depth: number
  maxResults: number
}

// Lesbarer Name einer Suche für das Aktivitätsprotokoll: "Begriff · Ort"
export function searchLabel(search: { term: string; location: string }): string {
  return `${search.term} · ${search.location}`
}

// Einstellungen lesen (Singleton anlegen, falls noch nicht vorhanden)
export async function loadSettings() {
  return (
    (await prisma.settings.findUnique({ where: { id: 'singleton' } })) ??
    (await prisma.settings.create({ data: { id: 'singleton' } }))
  )
}

// Zugangsdaten entschlüsselt laden
export async function loadCredentials(): Promise<ProviderCredentials> {
  const s = await loadSettings()
  return {
    dataforseoLogin: s.dataforseoLogin || null,
    dataforseoPassword: decryptSecret(s.dataforseoPasswordEnc),
    dataforseoSandbox: s.dataforseoSandbox,
    serperApiKey: decryptSecret(s.serperApiKeyEnc),
  }
}

// Ort in Koordinaten umwandeln, mit dauerhaftem Zwischenspeicher
export async function geocode(place: string): Promise<{ lat: number; lon: number } | null> {
  const key = place.trim().toLowerCase()
  if (!key) return null
  const cached = await prisma.geoCache.findUnique({ where: { query: key } })
  if (cached) return cached.lat !== null && cached.lon !== null ? { lat: cached.lat, lon: cached.lon } : null
  const point = await geocodeOnline(place.trim())
  await prisma.geoCache.create({ data: { query: key, lat: point?.lat ?? null, lon: point?.lon ?? null } })
  return point
}

// Suchauftrag aus den Eingaben zusammensetzen (ohne Koordinaten)
export function buildQuery(input: SearchInput): DiscoveryQuery {
  const branch = findBranch(input.branchKey)
  return {
    term: (branch?.term ?? input.term ?? '').trim(),
    location: input.location.trim(),
    lat: null,
    lon: null,
    radiusKm: input.radiusKm,
    depth: input.depth,
    maxResults: input.maxResults,
    osmTags: branch?.osm ?? [],
    googleCategories: branch?.google ?? [],
  }
}

// Geschätzte Kosten in US-Dollar, bevor irgendetwas abgefragt wird
export function estimateCost(input: SearchInput): number {
  return PROVIDERS[input.provider].estimate(buildQuery(input))
}

// Firma anlegen oder vorhandene wiederfinden (über Domain, sonst Anbieter-Kennung)
async function upsertCompany(biz: FoundBusiness, provider: ProviderKey): Promise<{ id: string; isNew: boolean }> {
  const existing =
    (biz.domain ? await prisma.company.findUnique({ where: { domain: biz.domain } }) : null) ??
    (biz.externalId ? await prisma.company.findUnique({ where: { externalId: biz.externalId } }) : null)

  if (existing) {
    // Fehlende Angaben aus dem neuen Treffer ergänzen, Vorhandenes nicht überschreiben
    const fill: Record<string, unknown> = {}
    const fields = ['website', 'phone', 'email', 'street', 'postalCode', 'city', 'country', 'category'] as const
    for (const f of fields) if (!existing[f] && biz[f]) fill[f] = biz[f]
    if (existing.lat === null && biz.lat !== null) Object.assign(fill, { lat: biz.lat, lon: biz.lon })
    if (existing.rating === null && biz.rating !== null) Object.assign(fill, { rating: biz.rating, reviewCount: biz.reviewCount })
    if (existing.isClaimed === null && biz.isClaimed !== null) fill.isClaimed = biz.isClaimed
    if (!existing.domain && biz.domain) fill.domain = biz.domain
    if (!existing.externalId && biz.externalId) fill.externalId = biz.externalId
    if (Object.keys(fill).length > 0) {
      try {
        await prisma.company.update({ where: { id: existing.id }, data: fill })
      } catch (error) {
        // Domain oder Kennung gehört schon zu einem anderen Eintrag: Ergänzung auslassen
        logger.debug('Firma konnte nicht ergänzt werden', error)
      }
    }
    return { id: existing.id, isNew: false }
  }

  const created = await prisma.company.create({
    data: {
      name: biz.name,
      domain: biz.domain || null,
      externalId: biz.externalId || null,
      website: biz.website || null,
      phone: biz.phone || null,
      email: biz.email || null,
      street: biz.street || null,
      postalCode: biz.postalCode || null,
      city: biz.city || null,
      country: biz.country || null,
      category: biz.category || null,
      lat: biz.lat,
      lon: biz.lon,
      rating: biz.rating,
      reviewCount: biz.reviewCount,
      isClaimed: biz.isClaimed,
      hasWebsite: biz.hasWebsite,
      source: provider,
      sourceUrl: biz.sourceUrl || null,
    },
  })
  return { id: created.id, isNew: true }
}

// Suche im Hintergrund ausführen und Ergebnis in der Datenbank festhalten
export async function runSearch(searchId: string): Promise<void> {
  const search = await prisma.discoverySearch.findUnique({ where: { id: searchId } })
  if (!search) return
  const provider = PROVIDERS[search.provider as ProviderKey]
  await prisma.discoverySearch.update({ where: { id: searchId }, data: { status: 'running', error: null } })

  try {
    // Quelle aus MixMarket Pro, aber Pro ist nicht (mehr) aktiv
    if (!provider) throw new Error('Diese Quelle gehört zu MixMarket Pro')
    const credentials = await loadCredentials()
    if (!provider.configured(credentials)) throw new Error('Für diese Quelle ist kein Zugang eingetragen')

    const query = buildQuery({
      provider: search.provider as ProviderKey,
      branchKey: search.branchKey,
      term: search.term,
      location: search.location,
      radiusKm: search.radiusKm,
      depth: search.depth,
      maxResults: search.maxResults,
    })

    // Branchen-Quellen brauchen Koordinaten statt eines Ortsnamens
    if (provider.needsCoordinates) {
      const point = await geocode(search.location)
      if (!point) throw new Error(`Der Ort "${search.location}" wurde nicht gefunden`)
      query.lat = point.lat
      query.lon = point.lon
      await prisma.discoverySearch.update({ where: { id: searchId }, data: { lat: point.lat, lon: point.lon } })
    }

    const result = await provider.fetch(query, credentials)
    let junk = 0
    let created = 0
    let known = 0
    const seen = new Set<string>()

    for (const biz of result.items) {
      if (isJunk(biz.domain, biz.name)) {
        junk++
        continue
      }
      const identity = biz.domain || biz.externalId
      if (!identity || seen.has(identity)) continue
      seen.add(identity)

      const { id, isNew } = await upsertCompany(biz, provider.key)
      if (isNew) created++
      else known++
      await prisma.companyFind.upsert({
        where: { searchId_companyId: { searchId, companyId: id } },
        update: { rank: biz.rank },
        create: { searchId, companyId: id, rank: biz.rank },
      })
    }

    await prisma.discoverySearch.update({
      where: { id: searchId },
      data: {
        status: 'done',
        actualCost: result.cost,
        foundCount: result.items.length,
        junkCount: junk,
        newCount: created,
        knownCount: known,
        error: result.note ?? null,
        finishedAt: new Date(),
      },
    })
    logger.info(`Firmensuche ${provider.key} "${search.term} ${search.location}": ${created} neu, ${known} bekannt, ${junk} aussortiert`)
    void logActivity(SYSTEM, {
      area: 'research',
      action: 'search.finished',
      entityType: 'search',
      entityId: searchId,
      label: searchLabel(search),
      params: { found: result.items.length, created, known },
      ...(result.note ? { details: { note: result.note } } : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    await prisma.discoverySearch.update({
      where: { id: searchId },
      data: { status: 'error', error: message, finishedAt: new Date() },
    })
    logger.error(`Firmensuche ${search.provider} abgebrochen`, message)
    void logActivity(SYSTEM, {
      area: 'research',
      action: 'search.failed',
      level: 'error',
      entityType: 'search',
      entityId: searchId,
      label: searchLabel(search),
      details: { error: message },
    })
  }
}
