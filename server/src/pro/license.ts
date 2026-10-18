// MixMarket Pro freischalten.
// Der Lizenzschlüssel liegt verschlüsselt in den Einstellungen. Beim Start und alle sechs Stunden holt
// MixMarket beim Lizenzserver eine signierte Freigabe (höchstens 24 Stunden gültig) und lädt damit das
// signierte Pro-Paket. Beides wird mit dem eingebauten öffentlichen Schlüssel geprüft, das Paket liegt nur
// im Arbeitsspeicher. Ist der Lizenzserver nicht erreichbar, läuft Pro höchstens bis zum Ende der Freigabe
// weiter. Ist das Abo abgelaufen oder der Schlüssel ungültig, schaltet Pro sofort ab.
import type { FastifyInstance } from 'fastify'
import { createPublicKey, randomUUID, verify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { SYSTEM, logActivity, userActor } from '../services/activity.service.js'
import { env } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { decryptSecret, encryptSecret } from '../utils/secrets.js'
import { proCore } from './api.js'
import { activatePro, deactivatePro, isProActive, type ProFeature } from './host.js'
import { LICENSE_PUBLIC_KEY } from './public-key.js'

// Regelmäßiger Abgleich und schnellere Wiederholung nach einem Fehlschlag
const REFRESH_MS = 6 * 60 * 60 * 1000
const RETRY_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 15_000
const BUNDLE_FILES = ['manifest.json', 'server.mjs', 'web.js'] as const

// Eigene Version (package.json im Hauptordner; gleicher Pfad in src/ und dist/)
const CORE_VERSION = (() => {
  try {
    const file = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'package.json')
    return (JSON.parse(readFileSync(file, 'utf8')) as { version?: string }).version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
})()

const publicKey = createPublicKey(LICENSE_PUBLIC_KEY)

// ---------------------------------------------------------------------------
// Zustand der Lizenz
// ---------------------------------------------------------------------------

// none: kein Schlüssel; unavailable: kein Lizenzserver eingetragen; active: Pro läuft;
// offline: Lizenzserver nicht erreichbar, Pro aus; invalid: Schlüssel unbekannt; expired: Abo abgelaufen;
// installations: Schlüssel läuft schon auf zu vielen Installationen; outdated: Pro passt nicht zu dieser
// MixMarket-Version; error: Freigabe oder Paket ließen sich nicht prüfen
export type LicenseStatus = 'none' | 'unavailable' | 'active' | 'offline' | 'invalid' | 'expired' | 'installations' | 'outdated' | 'error'

interface LicenseInfo {
  status: LicenseStatus
  plan: 'monthly' | 'yearly' | null
  // Ende des bezahlten Zeitraums laut Lizenzserver
  periodEnd: string | null
  // Abo gekündigt: endet zu periodEnd und verlängert sich nicht mehr
  cancelAtPeriodEnd: boolean
  // Ende der aktuellen Freigabe: so lange läuft Pro auch ohne Verbindung
  validUntil: string | null
  // Lizenzserver beim letzten Versuch nicht erreichbar (Pro läuft dann noch bis validUntil)
  offline: boolean
  keyHint: string | null
  proVersion: string | null
  // Meldung des Lizenzservers oder der Prüfung (für Fehlerfälle)
  message: string | null
  checkedAt: string | null
}

const info: LicenseInfo = {
  status: 'none',
  plan: null,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  validUntil: null,
  offline: false,
  keyHint: null,
  proVersion: null,
  message: null,
  checkedAt: null,
}

// Pro wurde über die Lizenz geladen (nicht im Entwicklungsmodus über MIXMARKET_PRO_DIR)
let licensed = false
let loadedVersion: string | null = null
let validUntilMs = 0
let lastAttempt = 0
let lastFailed = false
// Abgleiche laufen nacheinander, nie gleichzeitig
let chain: Promise<void> = Promise.resolve()
let busy = false

function devMode(): boolean {
  return !!process.env.MIXMARKET_PRO_DIR
}

// ---------------------------------------------------------------------------
// Hilfen
// ---------------------------------------------------------------------------

// Schreibweise vereinheitlichen wie auf dem Lizenzserver (Kleinbuchstaben, Leerzeichen, verwechselbare Zeichen)
export function normalizeKey(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1')
  if (!raw.startsWith('MMPR0') || raw.length !== 25) return null
  const rest = raw.slice(5)
  return `MMPRO-${rest.slice(0, 5)}-${rest.slice(5, 10)}-${rest.slice(10, 15)}-${rest.slice(15, 20)}`
}

function majorMinor(version: string): string {
  return /^(\d+)\.(\d+)/.exec(version)?.slice(1, 3).join('.') ?? ''
}

function signatureOk(data: Buffer | string, signature: string | null): boolean {
  if (!signature) return false
  try {
    return verify(null, Buffer.isBuffer(data) ? data : Buffer.from(data), publicKey, Buffer.from(signature, 'base64url'))
  } catch {
    return false
  }
}

interface TokenPayload {
  lic: string
  inst: string
  features: ProFeature[]
  version: string
  iat: number
  exp: number
}

// Freigabe prüfen: echt signiert, für diese Installation, noch gültig
function readToken(token: string, installationId: string): TokenPayload | null {
  const [body, signature] = token.split('.')
  if (!body || !signature || !signatureOk(body, signature)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload
    if (payload.inst !== installationId || !(payload.exp > Date.now()) || !Array.isArray(payload.features)) return null
    return payload
  } catch {
    return null
  }
}

class OfflineError extends Error {}

// Anfrage an den Lizenzserver; Netzwerkfehler und Störungen des Servers gelten als "nicht erreichbar"
async function licenseRequest(path: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<Response> {
  try {
    const response = await fetch(`${env.licenseServerUrl}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'User-Agent': `MixMarket/${CORE_VERSION}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (response.status >= 500 || response.status === 429) throw new OfflineError(`Lizenzserver antwortet mit ${response.status}`)
    return response
  } catch (error) {
    if (error instanceof OfflineError) throw error
    throw new OfflineError(error instanceof Error ? error.message : String(error))
  }
}

// Schlüssel und Installationskennung aus den Einstellungen (Kennung beim ersten Mal anlegen)
async function stored(): Promise<{ key: string | null; installationId: string }> {
  const settings =
    (await prisma.settings.findUnique({ where: { id: 'singleton' } })) ?? (await prisma.settings.create({ data: { id: 'singleton' } }))
  let installationId = settings.proInstallationId
  if (!installationId) {
    installationId = randomUUID()
    await prisma.settings.update({ where: { id: 'singleton' }, data: { proInstallationId: installationId } })
  }
  return { key: decryptSecret(settings.proLicenseKeyEnc), installationId }
}

// Pro-Paket holen und jede Datei auf Echtheit prüfen
async function fetchBundle(token: string, payload: TokenPayload) {
  const files: Record<string, string> = {}
  for (const file of BUNDLE_FILES) {
    const response = await licenseRequest(`/api/bundle/${file}`, { token })
    if (!response.ok) throw new Error(`Pro-Paket ${file}: ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (!signatureOk(bytes, response.headers.get('x-mixmarket-signature'))) throw new Error(`Pro-Paket ${file} ist nicht echt signiert`)
    files[file] = bytes.toString('utf8')
  }
  const manifest = JSON.parse(files['manifest.json'] as string) as { version: string; features: ProFeature[] }
  if (manifest.version !== payload.version) throw new Error('Pro-Paket passt nicht zur Freigabe')
  return { version: manifest.version, features: manifest.features, serverCode: files['server.mjs'] as string, webCode: files['web.js'] ?? null }
}

function switchOff(): void {
  if (licensed) {
    deactivatePro()
    licensed = false
    loadedVersion = null
  }
  validUntilMs = 0
  info.validUntil = null
  info.proVersion = null
  info.offline = false
}

function setResult(status: LicenseStatus, message: string | null = null): void {
  // Schaltet Pro von selbst ab (Abo abgelaufen, keine Verbindung), im Protokoll festhalten
  if (info.status === 'active' && status !== 'active' && status !== 'none') {
    void logActivity(SYSTEM, { area: 'settings', action: 'settings.proOff', level: 'warning', params: { reason: `pro_${status}` } })
  }
  info.status = status
  info.message = message
  info.checkedAt = new Date().toISOString()
}

// Lizenzserver nicht erreichbar: Pro läuft bis zum Ende der Freigabe weiter, danach aus
function handleOffline(error: unknown): void {
  lastFailed = true
  logger.warn(`MixMarket Pro: Lizenzserver nicht erreichbar (${error instanceof Error ? error.message : String(error)})`)
  if (licensed && validUntilMs > Date.now()) {
    info.offline = true
    info.checkedAt = new Date().toISOString()
    return
  }
  switchOff()
  setResult('offline')
}

// ---------------------------------------------------------------------------
// Abgleich mit dem Lizenzserver
// ---------------------------------------------------------------------------

async function runCheck(): Promise<void> {
  lastAttempt = Date.now()
  lastFailed = false
  if (devMode()) return
  if (!env.licenseServerUrl) {
    switchOff()
    setResult('unavailable')
    return
  }
  const { key, installationId } = await stored()
  info.keyHint = key ? key.slice(-5) : null
  if (!key) {
    switchOff()
    info.plan = null
    info.periodEnd = null
    info.cancelAtPeriodEnd = false
    setResult('none')
    return
  }

  let response: Response
  try {
    response = await licenseRequest('/api/activate', { method: 'POST', body: { key, installationId, appVersion: CORE_VERSION } })
  } catch (error) {
    handleOffline(error)
    return
  }
  const body = (await response.json().catch(() => null)) as
    | { ok: true; token: string; plan: 'monthly' | 'yearly'; periodEnd: string; cancelAtPeriodEnd?: boolean }
    | { ok: false; code?: string; error?: string }
    | null

  // Abgelehnt: ungültiger Schlüssel, Abo abgelaufen oder zu viele Installationen
  if (!response.ok || !body || !body.ok) {
    const code = body && !body.ok ? body.code : undefined
    const message = body && !body.ok ? (body.error ?? null) : null
    switchOff()
    if (code === 'expired') setResult('expired', message)
    else if (code === 'installations') setResult('installations', message)
    else if (code === 'invalid' || response.status === 404) setResult('invalid', message)
    else setResult('error', message ?? `Lizenzserver antwortet mit ${response.status}`)
    return
  }

  const payload = readToken(body.token, installationId)
  if (!payload) {
    switchOff()
    setResult('error', 'Die Freigabe des Lizenzservers ist nicht echt signiert.')
    return
  }
  info.plan = body.plan
  info.periodEnd = body.periodEnd
  info.cancelAtPeriodEnd = body.cancelAtPeriodEnd === true

  // Pro wird für eine bestimmte MixMarket-Version gebaut
  if (majorMinor(payload.version) !== majorMinor(CORE_VERSION)) {
    switchOff()
    setResult('outdated', `MixMarket ${CORE_VERSION}, Pro ${payload.version}`)
    return
  }

  // Paket nur laden, wenn Pro noch nicht läuft oder eine neue Version bereitsteht
  if (!licensed || !isProActive() || loadedVersion !== payload.version) {
    try {
      const bundle = await fetchBundle(body.token, payload)
      await activatePro(bundle, proCore)
      licensed = true
      loadedVersion = payload.version
    } catch (error) {
      if (error instanceof OfflineError) {
        handleOffline(error)
        return
      }
      logger.error('MixMarket Pro: Paket konnte nicht geladen werden', error)
      switchOff()
      setResult('error', error instanceof Error ? error.message : String(error))
      return
    }
  }

  validUntilMs = payload.exp
  info.validUntil = new Date(payload.exp).toISOString()
  info.proVersion = payload.version
  info.offline = false
  setResult('active')
}

// Abgleich anstellen; läuft schon einer, kommt dieser danach dran (z. B. mit einem neu eingetragenen Schlüssel)
export function checkLicense(): Promise<void> {
  chain = chain.then(async () => {
    busy = true
    try {
      await runCheck()
    } catch (error) {
      logger.error('MixMarket Pro: Abgleich fehlgeschlagen', error)
      lastFailed = true
      switchOff()
      setResult('error', error instanceof Error ? error.message : String(error))
    } finally {
      busy = false
    }
  })
  return chain
}

// Beim Start: Abgleich und danach jede Minute prüfen, ob ein neuer fällig ist oder die Freigabe abläuft
export async function startLicense(): Promise<void> {
  await checkLicense()
  setInterval(() => {
    if (licensed && validUntilMs && validUntilMs <= Date.now()) {
      logger.warn('MixMarket Pro: Freigabe abgelaufen, Pro wird abgeschaltet')
      switchOff()
      setResult('offline')
    }
    if (!busy && Date.now() - lastAttempt >= (lastFailed || info.status === 'offline' ? RETRY_MS : REFRESH_MS)) void checkLicense()
  }, 60_000).unref()
}

export function licenseInfo() {
  return { ...info, configured: !!env.licenseServerUrl, devMode: devMode(), coreVersion: CORE_VERSION }
}

// ---------------------------------------------------------------------------
// Routen für den Bereich "MixMarket Pro" in den Einstellungen
// ---------------------------------------------------------------------------

let plansCache: { at: number; value: unknown } | null = null

export function registerLicenseRoutes(app: FastifyInstance): void {
  const unreachable = { error: 'Der Lizenzserver ist gerade nicht erreichbar. Bitte später erneut versuchen.', code: 'offline' }

  app.get('/api/pro/license', { preHandler: requireAuth }, async () => licenseInfo())

  // Schlüssel eintragen und sofort freischalten
  app.post('/api/pro/license', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = z.object({ key: z.string().max(100) }).safeParse(request.body)
    const key = parsed.success ? normalizeKey(parsed.data.key) : null
    if (!key) return reply.code(400).send({ error: 'Das ist kein gültiger Schlüssel für MixMarket Pro.', code: 'format' })
    if (!env.licenseServerUrl) return reply.code(409).send({ error: 'In dieser Installation ist kein Lizenzserver eingetragen.', code: 'unavailable' })
    await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: { proLicenseKeyEnc: encryptSecret(key) },
      create: { id: 'singleton', proLicenseKeyEnc: encryptSecret(key) },
    })
    await checkLicense()
    // Unbekannte Schlüssel nicht aufheben
    if (info.status === 'invalid') {
      await prisma.settings.update({ where: { id: 'singleton' }, data: { proLicenseKeyEnc: null } })
      info.keyHint = null
    }
    void logActivity(
      userActor(request),
      info.status === 'active'
        ? { area: 'settings', action: 'settings.proActivated' }
        : { area: 'settings', action: 'settings.proFailed', level: 'warning', params: { reason: `pro_${info.status}` } },
    )
    return licenseInfo()
  })

  // Jetzt erneut prüfen (z. B. nach einer Verlängerung oder wenn das Internet wieder da ist)
  app.post('/api/pro/license/check', { preHandler: requireAuth }, async () => {
    await checkLicense()
    return licenseInfo()
  })

  // Schlüssel entfernen: Pro aus, Installation beim Lizenzserver abmelden (Platz für einen anderen Rechner)
  app.delete('/api/pro/license', { preHandler: requireAuth }, async (request) => {
    const { key, installationId } = await stored()
    if (key && env.licenseServerUrl) {
      await licenseRequest('/api/deactivate', { method: 'POST', body: { key, installationId } }).catch((error) =>
        logger.warn(`MixMarket Pro: Abmelden beim Lizenzserver nicht möglich (${error instanceof Error ? error.message : String(error)})`),
      )
    }
    await prisma.settings.update({ where: { id: 'singleton' }, data: { proLicenseKeyEnc: null } })
    await checkLicense()
    void logActivity(userActor(request), { area: 'settings', action: 'settings.proRemoved' })
    return licenseInfo()
  })

  // Preise für Monat und Jahr (eine Stunde zwischengespeichert)
  app.get('/api/pro/license/plans', { preHandler: requireAuth }, async (_request, reply) => {
    if (!env.licenseServerUrl) return reply.code(409).send({ error: 'Kein Lizenzserver eingetragen', code: 'unavailable' })
    if (plansCache && Date.now() - plansCache.at < 60 * 60 * 1000) return plansCache.value
    try {
      const response = await licenseRequest('/api/plans')
      if (!response.ok) return reply.code(502).send(unreachable)
      const value = await response.json()
      plansCache = { at: Date.now(), value }
      return value
    } catch {
      return reply.code(502).send(unreachable)
    }
  })

  // Kasse öffnen: liefert die Adresse der Stripe-Kasse
  app.post('/api/pro/license/checkout', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = z.object({ plan: z.enum(['monthly', 'yearly']), lang: z.enum(['de', 'en']).optional() }).safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Eingabe' })
    if (!env.licenseServerUrl) return reply.code(409).send({ error: 'Kein Lizenzserver eingetragen', code: 'unavailable' })
    try {
      const response = await licenseRequest('/api/checkout', { method: 'POST', body: { plan: parsed.data.plan, lang: parsed.data.lang ?? 'de' } })
      const body = (await response.json().catch(() => null)) as { url?: string } | null
      if (!response.ok || !body?.url || !/^https:\/\//.test(body.url)) return reply.code(502).send(unreachable)
      return { url: body.url }
    } catch {
      return reply.code(502).send(unreachable)
    }
  })

  // Kundenportal öffnen (kündigen, Zahlungsart ändern, Rechnungen)
  app.post('/api/pro/license/portal', { preHandler: requireAuth }, async (_request, reply) => {
    const { key } = await stored()
    if (!key) return reply.code(409).send({ error: 'Es ist kein Schlüssel eingetragen.', code: 'none' })
    try {
      const response = await licenseRequest('/api/portal', { method: 'POST', body: { key } })
      const body = (await response.json().catch(() => null)) as { url?: string; error?: string } | null
      if (response.status === 404) return reply.code(404).send({ error: body?.error ?? 'Dieser Schlüssel ist nicht gültig.', code: 'invalid' })
      if (!response.ok || !body?.url || !/^https:\/\//.test(body.url)) return reply.code(502).send(unreachable)
      return { url: body.url }
    } catch {
      return reply.code(502).send(unreachable)
    }
  })
}
