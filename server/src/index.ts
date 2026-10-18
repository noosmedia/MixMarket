// Einstiegspunkt des MixMarket-Backends.
// Startet den Fastify-Server, registriert alle Routen und den Scheduler.
import Fastify, { type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { env } from './utils/env.js'
import { isSmtpConfigured } from './services/mailer.service.js'
import { logger } from './utils/logger.js'
import { prisma } from './db/prisma.js'
import { startScheduler } from './jobs/scheduler.js'
import { hitRateLimit } from './utils/rate-limit.js'
import { requireAuth } from './middleware/auth.js'
import { registerProDispatcher } from './pro/host.js'
import { startPro } from './pro/loader.js'
import { registerLicenseRoutes } from './pro/license.js'

// Routen
import { authRoutes } from './api/auth.routes.js'
import { contactsRoutes } from './api/contacts.routes.js'
import { listsRoutes } from './api/lists.routes.js'
import { suppressionRoutes } from './api/suppression.routes.js'
import { templatesRoutes } from './api/templates.routes.js'
import { campaignsRoutes } from './api/campaigns.routes.js'
import { scrapeRoutes } from './api/scrape.routes.js'
import { statsRoutes } from './api/stats.routes.js'
import { settingsRoutes } from './api/settings.routes.js'
import { trackingRoutes } from './api/tracking.routes.js'
import { discoveryRoutes } from './api/discovery.routes.js'
import { cohortsRoutes } from './api/cohorts.routes.js'
import { aiRoutes } from './api/ai.routes.js'
import { productsRoutes } from './api/products.routes.js'
import { prospectsRoutes } from './api/prospects.routes.js'
import { searchRoutes } from './api/search.routes.js'
import { activityRoutes } from './api/activity.routes.js'
import { outboxRoutes } from './api/outbox.routes.js'
import { inboxRoutes } from './api/inbox.routes.js'
import { controlRoutes } from './api/control.routes.js'

async function main(): Promise<void> {
  // X-Forwarded-For nur vom eingetragenen Reverse-Proxy übernehmen, sonst ließe sich die Adresse fälschen
  const trustProxy = env.trustProxy === 'true' ? true : env.trustProxy ? env.trustProxy.split(',').map((s) => s.trim()) : false
  const app = Fastify({ logger: false, trustProxy })

  // CORS für das Frontend
  await app.register(cors, {
    origin: env.publicWebUrl,
    credentials: true,
  })
  await app.register(cookie)

  // Herkunftsprüfung: ändernde Anfragen an die Schnittstelle nur von der eigenen Oberfläche.
  // Schützt zusammen mit dem Cookie (sameSite strict) davor, dass fremde Seiten Aktionen auslösen.
  const allowedOrigins = new Set([new URL(env.publicWebUrl).origin, new URL(env.publicApiUrl).origin])
  app.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return
    const origin = request.headers.origin
    const site = request.headers['sec-fetch-site']
    const foreign = origin ? !allowedOrigins.has(origin) : site === 'cross-site' || site === 'same-site'
    if (foreign) return reply.code(403).send({ error: 'Anfrage von fremder Herkunft abgelehnt' })
  })

  // Drosselung der öffentlichen und anmeldenden Routen je Netzwerkadresse
  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/t/') && hitRateLimit(`t:${request.ip}`, 120, 60_000)) {
      return reply.code(429).send('Too Many Requests')
    }
    if (request.url.startsWith('/api/auth/') && request.method === 'POST' && hitRateLimit(`auth:${request.ip}`, 30, 60_000)) {
      return reply.code(429).send({ error: 'Zu viele Anfragen. Bitte kurz warten.' })
    }
  })

  // Sicherheits-Header für alle Antworten des Servers
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('Referrer-Policy', 'no-referrer')
    reply.header('Cross-Origin-Resource-Policy', 'same-site')
    reply.header(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    )
    return payload
  })

  // Fehler: vollständig ins Serverprotokoll, an die Oberfläche nur eine allgemeine Meldung ohne Interna
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500
    if (status >= 500) {
      logger.error(`Fehler bei ${request.method} ${request.url}`, error)
      return reply.code(status).send({ error: 'Interner Fehler. Einzelheiten stehen im Serverprotokoll.' })
    }
    return reply.code(status).send({ error: status === 413 ? 'Die Anfrage ist zu groß' : 'Ungültige Anfrage' })
  })

  // Health-Check: nur der Zustand, keine Angaben zur Einrichtung
  app.get('/api/health', async () => ({ status: 'ok', time: new Date().toISOString() }))

  // Alle Routen registrieren
  await app.register(authRoutes)
  await app.register(contactsRoutes)
  await app.register(listsRoutes)
  await app.register(suppressionRoutes)
  await app.register(templatesRoutes)
  await app.register(campaignsRoutes)
  await app.register(scrapeRoutes)
  await app.register(discoveryRoutes)
  await app.register(cohortsRoutes)
  await app.register(aiRoutes)
  await app.register(productsRoutes)
  await app.register(prospectsRoutes)
  await app.register(searchRoutes)
  await app.register(activityRoutes)
  await app.register(outboxRoutes)
  await app.register(inboxRoutes)
  await app.register(controlRoutes)
  await app.register(statsRoutes)
  await app.register(settingsRoutes)
  await app.register(trackingRoutes)
  // MixMarket Pro: Freischalten und Kauf gibt es immer; die übrigen Routen unter /api/pro/ nur mit
  // geladenem Pro-Paket (feste Routen gehen in Fastify vor der Sammelroute)
  registerLicenseRoutes(app)
  registerProDispatcher(app, requireAuth)

  // Server starten
  try {
    await app.listen({ port: env.port, host: env.host })
    logger.info(`MixMarket-Backend laeuft auf http://${env.host}:${env.port}`)
    logger.info(`SMTP-Status: ${(await isSmtpConfigured()) ? 'konfiguriert' : 'Testmodus (kein echter Versand)'}`)
    startScheduler()
    // Pro-Paket laden (falls vorhanden); der Kern läuft auch ohne
    void startPro()
  } catch (error) {
    logger.error('Server konnte nicht starten', error)
    process.exit(1)
  }

  // Sauberes Herunterfahren
  const shutdown = async () => {
    logger.info('Server wird beendet')
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main()
