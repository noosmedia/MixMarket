// Öffentliche Routen für Tracking und Abmeldung (ohne Login).
// Werden direkt aus den versendeten Mails aufgerufen. Eine Tracking-Kennung gehört entweder
// zu einer Kampagnen-Mail (Send), zu einer Nachfass-Mail einer Automatisierung (AutomationRun)
// oder zu einer persönlichen Mail aus dem Postausgang (OutboxMessage).
import type { FastifyInstance } from 'fastify'
import { prisma } from '../db/prisma.js'
import { env } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { SYSTEM, logActivity } from '../services/activity.service.js'
import { stopOutreach } from '../services/outbox.service.js'
import { escapeHtml, linkSignatureValid } from '../services/tracking.service.js'
import { hitRateLimit } from '../utils/rate-limit.js'
import { createNotice } from '../services/control.service.js'

// 1x1 transparentes PNG als Base64 (Zählpixel)
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

// Herkunft einer Tracking-Kennung: Kampagnen-Mail oder Nachfass-Mail
type Tracked =
  | { kind: 'send'; sendId: string; campaignId: string; contactId: string; openedAt: Date | null; firstClickAt: Date | null }
  | { kind: 'run'; runId: string; automationId: string; contactId: string }
  | { kind: 'outbox'; messageId: string; contactId: string; openedAt: Date | null; clickedAt: Date | null }

async function resolveTracking(trackingId: string): Promise<Tracked | null> {
  const send = await prisma.send.findUnique({ where: { trackingId } })
  if (send) {
    return {
      kind: 'send',
      sendId: send.id,
      campaignId: send.campaignId,
      contactId: send.contactId,
      openedAt: send.openedAt,
      firstClickAt: send.firstClickAt,
    }
  }
  // Nachfass-Mails nutzen die Kennung ihres Laufs als Tracking-Kennung
  const run = await prisma.automationRun.findUnique({ where: { id: trackingId } })
  if (run) return { kind: 'run', runId: run.id, automationId: run.automationId, contactId: run.contactId }
  // Mails aus dem Postausgang nutzen ihre eigene Kennung; ohne Kontakt (gelöscht) zählt nichts mehr
  const outbox = await prisma.outboxMessage.findUnique({ where: { id: trackingId } })
  if (outbox?.contactId) {
    return {
      kind: 'outbox',
      messageId: outbox.id,
      contactId: outbox.contactId,
      openedAt: outbox.openedAt,
      clickedAt: outbox.clickedAt,
    }
  }
  return null
}

// Gemeinsame Felder eines Ereignisses; Nachfass-Mails haben keinen Send-Datensatz und keine Kampagne
function eventBase(t: Tracked) {
  return t.kind === 'send'
    ? { sendId: t.sendId, campaignId: t.campaignId, contactId: t.contactId }
    : { sendId: null, campaignId: null, contactId: t.contactId }
}

// Nur echte Webadressen als Ziel einer Weiterleitung zulassen
function safeTarget(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export async function trackingRoutes(app: FastifyInstance): Promise<void> {
  // Öffnungs-Pixel
  app.get('/t/o/:trackingId.png', async (request, reply) => {
    const { trackingId } = request.params as { trackingId: string }
    try {
      const tracked = await resolveTracking(trackingId)
      if (tracked) {
        // Bei Kampagnen nur die erste Öffnung als Kennzahl werten
        if (tracked.kind === 'send' && !tracked.openedAt) {
          await prisma.send.update({ where: { id: tracked.sendId }, data: { openedAt: new Date() } })
          await prisma.campaign.update({
            where: { id: tracked.campaignId },
            data: { openCount: { increment: 1 } },
          })
        }
        if (tracked.kind === 'outbox' && !tracked.openedAt) {
          await prisma.outboxMessage.update({ where: { id: tracked.messageId }, data: { openedAt: new Date() } })
        }
        // Wiederholte Abrufe derselben Mail höchstens einmal je Stunde speichern
        if (!hitRateLimit(`ev:o:${trackingId}`, 1, 60 * 60_000))
          await prisma.emailEvent.create({
            data: {
              ...eventBase(tracked),
              type: 'open',
              ip: request.ip,
              userAgent: request.headers['user-agent'],
            },
          })
      }
    } catch (error) {
      logger.error('Fehler beim Öffnungs-Tracking', error)
    }
    // Immer das Pixel zurückgeben
    reply.header('Content-Type', 'image/png')
    reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    return reply.send(PIXEL)
  })

  // Klick-Umleitung. Weitergeleitet wird nur bei bekannter Kennung und echter Webadresse,
  // sonst ließe sich der Link als offene Weiterleitung für fremde Seiten missbrauchen.
  app.get('/t/c/:trackingId', async (request, reply) => {
    const { trackingId } = request.params as { trackingId: string }
    const { u, s } = request.query as { u?: string; s?: string }
    const target = safeTarget(u)
    // Nur signierte Ziele (von MixMarket selbst in die Mail geschrieben) direkt weiterleiten
    const signed = !!u && linkSignatureValid(trackingId, u, s)

    try {
      const tracked = await resolveTracking(trackingId)
      if (!tracked || !target) return reply.redirect(env.publicWebUrl)
      if (!signed) {
        reply.header('Content-Type', 'text/html; charset=utf-8')
        return reply.send(leavePage(target, request.headers['accept-language']))
      }
      if (tracked.kind === 'send' && !tracked.firstClickAt) {
        await prisma.send.update({ where: { id: tracked.sendId }, data: { firstClickAt: new Date() } })
        await prisma.campaign.update({
          where: { id: tracked.campaignId },
          data: { clickCount: { increment: 1 } },
        })
      }
      if (tracked.kind === 'outbox' && !tracked.clickedAt) {
        await prisma.outboxMessage.update({ where: { id: tracked.messageId }, data: { clickedAt: new Date() } })
      }
      // Mehrfachklicks auf denselben Link innerhalb einer Minute nur einmal speichern
      if (!hitRateLimit(`ev:c:${trackingId}:${target}`, 1, 60_000))
        await prisma.emailEvent.create({
          data: {
            ...eventBase(tracked),
            type: 'click',
            url: target,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          },
        })
      return reply.redirect(target)
    } catch (error) {
      logger.error('Fehler beim Klick-Tracking', error)
      return reply.redirect(signed && target ? target : env.publicWebUrl)
    }
  })

  // Abmeldung über den Link in der Mail: sofort wirksam, ohne weitere Rückfrage
  app.get('/t/u/:trackingId', async (request, reply) => {
    const { trackingId } = request.params as { trackingId: string }
    await processUnsubscribe(trackingId, request.ip, request.headers['user-agent'])
    reply.header('Content-Type', 'text/html; charset=utf-8')
    return reply.send(unsubscribeConfirmPage(request.headers['accept-language']))
  })

  // List-Unsubscribe One-Click (POST aus dem Mailprogramm)
  app.post('/t/u/:trackingId', async (request, reply) => {
    const { trackingId } = request.params as { trackingId: string }
    await processUnsubscribe(trackingId, request.ip, request.headers['user-agent'])
    return reply.send({ ok: true })
  })
}

// Gemeinsame Abmeldelogik: Kontakt abmelden, Adresse sperren, offene Interessenten auf "Kein Interesse"
async function processUnsubscribe(trackingId: string, ip?: string, ua?: string): Promise<void> {
  try {
    const tracked = await resolveTracking(trackingId)
    if (!tracked) return
    const contact = await prisma.contact.findUnique({ where: { id: tracked.contactId } })
    if (!contact) return

    // Laufende persönliche Abläufe im Postausgang enden sofort, auch bei wiederholtem Klick
    await stopOutreach({ contactId: contact.id }, 'unsubscribed')

    // Wiederholte Klicks ändern nichts mehr und zählen nicht erneut
    if (contact.status === 'unsubscribed') return

    await prisma.contact.update({ where: { id: contact.id }, data: { status: 'unsubscribed' } })
    await prisma.suppression.upsert({
      where: { email: contact.email },
      update: { reason: 'unsubscribed' },
      create: { email: contact.email, reason: 'unsubscribed' },
    })
    if (tracked.kind === 'send') {
      await prisma.campaign.update({
        where: { id: tracked.campaignId },
        data: { unsubCount: { increment: 1 } },
      })
    }
    await prisma.emailEvent.create({ data: { ...eventBase(tracked), type: 'unsubscribe', ip, userAgent: ua } })

    // Interessenten, die noch in Arbeit sind, gelten jetzt als "Kein Interesse"; Kunden bleiben Kunden
    const declined = await prisma.prospect.updateMany({
      where: { contactId: contact.id, status: { in: ['new', 'contacted', 'talking'] } },
      data: { status: 'declined' },
    })

    await createNotice({
      kind: 'unsubscribe',
      label: contact.email,
      entityType: 'contact',
      entityId: contact.id,
      params: { via: 'link' },
    })
    void logActivity(SYSTEM, {
      area: 'suppression',
      action: 'suppression.unsubscribed',
      entityType: 'contact',
      entityId: contact.id,
      label: contact.email,
      details: {
        ...(tracked.kind === 'send'
          ? { campaignId: tracked.campaignId }
          : tracked.kind === 'run'
            ? { automationId: tracked.automationId }
            : { outboxMessageId: tracked.messageId }),
        ...(declined.count ? { prospectsDeclined: declined.count } : {}),
      },
    })
  } catch (error) {
    logger.error('Fehler bei der Abmeldung', error)
  }
}

// Zwischenseite für Links ohne gültige Signatur: das Ziel wird gezeigt, nicht automatisch geöffnet
function leavePage(target: string, acceptLanguage: string | undefined): string {
  const en = /^en\b/i.test((acceptLanguage ?? '').trim())
  const safe = escapeHtml(target)
  const text = en
    ? { lang: 'en', title: 'External link', heading: 'You are about to open an external page', go: 'Continue to' }
    : { lang: 'de', title: 'Externer Link', heading: 'Sie öffnen eine externe Seite', go: 'Weiter zu' }
  return `<!DOCTYPE html>
<html lang="${text.lang}"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${text.title}</title>
<style>
  :root{color-scheme:light dark;--bg:#dfddd7;--fg:#1a1a18;--muted:#4f4f48}
  @media (prefers-color-scheme:dark){:root{--bg:#18191b;--fg:#e9e9e6;--muted:#a3a39e}}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--fg);display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box}
  .card{max-width:520px;text-align:center}
  h1{font-size:22px;font-weight:600;margin:0 0 12px}
  p{font-size:15px;color:var(--muted);margin:0;overflow-wrap:anywhere}
  a{color:var(--fg)}
</style></head>
<body><div class="card"><h1>${text.heading}</h1><p>${text.go} <a href="${safe}" rel="noopener noreferrer">${safe}</a></p></div></body></html>`
}

// Bestätigungsseite im Stil von MixMarket, Sprache nach Browser (Deutsch oder Englisch)
function unsubscribeConfirmPage(acceptLanguage: string | undefined): string {
  const en = /^en\b/i.test((acceptLanguage ?? '').trim())
  const text = en
    ? {
        lang: 'en',
        title: 'Unsubscribed',
        heading: 'You have been unsubscribed',
        body: 'Your email address has been removed from the mailing list. You will not receive any further messages from us.',
      }
    : {
        lang: 'de',
        title: 'Abgemeldet',
        heading: 'Sie wurden abgemeldet',
        body: 'Ihre E-Mail-Adresse wurde aus dem Verteiler entfernt. Sie erhalten ab sofort keine weiteren Nachrichten von uns.',
      }
  return `<!DOCTYPE html>
<html lang="${text.lang}"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${text.title}</title>
<style>
  :root{color-scheme:light dark;--bg:#dfddd7;--fg:#1a1a18;--muted:#4f4f48;--line:rgba(26,26,24,.28)}
  @media (prefers-color-scheme:dark){:root{--bg:#18191b;--fg:#e9e9e6;--muted:#a3a39e;--line:rgba(255,255,255,.2)}}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--fg);display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box}
  .card{max-width:440px;text-align:center}
  h1{font-size:26px;font-weight:600;margin:0 0 12px;letter-spacing:-0.02em}
  p{font-size:15px;line-height:1.6;color:var(--muted);margin:0}
  .mark{width:44px;height:44px;border:1.5px solid var(--line);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:18px}
</style></head>
<body><div class="card">
  <div class="mark">&#10003;</div>
  <h1>${text.heading}</h1>
  <p>${text.body}</p>
</div></body></html>`
}
