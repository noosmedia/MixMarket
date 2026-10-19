// Einstiegspunkt des MixMarket-Backends.
// Startet den Fastify-Server, registriert alle Routen und den Scheduler.
import Fastify, { type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
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

// Sicherheitsregeln (Content-Security-Policy): Schnittstelle und Tracking dürfen nichts nachladen;
// die Oberfläche darf nur eigene Skripte, Stile, Schriften und Bilder vom selben Server laden
const API_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
const WEB_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"

// Gehört die Adresse zur Oberfläche? Nur wenn der Server sie selbst ausliefert (installiertes Programm)
function isWebRequest(url: string): boolean {
  return !!env.webDir && !url.startsWith('/api/') && !url.startsWith('/t/')
}

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
  // Beim Beenden offene Verbindungen schließen statt auf sie zu warten: Browser und Programmfenster halten
  // vorsorglich Verbindungen offen, sonst hinge das Beenden (z. B. beim Schließen des Programms)
  const app = Fastify({ logger: false, trustProxy, forceCloseConnections: true })

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
  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('Referrer-Policy', 'no-referrer')
    reply.header('Cross-Origin-Resource-Policy', 'same-site')
    reply.header('Content-Security-Policy', isWebRequest(request.url) ? WEB_CSP : API_CSP)
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

  // Installiertes Programm: die fertige Oberfläche kommt vom selben Server (gleiche Adresse für
  // Oberfläche und Schnittstelle). Unbekannte Seitenadressen bekommen die Startseite, die Oberfläche
  // wählt die Seite dann selbst; unbekannte Schnittstellen-Adressen bleiben ein 404.
  if (env.webDir) {
    await app.register(fastifyStatic, {
      root: env.webDir,
      prefix: '/',
      // Dateinamen mit Prüfsumme dürfen lange zwischengespeichert werden, die Startseite nie
      setHeaders: (res, path) => {
        res.header('Cache-Control', /[\\/]assets[\\/]/.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache')
      },
    })
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && isWebRequest(request.url)) return reply.header('Cache-Control', 'no-cache').sendFile('index.html')
      return reply.code(404).send({ error: 'Nicht gefunden' })
    })
  }

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

  // Installiertes Programm: endet das Programmfenster unerwartet (Absturz, beendet über die Prozessliste),
  // beendet sich auch der Server, statt ohne Fenster weiterzulaufen und den Port zu belegen
  const parentPid = Number(process.env.MIXMARKET_PARENT_PID)
  if (parentPid > 0) {
    setInterval(() => {
      try {
        process.kill(parentPid, 0)
      } catch {
        void shutdown()
      }
    }, 2000).unref()
  }
}

main()
