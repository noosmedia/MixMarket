// Routen für Kampagnen: anlegen, planen, sofort versenden, Empfänger zählen.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'
import { executeCampaign, pauseCampaign, recipientCheck } from '../services/campaign.service.js'
import { STOPPED_MESSAGE, isSendingStopped } from '../services/control.service.js'

const campaignSchema = z.object({
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(200),
  subject: z.string().trim().min(1, 'Bitte einen Betreff eingeben').max(300),
  fromName: z.string().trim().min(1, 'Bitte einen Absendernamen eingeben').max(120),
  fromEmail: z.string().trim().email('Bitte eine gültige Absenderadresse eingeben'),
  templateId: z.string().optional().nullable(),
  listIds: z.array(z.string()).default([]),
  scheduledAt: z.string().datetime('Ungültiger Zeitpunkt').optional().nullable(),
})

// Kampagnen, die noch nicht versendet werden oder wurden, lassen sich bearbeiten, planen und versenden
const OPEN_STATUSES = ['draft', 'scheduled', 'cancelled', 'paused']

// Vor Versand und Planung: Vorlage und mindestens ein Empfänger sind nötig
async function readyToSend(id: string): Promise<string | null> {
  const campaign = await prisma.campaign.findUnique({ where: { id }, select: { templateId: true, status: true } })
  if (!campaign) return 'Kampagne nicht gefunden'
  if (!OPEN_STATUSES.includes(campaign.status)) return 'Diese Kampagne wird bereits versendet oder ist abgeschlossen'
  if (!campaign.templateId) return 'Bitte zuerst eine Vorlage wählen'
  const { count } = await recipientCheck(id)
  if (count === 0) return 'Die gewählten Listen enthalten keine Empfänger, an die versendet werden darf'
  return null
}

// Felder einer Kampagne, die im Protokoll als Änderung erscheinen
const CAMPAIGN_FIELDS = ['name', 'subject', 'fromName', 'fromEmail', 'templateId', 'scheduledAt']

export async function campaignsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Versand, der beim letzten Beenden des Servers noch lief, pausieren; er kann fortgesetzt werden
  const interrupted = await prisma.campaign.findMany({ where: { status: 'sending' }, select: { id: true } })
  for (const c of interrupted) await pauseCampaign(c.id, 'Der Server wurde während des Versands beendet')

  // Alle Kampagnen mit Listen
  app.get('/api/campaigns', async () => {
    return prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lists: { include: { list: true } }, template: { select: { name: true } } },
    })
  })

  app.get('/api/campaigns/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const c = await prisma.campaign.findUnique({
      where: { id },
      include: { lists: { include: { list: true } }, template: true },
    })
    if (!c) return reply.code(404).send({ error: 'Kampagne nicht gefunden' })
    return c
  })

  // Voraussichtliche Empfängerzahl (nach Abzug der Sperrliste) samt Hinweisen vor dem Versand
  app.get('/api/campaigns/:id/recipients', async (request) => {
    const { id } = request.params as { id: string }
    return recipientCheck(id)
  })

  // Kampagne anlegen
  app.post('/api/campaigns', async (request, reply) => {
    const parsed = campaignSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    const { listIds, scheduledAt, ...data } = parsed.data
    // Geplant werden kann nur mit Vorlage und mit einem Zeitpunkt in der Zukunft
    if (scheduledAt && !data.templateId) return reply.code(400).send({ error: 'Bitte zuerst eine Vorlage wählen' })
    if (scheduledAt && new Date(scheduledAt).getTime() <= Date.now()) {
      return reply.code(400).send({ error: 'Der geplante Zeitpunkt liegt in der Vergangenheit' })
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'scheduled' : 'draft',
        lists: { create: listIds.map((listId) => ({ listId })) },
      },
    })
    void logActivity(userActor(request), {
      area: 'campaigns',
      action: 'campaign.created',
      entityType: 'campaign',
      entityId: campaign.id,
      label: campaign.name,
    })
    if (campaign.scheduledAt) {
      void logActivity(userActor(request), {
        area: 'campaigns',
        action: 'campaign.scheduled',
        entityType: 'campaign',
        entityId: campaign.id,
        label: campaign.name,
        params: { at: campaign.scheduledAt.toISOString() },
      })
    }
    return reply.code(201).send(campaign)
  })

  // Kampagne bearbeiten
  app.put('/api/campaigns/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = campaignSchema.partial().safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    const { listIds, scheduledAt, ...data } = parsed.data

    // Alter Stand für das Protokoll, inklusive Namen der zugeordneten Listen
    const before = await prisma.campaign.findUnique({
      where: { id },
      include: { lists: { include: { list: { select: { name: true } } } } },
    })
    if (!before) return reply.code(404).send({ error: 'Kampagne nicht gefunden' })
    if (!OPEN_STATUSES.includes(before.status)) {
      return reply.code(409).send({ error: 'Eine versendete Kampagne lässt sich nicht mehr bearbeiten' })
    }

    // Zeitpunkt gesetzt: die Kampagne ist geplant; Zeitpunkt entfernt: sie wird wieder zum Entwurf
    let status: string | undefined
    if (scheduledAt !== undefined) {
      if (scheduledAt && new Date(scheduledAt).getTime() <= Date.now()) {
        return reply.code(400).send({ error: 'Der geplante Zeitpunkt liegt in der Vergangenheit' })
      }
      if (scheduledAt) {
        const templateId = data.templateId !== undefined ? data.templateId : before.templateId
        if (!templateId) return reply.code(400).send({ error: 'Bitte zuerst eine Vorlage wählen' })
        status = 'scheduled'
      } else if (before.status === 'scheduled') status = 'draft'
    }

    const campaign = await prisma.$transaction(async (tx) => {
      if (listIds) {
        await tx.campaignList.deleteMany({ where: { campaignId: id } })
        const lists = await tx.list.findMany({ where: { id: { in: [...new Set(listIds)] } }, select: { id: true } })
        await tx.campaignList.createMany({ data: lists.map((l) => ({ campaignId: id, listId: l.id })) })
      }
      return tx.campaign.update({
        where: { id },
        data: {
          ...data,
          ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
          ...(status ? { status } : {}),
        },
      })
    })
    if (status === 'scheduled' && campaign.scheduledAt) {
      void logActivity(userActor(request), {
        area: 'campaigns',
        action: 'campaign.scheduled',
        entityType: 'campaign',
        entityId: id,
        label: campaign.name,
        params: { at: campaign.scheduledAt.toISOString() },
      })
    }

    // Änderungen protokollieren
    const changes = changesOf(
      before,
      { ...data, ...(scheduledAt !== undefined ? { scheduledAt: campaign.scheduledAt } : {}) },
      CAMPAIGN_FIELDS,
    )
    if (listIds) {
      const after = await prisma.campaignList.findMany({
        where: { campaignId: id },
        include: { list: { select: { name: true } } },
      })
      const names = (rows: Array<{ list: { name: string } }>) => rows.map((r) => r.list.name).sort().join(', ')
      changes.push(...changesOf({ lists: names(before.lists) }, { lists: names(after) }))
    }
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'campaigns',
        action: 'campaign.updated',
        entityType: 'campaign',
        entityId: id,
        label: campaign.name,
        details: { changes },
      })
    }
    return campaign
  })

  // Kampagne planen (Status auf scheduled setzen)
  app.post('/api/campaigns/:id/schedule', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { scheduledAt } = request.body as { scheduledAt: string }
    if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
      return reply.code(400).send({ error: 'Bitte einen Zeitpunkt wählen' })
    }
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      return reply.code(400).send({ error: 'Der geplante Zeitpunkt liegt in der Vergangenheit' })
    }
    const problem = await readyToSend(id)
    if (problem) return reply.code(400).send({ error: problem })
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { scheduledAt: new Date(scheduledAt), status: 'scheduled' },
    })
    void logActivity(userActor(request), {
      area: 'campaigns',
      action: 'campaign.scheduled',
      entityType: 'campaign',
      entityId: id,
      label: campaign.name,
      params: { at: campaign.scheduledAt?.toISOString() ?? scheduledAt },
    })
    return campaign
  })

  // Sofort versenden (laeuft im Hintergrund)
  app.post('/api/campaigns/:id/send', async (request, reply) => {
    const { id } = request.params as { id: string }
    const campaign = await prisma.campaign.findUnique({ where: { id } })
    if (!campaign) return reply.code(404).send({ error: 'Kampagne nicht gefunden' })
    const problem = await readyToSend(id)
    if (problem) return reply.code(400).send({ error: problem })
    if (await isSendingStopped()) return reply.code(409).send({ error: STOPPED_MESSAGE, code: 'stopped' })

    // Versand asynchron starten, sofort antworten
    void logActivity(userActor(request), {
      area: 'campaigns',
      action: 'campaign.sendRequested',
      entityType: 'campaign',
      entityId: id,
      label: campaign.name,
    })
    void executeCampaign(id)
    return reply.send({ ok: true, message: 'Versand gestartet' })
  })

  // Planung aufheben: die Kampagne wird wieder zum Entwurf und lässt sich bearbeiten und neu planen
  app.post('/api/campaigns/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.campaign.findUnique({ where: { id }, select: { status: true } })
    if (!existing) return reply.code(404).send({ error: 'Kampagne nicht gefunden' })
    if (existing.status !== 'scheduled') return reply.code(409).send({ error: 'Die Kampagne ist nicht geplant' })
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'draft', scheduledAt: null },
    })
    void logActivity(userActor(request), {
      area: 'campaigns',
      action: 'campaign.cancelled',
      entityType: 'campaign',
      entityId: id,
      label: campaign.name,
    })
    return campaign
  })

  app.delete('/api/campaigns/:id', async (request) => {
    const { id } = request.params as { id: string }
    const before = await prisma.campaign.findUnique({ where: { id }, select: { name: true } })
    // Automatisierungen mit dieser Quellkampagne anhalten, sonst gälten sie danach für alle Kampagnen
    const dependent = await prisma.automation.findMany({ where: { sourceCampaignId: id, active: true }, select: { id: true, name: true } })
    if (dependent.length) {
      await prisma.automation.updateMany({ where: { id: { in: dependent.map((a) => a.id) } }, data: { active: false } })
      for (const a of dependent) {
        void logActivity(userActor(request), {
          area: 'automations',
          action: 'automation.toggled',
          entityType: 'automation',
          entityId: a.id,
          label: a.name,
          params: { active: false },
          details: { reason: 'sourceCampaignDeleted', campaign: before?.name ?? id },
        })
      }
    }
    await prisma.campaign.delete({ where: { id } })
    void logActivity(userActor(request), {
      area: 'campaigns',
      action: 'campaign.deleted',
      entityType: 'campaign',
      entityId: id,
      label: before?.name ?? null,
    })
    return { ok: true }
  })
}
