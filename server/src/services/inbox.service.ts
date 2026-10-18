// Gespräche: holt neue Mails aus dem Postfach (IMAP, nur lesend), erkennt Rückläufer und
// Abwesenheitsnotizen und ordnet Antworten den eigenen Mails und Kontakten zu. Gespeichert wird
// nur, was zu MixMarket gehört; alle anderen Mails im Postfach bleiben unberührt.
// Eine echte Antwort beendet den Ablauf im Postausgang. Die KI ordnet die Antwort danach ein
// und schreibt bei Interesse oder Fragen einen Antwortentwurf, der erst nach Klick hinausgeht.
import type { Contact, Prisma, Settings } from '../generated/prisma/client.js'
import PostalMime from 'postal-mime'
import { prisma } from '../db/prisma.js'
import { logger } from '../utils/logger.js'
import { checkBounceRate, createNotice } from './control.service.js'
import { SYSTEM, logActivity } from './activity.service.js'
import { proHook } from '../pro/host.js'
import { detailOf, imapClientFor, loadImapConfig, loadSmtpConfig, sendMail } from './mailer.service.js'
import { stopOutreach, textToHtml } from './outbox.service.js'
import { escapeHtml, htmlToText, signatureToHtml } from './tracking.service.js'

// Abstand zwischen zwei Abrufen des Postfachs
const POLL_INTERVAL_MS = 2 * 60_000
// Beim ersten Abruf so weit zurück schauen
const FIRST_RUN_DAYS = 14
// Höchstens so viele Mails je Abruf, der Rest folgt beim nächsten Mal
const MAX_PER_RUN = 200
// Größere Mails (meist mit großen Anhängen) werden nicht geladen
const MAX_SOURCE_BYTES = 8 * 1024 * 1024
// Gespeicherter Text einer Mail
const MAX_TEXT = 20_000

// Einordnungen der KI
export const INBOX_CATEGORIES = ['interested', 'question', 'not_interested', 'unsubscribe', 'other'] as const
export type InboxCategory = (typeof INBOX_CATEGORIES)[number]

async function loadSettings(): Promise<Settings> {
  return (
    (await prisma.settings.findUnique({ where: { id: 'singleton' } })) ?? prisma.settings.create({ data: { id: 'singleton' } })
  )
}

// ---------------------------------------------------------------------------
// Hilfen zum Lesen von Mails
// ---------------------------------------------------------------------------

// Message-IDs aus In-Reply-To und References lösen
function messageIds(...values: Array<string | null | undefined>): string[] {
  const ids = new Set<string>()
  for (const value of values) for (const m of (value ?? '').match(/<[^<>\s]+>/g) ?? []) ids.add(m)
  return [...ids]
}

function header(headers: Array<{ key: string; value: string }>, key: string): string | null {
  return headers.find((h) => h.key === key)?.value ?? null
}

// Automatische Antwort (Abwesenheit, Urlaub, Eingangsbestätigung) an Kopfzeilen oder Betreff erkennen
function isAutoReply(headers: Array<{ key: string; value: string }>, subject: string): boolean {
  const auto = header(headers, 'auto-submitted')
  if (auto && auto.trim().toLowerCase() !== 'no') return true
  if (header(headers, 'x-autoreply') || header(headers, 'x-autorespond') || header(headers, 'x-autoresponder')) return true
  const precedence = (header(headers, 'precedence') ?? '').toLowerCase()
  if (['auto_reply', 'auto-reply'].includes(precedence.trim())) return true
  return /^(automatische antwort|autom\. antwort|abwesenheit|abwesend|out of office|auto(matic)? ?reply|autoreply|auto:|urlaub|i am out of the office|eingangsbestätigung)/i.test(
    subject.trim(),
  )
}

// Rückläufer (Unzustellbar-Meldung) erkennen
function isBounce(fromEmail: string, headers: Array<{ key: string; value: string }>, subject: string): boolean {
  if (/^(mailer-daemon|postmaster|mail-daemon)@/i.test(fromEmail)) return true
  const type = (header(headers, 'content-type') ?? '').toLowerCase()
  if (type.includes('multipart/report') && type.includes('delivery-status')) return true
  return /(undeliver|delivery status notification|delivery failure|returned mail|mail delivery failed|unzustellbar|nicht zugestellt|zustellung fehlgeschlagen)/i.test(
    subject,
  )
}

// Angaben eines Rückläufers aus dem Rohtext: Empfänger, Art (dauerhaft oder vorübergehend), ursprüngliche Message-IDs
function bounceDetails(raw: string, ownId: string | null) {
  const recipient =
    /^Final-Recipient:\s*rfc822;\s*<?([^\s<>;]+@[^\s<>;]+)>?/im.exec(raw)?.[1] ??
    /^Original-Recipient:\s*rfc822;\s*<?([^\s<>;]+@[^\s<>;]+)>?/im.exec(raw)?.[1] ??
    null
  const status = /^Status:\s*([245])\.\d{1,3}\.\d{1,3}/im.exec(raw)?.[1]
  const action = /^Action:\s*(\w+)/im.exec(raw)?.[1]?.toLowerCase()
  // Ohne maschinenlesbare Angabe gilt eine Unzustellbar-Meldung als dauerhaft
  const hard = status ? status === '5' : action ? action === 'failed' : true
  const ids = [...raw.matchAll(/^Message-ID:\s*(<[^<>\s]+>)/gim)].map((m) => m[1] as string).filter((id) => id !== ownId)
  return { recipient: recipient?.toLowerCase() ?? null, hard, ids }
}

// Zitierte frühere Mails abschneiden, damit die KI nur die neue Antwort liest
export function stripQuoted(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  for (const line of lines) {
    const l = line.trim()
    if (/^>/.test(l)) break
    if (/^(am|on)\s.{3,200}(schrieb|wrote)\s?.*:$/i.test(l)) break
    if (/^-{2,}\s*(original|ursprüngliche)/i.test(l)) break
    if (/^(von|from):\s/i.test(l) && out.length > 2) break
    out.push(line)
  }
  return out.join('\n').trim() || text.trim()
}

export function clip(text: string, max = MAX_TEXT): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

// ---------------------------------------------------------------------------
// Eine Mail verarbeiten
// ---------------------------------------------------------------------------

export interface IngestMeta {
  folder?: string | null
  uid?: number | null
  internalDate?: Date | null
}

export type IngestResult = 'stored' | 'skipped' | 'duplicate'

export async function ingestRaw(source: Buffer | string, meta: IngestMeta = {}): Promise<IngestResult> {
  const email = await PostalMime.parse(typeof source === 'string' ? source : new Uint8Array(source))
  const messageIdHeader = email.messageId?.trim() || null
  if (messageIdHeader && (await prisma.inboxMessage.findUnique({ where: { messageIdHeader } }))) return 'duplicate'

  const fromEmail = (email.from && 'address' in email.from ? email.from.address : '')?.toLowerCase() ?? ''
  const fromName = email.from && 'name' in email.from ? email.from.name || null : null
  const subject = (email.subject ?? '').trim()
  const text = clip((email.text?.trim() || (email.html ? htmlToText(email.html) : '')).trim())
  const receivedAt =
    meta.internalDate ?? (email.date && !Number.isNaN(Date.parse(email.date)) ? new Date(email.date) : new Date())
  const toEmail = email.to?.find((a) => 'address' in a && a.address)
  const base = {
    folder: meta.folder ?? null,
    uid: meta.uid ?? null,
    messageIdHeader,
    inReplyTo: email.inReplyTo ?? null,
    references: email.references ?? null,
    fromEmail: fromEmail || 'unbekannt',
    fromName,
    toEmail: toEmail && 'address' in toEmail ? (toEmail.address ?? null) : null,
    subject,
    text,
    receivedAt,
  }

  // Eigene Mails (z. B. Kopien im Posteingang) nie als Antwort werten
  const smtp = await loadSmtpConfig()
  if (smtp && fromEmail === smtp.fromAddress.toLowerCase()) return 'skipped'

  // 1. Rückläufer
  if (isBounce(fromEmail, email.headers, subject)) {
    const raw = typeof source === 'string' ? source : source.toString('utf8')
    const details = bounceDetails(raw, messageIdHeader)
    const origin = await findOrigin(details.ids)
    const recipient = details.recipient ?? origin?.toEmail ?? null
    if (!recipient) return 'skipped'
    const contact = await prisma.contact.findUnique({ where: { email: recipient } })
    // Nur Rückläufer zu eigenen Mails oder bekannten Kontakten gehören zu MixMarket
    if (!origin && !contact) return 'skipped'
    await handleBounce({ ...base, recipient, hard: details.hard, contact, origin })
    return 'stored'
  }

  // 2. Antwort zuordnen: über den Verlauf, sonst über den Absender
  const refs = messageIds(email.inReplyTo, email.references)
  const origin = await findOrigin(refs)
  const contact =
    (origin?.contactId ? await prisma.contact.findUnique({ where: { id: origin.contactId } }) : null) ??
    (fromEmail ? await prisma.contact.findUnique({ where: { email: fromEmail } }) : null)
  if (!origin && !contact) return 'skipped'
  const prospectId = origin?.prospectId ?? (contact ? await prospectOf(contact.id) : null)

  const auto = isAutoReply(email.headers, subject)
  const message = await prisma.inboxMessage.create({
    data: {
      ...base,
      kind: auto ? 'auto_reply' : 'reply',
      status: auto ? 'done' : 'open',
      aiStatus: auto ? 'skipped' : 'pending',
      contactId: contact?.id ?? null,
      prospectId,
      outboxMessageId: origin?.outboxMessageId ?? null,
      sendId: origin?.sendId ?? null,
    },
  })
  const label = contact?.company || fromName || fromEmail

  if (auto) {
    // Abwesenheitsnotizen beenden den Ablauf nicht
    void logActivity(SYSTEM, {
      area: 'inbox',
      action: 'inbox.autoReply',
      entityType: 'inboxMessage',
      entityId: message.id,
      label,
    })
    return 'stored'
  }

  // Echte Antwort: Ablauf im Postausgang endet, Interessent ist im Gespräch
  const stopped = prospectId
    ? await stopOutreach({ prospectId }, 'replied')
    : contact
      ? await stopOutreach({ contactId: contact.id }, 'replied')
      : 0
  if (prospectId) {
    await prisma.prospect.updateMany({
      where: { id: prospectId, status: { in: ['new', 'contacted'] } },
      data: { status: 'talking' },
    })
  }
  void logActivity(SYSTEM, {
    area: 'inbox',
    action: 'inbox.received',
    entityType: 'inboxMessage',
    entityId: message.id,
    label,
    params: { from: fromEmail },
    ...(stopped ? { details: { outboxStopped: stopped } } : {}),
  })
  // KI-Einordnung (MixMarket Pro) anstoßen
  proHook<() => void>('inbox.kickAi')?.()
  return 'stored'
}

// Herkunft einer Antwort oder eines Rückläufers: eigene Mail aus Postausgang, Kampagne oder Gespräch
async function findOrigin(ids: string[]) {
  if (!ids.length) return null
  const outbox = await prisma.outboxMessage.findFirst({ where: { messageId: { in: ids } }, orderBy: { step: 'desc' } })
  if (outbox) {
    return {
      outboxMessageId: outbox.id,
      sendId: null,
      contactId: outbox.contactId,
      prospectId: outbox.prospectId,
      toEmail: outbox.toEmail,
    }
  }
  const send = await prisma.send.findFirst({
    where: { messageId: { in: ids } },
    include: { contact: { select: { email: true } } },
  })
  if (send) {
    return { outboxMessageId: null, sendId: send.id, contactId: send.contactId, prospectId: null, toEmail: send.contact.email }
  }
  const reply = await prisma.inboxReply.findFirst({ where: { messageId: { in: ids } }, include: { message: true } })
  if (reply) {
    return {
      outboxMessageId: null,
      sendId: null,
      contactId: reply.message.contactId,
      prospectId: reply.message.prospectId,
      toEmail: reply.message.fromEmail,
    }
  }
  return null
}

// Interessent eines Kontakts: bevorzugt der, mit dem gerade ein Ablauf oder Gespräch läuft
async function prospectOf(contactId: string): Promise<string | null> {
  const prospects = await prisma.prospect.findMany({
    where: { contactId },
    include: { messages: { where: { status: 'sent' }, orderBy: { sentAt: 'desc' }, take: 1, select: { sentAt: true } } },
  })
  if (!prospects.length) return null
  const order = ['talking', 'contacted', 'new', 'customer', 'declined']
  prospects.sort(
    (a, b) =>
      (b.messages[0]?.sentAt?.getTime() ?? 0) - (a.messages[0]?.sentAt?.getTime() ?? 0) ||
      order.indexOf(a.status) - order.indexOf(b.status),
  )
  return prospects[0]?.id ?? null
}

// Rückläufer: bei dauerhaftem Fehler Adresse sperren, Kontakt als unzustellbar markieren, Ablauf beenden
async function handleBounce(input: {
  folder: string | null
  uid: number | null
  messageIdHeader: string | null
  inReplyTo: string | null
  references: string | null
  fromEmail: string
  fromName: string | null
  toEmail: string | null
  subject: string
  text: string
  receivedAt: Date
  recipient: string
  hard: boolean
  contact: Contact | null
  origin: Awaited<ReturnType<typeof findOrigin>>
}) {
  const { recipient, hard, contact, origin, ...base } = input
  const prospectId = origin?.prospectId ?? (contact ? await prospectOf(contact.id) : null)
  const message = await prisma.inboxMessage.create({
    data: {
      ...base,
      kind: 'bounce',
      status: hard ? 'open' : 'done',
      aiStatus: 'skipped',
      bounceType: hard ? 'hard' : 'soft',
      bounceRecipient: recipient,
      contactId: contact?.id ?? null,
      prospectId,
      outboxMessageId: origin?.outboxMessageId ?? null,
      sendId: origin?.sendId ?? null,
    },
  })
  if (hard) {
    // Bestehenden Sperrgrund (z. B. Abmeldung) nicht überschreiben
    await prisma.suppression.upsert({
      where: { email: recipient },
      update: {},
      create: { email: recipient, reason: 'bounced', note: 'Automatisch erkannter Rückläufer' },
    })
    await prisma.contact.updateMany({ where: { email: recipient, status: 'active' }, data: { status: 'bounced' } })
    await stopOutreach({ email: recipient }, 'bounced')
    if (contact) await stopOutreach({ contactId: contact.id }, 'bounced')
    if (origin?.sendId)
      await prisma.send.update({ where: { id: origin.sendId }, data: { status: 'bounced' } }).catch(() => undefined)
    await createNotice({ kind: 'bounce', label: recipient, entityType: 'inboxMessage', entityId: message.id })
    // Zu viele dauerhafte Rückläufer in 24 Stunden lösen den Not-Aus aus
    await checkBounceRate()
  }
  await prisma.emailEvent.create({
    data: { type: 'bounce', contactId: contact?.id ?? null, sendId: origin?.sendId ?? null, campaignId: null },
  })
  void logActivity(SYSTEM, {
    area: 'inbox',
    action: hard ? 'inbox.bounceHard' : 'inbox.bounceSoft',
    level: hard ? 'warning' : 'info',
    entityType: 'inboxMessage',
    entityId: message.id,
    label: recipient,
  })
}

// ---------------------------------------------------------------------------
// Postfach abrufen
// ---------------------------------------------------------------------------

let pollRunning = false

// Abruf, wenn der letzte länger als das Intervall her ist (oder sofort mit force)
export async function pollInbox(force = false): Promise<{ checked: boolean; stored: number; error?: string }> {
  if (pollRunning) return { checked: false, stored: 0 }
  const settings = await loadSettings()
  if (!force && settings.imapCheckedAt && Date.now() - settings.imapCheckedAt.getTime() < POLL_INTERVAL_MS) {
    return { checked: false, stored: 0 }
  }
  const cfg = await loadImapConfig()
  if (!cfg) return { checked: false, stored: 0 }
  pollRunning = true
  const client = imapClientFor(cfg)
  let stored = 0
  try {
    await client.connect()
    // Nur lesend öffnen: Mails bleiben ungelesen und unverändert
    const box = await client.mailboxOpen(cfg.folder, { readOnly: true })
    const validity = String(box.uidValidity)
    const fresh = settings.imapUidValidity !== validity || settings.imapLastUid === null
    let uids: number[]
    if (fresh) {
      const since = new Date(Date.now() - FIRST_RUN_DAYS * 24 * 60 * 60 * 1000)
      uids = ((await client.search({ since }, { uid: true })) || []) as number[]
    } else {
      const last = settings.imapLastUid ?? 0
      uids = (((await client.search({ uid: `${last + 1}:*` }, { uid: true })) || []) as number[]).filter((u) => u > last)
    }
    uids.sort((a, b) => a - b)
    const batch = uids.slice(0, MAX_PER_RUN)
    let lastUid = fresh ? 0 : (settings.imapLastUid ?? 0)

    // Erst Größe und Datum, dann nur passende Mails vollständig laden
    const items: Array<{ uid: number; size: number; date: Date | null }> = []
    if (batch.length) {
      for await (const msg of client.fetch(batch, { uid: true, size: true, internalDate: true }, { uid: true })) {
        const date = msg.internalDate ? new Date(msg.internalDate) : null
        items.push({ uid: msg.uid, size: msg.size ?? 0, date })
      }
    }
    for (const item of items.sort((a, b) => a.uid - b.uid)) {
      if (item.size <= MAX_SOURCE_BYTES) {
        const full = await client.fetchOne(String(item.uid), { source: true }, { uid: true })
        if (full && full.source) {
          try {
            if ((await ingestRaw(full.source, { folder: cfg.folder, uid: item.uid, internalDate: item.date })) === 'stored')
              stored++
          } catch (error) {
            logger.warn(`Gespräche: Mail ${item.uid} konnte nicht gelesen werden`, error instanceof Error ? error.message : error)
          }
        }
      }
      lastUid = Math.max(lastUid, item.uid)
    }
    // Beim ersten Abruf ohne Treffer trotzdem den aktuellen Stand merken
    if (fresh && !items.length) lastUid = Math.max(0, (box.uidNext ?? 1) - 1)
    await prisma.settings.update({
      where: { id: 'singleton' },
      data: { imapUidValidity: validity, imapLastUid: lastUid, imapCheckedAt: new Date(), imapLastError: null },
    })
    if (settings.imapLastError) {
      void logActivity(SYSTEM, { area: 'inbox', action: 'inbox.pollRecovered' })
    }
    return { checked: true, stored }
  } catch (error) {
    const message = detailOf(error)
    await prisma.settings.update({ where: { id: 'singleton' }, data: { imapCheckedAt: new Date(), imapLastError: message } })
    // Gleichen Fehler nur einmal protokollieren, nicht bei jedem Abruf
    if (settings.imapLastError !== message) {
      void logActivity(SYSTEM, { area: 'inbox', action: 'inbox.pollFailed', level: 'error', details: { error: message } })
    }
    logger.warn('Gespräche: Postfach konnte nicht abgerufen werden', message)
    return { checked: true, stored, error: message }
  } finally {
    pollRunning = false
    await client.logout().catch(() => client.close())
  }
}

// ---------------------------------------------------------------------------
// Einordnung von Antworten (Folgen) und Betreff von Antworten
// Die KI-Einordnung und KI-Antwortentwürfe gehören zu MixMarket Pro.
// ---------------------------------------------------------------------------

// Betreff einer Antwort: "Re: " vor den Betreff der eingegangenen Mail
export function replySubject(subject: string): string {
  const s = subject.trim()
  return /^(re|aw|antw):/i.test(s) ? s : `Re: ${s || '...'}`
}

// Folgen einer Einordnung: kein Interesse oder Abmeldewunsch ändern Interessent, Kontakt und Sperrliste
export async function applyCategory(
  message: { id: string; contactId: string | null; prospectId: string | null; fromEmail: string },
  category: InboxCategory,
): Promise<void> {
  if (category === 'not_interested' || category === 'unsubscribe') {
    if (message.prospectId) {
      await prisma.prospect.updateMany({
        where: { id: message.prospectId, status: { not: 'customer' } },
        data: { status: 'declined' },
      })
    }
  } else if (message.prospectId) {
    await prisma.prospect.updateMany({
      where: { id: message.prospectId, status: { in: ['new', 'contacted'] } },
      data: { status: 'talking' },
    })
  }
  if (category === 'unsubscribe') {
    const contact = message.contactId ? await prisma.contact.findUnique({ where: { id: message.contactId } }) : null
    const email = contact?.email ?? message.fromEmail
    const already = await prisma.suppression.findUnique({ where: { email } })
    await prisma.suppression.upsert({
      where: { email },
      update: {},
      create: { email, reason: 'unsubscribed', note: 'Abmeldewunsch per Antwort' },
    })
    // Hinweis in "Wartet auf Sie", nur bei einer neuen Sperre
    if (!already) {
      await createNotice({ kind: 'unsubscribe', label: email, entityType: 'inboxMessage', entityId: message.id, params: { via: 'reply' } })
    }
    await prisma.contact.updateMany({ where: { email }, data: { status: 'unsubscribed' } })
    await stopOutreach({ email }, 'unsubscribed')
    // Offene Entwürfe an diese Adresse entfallen
    await prisma.inboxReply.updateMany({
      where: { message: { id: message.id }, status: { in: ['generating', 'review', 'failed'] } },
      data: { status: 'discarded' },
    })
  }
}


// ---------------------------------------------------------------------------
// Antwort versenden
// ---------------------------------------------------------------------------

// Persönliche Antwort: Text, Signatur, Postanschrift und die zitierte Mail; ohne Zählpixel und Abmeldelink
export function buildReplyMail(
  body: string,
  settings: Settings,
  quoted: { from: string; at: Date; text: string; language: 'de' | 'en' },
) {
  const signature = settings.signatureHtml?.trim() ? `<div style="margin-top:20px;">${signatureToHtml(settings.signatureHtml)}</div>` : ''
  const address = settings.postalAddress?.trim()
  const addressHtml = address
    ? `<p style="margin:24px 0 0;font-size:12px;color:#8a8377;font-family:Arial,sans-serif;">${escapeHtml(address).replace(/\r?\n/g, '<br />')}</p>`
    : ''
  const when = quoted.at.toLocaleString(quoted.language === 'en' ? 'en-GB' : 'de-DE', { dateStyle: 'medium', timeStyle: 'short' })
  const intro = quoted.language === 'en' ? `On ${when}, ${quoted.from} wrote:` : `Am ${when} schrieb ${quoted.from}:`
  const quotedText = clip(quoted.text, 8000)
  const quoteHtml = `<div style="margin-top:24px;font-family:Arial,sans-serif;font-size:13px;color:#555;">${escapeHtml(intro)}<blockquote style="margin:8px 0 0;padding-left:12px;border-left:2px solid #ccc;">${escapeHtml(quotedText).replace(/\r?\n/g, '<br />')}</blockquote></div>`
  const html = `${textToHtml(body)}${signature}${addressHtml}${quoteHtml}`
  const text = [
    body.trim(),
    settings.signatureHtml?.trim() ? htmlToText(settings.signatureHtml) : '',
    address ? `--\n${address}` : '',
    `${intro}\n${quotedText
      .split('\n')
      .map((l) => `> ${l}`)
      .join('\n')}`,
  ]
    .filter(Boolean)
    .join('\n\n')
  return { html, text }
}

export type SendReplyResult = { ok: true; testMode: boolean } | { ok: false; status: number; error: string; code?: string }

export async function sendReply(replyId: string): Promise<SendReplyResult> {
  const reply = await prisma.inboxReply.findUnique({
    where: { id: replyId },
    include: { message: { include: { contact: true } } },
  })
  if (!reply) return { ok: false, status: 404, error: 'Antwort nicht gefunden' }
  if (!['review', 'failed'].includes(reply.status) || !reply.body.trim()) {
    return { ok: false, status: 409, error: 'Diese Antwort lässt sich nicht senden' }
  }
  // Not-Aus gilt auch für Antworten
  if ((await loadSettings()).sendingStopped) {
    return { ok: false, status: 409, error: 'Der Versand ist per Not-Aus gestoppt', code: 'stopped' }
  }
  const message = reply.message
  const to = (message.contact?.email ?? message.fromEmail).toLowerCase()
  // Wer gesperrt ist (Abmeldung, Rückläufer), bekommt keine Mail mehr
  const blocked = await prisma.suppression.findUnique({ where: { email: to } })
  if (blocked) return { ok: false, status: 409, error: 'Die Adresse steht auf der Sperrliste', code: 'suppressed' }
  const settings = await loadSettings()
  const language = reply.language === 'en' ? 'en' : 'de'
  const mail = buildReplyMail(reply.body, settings, {
    from: message.fromName ? `${message.fromName} <${message.fromEmail}>` : message.fromEmail,
    at: message.receivedAt,
    text: message.text,
    language,
  })
  const refs = messageIds(message.references, message.messageIdHeader)
  const result = await sendMail({
    to,
    subject: reply.subject.trim() || replySubject(message.subject),
    html: mail.html,
    text: mail.text,
    headers: {
      ...(message.messageIdHeader ? { 'In-Reply-To': message.messageIdHeader } : {}),
      ...(refs.length ? { References: refs.join(' ') } : {}),
    },
  })
  if (!result.success) {
    // Not-Aus kam dazwischen: der Entwurf bleibt unverändert zur Freigabe
    if (result.stopped) return { ok: false, status: 409, error: 'Der Versand ist per Not-Aus gestoppt', code: 'stopped' }
    await prisma.inboxReply.update({
      where: { id: replyId },
      data: { status: 'failed', error: result.error ?? 'Versand fehlgeschlagen' },
    })
    void logActivity(SYSTEM, {
      area: 'inbox',
      action: 'inbox.replyFailed',
      level: 'error',
      entityType: 'inboxMessage',
      entityId: message.id,
      label: message.contact?.company || to,
      details: { error: result.error ?? null },
    })
    return { ok: false, status: 502, error: result.error ?? 'Versand fehlgeschlagen' }
  }
  await prisma.inboxReply.update({
    where: { id: replyId },
    data: {
      status: 'sent',
      sentAt: new Date(),
      messageId: result.messageId ?? null,
      testMode: Boolean(result.testMode),
      error: null,
    },
  })
  await prisma.inboxMessage.update({ where: { id: message.id }, data: { status: 'done' } })
  return { ok: true, testMode: Boolean(result.testMode) }
}

// Ein Durchlauf des Zeitplaners: Postfach abrufen, danach die KI-Einordnung (MixMarket Pro)
export async function processInbox(): Promise<void> {
  await pollInbox()
  await proHook<() => Promise<void>>('inbox.afterPoll')?.()
}
