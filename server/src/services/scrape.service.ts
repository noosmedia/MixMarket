// Web-Scraping für strukturierte Daten. Nutzt fetch für einfache Seiten
// und faellt bei JavaScript-lastigen Seiten auf Playwright zurück.
// Bewusst getrennt vom Versand. Dient der Recherche, nicht dem Massen-Harvesting.
import * as cheerio from 'cheerio'
import { prisma } from '../db/prisma.js'
import { logger } from '../utils/logger.js'
import { SYSTEM, logActivity } from './activity.service.js'
import { assertPublicUrl, fetchPublicText, isBlockedAddress } from '../utils/safe-fetch.js'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

// Konfiguration eines Scraping-Auftrags
export interface ScrapeConfig {
  urls: string[]
  // Bei "structured": Feldname -> CSS-Selektor
  selectors?: Record<string, string>
  // Bei "contacts": nach E-Mail-Adressen suchen
  extractEmails?: boolean
  // Optionaler Begriff, der auf der Seite vorkommen muss (Sachgebiet-Filter)
  mustContain?: string
  useBrowser?: boolean
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

const USER_AGENT = 'MixMarketBot/0.17'
const MAX_BYTES = 1_500_000

// Prüft im Browser jede Anfrage: nur öffentliche http- und https-Ziele
async function browserTargetAllowed(raw: string): Promise<boolean> {
  try {
    const url = new URL(raw)
    if (url.protocol === 'data:' || url.protocol === 'blob:') return true
    assertPublicUrl(url)
    const host = url.hostname.replace(/^\[|\]$/g, '')
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
    return addresses.length > 0 && !addresses.some((a) => isBlockedAddress(a.address))
  } catch {
    return false
  }
}

// Browser starten: zuerst der von Playwright geladene Chromium (npx playwright install chromium), sonst ein
// vorhandenes Google Chrome oder Microsoft Edge. So geht der Browser-Modus auch im installierten Programm,
// in dem es den Playwright-Chromium nicht gibt (unter Windows ist Edge immer vorhanden).
async function launchBrowser() {
  const { chromium } = await import('playwright')
  const attempts: Array<{ channel?: string }> = [{}, { channel: 'chrome' }, { channel: 'msedge' }]
  for (const attempt of attempts) {
    try {
      return await chromium.launch({ headless: true, ...attempt })
    } catch {
      // nächsten Browser versuchen
    }
  }
  throw new Error(
    'Für "Browser verwenden" wird Google Chrome oder Microsoft Edge auf diesem Rechner gebraucht. Ohne diese Option liest MixMarket die Seite direkt.',
  )
}

// HTML einer Seite holen. Normal über den gesicherten Abrufer (kein Zugriff aufs eigene Netz, Größe begrenzt);
// den Browser gibt es nur, wenn der Auftrag ihn ausdrücklich verlangt, und auch dort wird jede Anfrage geprüft.
async function fetchHtml(url: string, useBrowser?: boolean): Promise<string> {
  if (!useBrowser) {
    const page = await fetchPublicText(url, { maxBytes: MAX_BYTES, timeoutMs: 15000, headers: { 'User-Agent': USER_AGENT } })
    return new TextDecoder('utf-8').decode(page.bytes)
  }
  if (!(await browserTargetAllowed(url))) throw new Error('Interne oder ungültige Adresse')
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage({ userAgent: USER_AGENT })
    await page.route('**/*', async (route) => {
      if (await browserTargetAllowed(route.request().url())) await route.continue()
      else await route.abort('blockedbyclient')
    })
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
    return (await page.content()).slice(0, MAX_BYTES)
  } finally {
    await browser.close()
  }
}

// Einen einzelnen URL verarbeiten
async function processUrl(url: string, config: ScrapeConfig): Promise<Record<string, unknown>[]> {
  const html = await fetchHtml(url, config.useBrowser)
  const $ = cheerio.load(html)
  const pageText = $('body').text()

  // Sachgebiet-Filter: Seite überspringen, wenn Begriff fehlt
  if (config.mustContain && !pageText.toLowerCase().includes(config.mustContain.toLowerCase())) {
    return []
  }

  const results: Record<string, unknown>[] = []

  // E-Mail-Extraktion (z. B. Impressum/Kontakt von Firmenseiten)
  if (config.extractEmails) {
    const found = new Set<string>()
    // Aus mailto-Links
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') ?? ''
      const mail = href.replace('mailto:', '').split('?')[0].trim()
      if (mail) found.add(mail.toLowerCase())
    })
    // Aus dem sichtbaren Text
    const matches = html.match(EMAIL_REGEX) ?? []
    for (const m of matches) {
      // Offensichtliche Asset-Dateien ausschließen
      if (!/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(m)) found.add(m.toLowerCase())
    }
    const company = $('title').text().trim() || new URL(url).hostname
    for (const email of found) {
      results.push({ email, company, sourceUrl: url })
    }
  }

  // Strukturierte Extraktion über Selektoren
  if (config.selectors && Object.keys(config.selectors).length > 0) {
    const row: Record<string, unknown> = { sourceUrl: url }
    for (const [field, selector] of Object.entries(config.selectors)) {
      row[field] = $(selector).first().text().trim()
    }
    results.push(row)
  }

  return results
}

// Vollständigen Auftrag ausführen (im Hintergrund)
export async function runScrapeJob(jobId: string): Promise<void> {
  const job = await prisma.scrapeJob.findUnique({ where: { id: jobId } })
  if (!job) return

  await prisma.scrapeJob.update({ where: { id: jobId }, data: { status: 'running', error: null } })
  const config = job.config as unknown as ScrapeConfig

  let count = 0
  try {
    for (const url of config.urls) {
      try {
        const rows = await processUrl(url, config)
        for (const data of rows) {
          await prisma.scrapeResult.create({
            data: { jobId, data: data as object, sourceUrl: url },
          })
          count++
        }
      } catch (error) {
        logger.warn(`Scraping von ${url} fehlgeschlagen`, error)
      }
    }
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: { status: 'done', resultCount: count },
    })
    logger.info(`Scraping-Auftrag "${job.name}" fertig: ${count} Ergebnisse`)
    void logActivity(SYSTEM, {
      area: 'research',
      action: 'scrapeJob.finished',
      entityType: 'scrapeJob',
      entityId: jobId,
      label: job.name,
      params: { count },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    await prisma.scrapeJob.update({ where: { id: jobId }, data: { status: 'error', error: message } })
    logger.error(`Scraping-Auftrag "${job.name}" abgebrochen`, message)
    void logActivity(SYSTEM, {
      area: 'research',
      action: 'scrapeJob.failed',
      level: 'error',
      entityType: 'scrapeJob',
      entityId: jobId,
      label: job.name,
      details: { error: message },
    })
  }
}
