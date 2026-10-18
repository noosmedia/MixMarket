// Aktivitätsprotokoll: hält fest, wer wann was getan hat. Wer: ein Nutzer, das System
// (z. B. der Zeitplaner beim Versand) oder ein KI-Agent. Das Schreiben ins Protokoll darf
// die eigentliche Aktion nie stören, Fehler werden deshalb nur geloggt.
import type { FastifyRequest } from 'fastify'
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../db/prisma.js'
import { logger } from '../utils/logger.js'

export const ACTIVITY_AREAS = [
  'auth',
  'contacts',
  'lists',
  'templates',
  'campaigns',
  'automations',
  'research',
  'products',
  'prospects',
  'suppression',
  'settings',
  'mailbox',
  'ai',
  'outbox',
  'inbox',
  'control',
] as const
export type ActivityArea = (typeof ACTIVITY_AREAS)[number]

export interface Actor {
  type: 'user' | 'system' | 'agent'
  id?: string | null
  name?: string | null
}

export interface ActivityInput {
  area: ActivityArea
  // Schlüssel der Aktion, z. B. "contact.created"; die Oberfläche übersetzt ihn
  action: string
  level?: 'info' | 'warning' | 'error'
  entityType?: string
  entityId?: string | null
  label?: string | null
  params?: Record<string, unknown>
  details?: Record<string, unknown>
}

export const SYSTEM: Actor = { type: 'system' }

// KI-Agent als Handelnder, z. B. "Bewertung" oder später "Postausgang"
export function agentActor(name: string): Actor {
  return { type: 'agent', name }
}

// Angemeldeter Nutzer der Anfrage
export function userActor(request: FastifyRequest): Actor {
  return request.user ? { type: 'user', id: request.user.userId } : SYSTEM
}

// Namen der Nutzer kurz zwischenspeichern, damit nicht jede Aktion die Datenbank fragt
const nameCache = new Map<string, { name: string; at: number }>()
async function userName(id: string): Promise<string | null> {
  const hit = nameCache.get(id)
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.name
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } })
  if (!user) return null
  const name = user.name || user.email
  nameCache.set(id, { name, at: Date.now() })
  return name
}

// Zwischengespeicherten Namen vergessen, z. B. nach einer Namensänderung
export function forgetUserName(id: string): void {
  nameCache.delete(id)
}

// Eintrag schreiben. Wird bewusst nicht abgewartet, wo es auf Tempo ankommt.
export async function logActivity(actor: Actor, input: ActivityInput): Promise<void> {
  try {
    const actorName = actor.name ?? (actor.type === 'user' && actor.id ? await userName(actor.id) : null)
    await prisma.activity.create({
      data: {
        actorType: actor.type,
        actorId: actor.id ?? null,
        actorName,
        area: input.area,
        action: input.action,
        level: input.level ?? 'info',
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        label: input.label ?? null,
        params: (input.params ?? undefined) as Prisma.InputJsonValue | undefined,
        details: (input.details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
  } catch (error) {
    logger.warn('Aktivität konnte nicht protokolliert werden', error instanceof Error ? error.message : error)
  }
}

// Felder, deren Werte nie ins Protokoll gehören
const SECRET_FIELD = /password|passwort|secret|apikey|api_key|token|enc$/i

// Geänderte Felder zwischen zwei Ständen ermitteln (für die Einzelheiten eines Eintrags)
export function changesOf(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown>,
  fields?: string[],
): Array<{ field: string; from: unknown; to: unknown }> {
  const keys = fields ?? Object.keys(after)
  const result: Array<{ field: string; from: unknown; to: unknown }> = []
  for (const field of keys) {
    if (!(field in after)) continue
    const from = before?.[field] ?? null
    const to = after[field] ?? null
    const a = from instanceof Date ? from.toISOString() : from
    const b = to instanceof Date ? to.toISOString() : to
    if (JSON.stringify(a) === JSON.stringify(b)) continue
    if (SECRET_FIELD.test(field)) result.push({ field, from: from ? '•••' : null, to: to ? '•••' : null })
    else result.push({ field, from: shorten(a), to: shorten(b) })
  }
  return result
}

// Lange Texte (z. B. HTML einer Vorlage) gekürzt ablegen
function shorten(value: unknown): unknown {
  if (typeof value === 'string' && value.length > 300) return `${value.slice(0, 300)}…`
  return value
}
