// Suchquellen für die Firmensuche, auf deutsche Firmen zugeschnitten.
//
// Zwei Arten von Quellen:
// - Branchen-Quellen (OpenStreetMap, DataForSEO Business Listings) fragen
//   "welche Betriebe dieser Art gibt es im Umkreis?" und liefern Adresse,
//   Telefon und Webseite.
// - Suchmaschinen-Quellen (DataForSEO SERP, Serper) fragen "wer steht bei
//   Google für <Branche> <Ort> vorne?" und liefern zusätzlich den Rang.
import { logger } from '../../utils/logger.js'

const USER_AGENT = 'MixMarket/0.17 (B2B-Recherche)'
const TIMEOUT_MS = 45000

// --- Gemeinsames Ergebnisformat aller Quellen ---
export interface FoundBusiness {
  name: string
  domain: string
  website: string
  phone: string
  email: string
  street: string
  postalCode: string
  city: string
  country: string
  category: string
  lat: number | null
  lon: number | null
  rating: number | null
  reviewCount: number | null
  isClaimed: boolean | null
  hasWebsite: boolean | null
  rank: number | null
  externalId: string
  sourceUrl: string
}

// Leerer Datensatz als Ausgangspunkt
export function emptyBusiness(): FoundBusiness {
  return {
    name: '', domain: '', website: '', phone: '', email: '', street: '', postalCode: '',
    city: '', country: '', category: '', lat: null, lon: null, rating: null,
    reviewCount: null, isClaimed: null, hasWebsite: null, rank: null, externalId: '', sourceUrl: '',
  }
}

// --- Suchauftrag, wie ihn eine Quelle bekommt ---
export interface DiscoveryQuery {
  term: string // Suchbegriff, z. B. "Dachdecker"
  location: string // Ort, z. B. "Leipzig"
  lat: number | null
  lon: number | null
  radiusKm: number
  depth: number // Anzahl Suchergebnisse bei Suchmaschinen-Quellen
  maxResults: number // Höchstzahl bei Branchen-Quellen
  osmTags: string[]
  googleCategories: string[]
}

// --- Zugangsdaten, entschlüsselt aus den Einstellungen ---
export interface ProviderCredentials {
  dataforseoLogin: string | null
  dataforseoPassword: string | null
  dataforseoSandbox: boolean
  serperApiKey: string | null
}

// Kennung einer Quelle. Der Kern bringt "osm" mit; weitere Quellen meldet MixMarket Pro an
// (z. B. "dataforseo_listings", "dataforseo_serp", "serper")
export type ProviderKey = string

export interface ProviderResult {
  items: FoundBusiness[]
  cost: number // vom Anbieter gemeldete Kosten in US-Dollar
  note?: string // Hinweis für den Nutzer, z. B. Ersatzsuche nach Namen
}

export interface Provider {
  key: ProviderKey
  kind: 'listings' | 'serp'
  needsCoordinates: boolean
  signupUrl: string
  configured(c: ProviderCredentials): boolean
  estimate(q: DiscoveryQuery): number
  fetch(q: DiscoveryQuery, c: ProviderCredentials): Promise<ProviderResult>
}

// --- Hilfsfunktionen ---

// Domain ohne www und in Kleinbuchstaben: dient zum Erkennen doppelter Firmen
export function normalizeDomain(urlOrDomain: string | null | undefined): string {
  if (!urlOrDomain) return ''
  let raw = urlOrDomain.trim().toLowerCase()
  if (!raw.includes('://')) raw = `http://${raw}`
  try {
    const host = new URL(raw).hostname.replace(/\.$/, '')
    return host.startsWith('www.') ? host.slice(4) : host
  } catch {
    return ''
  }
}

// Webseite mit Protokoll versehen, damit Links funktionieren
export function normalizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

// Verzeichnisse, Portale und große Plattformen, die nie ein Ansprechpartner
// sind. Muster statt fester Liste, damit Unterseiten mit erfasst werden.
const JUNK_DOMAIN_PATTERNS = [
  // Deutsche Branchenbücher und Vergleichsportale
  /(^|\.)(gelbeseiten|dasoertliche|dastelefonbuch|11880|meinestadt|golocal|cylex|yelp|wlw|kompass)\./,
  /(^|\.)(werkenntdenbesten|provenexpert|kennstdueinen|trustpilot|trusted|myhammer|check24|aroundhome|blauarbeit)\./,
  /(^|\.)(branchenbuch|firmenwissen|northdata|unternehmensregister|handelsregister|firmenabc|hotfrog|infobel)/,
  /(^|\.)(jameda|doctolib|sanego|anwalt|advocado|steuerberater-suchen|immoscout24|immowelt|mobile|autoscout24)\./,
  /(^|\.)(tripadvisor|booking|hrs|holidaycheck|lieferando|opentable|thefork|treatwell)\./,
  // Soziale Netzwerke, Jobbörsen, Marktplätze
  /(^|\.)(facebook|instagram|twitter|x|linkedin|xing|youtube|tiktok|pinterest)\./,
  /(^|\.)(indeed|stepstone|kununu|glassdoor|arbeitsagentur|ebay|kleinanzeigen|amazon)\./,
  // Nachschlagewerke, Medien und Suchmaschinen
  /(^|\.)(wikipedia|reddit|gutefrage|google|bing|yahoo|duckduckgo|apple|microsoft|t-online|web)\./,
  /(zeitung|nachrichten|news|magazin|kurier|anzeiger|rundschau)\./,
  // Behörden und Institutionen
  /\.(gov|edu|mil)$/,
  /(^|\.)(bund|bayern|nrw|sachsen-anhalt|berlin|hamburg)\.de$/,
  /(^|\.)(hwk-|handwerkskammer|ihk)/,
  // Baukasten-Anbieter selbst
  /(^|\.)(wordpress|wix|jimdo|squarespace|shopify|ionos|strato)\.(com|de)$/,
  // Allgemeine Verzeichnis-Muster
  /(verzeichnis|branchen|firmen-?suche|top\d+|vergleich)/,
]

// Namen, die auf eine Übersichtsseite statt auf einen Betrieb hindeuten
const JUNK_NAME_PATTERNS = [
  /^\s*(die\s+)?(top|beste[nr]?|\d+)\s+.*\b(in|aus|bei|im)\b/i,
  /\b(verzeichnis|branchenbuch|vergleich|bewertungen|finden sie|in ihrer nähe|top \d+)\b/i,
]

// Prüfen, ob ein Treffer aussortiert werden soll
export function isJunk(domain: string, name: string): boolean {
  if (domain) {
    if (JUNK_DOMAIN_PATTERNS.some((p) => p.test(domain))) return true
    if (!domain.includes('.') || /^[\d.]+$/.test(domain)) return true
  }
  if (name && JUNK_NAME_PATTERNS.some((p) => p.test(name))) return true
  return false
}

// Anfrage mit Zeitlimit; Fehlermeldung des Anbieters wird mit ausgegeben
export async function request(url: string, init: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
}

// Antwortkörper als lesbarer Text für Fehlermeldungen: ohne HTML, gekürzt
export async function bodySnippet(res: Response): Promise<string> {
  try {
    const text = (await res.text())
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#*]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text.length > 160 ? `${text.slice(0, 160)}…` : text
  } catch {
    return ''
  }
}

// Anzahl Ergebnisseiten zu je 10 Treffern (Abrechnungseinheit der Suchmaschinen)
export function pages(depth: number): number {
  return Math.max(1, Math.ceil(depth / 10))
}

// --- Quelle 1: OpenStreetMap (kostenlos, ohne Konto) ---

// Mehrere öffentliche Overpass-Server mit gleicher Schnittstelle. Der Hauptserver
// drosselt schnell, deshalb werden die anderen der Reihe nach versucht.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
// Der Server darf laut Anfrage bis zu 60 s rechnen; wir warten etwas länger, sonst brechen wir
// unter Last ab, obwohl die Antwort gleich käme (Hauptserver braucht dann oft 30 bis 50 s)
const OVERPASS_SERVER_TIMEOUT_S = 60
const OVERPASS_WAIT_MS = (OVERPASS_SERVER_TIMEOUT_S + 30) * 1000

const openStreetMap: Provider = {
  key: 'osm',
  kind: 'listings',
  needsCoordinates: true,
  signupUrl: 'https://www.openstreetmap.org',
  configured: () => true,
  estimate: () => 0,
  async fetch(q) {
    if (q.lat === null || q.lon === null) throw new Error('Der Ort konnte nicht gefunden werden')
    if (q.osmTags.length === 0) {
      throw new Error(
        'OpenStreetMap kennt für diesen Suchbegriff keine Branche. Bitte eine Branche aus der Liste wählen oder eine andere Quelle nutzen.',
      )
    }
    const radiusM = Math.round(q.radiusKm * 1000)
    const clauses = q.osmTags
      .map((tag) => {
        const [k, v] = tag.split('=')
        return `nwr["${k}"="${v}"](around:${radiusM},${q.lat},${q.lon});`
      })
      .join('')
    const query = `[out:json][timeout:${OVERPASS_SERVER_TIMEOUT_S}];(${clauses});out center tags ${q.maxResults};`

    // Server der Reihe nach versuchen, danach den Hauptserver ein zweites Mal (er antwortet unter
    // Last oft doch noch, während die Ersatzserver ganz ausfallen); zwischen den Versuchen kurz warten
    const attempts = [...OVERPASS_ENDPOINTS, OVERPASS_ENDPOINTS[0] as string]
    let res: Response | null = null
    for (const [index, endpoint] of attempts.entries()) {
      if (index > 0) await new Promise((r) => setTimeout(r, index === attempts.length - 1 ? 8000 : 4000))
      try {
        res = await request(
          endpoint,
          {
            method: 'POST',
            headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
          },
          OVERPASS_WAIT_MS,
        )
      } catch (error) {
        logger.warn(`Overpass ${endpoint} nicht erreichbar`, error)
        res = null
        continue
      }
      // 429 und alle 5xx-Antworten bedeuten "überlastet oder gestört": nächsten Server versuchen
      if (res.status !== 429 && res.status < 500) break
      logger.warn(`Overpass ${endpoint} drosselt (${res.status}), nächster Server`)
      res = null
    }
    if (!res) {
      throw new Error(
        'OpenStreetMap ist gerade stark ausgelastet und hat nicht rechtzeitig geantwortet. Bitte in ein paar Minuten mit „Erneut suchen“ noch einmal versuchen.',
      )
    }
    if (!res.ok) throw new Error(`OpenStreetMap HTTP ${res.status}: ${await bodySnippet(res)}`)

    const data = (await res.json()) as {
      elements?: Array<{
        type: string
        id: number
        lat?: number
        lon?: number
        center?: { lat: number; lon: number }
        tags?: Record<string, string>
      }>
    }
    const items: FoundBusiness[] = []
    for (const el of data.elements ?? []) {
      const tags = el.tags ?? {}
      if (!tags.name) continue
      const site = tags.website || tags['contact:website'] || tags.url || ''
      items.push({
        ...emptyBusiness(),
        name: tags.name,
        domain: normalizeDomain(site),
        website: normalizeUrl(site),
        phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '',
        email: (tags.email || tags['contact:email'] || '').toLowerCase(),
        street: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' '),
        postalCode: tags['addr:postcode'] || '',
        city: tags['addr:city'] || '',
        country: tags['addr:country'] || '',
        category: tags.craft || tags.shop || tags.office || tags.amenity || tags.healthcare || tags.tourism || tags.leisure || '',
        lat: el.lat ?? el.center?.lat ?? null,
        lon: el.lon ?? el.center?.lon ?? null,
        hasWebsite: Boolean(site),
        externalId: `osm:${el.type}/${el.id}`,
        sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      })
    }
    return { items, cost: 0 }
  },
}

// Verfügbare Quellen. Ohne MixMarket Pro nur OpenStreetMap; Pro meldet die bezahlten Quellen an.
export const PROVIDERS: Record<ProviderKey, Provider> = {
  osm: openStreetMap,
}

export function isProviderKey(value: string): value is ProviderKey {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, value)
}

// Weitere Quelle anmelden bzw. wieder entfernen (MixMarket Pro)
export function registerProvider(provider: Provider): void {
  PROVIDERS[provider.key] = provider
}
export function unregisterProvider(key: ProviderKey): void {
  if (key !== 'osm') delete PROVIDERS[key]
}


// --- Ortsangabe in Koordinaten umwandeln (Nominatim, OpenStreetMap) ---
// Nominatim erlaubt Einzelabfragen mit eigener Kennung und höchstens einer
// Anfrage pro Sekunde. Ergebnisse werden deshalb dauerhaft zwischengespeichert.
let lastGeocode = 0

export async function geocodeOnline(place: string): Promise<{ lat: number; lon: number } | null> {
  const wait = 1100 - (Date.now() - lastGeocode)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastGeocode = Date.now()
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: place,
    format: 'json',
    limit: '1',
    countrycodes: 'de,at,ch',
    'accept-language': 'de',
  })}`
  const res = await request(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Ortssuche HTTP ${res.status}`)
  const hits = (await res.json()) as Array<{ lat: string; lon: string }>
  if (!hits.length) return null
  return { lat: Number(hits[0].lat), lon: Number(hits[0].lon) }
}
