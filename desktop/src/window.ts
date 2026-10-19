// Hauptfenster von MixMarket: Mindestgröße, gemerkte Größe und Lage, Links nach außen im Standardbrowser.
import { BrowserWindow, nativeTheme, screen, shell, type Rectangle } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { paths } from './server'

// Kleiner geht das Fenster nicht: darunter würden Kopfleiste, Tabellen und Fenster der Oberfläche
// nicht mehr vernünftig Platz finden. Größer ist jederzeit möglich.
export const MIN_WIDTH = 1024
export const MIN_HEIGHT = 700
// Startgröße beim allerersten Öffnen (passt sich kleineren Bildschirmen an)
const DEFAULT_WIDTH = 1440
const DEFAULT_HEIGHT = 900

interface WindowState {
  bounds?: Rectangle
  maximized?: boolean
}

function stateFile(): string {
  return join(paths().dataDir, 'window-state.json')
}

function readWindowState(): WindowState {
  try {
    return JSON.parse(readFileSync(stateFile(), 'utf8')) as WindowState
  } catch {
    return {}
  }
}

// Liegt das gemerkte Fenster noch sichtbar auf einem angeschlossenen Bildschirm?
function visibleOnSomeDisplay(bounds: Rectangle): boolean {
  return screen.getAllDisplays().some(({ workArea }) => {
    const overlapX = Math.min(bounds.x + bounds.width, workArea.x + workArea.width) - Math.max(bounds.x, workArea.x)
    const overlapY = Math.min(bounds.y + bounds.height, workArea.y + workArea.height) - Math.max(bounds.y, workArea.y)
    return overlapX >= 200 && overlapY >= 100
  })
}

// Erlaubt das Fenster nur Adressen der eigenen Oberfläche?
function isAppUrl(target: string, appUrl: string): boolean {
  try {
    return new URL(target).origin === new URL(appUrl).origin
  } catch {
    return false
  }
}

// http-, https- und mailto-Links im Standardprogramm öffnen, alles andere ignorieren
function openOutside(target: string): void {
  if (/^(https?:|mailto:)/i.test(target)) void shell.openExternal(target)
}

export function createMainWindow(appUrl: string, preload: string, icon: string): BrowserWindow {
  const { workAreaSize } = screen.getPrimaryDisplay()
  // Auf sehr kleinen Bildschirmen darf die Mindestgröße nicht größer als der Bildschirm sein
  const minWidth = Math.min(MIN_WIDTH, workAreaSize.width)
  const minHeight = Math.min(MIN_HEIGHT, workAreaSize.height)
  const saved = readWindowState()
  const bounds =
    saved.bounds && visibleOnSomeDisplay(saved.bounds)
      ? {
          ...saved.bounds,
          width: Math.max(saved.bounds.width, minWidth),
          height: Math.max(saved.bounds.height, minHeight),
        }
      : {
          width: Math.max(minWidth, Math.min(DEFAULT_WIDTH, workAreaSize.width)),
          height: Math.max(minHeight, Math.min(DEFAULT_HEIGHT, workAreaSize.height)),
        }

  const win = new BrowserWindow({
    ...bounds,
    minWidth,
    minHeight,
    show: false,
    title: 'MixMarket',
    icon,
    // Hintergrund passend zum Systemmodus, damit beim Öffnen nichts weiß aufblitzt
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#18191b' : '#dfddd7',
    autoHideMenuBar: true,
    webPreferences: {
      preload,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
      additionalArguments: [`--mixmarket-version=${process.env.MIXMARKET_APP_VERSION ?? ''}`],
    },
  })
  if (saved.maximized) win.maximize()
  win.once('ready-to-show', () => win.show())

  // Neue Fenster (Links mit target="_blank", window.open) nie in MixMarket, sondern im Standardbrowser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url && url !== 'about:blank') openOutside(url)
    return { action: 'deny' }
  })
  // Seitenwechsel zu fremden Adressen (z. B. Kasse, Kundenportal) ebenfalls im Standardbrowser
  win.webContents.on('will-navigate', (event, url) => {
    if (isAppUrl(url, appUrl)) return
    event.preventDefault()
    openOutside(url)
  })

  // Größe und Lage merken, damit das Fenster beim nächsten Start genauso aufgeht
  const remember = () => {
    const state: WindowState = { bounds: win.isMaximized() ? (readWindowState().bounds ?? win.getBounds()) : win.getBounds(), maximized: win.isMaximized() }
    try {
      writeFileSync(stateFile(), JSON.stringify(state))
    } catch {
      // Ohne Datei öffnet das Fenster beim nächsten Mal in der Standardgröße
    }
  }
  win.on('resized', remember)
  win.on('moved', remember)
  win.on('maximize', remember)
  win.on('unmaximize', remember)
  win.on('close', remember)

  void win.loadURL(appUrl)
  return win
}
