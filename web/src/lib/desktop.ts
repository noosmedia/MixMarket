// Brücke zum installierten Programm (Electron). Im Browser (npm-Fassung) gibt es sie nicht.
// Das Programm stellt sie im Preload bereit; sie bietet nur Version, Updates und das Fenster
// "Passwort neu setzen" (Notlösung bei verlorenem Wiederherstellungsschlüssel) an.

export type DesktopUpdateCheck =
  | { status: 'available'; version: string }
  | { status: 'none'; version: string }
  | { status: 'unsupported'; reason: 'mac' | 'dev' | 'package' }
  | { status: 'error'; message: string }

export interface DesktopBridge {
  version: string
  platform: string
  checkUpdate: () => Promise<DesktopUpdateCheck>
  downloadUpdate: () => Promise<{ ok: boolean; message?: string }>
  installUpdate: () => Promise<void>
  onUpdateProgress: (callback: (percent: number) => void) => () => void
  openPasswordReset: (language: string, theme: string) => Promise<void>
  onPasswordReset: (callback: () => void) => () => void
}

declare global {
  interface Window {
    mixmarketDesktop?: DesktopBridge
  }
}

// Läuft MixMarket als installiertes Programm? Dann die Brücke, sonst null
export function desktop(): DesktopBridge | null {
  return typeof window !== 'undefined' && window.mixmarketDesktop ? window.mixmarketDesktop : null
}
