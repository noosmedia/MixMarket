// Einfaches, einheitliches Logging.
// In der Entwicklung ausführlich, in der Produktion nur Wichtiges.
import { env } from './env.js'

type Level = 'debug' | 'info' | 'warn' | 'error'

function log(level: Level, message: string, meta?: unknown): void {
  // In Produktion keine Debug-Ausgaben
  if (env.isProduction && level === 'debug') return

  const time = new Date().toISOString()
  const prefix = `[${time}] [${level.toUpperCase()}]`
  if (meta !== undefined) {
    console[level === 'debug' ? 'log' : level](prefix, message, meta)
  } else {
    console[level === 'debug' ? 'log' : level](prefix, message)
  }
}

export const logger = {
  debug: (message: string, meta?: unknown) => log('debug', message, meta),
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
}
