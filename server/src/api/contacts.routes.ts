// Routen für Kontakte: auflisten, anlegen, bearbeiten, löschen, importieren.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'

const contactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  consent: z.boolean().optional(),
  salutation: z.enum(['herr', 'frau']).optional().nullable(),
  academicTitle: z.string().max(40).optional().nullable(),
  listIds: z.array(z.string()).optional(),
})

// Lesbarer Name eines Kontakts für das Protokoll: Vor- und Nachname, sonst die E-Mail
function contactLabel(c: { email: string; firstName?: string | null; lastName?: string | null }): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
  return name || c.email
}

// Felder eines Kontakts, die im Protokoll als Änderung erscheinen
const CONTACT_FIELDS = [
  'email',
  'firstName',
  'lastName',
  'company',
  'position',
  'website',
  'country',
  'sector',
  'notes',
  'consent',
  'salutation',
  'academicTitle',
  'status',
]

// Felder, die ein Import bei vorhandenen Kontakten ergänzt (nur wenn sie leer sind)
const IMPORT_FILL_FIELDS = [
  'firstName',
  'lastName',
  'company',
  'position',
  'website',
  'country',
  'sector',
  'notes',
  'salutation',
  'academicTitle',
] as const

export async function contactsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Auflisten mit Suche, Status-Filter und Paginierung
  app.get('/api/contacts', async (request) => {
    const q = request.query as Record<string, string>
    const search = q.search?.trim()
    const status = q.status
    const listId = q.listId
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(200, Number(q.pageSize) || 50)

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { company: { contains: search } },
      ]
    }
    if (listId) where.lists = { some: { listId } }

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: { lists: { select: { listId: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contact.count({ where }),
    ])

    return { items, total, page, pageSize }
  })

  // Einzelnen Kontakt abrufen
  app.get('/api/contacts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { lists: { include: { list: true } } },
    })
    if (!contact) return reply.code(404).send({ error: 'Kontakt nicht gefunden' })
    return contact
  })

  // Kontakt anlegen
  app.post('/api/contacts', async (request, reply) => {
    const parsed = contactSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    }
    const { listIds, ...data } = parsed.data

    const existing = await prisma.contact.findUnique({ where: { email: data.email } })
    if (existing) return reply.code(409).send({ error: 'Kontakt existiert bereits' })

    const contact = await prisma.contact.create({
      data: {
        ...data,
        source: 'manual',
        lists: listIds?.length
          ? { create: listIds.map((listId) => ({ listId })) }
          : undefined,
      },
    })
    void logActivity(userActor(request), {
      area: 'contacts',
      action: 'contact.created',
      entityType: 'contact',
      entityId: contact.id,
      label: contactLabel(contact),
    })
    return reply.code(201).send(contact)
  })

  // Kontakt bearbeiten
  app.put('/api/contacts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = contactSchema.partial().safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    }
    const { listIds, ...data } = parsed.data

    // Alter Stand für das Protokoll, inklusive Namen der zugeordneten Listen
    const before = await prisma.contact.findUnique({
      where: { id },
      include: { lists: { include: { list: { select: { name: true } } } } },
    })
    if (!before) return reply.code(404).send({ error: 'Kontakt nicht gefunden' })

    // Neue E-Mail-Adresse darf keinem anderen Kontakt gehören
    if (data.email && data.email !== before.email) {
      const taken = await prisma.contact.findUnique({ where: { email: data.email } })
      if (taken) return reply.code(409).send({ error: 'Diese E-Mail-Adresse gehört bereits zu einem anderen Kontakt' })
    }

    // Kontakt und Listenzuordnung gemeinsam ändern, damit nichts halb gespeichert bleibt
    const contact = await prisma.$transaction(async (tx) => {
      const updated = await tx.contact.update({ where: { id }, data })
      if (listIds) {
        await tx.contactList.deleteMany({ where: { contactId: id } })
        const unique = [...new Set(listIds)]
        const existingLists = await tx.list.findMany({ where: { id: { in: unique } }, select: { id: true } })
        await tx.contactList.createMany({
          data: existingLists.map((l) => ({ contactId: id, listId: l.id })),
        })
      }
      return updated
    })

    // Änderungen protokollieren
    const changes = changesOf(before, data, CONTACT_FIELDS)
    if (listIds) {
      const after = await prisma.contactList.findMany({
        where: { contactId: id },
        include: { list: { select: { name: true } } },
      })
      const names = (rows: Array<{ list: { name: string } }>) => rows.map((r) => r.list.name).sort().join(', ')
      changes.push(...changesOf({ lists: names(before.lists) }, { lists: names(after) }))
    }
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'contacts',
        action: 'contact.updated',
        entityType: 'contact',
        entityId: id,
        label: contactLabel(contact),
        details: { changes },
      })
    }
    return contact
  })

  // Status ändern (z. B. manuell abmelden)
  app.patch('/api/contacts/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: string }
    const allowed = ['active', 'unsubscribed', 'bounced', 'complained']
    if (!allowed.includes(status)) {
      return reply.code(400).send({ error: 'Ungültiger Status' })
    }
    const before = await prisma.contact.findUnique({ where: { id }, select: { status: true } })
    const contact = await prisma.contact.update({ where: { id }, data: { status } })

    // Bei Abmeldung oder Bounce zusätzlich in die Sperrliste; wieder aktiv heißt: Sperre aufheben,
    // sonst stünde der Kontakt auf aktiv und bekäme wegen der Sperrliste trotzdem keine Mails
    if (status !== 'active') {
      await prisma.suppression.upsert({
        where: { email: contact.email },
        update: { reason: status },
        create: { email: contact.email, reason: status },
      })
    } else {
      await prisma.suppression.deleteMany({ where: { email: contact.email } })
    }
    // Statuswechsel protokollieren (eigener Schlüssel, nicht in der Vorgabe)
    const changes = changesOf(before, { status })
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'contacts',
        action: 'contact.statusChanged',
        entityType: 'contact',
        entityId: id,
        label: contactLabel(contact),
        details: { changes },
      })
    }
    return contact
  })

  // Kontakt löschen
  app.delete('/api/contacts/:id', async (request) => {
    const { id } = request.params as { id: string }
    const before = await prisma.contact.findUnique({ where: { id } })
    await prisma.contact.delete({ where: { id } })
    void logActivity(userActor(request), {
      area: 'contacts',
      action: 'contact.deleted',
      entityType: 'contact',
      entityId: id,
      label: before ? contactLabel(before) : null,
    })
    return { ok: true }
  })

  // Massenimport (Array von Kontakten). Neue Adressen werden angelegt. Bei vorhandenen Adressen
  // werden nur leere Felder ergänzt und die gewählten Listen zugeordnet; E-Mail, Status und
  // Einwilligung eines vorhandenen Kontakts ändert ein Import nie.
  app.post('/api/contacts/import', async (request, reply) => {
    const schema = z.object({
      contacts: z.array(contactSchema.omit({ listIds: true })),
      listIds: z.array(z.string()).optional(),
    })
    const parsed = schema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Ungültige Importdaten' })
    }
    const { contacts, listIds } = parsed.data

    // Nur Listen, die es gibt, und jede nur einmal
    const targetLists = listIds?.length
      ? (await prisma.list.findMany({ where: { id: { in: [...new Set(listIds)] } }, select: { id: true } })).map((l) => l.id)
      : []

    let created = 0
    let updated = 0
    let skipped = 0
    const seen = new Set<string>()
    for (const c of contacts) {
      // Dieselbe Adresse mehrfach in einer Importdatei nur einmal verarbeiten
      const key = c.email.toLowerCase()
      if (seen.has(key)) {
        skipped++
        continue
      }
      seen.add(key)

      const existing = await prisma.contact.findUnique({ where: { email: c.email }, include: { lists: true } })
      if (!existing) {
        const contact = await prisma.contact.create({ data: { ...c, source: 'import' } })
        if (targetLists.length) {
          await prisma.contactList.createMany({ data: targetLists.map((listId) => ({ contactId: contact.id, listId })) })
        }
        created++
        continue
      }

      // Vorhandener Kontakt: leere Felder aus dem Import füllen
      const fill: Record<string, unknown> = {}
      for (const field of IMPORT_FILL_FIELDS) {
        const value = c[field]
        if ((existing[field] === null || existing[field] === '') && value !== undefined && value !== null && value !== '') {
          fill[field] = value
        }
      }
      if (Object.keys(fill).length) await prisma.contact.update({ where: { id: existing.id }, data: fill })
      // Fehlende Listenzuordnungen ergänzen
      const known = new Set(existing.lists.map((l) => l.listId))
      const missing = targetLists.filter((listId) => !known.has(listId))
      if (missing.length) {
        await prisma.contactList.createMany({ data: missing.map((listId) => ({ contactId: existing.id, listId })) })
      }
      if (Object.keys(fill).length || missing.length) updated++
      else skipped++
    }
    // Ein Eintrag für den ganzen Import
    void logActivity(userActor(request), {
      area: 'contacts',
      action: 'contact.imported',
      params: { created, updated, skipped },
    })
    return reply.send({ created, updated, skipped, total: contacts.length })
  })
}
