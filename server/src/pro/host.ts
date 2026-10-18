// Schnittstelle für MixMarket Pro auf dem Server.
// Der offene Kern enthält keinen Pro-Code. Das Pro-Paket wird zur Laufzeit geladen und meldet sich
// hier an: Hintergrundaufgaben, Routen unter /api/pro/, Suchquellen und Haken in Kernabläufe.
// Wird Pro abgeschaltet (Lizenz abgelaufen, kein Internet), entfernt deactivatePro() alles wieder.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { logger } from '../utils/logger.js'

// ---------------------------------------------------------------------------
// Funktionen, die ein Pro-Paket freischalten kann
// ---------------------------------------------------------------------------

export const PRO_FEATURES = [
  'tours',
  'autopilot',
  'followUps',
  'automations',
  'approveAll',
  'inboxAi',
  'paidSources',
  'templatePacks',
] as const
export type ProFeature = (typeof PRO_FEATURES)[number]

// ---------------------------------------------------------------------------
// Anmeldestellen
// ---------------------------------------------------------------------------

export interface ProJob {
  name: string
  // Mindestabstand zwischen zwei Läufen; der Scheduler fragt jede Minute
  everyMs: number
  run: () => Promise<void>
}

export type ProRouteHandler = (request: FastifyRequest, reply: FastifyReply) => unknown | Promise<unknown>

export interface ProRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  // Pfad unterhalb von /api/pro, z. B. "/automations/:id/toggle"
  path: string
  handler: ProRouteHandler
}

interface PreparedRoute extends ProRoute {
  parts: string[]
}

interface ProState {
  active: boolean
  version: string | null
  features: Set<ProFeature>
  jobs: Map<string, ProJob & { lastRun: number }>
  routes: PreparedRoute[]
  // Haken in Kernabläufe, je Name genau eine Funktion
  hooks: Map<string, (...args: never[]) => unknown>
  // Aufräumarbeiten beim Abschalten (z. B. angemeldete Suchquellen wieder entfernen)
  cleanups: Array<() => void>
  // Oberflächen-Paket, das der Browser unter /api/pro/web.js lädt
  webBundle: string | null
}

const state: ProState = {
  active: false,
  version: null,
  features: new Set(),
  jobs: new Map(),
  routes: [],
  hooks: new Map(),
  cleanups: [],
  webBundle: null,
}

export function isProActive(): boolean {
  return state.active
}

export function hasFeature(feature: ProFeature): boolean {
  return state.active && state.features.has(feature)
}

export function proStatus() {
  return { active: state.active, version: state.version, features: [...state.features], web: !!state.webBundle }
}

// Haken eines Kernablaufs holen; ohne Pro gibt es ihn nicht und der Kern läuft ohne ihn weiter
export function proHook<T extends (...args: never[]) => unknown>(name: string): T | null {
  return state.active ? ((state.hooks.get(name) as T | undefined) ?? null) : null
}

// Anmeldefunktionen, die das Pro-Paket über die Schnittstelle bekommt
export const registry = {
  registerJob(job: ProJob) {
    state.jobs.set(job.name, { ...job, lastRun: 0 })
  },
  registerRoute(route: ProRoute) {
    state.routes.push({ ...route, parts: route.path.split('/').filter(Boolean) })
  },
  registerHook(name: string, fn: (...args: never[]) => unknown) {
    state.hooks.set(name, fn)
  },
  onDeactivate(fn: () => void) {
    state.cleanups.push(fn)
  },
}
export type ProRegistry = typeof registry

// ---------------------------------------------------------------------------
// Ein- und Abschalten
// ---------------------------------------------------------------------------

export interface ProBundle {
  version: string
  features: ProFeature[]
  // Inhalt des Server-Pakets (ES-Modul) und des Oberflächen-Pakets
  serverCode: string
  webCode: string | null
}

// Pro-Paket laden: Code nur im Arbeitsspeicher ausführen, dann anmelden lassen.
// core enthält die Kernteile, die das Paket über "@core/..." anspricht.
export async function activatePro(bundle: ProBundle, core: Record<string, unknown>): Promise<void> {
  if (state.active) deactivatePro()
  ;(globalThis as Record<string, unknown>)['__MIXMARKET_CORE__'] = core
  const mod = (await import(`data:text/javascript;base64,${Buffer.from(bundle.serverCode).toString('base64')}`)) as {
    register?: (registry: ProRegistry) => Promise<void> | void
  }
  if (typeof mod.register !== 'function') throw new Error('Pro-Paket ohne register()')
  state.features = new Set(bundle.features.filter((f): f is ProFeature => (PRO_FEATURES as readonly string[]).includes(f)))
  state.version = bundle.version
  state.webBundle = bundle.webCode
  // Erst nach erfolgreicher Anmeldung als aktiv gelten
  state.active = true
  try {
    await mod.register(registry)
  } catch (error) {
    deactivatePro()
    throw error
  }
  logger.info(`MixMarket Pro ${bundle.version} aktiv (${[...state.features].join(', ')})`)
}

// Pro abschalten: alles Angemeldete entfernen, Kern läuft ohne Pro weiter
export function deactivatePro(): void {
  if (!state.active && !state.jobs.size && !state.routes.length) return
  for (const cleanup of state.cleanups.splice(0)) {
    try {
      cleanup()
    } catch (error) {
      logger.error('Pro: Aufräumen fehlgeschlagen', error)
    }
  }
  state.active = false
  state.version = null
  state.features.clear()
  state.jobs.clear()
  state.routes = []
  state.hooks.clear()
  state.webBundle = null
  logger.info('MixMarket Pro abgeschaltet')
}

// ---------------------------------------------------------------------------
// Hintergrundaufgaben: der Kern-Scheduler ruft das jede Minute auf
// ---------------------------------------------------------------------------

export async function runProJobs(): Promise<void> {
  if (!state.active) return
  for (const job of [...state.jobs.values()]) {
    if (Date.now() - job.lastRun < job.everyMs) continue
    job.lastRun = Date.now()
    try {
      await job.run()
    } catch (error) {
      logger.error(`Pro-Aufgabe "${job.name}" fehlgeschlagen`, error)
    }
  }
}

// ---------------------------------------------------------------------------
// Routen: eine Kernroute nimmt alles unter /api/pro/ an und reicht es an die angemeldeten Routen weiter
// ---------------------------------------------------------------------------

function matchRoute(method: string, path: string): { route: PreparedRoute; params: Record<string, string> } | null {
  const parts = path.split('/').filter(Boolean)
  for (const route of state.routes) {
    if (route.method !== method || route.parts.length !== parts.length) continue
    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < parts.length; i++) {
      const want = route.parts[i] as string
      const got = parts[i] as string
      if (want.startsWith(':')) params[want.slice(1)] = decodeURIComponent(got)
      else if (want !== got) {
        ok = false
        break
      }
    }
    if (ok) return { route, params }
  }
  return null
}

export function registerProDispatcher(app: FastifyInstance, requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>) {
  // Stand von Pro für die Oberfläche
  app.get('/api/pro/status', { preHandler: requireAuth }, async () => proStatus())

  // Oberflächen-Paket nur bei aktivem Pro und nur für angemeldete Nutzer
  app.get('/api/pro/web.js', { preHandler: requireAuth }, async (_request, reply) => {
    if (!state.active || !state.webBundle) return reply.code(404).send({ error: 'MixMarket Pro ist nicht aktiv' })
    reply.header('Cache-Control', 'no-store')
    return reply.type('text/javascript; charset=utf-8').send(state.webBundle)
  })

  // Alle übrigen Pro-Routen
  app.route({
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    url: '/api/pro/*',
    preHandler: requireAuth,
    handler: async (request, reply) => {
      if (!state.active) return reply.code(403).send({ error: 'Diese Funktion gehört zu MixMarket Pro', code: 'pro' })
      const path = (request.params as { '*': string })['*'] ?? ''
      const found = matchRoute(request.method, `/${path.split('?')[0]}`)
      if (!found) return reply.code(404).send({ error: 'Nicht gefunden' })
      ;(request as FastifyRequest & { params: Record<string, string> }).params = found.params
      return found.route.handler(request, reply)
    },
  })
}
