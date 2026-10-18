// Route für das Aktivitätsprotokoll: Einträge seitenweise, mit Filter nach Bereich,
// Handelndem, Zeitraum und Suchtext.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { ACTIVITY_AREAS } from '../services/activity.service.js'

const querySchema = z.object({
  area: z.enum(ACTIVITY_AREAS).optional(),
  actor: z.enum(['user', 'system', 'agent']).optional(),
  level: z.enum(['info', 'warning', 'error']).optional(),
  days: z.coerce.number().int().min(1).max(3650).optional(),
  q: z.string().trim().max(200).optional(),
  // Fortsetzung: Zeitpunkt und Kennung des letzten geladenen Eintrags
  before: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export async function activityRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  app.get('/api/activity', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Filter' })
    const { area, actor, level, days, q, before, limit } = parsed.data

    const and: Record<string, unknown>[] = []
    if (area) and.push({ area })
    if (actor) and.push({ actorType: actor })
    if (level) and.push({ level })
    if (days) and.push({ createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } })
    if (q) and.push({ OR: [{ label: { contains: q } }, { actorName: { contains: q } }, { action: { contains: q } }] })
    if (before) {
      const [at, id] = before.split('|')
      const date = new Date(at ?? '')
      if (!Number.isNaN(date.getTime()) && id) {
        and.push({ OR: [{ createdAt: { lt: date } }, { createdAt: date, id: { lt: id } }] })
      }
    }

    const rows = await prisma.activity.findMany({
      where: and.length ? { AND: and } : {},
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    })
    const items = rows.slice(0, limit)
    const last = items[items.length - 1]
    const nextCursor = rows.length > limit && last ? `${last.createdAt.toISOString()}|${last.id}` : null
    return { items, nextCursor }
  })
}
