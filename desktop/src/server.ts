// Datenbank einrichten und den MixMarket-Server starten.
// Der Server läuft als eigener Prozess: Electron startet sich dafür selbst im Node-Modus
// (ELECTRON_RUN_AS_NODE), es wird also kein eigenes Node.js auf dem Rechner gebraucht.
// Alle Daten liegen im Datenordner des Benutzers, nie im Programmordner.
import { app } from 'electron'
import { spawn, type ChildProcess } from 'node:child_process'
import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  type WriteStream,
} from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { completeSearchPath } from './environment'

// Fester Wunsch-Port des Programms (die Entwicklungsfassung nutzt 5260/5261); ist er belegt, wählt das System einen freien
const PREFERRED_PORT = 5268
// So lange darf der Server zum Starten brauchen
const START_TIMEOUT_MS = 90_000
// Protokoll ab dieser Größe beim Start neu beginnen (das alte bleibt als .old.log)
const MAX_LOG_BYTES = 5 * 1024 * 1024
// So viele Datenbanksicherungen vor Aktualisierungen bleiben erhalten
const KEEP_BACKUPS = 3

// Fehler beim Start mit vollständiger Meldung für die Fehleranzeige
export class StartError extends Error {
  constructor(
    message: string,
    readonly detail: string,
  ) {
    super(message)
  }
}

// Ordner und Dateien des Programms
export function paths() {
  const appDir = app.getAppPath()
  const dataDir = app.getPath('userData')
  const logDir = join(dataDir, 'logs')
  return {
    appDir,
    serverDir: join(appDir, 'server'),
    webDir: join(appDir, 'web'),
    prismaCli: join(appDir, 'node_modules', 'prisma', 'build', 'index.js'),
    dataDir,
    dbFile: join(dataDir, 'mixmarket.db'),
    backupDir: join(dataDir, 'backups'),
    stateFile: join(dataDir, 'desktop-state.json'),
    logDir,
    logFile: join(logDir, 'mixmarket.log'),
  }
}

// --- Protokoll ---

let logStream: WriteStream | null = null
// Letzte Zeilen für die Fehleranzeige
const recent: string[] = []

export function openLog(): void {
  const { logDir, logFile } = paths()
  mkdirSync(logDir, { recursive: true })
  if (existsSync(logFile) && statSync(logFile).size > MAX_LOG_BYTES) renameSync(logFile, join(logDir, 'mixmarket.old.log'))
  logStream = createWriteStream(logFile, { flags: 'a' })
  log(`--- MixMarket ${app.getVersion()} startet (${process.platform} ${process.arch}, Electron ${process.versions.electron}) ---`)
}

export function log(text: string): void {
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    recent.push(line)
    if (recent.length > 80) recent.shift()
  }
  logStream?.write(text.endsWith('\n') ? text : `${text}\n`)
}

export function recentLog(): string {
  return recent.join('\n')
}

// --- Gemerkter Stand (welche Version die Datenbank eingerichtet hat) ---

interface DesktopState {
  schemaVersion?: string
  seeded?: boolean
}

function readState(): DesktopState {
  try {
    return JSON.parse(readFileSync(paths().stateFile, 'utf8')) as DesktopState
  } catch {
    return {}
  }
}

function writeState(state: DesktopState): void {
  writeFileSync(paths().stateFile, JSON.stringify(state, null, 2))
}

// --- Node-Prozesse ---

// Adresse der Datenbank; Schrägstriche auch unter Windows, das verstehen Prisma und SQLite
function databaseUrl(): string {
  return `file:${paths().dbFile.replace(/\\/g, '/')}`
}

// Umgebung für Server und Werkzeuge: Electron als Node, Daten im Datenordner, keine Rückmeldungen an Prisma
export function nodeEnvironment(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const { dataDir } = paths()
  return {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    PATH: completeSearchPath(),
    DATABASE_URL: databaseUrl(),
    MIXMARKET_DATA_DIR: dataDir,
    CHECKPOINT_DISABLE: '1',
    PRISMA_HIDE_UPDATE_MESSAGE: 'true',
    ...extra,
  }
}

// Node-Skript ausführen und die gesamte Ausgabe sammeln (auch ins Protokoll)
function runNode(script: string, args: string[], cwd: string): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve) => {
    let output = ''
    const child = spawn(process.execPath, [script, ...args], { cwd, env: nodeEnvironment(), windowsHide: true })
    const collect = (chunk: Buffer) => {
      const textChunk = chunk.toString('utf8')
      output += textChunk
      log(textChunk)
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.on('error', (error) => resolve({ code: -1, output: `${output}\n${error.stack ?? error.message}` }))
    child.on('close', (code) => resolve({ code, output }))
  })
}

// --- Datenbank ---

// Sicherung der Datenbank vor einer Aktualisierung des Aufbaus; nur die neuesten bleiben
function backupDatabase(fromVersion: string): void {
  const { dbFile, backupDir } = paths()
  mkdirSync(backupDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const target = join(backupDir, `mixmarket-${fromVersion}-${stamp}.db`)
  copyFileSync(dbFile, target)
  for (const suffix of ['-wal', '-shm']) if (existsSync(dbFile + suffix)) copyFileSync(dbFile + suffix, target + suffix)
  log(`Datenbank gesichert: ${target}`)
  const backups = readdirSync(backupDir)
    .filter((name) => name.endsWith('.db'))
    .sort()
    .reverse()
  for (const old of backups.slice(KEEP_BACKUPS)) {
    for (const suffix of ['', '-wal', '-shm']) rmSync(join(backupDir, old + suffix), { force: true })
  }
}

// Datenbank anlegen oder an eine neue Programmversion anpassen. Läuft nur beim ersten Start und nach
// Updates (danach startet MixMarket ohne diesen Schritt). Vor jeder Anpassung wird gesichert.
export async function prepareDatabase(onStep: (step: 'database') => void): Promise<void> {
  const { dbFile, serverDir, prismaCli, dataDir } = paths()
  mkdirSync(dataDir, { recursive: true })
  const state = readState()
  const exists = existsSync(dbFile)
  if (exists && state.schemaVersion === app.getVersion() && state.seeded) return
  onStep('database')
  if (exists && state.schemaVersion !== app.getVersion()) backupDatabase(state.schemaVersion ?? 'vorher')
  if (!exists || state.schemaVersion !== app.getVersion()) {
    log(`Datenbank wird ${exists ? 'angepasst' : 'angelegt'}: ${dbFile}`)
    const push = await runNode(prismaCli, ['db', 'push'], serverDir)
    if (push.code !== 0) throw new StartError('Datenbank konnte nicht eingerichtet werden', push.output)
    writeState({ ...state, schemaVersion: app.getVersion() })
  }
  // Grundausstattung (Standardlisten, Beispielvorlage, Einstellungen) nur einmal
  if (!readState().seeded) {
    const seed = await runNode(join(serverDir, 'dist', 'db', 'seed.js'), [], dataDir)
    if (seed.code !== 0) throw new StartError('Grundeinstellungen konnten nicht angelegt werden', seed.output)
    writeState({ ...readState(), seeded: true })
  }
}

// --- Server ---

// Freien Port finden: zuerst den festen, sonst einen vom System vergebenen
function freePort(): Promise<number> {
  const tryPort = (port: number) =>
    new Promise<number | null>((resolve) => {
      const probe = createServer()
      probe.once('error', () => resolve(null))
      probe.listen(port, '127.0.0.1', () => {
        const address = probe.address()
        const found = typeof address === 'object' && address ? address.port : null
        probe.close(() => resolve(found))
      })
    })
  return tryPort(PREFERRED_PORT).then(async (port) => port ?? (await tryPort(0)) ?? PREFERRED_PORT)
}

let serverProcess: ChildProcess | null = null
let stopping = false

// Server starten und warten, bis er antwortet. onUnexpectedExit meldet ein späteres Ende des Servers.
export async function startServer(onUnexpectedExit: (detail: string) => void): Promise<string> {
  const { serverDir, webDir, dataDir } = paths()
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  if (port !== PREFERRED_PORT) log(`Port ${PREFERRED_PORT} ist belegt, MixMarket nutzt ${port}`)
  stopping = false
  const child = spawn(process.execPath, [join(serverDir, 'dist', 'index.js')], {
    cwd: dataDir,
    windowsHide: true,
    env: nodeEnvironment({
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(port),
      PUBLIC_API_URL: url,
      PUBLIC_WEB_URL: url,
      MIXMARKET_WEB_DIR: webDir,
      // Der Server beendet sich selbst, falls dieses Programm unerwartet endet
      MIXMARKET_PARENT_PID: String(process.pid),
    }),
  })
  serverProcess = child
  child.stdout?.on('data', (chunk: Buffer) => log(chunk.toString('utf8')))
  child.stderr?.on('data', (chunk: Buffer) => log(chunk.toString('utf8')))

  let exited = false
  let started = false
  const exitPromise = new Promise<never>((_, reject) => {
    child.on('exit', (code, signal) => {
      exited = true
      serverProcess = null
      log(`Server beendet (Code ${code ?? '-'}, Signal ${signal ?? '-'})`)
      reject(new StartError('Der Server wurde beim Start beendet', recentLog()))
      if (!stopping && started) onUnexpectedExit(recentLog())
    })
    child.on('error', (error) => reject(new StartError('Der Server konnte nicht gestartet werden', error.stack ?? error.message)))
  })
  exitPromise.catch(() => undefined)

  // Warten, bis der Server antwortet
  const deadline = Date.now() + START_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (exited) await exitPromise
    try {
      const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(2000) })
      if (response.ok) {
        started = true
        return url
      }
    } catch {
      // noch nicht bereit
    }
    await Promise.race([new Promise((resolve) => setTimeout(resolve, 300)), exitPromise])
  }
  await stopServer()
  throw new StartError('Der Server hat nicht rechtzeitig geantwortet', recentLog())
}

// Server sauber beenden (spätestens nach fünf Sekunden hart)
export function stopServer(): Promise<void> {
  const child = serverProcess
  if (!child || child.exitCode !== null) return Promise.resolve()
  stopping = true
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve()
    }, 5000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
    child.kill('SIGTERM')
  })
}
