// Auth-Store: hält das angemeldete Konto und kapselt Ersteinrichtung, Anmeldung,
// "Passwort vergessen" und Abmeldung. MixMarket hat genau ein Konto.
import { create } from 'zustand'
import { api, ApiError } from '../lib/api'

export interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  initialized: boolean
  // Noch kein Konto vorhanden: die Ersteinrichtung muss laufen
  needsSetup: boolean
  // Server gerade nicht erreichbar: weder angemeldet noch abgemeldet, es wird erneut versucht
  offline: boolean
  // Einrichtung von einem anderen Rechner aus: Einrichtungscode aus dem Serverprotokoll nötig
  setupCodeRequired: boolean
  login: (email: string, password: string) => Promise<void>
  // Liefern Konto und Wiederherstellungsschlüssel. Das Konto wird erst mit setUser übernommen,
  // nachdem der Schlüssel angezeigt und bestätigt ist; sonst leitete die App vorher weiter.
  setup: (name: string, email: string, password: string, setupCode?: string) => Promise<{ user: User; recoveryKey: string }>
  recover: (email: string, recoveryKey: string, newPassword: string) => Promise<{ user: User; recoveryKey: string }>
  logout: () => Promise<void>
  loadMe: () => Promise<void>
  setUser: (user: User) => void
}

// Keine Antwort vom Server: Netzwerkfehler, unlesbare Antwort oder Fehler 5xx (z. B. Vermittler ohne Server)
function unreachable(error: unknown): boolean {
  return !(error instanceof ApiError) || error.status >= 500
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  needsSetup: false,
  offline: false,
  setupCodeRequired: false,

  // Anmeldung
  login: async (email, password) => {
    const res = await api.post<{ user: User }>('/api/auth/login', { email, password })
    set({ user: res.user })
  },

  // Ersteinrichtung: legt das Konto an und meldet direkt an
  setup: async (name, email, password, setupCode) => {
    return api.post<{ user: User; recoveryKey: string }>('/api/auth/setup', { name, email, password, ...(setupCode ? { setupCode } : {}) })
  },

  // Passwort vergessen: neues Passwort mit dem Wiederherstellungsschlüssel
  recover: async (email, recoveryKey, newPassword) => {
    return api.post<{ user: User; recoveryKey: string }>('/api/auth/recover', { email, recoveryKey, newPassword })
  },

  // Abmeldung
  logout: async () => {
    await api.post('/api/auth/logout')
    set({ user: null })
  },

  // Beim Start: Einrichtungsstand und aktuelles Konto laden (falls die Anmeldung noch gilt)
  loadMe: async () => {
    // Server nicht erreichbar (Netzwerkfehler oder Fehler des Vermittlers): in 3 Sekunden erneut versuchen,
    // statt fälschlich die Anmeldeseite zu zeigen. Nur eine echte Antwort "nicht angemeldet" meldet ab.
    const retryLater = () => {
      set({ offline: true })
      window.setTimeout(() => void useAuth.getState().loadMe(), 3000)
    }
    let needsSetup = false
    let setupCodeRequired = false
    try {
      const status = await api.get<{ needsSetup: boolean; setupCodeRequired?: boolean }>('/api/auth/status')
      needsSetup = status.needsSetup
      setupCodeRequired = Boolean(status.setupCodeRequired)
    } catch (error) {
      if (unreachable(error)) return retryLater()
    }
    if (needsSetup) {
      set({ user: null, needsSetup: true, setupCodeRequired, initialized: true, offline: false })
      return
    }
    try {
      const res = await api.get<{ user: User }>('/api/auth/me')
      set({ user: res.user, needsSetup: false, initialized: true, offline: false })
    } catch (error) {
      if (unreachable(error)) return retryLater()
      set({ user: null, needsSetup: false, initialized: true, offline: false })
    }
  },

  // Nach Änderungen am Konto die angezeigten Angaben aktualisieren
  setUser: (user) => set({ user, needsSetup: false }),
}))
