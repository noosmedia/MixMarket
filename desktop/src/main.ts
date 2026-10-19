// Hauptprozess des installierten Programms MixMarket.
// Ablauf: Startbildschirm zeigen, Datenbank einrichten (nur beim ersten Start und nach Updates),
// Server starten, Hauptfenster öffnen. Scheitert etwas, zeigt der Startbildschirm die vollständige
// Meldung mit Protokoll und "Erneut versuchen". Beim Beenden wird der Server sauber gestoppt.
import { app, BrowserWindow, ipcMain, Menu, nativeTheme, shell, type MenuItemConstructorOptions } from 'electron'
import { join } from 'node:path'
import { syncLinuxMenuEntry } from './linux-menu'
import { log, openLog, paths, prepareDatabase, startServer, StartError, stopServer } from './server'
import { allTexts, language, text } from './texts'
import { setupUpdater } from './updater'
import { createMainWindow } from './window'

// Kennung wie in electron-builder.yml (Taskleiste und Benachrichtigungen unter Windows)
const APP_ID = 'io.github.noosmedia.mixmarket'
process.env.MIXMARKET_APP_VERSION = app.getVersion()

let mainWindow: BrowserWindow | null = null
let splash: BrowserWindow | null = null
let appUrl: string | null = null
let quitting = false
// Letzter Zustand des Startbildschirms, damit er nach dem Laden der Seite nichts verpasst
let splashState: Record<string, unknown> = { step: 'prepare' }

const staticFile = (name: string) => join(app.getAppPath(), 'static', name)
const iconFile = () => staticFile('icon.png')

// Nur eine laufende MixMarket-Instanz; ein zweiter Start holt das vorhandene Fenster nach vorn
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = mainWindow ?? splash
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  })
  app.setAppUserModelId(APP_ID)
  void app.whenReady().then(ready)
}

// --- Startbildschirm ---

function sendSplash(state: Record<string, unknown>): void {
  splashState = state
  splash?.webContents.send('splash:state', { ...state, texts: allTexts(), language: language() })
}

function showSplash(): void {
  if (splash) return
  splash = new BrowserWindow({
    width: 460,
    height: 320,
    frame: false,
    resizable: false,
    show: false,
    center: true,
    title: 'MixMarket',
    icon: iconFile(),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#18191b' : '#dfddd7',
    webPreferences: { preload: join(__dirname, 'splash-preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false },
  })
  splash.webContents.on('did-finish-load', () => sendSplash(splashState))
  splash.once('ready-to-show', () => splash?.show())
  splash.on('closed', () => {
    splash = null
    // Startbildschirm geschlossen, ohne dass MixMarket läuft: Programm beenden
    if (!mainWindow) app.quit()
  })
  void splash.loadFile(staticFile('splash.html'))
}

// Fehler groß und vollständig anzeigen (Meldung, letzte Protokollzeilen, Pfad des Protokolls)
function showError(title: string, error: unknown): void {
  const detail =
    error instanceof StartError
      ? `${error.message}\n\n${error.detail}`
      : error instanceof Error
        ? (error.stack ?? error.message)
        : String(error)
  log(`${title}: ${detail}`)
  showSplash()
  if (!splash) return
  splash.setResizable(true)
  splash.setMinimumSize(560, 380)
  splash.setSize(760, 540)
  splash.center()
  sendSplash({ error: { title, detail: `${detail.trim()}\n\n${paths().logFile}` } })
}

// --- Start ---

async function boot(): Promise<void> {
  sendSplash({ step: 'prepare' })
  try {
    await prepareDatabase((step) => sendSplash({ step }))
    sendSplash({ step: 'server' })
    appUrl = await startServer((detail) => {
      // Server später unerwartet beendet: Fenster schließen und Meldung zeigen
      if (quitting) return
      const win = mainWindow
      mainWindow = null
      showError(text('stoppedTitle'), new StartError(text('stoppedTitle'), detail))
      win?.destroy()
    })
    const win = createMainWindow(appUrl, join(__dirname, 'preload.js'), iconFile())
    mainWindow = win
    win.once('ready-to-show', () => {
      splash?.destroy()
      splash = null
    })
    win.on('closed', () => {
      if (mainWindow === win) mainWindow = null
    })
  } catch (error) {
    showError(text('errorTitle'), error)
  }
}

function ready(): void {
  openLog()
  setupMenu()
  syncLinuxMenuEntry(iconFile())
  setupUpdater(
    () => mainWindow,
    (url) => !!appUrl && url.startsWith(appUrl),
  )

  // Knöpfe des Startbildschirms (nur vom Startbildschirm selbst angenommen)
  const fromSplash = (event: Electron.IpcMainEvent) => !!splash && event.sender === splash.webContents
  ipcMain.on('splash:open-log', (event) => {
    if (fromSplash(event)) void shell.openPath(paths().logFile)
  })
  ipcMain.on('splash:open-data', (event) => {
    if (fromSplash(event)) void shell.openPath(paths().dataDir)
  })
  ipcMain.on('splash:quit', (event) => {
    if (fromSplash(event)) app.quit()
  })
  ipcMain.on('splash:retry', (event) => {
    if (!fromSplash(event) || !splash) return
    splash.setMinimumSize(0, 0)
    splash.setSize(460, 320)
    splash.setResizable(false)
    splash.center()
    void boot()
  })

  showSplash()
  void boot()
}

// --- Menü ---

// macOS braucht ein Menü für Kopieren, Einfügen und Beenden per Tastatur; unter Windows und Linux keine Menüleiste
function setupMenu(): void {
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null)
    return
  }
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'MixMarket',
      submenu: [
        { role: 'about', label: text('menuAbout') },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { label: text('menuEdit'), role: 'editMenu' },
    {
      label: text('menuView'),
      submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }],
    },
    { label: text('menuWindow'), role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// --- Beenden ---

app.on('window-all-closed', () => {
  app.quit()
})

// Beenden über das System (z. B. Abmelden, kill) wie normales Beenden behandeln
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => app.quit())

// Vor dem Beenden den Server stoppen (einmal, dann wirklich beenden)
app.on('before-quit', (event) => {
  if (quitting) return
  quitting = true
  event.preventDefault()
  void stopServer().finally(() => app.quit())
})
