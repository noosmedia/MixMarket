// Postfach von MixMarket: Versand über SMTP (nodemailer), Empfang über IMAP (imapflow).
// Die Zugangsdaten stehen in den Einstellungen (Passwörter verschlüsselt). Sind dort keine
// SMTP-Daten hinterlegt, gelten die Werte aus der Server-Datei .env. Ohne beides läuft der
// Versand im Testmodus: Mails werden nur protokolliert, nicht verschickt.
import { createHash } from 'node:crypto'
import nodemailer, { type Transporter } from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { prisma } from '../db/prisma.js'
import { env } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { decryptSecret } from '../utils/secrets.js'

export type Security = 'tls' | 'starttls'

export interface SmtpConfig {
  host: string
  port: number
  security: Security
  user: string
  pass: string
  fromAddress: string
  fromName: string
  // Herkunft der Daten: Einstellungen in der App oder Server-Datei .env
  source: 'settings' | 'env'
}

export interface ImapConfig {
  host: string
  port: number
  security: Security
  user: string
  pass: string
  folder: string
}

// Standard-Ports je Verschlüsselung
export const DEFAULT_PORTS = {
  smtp: { tls: 465, starttls: 587 },
  imap: { tls: 993, starttls: 143 },
} as const

async function loadSettingsRow() {
  return (
    (await prisma.settings.findUnique({ where: { id: 'singleton' } })) ??
    prisma.settings.create({ data: { id: 'singleton' } })
  )
}

// Versand-Zugang lesen: zuerst aus den Einstellungen, sonst aus der .env
export async function loadSmtpConfig(): Promise<SmtpConfig | null> {
  const s = await loadSettingsRow()
  if (s.smtpHost) {
    const security: Security = s.smtpSecurity === 'starttls' ? 'starttls' : 'tls'
    const fromAddress = s.mailFromAddress || (s.smtpUser?.includes('@') ? s.smtpUser : '')
    if (!fromAddress) return null
    return {
      host: s.smtpHost,
      port: s.smtpPort ?? DEFAULT_PORTS.smtp[security],
      security,
      user: s.smtpUser ?? '',
      pass: decryptSecret(s.smtpPasswordEnc) ?? '',
      fromAddress,
      fromName: s.mailFromName || s.companyName || 'MixMarket',
      source: 'settings',
    }
  }
  if (env.smtp.host && env.smtp.fromAddress) {
    return {
      host: env.smtp.host,
      port: env.smtp.port,
      // Port 465 ist direkt verschlüsselt, alle anderen Ports nutzen STARTTLS
      security: env.smtp.secure ? 'tls' : 'starttls',
      user: env.smtp.user,
      pass: env.smtp.pass,
      fromAddress: env.smtp.fromAddress,
      fromName: env.smtp.fromName,
      source: 'env',
    }
  }
  return null
}

// Empfangs-Zugang lesen; ohne eigene Anmeldung gilt die Anmeldung des Versands
export async function loadImapConfig(): Promise<ImapConfig | null> {
  const s = await loadSettingsRow()
  if (!s.imapHost) return null
  const security: Security = s.imapSecurity === 'starttls' ? 'starttls' : 'tls'
  const user = s.imapSameLogin ? (s.smtpUser ?? '') : (s.imapUser ?? '')
  const pass = decryptSecret(s.imapSameLogin ? s.smtpPasswordEnc : s.imapPasswordEnc) ?? ''
  if (!user || !pass) return null
  return {
    host: s.imapHost,
    port: s.imapPort ?? DEFAULT_PORTS.imap[security],
    security,
    user,
    pass,
    folder: s.imapFolder || 'INBOX',
  }
}

// Ist ein echter Versand möglich (sonst Testmodus)?
export async function isSmtpConfigured(): Promise<boolean> {
  return (await loadSmtpConfig()) !== null
}

// Transporter je Zugang zwischenspeichern; ändern sich die Zugangsdaten, wird neu verbunden
let cached: { key: string; transporter: Transporter } | null = null

function transporterFor(cfg: SmtpConfig): Transporter {
  const key = createHash('sha256')
    .update(JSON.stringify([cfg.host, cfg.port, cfg.security, cfg.user, cfg.pass]))
    .digest('hex')
  if (cached?.key === key) return cached.transporter
  cached?.transporter.close()
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    // tls: sofort verschlüsselt; starttls: Verschlüsselung ist Pflicht, unverschlüsselt wird abgebrochen
    secure: cfg.security === 'tls',
    requireTLS: cfg.security === 'starttls',
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  })
  cached = { key, transporter }
  return transporter
}

export interface SendMailInput {
  to: string
  subject: string
  html: string
  text?: string
  fromName?: string
  fromEmail?: string
  headers?: Record<string, string>
}

export interface SendMailResult {
  success: boolean
  messageId?: string
  error?: string
  testMode?: boolean
  // Versand wegen Not-Aus nicht ausgeführt
  stopped?: boolean
}

// Eine einzelne Mail versenden
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  // Not-Aus: letzte Sicherung, falls ein Versandweg die Sperre nicht vorher geprüft hat
  if ((await loadSettingsRow()).sendingStopped) {
    logger.warn(`Versand an ${input.to} wegen Not-Aus nicht ausgeführt`)
    return { success: false, error: 'Der Versand ist per Not-Aus gestoppt', stopped: true }
  }
  const cfg = await loadSmtpConfig()

  // Testmodus: kein Postfach hinterlegt
  if (!cfg) {
    logger.info(`[Testmodus] Mail an ${input.to} würde versendet: "${input.subject}"`)
    return { success: true, testMode: true, messageId: `test-${Date.now()}` }
  }

  try {
    const info = await transporterFor(cfg).sendMail({
      from: { name: input.fromName || cfg.fromName, address: input.fromEmail || cfg.fromAddress },
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: input.headers,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    logger.error(`Versand an ${input.to} fehlgeschlagen`, message)
    return { success: false, error: message }
  }
}

// Ergebnis eines Verbindungstests. "code" wird in der Oberfläche übersetzt, "detail" ist
// die vollständige Meldung des Mailservers, damit der Fehler nachvollziehbar bleibt.
export interface MailTestResult {
  ok: boolean
  code: 'ok' | 'missing' | 'auth' | 'connect' | 'tls' | 'folder' | 'error'
  detail?: string
  // Nur IMAP: Anzahl Nachrichten im Ordner und vorhandene Ordner
  messages?: number
  folders?: string[]
  source?: 'settings' | 'env'
}

// Fehler eines Mailservers einer verständlichen Ursache zuordnen
function classify(error: unknown): MailTestResult['code'] {
  const e = error as { code?: string; authenticationFailed?: boolean; responseCode?: number; message?: string }
  const message = (e?.message ?? '').toLowerCase()
  if (e?.authenticationFailed || e?.code === 'EAUTH' || e?.responseCode === 535 || /auth|login|credentials/.test(message)) {
    return 'auth'
  }
  if (e?.code === 'ETLS' || /tls|ssl|certificate|wrong version number/.test(message)) return 'tls'
  if (
    ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'ENOTFOUND', 'ECONNREFUSED', 'EHOSTUNREACH', 'ECONNRESET'].includes(
      e?.code ?? '',
    ) ||
    /timeout|timed out|getaddrinfo|connect/.test(message)
  ) {
    return 'connect'
  }
  return 'error'
}

// Vollständige Fehlermeldung; die Serverantwort nur anhängen, wenn sie nicht schon in der Meldung steht
export function detailOf(error: unknown): string {
  const e = error as { message?: string; response?: string; responseText?: string }
  const message = e?.message?.trim() ?? ''
  const response = (e?.responseText ?? e?.response ?? '').trim()
  const parts = response && !message.includes(response) ? [message, response] : [message]
  return parts.filter(Boolean).join(' · ') || 'Unbekannter Fehler'
}

// Versand-Zugang prüfen: verbinden und anmelden, es wird keine Mail verschickt
export async function verifySmtp(): Promise<MailTestResult> {
  const cfg = await loadSmtpConfig()
  if (!cfg) return { ok: false, code: 'missing' }
  try {
    await transporterFor(cfg).verify()
    return { ok: true, code: 'ok', source: cfg.source }
  } catch (error) {
    // Fehlerhafte Verbindung nicht wiederverwenden
    cached?.transporter.close()
    cached = null
    return { ok: false, code: classify(error), detail: detailOf(error), source: cfg.source }
  }
}

// IMAP-Verbindung zum Empfangs-Zugang vorbereiten (noch nicht verbunden)
export function imapClientFor(cfg: ImapConfig): ImapFlow {
  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.security === 'tls',
    doSTARTTLS: cfg.security === 'starttls' ? true : undefined,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  })
  // Verbindungsfehler im Hintergrund dürfen den Server nicht abstürzen lassen
  client.on('error', (error: unknown) => logger.warn('IMAP-Verbindung meldet einen Fehler', detailOf(error)))
  return client
}

// Empfangs-Zugang prüfen: anmelden, Ordner öffnen, Nachrichten zählen. Es wird nichts verändert.
export async function verifyImap(): Promise<MailTestResult> {
  const cfg = await loadImapConfig()
  if (!cfg) return { ok: false, code: 'missing' }
  const client = imapClientFor(cfg)
  try {
    await client.connect()
    const folders = (await client.list()).map((f) => f.path)
    const wanted = folders.find((f) => f.toLowerCase() === cfg.folder.toLowerCase())
    if (!wanted) return { ok: false, code: 'folder', detail: cfg.folder, folders }
    const status = await client.status(wanted, { messages: true })
    return { ok: true, code: 'ok', messages: status ? (status.messages ?? 0) : 0, folders }
  } catch (error) {
    return { ok: false, code: classify(error), detail: detailOf(error) }
  } finally {
    await client.logout().catch(() => client.close())
  }
}
