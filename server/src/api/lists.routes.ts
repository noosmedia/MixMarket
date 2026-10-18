// Routen für Listen: auflisten, anlegen, bearbeiten, löschen,
// Kontakte hinzufügen oder entfernen.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'

const listSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(['normal', 'unsubscribed', 'bounced', 'complained']).optional(),
  color: z.string().optional().nullable(),
})

export async function listsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Alle Listen mit Kontaktanzahl
  app.get('/api/lists', async () => {
    const lists = await prisma.list.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { contacts: true } }, product: { select: { name: true } } },
    })
    return lists.map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      type: l.type,
      color: l.color,
      productId: l.productId,
      productName: l.product?.name ?? null,
      contactCount: l._count.contacts,
      createdAt: l.createdAt,
    }))
  })

  // Liste anlegen
  app.post('/api/lists', async (request, reply) => {
    const parsed = listSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    const list = await prisma.list.create({ data: parsed.data })
    void logActivity(userActor(request), {
      area: 'lists',
      action: 'list.created',
      entityType: 'list',
      entityId: list.id,
      label: list.name,
    })
    return reply.code(201).send(list)
  })

  // Liste bearbeiten
  app.put('/api/lists/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = listSchema.partial().safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    const before = await prisma.list.findUnique({ where: { id } })
    const list = await prisma.list.update({ where: { id }, data: parsed.data })
    const changes = changesOf(before, parsed.data)
    if (before && changes.length) {
      void logActivity(userActor(request), {
        area: 'lists',
        action: 'list.updated',
        entityType: 'list',
        entityId: id,
        label: list.name,
        details: { changes },
      })
    }
    return list
  })

  // Liste löschen
  app.delete('/api/lists/:id', async (request) => {
    const { id } = request.params as { id: string }
    const before = await prisma.list.findUnique({ where: { id }, select: { name: true } })
    await prisma.list.delete({ where: { id } })
    void logActivity(userActor(request), {
      area: 'lists',
      action: 'list.deleted',
      entityType: 'list',
      entityId: id,
      label: before?.name ?? null,
    })
    return { ok: true }
  })

  // Kontakte zu einer Liste hinzufügen
  app.post('/api/lists/:id/contacts', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = z.object({ contactIds: z.array(z.string().max(40)).max(10000) }).safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Eingabe' })
    const list = await prisma.list.findUnique({ where: { id }, select: { name: true } })
    if (!list) return reply.code(404).send({ error: 'Liste nicht gefunden' })

    // Nur vorhandene Kontakte, die noch nicht in der Liste sind; Doppelte in der Anfrage zählen einmal
    const wanted = [...new Set(parsed.data.contactIds)]
    const [existingContacts, already] = await Promise.all([
      prisma.contact.findMany({ where: { id: { in: wanted } }, select: { id: true } }),
      prisma.contactList.findMany({ where: { listId: id, contactId: { in: wanted } }, select: { contactId: true } }),
    ])
    const inList = new Set(already.map((a) => a.contactId))
    const fresh = existingContacts.map((c) => c.id).filter((contactId) => !inList.has(contactId))
    if (fresh.length) {
      await prisma.contactList.createMany({ data: fresh.map((contactId) => ({ contactId, listId: id })) })
      void logActivity(userActor(request), {
        area: 'lists',
        action: 'list.contactsAdded',
        entityType: 'list',
        entityId: id,
        label: list.name,
        params: { count: fresh.length },
      })
    }
    return { ok: true, added: fresh.length, already: inList.size }
  })

  // Kontakt aus Liste entfernen
  app.delete('/api/lists/:id/contacts/:contactId', async (request) => {
    const { id, contactId } = request.params as { id: string; contactId: string }
    const removed = await prisma.contactList.deleteMany({ where: { listId: id, contactId } })
    if (removed.count > 0) {
      const list = await prisma.list.findUnique({ where: { id }, select: { name: true } })
      void logActivity(userActor(request), {
        area: 'lists',
        action: 'list.contactsRemoved',
        entityType: 'list',
        entityId: id,
        label: list?.name ?? null,
        params: { count: removed.count },
      })
    }
    return { ok: true }
  })
}
