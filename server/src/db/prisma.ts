// Zentrale Prisma-Client-Instanz.
// Wird überall importiert, damit nur eine Datenbankverbindung besteht.
import 'dotenv/config'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../generated/prisma/client.js'

// Pfad zur SQLite-Datei: relative Angaben (file:./dev.db) gelten ab dem Ordner prisma/,
// genau wie in prisma.config.ts und wie vor Prisma 7
function databaseFile(): string {
  const prismaDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'prisma')
  const file = (process.env.DATABASE_URL || 'file:./dev.db').replace(/^file:/, '')
  return isAbsolute(file) ? file : resolve(prismaDir, file)
}

// Zeitangaben als Millisekunden-Zahl speichern, wie es Prisma bis Version 6 getan hat.
// Sonst stünden neue Einträge als Text neben alten Zahlen und Datumsfilter würden falsch vergleichen.
const adapter = new PrismaBetterSqlite3({ url: databaseFile() }, { timestampFormat: 'unixepoch-ms' })

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
})
