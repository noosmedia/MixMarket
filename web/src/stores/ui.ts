// UI-Store: Theme, Sprache, Toast-Benachrichtigungen und Sprünge aus der Suche.
import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import i18n from '../i18n'

export type Theme = 'dark' | 'light'
export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  kind: ToastKind
  message: string
}

// Zustand des Bestätigungsdialogs
export interface ConfirmRequest {
  message: string
  confirmLabel?: string
  danger?: boolean
  // Zusätzliche Hinweise unter der Frage, z. B. Warnungen vor dem Versand
  notes?: string[]
  warnings?: string[]
}
// Sprungziel aus der Volltextsuche: die Zielseite öffnet den Eintrag und löscht das Ziel danach
export type JumpArea =
  | 'contacts'
  | 'companies'
  | 'prospects'
  | 'outbox'
  | 'inbox'
  | 'products'
  | 'lists'
  | 'templates'
  | 'campaigns'
  | 'automations'
  | 'cohorts'
  | 'searches'
  | 'scrapeJobs'
  | 'suppression'
export interface JumpTarget {
  area: JumpArea
  id: string
  // Produkt, zu dem ein Interessent oder eine Zielgruppe gehört
  productId?: string
  // Anzeigetext, z. B. die E-Mail-Adresse für die Sperrliste
  title?: string
}

interface ConfirmState extends ConfirmRequest {
  open: boolean
  resolve?: (value: boolean) => void
}

interface UiState {
  theme: Theme
  language: string
  toasts: Toast[]
  confirmState: ConfirmState
  jump: JumpTarget | null
  setJump: (jump: JumpTarget | null) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setLanguage: (lang: string) => void
  notify: (kind: ToastKind, message: string) => void
  dismiss: (id: string) => void
  confirm: (request: ConfirmRequest) => Promise<boolean>
  resolveConfirm: (value: boolean) => void
}

// Gespeichertes Theme oder Standard (dunkel)
const savedTheme = (localStorage.getItem('mixmarket-theme') as Theme) || 'dark'

// Theme im Dokument anwenden
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}
applyTheme(savedTheme)

// Einfache, kollisionsarme ID
let toastCounter = 0
function nextId(): string {
  toastCounter += 1
  return `t-${toastCounter}-${Date.now()}`
}

export const useUi = create<UiState>((set, get) => ({
  theme: savedTheme,
  language: localStorage.getItem('mixmarket-language') || 'de',
  toasts: [],
  confirmState: { open: false, message: '' },
  jump: null,

  setJump: (jump) => set({ jump }),

  setTheme: (theme) => {
    applyTheme(theme)
    localStorage.setItem('mixmarket-theme', theme)
    set({ theme })
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },

  setLanguage: (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('mixmarket-language', lang)
    document.documentElement.setAttribute('lang', lang)
    set({ language: lang })
  },

  // Toast anzeigen (verschwindet nach 4 Sekunden automatisch)
  notify: (kind, message) => {
    const id = nextId()
    set({ toasts: [...get().toasts, { id, kind, message }] })
    setTimeout(() => get().dismiss(id), 4000)
  },

  dismiss: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },

  // Bestätigungsdialog öffnen und auf die Entscheidung warten
  confirm: (request) => {
    return new Promise<boolean>((resolve) => {
      set({ confirmState: { ...request, open: true, resolve } })
    })
  },

  // Entscheidung aus dem Dialog zurückgeben
  resolveConfirm: (value) => {
    const { resolve } = get().confirmState
    resolve?.(value)
    set({ confirmState: { open: false, message: '' } })
  },
}))

// Sprungziel auf einer Seite einlösen. "isReady" meldet, wann die nötigen Daten geladen sind.
// Mit consume = false reagiert die Seite nur (z. B. Reiter wechseln) und überlässt das Öffnen einem Unterbereich.
export function useJumpTarget(
  areas: JumpArea[],
  handler: (jump: JumpTarget) => void,
  isReady: (jump: JumpTarget) => boolean = () => true,
  consume = true,
): void {
  const jump = useUi((s) => s.jump)
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const readyRef = useRef(isReady)
  readyRef.current = isReady
  const ready = jump ? isReady(jump) : false
  const key = areas.join(',')

  useEffect(() => {
    if (!jump || !key.split(',').includes(jump.area) || !readyRef.current(jump)) return
    if (consume) useUi.getState().setJump(null)
    handlerRef.current(jump)
  }, [jump, ready, key, consume])
}

// Zeile eines Sprungziels sichtbar machen und kurz hervorheben
export function flashRow(id: string, attempt = 0): void {
  // Die Zeile kann gerade erst entstehen (Daten werden nachgeladen), daher bis zu zwei Sekunden lang suchen
  const row = document.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(id)}"]`)
  if (!row) {
    if (attempt < 20) window.setTimeout(() => flashRow(id, attempt + 1), 100)
    return
  }
  row.scrollIntoView({ block: 'center', behavior: 'smooth' })
  row.classList.remove('jump-flash')
  void row.offsetWidth
  row.classList.add('jump-flash')
  window.setTimeout(() => row.classList.remove('jump-flash'), 2200)
}
