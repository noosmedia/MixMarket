// Routen der Firmensuche (Recherche) und der Zugänge zu den Suchquellen.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { SYSTEM, logActivity, userActor } from '../services/activity.service.js'
import { logger } from '../utils/logger.js'
import { BRANCHES, findBranch } from '../services/discovery/branches.js'
import { PROVIDERS, isProviderKey, type ProviderKey } from '../services/discovery/providers.js'
import {
  estimateCost,
  loadCredentials,
  loadSettings,
  runSearch,
  searchLabel,
  type SearchInput,
} from '../services/discovery/discovery.service.js'
import { profileCompany, profileSearch } from '../services/discovery/profiler.js'
import { contextHash } from '../services/ai/scoring.js'

// Eingaben einer Suche prüfen
const searchSchema = z.object({
  provider: z.string().refine(isProviderKey, 'Unbekannte Quelle'),
  branchKey: z.string().optional().nullable(),
  term: z.string().max(120).optional().nullable(),
  location: z.string().trim().min(2, 'Bitte einen Ort angeben').max(120),
  radiusKm: z.number().int().min(1).max(100).default(25),
  depth: z.number().int().min(10).max(100).default(30),
  maxResults: z.number().int().min(10).max(1000).default(100),
})

// Eingaben in das Format des Suchdienstes bringen und Branche oder Begriff verlangen
function toInput(data: z.infer<typeof searchSchema>): SearchInput | string {
  const branch = findBranch(data.branchKey)
  const term = data.term?.trim() ?? ''
  if (!branch && term.length < 2) return 'Bitte eine Branche wählen oder einen Suchbegriff eingeben'
  return {
    provider: data.provider as ProviderKey,
    branchKey: branch?.key ?? null,
    term: branch ? branch.term : term,
    location: data.location,
    radiusKm: data.radiusKm,
    depth: data.depth,
    maxResults: data.maxResults,
  }
}

export async function discoveryRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  // Suchen, die bei einem Neustart des Servers unterbrochen wurden, als Fehler markieren
  await prisma.discoverySearch.updateMany({
    where: { status: { in: ['pending', 'running'] } },
    data: { status: 'error', error: 'Unterbrochen, weil der Server neu gestartet wurde', finishedAt: new Date() },
  })
  // Unterbrochenes Durchleuchten ebenso
  await prisma.discoverySearch.updateMany({
    where: { profileStatus: 'running' },
    data: { profileStatus: 'error', profileError: 'Unterbrochen, weil der Server neu gestartet wurde' },
  })
  await prisma.company.updateMany({ where: { profileStatus: 'running' }, data: { profileStatus: null } })

  // Quellen mit Status, ob ein Zugang eingetragen ist
  app.get('/api/discovery/providers', async () => {
    const credentials = await loadCredentials()
    return Object.values(PROVIDERS).map((p) => ({
      key: p.key,
      kind: p.kind,
      configured: p.configured(credentials),
      needsCoordinates: p.needsCoordinates,
      signupUrl: p.signupUrl,
    }))
  })

  // Branchenkatalog für die Auswahlliste
  app.get('/api/discovery/branches', async () => {
    return BRANCHES.map((b) => ({ key: b.key, de: b.de, en: b.en, term: b.term, hasOsm: b.osm.length > 0 }))
  })

  // Kosten vorab schätzen
  app.post('/api/discovery/estimate', async (request, reply) => {
    const parsed = searchSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    const input = toInput(parsed.data)
    if (typeof input === 'string') return reply.code(400).send({ error: input })
    const settings = await loadSettings()
    const cost = estimateCost(input)
    return { cost, maxSpend: settings.discoveryMaxSpendUsd, overBudget: cost > settings.discoveryMaxSpendUsd }
  })

  // Suche anlegen und im Hintergrund starten
  app.post('/api/discovery/searches', async (request, reply) => {
    const parsed = searchSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.errors[0]?.message })
    const input = toInput(parsed.data)
    if (typeof input === 'string') return reply.code(400).send({ error: input })

    // Zugang und Kostenobergrenze prüfen, bevor etwas ausgegeben wird
    const provider = PROVIDERS[input.provider]
    if (!provider.configured(await loadCredentials())) {
      return reply.code(400).send({ error: 'Für diese Quelle ist kein Zugang eingetragen (Einstellungen, Recherche-Zugänge)' })
    }
    const settings = await loadSettings()
    const cost = estimateCost(input)
    if (cost > settings.discoveryMaxSpendUsd) {
      // Beträge im deutschen Zahlenformat, wie in der Oberfläche
      const usd = (v: number, digits: number) =>
        v.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })
      return reply.code(400).send({
        error: `Geschätzte Kosten ${usd(cost, 3)} USD liegen über der Obergrenze von ${usd(settings.discoveryMaxSpendUsd, 2)} USD je Suche`,
      })
    }

    // Immer nur eine Suche gleichzeitig: schont die kostenlosen Server und das Guthaben
    const running = await prisma.discoverySearch.count({ where: { status: { in: ['pending', 'running'] } } })
    if (running > 0) return reply.code(409).send({ error: 'Es läuft bereits eine Suche. Bitte warten, bis sie fertig ist.' })

    const search = await prisma.discoverySearch.create({
      data: {
        provider: input.provider,
        branchKey: input.branchKey ?? null,
        term: input.term ?? '',
        location: input.location,
        radiusKm: input.radiusKm,
        depth: input.depth,
        maxResults: input.maxResults,
        estimatedCost: cost,
      },
    })
    void logActivity(userActor(request), {
      area: 'research',
      action: 'search.started',
      entityType: 'search',
      entityId: search.id,
      label: searchLabel(search),
      params: { provider: input.provider, estimatedCost: cost },
    })
    void runSearch(search.id)
    return reply.code(201).send(search)
  })

  // Fehlgeschlagene Suche mit denselben Angaben erneut ausführen
  app.post('/api/discovery/searches/:id/retry', async (request, reply) => {
    const { id } = request.params as { id: string }
    const search = await prisma.discoverySearch.findUnique({ where: { id } })
    if (!search) return reply.code(404).send({ error: 'Suche nicht gefunden' })
    if (search.status !== 'error') return reply.code(409).send({ error: 'Nur fehlgeschlagene Suchen lassen sich wiederholen' })
    const provider = PROVIDERS[search.provider]
    if (!provider) return reply.code(403).send({ error: 'Diese Quelle gehört zu MixMarket Pro', code: 'pro' })
    if (!provider.configured(await loadCredentials())) {
      return reply.code(400).send({ error: 'Für diese Quelle ist kein Zugang eingetragen (Einstellungen, Recherche-Zugänge)' })
    }
    const settings = await loadSettings()
    if (search.estimatedCost > settings.discoveryMaxSpendUsd) {
      return reply.code(400).send({ error: 'Die geschätzten Kosten liegen inzwischen über der Obergrenze je Suche' })
    }
    const running = await prisma.discoverySearch.count({ where: { status: { in: ['pending', 'running'] } } })
    if (running > 0) return reply.code(409).send({ error: 'Es läuft bereits eine Suche. Bitte warten, bis sie fertig ist.' })
    const updated = await prisma.discoverySearch.update({
      where: { id },
      data: { status: 'pending', error: null, foundCount: 0, junkCount: 0, newCount: 0, knownCount: 0, actualCost: 0, finishedAt: null },
    })
    void logActivity(userActor(request), {
      area: 'research',
      action: 'search.started',
      entityType: 'search',
      entityId: id,
      label: searchLabel(search),
      params: { provider: search.provider, estimatedCost: search.estimatedCost },
    })
    void runSearch(id)
    return updated
  })

  // Alle Suchen, neueste zuerst
  app.get('/api/discovery/searches', async () => {
    return prisma.discoverySearch.findMany({ orderBy: { createdAt: 'desc' } })
  })

  // Gefundene Firmen einer Suche, nach Rang und Name sortiert
  app.get('/api/discovery/searches/:id/companies', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { productId } = request.query as { productId?: string }
    const search = await prisma.discoverySearch.findUnique({ where: { id } })
    if (!search) return reply.code(404).send({ error: 'Suche nicht gefunden' })
    // Firmen samt Merkmalen und Ansprechpartnern (Entscheider zuerst)
    const finds = await prisma.companyFind.findMany({
      where: { searchId: id },
      include: {
        company: {
          include: {
            signals: true,
            people: { orderBy: [{ isDecisionMaker: 'desc' }, { source: 'asc' }, { createdAt: 'asc' }] },
            // Alle Bewertungen: Passung des gewählten Produkts, Größenschätzung aus jeder
            scores: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    })
    finds.sort((a, b) => {
      if (a.rank !== null && b.rank !== null) return a.rank - b.rank
      if (a.rank !== null) return -1
      if (b.rank !== null) return 1
      return a.company.name.localeCompare(b.company.name, 'de')
    })
    return {
      search,
      items: finds.map((f) => ({
        ...f.company,
        rank: f.rank,
        score: f.company.scores.find((sc) => sc.productId === productId) ?? null,
        sizeClass: f.company.scores.find((sc) => sc.sizeClass && sc.sizeClass !== 'unbekannt')?.sizeClass ?? null,
      })),
    }
  })

  // Alle Firmen einer Suche durchleuchten (im Hintergrund)
  app.post('/api/discovery/searches/:id/profile', async (request, reply) => {
    const { id } = request.params as { id: string }
    const search = await prisma.discoverySearch.findUnique({ where: { id } })
    if (!search) return reply.code(404).send({ error: 'Suche nicht gefunden' })
    if (search.status !== 'done') return reply.code(409).send({ error: 'Die Suche ist noch nicht abgeschlossen' })
    // Immer nur ein Durchleuchten gleichzeitig, damit fremde Server nicht belastet werden
    const running = await prisma.discoverySearch.count({ where: { profileStatus: 'running' } })
    if (running > 0) return reply.code(409).send({ error: 'Es werden bereits Firmen durchleuchtet. Bitte warten, bis das fertig ist.' })
    await prisma.discoverySearch.update({ where: { id }, data: { profileStatus: 'running', profileDone: 0 } })
    const count = await prisma.companyFind.count({ where: { searchId: id, company: { domain: { not: null } } } })
    void logActivity(userActor(request), {
      area: 'research',
      action: 'profiling.started',
      entityType: 'search',
      entityId: id,
      label: searchLabel(search),
      params: { count },
    })
    void profileSearch(id)
    return reply.code(202).send({ ok: true })
  })

  // Eine einzelne Firma erneut durchleuchten (im Hintergrund)
  app.post('/api/discovery/companies/:id/profile', async (request, reply) => {
    const { id } = request.params as { id: string }
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) return reply.code(404).send({ error: 'Firma nicht gefunden' })
    if (!company.domain) return reply.code(400).send({ error: 'Für diese Firma ist keine Webseite bekannt' })
    if (company.profileStatus === 'running') return reply.code(409).send({ error: 'Diese Firma wird bereits durchleuchtet' })
    await prisma.company.update({ where: { id }, data: { profileStatus: 'running' } })
    void logActivity(userActor(request), {
      area: 'research',
      action: 'profiling.started',
      entityType: 'company',
      entityId: id,
      label: company.name,
      params: { count: 1 },
    })
    void profileCompany(id)
      .then((status) =>
        logActivity(SYSTEM, {
          area: 'research',
          action: 'profiling.finished',
          level: status === 'ok' ? 'info' : 'warning',
          entityType: 'company',
          entityId: id,
          label: company.name,
          params: { done: 1 },
          details: { status },
        }),
      )
      .catch((error) => {
        logger.error('Durchleuchten fehlgeschlagen', error)
        void logActivity(SYSTEM, {
          area: 'research',
          action: 'profiling.failed',
          level: 'error',
          entityType: 'company',
          entityId: id,
          label: company.name,
          details: { error: error instanceof Error ? error.message : String(error) },
        })
      })
    return reply.code(202).send({ ok: true })
  })

  // Eine Firma mit allen Merkmalen und Ansprechpartnern
  app.get('/api/discovery/companies/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { productId } = request.query as { productId?: string }
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        signals: { orderBy: { code: 'asc' } },
        people: { orderBy: [{ isDecisionMaker: 'desc' }, { source: 'asc' }, { createdAt: 'asc' }] },
        scores: { include: { product: true }, orderBy: { score: 'desc' } },
        // Ist die Firma für das gewählte Produkt schon Interessent?
        prospects: { where: { productId: productId ?? '__kein_produkt__' }, select: { id: true, status: true } },
      },
    })
    if (!company) return reply.code(404).send({ error: 'Firma nicht gefunden' })
    // Bewertungen je Produkt; veraltet, wenn Produkt oder idealer Kunde seitdem geändert wurden
    const scores = company.scores.map(({ product, ...score }) => ({
      ...score,
      productName: product.name,
      stale: score.contextHash !== contextHash(product),
    }))
    const { prospects, ...rest } = company
    return {
      ...rest,
      scores,
      score: scores.find((s) => s.productId === productId) ?? null,
      prospect: prospects[0] ?? null,
    }
  })

  // Suche löschen. Firmen, die keine andere Suche gefunden hat, werden mit entfernt.
  app.delete('/api/discovery/searches/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const search = await prisma.discoverySearch.findUnique({ where: { id } })
    if (!search) return reply.code(404).send({ error: 'Suche nicht gefunden' })
    if (search.status === 'running' || search.status === 'pending') {
      return reply.code(409).send({ error: 'Eine laufende Suche kann nicht gelöscht werden' })
    }
    if (search.profileStatus === 'running') {
      return reply.code(409).send({ error: 'Die Firmen dieser Suche werden gerade durchleuchtet. Bitte warten, bis das fertig ist.' })
    }
    const companyIds = (await prisma.companyFind.findMany({ where: { searchId: id }, select: { companyId: true } })).map(
      (f) => f.companyId,
    )
    await prisma.discoverySearch.delete({ where: { id } })
    const orphaned = await prisma.company.deleteMany({ where: { id: { in: companyIds }, finds: { none: {} } } })
    logger.info(`Suche gelöscht, ${orphaned.count} Firmen ohne weitere Fundstelle entfernt`)
    void logActivity(userActor(request), {
      area: 'research',
      action: 'search.deleted',
      entityType: 'search',
      entityId: id,
      label: searchLabel(search),
      details: { removedCompanies: orphaned.count },
    })
    return { ok: true, removedCompanies: orphaned.count }
  })
}
