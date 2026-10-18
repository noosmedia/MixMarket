// Firmen durchleuchten: öffentliche Seiten einer Firmenwebseite laden
// (Startseite, Impressum, Kontakt, Karriere, Team, robots.txt, Sitemap) und
// daraus Merkmale und Ansprechpartner gewinnen. Kostet nichts, kein KI-Aufruf.
//
// Rücksicht und Sicherheit:
// - robots.txt wird beachtet, gesperrte Seiten werden nicht geladen
// - höchstens 14 Abrufe je Firma, nacheinander, mit kurzer Pause
// - Adressen im eigenen Netz (localhost, 192.168.x.x usw.) werden nie aufgerufen; geprüft wird die
//   tatsächlich verbundene IP beim Verbindungsaufbau (utils/safe-fetch.ts), auch nach Weiterleitungen
import { prisma } from '../../db/prisma.js'
import { safeFetch } from '../../utils/safe-fetch.js'
import { logger } from '../../utils/logger.js'
import { SYSTEM, logActivity } from '../activity.service.js'
import { searchLabel } from './discovery.service.js'
import {
  detectAgency,
  detectTech,
  extractCopyrightYear,
  extractEmails,
  extractImpressumPeople,
  extractJobs,
  extractLeadPerson,
  extractLegalForm,
  extractLinks,
  extractPhone,
  extractProfileText,
  extractRegister,
  extractSocial,
  extractTeamPeople,
  extractVatId,
  findPageLink,
  hasContactForm,
  hasSchemaMarkup,
  hasViewport,
  htmlToLines,
  parseSitemap,
  type FoundPerson,
  type PageLink,
} from './extract.js'
import { extractDepartments, extractLocations, extractStatedEmployees, lowerBoundFromHints } from './size.js'

const USER_AGENT = 'Mozilla/5.0 (compatible; MixMarket/0.17)'
const ROBOTS_AGENT = 'mixmarket'
const PAGE_TIMEOUT_MS = 12000
const MAX_BYTES = 1_500_000
const MAX_REQUESTS = 14

// --- Seiten laden ---

interface FetchedPage {
  url: string // Adresse nach allen Weiterleitungen
  status: number
  html: string
}

// Zeichensatz aus Kopfzeile oder Meta-Angabe bestimmen (wichtig für Umlaute)
function decodeBody(bytes: Uint8Array, contentType: string): string {
  const fromHeader = contentType.match(/charset=["']?([\w-]+)/i)?.[1]
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 4096))
  const fromMeta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
  const charset = (fromHeader || fromMeta || 'utf-8').toLowerCase()
  try {
    return new TextDecoder(charset === 'iso-8859-1' ? 'windows-1252' : charset).decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

export class PageFetcher {
  requests = 0
  private robots: { allow: string[]; disallow: string[] } | null = null
  blocked: string[] = []

  // Eine Seite laden: Weiterleitungen einzeln prüfen, Größe begrenzen
  async get(rawUrl: string, accept = 'text/html,application/xhtml+xml'): Promise<FetchedPage | null> {
    if (this.requests >= MAX_REQUESTS) return null
    let url = new URL(rawUrl)
    for (let hop = 0; hop < 5; hop++) {
      this.requests++
      // Prüft Schema, Port und die tatsächlich verbundene IP; Weiterleitungen werden hier einzeln verfolgt
      const res = await safeFetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: accept, 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.5' },
        signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      })
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        url = new URL(res.headers.get('location') as string, url)
        await res.body?.cancel()
        continue
      }
      const contentType = res.headers.get('content-type') ?? ''
      if (!res.ok || !/html|xml|text/i.test(contentType)) {
        await res.body?.cancel()
        return { url: url.toString(), status: res.status, html: '' }
      }
      // Körper bis zur Obergrenze lesen
      const reader = res.body?.getReader()
      const chunks: Uint8Array[] = []
      let size = 0
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        size += value.length
        if (size > MAX_BYTES) {
          await reader.cancel()
          break
        }
      }
      const bytes = new Uint8Array(size > MAX_BYTES ? MAX_BYTES : size)
      let offset = 0
      for (const c of chunks) {
        const part = c.slice(0, Math.max(0, bytes.length - offset))
        bytes.set(part, offset)
        offset += part.length
        if (offset >= bytes.length) break
      }
      return { url: url.toString(), status: res.status, html: decodeBody(bytes, contentType) }
    }
    return null
  }

  // robots.txt einmal laden und die Regeln für "*" bzw. "mixmarket" merken
  async loadRobots(site: string): Promise<void> {
    this.robots = { allow: [], disallow: [] }
    try {
      const page = await this.get(`${site}/robots.txt`, 'text/plain')
      if (!page?.html || page.status !== 200) return
      let applies = false
      let afterRules = false
      for (const raw of page.html.split('\n')) {
        const line = raw.replace(/#.*/, '').trim()
        const m = line.match(/^(user-agent|allow|disallow)\s*:\s*(.*)$/i)
        if (!m) continue
        const key = m[1].toLowerCase()
        const value = m[2].trim()
        if (key === 'user-agent') {
          // Ein User-agent nach Regeln beginnt eine neue Gruppe; direkt
          // aufeinanderfolgende User-agent-Zeilen gehören zur selben Gruppe
          if (afterRules) {
            applies = false
            afterRules = false
          }
          const agent = value.toLowerCase()
          if (agent === '*' || agent.includes(ROBOTS_AGENT)) applies = true
          continue
        }
        afterRules = true
        if (!applies || !value) continue
        if (key === 'allow') this.robots.allow.push(value)
        else this.robots.disallow.push(value)
      }
    } catch (error) {
      logger.debug('robots.txt nicht lesbar', error)
    }
  }

  // Darf diese Seite laut robots.txt geladen werden? Längste passende Regel gewinnt.
  allowed(url: string): boolean {
    if (!this.robots) return true
    const path = new URL(url).pathname
    const match = (rule: string) => {
      const pattern = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')
      return new RegExp(`^${pattern}`).test(path)
    }
    const allow = this.robots.allow.filter(match).sort((a, b) => b.length - a.length)[0] ?? ''
    const disallow = this.robots.disallow.filter(match).sort((a, b) => b.length - a.length)[0] ?? ''
    return !disallow || allow.length >= disallow.length
  }

  // Seite nur laden, wenn robots.txt es erlaubt
  async getAllowed(url: string): Promise<FetchedPage | null> {
    if (!this.allowed(url)) {
      this.blocked.push(new URL(url).pathname)
      return null
    }
    try {
      return await this.get(url)
    } catch (error) {
      logger.debug(`Abruf fehlgeschlagen: ${url}`, error)
      return null
    }
  }
}

// --- Eine Firma durchleuchten ---

interface SignalRow {
  code: string
  valueText?: string | null
  valueNum?: number | null
  confidence?: number
  evidenceUrl?: string | null
}

export interface ProfileOutcome {
  status: 'ok' | 'unreachable' | 'blocked' | 'error'
  error?: string
  signals: SignalRow[]
  people: Array<FoundPerson & { source: 'impressum' | 'team'; evidenceUrl: string }>
  bestEmail: string | null
  phone: string | null
  profileText: string | null
}

// Startseite finden: https und http, mit und ohne www
async function resolveSite(fetcher: PageFetcher, domain: string): Promise<FetchedPage | null> {
  for (const base of [`https://${domain}`, `https://www.${domain}`, `http://${domain}`, `http://www.${domain}`]) {
    try {
      const page = await fetcher.get(base)
      if (page && page.html.length > 200) return page
    } catch (error) {
      if (error instanceof Error && error.message === 'Interne Adresse') throw error
    }
  }
  return null
}

export async function profileWebsite(domain: string, companyName: string): Promise<ProfileOutcome> {
  const fetcher = new PageFetcher()
  const signals: SignalRow[] = []
  const add = (row: SignalRow) => signals.push(row)
  const outcome: ProfileOutcome = { status: 'ok', signals, people: [], bestEmail: null, phone: null, profileText: null }

  let home: FetchedPage | null
  try {
    home = await resolveSite(fetcher, domain)
  } catch (error) {
    return { ...outcome, status: 'error', error: error instanceof Error ? error.message : 'Fehler' }
  }
  if (!home) return { ...outcome, status: 'unreachable', error: 'Webseite nicht erreichbar' }

  const homeUrl = new URL(home.url)
  const site = `${homeUrl.protocol}//${homeUrl.host}`
  const siteHost = homeUrl.hostname.replace(/^www\./, '')
  await fetcher.loadRobots(site)
  if (!fetcher.allowed(home.url)) {
    return { ...outcome, status: 'blocked', error: 'Die Webseite verbietet automatische Abrufe (robots.txt)' }
  }

  const homeLines = htmlToLines(home.html)
  outcome.profileText = extractProfileText(home.html) || null
  const links: PageLink[] = extractLinks(home.html, home.url)
  add({ code: 'HTTPS', valueNum: homeUrl.protocol === 'https:' ? 1 : 0, evidenceUrl: home.url })
  add({ code: 'MOBILE_VIEWPORT', valueNum: hasViewport(home.html) ? 1 : 0, evidenceUrl: home.url })
  add({ code: 'SCHEMA_MARKUP', valueNum: hasSchemaMarkup(home.html) ? 1 : 0, evidenceUrl: home.url })

  // Unterseiten über die Links der Startseite finden, sonst übliche Pfade versuchen
  async function loadPage(kind: 'impressum' | 'kontakt' | 'karriere' | 'team', fallbacks: string[]): Promise<FetchedPage | null> {
    const linked = findPageLink(links, kind, siteHost)
    const candidates = linked ? [linked] : fallbacks.map((p) => `${site}${p}`)
    for (const url of candidates) {
      const page = await fetcher.getAllowed(url)
      if (page && page.status === 200 && page.html.length > 300) return page
    }
    return null
  }

  const impressum = await loadPage('impressum', ['/impressum', '/impressum/', '/impressum.html'])
  const kontakt = await loadPage('kontakt', ['/kontakt', '/kontakt/'])
  const karriere = await loadPage('karriere', ['/karriere', '/jobs'])
  const team = await loadPage('team', [])

  // Technik, Werbung, Buchung (Startseite)
  const tech = detectTech(home.html, homeLines)
  if (tech.cms) add({ code: 'CMS', valueText: tech.cms, evidenceUrl: home.url })
  if (tech.tech.length) add({ code: 'TECH', valueText: tech.tech.join(', '), evidenceUrl: home.url })
  add({ code: 'GOOGLE_ADS', valueNum: tech.googleAds ? 1 : 0, evidenceUrl: home.url })
  add({ code: 'META_PIXEL', valueNum: tech.metaPixel ? 1 : 0, evidenceUrl: home.url })
  const bookingTech = tech.booking ?? (kontakt ? detectTech(kontakt.html, htmlToLines(kontakt.html)).booking : null)
  add({ code: 'ONLINE_BOOKING', valueNum: bookingTech ? 1 : 0, valueText: bookingTech, evidenceUrl: home.url })

  const social = extractSocial(links)
  if (social.length) add({ code: 'SOCIAL', valueText: social.join(', '), evidenceUrl: home.url })
  const year = extractCopyrightYear(homeLines)
  if (year) add({ code: 'COPYRIGHT_YEAR', valueNum: year, valueText: String(year), evidenceUrl: home.url })

  // Kontaktformular auf Kontaktseite oder Startseite
  const formPage = kontakt && hasContactForm(kontakt.html) ? kontakt : hasContactForm(home.html) ? home : null
  add({ code: 'CONTACT_FORM', valueNum: formPage ? 1 : 0, evidenceUrl: formPage?.url ?? null })

  // Impressum: Personen, Rechtsform, Register, USt-IdNr., Telefon
  const impressumLines = impressum ? htmlToLines(impressum.html) : []
  // Agentur: Fußbereich der Startseite, dann Impressum (vor der Rechtsform, damit
  // die Rechtsform eines Dienstleisters nicht der Firma zugeordnet wird)
  const agency = detectAgency(home.html, impressumLines, siteHost, companyName)
  if (agency) {
    add({ code: 'AGENCY', valueText: agency.name, confidence: agency.confidence, evidenceUrl: agency.url ?? impressum?.url ?? home.url })
  }
  if (impressum) {
    add({ code: 'IMPRESSUM', valueText: impressum.url, valueNum: 1, evidenceUrl: impressum.url })
    const text = impressumLines.join('\n')
    for (const person of extractImpressumPeople(impressumLines)) {
      outcome.people.push({ ...person, source: 'impressum', evidenceUrl: impressum.url })
    }
    const legalForm = extractLegalForm(companyName, impressumLines, agency ? [agency.name] : [])
    // Einzelunternehmen ohne Stichwort: Inhaber steht direkt unter dem Firmennamen
    const corporate = /GmbH|UG|AG|eG|KG|OHG|PartG/.test(legalForm ?? '')
    if (!corporate && !outcome.people.some((p) => p.isDecisionMaker)) {
      const lead = extractLeadPerson(impressumLines, companyName)
      if (lead) outcome.people.unshift({ ...lead, source: 'impressum', evidenceUrl: impressum.url })
    }
    if (legalForm) add({ code: 'LEGAL_FORM', valueText: legalForm, evidenceUrl: impressum.url })
    const register = extractRegister(text)
    if (register) add({ code: 'REGISTER', valueText: register, evidenceUrl: impressum.url })
    const vat = extractVatId(text)
    if (vat) add({ code: 'VAT_ID', valueText: vat, evidenceUrl: impressum.url })
    outcome.phone = extractPhone(text)
  } else {
    add({ code: 'IMPRESSUM', valueNum: 0 })
    // Ohne Impressum bleibt die Rechtsform aus dem Firmennamen, z. B. "Muster GmbH"
    const legalForm = extractLegalForm(companyName, [])
    if (legalForm) add({ code: 'LEGAL_FORM', valueText: legalForm })
  }


  // E-Mail-Adressen aus Impressum, Kontakt und Startseite
  const emails = new Map<string, { generic: boolean; url: string }>()
  for (const page of [impressum, kontakt, home]) {
    if (!page) continue
    for (const e of extractEmails(page.html, page === home ? homeLines : htmlToLines(page.html), siteHost)) {
      if (!emails.has(e.email)) emails.set(e.email, { generic: e.generic, url: page.url })
    }
  }
  // Eigene Domain bevorzugen, persönliche Adressen vor Sammeladressen
  const ranked = [...emails.entries()].sort(([a, ea], [b, eb]) => {
    const own = (x: string) => (x.endsWith(`@${siteHost}`) ? 0 : 1)
    return own(a) - own(b) || Number(ea.generic) - Number(eb.generic)
  })
  for (const [email, meta] of ranked.slice(0, 5)) {
    add({ code: 'EMAIL', valueText: email, valueNum: meta.generic ? 0 : 1, evidenceUrl: meta.url })
  }
  outcome.bestEmail = ranked.find(([e]) => e.endsWith(`@${siteHost}`))?.[0] ?? ranked[0]?.[0] ?? null

  // Stellenanzeigen: Karriereseite, sonst Startseite
  if (karriere) add({ code: 'CAREER_PAGE', valueText: karriere.url, valueNum: 1, evidenceUrl: karriere.url })
  const jobs = extractJobs(karriere ? htmlToLines(karriere.html) : homeLines)
  if (jobs.length) add({ code: 'HIRING', valueNum: jobs.length, valueText: jobs.join('; '), evidenceUrl: karriere?.url ?? home.url })

  // Team- und Kontaktseite: weitere Ansprechpartner mit erkennbarer Rolle
  let teamCount = 0
  for (const page of [team, kontakt]) {
    if (!page) continue
    for (const person of extractTeamPeople(page.html)) {
      teamCount++
      const dup = outcome.people.some((p) => p.firstName === person.firstName && p.lastName === person.lastName)
      if (!dup) outcome.people.push({ ...person, source: 'team', evidenceUrl: page.url })
    }
  }

  // Größe der Firma: genannte Mitarbeiterzahl, Abteilungen, Standorte und daraus eine Untergrenze
  const pageLines = [home, impressum, kontakt, team, karriere]
    .filter((p): p is FetchedPage => Boolean(p))
    .map((p) => ({ url: p.url, lines: p === home ? homeLines : p === impressum ? impressumLines : htmlToLines(p.html) }))
  for (const { url, lines } of pageLines) {
    const stated = extractStatedEmployees(lines)
    if (stated && !signals.some((x) => x.code === 'EMPLOYEES_STATED' && (x.valueNum ?? 0) >= stated.count)) {
      const index = signals.findIndex((x) => x.code === 'EMPLOYEES_STATED')
      if (index >= 0) signals.splice(index, 1)
      add({ code: 'EMPLOYEES_STATED', valueNum: stated.count, valueText: stated.text, evidenceUrl: url })
    }
  }
  const contactLines = pageLines.filter((p) => p.url === kontakt?.url || p.url === team?.url).flatMap((p) => p.lines)
  const departments = extractDepartments([...emails.keys()], contactLines)
  if (departments.length) add({ code: 'DEPARTMENTS', valueNum: departments.length, valueText: departments.join(', '), evidenceUrl: kontakt?.url ?? home.url })
  const locations = extractLocations(pageLines.flatMap((p) => p.lines))
  if (locations) add({ code: 'LOCATIONS', valueNum: locations, evidenceUrl: home.url })
  const lowerBound = lowerBoundFromHints({ teamCount, departments: departments.length, jobs: jobs.length, locations })
  if (lowerBound > 0) {
    const basis = [
      teamCount ? `${teamCount} Personen mit Rolle` : null,
      departments.length ? `${departments.length} Abteilungen` : null,
      jobs.length ? `${jobs.length} offene Stellen` : null,
      locations ? `${locations} Standorte` : null,
    ]
      .filter(Boolean)
      .join(', ')
    add({ code: 'SIZE_HINT', valueNum: lowerBound, valueText: basis })
  }

  // Sitemap: Seitenzahl und letzte Änderung
  const sitemapUrl = `${site}/sitemap.xml`
  if (fetcher.allowed(sitemapUrl)) {
    try {
      const sm = await fetcher.get(sitemapUrl, 'application/xml,text/xml')
      if (sm?.html && sm.status === 200) {
        let parsed = parseSitemap(sm.html)
        let pages = parsed.locs.length
        let newest = parsed.newest
        // Bei einem Sitemap-Index höchstens zwei Unterlisten lesen
        for (const child of parsed.childSitemaps.slice(0, 2)) {
          const sub = await fetcher.get(child, 'application/xml,text/xml').catch(() => null)
          if (!sub?.html) continue
          parsed = parseSitemap(sub.html)
          pages += parsed.locs.length
          if (parsed.newest && (!newest || parsed.newest > newest)) newest = parsed.newest
        }
        if (pages) add({ code: 'SITEMAP_PAGES', valueNum: pages, evidenceUrl: sitemapUrl })
        if (newest) {
          const age = Math.floor((Date.now() - new Date(newest).getTime()) / 86_400_000)
          add({ code: 'LAST_UPDATE', valueText: newest, valueNum: age, evidenceUrl: sitemapUrl })
        }
      }
    } catch (error) {
      logger.debug('Sitemap nicht lesbar', error)
    }
  }

  if (fetcher.blocked.length) add({ code: 'ROBOTS_BLOCKED', valueText: fetcher.blocked.join(', ') })
  return outcome
}

// --- Ergebnis speichern ---

export async function profileCompany(companyId: string): Promise<ProfileOutcome['status']> {
  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company?.domain) return 'unreachable'
  let outcome: ProfileOutcome
  try {
    outcome = await profileWebsite(company.domain, company.name)
  } catch (error) {
    outcome = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      signals: [],
      people: [],
      bestEmail: null,
      phone: null,
      profileText: null,
    }
  }

  // Alte Ergebnisse ersetzen, damit ein erneuter Lauf den aktuellen Stand zeigt
  await prisma.$transaction([
    prisma.companySignal.deleteMany({ where: { companyId } }),
    prisma.companyPerson.deleteMany({ where: { companyId } }),
    prisma.companySignal.createMany({
      data: outcome.signals.map((s) => ({
        companyId,
        code: s.code,
        valueText: s.valueText ?? null,
        valueNum: s.valueNum ?? null,
        confidence: s.confidence ?? 1,
        evidenceUrl: s.evidenceUrl ?? null,
      })),
    }),
    prisma.companyPerson.createMany({
      data: outcome.people.map((p) => ({
        companyId,
        fullName: p.fullName,
        academicTitle: p.academicTitle,
        salutation: p.salutation,
        firstName: p.firstName,
        lastName: p.lastName,
        role: p.role || null,
        isDecisionMaker: p.isDecisionMaker,
        source: p.source,
        evidenceUrl: p.evidenceUrl,
      })),
    }),
    prisma.company.update({
      where: { id: companyId },
      data: {
        profileStatus: outcome.status,
        profileError: outcome.error ?? null,
        profiledAt: new Date(),
        profileText: outcome.profileText,
        // Fehlende Kontaktdaten aus der Webseite ergänzen
        ...(company.email ? {} : outcome.bestEmail ? { email: outcome.bestEmail } : {}),
        ...(company.phone ? {} : outcome.phone ? { phone: outcome.phone } : {}),
      },
    }),
  ])
  return outcome.status
}

// Alle Firmen einer Suche mit Webseite nacheinander durchleuchten
export async function profileSearch(searchId: string): Promise<void> {
  const finds = await prisma.companyFind.findMany({
    where: { searchId, company: { domain: { not: null } } },
    select: { companyId: true },
  })
  await prisma.discoverySearch.update({
    where: { id: searchId },
    data: { profileStatus: 'running', profileTotal: finds.length, profileDone: 0, profileError: null },
  })
  let done = 0
  try {
    for (const { companyId } of finds) {
      const status = await profileCompany(companyId)
      done++
      await prisma.discoverySearch.update({ where: { id: searchId }, data: { profileDone: done } })
      logger.debug(`Durchleuchtet ${done}/${finds.length}: ${status}`)
      // Kurze Pause zwischen den Firmen
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 600))
    }
    await prisma.discoverySearch.update({ where: { id: searchId }, data: { profileStatus: 'done' } })
    logger.info(`Durchleuchten der Suche abgeschlossen: ${done} Firmen`)
    const search = await prisma.discoverySearch.findUnique({ where: { id: searchId }, select: { term: true, location: true } })
    void logActivity(SYSTEM, {
      area: 'research',
      action: 'profiling.finished',
      entityType: 'search',
      entityId: searchId,
      label: search ? searchLabel(search) : null,
      params: { done },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    await prisma.discoverySearch.update({ where: { id: searchId }, data: { profileStatus: 'error', profileError: message } })
    logger.error('Durchleuchten abgebrochen', message)
    const search = await prisma.discoverySearch.findUnique({ where: { id: searchId }, select: { term: true, location: true } })
    void logActivity(SYSTEM, {
      area: 'research',
      action: 'profiling.failed',
      level: 'error',
      entityType: 'search',
      entityId: searchId,
      label: search ? searchLabel(search) : null,
      params: { done },
      details: { error: message },
    })
  }
}
