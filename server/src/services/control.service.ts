// Steuerung: Not-Aus für jeden Versand, automatische Pause bei zu vielen Rückläufern,
// Auslastung der KI-Abos (Claude und ChatGPT/Codex), KI-Pause ab einer Grenze und Hinweise
// für "Wartet auf Sie". Jeder KI-Aufruf läuft über completeTracked und wird gezählt.
import { readdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Prisma, Settings } from '../generated/prisma/client.js'
import { prisma } from '../db/prisma.js'
import { logger } from '../utils/logger.js'
import { AiPausedError, type AiProvider, type AiProviderKey } from './ai/providers.js'
import { SYSTEM, logActivity, type Actor } from './activity.service.js'

export async function loadSettings(): Promise<Settings> {
  return (
    (await prisma.settings.findUnique({ where: { id: 'singleton' } })) ?? prisma.settings.create({ data: { id: 'singleton' } })
  )
}

// ---------------------------------------------------------------------------
// Hinweise für "Wartet auf Sie"
// ---------------------------------------------------------------------------

export async function createNotice(input: {
  kind: 'unsubscribe' | 'bounce' | 'stop' | 'aiPause'
  label?: string | null
  entityType?: string | null
  entityId?: string | null
  params?: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.notice.create({
      data: {
        kind: input.kind,
        label: input.label ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        params: (input.params ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
  } catch (error) {
    logger.warn('Hinweis konnte nicht angelegt werden', error instanceof Error ? error.message : error)
  }
}

// ---------------------------------------------------------------------------
// Not-Aus
// ---------------------------------------------------------------------------

export async function isSendingStopped(): Promise<boolean> {
  return (await loadSettings()).sendingStopped
}

export const STOPPED_MESSAGE = 'Der Versand ist per Not-Aus gestoppt'

export async function emergencyStop(
  reason: 'manual' | 'bounces',
  actor: Actor,
  details?: Record<string, unknown>,
): Promise<boolean> {
  const settings = await loadSettings()
  if (settings.sendingStopped) return false
  await prisma.settings.update({
    where: { id: 'singleton' },
    data: { sendingStopped: true, sendingStoppedAt: new Date(), sendingStopReason: reason },
  })
  void logActivity(actor, {
    area: 'control',
    action: 'control.stopped',
    level: 'warning',
    params: { reason },
    ...(details ? { details } : {}),
  })
  if (reason !== 'manual') await createNotice({ kind: 'stop', params: { reason, ...details } })
  logger.warn(`Not-Aus ausgelöst (${reason})`)
  return true
}

export async function resumeSending(actor: Actor): Promise<boolean> {
  const settings = await loadSettings()
  if (!settings.sendingStopped) return false
  await prisma.settings.update({
    where: { id: 'singleton' },
    data: { sendingStopped: false, sendingStoppedAt: null, sendingStopReason: null },
  })
  void logActivity(actor, { area: 'control', action: 'control.resumed' })
  return true
}

// Versandzahlen der letzten 24 Stunden (nur echte Mails, kein Testversand)
export async function sendsSince(since: Date) {
  const [outbox, campaigns, automations, replies] = await Promise.all([
    prisma.outboxMessage.count({ where: { status: 'sent', testMode: false, sentAt: { gte: since } } }),
    prisma.send.count({ where: { status: { in: ['sent', 'bounced'] }, sentAt: { gte: since } } }),
    prisma.automationRun.count({ where: { status: 'sent', sentAt: { gte: since } } }),
    prisma.inboxReply.count({ where: { status: 'sent', testMode: false, sentAt: { gte: since } } }),
  ])
  return { outbox, campaigns, automations, replies, total: outbox + campaigns + automations + replies }
}

// Nach jedem dauerhaften Rückläufer prüfen: zu viele in 24 Stunden lösen den Not-Aus aus
const BOUNCE_MIN_SENDS = 20
const BOUNCE_MAX_ABSOLUTE = 10

export async function checkBounceRate(): Promise<void> {
  const settings = await loadSettings()
  if (settings.sendingStopped) return
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const sends = await sendsSince(since)
  const hard = await prisma.inboxMessage.count({ where: { kind: 'bounce', bounceType: 'hard', createdAt: { gte: since } } })
  const percent = sends.total > 0 ? Math.round((hard / sends.total) * 1000) / 10 : 0
  const tooMany = hard >= BOUNCE_MAX_ABSOLUTE || (sends.total >= BOUNCE_MIN_SENDS && percent >= settings.bounceStopPercent)
  if (tooMany) await emergencyStop('bounces', SYSTEM, { bounces: hard, sends: sends.total, percent })
}

// ---------------------------------------------------------------------------
// Auslastung der KI-Abos
// ---------------------------------------------------------------------------

export interface QuotaWindow {
  utilization: number // Prozent 0 bis 100
  resetsAt: string | null
}
export interface Quota {
  provider: AiProviderKey
  fiveHour: QuotaWindow | null
  sevenDay: QuotaWindow | null
  // Zeitpunkt des Messwerts (bei Codex der zuletzt gemeldete Stand)
  observedAt: string | null
  error: string | null
}

// Claude: wie /usage in Claude Code über den lokalen Anmeldeschlüssel. Die Schnittstelle ist nicht
// offiziell dokumentiert; jeder Fehler führt nur zu "nicht abrufbar".
async function claudeToken(): Promise<string | null> {
  const dirs = [process.env.CLAUDE_CONFIG_DIR, join(homedir(), '.claude')].filter(Boolean) as string[]
  for (const dir of dirs) {
    try {
      const data = JSON.parse(await readFile(join(dir, '.credentials.json'), 'utf8')) as {
        claudeAiOauth?: { accessToken?: string }
      }
      if (data.claudeAiOauth?.accessToken) return data.claudeAiOauth.accessToken
    } catch {
      // nächste Stelle versuchen
    }
  }
  return null
}

function parseClaudeWindow(value: unknown): QuotaWindow | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { utilization?: unknown; resets_at?: unknown }
  if (typeof v.utilization !== 'number') return null
  return { utilization: v.utilization, resetsAt: typeof v.resets_at === 'string' && v.resets_at ? v.resets_at : null }
}

async function fetchClaudeQuota(): Promise<Quota> {
  const base: Quota = { provider: 'claude', fiveHour: null, sevenDay: null, observedAt: null, error: null }
  const token = await claudeToken()
  if (!token) return { ...base, error: 'Claude Code ist auf diesem Rechner nicht angemeldet' }
  try {
    const response = await fetch('https://api.anthropic.com/api/oauth/usage', {
      headers: { Authorization: `Bearer ${token}`, 'anthropic-beta': 'oauth-2025-04-20' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return { ...base, error: `Abfrage nicht möglich (Status ${response.status})` }
    const data = (await response.json()) as Record<string, unknown>
    return {
      ...base,
      fiveHour: parseClaudeWindow(data.five_hour),
      sevenDay: parseClaudeWindow(data.seven_day),
      observedAt: new Date().toISOString(),
    }
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : 'Abfrage nicht möglich' }
  }
}

// Codex: der zuletzt gemeldete Stand steht in den Sitzungsdateien unter ~/.codex/sessions (nur lesen)
async function newestFiles(dir: string, depth: number): Promise<string[]> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return []
  }
  if (depth === 0) {
    const files = entries.filter((e) => e.endsWith('.jsonl')).map((e) => join(dir, e))
    const withTime = await Promise.all(files.map(async (f) => ({ f, t: (await stat(f).catch(() => null))?.mtimeMs ?? 0 })))
    return withTime.sort((a, b) => b.t - a.t).map((x) => x.f)
  }
  // Ordner sind nach Jahr, Monat und Tag benannt: absteigend durchsuchen
  const sorted = entries.filter((e) => /^\d+$/.test(e)).sort((a, b) => Number(b) - Number(a))
  const out: string[] = []
  for (const sub of sorted) {
    out.push(...(await newestFiles(join(dir, sub), depth - 1)))
    if (out.length >= 5) break
  }
  return out
}

function codexWindow(value: unknown): QuotaWindow | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { used_percent?: unknown; resets_at?: unknown }
  if (typeof v.used_percent !== 'number') return null
  const resetsAt = typeof v.resets_at === 'number' ? new Date(v.resets_at * 1000).toISOString() : null
  // Ist das Fenster seit der Meldung abgelaufen, ist der Wert überholt
  if (resetsAt && Date.parse(resetsAt) < Date.now()) return { utilization: 0, resetsAt: null }
  return { utilization: v.used_percent, resetsAt }
}

async function fetchCodexQuota(): Promise<Quota> {
  const base: Quota = { provider: 'codex', fiveHour: null, sevenDay: null, observedAt: null, error: null }
  const home = process.env.CODEX_HOME || join(homedir(), '.codex')
  const files = await newestFiles(join(home, 'sessions'), 3)
  for (const file of files.slice(0, 5)) {
    let text: string
    try {
      text = await readFile(file, 'utf8')
    } catch {
      continue
    }
    const lines = text.split('\n').filter((l) => l.includes('"rate_limits"'))
    for (const line of lines.reverse()) {
      try {
        const event = JSON.parse(line) as {
          timestamp?: string
          payload?: { rate_limits?: { primary?: unknown; secondary?: unknown } }
        }
        const limits = event.payload?.rate_limits
        if (!limits) continue
        return {
          ...base,
          fiveHour: codexWindow(limits.primary),
          sevenDay: codexWindow(limits.secondary),
          observedAt: event.timestamp ?? null,
        }
      } catch {
        // Zeile überspringen
      }
    }
  }
  return { ...base, error: 'Noch kein Stand von Codex gemeldet' }
}

// Zwischenspeicher: gute Werte 5 Minuten, Fehler 1 Minute
const quotaCache = new Map<AiProviderKey, { at: number; ttl: number; value: Quota }>()

export async function getQuota(provider: AiProviderKey, force = false): Promise<Quota> {
  const hit = quotaCache.get(provider)
  if (!force && hit && Date.now() - hit.at < hit.ttl) return hit.value
  const value = provider === 'claude' ? await fetchClaudeQuota() : await fetchCodexQuota()
  quotaCache.set(provider, { at: Date.now(), ttl: value.error ? 60_000 : 300_000, value })
  return value
}

// KI-Pause: höchste Auslastung über der Grenze; Ende ist der Zeitpunkt, an dem das betroffene Fenster zurückgesetzt wird
export async function aiPauseState(
  settings?: Settings,
): Promise<{ paused: boolean; until: string | null; utilization: number | null }> {
  const s = settings ?? (await loadSettings())
  if (s.aiProvider !== 'claude' && s.aiProvider !== 'codex') return { paused: false, until: null, utilization: null }
  if (s.aiPausePercent >= 100) return { paused: false, until: null, utilization: null }
  const quota = await getQuota(s.aiProvider)
  const windows = [quota.fiveHour, quota.sevenDay].filter((w): w is QuotaWindow => !!w)
  const over = windows.filter((w) => w.utilization >= s.aiPausePercent)
  const utilization = windows.length ? Math.max(...windows.map((w) => w.utilization)) : null
  if (!over.length) return { paused: false, until: null, utilization }
  const until =
    over
      .map((w) => w.resetsAt)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null
  return { paused: true, until, utilization }
}

// Zustandswechsel der KI-Pause nur einmal melden
let lastPaused = false

async function notePause(paused: boolean, until: string | null, utilization: number | null) {
  if (paused && !lastPaused) {
    void logActivity(SYSTEM, {
      area: 'control',
      action: 'control.aiPaused',
      level: 'warning',
      params: { utilization: utilization ?? 0 },
    })
    await createNotice({ kind: 'aiPause', params: { until, utilization } })
  } else if (!paused && lastPaused) {
    void logActivity(SYSTEM, { area: 'control', action: 'control.aiResumed' })
  }
  lastPaused = paused
}

// ---------------------------------------------------------------------------
// Gezählter KI-Aufruf mit Prüfung der KI-Pause
// ---------------------------------------------------------------------------

export type AiArea = 'scoring' | 'outbox' | 'inbox'

export async function completeTracked(
  area: AiArea,
  provider: AiProvider,
  prompt: string,
  options: { model?: string | null; schema?: object; timeoutMs?: number },
): Promise<string> {
  const pause = await aiPauseState()
  await notePause(pause.paused, pause.until, pause.utilization)
  if (pause.paused) {
    throw new AiPausedError(`KI-Pause: Das Abo ist zu ${Math.round(pause.utilization ?? 0)} % ausgelastet`, pause.until)
  }
  const started = Date.now()
  try {
    const answer = await provider.complete(prompt, options)
    await recordCall(area, provider.key, true, Date.now() - started, null)
    return answer
  } catch (error) {
    await recordCall(area, provider.key, false, Date.now() - started, error instanceof Error ? error.message : String(error))
    // Nach einem Kontingentfehler den Stand sofort neu abfragen
    quotaCache.delete(provider.key)
    throw error
  }
}

async function recordCall(area: AiArea, provider: string, ok: boolean, durationMs: number, error: string | null) {
  try {
    await prisma.aiCall.create({ data: { area, provider, ok, durationMs, error: error ? error.slice(0, 500) : null } })
  } catch (e) {
    logger.warn('KI-Aufruf konnte nicht gezählt werden', e instanceof Error ? e.message : e)
  }
}

// Aufrufe je Bereich in einem Zeitraum
export async function callsSince(since: Date) {
  const rows = await prisma.aiCall.groupBy({ by: ['area', 'ok'], where: { createdAt: { gte: since } }, _count: { _all: true } })
  const out: Record<AiArea, { ok: number; failed: number }> = {
    scoring: { ok: 0, failed: 0 },
    outbox: { ok: 0, failed: 0 },
    inbox: { ok: 0, failed: 0 },
  }
  for (const r of rows) {
    const area = r.area as AiArea
    if (!out[area]) continue
    if (r.ok) out[area].ok += r._count._all
    else out[area].failed += r._count._all
  }
  return out
}
