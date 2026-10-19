// Brücke zwischen der Oberfläche und dem Programm. Die Oberfläche erkennt daran, dass sie als
// installiertes Programm läuft, und bekommt nur diese wenigen Funktionen (Version, Updates,
// Fenster "Passwort neu setzen" öffnen).
import { contextBridge, ipcRenderer } from 'electron'

const versionArg = process.argv.find((arg) => arg.startsWith('--mixmarket-version='))

contextBridge.exposeInMainWorld('mixmarketDesktop', {
  version: versionArg ? versionArg.slice('--mixmarket-version='.length) : '',
  platform: process.platform,
  checkUpdate: () => ipcRenderer.invoke('mixmarket:update-check'),
  downloadUpdate: () => ipcRenderer.invoke('mixmarket:update-download'),
  installUpdate: () => ipcRenderer.invoke('mixmarket:update-install'),
  // Fortschritt des Downloads in Prozent; gibt eine Funktion zum Abmelden zurück
  onUpdateProgress: (callback: (percent: number) => void) => {
    const listener = (_event: unknown, percent: number) => callback(percent)
    ipcRenderer.on('mixmarket:update-progress', listener)
    return () => {
      ipcRenderer.removeListener('mixmarket:update-progress', listener)
    }
  },
  // Notlösung bei verlorenem Schlüssel: öffnet das eigene Fenster des Programms in Sprache und Farbmodus der Oberfläche
  openPasswordReset: (language: string, theme: string) => ipcRenderer.invoke('mixmarket:password-reset-open', language, theme),
  // Meldet, dass das Passwort dort neu gesetzt wurde; gibt eine Funktion zum Abmelden zurück
  onPasswordReset: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('mixmarket:password-reset-done', listener)
    return () => {
      ipcRenderer.removeListener('mixmarket:password-reset-done', listener)
    }
  },
})
