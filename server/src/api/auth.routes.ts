// Routen für Ersteinrichtung, Anmeldung, "Passwort vergessen", Abmeldung und das eigene Konto.
// MixMarket hat genau ein Konto. Es entsteht bei der Ersteinrichtung; danach gibt es nur die Anmeldung.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { randomInt, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import {
  MIN_PASSWORD_LENGTH,
  generateRecoveryKey,
  hashPassword,
  normalizeRecoveryKey,
  signToken,
  verifyPassword,
  verifyToken,
} from '../utils/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { env } from '../utils/env.js'
import { changesOf, forgetUserName, logActivity, userActor } from '../services/activity.service.js'
import { logger } from '../utils/logger.js'

const email = z.string().trim().toLowerCase().email('Bitte eine gültige E-Mail-Adresse eingeben').max(320)
const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben`)
  .max(200, 'Das Passwort ist zu lang')

const setupSchema = z.object({
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(120),
  email,
  password: newPassword,
  // Nur nötig, wenn die Einrichtung nicht von diesem Rechner aus geschieht
  setupCode: z.string().trim().max(40).optional(),
})
const loginSchema = z.object({ email, password: z.string().min(1, 'Bitte das Passwort eingeben').max(200) })
const recoverSchema = z.object({
  email,
  recoveryKey: z.string().min(1, 'Bitte den Wiederherstellungsschlüssel eingeben').max(100),
  newPassword,
})
const accountSchema = z.object({
  name: z.string().trim().min(1, 'Bitte einen Namen eingeben').max(120),
  email,
  currentPassword: z.string().max(200).optional(),
})
const passwordSchema = z.object({ currentPassword: z.string().min(1, 'Bitte das bisherige Passwort eingeben').max(200), newPassword })
const confirmSchema = z.object({ currentPassword: z.string().min(1, 'Bitte das Passwort eingeben').max(200) })

// --- Schutz vor Ausprobieren: nach 5 Fehlversuchen in 15 Minuten ist die Netzwerkadresse 5 Minuten gesperrt.
// Für das Konto gibt es keine harte Sperre (sonst ließe sich der Inhaber absichtlich aussperren),
// sondern eine wachsende Verzögerung jeder weiteren Antwort. ---
const MAX_FAILURES = 5
const WINDOW_MS = 15 * 60_000
const LOCK_MS = 5 * 60_000
const MAX_ENTRIES = 10_000
const failures = new Map<string, { count: number; first: number; lockedUntil: number }>()

// Abgelaufene Einträge entfernen, damit die Liste nicht unbegrenzt wächst
function pruneFailures() {
  const now = Date.now()
  for (const [key, e] of failures) if (now - e.first > WINDOW_MS && e.lockedUntil < now) failures.delete(key)
}
setInterval(pruneFailures, 10 * 60_000).unref()

// Verzögerung für ein Konto nach vielen Fehlversuchen: ab dem fünften je 2 Sekunden mehr, höchstens 10
async function accountDelay(key: string) {
  const entry = failures.get(key)
  if (!entry || Date.now() - entry.first > WINDOW_MS || entry.count < MAX_FAILURES) return
  await new Promise((r) => setTimeout(r, Math.min(10_000, (entry.count - MAX_FAILURES + 1) * 2000)))
}
function countAccountFailure(key: string) {
  const now = Date.now()
  const entry = failures.get(key)
  if (!entry || now - entry.first > WINDOW_MS) failures.set(key, { count: 1, first: now, lockedUntil: 0 })
  else entry.count++
}

// Vergleichswert, damit eine unbekannte E-Mail genauso lange dauert wie ein falsches Passwort
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.Ku1H2Yb6k3RnF9Gq5x2DxkW8oQ0e'

// Einrichtungscode: nur nötig, wenn die Ersteinrichtung nicht von diesem Rechner aus geschieht.
// Er steht beim Start im Serverprotokoll, solange noch kein Konto existiert.
let setupCode: string | null = null
function newSetupCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join('')
  return `${part()}-${part()}`
}
// Anfrage kommt direkt von diesem Rechner (nicht über einen Vermittler aus dem Netz)
function isLocalRequest(request: FastifyRequest): boolean {
  const remote = request.socket.remoteAddress ?? ''
  const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)
  return loopback && !request.headers['x-forwarded-for'] && !request.headers['x-real-ip'] && !request.headers.forwarded
}
function codeMatches(input: string | undefined): boolean {
  if (!setupCode || !input) return false
  const a = Buffer.from(input.trim().toUpperCase())
  const b = Buffer.from(setupCode)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Verbleibende Sperrzeit in Sekunden, 0 wenn frei
function lockRemaining(key: string): number {
  const entry = failures.get(key)
  if (!entry) return 0
  const left = entry.lockedUntil - Date.now()
  return left > 0 ? Math.ceil(left / 1000) : 0
}

// Fehlversuch zählen; liefert true, wenn damit die Sperre beginnt
function registerFailure(key: string): boolean {
  if (failures.size >= MAX_ENTRIES) pruneFailures()
  const now = Date.now()
  const entry = failures.get(key)
  if (!entry || now - entry.first > WINDOW_MS) {
    failures.set(key, { count: 1, first: now, lockedUntil: 0 })
    return false
  }
  entry.count++
  if (entry.count >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCK_MS
    entry.count = 0
    entry.first = now
    return true
  }
  return false
}

function lockedReply(reply: FastifyReply, seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return reply.code(429).send({
    error: `Zu viele Fehlversuche. Bitte in ${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'} erneut versuchen.`,
    // Für die Meldung in der Sprache der Oberfläche
    retryAfterMinutes: minutes,
  })
}

function firstError(error: z.ZodError): string {
  return error.errors[0]?.message ?? 'Ungültige Eingabe'
}

// Öffentliche Angaben zum Konto, ohne Hashes
function publicUser(u: { id: string; email: string; name: string }) {
  return { id: u.id, email: u.email, name: u.name }
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Cookie-Optionen: "secure" nur, wenn die Oberfläche über https erreichbar ist. Hinge es am Betriebsmodus,
  // könnte sich im installierten Programm (Produktion, aber http://127.0.0.1) niemand anmelden.
  const cookieOptions = {
    httpOnly: true,
    secure: env.publicWebUrl.startsWith('https://'),
    // Strikt: der Cookie geht nie mit Anfragen anderer Seiten mit
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
  }

  function signIn(reply: FastifyReply, user: { id: string; email: string; tokenVersion: number }) {
    reply.setCookie('token', signToken({ userId: user.id, email: user.email, tv: user.tokenVersion }), cookieOptions)
  }

  // Ohne Konto beim Start einen Einrichtungscode erzeugen und ins Serverprotokoll schreiben
  if ((await prisma.user.count()) === 0) {
    setupCode = newSetupCode()
    logger.info(`Noch kein Konto. Einrichtungscode für die Einrichtung von einem anderen Rechner aus: ${setupCode}`)
  }

  // Muss MixMarket noch eingerichtet werden? (öffentlich, für die Startseite)
  app.get('/api/auth/status', async (request) => {
    const needsSetup = (await prisma.user.count()) === 0
    return { needsSetup, setupCodeRequired: needsSetup && !isLocalRequest(request) }
  })

  // Ersteinrichtung: legt das einzige Konto an. Nur möglich, solange es noch kein Konto gibt.
  app.post('/api/auth/setup', async (request, reply) => {
    if ((await prisma.user.count()) > 0) {
      return reply.code(409).send({ error: 'MixMarket ist bereits eingerichtet. Bitte melden Sie sich an.' })
    }
    const parsed = setupSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: firstError(parsed.error) })
    // Von außen nur mit dem Einrichtungscode aus dem Serverprotokoll; nach 5 falschen Codes ist die Adresse gesperrt
    if (!isLocalRequest(request)) {
      const remaining = lockRemaining(`setup:${request.ip}`)
      if (remaining) return lockedReply(reply, remaining)
    }
    if (!isLocalRequest(request) && !codeMatches(parsed.data.setupCode)) {
      if (registerFailure(`setup:${request.ip}`)) return lockedReply(reply, LOCK_MS / 1000)
      return reply.code(403).send({ error: 'Einrichtungscode fehlt oder ist falsch', code: 'setupCode' })
    }
    const recoveryKey = generateRecoveryKey()
    const passwordHash = await hashPassword(parsed.data.password)
    const recoveryKeyHash = await hashPassword(normalizeRecoveryKey(recoveryKey))
    // Prüfen und Anlegen in einem Schritt, damit zwei gleichzeitige Anfragen nicht zwei Konten erzeugen
    const user = await prisma.$transaction(async (tx) => {
      if ((await tx.user.count()) > 0) return null
      return tx.user.create({
        data: { name: parsed.data.name, email: parsed.data.email, passwordHash, recoveryKeyHash },
      })
    })
    if (!user) return reply.code(409).send({ error: 'MixMarket ist bereits eingerichtet. Bitte melden Sie sich an.' })
    setupCode = null
    signIn(reply, user)
    void logActivity(
      { type: 'user', id: user.id, name: user.name },
      { area: 'auth', action: 'auth.setup', entityType: 'user', entityId: user.id, label: user.email },
    )
    // Der Schlüssel wird nur dieses eine Mal im Klartext gezeigt
    return reply.send({ user: publicUser(user), recoveryKey })
  })

  // Anmeldung
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: firstError(parsed.error) })
    const { email: mail, password } = parsed.data
    // Harte Sperre je Netzwerkadresse, für das Konto nur eine wachsende Verzögerung
    const ipKey = `login:${request.ip}`
    const accountKey = `login-account:${mail}`
    const remaining = lockRemaining(ipKey)
    if (remaining) return lockedReply(reply, remaining)
    await accountDelay(accountKey)

    const user = await prisma.user.findUnique({ where: { email: mail } })
    const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
    if (!user || !passwordOk) {
      countAccountFailure(accountKey)
      const locked = registerFailure(ipKey)
      // Fehlgeschlagene Anmeldung: nur die eingegebene E-Mail, nie das Passwort
      void logActivity(
        { type: 'user', id: user?.id ?? null, name: mail },
        { area: 'auth', action: locked ? 'auth.locked' : 'auth.loginFailed', level: 'warning', label: mail },
      )
      if (locked) return lockedReply(reply, LOCK_MS / 1000)
      return reply.code(401).send({ error: 'E-Mail oder Passwort falsch' })
    }

    failures.delete(ipKey)
    failures.delete(accountKey)
    signIn(reply, user)
    void logActivity(
      { type: 'user', id: user.id, name: user.name },
      { area: 'auth', action: 'auth.login', entityType: 'user', entityId: user.id, label: user.email },
    )
    return reply.send({ user: publicUser(user) })
  })

  // Passwort vergessen: mit E-Mail und Wiederherstellungsschlüssel ein neues Passwort setzen.
  // Danach gilt ein neuer Schlüssel, der alte ist verbraucht.
  app.post('/api/auth/recover', async (request, reply) => {
    const parsed = recoverSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: firstError(parsed.error) })
    const ipKey = `recover:${request.ip}`
    const accountKey = `recover-account:${parsed.data.email}`
    const remaining = lockRemaining(ipKey)
    if (remaining) return lockedReply(reply, remaining)
    await accountDelay(accountKey)
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    const keyOk = await verifyPassword(normalizeRecoveryKey(parsed.data.recoveryKey), user?.recoveryKeyHash ?? DUMMY_HASH)
    if (!user || !user.recoveryKeyHash || !keyOk) {
      countAccountFailure(accountKey)
      const locked = registerFailure(ipKey)
      void logActivity(
        { type: 'user', id: user?.id ?? null, name: parsed.data.email },
        { area: 'auth', action: locked ? 'auth.locked' : 'auth.recoverFailed', level: 'warning', label: parsed.data.email },
      )
      if (locked) return lockedReply(reply, LOCK_MS / 1000)
      return reply.code(401).send({ error: 'E-Mail oder Wiederherstellungsschlüssel falsch' })
    }

    failures.delete(ipKey)
    failures.delete(accountKey)
    const recoveryKey = generateRecoveryKey()
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(parsed.data.newPassword),
        recoveryKeyHash: await hashPassword(normalizeRecoveryKey(recoveryKey)),
        tokenVersion: { increment: 1 },
      },
    })
    signIn(reply, updated)
    void logActivity(
      { type: 'user', id: user.id, name: user.name },
      { area: 'auth', action: 'auth.recovered', level: 'warning', entityType: 'user', entityId: user.id, label: user.email },
    )
    return reply.send({ user: publicUser(updated), recoveryKey })
  })

  // Abmeldung
  app.post('/api/auth/logout', async (request, reply) => {
    // Die Abmeldung ist nicht geschützt: den Nutzer nur protokollieren, wenn das Cookie gültig ist
    const token = request.cookies?.token
    const payload = token ? verifyToken(token) : null
    if (payload) {
      // Das Token wird ungültig, auch falls es jemand abgegriffen hat (meldet alle Geräte ab)
      await prisma.user.updateMany({ where: { id: payload.userId, tokenVersion: payload.tv }, data: { tokenVersion: { increment: 1 } } })
      void logActivity(
        { type: 'user', id: payload.userId },
        { area: 'auth', action: 'auth.logout', entityType: 'user', entityId: payload.userId, label: payload.email },
      )
    }
    reply.clearCookie('token', { path: '/' })
    return reply.send({ ok: true })
  })

  // Aktuelles Konto
  app.get('/api/auth/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    if (!user) return reply.code(404).send({ error: 'Konto nicht gefunden' })
    return reply.send({ user })
  })

  // Name und E-Mail ändern; eine neue E-Mail verlangt das Passwort
  app.put('/api/auth/account', { preHandler: requireAuth }, async (request: FastifyRequest, reply) => {
    const parsed = accountSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: firstError(parsed.error) })
    const before = await prisma.user.findUnique({ where: { id: request.user!.userId } })
    if (!before) return reply.code(404).send({ error: 'Konto nicht gefunden' })
    if (parsed.data.email !== before.email) {
      if (!parsed.data.currentPassword || !(await verifyPassword(parsed.data.currentPassword, before.passwordHash))) {
        return reply.code(403).send({ error: 'Zum Ändern der E-Mail bitte das aktuelle Passwort eingeben' })
      }
    }
    const user = await prisma.user.update({
      where: { id: before.id },
      data: { name: parsed.data.name, email: parsed.data.email },
    })
    // Neue E-Mail steckt im Anmeldetoken: neu ausstellen
    signIn(reply, user)
    forgetUserName(user.id)
    const changes = changesOf(before, { name: user.name, email: user.email }, ['name', 'email'])
    if (changes.length) {
      void logActivity(userActor(request), {
        area: 'auth',
        action: 'auth.accountUpdated',
        entityType: 'user',
        entityId: user.id,
        label: user.email,
        details: { changes },
      })
    }
    return reply.send({ user: publicUser(user) })
  })

  // Passwort ändern; andere Anmeldungen werden damit ungültig, diese bleibt angemeldet
  app.put('/api/auth/password', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = passwordSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: firstError(parsed.error) })
    const user = await prisma.user.findUnique({ where: { id: request.user!.userId } })
    if (!user) return reply.code(404).send({ error: 'Konto nicht gefunden' })
    if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return reply.code(403).send({ error: 'Das bisherige Passwort stimmt nicht' })
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword), tokenVersion: { increment: 1 } },
    })
    signIn(reply, updated)
    void logActivity(userActor(request), {
      area: 'auth',
      action: 'auth.passwordChanged',
      entityType: 'user',
      entityId: user.id,
      label: user.email,
    })
    return reply.send({ ok: true })
  })

  // Neuen Wiederherstellungsschlüssel erzeugen (der alte wird ungültig); verlangt das Passwort
  app.post('/api/auth/recovery-key', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = confirmSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: firstError(parsed.error) })
    const user = await prisma.user.findUnique({ where: { id: request.user!.userId } })
    if (!user) return reply.code(404).send({ error: 'Konto nicht gefunden' })
    if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return reply.code(403).send({ error: 'Das Passwort stimmt nicht' })
    }
    const recoveryKey = generateRecoveryKey()
    await prisma.user.update({
      where: { id: user.id },
      data: { recoveryKeyHash: await hashPassword(normalizeRecoveryKey(recoveryKey)) },
    })
    void logActivity(userActor(request), {
      area: 'auth',
      action: 'auth.recoveryKeyRenewed',
      entityType: 'user',
      entityId: user.id,
      label: user.email,
    })
    return reply.send({ recoveryKey })
  })

  // Hat das Konto schon einen Wiederherstellungsschlüssel? (für den Hinweis in den Einstellungen)
  app.get('/api/auth/recovery-key', { preHandler: requireAuth }, async (request) => {
    const user = await prisma.user.findUnique({ where: { id: request.user!.userId }, select: { recoveryKeyHash: true } })
    return { exists: !!user?.recoveryKeyHash }
  })
}
