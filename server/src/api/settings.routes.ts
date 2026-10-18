// Routen für globale Einstellungen und das Postfach (Versand per SMTP, Empfang per IMAP).
// Passwörter und andere Geheimnisse werden nie an das Frontend geschickt.
import type { FastifyInstance } from 'fastify'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { DEFAULT_PORTS, isSmtpConfigured, loadSmtpConfig, verifyImap, verifySmtp } from '../services/mailer.service.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'
import { decryptSecret, encryptSecret } from '../utils/secrets.js'
import { env } from '../utils/env.js'

// Einstellungen lesen und den Datensatz bei Bedarf anlegen
async function loadSettings() {
  return (
    (await prisma.settings.findUnique({ where: { id: 'singleton' } })) ??
    prisma.settings.create({ data: { id: 'singleton' } })
  )
}

// Felder des Unternehmensblocks, die gelesen und gespeichert werden dürfen
const companySchema = z.object({
  companyName: z.string().max(200).optional().nullable(),
  postalAddress: z.string().max(1000).optional().nullable(),
  signatureHtml: z.string().max(20000).optional().nullable(),
  unsubFooterDe: z.string().max(2000).optional().nullable(),
  unsubFooterEn: z.string().max(2000).optional().nullable(),
})

// Servername: nur Buchstaben, Ziffern, Punkte und Bindestriche
const host = z
  .string()
  .trim()
  .max(253)
  .regex(/^[a-z0-9.-]*$/i, 'Der Servername darf nur Buchstaben, Ziffern, Punkte und Bindestriche enthalten')
const port = z.number().int().min(1, 'Ungültiger Port').max(65535, 'Ungültiger Port').nullable()
const security = z.enum(['tls', 'starttls'])

const mailboxSchema = z.object({
  smtpHost: host.optional(),
  smtpPort: port.optional(),
  smtpSecurity: security.optional(),
  smtpUser: z.string().trim().max(320).optional(),
  smtpPassword: z.string().max(500).optional(),
  mailFromAddress: z
    .string()
    .trim()
    .max(320)
    .refine((v) => !v || z.string().email().safeParse(v).success, 'Bitte eine gültige Absenderadresse eingeben')
    .optional(),
  mailFromName: z.string().trim().max(120).optional(),
  imapHost: host.optional(),
  imapPort: port.optional(),
  imapSecurity: security.optional(),
  imapSameLogin: z.boolean().optional(),
  imapUser: z.string().trim().max(320).optional(),
  imapPassword: z.string().max(500).optional(),
  imapFolder: z.string().trim().max(200).optional(),
  clearSmtp: z.boolean().optional(),
  clearImap: z.boolean().optional(),
})

// Postfach-Felder, die im Protokoll als Änderung erscheinen (Passwörter nur als "geändert")
const MAILBOX_FIELDS = [
  'smtpHost',
  'smtpPort',
  'smtpSecurity',
  'smtpUser',
  'smtpPasswordEnc',
  'mailFromAddress',
  'mailFromName',
  'imapHost',
  'imapPort',
  'imapSecurity',
  'imapSameLogin',
  'imapUser',
  'imapPasswordEnc',
  'imapFolder',
]

// ---------------------------------------------------------------------------
// Versionsabgleich mit GitHub: Gibt es dort eine neuere Version als diese Installation?
// Gelesen wird nur die öffentliche package.json und das CHANGELOG, es wird nichts übertragen.
// ---------------------------------------------------------------------------

const UPDATE_SOURCE = 'https://raw.githubusercontent.com/noosmedia/MixMarket/main'
const UPDATE_REPO_URL = 'https://github.com/noosmedia/MixMarket'
const UPDATE_TTL_OK_MS = 24 * 60 * 60 * 1000
const UPDATE_TTL_ERROR_MS = 60 * 60 * 1000

// Eigene Version aus der package.json im Hauptordner (gleicher Pfad in src/ und dist/)
const CURRENT_VERSION = (() => {
  try {
    const file = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'package.json')
    return (JSON.parse(readFileSync(file, 'utf8')) as { version?: string }).version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
})()

// Versionsnummer "1.2.3" in Zahlen zerlegen; Zusätze wie "-beta" werden ignoriert
function parseVersion(value: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(value.trim())
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

function compareVersions(a: string, b: string): number {
  const x = parseVersion(a)
  const y = parseVersion(b)
  if (!x || !y) return 0
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return (x[i] as number) - (y[i] as number)
  return 0
}

// Abschnitte des CHANGELOG zwischen eigener und neuester Version (höchstens fünf, gekürzt)
function changelogSince(changelog: string, current: string, latest: string): string {
  const parts = changelog.split(/^(?=## )/m)
  const picked = parts.filter((part) => {
    const head = /^## v?(\d+\.\d+\.\d+)/.exec(part)
    return !!head?.[1] && compareVersions(head[1], current) > 0 && compareVersions(head[1], latest) <= 0
  })
  return picked.slice(0, 5).join('').trim().slice(0, 8000)
}

interface UpdateStatus {
  current: string
  latest: string | null
  available: boolean
  notes: string | null
  checkedAt: string
  // unreachable: GitHub nicht erreichbar oder Repository nicht öffentlich
  error: 'unreachable' | null
  repoUrl: string
}

let updateCache: { at: number; ttl: number; value: UpdateStatus } | null = null

async function fetchText(path: string): Promise<string | null> {
  try {
    const response = await fetch(`${UPDATE_SOURCE}/${path}`, {
      headers: { 'User-Agent': `MixMarket/${CURRENT_VERSION}` },
      signal: AbortSignal.timeout(10_000),
    })
    return response.ok ? await response.text() : null
  } catch {
    return null
  }
}

async function checkForUpdate(force: boolean): Promise<UpdateStatus> {
  if (!force && updateCache && Date.now() - updateCache.at < updateCache.ttl) return updateCache.value
  const base = { current: CURRENT_VERSION, repoUrl: UPDATE_REPO_URL, checkedAt: new Date().toISOString() }
  let value: UpdateStatus
  const pkg = await fetchText('package.json')
  let latest: string | null = null
  try {
    latest = pkg ? ((JSON.parse(pkg) as { version?: string }).version ?? null) : null
  } catch {
    latest = null
  }
  if (!latest || !parseVersion(latest)) {
    value = { ...base, latest: null, available: false, notes: null, error: 'unreachable' }
  } else {
    const available = compareVersions(latest, CURRENT_VERSION) > 0
    const changelog = available ? await fetchText('CHANGELOG.md') : null
    value = {
      ...base,
      latest,
      available,
      notes: changelog ? changelogSince(changelog, CURRENT_VERSION, latest) || null : null,
      error: null,
    }
  }
  updateCache = { at: Date.now(), ttl: value.error ? UPDATE_TTL_ERROR_MS : UPDATE_TTL_OK_MS, value }
  return value
}

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Stand der Updates; mit ?force=1 wird sofort neu bei GitHub nachgesehen
  app.get('/api/settings/update', async (request) => {
    const { force } = request.query as { force?: string }
    return checkForUpdate(force === '1')
  })

  // Unternehmensdaten lesen; die übrigen Felder haben eigene Routen ohne Geheimnisse
  app.get('/api/settings', async () => {
    const s = await loadSettings()
    return {
      settings: {
        id: s.id,
        companyName: s.companyName,
        postalAddress: s.postalAddress,
        signatureHtml: s.signatureHtml,
        unsubFooterDe: s.unsubFooterDe,
        unsubFooterEn: s.unsubFooterEn,
        updatedAt: s.updatedAt,
      },
      smtpConfigured: await isSmtpConfigured(),
    }
  })

  // Unternehmensdaten speichern
  app.put('/api/settings', async (request, reply) => {
    const parsed = companySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Eingabe' })

    const before = await loadSettings()
    const settings = await prisma.settings.update({ where: { id: 'singleton' }, data: parsed.data })
    const changes = changesOf(before, parsed.data)
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'settings',
        action: 'settings.companyUpdated',
        details: { changes },
      })
    }
    return {
      companyName: settings.companyName,
      postalAddress: settings.postalAddress,
      signatureHtml: settings.signatureHtml,
      unsubFooterDe: settings.unsubFooterDe,
      unsubFooterEn: settings.unsubFooterEn,
    }
  })

  // Postfach lesen: Servernamen, Ports und Anmeldenamen, Passwörter nur als "hinterlegt"
  app.get('/api/settings/mailbox', async () => {
    const s = await loadSettings()
    const smtp = await loadSmtpConfig()
    const smtpPasswordReadable = Boolean(decryptSecret(s.smtpPasswordEnc))
    const imapPasswordReadable = Boolean(decryptSecret(s.imapPasswordEnc))
    return {
      smtpHost: s.smtpHost ?? '',
      smtpPort: s.smtpPort,
      smtpSecurity: s.smtpSecurity ?? 'tls',
      smtpUser: s.smtpUser ?? '',
      smtpPasswordSet: Boolean(s.smtpPasswordEnc),
      smtpPasswordUnreadable: Boolean(s.smtpPasswordEnc) && !smtpPasswordReadable,
      mailFromAddress: s.mailFromAddress ?? '',
      mailFromName: s.mailFromName ?? '',
      imapHost: s.imapHost ?? '',
      imapPort: s.imapPort,
      imapSecurity: s.imapSecurity ?? 'tls',
      imapSameLogin: s.imapSameLogin,
      imapUser: s.imapUser ?? '',
      imapPasswordSet: Boolean(s.imapPasswordEnc),
      imapPasswordUnreadable: Boolean(s.imapPasswordEnc) && !imapPasswordReadable,
      imapFolder: s.imapFolder ?? 'INBOX',
      // Woher der Versand gerade seine Daten nimmt: settings | env | test (kein Versand)
      sendMode: smtp?.source ?? 'test',
      // Steht in der Server-Datei .env ein Versandzugang? Dann greift er, solange hier nichts eingetragen ist
      envFallback: Boolean(env.smtp.host && env.smtp.fromAddress),
      defaultPorts: DEFAULT_PORTS,
    }
  })

  // Postfach speichern. Leere Passwortfelder lassen das gespeicherte Passwort unverändert.
  app.put('/api/settings/mailbox', async (request, reply) => {
    const parsed = mailboxSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const d = parsed.data
    const before = await loadSettings()

    const data: Record<string, unknown> = {}
    if (d.smtpHost !== undefined) data.smtpHost = d.smtpHost || null
    if (d.smtpPort !== undefined) data.smtpPort = d.smtpPort
    if (d.smtpSecurity !== undefined) data.smtpSecurity = d.smtpSecurity
    if (d.smtpUser !== undefined) data.smtpUser = d.smtpUser || null
    if (d.smtpPassword) data.smtpPasswordEnc = encryptSecret(d.smtpPassword)
    if (d.mailFromAddress !== undefined) data.mailFromAddress = d.mailFromAddress || null
    if (d.mailFromName !== undefined) data.mailFromName = d.mailFromName || null
    if (d.imapHost !== undefined) data.imapHost = d.imapHost || null
    if (d.imapPort !== undefined) data.imapPort = d.imapPort
    if (d.imapSecurity !== undefined) data.imapSecurity = d.imapSecurity
    if (d.imapSameLogin !== undefined) data.imapSameLogin = d.imapSameLogin
    if (d.imapUser !== undefined) data.imapUser = d.imapUser || null
    if (d.imapPassword) data.imapPasswordEnc = encryptSecret(d.imapPassword)
    if (d.imapFolder !== undefined) data.imapFolder = d.imapFolder || null
    if (d.clearSmtp) {
      Object.assign(data, {
        smtpHost: null,
        smtpPort: null,
        smtpSecurity: null,
        smtpUser: null,
        smtpPasswordEnc: null,
        mailFromAddress: null,
        mailFromName: null,
      })
    }
    if (d.clearImap) {
      Object.assign(data, {
        imapHost: null,
        imapPort: null,
        imapSecurity: null,
        imapSameLogin: true,
        imapUser: null,
        imapPasswordEnc: null,
        imapFolder: null,
      })
    }

    // Versand ohne Absenderadresse ist nicht möglich: Adresse oder E-Mail-Anmeldung verlangen
    const smtpHost = 'smtpHost' in data ? data.smtpHost : before.smtpHost
    const fromAddress = 'mailFromAddress' in data ? data.mailFromAddress : before.mailFromAddress
    const smtpUser = 'smtpUser' in data ? data.smtpUser : before.smtpUser
    if (smtpHost && !fromAddress && !(typeof smtpUser === 'string' && smtpUser.includes('@'))) {
      return reply.code(400).send({ error: 'Bitte eine Absenderadresse eintragen' })
    }

    const after = await prisma.settings.update({ where: { id: 'singleton' }, data })
    const changes = changesOf(before, after, MAILBOX_FIELDS)
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'mailbox',
        action: d.clearSmtp ? 'mailbox.smtpCleared' : d.clearImap ? 'mailbox.imapCleared' : 'mailbox.updated',
        details: { changes },
      })
    }
    return { ok: true }
  })

  // Zugang prüfen: SMTP meldet sich nur an, IMAP öffnet den Ordner. Es wird nichts versendet oder verändert.
  app.post('/api/settings/mailbox/test', async (request, reply) => {
    const parsed = z.object({ protocol: z.enum(['smtp', 'imap']) }).safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Eingabe' })
    const result = parsed.data.protocol === 'smtp' ? await verifySmtp() : await verifyImap()
    void logActivity(userActor(request), {
      area: 'mailbox',
      action: parsed.data.protocol === 'smtp' ? 'mailbox.smtpTested' : 'mailbox.imapTested',
      level: result.ok ? 'info' : 'warning',
      params: { ok: result.ok },
      details: { result: result.code, ...(result.detail ? { detail: result.detail } : {}) },
    })
    return result
  })
}
