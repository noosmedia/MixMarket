// Routen für die globale Sperrliste (Do-not-contact).
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { logActivity, userActor } from '../services/activity.service.js'
import { stopOutreach } from '../services/outbox.service.js'

export async function suppressionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Sperrliste auflisten, optional nach Grund gefiltert
  app.get('/api/suppression', async (request) => {
    const q = request.query as Record<string, string>
    const where = q.reason ? { reason: q.reason } : {}
    const items = await prisma.suppression.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return { items, total: items.length }
  })

  // Adresse manuell sperren
  app.post('/api/suppression', async (request, reply) => {
    const parsed = z
      .object({ email: z.string().email(), reason: z.string().default('manual'), note: z.string().optional() })
      .safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Ungültige Eingabe' })

    const entry = await prisma.suppression.upsert({
      where: { email: parsed.data.email },
      update: { reason: parsed.data.reason, note: parsed.data.note },
      create: parsed.data,
    })
    // Zugehoerigen Kontakt ebenfalls deaktivieren
    await prisma.contact.updateMany({
      where: { email: parsed.data.email },
      // Grund und Kontaktstatus passen zusammen: unzustellbar, Beschwerde, sonst abgemeldet
      data: {
        status:
          parsed.data.reason === 'bounced' ? 'bounced' : parsed.data.reason === 'complained' ? 'complained' : 'unsubscribed',
      },
    })
    // Laufende Abläufe im Postausgang an diese Adresse enden
    await stopOutreach({ email: parsed.data.email }, 'suppressed')
    void logActivity(userActor(request), {
      area: 'suppression',
      action: 'suppression.added',
      entityType: 'suppression',
      entityId: entry.id,
      label: entry.email,
      params: { reason: entry.reason },
    })
    return reply.code(201).send(entry)
  })

  // Adresse wieder freigeben
  app.delete('/api/suppression/:id', async (request) => {
    const { id } = request.params as { id: string }
    const before = await prisma.suppression.findUnique({ where: { id }, select: { email: true } })
    await prisma.suppression.delete({ where: { id } })
    // Freigegebene Adresse: zugehörigen Kontakt wieder aktiv setzen, sonst bliebe er ohne Sperre abgemeldet
    const reactivated = before
      ? await prisma.contact.updateMany({
          where: { email: before.email, status: { in: ['unsubscribed', 'bounced', 'complained'] } },
          data: { status: 'active' },
        })
      : { count: 0 }
    void logActivity(userActor(request), {
      area: 'suppression',
      action: 'suppression.released',
      entityType: 'suppression',
      entityId: id,
      label: before?.email ?? null,
      ...(reactivated.count ? { details: { contactsReactivated: reactivated.count } } : {}),
    })
    return { ok: true, contactsReactivated: reactivated.count }
  })
}
