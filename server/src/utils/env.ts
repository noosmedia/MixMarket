// Laedt und validiert die Umgebungsvariablen zentral.
// So greift der Rest des Codes typsicher auf die Konfiguration zu.
import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Hilfsfunktion: Pflichtwert oder Fallback
function str(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

// Hilfsfunktion: Zahl aus Umgebungsvariable
function num(key: string, fallback: number): number {
  const value = process.env[key]
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

// Hilfsfunktion: Boolean aus Umgebungsvariable
function bool(key: string, fallback = false): boolean {
  const value = process.env[key]
  if (value === undefined) return fallback
  return value === 'true' || value === '1'
}

// Geheimschlüssel für Anmeldung und gespeicherte Zugänge. Steht er nicht in der .env, erzeugt
// MixMarket beim ersten Start einen zufälligen Schlüssel und legt ihn neben der Datenbank ab
// (server/prisma/mixmarket.secret). Ein fest eingebauter Ersatzwert wäre für jeden bekannt.
// Als installiertes Programm ist der Programmordner schreibgeschützt: dann liegt der Schlüssel im
// Datenordner des Benutzers (MIXMARKET_DATA_DIR, setzt das Programm selbst).
function generatedSecret(): string {
  const dataDir = process.env.MIXMARKET_DATA_DIR?.trim()
  const file = dataDir
    ? resolve(dataDir, 'mixmarket.secret')
    : resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'prisma', 'mixmarket.secret')
  if (existsSync(file)) {
    const stored = readFileSync(file, 'utf8').trim()
    if (stored.length >= 32) return stored
  }
  const secret = randomBytes(48).toString('hex')
  writeFileSync(file, `${secret}\n`, { mode: 0o600 })
  return secret
}
// Eingetragene Schlüssel nur verwenden, wenn sie lang genug sind und kein Beispielwert aus der Vorlage
function usableSecret(value: string): boolean {
  return value.length >= 32 && !/^bitte-|zufaelligen-schluessel|^change-?me|^your-|^dein-/i.test(value)
}
const configuredJwt = str('JWT_SECRET')
if (configuredJwt && !usableSecret(configuredJwt)) {
  console.warn('[WARN] JWT_SECRET ist zu kurz oder ein Beispielwert und wird ignoriert; MixMarket verwendet einen zufälligen Schlüssel.')
}
const appSecret = configuredJwt && usableSecret(configuredJwt) ? configuredJwt : generatedSecret()

export const env = {
  port: num('PORT', 5260),
  // Standard nur dieser Rechner; im Netz erreichbar nur, wenn ausdrücklich gesetzt
  host: str('HOST', '127.0.0.1'),
  // Vertrauen in X-Forwarded-For nur für den eingetragenen Reverse-Proxy
  trustProxy: str('TRUST_PROXY', ''),
  nodeEnv: str('NODE_ENV', 'development'),
  isProduction: str('NODE_ENV', 'development') === 'production',
  publicApiUrl: str('PUBLIC_API_URL', 'http://localhost:5260'),
  publicWebUrl: str('PUBLIC_WEB_URL', 'http://localhost:5261'),

  jwtSecret: appSecret,
  jwtExpiresIn: str('JWT_EXPIRES_IN', '7d'),
  // Schlüssel für gespeicherte Zugangsdaten (fällt auf JWT_SECRET zurück)
  secretsKey: str('SECRETS_KEY') || appSecret,

  smtp: {
    host: str('SMTP_HOST'),
    port: num('SMTP_PORT', 587),
    secure: bool('SMTP_SECURE', false),
    user: str('SMTP_USER'),
    pass: str('SMTP_PASS'),
    fromAddress: str('MAIL_FROM_ADDRESS'),
    fromName: str('MAIL_FROM_NAME', 'MixMarket'),
  },

  send: {
    ratePerHour: num('SEND_RATE_PER_HOUR', 200),
    delayMs: num('SEND_DELAY_MS', 1500),
  },

  // Adresse des Lizenzservers für MixMarket Pro (Kauf, Freischalten, Pro-Paket)
  // Leerer Eintrag in der .env (wie in .env.example) zählt als nicht gesetzt: dann gilt die feste Adresse
  licenseServerUrl: (str('MIXMARKET_LICENSE_URL').trim() || 'https://lizenz.noosmedia.de').replace(/\/$/, ''),

  // Ordner mit der fertig gebauten Oberfläche (web/dist). Gesetzt liefert der Server die Oberfläche
  // selbst aus (installiertes Programm); leer übernimmt das in der Entwicklung Vite.
  webDir: str('MIXMARKET_WEB_DIR').trim(),
}

// Ob ein echter Versand möglich ist, prüft isSmtpConfigured() im Postfach-Dienst
// (mailer.service.ts), denn die Zugangsdaten können auch in den Einstellungen stehen.
