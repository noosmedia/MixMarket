// Updates des installierten Programms über die Veröffentlichungen auf GitHub.
// Die Oberfläche fragt über die Brücke im Preload nach (Fenster "Nach Updates suchen"): prüfen,
// herunterladen mit Fortschritt, dann neu starten und installieren. Nichts geschieht ohne Klick.
// macOS: ohne Apple-Signatur kann sich das Programm nicht selbst ersetzen; dort führt die Oberfläche
// zur Download-Seite.
import { app, ipcMain, type BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { log, stopServer } from './server'

export type UpdateCheck =
  | { status: 'available'; version: string }
  | { status: 'none'; version: string }
  | { status: 'unsupported'; reason: 'mac' | 'dev' | 'package' }
  | { status: 'error'; message: string }

// Kann sich diese Installation selbst aktualisieren?
function unsupportedReason(): 'mac' | 'dev' | 'package' | null {
  if (!app.isPackaged) return 'dev'
  if (process.platform === 'darwin') return 'mac'
  // Linux: AppImage, .deb und .rpm können es; andere Formate (z. B. selbst entpackt) nicht
  if (process.platform === 'linux' && !process.env.APPIMAGE && !['deb', 'rpm'].includes(linuxPackageType())) return 'package'
  return null
}

// Paketart, die electron-builder bei .deb und .rpm im Programmordner hinterlegt
function linuxPackageType(): string {
  try {
    return readFileSync(join(process.resourcesPath, 'package-type'), 'utf8').trim()
  } catch {
    return ''
  }
}

// Fehlermeldung ohne Zeilenumbrüche und lange Pfade für die Oberfläche
function shortMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.split('\n')[0]?.slice(0, 300) ?? ''
}

export function setupUpdater(getWindow: () => BrowserWindow | null, isFromApp: (url: string) => boolean): void {
  autoUpdater.autoDownload = false
  // Heruntergeladen, aber nicht neu gestartet: beim nächsten Beenden installieren
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = {
    info: (message: unknown) => log(`[Update] ${String(message)}`),
    warn: (message: unknown) => log(`[Update] Warnung: ${String(message)}`),
    error: (message: unknown) => log(`[Update] Fehler: ${String(message)}`),
    debug: () => undefined,
  }
  autoUpdater.on('download-progress', (progress) => {
    getWindow()?.webContents.send('mixmarket:update-progress', Math.round(progress.percent))
  })

  // Nur die eigene Oberfläche darf Updates anstoßen
  const guard = (url: string) => {
    if (!isFromApp(url)) throw new Error('Nicht erlaubt')
  }

  ipcMain.handle('mixmarket:update-check', async (event): Promise<UpdateCheck> => {
    guard(event.senderFrame?.url ?? '')
    const reason = unsupportedReason()
    if (reason) return { status: 'unsupported', reason }
    try {
      const result = await autoUpdater.checkForUpdates()
      const version = result?.updateInfo.version ?? app.getVersion()
      return result?.isUpdateAvailable ? { status: 'available', version } : { status: 'none', version }
    } catch (error) {
      log(`[Update] Prüfung fehlgeschlagen: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
      return { status: 'error', message: shortMessage(error) }
    }
  })

  ipcMain.handle('mixmarket:update-download', async (event): Promise<{ ok: boolean; message?: string }> => {
    guard(event.senderFrame?.url ?? '')
    try {
      await autoUpdater.downloadUpdate()
      return { ok: true }
    } catch (error) {
      log(`[Update] Download fehlgeschlagen: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
      return { ok: false, message: shortMessage(error) }
    }
  })

  ipcMain.handle('mixmarket:update-install', async (event) => {
    guard(event.senderFrame?.url ?? '')
    // Erst den Server sauber beenden, dann ersetzen und neu starten
    await stopServer()
    autoUpdater.quitAndInstall(false, true)
  })
}
