// Routen für Interessenten je Produkt: auflisten, aus Zielgruppe oder einzeln
// übernehmen, Status und Notiz pflegen, in die Kontakte übernehmen.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'
import { evaluateCohort, filterSchema } from '../services/discovery/cohorts.js'
import { contextHash } from '../services/ai/scoring.js'
import { NO_HOOK, PROSPECT_STATUSES, pickEmail, pickPerson, prospectsToContacts } from '../services/prospects.service.js'
import { stopOutreach } from '../services/outbox.service.js'

const addSchema = z.object({
  productId: z.string().min(1).max(40),
  // Entweder einzelne Firmen oder alle Firmen einer Zielgruppe
  companyIds: z.array(z.string().max(40)).max(2000).optional(),
  filter: filterSchema.optional(),
  minScore: z.number().int().min(1).max(10).optional().nullable(),
})

const updateSchema = z.object({
  status: z.enum(PROSPECT_STATUSES).optional(),
  personName: z.string().max(200).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
})

const toContactsSchema = z.object({
  productId: z.string().min(1).max(40),
  ids: z.array(z.string().max(40)).max(2000).optional(),
})

export async function prospectsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Interessenten eines Produkts mit allem, was für die Ansprache gebraucht wird
  app.get('/api/prospects', async (request, reply) => {
    const { productId } = request.query as { productId?: string }
    if (!productId) return reply.code(400).send({ error: 'Bitte ein Produkt wählen' })
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return reply.code(404).send({ error: 'Produkt nicht gefunden' })
    const hash = contextHash(product)
    const prospects = await prisma.prospect.findMany({
      where: { productId },
      include: {
        contact: { select: { id: true, email: true, consent: true } },
        // Jüngste Mail im Postausgang zeigt, wie weit die Ansprache ist
        messages: { orderBy: [{ step: 'desc' }, { createdAt: 'desc' }], take: 1, select: { id: true, status: true, step: true } },
        company: {
          include: {
            people: { orderBy: [{ isDecisionMaker: 'desc' }, { createdAt: 'asc' }] },
            signals: { where: { code: 'EMAIL' } },
            scores: { where: { productId } },
          },
        },
      },
    })
    const items = prospects.map((p) => {
      const c = p.company
      const person = pickPerson(c.people, p.personName)
      const { email, personal } = pickEmail(person, c.email, c.signals)
      const score = c.scores[0] ?? null
      return {
        id: p.id,
        status: p.status,
        notes: p.notes,
        personName: p.personName,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        contact: p.contact,
        outbox: p.messages[0] ?? null,
        company: {
          id: c.id,
          name: c.name,
          website: c.website,
          phone: c.phone,
          street: c.street,
          postalCode: c.postalCode,
          city: c.city,
          category: c.category,
        },
        people: c.people.map((x) => ({
          fullName: x.fullName,
          role: x.role,
          salutation: x.salutation,
          isDecisionMaker: x.isDecisionMaker,
        })),
        person: person ? { fullName: person.fullName, role: person.role, salutation: person.salutation } : null,
        email,
        emailPersonal: personal,
        score: score
          ? {
              score: score.score,
              reason: score.reason,
              hook: score.hook === NO_HOOK ? null : score.hook,
              stale: score.contextHash !== hash,
            }
          : null,
      }
    })
    // Höchste Passung zuerst, danach alphabetisch
    items.sort((a, b) => (b.score?.score ?? 0) - (a.score?.score ?? 0) || a.company.name.localeCompare(b.company.name, 'de'))
    return { items }
  })

  // Firmen als Interessenten übernehmen; schon vorhandene werden übersprungen
  app.post('/api/prospects', async (request, reply) => {
    const parsed = addSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const { productId, companyIds, filter, minScore } = parsed.data
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return reply.code(404).send({ error: 'Produkt nicht gefunden' })

    let ids: string[] = []
    let belowScore = 0
    if (companyIds?.length) {
      ids = companyIds
    } else if (filter) {
      // Alle Firmen der Zielgruppe, auf Wunsch erst ab einer Passung
      const cohort = await evaluateCohort({ ...filter, productId }, Number.MAX_SAFE_INTEGER)
      for (const c of cohort.items) {
        if (minScore && (c.score?.score ?? 0) < minScore) belowScore++
        else ids.push(c.id)
      }
    } else {
      return reply.code(400).send({ error: 'Keine Firmen gewählt' })
    }

    const existing = await prisma.prospect.findMany({
      where: { productId, companyId: { in: ids } },
      select: { companyId: true },
    })
    const known = new Set(existing.map((e) => e.companyId))
    const fresh = [...new Set(ids)].filter((id) => !known.has(id))
    if (fresh.length) {
      await prisma.prospect.createMany({ data: fresh.map((companyId) => ({ companyId, productId })) })
    }
    if (fresh.length) {
      void logActivity(userActor(request), {
        area: 'prospects',
        action: 'prospect.added',
        entityType: 'product',
        entityId: productId,
        label: product.name,
        params: { added: fresh.length, existing: known.size, belowScore },
      })
    }
    return { added: fresh.length, existing: known.size, belowScore }
  })

  // Status, Ansprechpartner oder Notiz ändern
  app.patch('/api/prospects/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const exists = await prisma.prospect.findUnique({ where: { id }, include: { company: { select: { name: true } } } })
    if (!exists) return reply.code(404).send({ error: 'Interessent nicht gefunden' })
    const data = parsed.data
    const update = {
      ...(data.status ? { status: data.status } : {}),
      ...(data.personName !== undefined ? { personName: data.personName || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
    }
    const prospect = await prisma.prospect.update({ where: { id }, data: update })
    // Im Gespräch, kein Interesse oder Kunde: der Ablauf im Postausgang endet
    if (data.status && ['talking', 'declined', 'customer'].includes(data.status)) {
      await stopOutreach({ prospectId: id }, 'status')
    }
    const changes = changesOf(exists, update)
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'prospects',
        action: 'prospect.updated',
        entityType: 'prospect',
        entityId: id,
        label: exists.company.name,
        details: { changes },
      })
    }
    return prospect
  })

  // Interessenten entfernen (Firma und Kontakt bleiben erhalten)
  app.delete('/api/prospects/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const exists = await prisma.prospect.findUnique({ where: { id }, include: { company: { select: { name: true } } } })
    if (!exists) return reply.code(404).send({ error: 'Interessent nicht gefunden' })
    await prisma.prospect.delete({ where: { id } })
    void logActivity(userActor(request), {
      area: 'prospects',
      action: 'prospect.removed',
      entityType: 'prospect',
      entityId: id,
      label: exists.company.name,
    })
    return { ok: true }
  })

  // Interessenten mit E-Mail in die Kontakte und die Interessentenliste des Produkts übernehmen
  app.post('/api/prospects/to-contacts', async (request, reply) => {
    const parsed = toContactsSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    try {
      const result = await prospectsToContacts(parsed.data.productId, parsed.data.ids)
      const product = await prisma.product.findUnique({ where: { id: parsed.data.productId }, select: { name: true } })
      void logActivity(userActor(request), {
        area: 'prospects',
        action: 'prospect.toContacts',
        entityType: 'product',
        entityId: parsed.data.productId,
        label: product?.name ?? null,
        params: { ...result },
      })
      return result
    } catch (error) {
      return reply.code(404).send({ error: error instanceof Error ? error.message : 'Produkt nicht gefunden' })
    }
  })
}
