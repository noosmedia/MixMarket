// Notlösung bei vergessenem Passwort und verlorenem Wiederherstellungsschlüssel.
// Aufruf auf dem Rechner, auf dem MixMarket läuft, im MixMarket-Ordner:  npm run reset-password
// Fragt zweimal nach dem neuen Passwort (Eingabe unsichtbar), setzt es und zeigt einen neuen
// Wiederherstellungsschlüssel an. Alle bisherigen Anmeldungen werden damit ungültig.
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import { prisma } from '../db/prisma.js'
import { MIN_PASSWORD_LENGTH, generateRecoveryKey, hashPassword, normalizeRecoveryKey } from '../utils/auth.js'
import { SYSTEM, logActivity } from '../services/activity.service.js'

// Ein gemeinsamer Leser für alle Fragen; die Eingabe wird nicht auf dem Bildschirm angezeigt
let muted = false
const output = new Writable({
  write(chunk, _encoding, done) {
    if (!muted) process.stdout.write(chunk)
    done()
  },
})
const rl = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) })
const lines = rl[Symbol.asyncIterator]()

async function askHidden(question: string): Promise<string> {
  process.stdout.write(question)
  muted = true
  const next = await lines.next()
  muted = false
  process.stdout.write('\n')
  return next.done ? '' : next.value
}

async function main(): Promise<void> {
  const users = await prisma.user.findMany()
  if (users.length === 0) {
    console.log('Es gibt noch kein Konto. Bitte MixMarket starten und im Browser einrichten.')
    return
  }
  const user = users[0]!
  console.log(`Neues Passwort für das MixMarket-Konto ${user.email} festlegen.`)
  console.log(`Mindestens ${MIN_PASSWORD_LENGTH} Zeichen. Die Eingabe ist unsichtbar.\n`)

  const first = await askHidden('Neues Passwort: ')
  if (first.length < MIN_PASSWORD_LENGTH) {
    console.log(`Abgebrochen: Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben.`)
    process.exitCode = 1
    return
  }
  const second = await askHidden('Passwort wiederholen: ')
  if (first !== second) {
    console.log('Abgebrochen: Die beiden Eingaben stimmen nicht überein.')
    process.exitCode = 1
    return
  }

  const recoveryKey = generateRecoveryKey()
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(first),
      recoveryKeyHash: await hashPassword(normalizeRecoveryKey(recoveryKey)),
      tokenVersion: { increment: 1 },
    },
  })
  await logActivity(SYSTEM, {
    area: 'auth',
    action: 'auth.passwordReset',
    level: 'warning',
    entityType: 'user',
    entityId: user.id,
    label: user.email,
  })

  console.log('\nDas Passwort ist geändert. Sie können sich jetzt im Browser anmelden.')
  console.log('\nIhr neuer Wiederherstellungsschlüssel (bitte sicher aufbewahren, der alte gilt nicht mehr):\n')
  console.log(`    ${recoveryKey}\n`)
}

main()
  .catch((error) => {
    console.error('Das Passwort konnte nicht geändert werden:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => {
    rl.close()
    return prisma.$disconnect()
  })
