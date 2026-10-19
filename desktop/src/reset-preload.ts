// Brücke für das Fenster "Passwort neu setzen": Texte empfangen, Passwort setzen, Schlüssel kopieren, schließen.
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('mixmarketReset', {
  onState: (callback: (state: unknown) => void) => {
    ipcRenderer.on('reset:state', (_event, state) => callback(state))
  },
  submit: (password: string, repeat: string) => ipcRenderer.invoke('reset:submit', password, repeat),
  copyKey: () => ipcRenderer.send('reset:copy'),
  close: () => ipcRenderer.send('reset:close'),
})
