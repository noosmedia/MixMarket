// Routen der KI-Bewertung: Einstellungen, Verbindungsprüfung und Bewertungsläufe.
import type { FastifyInstance } from 'fastify'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'
import { AI_PROVIDERS, isAiProviderKey } from '../services/ai/providers.js'
import { runScoringJob, selectCompaniesForScoring } from '../services/ai/scoring.js'
import { filterSchema } from '../services/discovery/cohorts.js'

// Einstellungen lesen (Singleton anlegen, falls noch nicht vorhanden)
async function loadSettings() {
  return (
    (await prisma.settings.findUnique({ where: { id: 'singleton' } })) ??
    (await prisma.settings.create({ data: { id: 'singleton' } }))
  )
}

// Modelle, die das jeweilige Abo anbietet, für die Auswahl in den Einstellungen.
// Claude: Kurznamen, die Claude Code selbst auf das neueste Modell der Reihe auflöst.
// ChatGPT: die Liste, die Codex für das angemeldete Abo zwischenspeichert (nur gelesen).
const CLAUDE_MODELS = [
  { value: 'opus', label: 'Opus' },
  { value: 'sonnet', label: 'Sonnet' },
  { value: 'haiku', label: 'Haiku' },
]
async function codexModels(): Promise<Array<{ value: string; label: string }>> {
  try {
    const home = process.env.CODEX_HOME || join(homedir(), '.codex')
    const data = JSON.parse(await readFile(join(home, 'models_cache.json'), 'utf8')) as {
      models?: Array<{ slug?: string; display_name?: string; visibility?: string; priority?: number }>
    }
    return (data.models ?? [])
      .filter((m) => m.slug && m.visibility === 'list' && /^[A-Za-z0-9._:-]+$/.test(m.slug))
      .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
      .map((m) => ({ value: m.slug as string, label: m.display_name || (m.slug as string) }))
  } catch {
    return []
  }
}

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Unterbrochene Läufe nach einem Neustart als Fehler markieren
  await prisma.scoringJob.updateMany({
    where: { status: 'running' },
    data: { status: 'error', error: 'Unterbrochen, weil der Server neu gestartet wurde', finishedAt: new Date() },
  })

  app.get('/api/ai/settings', async () => {
    const s = await loadSettings()
    return { provider: s.aiProvider, model: s.aiModel ?? '' }
  })

  // Auswahlliste der Modelle je Abo
  app.get('/api/ai/models', async (request) => {
    const { provider } = request.query as { provider?: string }
    return { models: provider === 'claude' ? CLAUDE_MODELS : provider === 'codex' ? await codexModels() : [] }
  })

  app.put('/api/ai/settings', async (request, reply) => {
    const parsed = z
      .object({
        provider: z.enum(['claude', 'codex']).nullable().optional(),
        // Modellname nur aus erlaubten Zeichen, damit nichts Fremdes an das Programm geht
        // Erstes Zeichen kein Bindestrich, damit der Name nie als Programmoption gelesen wird
        model: z.string().trim().max(60).regex(/^(?:[A-Za-z0-9][A-Za-z0-9._:\-]*)?$/, 'Ungültiger Modellname').optional(),
      })
      .safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const d = parsed.data
    const before = await loadSettings()
    const after = await prisma.settings.update({
      where: { id: 'singleton' },
      data: {
        ...(d.provider !== undefined ? { aiProvider: d.provider } : {}),
        ...(d.model !== undefined ? { aiModel: d.model || null } : {}),
      },
    })
    const changes = changesOf(before, after, ['aiProvider', 'aiModel'])
    if (changes.length) {
      void logActivity(userActor(request), { area: 'ai', action: 'ai.settingsUpdated', details: { changes } })
    }
    return { ok: true }
  })

  // Verbindung prüfen (Claude: kurze Testanfrage, Codex: Anmeldestatus)
  app.post('/api/ai/check', async (request, reply) => {
    const body = request.body as { provider?: string } | null
    const s = await loadSettings()
    const key = body?.provider ?? s.aiProvider
    if (!isAiProviderKey(key)) return reply.code(400).send({ error: 'Bitte zuerst einen KI-Anbieter wählen' })
    const result = await AI_PROVIDERS[key].check(s.aiModel)
    void logActivity(userActor(request), {
      area: 'ai',
      action: 'ai.tested',
      level: result.ok ? 'info' : 'warning',
      params: { provider: key, ok: result.ok },
      details: { message: result.message },
    })
    return result
  })

  // Bewertungslauf für eine Zielgruppe starten
  app.post('/api/ai/score', async (request, reply) => {
    const parsed = z
      .object({
        productId: z.string().min(1),
        filter: filterSchema,
        cohortId: z.string().optional().nullable(),
        rescore: z.boolean().optional(),
      })
      .safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Eingabe' })
    const s = await loadSettings()
    if (!isAiProviderKey(s.aiProvider)) {
      return reply.code(400).send({ error: 'Bitte zuerst in den Einstellungen einen KI-Anbieter wählen' })
    }
    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } })
    if (!product) return reply.code(400).send({ error: 'Bitte zuerst ein Produkt wählen' })
    const running = await prisma.scoringJob.count({ where: { status: 'running' } })
    if (running > 0) return reply.code(409).send({ error: 'Es läuft bereits eine KI-Bewertung. Bitte warten, bis sie fertig ist.' })

    const { todo, skipped, notProfiled, hash } = await selectCompaniesForScoring(parsed.data.filter, product, parsed.data.rescore ?? false)
    if (todo.length === 0) {
      return reply.code(400).send({
        error: notProfiled > 0 && skipped === 0
          ? 'In dieser Auswahl ist keine durchleuchtete Firma. Bitte die Firmen zuerst durchleuchten.'
          : 'Alle durchleuchteten Firmen dieser Auswahl sind bereits aktuell bewertet.',
      })
    }
    const job = await prisma.scoringJob.create({
      data: { cohortId: parsed.data.cohortId ?? null, productId: product.id, provider: s.aiProvider, total: todo.length, skipped },
    })
    void logActivity(userActor(request), {
      area: 'ai',
      action: 'scoring.started',
      entityType: 'scoringJob',
      entityId: job.id,
      label: product.name,
      params: { total: todo.length, provider: s.aiProvider },
    })
    void runScoringJob(job.id, todo, product.id, hash)
    return reply.code(201).send({ ...job, notProfiled })
  })

  // Neuester Lauf eines Produkts (für die Fortschrittsanzeige)
  app.get('/api/ai/jobs/latest', async (request) => {
    const { productId } = request.query as { productId?: string }
    return prisma.scoringJob.findFirst({ where: productId ? { productId } : {}, orderBy: { createdAt: 'desc' } })
  })

  // Lauf abbrechen (greift zwischen zwei Anfragen)
  app.post('/api/ai/jobs/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string }
    const job = await prisma.scoringJob.findUnique({ where: { id } })
    if (!job) return reply.code(404).send({ error: 'Lauf nicht gefunden' })
    if (job.status !== 'running') return reply.code(409).send({ error: 'Der Lauf ist bereits beendet' })
    await prisma.scoringJob.update({ where: { id }, data: { cancelRequested: true } })
    const product = job.productId
      ? await prisma.product.findUnique({ where: { id: job.productId }, select: { name: true } })
      : null
    void logActivity(userActor(request), {
      area: 'ai',
      action: 'scoring.cancelled',
      entityType: 'scoringJob',
      entityId: id,
      label: product?.name ?? null,
    })
    return { ok: true }
  })
}
