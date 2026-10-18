// Routen für Kennzahlen: Dashboard-Uebersicht und Kampagnen-Detailstatistik.
import type { FastifyInstance } from 'fastify'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Uebersicht für das Dashboard
  app.get('/api/stats/overview', async () => {
    const [contacts, active, lists, campaigns, suppressed, sentAgg] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { status: 'active' } }),
      prisma.list.count(),
      prisma.campaign.count(),
      prisma.suppression.count(),
      prisma.campaign.aggregate({
        _sum: { sentCount: true, openCount: true, clickCount: true, unsubCount: true },
      }),
    ])

    const totalSent = sentAgg._sum.sentCount ?? 0
    const totalOpen = sentAgg._sum.openCount ?? 0
    const totalClick = sentAgg._sum.clickCount ?? 0

    return {
      contacts,
      activeContacts: active,
      lists,
      campaigns,
      suppressed,
      totalSent,
      totalOpen,
      totalClick,
      openRate: totalSent ? Math.round((totalOpen / totalSent) * 1000) / 10 : 0,
      clickRate: totalSent ? Math.round((totalClick / totalSent) * 1000) / 10 : 0,
    }
  })

  // Versandverlauf der letzten 30 Tage (für das Diagramm)
  app.get('/api/stats/timeline', async () => {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sends = await prisma.send.findMany({
      where: { sentAt: { gte: since } },
      select: { sentAt: true },
    })
    const events = await prisma.emailEvent.findMany({
      where: { createdAt: { gte: since }, type: { in: ['open', 'click'] } },
      select: { createdAt: true, type: true },
    })

    // Nach Tag gruppieren
    const days: Record<string, { date: string; sent: number; opens: number; clicks: number }> = {}
    const key = (d: Date) => d.toISOString().slice(0, 10)
    for (let i = 0; i < 30; i++) {
      const d = new Date(since)
      d.setDate(d.getDate() + i)
      days[key(d)] = { date: key(d), sent: 0, opens: 0, clicks: 0 }
    }
    for (const s of sends) if (s.sentAt && days[key(s.sentAt)]) days[key(s.sentAt)].sent++
    for (const e of events) {
      const k = key(e.createdAt)
      if (!days[k]) continue
      if (e.type === 'open') days[k].opens++
      if (e.type === 'click') days[k].clicks++
    }
    return Object.values(days)
  })

  // Detailstatistik einer Kampagne
  app.get('/api/stats/campaign/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const campaign = await prisma.campaign.findUnique({ where: { id } })
    if (!campaign) return reply.code(404).send({ error: 'Kampagne nicht gefunden' })

    const clickedLinks = await prisma.emailEvent.groupBy({
      by: ['url'],
      where: { campaignId: id, type: 'click' },
      _count: { url: true },
    })

    return {
      campaign,
      topLinks: clickedLinks
        .filter((l) => l.url)
        .map((l) => ({ url: l.url, clicks: l._count.url }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10),
    }
  })
}
