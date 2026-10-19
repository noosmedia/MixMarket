// Notlösung im installierten Programm: Passwort neu setzen, wenn Passwort und Wiederherstellungsschlüssel
// verloren sind. Die Oberfläche kann dieses Fenster nur öffnen (versteckter Hinweis auf der Seite
// "Passwort vergessen"). Das neue Passwort wird ausschließlich in diesem eigenen Fenster der Programmhülle
// eingegeben und von server/dist/scripts/reset-password.js direkt in die Datenbank auf diesem Rechner
// geschrieben, nie über das Netz. Wer das kann, sitzt also am Rechner und hat ohnehin Zugriff auf den Datenordner.
import { BrowserWindow, clipboard, ipcMain, nativeTheme, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { log, nodeEnvironment, paths } from './server'
import { allTexts } from './texts'

// Mindestlänge wie auf dem Server (server/src/utils/auth.ts)
const MIN_PASSWORD_LENGTH = 10
// Kennung der Ergebniszeile des Skripts (wie in reset-password.ts)
const RESULT_MARKER = '__MIXMARKET_RESET__'
// So lange darf das Skript brauchen
const RESET_TIMEOUT_MS = 60_000

type Language = 'de' | 'en'
type Theme = 'dark' | 'light'

export type ResetAnswer =
  | { ok: true; email: string; recoveryKey: string }
  | { ok: false; code: 'tooShort' | 'mismatch' | 'noAccount' | 'failed'; detail?: string }

interface Options {
  getMainWindow: () => BrowserWindow | null
  isFromApp: (url: string) => boolean
  iconFile: string
  pageFile: string
  preloadFile: string
}

let resetWindow: BrowserWindow | null = null
// Schlüssel der letzten erfolgreichen Änderung, nur zum Kopieren in die Zwischenablage
let lastKey = ''
let done = false
let busy = false

// Skript im Node-Modus von Electron starten, Passwort über die Standardeingabe übergeben.
// Die Ausgabe mit dem neuen Schlüssel kommt nie ins Protokoll.
function runReset(password: string): Promise<ResetAnswer> {
  const { serverDir, dataDir } = paths()
  const script = join(serverDir, 'dist', 'scripts', 'reset-password.js')
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let settled = false
    const finish = (answer: ResetAnswer) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(answer)
    }
    const child = spawn(process.execPath, [script, '--app'], {
      cwd: dataDir,
      env: nodeEnvironment({ NODE_ENV: 'production' }),
      windowsHide: true,
    })
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      finish({ ok: false, code: 'failed', detail: `Zeitüberschreitung nach ${RESET_TIMEOUT_MS / 1000} Sekunden\n${stderr}`.trim() })
    }, RESET_TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString('utf8')))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString('utf8')))
    child.on('error', (error) => finish({ ok: false, code: 'failed', detail: error.stack ?? error.message }))
    child.on('close', (code) => {
      const line = stdout.split(/\r?\n/).find((entry) => entry.startsWith(RESULT_MARKER))
      // Alles außer der Ergebniszeile darf ins Protokoll
      const rest = [stdout.split(/\r?\n/).filter((entry) => !entry.startsWith(RESULT_MARKER)).join('\n'), stderr].join('\n').trim()
      if (rest) log(`[Passwort] ${rest}`)
      if (!line) {
        finish({ ok: false, code: 'failed', detail: `Skript beendet mit Code ${code ?? '-'}\n${rest}`.trim() })
        return
      }
      try {
        const result = JSON.parse(line.slice(RESULT_MARKER.length)) as
          | { ok: true; email: string; recoveryKey: string }
          | { ok: false; code: 'noAccount' | 'tooShort' | 'failed'; message?: string }
        finish(result.ok ? result : { ok: false, code: result.code, detail: result.message })
      } catch (error) {
        finish({ ok: false, code: 'failed', detail: error instanceof Error ? error.message : String(error) })
      }
    })
    child.stdin.end(JSON.stringify({ password }))
  })
}

// Fenster "Passwort neu setzen" öffnen (oder nach vorn holen), als festes Fenster über dem Hauptfenster,
// in Sprache und Farbmodus der Oberfläche
function openWindow(options: Options, language: Language, theme: Theme): void {
  if (resetWindow) {
    resetWindow.show()
    resetWindow.focus()
    return
  }
  lastKey = ''
  done = false
  const parent = options.getMainWindow() ?? undefined
  const win = new BrowserWindow({
    width: 480,
    height: 480,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    parent,
    modal: !!parent,
    title: allTexts(language).resetTitle,
    icon: options.iconFile,
    autoHideMenuBar: true,
    backgroundColor: theme === 'dark' ? '#18191b' : '#dfddd7',
    webPreferences: { preload: options.preloadFile, contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  })
  resetWindow = win
  win.setMenu(null)
  // Das Fenster zeigt nur die eigene Seite: keine anderen Adressen, keine neuen Fenster
  win.webContents.on('will-navigate', (event) => event.preventDefault())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('reset:state', { language, theme, texts: allTexts(language), minLength: MIN_PASSWORD_LENGTH })
  })
  win.once('ready-to-show', () => win.show())
  win.on('closed', () => {
    resetWindow = null
    lastKey = ''
    // Nach einer Änderung zeigt die Oberfläche wieder die Anmeldung
    if (done) options.getMainWindow()?.webContents.send('mixmarket:password-reset-done')
    done = false
  })
  void win.loadFile(options.pageFile)
}

export function setupPasswordReset(options: Options): void {
  // Nur die Hauptseite der eigenen Oberfläche im Hauptfenster darf das Fenster öffnen
  ipcMain.handle('mixmarket:password-reset-open', (event: IpcMainInvokeEvent, language: unknown, theme: unknown) => {
    const main = options.getMainWindow()
    if (!main || event.sender !== main.webContents || event.senderFrame !== main.webContents.mainFrame) throw new Error('Nicht erlaubt')
    if (!options.isFromApp(event.senderFrame?.url ?? '')) throw new Error('Nicht erlaubt')
    const systemTheme: Theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    openWindow(options, language === 'en' ? 'en' : 'de', theme === 'dark' || theme === 'light' ? theme : systemTheme)
  })

  // Alles Weitere nimmt nur das Fenster "Passwort neu setzen" selbst an
  const fromResetWindow = (event: IpcMainEvent | IpcMainInvokeEvent) => !!resetWindow && event.sender === resetWindow.webContents

  ipcMain.handle('reset:submit', async (event, password: unknown, repeat: unknown): Promise<ResetAnswer> => {
    if (!fromResetWindow(event)) throw new Error('Nicht erlaubt')
    if (typeof password !== 'string' || typeof repeat !== 'string') return { ok: false, code: 'failed', detail: 'Ungültige Eingabe' }
    if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, code: 'tooShort' }
    if (password !== repeat) return { ok: false, code: 'mismatch' }
    if (busy) return { ok: false, code: 'failed', detail: 'Läuft bereits' }
    busy = true
    try {
      log('Passwort wird im Programm neu gesetzt')
      const answer = await runReset(password)
      if (answer.ok) {
        lastKey = answer.recoveryKey
        done = true
        log('Passwort im Programm neu gesetzt')
      } else {
        log(`Passwort konnte nicht neu gesetzt werden (${answer.code})${answer.detail ? `: ${answer.detail}` : ''}`)
      }
      return answer
    } finally {
      busy = false
    }
  })

  // Kopiert nur den gerade erzeugten Schlüssel, nie beliebigen Text
  ipcMain.on('reset:copy', (event) => {
    if (fromResetWindow(event) && lastKey) clipboard.writeText(lastKey)
  })

  ipcMain.on('reset:close', (event) => {
    if (fromResetWindow(event)) resetWindow?.close()
  })
}
