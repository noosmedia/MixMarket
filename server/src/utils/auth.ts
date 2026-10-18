// Hilfsfunktionen für Passwörter, Wiederherstellungsschlüssel und JWT-Tokens.
import { randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from './env.js'

export interface TokenPayload {
  userId: string
  email: string
  // Sitzungsnummer des Kontos zum Zeitpunkt der Anmeldung
  tv?: number
}

// Mindestlänge neuer Passwörter
export const MIN_PASSWORD_LENGTH = 10

// Zeichen für den Wiederherstellungsschlüssel, ohne leicht verwechselbare wie 0/O und 1/I
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// Wiederherstellungsschlüssel erzeugen: 6 Gruppen zu 4 Zeichen, z. B. K7QF-2MXP-...
export function generateRecoveryKey(): string {
  const groups: string[] = []
  for (let g = 0; g < 6; g++) {
    let part = ''
    for (let i = 0; i < 4; i++) part += KEY_ALPHABET[randomInt(KEY_ALPHABET.length)]
    groups.push(part)
  }
  return groups.join('-')
}

// Eingabe des Schlüssels vereinheitlichen: Groß- und Kleinschreibung, Leerzeichen und Striche egal
export function normalizeRecoveryKey(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Passwort sicher hashen
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

// Passwort gegen Hash pruefen
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// Signierten Token erzeugen
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions)
}

// Token pruefen und Payload zurückgeben (oder null bei Fehler)
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload
  } catch {
    return null
  }
}
