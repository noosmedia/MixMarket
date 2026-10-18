// Routen für Scraping-Aufträge und das Uebernehmen von Ergebnissen als Kontakte.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { logActivity, userActor } from '../services/activity.service.js'
import { runScrapeJob } from '../services/scrape.service.js'

// Nur öffentliche Webadressen mit http oder https, begrenzte Mengen und Längen
const webUrl = z
  .string()
  .trim()
  .max(2000)
  .url('Bitte gültige Webadressen eingeben')
  .refine((v) => /^https?:\/\//i.test(v), 'Nur Adressen mit http:// oder https:// sind erlaubt')
const jobSchema = z.object({
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(200),
  type: z.enum(['structured', 'contacts']).default('structured'),
  config: z.object({
    urls: z.array(webUrl).min(1, 'Bitte mindestens eine Adresse eingeben').max(50, 'Höchstens 50 Adressen je Auftrag'),
    selectors: z.record(z.string().max(200), z.string().max(500)).optional(),
    extractEmails: z.boolean().optional(),
    mustContain: z.string().max(200).optional(),
    useBrowser: z.boolean().optional(),
  }),
})

export async function scrapeRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Aufträge auflisten
  app.get('/api/scrape/jobs', async () => {
    return prisma.scrapeJob.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { results: true } } },
    })
  })

  // Ergebnisse eines Auftrags
  app.get('/api/scrape/jobs/:id/results', async (request) => {
    const { id } = request.params as { id: string }
    const results = await prisma.scrapeResult.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
    })
    return { items: results, total: results.length }
  })

  // Auftrag anlegen und sofort starten
  app.post('/api/scrape/jobs', async (request, reply) => {
    const parsed = jobSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message })

    // Art "Kontaktdaten" sucht immer nach E-Mail-Adressen, sonst fände sie nichts
    const config =
      parsed.data.type === 'contacts' ? { ...parsed.data.config, extractEmails: true } : parsed.data.config
    const job = await prisma.scrapeJob.create({
      data: { name: parsed.data.name, type: parsed.data.type, config },
    })
    void logActivity(userActor(request), {
      area: 'research',
      action: 'scrapeJob.created',
      entityType: 'scrapeJob',
      entityId: job.id,
      label: job.name,
    })
    // Im Hintergrund ausführen
    void runScrapeJob(job.id)
    return reply.code(201).send(job)
  })

  // Auftrag löschen
  app.delete('/api/scrape/jobs/:id', async (request) => {
    const { id } = request.params as { id: string }
    const before = await prisma.scrapeJob.findUnique({ where: { id }, select: { name: true } })
    await prisma.scrapeJob.delete({ where: { id } })
    void logActivity(userActor(request), {
      area: 'research',
      action: 'scrapeJob.deleted',
      entityType: 'scrapeJob',
      entityId: id,
      label: before?.name ?? null,
    })
    return { ok: true }
  })

  // Ausgewählte Ergebnisse als Kontakte übernehmen (nur mit E-Mail)
  app.post('/api/scrape/jobs/:id/to-contacts', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { listIds } = request.body as { listIds?: string[] }

    const results = await prisma.scrapeResult.findMany({ where: { jobId: id } })
    let created = 0
    let skipped = 0
    for (const r of results) {
      const data = r.data as Record<string, unknown>
      const email = typeof data.email === 'string' ? data.email : null
      if (!email) {
        skipped++
        continue
      }
      const exists = await prisma.contact.findUnique({ where: { email } })
      if (exists) {
        skipped++
        continue
      }
      const contact = await prisma.contact.create({
        data: {
          email,
          company: typeof data.company === 'string' ? data.company : null,
          website: r.sourceUrl,
          source: 'scrape',
        },
      })
      if (listIds?.length) {
        await prisma.contactList.createMany({
          data: listIds.map((listId) => ({ contactId: contact.id, listId })),
        })
      }
      created++
    }
    // Ein Eintrag für die ganze Übernahme (eigener Schlüssel, nicht in der Vorgabe)
    const job = await prisma.scrapeJob.findUnique({ where: { id }, select: { name: true } })
    void logActivity(userActor(request), {
      area: 'research',
      action: 'scrapeJob.toContacts',
      entityType: 'scrapeJob',
      entityId: id,
      label: job?.name ?? null,
      params: { created, skipped },
    })
    return reply.send({ created, skipped })
  })
}
