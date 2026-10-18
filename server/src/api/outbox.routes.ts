// Routen für den Postausgang: Interessenten übernehmen, Mails prüfen, bearbeiten, freigeben,
// ablehnen, neu schreiben lassen, Ablauf beenden, Ablauf je Produkt und Versandregeln pflegen.
import type { FastifyInstance } from 'fastify'
import type { Prisma } from '../generated/prisma/client.js'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'
import {
  OPEN_STATUSES,
  enqueueProspects,
  kickGeneration,
  outboxState,
  sequenceOf,
  stopOutreach,
} from '../services/outbox.service.js'
import { htmlToText, signatureToHtml } from '../services/tracking.service.js'
import { hasFeature, proHook } from '../pro/host.js'

// Reiter der Oberfläche und die zugehörigen Zustände
const TABS = {
  review: ['review', 'generating'],
  planned: ['approved', 'waiting'],
  sent: ['sent'],
  stopped: ['rejected', 'failed', 'cancelled'],
} as const
type Tab = keyof typeof TABS

const enqueueSchema = z.object({
  productId: z.string().min(1).max(40),
  // Ohne Auswahl: alle Interessenten mit Status "Neu"
  prospectIds: z.array(z.string().max(40)).max(2000).optional(),
})

const editSchema = z.object({
  subject: z.string().trim().min(1, 'Bitte einen Betreff eingeben').max(300),
  body: z.string().trim().min(10, 'Der Text ist zu kurz').max(10000),
})

const rewriteSchema = z.object({
  hint: z.string().trim().max(1000).optional().nullable(),
})

// Anzahl und Abstände der Nachfass-Mails prüft MixMarket Pro; der Kern nimmt sie nur entgegen
const sequenceSchema = z.object({
  followUps: z.number().int().min(0).max(20).optional(),
  intervals: z.array(z.number()).max(20).optional(),
  approval: z.boolean(),
  language: z.enum(['de', 'en']),
  instructions: z.string().trim().max(2000).optional().nullable(),
})

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const rulesSchema = z
  .object({
    dailyLimit: z
      .number()
      .int()
      .min(1, 'Das Tageslimit muss mindestens 1 sein')
      .max(500, 'Das Tageslimit darf höchstens 500 sein'),
    days: z.array(z.number().int().min(1).max(7)).min(1, 'Bitte mindestens einen Versandtag wählen'),
    from: z.string().regex(TIME, 'Bitte eine Uhrzeit wie 08:00 eingeben'),
    to: z.string().regex(TIME, 'Bitte eine Uhrzeit wie 17:00 eingeben'),
    gapMinutes: z.number().int().min(1, 'Der Abstand muss mindestens 1 Minute betragen').max(240),
  })
  .refine((r) => r.from < r.to, {
    message: 'Das Versandfenster muss vor seinem Ende beginnen',
    path: ['to'],
  })

// Felder einer Nachricht für Liste und Ansicht
const LIST_INCLUDE = {
  product: { select: { id: true, name: true, outreachFollowUps: true } },
  contact: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      consent: true,
      source: true,
    },
  },
  prospect: {
    select: {
      id: true,
      status: true,
      company: { select: { id: true, name: true, city: true } },
    },
  },
} satisfies Prisma.OutboxMessageInclude

type ListRow = Prisma.OutboxMessageGetPayload<{ include: typeof LIST_INCLUDE }>

function present(m: ListRow) {
  return {
    id: m.id,
    status: m.status,
    step: m.step,
    // Nachfass-Mails gehören zu MixMarket Pro
    followUps: hasFeature('followUps') ? m.product.outreachFollowUps : 0,
    toEmail: m.toEmail,
    subject: m.subject,
    body: m.body,
    plannedAt: m.plannedAt,
    sentAt: m.sentAt,
    testMode: m.testMode,
    error: m.error,
    stopReason: m.stopReason,
    editedByUser: m.editedByUser,
    openedAt: m.openedAt,
    clickedAt: m.clickedAt,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    product: { id: m.product.id, name: m.product.name },
    company: m.prospect.company,
    prospect: { id: m.prospect.id, status: m.prospect.status },
    contact: m.contact
      ? {
          id: m.contact.id,
          email: m.contact.email,
          name: [m.contact.firstName, m.contact.lastName].filter(Boolean).join(' ') || null,
          // Kontakt aus der Recherche ohne Einwilligung: rechtlich besonders zu prüfen
          withoutConsent: !m.contact.consent,
        }
      : null,
  }
}

export async function outboxRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Nachrichten eines Reiters, optional für ein Produkt, dazu die Anzahl je Reiter und die Lage
  app.get('/api/outbox', async (request) => {
    const q = request.query as { tab?: string; productId?: string }
    const tab: Tab = q.tab && q.tab in TABS ? (q.tab as Tab) : 'review'
    const base: Prisma.OutboxMessageWhereInput = q.productId ? { productId: q.productId } : {}
    const order: Prisma.OutboxMessageOrderByWithRelationInput[] =
      tab === 'sent'
        ? [{ sentAt: 'desc' }]
        : tab === 'stopped'
          ? [{ updatedAt: 'desc' }]
          : [{ plannedAt: 'asc' }, { createdAt: 'asc' }]
    const [rows, ...counts] = await Promise.all([
      prisma.outboxMessage.findMany({
        where: { ...base, status: { in: [...TABS[tab]] } },
        include: LIST_INCLUDE,
        orderBy: order,
        take: 500,
      }),
      ...(Object.keys(TABS) as Tab[]).map((t) =>
        prisma.outboxMessage.count({
          where: { ...base, status: { in: [...TABS[t]] } },
        }),
      ),
    ])
    const tabs = Object.fromEntries((Object.keys(TABS) as Tab[]).map((t, i) => [t, counts[i] ?? 0]))
    return { items: rows.map(present), tabs, state: await outboxState() }
  })

  // Eine Nachricht samt bisherigem Verlauf des Interessenten
  app.get('/api/outbox/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const message = await prisma.outboxMessage.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    const thread = await prisma.outboxMessage.findMany({
      where: { prospectId: message.prospectId, id: { not: id } },
      include: LIST_INCLUDE,
      orderBy: [{ step: 'asc' }, { createdAt: 'asc' }],
    })
    // Was beim Versand unter den Text kommt (Signatur, Anschrift, Abmeldehinweis), damit die
    // Vorschau die Mail so zeigt, wie sie beim Empfänger ankommt
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
    const product = await prisma.product.findUnique({ where: { id: message.productId }, select: { outreachLanguage: true } })
    const en = product?.outreachLanguage === 'en'
    const appendix = {
      signature: settings?.signatureHtml?.trim() ? htmlToText(signatureToHtml(settings.signatureHtml)) : '',
      postalAddress: settings?.postalAddress?.trim() ?? '',
      unsubText:
        (en ? settings?.unsubFooterEn : settings?.unsubFooterDe) ||
        (en ? 'You no longer wish to receive emails from us?' : 'Sie möchten keine weiteren E-Mails von uns erhalten?'),
      unsubLink: en ? 'Unsubscribe here' : 'Hier abmelden',
    }
    return { ...present(message), thread: thread.map(present), appendix }
  })

  // Interessenten in den Postausgang übernehmen: die KI schreibt danach je Firma die Erstmail
  app.post('/api/outbox/enqueue', async (request, reply) => {
    const parsed = enqueueSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.code(400).send({
        error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe',
      })
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    })
    if (!settings?.aiProvider) {
      return reply.code(409).send({
        error: 'Bitte zuerst in den Einstellungen einen KI-Anbieter wählen',
        code: 'noAi',
      })
    }
    try {
      return await enqueueProspects(parsed.data.productId, userActor(request), parsed.data.prospectIds)
    } catch (error) {
      return reply.code(404).send({
        error: error instanceof Error ? error.message : 'Produkt nicht gefunden',
      })
    }
  })

  // Text bearbeiten (nur solange die Mail noch nicht verschickt ist)
  app.put('/api/outbox/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = editSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.code(400).send({
        error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe',
      })
    const message = await prisma.outboxMessage.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    if (!['review', 'approved', 'failed'].includes(message.status) || (message.status === 'failed' && !message.body)) {
      return reply.code(409).send({ error: 'Diese Mail lässt sich nicht mehr bearbeiten' })
    }
    const changes = changesOf(message, parsed.data, ['subject', 'body'])
    if (!changes.length) return present(message)
    // Eine fehlgeschlagene, aber geschriebene Mail kehrt nach dem Bearbeiten zur Freigabe zurück
    const updated = await prisma.outboxMessage.update({
      where: { id },
      data: {
        ...parsed.data,
        editedByUser: true,
        ...(message.status === 'failed' ? { status: 'review', error: null } : {}),
      },
      include: LIST_INCLUDE,
    })
    void logActivity(userActor(request), {
      area: 'outbox',
      action: 'outbox.edited',
      entityType: 'outboxMessage',
      entityId: id,
      label: message.prospect.company.name,
      details: { changes },
    })
    return present(updated)
  })

  // Freigeben: die Mail geht im nächsten erlaubten Versandfenster hinaus
  app.post('/api/outbox/:id/approve', async (request, reply) => {
    const { id } = request.params as { id: string }
    const message = await prisma.outboxMessage.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    if (message.status !== 'review') return reply.code(409).send({ error: 'Diese Mail wartet nicht auf eine Freigabe' })
    const updated = await prisma.outboxMessage.update({
      where: { id },
      data: { status: 'approved' },
      include: LIST_INCLUDE,
    })
    void logActivity(userActor(request), {
      area: 'outbox',
      action: 'outbox.approved',
      entityType: 'outboxMessage',
      entityId: id,
      label: message.prospect.company.name,
      params: { mail: message.step + 1 },
    })
    return present(updated)
  })

  // Ablehnen: diese Mail geht nicht hinaus, der Ablauf für diesen Interessenten endet
  app.post('/api/outbox/:id/reject', async (request, reply) => {
    const { id } = request.params as { id: string }
    const message = await prisma.outboxMessage.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    if (!['review', 'approved', 'failed'].includes(message.status)) {
      return reply.code(409).send({ error: 'Diese Mail lässt sich nicht mehr ablehnen' })
    }
    await prisma.outboxMessage.update({
      where: { id },
      data: { status: 'rejected' },
    })
    await stopOutreach({ prospectId: message.prospectId }, 'rejected')
    void logActivity(userActor(request), {
      area: 'outbox',
      action: 'outbox.rejected',
      entityType: 'outboxMessage',
      entityId: id,
      label: message.prospect.company.name,
      params: { mail: message.step + 1 },
    })
    return { ok: true }
  })

  // Neu schreiben lassen, auf Wunsch mit einem Hinweis an die KI
  app.post('/api/outbox/:id/rewrite', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = rewriteSchema.safeParse(request.body ?? {})
    if (!parsed.success)
      return reply.code(400).send({
        error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe',
      })
    const message = await prisma.outboxMessage.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    if (!['review', 'approved', 'failed'].includes(message.status)) {
      return reply.code(409).send({ error: 'Diese Mail lässt sich nicht mehr neu schreiben' })
    }
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    })
    if (!settings?.aiProvider) {
      return reply.code(409).send({
        error: 'Bitte zuerst in den Einstellungen einen KI-Anbieter wählen',
        code: 'noAi',
      })
    }
    const updated = await prisma.outboxMessage.update({
      where: { id },
      data: {
        status: 'generating',
        error: null,
        rewriteHint: parsed.data.hint || null,
      },
      include: LIST_INCLUDE,
    })
    void logActivity(userActor(request), {
      area: 'outbox',
      action: 'outbox.rewriteRequested',
      entityType: 'outboxMessage',
      entityId: id,
      label: message.prospect.company.name,
      ...(parsed.data.hint ? { details: { hint: parsed.data.hint } } : {}),
    })
    kickGeneration()
    return present(updated)
  })

  // Ablauf für diesen Interessenten von Hand beenden (alle noch offenen Mails)
  app.post('/api/outbox/:id/stop', async (request, reply) => {
    const { id } = request.params as { id: string }
    const message = await prisma.outboxMessage.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    })
    if (!message) return reply.code(404).send({ error: 'Nachricht nicht gefunden' })
    const count = await stopOutreach({ prospectId: message.prospectId }, 'manual')
    if (count) {
      void logActivity(userActor(request), {
        area: 'outbox',
        action: 'outbox.stoppedManually',
        entityType: 'prospect',
        entityId: message.prospectId,
        label: message.prospect.company.name,
        params: { count },
      })
    }
    return { stopped: count }
  })

  // Ablauf eines Produkts lesen und ändern
  app.get('/api/outbox/sequence/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string }
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })
    if (!product) return reply.code(404).send({ error: 'Produkt nicht gefunden' })
    return sequenceOf(product)
  })

  app.put('/api/outbox/sequence/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string }
    const parsed = sequenceSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.code(400).send({
        error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe',
      })
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })
    if (!product) return reply.code(404).send({ error: 'Produkt nicht gefunden' })
    const d = parsed.data
    const data: Record<string, unknown> = {
      outreachApproval: d.approval,
      outreachLanguage: d.language,
      outreachInstructions: d.instructions || null,
    }
    // Nachfass-Mails (MixMarket Pro): ohne Pro nur ausschalten möglich
    if (d.followUps !== undefined) {
      if (d.followUps > 0) {
        const check = proHook<(input: { followUps: number; intervals: number[] }) => { error: string } | { followUps: number; intervals: string }>(
          'followUps.sequenceInput',
        )
        if (!check) return reply.code(403).send({ error: 'Nachfass-Mails gehören zu MixMarket Pro', code: 'pro' })
        const result = check({ followUps: d.followUps, intervals: d.intervals ?? [] })
        if ('error' in result) return reply.code(400).send({ error: result.error })
        data.outreachFollowUps = result.followUps
        data.outreachIntervals = result.intervals || product.outreachIntervals
      } else {
        data.outreachFollowUps = 0
      }
    }
    const followUpsAfter = (data.outreachFollowUps as number | undefined) ?? product.outreachFollowUps
    const updated = await prisma.product.update({
      where: { id: productId },
      data,
    })
    // Weniger Nachfass-Mails als zuvor: schon vorgemerkte, nun überzählige Schritte entfallen
    const dropped = await prisma.outboxMessage.updateMany({
      where: {
        productId,
        step: { gt: followUpsAfter },
        status: { in: [...OPEN_STATUSES] },
      },
      data: { status: 'cancelled', stopReason: 'manual' },
    })
    const changes = changesOf(product, data)
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'outbox',
        action: 'outbox.sequenceUpdated',
        entityType: 'product',
        entityId: productId,
        label: product.name,
        details: {
          changes,
          ...(dropped.count ? { dropped: dropped.count } : {}),
        },
      })
    }
    return sequenceOf(updated)
  })

  // Versandregeln lesen und ändern
  app.get('/api/outbox/rules', async () => (await outboxState()).rules)

  app.put('/api/outbox/rules', async (request, reply) => {
    const parsed = rulesSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.code(400).send({
        error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe',
      })
    const before = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    })
    const r = parsed.data
    const data = {
      outboxDailyLimit: r.dailyLimit,
      outboxDays: [...new Set(r.days)].sort().join(','),
      outboxFrom: r.from,
      outboxTo: r.to,
      outboxGapMinutes: r.gapMinutes,
    }
    await prisma.settings.update({ where: { id: 'singleton' }, data })
    const changes = changesOf(before, data)
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'outbox',
        action: 'outbox.rulesUpdated',
        details: { changes },
      })
    }
    return (await outboxState()).rules
  })
}
