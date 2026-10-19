// Brücke zwischen der Oberfläche und dem Programm. Die Oberfläche erkennt daran, dass sie als
// installiertes Programm läuft, und bekommt nur diese wenigen Funktionen (Version, Updates).
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
})
