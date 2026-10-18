// Schnittstelle für MixMarket Pro in der Oberfläche.
// Der offene Kern enthält keinen Pro-Code. Ist Pro aktiv, lädt der Browser das Pro-Paket vom eigenen
// Server (/api/pro/web.js). Das Paket meldet Bausteine für feste Einschübe an (z. B. den Knopf
// "Alle freigeben" im Postausgang). Ohne Pro zeigen die Einschübe ihren Ersatz, meist einen Pro-Hinweis.
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as jsxRuntime from 'react/jsx-runtime'
import * as ReactRouterDom from 'react-router-dom'
import * as ReactI18next from 'react-i18next'
import * as ReactQuery from '@tanstack/react-query'
import * as zustand from 'zustand'
import { create } from 'zustand'
import i18n from '../i18n'
import * as apiModule from '../lib/api'
import * as uiStore from '../stores/ui'
import * as productStore from '../stores/product'
import * as authStore from '../stores/auth'
import * as modal from '../components/Modal'
import * as select from '../components/Select'
import * as page from '../components/Page'
import * as dateTimePicker from '../components/DateTimePicker'
import * as passwordField from '../components/PasswordField'
import * as handbookTypes from '../types/handbook'

export const PRO_FEATURES = ['tours', 'autopilot', 'followUps', 'automations', 'approveAll', 'inboxAi', 'paidSources', 'templatePacks'] as const
export type ProFeature = (typeof PRO_FEATURES)[number]

// Angemeldete Bausteine nehmen beliebige Eigenschaften des Einschubs entgegen
type AnyComponent = React.ComponentType<any>

interface ProWebState {
  active: boolean
  version: string | null
  features: ProFeature[]
  // Angemeldete Bausteine je Einschub und Funktionen (z. B. "tours.start")
  slots: Record<string, AnyComponent[]>
  functions: Record<string, (...args: never[]) => unknown>
  loading: boolean
}

export const usePro = create<ProWebState>(() => ({
  active: false,
  version: null,
  features: [],
  slots: {},
  functions: {},
  loading: false,
}))

// Ist eine Pro-Funktion freigeschaltet?
export function useProFeature(feature: ProFeature): boolean {
  return usePro((s) => s.active && s.features.includes(feature))
}

// Angemeldete Funktion holen (oder null ohne Pro)
export function proFunction<T extends (...args: never[]) => unknown>(name: string): T | null {
  const s = usePro.getState()
  return s.active ? ((s.functions[name] as T | undefined) ?? null) : null
}

// Anmeldefunktionen für das Pro-Paket
const registry = {
  registerSlot(name: string, component: AnyComponent) {
    usePro.setState((s) => ({ slots: { ...s.slots, [name]: [...(s.slots[name] ?? []), component] } }))
  },
  registerFunction(name: string, fn: (...args: never[]) => unknown) {
    usePro.setState((s) => ({ functions: { ...s.functions, [name]: fn } }))
  },
  // Übersetzungen des Pakets ergänzen (z. B. Texte der Touren)
  addTranslations(language: 'de' | 'en', resources: Record<string, unknown>) {
    i18n.addResourceBundle(language, 'translation', resources, true, false)
  },
}
export type ProWebRegistry = typeof registry

// Einschub: zeigt die angemeldeten Pro-Bausteine oder, ohne Pro, den Ersatz
export function ProSlot({ name, fallback = null, ...props }: { name: string; fallback?: React.ReactNode } & Record<string, unknown>) {
  const components = usePro((s) => (s.active ? s.slots[name] : undefined))
  if (!components?.length) return <>{fallback}</>
  return (
    <>
      {components.map((Component, i) => (
        <Component key={i} {...props} />
      ))}
    </>
  )
}

// Kernteile für das Pro-Paket: Schlüssel = Pfad unterhalb von web/src, so wie das Paket "@core/..." importiert
const core: Record<string, unknown> = {
  'lib/api': apiModule,
  'stores/ui': uiStore,
  'stores/product': productStore,
  'stores/auth': authStore,
  'components/Modal': modal,
  'components/Select': select,
  'components/Page': page,
  'components/DateTimePicker': dateTimePicker,
  'components/PasswordField': passwordField,
  'types/handbook': handbookTypes,
  i18n: { default: i18n },
}

// Gemeinsame Bibliotheken: das Pro-Paket bringt sie nicht selbst mit, sondern nutzt dieselben Instanzen
const libs: Record<string, unknown> = {
  react: React,
  'react-dom': ReactDOM,
  'react/jsx-runtime': jsxRuntime,
  'react-router-dom': ReactRouterDom,
  'react-i18next': ReactI18next,
  '@tanstack/react-query': ReactQuery,
  zustand,
}

declare global {
  interface Window {
    MixMarketHost?: {
      version: number
      libs: Record<string, unknown>
      core: Record<string, unknown>
      register: (fn: (registry: ProWebRegistry) => void) => void
    }
  }
}

// Pro-Stand vom Server holen und bei aktivem Pro das Paket laden (einmal je Sitzung)
let loadingPromise: Promise<void> | null = null
export function loadPro(): Promise<void> {
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    usePro.setState({ loading: true })
    try {
      const status = await apiModule.api.get<{ active: boolean; version: string | null; features: ProFeature[]; web: boolean }>(
        '/api/pro/status',
      )
      if (!status.active || !status.web) {
        usePro.setState({ active: false, version: null, features: [], slots: {}, functions: {} })
        return
      }
      window.MixMarketHost = {
        version: 1,
        libs,
        core,
        register: (fn) => fn(registry),
      }
      await new Promise<void>((resolve, reject) => {
        // Ein früher geladenes Paket ersetzen (z. B. nach dem Freischalten einer neuen Version)
        document.querySelectorAll('script[data-mixmarket-pro]').forEach((el) => el.remove())
        const script = document.createElement('script')
        script.dataset.mixmarketPro = '1'
        script.src = `/api/pro/web.js?t=${Date.now()}`
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Pro-Paket konnte nicht geladen werden'))
        document.head.appendChild(script)
      })
      usePro.setState({ active: true, version: status.version, features: status.features })
    } catch {
      // Ohne Pro läuft der Kern ganz normal weiter
      usePro.setState({ active: false })
      loadingPromise = null
    } finally {
      usePro.setState({ loading: false })
    }
  })()
  return loadingPromise
}

// Pro in der Oberfläche abschalten (Schlüssel entfernt, Abo abgelaufen): Einschübe zeigen wieder ihren Ersatz
export function clearPro(): void {
  loadingPromise = null
  usePro.setState({ active: false, version: null, features: [], slots: {}, functions: {} })
}

// Pro neu laden, z. B. direkt nach dem Freischalten, ohne die Seite neu zu laden
export function reloadPro(): Promise<void> {
  clearPro()
  return loadPro()
}
