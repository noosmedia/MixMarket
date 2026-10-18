// Routen für Zielgruppen: Merkmale, Live-Vorschau und gespeicherte Auswahlen.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'
import { CONDITIONS, evaluateCohort, filterSchema, type CohortFilter } from '../services/discovery/cohorts.js'

const cohortSchema = z.object({
  productId: z.string().min(1).optional().nullable(),
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(80),
  description: z.string().trim().max(300).optional().nullable(),
  filter: filterSchema,
})

// Gespeicherten Filter sicher lesen (ältere oder beschädigte Einträge leer behandeln)
function readFilter(raw: unknown): CohortFilter {
  const parsed = filterSchema.safeParse(raw)
  return parsed.success ? parsed.data : { searchIds: [], conditions: [] }
}

export async function cohortsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Verfügbare Merkmale mit Gruppe und Auswahlwert-Art
  app.get('/api/cohorts/conditions', async () => {
    return CONDITIONS.map((c) => ({ key: c.key, group: c.group, param: c.param ?? null }))
  })

  // Live-Vorschau: zählt passende Firmen und liefert die ersten Treffer
  app.post('/api/cohorts/preview', async (request, reply) => {
    const parsed = filterSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültiger Filter' })
    return evaluateCohort(parsed.data)
  })

  // Gespeicherte Zielgruppen eines Produkts mit aktueller Anzahl. Zielgruppen ohne
  // Produkt (aus der Zeit vor den Produkten) erscheinen überall, damit sie
  // zugeordnet oder gelöscht werden können.
  app.get('/api/cohorts', async (request) => {
    const { productId } = request.query as { productId?: string }
    const cohorts = await prisma.cohort.findMany({
      where: productId ? { OR: [{ productId }, { productId: null }] } : {},
      orderBy: { updatedAt: 'desc' },
    })
    return Promise.all(
      cohorts.map(async (c) => {
        const result = await evaluateCohort({ ...readFilter(c.filter), productId: c.productId }, 0)
        return { ...c, filter: readFilter(c.filter), count: result.count, total: result.total }
      }),
    )
  })

  // Zielgruppe anlegen
  app.post('/api/cohorts', async (request, reply) => {
    const parsed = cohortSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const cohort = await prisma.cohort.create({
      data: {
        productId: parsed.data.productId ?? null,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        filter: { searchIds: parsed.data.filter.searchIds, conditions: parsed.data.filter.conditions },
      },
    })
    void logActivity(userActor(request), {
      area: 'research',
      action: 'cohort.created',
      entityType: 'cohort',
      entityId: cohort.id,
      label: cohort.name,
    })
    return reply.code(201).send(cohort)
  })

  // Zielgruppe ändern
  app.put('/api/cohorts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = cohortSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const exists = await prisma.cohort.findUnique({ where: { id } })
    if (!exists) return reply.code(404).send({ error: 'Zielgruppe nicht gefunden' })
    const filter = { searchIds: parsed.data.filter.searchIds, conditions: parsed.data.filter.conditions }
    const cohort = await prisma.cohort.update({
      where: { id },
      data: {
        productId: parsed.data.productId ?? null,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        filter,
      },
    })
    // Der Filter erscheint als Ganzes, die einzelnen Bedingungen stehen in der Zielgruppe selbst
    const changes = changesOf(
      { ...exists, filter: JSON.stringify(readFilter(exists.filter)) },
      { productId: parsed.data.productId ?? null, name: parsed.data.name, description: parsed.data.description ?? null, filter: JSON.stringify(filter) },
    )
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'research',
        action: 'cohort.updated',
        entityType: 'cohort',
        entityId: id,
        label: cohort.name,
        details: { changes },
      })
    }
    return cohort
  })

  // Zielgruppe löschen (die Firmen bleiben erhalten)
  app.delete('/api/cohorts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const exists = await prisma.cohort.findUnique({ where: { id } })
    if (!exists) return reply.code(404).send({ error: 'Zielgruppe nicht gefunden' })
    await prisma.cohort.delete({ where: { id } })
    void logActivity(userActor(request), {
      area: 'research',
      action: 'cohort.deleted',
      entityType: 'cohort',
      entityId: id,
      label: exists.name,
    })
    return { ok: true }
  })
}
