// Prisma-Einstellungen für die Befehle prisma generate, db push und studio.
// Seit Prisma 7 steht die Datenbankadresse hier statt im Schema.
import 'dotenv/config'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'prisma/config'

// Kein Hinweis auf neuere Prisma-Fassungen bei der Installation: er verweist oft auf Vorabversionen und
// verunsichert Nutzer, die MixMarket nur einrichten wollen. Aktualisiert wird mit MixMarket selbst.
process.env.PRISMA_HIDE_UPDATE_MESSAGE ??= 'true'

// Relative SQLite-Pfade (file:./dev.db) gelten wie bisher ab dem Ordner prisma/,
// damit bestehende .env-Dateien weiter auf dieselbe Datenbank zeigen
const prismaDir = resolve(dirname(fileURLToPath(import.meta.url)), 'prisma')
const raw = process.env.DATABASE_URL || 'file:./dev.db'
const file = raw.replace(/^file:/, '')
const url = isAbsolute(file) ? raw : `file:${resolve(prismaDir, file)}`

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url },
})
