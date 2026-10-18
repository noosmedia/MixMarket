// Routen für Gespräche: eingegangene Antworten je Kontakt, ganzer Verlauf, Einordnung ändern,
// erledigt markieren, Antwortentwürfe schreiben lassen, bearbeiten, senden und verwerfen.
import type { FastifyInstance } from 'fastify'
import type { Prisma } from '../generated/prisma/client.js'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { logActivity, userActor } from '../services/activity.service.js'
import { loadImapConfig, loadSmtpConfig } from '../services/mailer.service.js'
import { isAiProviderKey } from '../services/ai/providers.js'
import { INBOX_CATEGORIES, applyCategory, pollInbox, replySubject, sendReply, stripQuoted } from '../services/inbox.service.js'
import { composeBody } from '../services/outbox.service.js'

const FILTERS = ['open', 'all', 'bounce'] as const
type Filter = (typeof FILTERS)[number]

const patchSchema = z.object({ category: z.enum(INBOX_CATEGORIES, { errorMap: () => ({ message: 'Unbekannte Einordnung' }) }) })
const replySchema = z.object({
  subject: z.string().trim().min(1, 'Bitte einen Betreff eingeben').max(300),
  body: z.string().trim().min(10, 'Der Text ist zu kurz').max(10000),
})

// Gespräch einer Nachricht: alle Nachrichten desselben Kontakts, sonst derselben Absenderadresse
function conversationWhere(m: {
  contactId: string | null
  fromEmail: string
  bounceRecipient: string | null
}): Prisma.InboxMessageWhereInput {
  if (m.contactId) return { contactId: m.contactId }
  return m.bounceRecipient ? { bounceRecipient: m.bounceRecipient } : { fromEmail: m.fromEmail, contactId: null }
}

export async function inboxRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Lage: offene Antworten (für die Kopfleiste), Abrufstand, Postfach und KI eingerichtet
  app.get('/api/inbox/summary', async () => {
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
    const [open, bounces] = await Promise.all([
      prisma.inboxMessage.count({ where: { status: 'open', kind: 'reply' } }),
      prisma.inboxMessage.count({ where: { status: 'open', kind: 'bounce' } }),
    ])
    return {
      open,
      bounces,
      imapReady: (await loadImapConfig()) !== null,
      testMode: (await loadSmtpConfig()) === null,
      aiReady: isAiProviderKey(settings?.aiProvider),
      checkedAt: settings?.imapCheckedAt ?? null,
      lastError: settings?.imapLastError ?? null,
    }
  })

  // Gespräche: je Kontakt die jüngste Nachricht, dazu Anzahl offener Nachrichten
  app.get('/api/inbox', async (request) => {
    const q = request.query as { filter?: string }
    const filter: Filter = FILTERS.includes(q.filter as Filter) ? (q.filter as Filter) : 'open'
    const where: Prisma.InboxMessageWhereInput =
      filter === 'bounce'
        ? { kind: 'bounce' }
        : filter === 'open'
          ? { status: 'open', kind: { not: 'bounce' } }
          : { kind: { not: 'bounce' } }
    const rows = await prisma.inboxMessage.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: 1000,
      include: {
        contact: { select: { id: true, email: true, firstName: true, lastName: true, company: true, status: true } },
        prospect: {
          select: { id: true, status: true, product: { select: { id: true, name: true } }, company: { select: { name: true } } },
        },
        replies: { where: { status: { in: ['review', 'generating', 'failed'] } }, select: { id: true, status: true } },
      },
    })
    const groups = new Map<string, { latest: (typeof rows)[number]; open: number; total: number; drafts: number }>()
    for (const m of rows) {
      const key = m.contactId ?? `mail:${m.bounceRecipient ?? m.fromEmail}`
      const group = groups.get(key)
      if (!group) groups.set(key, { latest: m, open: m.status === 'open' ? 1 : 0, total: 1, drafts: m.replies.length })
      else {
        group.total++
        if (m.status === 'open') group.open++
        group.drafts += m.replies.length
      }
    }
    const items = [...groups.values()].map(({ latest: m, open, total, drafts }) => ({
      id: m.id,
      kind: m.kind,
      status: m.status,
      category: m.category,
      summary: m.summary,
      aiStatus: m.aiStatus,
      subject: m.subject,
      preview: m.text.replace(/\s+/g, ' ').slice(0, 220),
      fromEmail: m.fromEmail,
      fromName: m.fromName,
      receivedAt: m.receivedAt,
      bounceType: m.bounceType,
      bounceRecipient: m.bounceRecipient,
      contact: m.contact
        ? {
            id: m.contact.id,
            email: m.contact.email,
            name: [m.contact.firstName, m.contact.lastName].filter(Boolean).join(' ') || null,
            company: m.contact.company,
            status: m.contact.status,
          }
        : null,
      prospect: m.prospect
        ? { id: m.prospect.id, status: m.prospect.status, product: m.prospect.product, company: m.prospect.company.name }
        : null,
      open,
      total,
      drafts,
    }))
    return { items }
  })

  // Ganzer Verlauf eines Gesprächs: eigene Mails aus Postausgang und Kampagnen, Antworten, eigene Antworten
  app.get('/api/inbox/:id/thread', async (request, reply) => {
    const { id } = request.params as { id: string }
    const message = await prisma.inboxMessage.findUnique({ where: { id } })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    const contact = message.contactId ? await prisma.contact.findUnique({ where: { id: message.contactId } }) : null
    const inbound = await prisma.inboxMessage.findMany({
      where: conversationWhere(message),
      orderBy: { receivedAt: 'asc' },
      include: { replies: { where: { status: { not: 'discarded' } }, orderBy: { createdAt: 'asc' } } },
    })
    type Entry = { type: 'out' | 'campaign' | 'in' | 'reply'; id: string; at: Date } & Record<string, unknown>
    const entries: Entry[] = []
    if (contact) {
      const outbox = await prisma.outboxMessage.findMany({ where: { contactId: contact.id, status: 'sent' } })
      for (const o of outbox) {
        entries.push({
          type: 'out',
          id: o.id,
          at: o.sentAt ?? o.createdAt,
          subject: o.subject,
          body: o.body,
          step: o.step,
          testMode: o.testMode,
        })
      }
      const sends = await prisma.send.findMany({
        where: { contactId: contact.id, status: { in: ['sent', 'bounced'] } },
        include: { campaign: true },
      })
      for (const s of sends) {
        entries.push({
          type: 'campaign',
          id: s.id,
          at: s.sentAt ?? s.createdAt,
          subject: s.campaign.subject,
          campaign: s.campaign.name,
        })
      }
    }
    for (const m of inbound) {
      entries.push({
        type: 'in',
        id: m.id,
        at: m.receivedAt,
        subject: m.subject,
        text: m.text,
        // Neue Antwort ohne zitierte frühere Mails
        main: stripQuoted(m.text),
        kind: m.kind,
        status: m.status,
        category: m.category,
        summary: m.summary,
        aiStatus: m.aiStatus,
        aiError: m.aiError,
        fromEmail: m.fromEmail,
        fromName: m.fromName,
        bounceType: m.bounceType,
        bounceRecipient: m.bounceRecipient,
      })
      for (const r of m.replies) {
        if (r.status === 'sent') {
          entries.push({
            type: 'reply',
            id: r.id,
            at: r.sentAt ?? r.updatedAt,
            subject: r.subject,
            body: r.body,
            testMode: r.testMode,
          })
        }
      }
    }
    entries.sort((a, b) => a.at.getTime() - b.at.getTime())
    // Offener Entwurf: zur jüngsten Antwort, sonst zu einer älteren
    const drafts = inbound.flatMap((m) =>
      m.replies.filter((r) => r.status !== 'sent').map((r) => ({ ...r, inboxMessageId: m.id })),
    )
    const draft = drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null
    const prospectId = message.prospectId ?? inbound.find((m) => m.prospectId)?.prospectId ?? null
    const prospect = prospectId
      ? await prisma.prospect.findUnique({
          where: { id: prospectId },
          include: {
            company: { select: { id: true, name: true, city: true, website: true } },
            product: { select: { id: true, name: true } },
          },
        })
      : null
    const blocked = await prisma.suppression.findUnique({
      where: { email: (contact?.email ?? message.bounceRecipient ?? message.fromEmail).toLowerCase() },
    })
    // Ziel einer neuen Antwort: die jüngste echte Antwort des Gesprächs
    const replyTarget = [...inbound].reverse().find((m) => m.kind === 'reply') ?? null
    return {
      id: message.id,
      contact: contact
        ? {
            id: contact.id,
            email: contact.email,
            name: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || null,
            company: contact.company,
            status: contact.status,
            consent: contact.consent,
          }
        : null,
      prospect: prospect
        ? { id: prospect.id, status: prospect.status, company: prospect.company, product: prospect.product }
        : null,
      suppressed: blocked ? blocked.reason : null,
      replyTargetId: replyTarget?.id ?? null,
      open: inbound.filter((m) => m.status === 'open').length,
      entries,
      draft: draft
        ? {
            id: draft.id,
            inboxMessageId: draft.inboxMessageId,
            status: draft.status,
            subject: draft.subject,
            body: draft.body,
            error: draft.error,
            editedByUser: draft.editedByUser,
            updatedAt: draft.updatedAt,
          }
        : null,
    }
  })

  // Einordnung von Hand ändern; Folgen wie bei der KI (Interessent, Sperrliste)
  app.patch('/api/inbox/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = patchSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const message = await prisma.inboxMessage.findUnique({ where: { id } })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    if (message.kind !== 'reply') return reply.code(409).send({ error: 'Nur Antworten lassen sich einordnen' })
    await prisma.inboxMessage.update({ where: { id }, data: { category: parsed.data.category, aiStatus: 'done', aiError: null } })
    await applyCategory(message, parsed.data.category)
    void logActivity(userActor(request), {
      area: 'inbox',
      action: 'inbox.categoryChanged',
      entityType: 'inboxMessage',
      entityId: id,
      label: message.fromEmail,
      params: { category: parsed.data.category },
      details: { changes: [{ field: 'category', from: message.category, to: parsed.data.category }] },
    })
    return { ok: true }
  })

  // Gespräch erledigt oder wieder offen (alle Nachrichten des Gesprächs)
  app.post('/api/inbox/:id/done', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { open } = (request.body ?? {}) as { open?: boolean }
    const message = await prisma.inboxMessage.findUnique({ where: { id } })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    if (open) {
      await prisma.inboxMessage.update({ where: { id }, data: { status: 'open' } })
    } else {
      await prisma.inboxMessage.updateMany({ where: { ...conversationWhere(message), status: 'open' }, data: { status: 'done' } })
    }
    void logActivity(userActor(request), {
      area: 'inbox',
      action: open ? 'inbox.reopened' : 'inbox.done',
      entityType: 'inboxMessage',
      entityId: id,
      label: message.fromEmail,
    })
    return { ok: true }
  })

  // Selbst schreiben: leerer Entwurf mit Anrede und Gruß
  app.post('/api/inbox/:id/compose', async (request, reply) => {
    const { id } = request.params as { id: string }
    const message = await prisma.inboxMessage.findUnique({
      where: { id },
      include: { contact: true, prospect: { include: { product: true } } },
    })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    if (message.kind !== 'reply') return reply.code(409).send({ error: 'Auf diese Nachricht lässt sich nicht antworten' })
    const existing = await prisma.inboxReply.findFirst({
      where: { inboxMessageId: id, status: { in: ['review', 'failed', 'generating'] } },
    })
    if (existing) return { id: existing.id, status: existing.status }
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
    const language = message.prospect?.product.outreachLanguage === 'en' ? 'en' : 'de'
    const contact = message.contact ?? ({ firstName: null, lastName: null, salutation: null, academicTitle: null } as never)
    const sender = settings?.mailFromName || settings?.companyName || null
    const body = composeBody(contact, language, '…', sender, settings?.signatureHtml ?? null)
    const draft = await prisma.inboxReply.create({
      data: { inboxMessageId: id, subject: replySubject(message.subject), body, language, status: 'review', editedByUser: true },
    })
    return { id: draft.id, status: draft.status }
  })

  // Entwurf bearbeiten
  app.put('/api/inbox/replies/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = replySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const draft = await prisma.inboxReply.findUnique({ where: { id } })
    if (!draft) return reply.code(404).send({ error: 'Antwort nicht gefunden' })
    if (!['review', 'failed'].includes(draft.status))
      return reply.code(409).send({ error: 'Diese Antwort lässt sich nicht mehr bearbeiten' })
    await prisma.inboxReply.update({ where: { id }, data: { ...parsed.data, editedByUser: true, status: 'review', error: null } })
    return { ok: true }
  })

  // Antwort senden (sofort, ohne Versandfenster)
  app.post('/api/inbox/replies/:id/send', async (request, reply) => {
    const { id } = request.params as { id: string }
    const draft = await prisma.inboxReply.findUnique({ where: { id }, include: { message: true } })
    const result = await sendReply(id)
    if (!result.ok) return reply.code(result.status).send({ error: result.error, ...(result.code ? { code: result.code } : {}) })
    void logActivity(userActor(request), {
      area: 'inbox',
      action: result.testMode ? 'inbox.replySentTest' : 'inbox.replySent',
      entityType: 'inboxMessage',
      entityId: draft?.inboxMessageId ?? null,
      label: draft?.message.fromEmail ?? null,
    })
    return { ok: true, testMode: result.testMode }
  })

  // Entwurf verwerfen
  app.post('/api/inbox/replies/:id/discard', async (request, reply) => {
    const { id } = request.params as { id: string }
    const draft = await prisma.inboxReply.findUnique({ where: { id } })
    if (!draft) return reply.code(404).send({ error: 'Antwort nicht gefunden' })
    if (draft.status === 'sent') return reply.code(409).send({ error: 'Diese Antwort ist schon gesendet' })
    await prisma.inboxReply.update({ where: { id }, data: { status: 'discarded' } })
    return { ok: true }
  })

  // Postfach sofort abrufen
  app.post('/api/inbox/check', async () => {
    if (!(await loadImapConfig())) return { checked: false, stored: 0, code: 'noImap' }
    return pollInbox(true)
  })
}
