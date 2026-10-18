// Routen für Produkte: Für jedes Produkt werden eigene Zielgruppen gebildet und
// Firmen getrennt von der KI bewertet.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'

const productSchema = z.object({
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(80),
  website: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), 'Die Webseite muss mit http:// oder https:// beginnen')
    .optional()
    .nullable(),
  description: z.string().trim().min(20, 'Bitte beschreiben Sie das Produkt in mindestens einem Satz').max(4000),
  idealCustomer: z.string().trim().min(20, 'Bitte beschreiben Sie den idealen Kunden in mindestens einem Satz').max(4000),
  // Mindestgröße der Kundenfirma in Mitarbeitern; leer = keine Grenze
  minEmployees: z.number().int().min(1, 'Die Mindestgröße muss mindestens 1 sein').max(100000).optional().nullable(),
})

// Felder eines Produkts, die im Protokoll als Änderung erscheinen
const PRODUCT_FIELDS = ['name', 'website', 'description', 'idealCustomer', 'minEmployees']

export async function productsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Alle Produkte mit Anzahl Zielgruppen und bewerteter Firmen
  app.get('/api/products', async () => {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { cohorts: true, scores: true, prospects: true } } },
    })
    return products
  })

  app.post('/api/products', async (request, reply) => {
    const parsed = productSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const product = await prisma.product.create({
      data: { ...parsed.data, website: parsed.data.website || null, minEmployees: parsed.data.minEmployees ?? null },
    })
    void logActivity(userActor(request), {
      area: 'products',
      action: 'product.created',
      entityType: 'product',
      entityId: product.id,
      label: product.name,
    })
    return reply.code(201).send(product)
  })

  app.put('/api/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = productSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' })
    const exists = await prisma.product.findUnique({ where: { id } })
    if (!exists) return reply.code(404).send({ error: 'Produkt nicht gefunden' })
    const data = { ...parsed.data, website: parsed.data.website || null, minEmployees: parsed.data.minEmployees ?? null }
    const product = await prisma.product.update({ where: { id }, data })
    const changes = changesOf(exists, data, PRODUCT_FIELDS)
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'products',
        action: 'product.updated',
        entityType: 'product',
        entityId: id,
        label: product.name,
        details: { changes },
      })
    }
    return product
  })

  // Produkt löschen: seine KI-Bewertungen werden mit gelöscht, Zielgruppen bleiben ohne Produkt erhalten
  app.delete('/api/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const exists = await prisma.product.findUnique({ where: { id } })
    if (!exists) return reply.code(404).send({ error: 'Produkt nicht gefunden' })
    const running = await prisma.scoringJob.count({ where: { productId: id, status: 'running' } })
    if (running > 0) return reply.code(409).send({ error: 'Für dieses Produkt läuft gerade eine KI-Bewertung' })
    await prisma.product.delete({ where: { id } })
    void logActivity(userActor(request), {
      area: 'products',
      action: 'product.deleted',
      entityType: 'product',
      entityId: id,
      label: exists.name,
    })
    return { ok: true }
  })
}
