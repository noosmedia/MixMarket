// Route für die Volltextsuche in der Kopfleiste: Treffer nach Bereich gruppiert.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { SEARCH_AREAS, searchAll } from '../services/search.service.js'

const querySchema = z.object({
  q: z.string().max(200).default(''),
  area: z.enum(SEARCH_AREAS).optional(),
})

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Alle Bereiche durchsuchen; mit "area" nur einen Bereich, dann mit mehr Treffern
  app.get('/api/search', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Suche' })
    const { q, area } = parsed.data
    const groups = await searchAll(q, area ?? null, area ? 50 : 5)
    return { query: q, groups }
  })
}
