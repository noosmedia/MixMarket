// Brücke für den Startbildschirm: Fortschritt und Fehler anzeigen, Protokoll öffnen, erneut versuchen, beenden.
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('mixmarketSplash', {
  onState: (callback: (state: unknown) => void) => {
    ipcRenderer.on('splash:state', (_event, state) => callback(state))
  },
  openLog: () => ipcRenderer.send('splash:open-log'),
  openDataFolder: () => ipcRenderer.send('splash:open-data'),
  retry: () => ipcRenderer.send('splash:retry'),
  quit: () => ipcRenderer.send('splash:quit'),
})
