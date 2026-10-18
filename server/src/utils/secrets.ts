// Verschlüsselung für Zugangsdaten, die in der Datenbank liegen (z. B. API-Schlüssel
// der Suchquellen). AES-256-GCM mit einem Schlüssel aus SECRETS_KEY, ersatzweise
// aus JWT_SECRET. Ändert sich dieser Schlüssel, lassen sich gespeicherte Werte
// nicht mehr lesen und müssen in den Einstellungen neu eingetragen werden.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { env } from './env.js'
import { logger } from './logger.js'

// 32-Byte-Schlüssel aus dem konfigurierten Geheimnis ableiten
function key(): Buffer {
  return createHash('sha256').update(env.secretsKey).digest()
}

// Klartext verschlüsseln. Ergebnis: iv.tag.daten, jeweils Base64
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, data].map((b) => b.toString('base64')).join('.')
}

// Verschlüsselten Wert lesen. Gibt null zurück, wenn er fehlt oder nicht lesbar ist.
export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const [iv, tag, data] = value.split('.').map((part) => Buffer.from(part, 'base64'))
    const decipher = createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    logger.warn('Gespeicherter Zugang ließ sich nicht entschlüsseln (Schlüssel geändert?)')
    return null
  }
}
