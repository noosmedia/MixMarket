// Routen für E-Mail-Vorlagen.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { changesOf, logActivity, userActor } from '../services/activity.service.js'
import { availablePlaceholders } from '../services/template.service.js'

// Felder einer Vorlage, die im Protokoll als Änderung erscheinen (das Vorschaubild nicht)
const TEMPLATE_FIELDS = ['name', 'subject', 'htmlBody', 'textBody', 'language']

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlBody: z.string(),
  textBody: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  // Sprache von Anrede, Abmelde-Hinweis und Footer
  language: z.enum(['de', 'en']).optional(),
})

export async function templatesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Verfügbare Platzhalter für den Editor
  app.get('/api/templates/placeholders', async () => ({ placeholders: availablePlaceholders() }))

  app.get('/api/templates', async () => {
    return prisma.template.findMany({ orderBy: { updatedAt: 'desc' } })
  })

  app.get('/api/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const tpl = await prisma.template.findUnique({ where: { id } })
    if (!tpl) return reply.code(404).send({ error: 'Vorlage nicht gefunden' })
    return tpl
  })

  app.post('/api/templates', async (request, reply) => {
    const parsed = templateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    const tpl = await prisma.template.create({ data: parsed.data })
    void logActivity(userActor(request), {
      area: 'templates',
      action: 'template.created',
      entityType: 'template',
      entityId: tpl.id,
      label: tpl.name,
    })
    return reply.code(201).send(tpl)
  })

  app.put('/api/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = templateSchema.partial().safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    const before = await prisma.template.findUnique({ where: { id } })
    const tpl = await prisma.template.update({ where: { id }, data: parsed.data })
    const changes = changesOf(before, parsed.data, TEMPLATE_FIELDS)
    if (before && changes.length) {
      void logActivity(userActor(request), {
        area: 'templates',
        action: 'template.updated',
        entityType: 'template',
        entityId: id,
        label: tpl.name,
        details: { changes },
      })
    }
    return tpl
  })

  app.delete('/api/templates/:id', async (request) => {
    const { id } = request.params as { id: string }
    const before = await prisma.template.findUnique({ where: { id }, select: { name: true } })
    await prisma.template.delete({ where: { id } })
    void logActivity(userActor(request), {
      area: 'templates',
      action: 'template.deleted',
      entityType: 'template',
      entityId: id,
      label: before?.name ?? null,
    })
    return { ok: true }
  })
}
