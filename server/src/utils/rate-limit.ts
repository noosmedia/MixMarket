// Einfache Drosselung im Speicher: höchstens "limit" Anfragen je Schlüssel und Zeitfenster.
// Abgelaufene Einträge werden regelmäßig entfernt, die Größe ist begrenzt.
const buckets = new Map<string, { count: number; resetAt: number }>()
const MAX_KEYS = 20_000

export function hitRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || entry.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) cleanup(true)
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count++
  return entry.count > limit
}

function cleanup(force = false) {
  const now = Date.now()
  for (const [key, entry] of buckets) if (entry.resetAt <= now) buckets.delete(key)
  // Ist der Speicher trotzdem voll, die ältesten Einträge verwerfen
  if (force && buckets.size >= MAX_KEYS) {
    let drop = Math.ceil(MAX_KEYS / 10)
    for (const key of buckets.keys()) {
      buckets.delete(key)
      if (--drop <= 0) break
    }
  }
}

setInterval(() => cleanup(), 5 * 60_000).unref()
