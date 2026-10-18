// Routen der Steuerung: Autopilot je Bereich, Not-Aus, Schwellen, "Wartet auf Sie" und Auslastung.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'
import { isAiProviderKey } from '../services/ai/providers.js'
import {
  aiPauseState,
  callsSince,
  emergencyStop,
  getQuota,
  loadSettings,
  resumeSending,
  sendsSince,
} from '../services/control.service.js'
import { loadImapConfig, loadSmtpConfig } from '../services/mailer.service.js'
import { hasFeature, proHook } from '../pro/host.js'

const controlSchema = z.object({
  autopilotResearch: z.boolean().optional(),
  autopilotWriting: z.boolean().optional(),
  autopilotMinScore: z
    .number()
    .int()
    .min(1, 'Die Mindestpassung liegt zwischen 1 und 10')
    .max(10, 'Die Mindestpassung liegt zwischen 1 und 10')
    .optional(),
  autopilotSending: z.boolean().optional(),
  autopilotReplies: z.boolean().optional(),
  bounceStopPercent: z
    .number()
    .int()
    .min(1, 'Die Grenze liegt zwischen 1 und 50 %')
    .max(50, 'Die Grenze liegt zwischen 1 und 50 %')
    .optional(),
  aiPausePercent: z
    .number()
    .int()
    .min(10, 'Die Grenze liegt zwischen 10 und 100 %')
    .max(100, 'Die Grenze liegt zwischen 10 und 100 %')
    .optional(),
})

const CONTROL_FIELDS = [
  'autopilotResearch',
  'autopilotWriting',
  'autopilotMinScore',
  'autopilotSending',
  'autopilotReplies',
  'bounceStopPercent',
  'aiPausePercent',
] as const

function controlOf(s: Awaited<ReturnType<typeof loadSettings>>) {
  return {
    autopilotResearch: s.autopilotResearch,
    autopilotWriting: s.autopilotWriting,
    autopilotMinScore: s.autopilotMinScore,
    autopilotSending: s.autopilotSending,
    autopilotReplies: s.autopilotReplies,
    bounceStopPercent: s.bounceStopPercent,
    aiPausePercent: s.aiPausePercent,
    sendingStopped: s.sendingStopped,
    sendingStoppedAt: s.sendingStoppedAt,
    sendingStopReason: s.sendingStopReason,
  }
}

export async function controlRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Kurzer Stand für den Balken auf jeder Seite: Not-Aus und KI-Pause
  app.get('/api/control/state', async () => {
    const s = await loadSettings()
    const pause = await aiPauseState(s)
    return {
      sendingStopped: s.sendingStopped,
      sendingStoppedAt: s.sendingStoppedAt,
      sendingStopReason: s.sendingStopReason,
      aiPaused: pause.paused,
      aiPausedUntil: pause.until,
    }
  })

  // Übersicht: Steuerung, Aufgaben und Hinweise
  app.get('/api/control', async () => {
    const s = await loadSettings()
    const [review, failedOutbox, openReplies, drafts, bounces, pausedCampaigns, notices] = await Promise.all([
      prisma.outboxMessage.count({ where: { status: 'review' } }),
      prisma.outboxMessage.count({ where: { status: 'failed' } }),
      prisma.inboxMessage.count({ where: { status: 'open', kind: 'reply' } }),
      prisma.inboxReply.count({ where: { status: 'review' } }),
      prisma.inboxMessage.count({ where: { status: 'open', kind: 'bounce' } }),
      prisma.campaign.count({ where: { status: 'paused' } }),
      prisma.notice.findMany({ where: { dismissedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ])
    const pause = await aiPauseState(s)
    return {
      control: controlOf(s),
      aiPause: pause,
      tasks: {
        review,
        failedOutbox,
        openReplies,
        drafts,
        bounces,
        pausedCampaigns,
        pollError: s.imapLastError,
        imapReady: (await loadImapConfig()) !== null,
        testMode: (await loadSmtpConfig()) === null,
        aiReady: isAiProviderKey(s.aiProvider),
        // Für "Erste Schritte" nach der Ersteinrichtung
        companyReady: Boolean(s.companyName?.trim() && s.postalAddress?.trim()),
        hasProduct: (await prisma.product.count()) > 0,
        hasSearch: (await prisma.discoverySearch.count({ where: { status: 'done' } })) > 0,
      },
      notices,
    }
  })

  // Autopilot und Schwellen ändern
  app.put('/api/control', async (request, reply) => {
    const parsed = controlSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const before = await loadSettings()
    // Autopilot für Recherche und Schreiben sowie die KI in Gespräche gehören zu MixMarket Pro:
    // ohne Pro lassen sie sich nur ausschalten, nicht einschalten
    const p = parsed.data
    if (((p.autopilotResearch || p.autopilotWriting) && !hasFeature('autopilot')) || (p.autopilotReplies && !hasFeature('inboxAi'))) {
      return reply.code(403).send({ error: 'Diese Funktion gehört zu MixMarket Pro', code: 'pro' })
    }
    const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined))
    const updated = await prisma.settings.update({ where: { id: 'singleton' }, data })
    const changes = changesOf(before, data, [...CONTROL_FIELDS])
    if (changes.length) void logActivity(userActor(request), { area: 'control', action: 'control.updated', details: { changes } })
    // Eingeschalteter Autopilot beginnt sofort, nicht erst nach 10 Minuten
    if ((data.autopilotResearch && !before.autopilotResearch) || (data.autopilotWriting && !before.autopilotWriting)) {
      proHook<() => void>('autopilot.kick')?.()
    }
    return controlOf(updated)
  })

  // Not-Aus auslösen und aufheben
  app.post('/api/control/stop', async (request) => {
    await emergencyStop('manual', userActor(request))
    return controlOf(await loadSettings())
  })
  app.post('/api/control/resume', async (request) => {
    await resumeSending(userActor(request))
    return controlOf(await loadSettings())
  })

  // Hinweise als erledigt markieren
  app.post('/api/control/notices/:id/dismiss', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await prisma.notice.updateMany({ where: { id, dismissedAt: null }, data: { dismissedAt: new Date() } })
    if (!result.count) return reply.code(404).send({ error: 'Hinweis nicht gefunden' })
    return { ok: true }
  })
  app.post('/api/control/notices/dismiss-all', async () => {
    const result = await prisma.notice.updateMany({ where: { dismissedAt: null }, data: { dismissedAt: new Date() } })
    return { dismissed: result.count }
  })

  // Auslastung: Abo-Kontingente, KI-Aufrufe je Bereich, Versand und Rückläufer
  app.get('/api/control/usage', async (request) => {
    const { refresh } = request.query as { refresh?: string }
    const s = await loadSettings()
    const now = Date.now()
    const day = new Date(now - 24 * 60 * 60 * 1000)
    const week = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [claude, codex] = await Promise.all([getQuota('claude', refresh === '1'), getQuota('codex', refresh === '1')])
    const [calls24, calls7, sendsToday, sends24, outboxTestToday, hardBounces24] = await Promise.all([
      callsSince(day),
      callsSince(week),
      sendsSince(today),
      sendsSince(day),
      prisma.outboxMessage.count({ where: { status: 'sent', testMode: true, sentAt: { gte: today } } }),
      prisma.inboxMessage.count({ where: { kind: 'bounce', bounceType: 'hard', createdAt: { gte: day } } }),
    ])
    return {
      provider: isAiProviderKey(s.aiProvider) ? s.aiProvider : null,
      quotas: { claude, codex },
      aiPause: await aiPauseState(s),
      aiPausePercent: s.aiPausePercent,
      calls: { day: calls24, week: calls7 },
      sends: { today: sendsToday, day: sends24, outboxTestToday, outboxDailyLimit: s.outboxDailyLimit },
      bounces: {
        hard24: hardBounces24,
        percent24: sends24.total ? Math.round((hardBounces24 / sends24.total) * 1000) / 10 : 0,
        stopPercent: s.bounceStopPercent,
      },
    }
  })
}
