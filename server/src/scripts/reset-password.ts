// Notlösung bei vergessenem Passwort und verlorenem Wiederherstellungsschlüssel.
// Zwei Wege, beide nur auf dem Rechner, auf dem MixMarket läuft:
//   Quellcode-Fassung:      npm run reset-password   (im MixMarket-Ordner)
//                           Fragt zweimal nach dem neuen Passwort (Eingabe unsichtbar), setzt es und zeigt
//                           einen neuen Wiederherstellungsschlüssel an.
//   Installiertes Programm: Das Programm startet dieses Skript mit --app und schickt das neue Passwort über
//                           die Standardeingabe (nie als Argument). Die Antwort kommt als eine Zeile JSON
//                           hinter RESULT_MARKER zurück.
// Alle bisherigen Anmeldungen werden in beiden Fällen ungültig.
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import { prisma } from '../db/prisma.js'
import { MIN_PASSWORD_LENGTH, generateRecoveryKey, hashPassword, normalizeRecoveryKey } from '../utils/auth.js'
import { SYSTEM, logActivity } from '../services/activity.service.js'

// Kennung der Ergebniszeile für das Programm (davor kann anderes stehen, etwa Datenbankmeldungen)
const RESULT_MARKER = '__MIXMARKET_RESET__'

type ResetResult =
  | { ok: true; email: string; recoveryKey: string }
  | { ok: false; code: 'noAccount' | 'tooShort' | 'failed'; message?: string }

// Passwort des einzigen Kontos neu setzen, neuen Schlüssel erzeugen, alle Anmeldungen beenden, protokollieren
async function resetPassword(password: string): Promise<ResetResult> {
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, code: 'tooShort' }
  const user = await prisma.user.findFirst()
  if (!user) return { ok: false, code: 'noAccount' }
  const recoveryKey = generateRecoveryKey()
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
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
  return { ok: true, email: user.email, recoveryKey }
}

// --- Programm-Modus: Passwort als JSON über die Standardeingabe, Ergebnis als JSON-Zeile ---

async function runForApp(): Promise<void> {
  let input = ''
  for await (const chunk of process.stdin) input += String(chunk)
  let result: ResetResult
  try {
    const parsed = JSON.parse(input) as { password?: unknown }
    result = await resetPassword(typeof parsed.password === 'string' ? parsed.password : '')
  } catch (error) {
    result = { ok: false, code: 'failed', message: error instanceof Error ? error.message : String(error) }
  }
  process.stdout.write(`${RESULT_MARKER}${JSON.stringify(result)}\n`)
  if (!result.ok) process.exitCode = 1
}

// --- Terminal-Modus: Fragen im Terminal, Eingabe unsichtbar ---

async function runInTerminal(): Promise<void> {
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

  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('Es gibt noch kein Konto. Bitte MixMarket starten und im Browser einrichten.')
      return
    }
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

    const result = await resetPassword(first)
    if (!result.ok) {
      console.log('Das Passwort konnte nicht geändert werden.')
      process.exitCode = 1
      return
    }
    console.log('\nDas Passwort ist geändert. Sie können sich jetzt im Browser anmelden.')
    console.log('\nIhr neuer Wiederherstellungsschlüssel (bitte sicher aufbewahren, der alte gilt nicht mehr):\n')
    console.log(`    ${result.recoveryKey}\n`)
  } finally {
    rl.close()
  }
}

;(process.argv.includes('--app') ? runForApp() : runInTerminal())
  .catch((error) => {
    console.error('Das Passwort konnte nicht geändert werden:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
