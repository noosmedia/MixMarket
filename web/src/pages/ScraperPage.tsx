// Recherche-Seite: extrahiert strukturierte Daten von einzelnen Webseiten
// für gezielte B2B-Recherche. Aufträge laufen im Hintergrund, laufende
// Aufträge werden automatisch aktualisiert. Ergebnisse können als Kontakte
// übernommen werden.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Globe,
  Plus,
  Trash2,
  Play,
  Download,
  FileSearch,
  RefreshCw,
  Mail,
  Search,
  UserPlus,
  Send,
} from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { PageHeader, PageBody, EmptyState, Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { useJumpTarget, useUi } from '../stores/ui'
import { useProduct } from '../stores/product'
import { DiscoveryPanel } from './DiscoveryPanel'
import { CohortPanel } from './CohortPanel'
import { ProductSwitcher } from './ProductSwitcher'
import { ProspectsPanel } from './ProspectsPanel'
import { Select } from '../components/Select'
import './scraper.css'

// Bereiche der Recherche: Firmen finden, Zielgruppen bilden, Interessenten pflegen oder Webseiten auslesen
type ResearchTab = 'discover' | 'cohorts' | 'prospects' | 'pages'
const RESEARCH_TABS: ResearchTab[] = ['discover', 'cohorts', 'prospects', 'pages']
const TAB_STORAGE_KEY = 'mixmarket-research-tab'

// Zuletzt gewählten Bereich lesen (Standard: Firmen finden)
function savedTab(): ResearchTab {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY)
    return RESEARCH_TABS.includes(stored as ResearchTab) ? (stored as ResearchTab) : 'discover'
  } catch {
    return 'discover'
  }
}

// Moegliche Zustände eines Recherche-Auftrags
type JobStatus = 'idle' | 'running' | 'done' | 'error'
// Art des Auftrags: strukturierte Felder oder Kontaktdaten
type JobType = 'structured' | 'contacts'

// Konfiguration, mit der ein Auftrag gestartet wurde
interface JobConfig {
  urls: string[]
  selectors?: Record<string, string>
  extractEmails?: boolean
  mustContain?: string
  useBrowser?: boolean
}

// Datenmodell eines Auftrags (entspricht der Backend-Antwort)
interface ScrapeJob {
  id: string
  name: string
  type: JobType
  status: JobStatus
  resultCount: number
  error?: string
  config: JobConfig
  createdAt: string
  _count: { results: number }
}

// Einzelnes Ergebnis eines Auftrags. data ist ein beliebiges Objekt.
interface ScrapeResult {
  id: string
  data: Record<string, unknown>
  sourceUrl?: string
  createdAt: string
}

// Antwortformat der Ergebnisliste
interface ResultsResponse {
  items: ScrapeResult[]
  total: number
}

// Zielliste für die Kontaktübernahme
interface MailList {
  id: string
  name: string
}

// Ein optionales Selektor-Paar (Feldname + CSS-Selektor) im Formular
interface SelectorPair {
  field: string
  selector: string
}

// Formularzustand für einen neuen Auftrag
interface JobForm {
  name: string
  type: JobType
  urls: string
  mustContain: string
  extractEmails: boolean
  useBrowser: boolean
  selectors: SelectorPair[]
}

// Leeres Formular als Ausgangszustand (drei leere Selektor-Zeilen vorbereitet)
const emptyForm: JobForm = {
  name: '',
  type: 'structured',
  urls: '',
  mustContain: '',
  extractEmails: false,
  useBrowser: false,
  selectors: [
    { field: '', selector: '' },
    { field: '', selector: '' },
    { field: '', selector: '' },
  ],
}

export function ScraperPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()

  // Modalsteuerung: Auftrags-Formular und geöffneter Auftrag für Ergebnisse
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<JobForm>(emptyForm)
  const [resultsJobId, setResultsJobId] = useState<string | null>(null)

  // Aktiver Bereich und Formular der Firmensuche
  const [tab, setTab] = useState<ResearchTab>(savedTab)
  const [discoverFormOpen, setDiscoverFormOpen] = useState(false)
  // Zähler, mit dem "Neue Zielgruppe" den Aufbau zurücksetzt
  const [cohortReset, setCohortReset] = useState(0)
  // Zähler, mit dem der Seitenkopf "In Kontakte übernehmen" auslöst
  const [toContactsSignal, setToContactsSignal] = useState(0)
  // Zähler, mit dem der Seitenkopf "Neue anschreiben" auslöst
  const [writeSignal, setWriteSignal] = useState(0)

  // Bereich wechseln und für den nächsten Besuch merken
  function switchTab(next: ResearchTab) {
    setTab(next)
    try {
      localStorage.setItem(TAB_STORAGE_KEY, next)
    } catch {
      // Ohne Speicher bleibt nur die Auswahl dieser Sitzung
    }
  }

  // Vorbelegte Branche aus der Adresse (/scraper?branch=dentist, z. B. aus einem Vorlagenpaket):
  // Firmensuche öffnen und die Branche vorwählen, danach die Angabe aus der Adresse entfernen
  const [searchParams, setSearchParams] = useSearchParams()
  const [presetBranch, setPresetBranch] = useState<string | null>(null)
  useEffect(() => {
    const branch = searchParams.get('branch')
    if (!branch) return
    switchTab('discover')
    setPresetBranch(branch)
    setDiscoverFormOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  // Geführte Tour: wählt den passenden Bereich von außen (Ereignis mixmarket:research-tab)
  useEffect(() => {
    const onTab = (e: Event) => {
      const next = (e as CustomEvent<string>).detail
      if (next === 'discover' || next === 'cohorts' || next === 'prospects' || next === 'pages') switchTab(next)
    }
    window.addEventListener('mixmarket:research-tab', onTab)
    return () => window.removeEventListener('mixmarket:research-tab', onTab)
  }, [])

  // Sprung aus der Suche: passenden Bereich und gegebenenfalls das Produkt wählen.
  // Geöffnet wird der Eintrag vom jeweiligen Bereich selbst, daher hier nicht einlösen.
  const setProductId = useProduct((s) => s.setProductId)
  useJumpTarget(
    ['companies', 'searches', 'cohorts', 'prospects', 'products'],
    (jump) => {
      if (jump.productId) setProductId(jump.productId)
      if (jump.area === 'companies' || jump.area === 'searches') switchTab('discover')
      else if (jump.area === 'cohorts') switchTab('cohorts')
      else if (jump.area === 'prospects') switchTab('prospects')
      // Die Produktverwaltung gibt es in allen Bereichen außer "Webseiten auslesen"
      else if (jump.area === 'products' && tab === 'pages') switchTab('discover')
    },
    undefined,
    false,
  )
  // Webseiten-Auftrag: Bereich wechseln und Ergebnisse des Auftrags öffnen
  useJumpTarget(['scrapeJobs'], (jump) => {
    switchTab('pages')
    setResultsJobId(jump.id)
  })

  // Aufträge laden. Nur im Bereich "Webseiten auslesen" alle vier Sekunden aktualisieren.
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['scrapeJobs'],
    queryFn: () => api.get<ScrapeJob[]>('/api/scrape/jobs'),
    refetchInterval: tab === 'pages' ? 4000 : false,
  })

  // Verfügbare Listen als optionales Ziel der Kontaktübernahme
  const { data: lists } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.get<MailList[]>('/api/lists'),
  })

  // Ergebnisse des geöffneten Auftrags laden (nur wenn ein Auftrag offen ist)
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['scrapeResults', resultsJobId],
    queryFn: () =>
      api.get<ResultsResponse>(`/api/scrape/jobs/${resultsJobId}/results`),
    enabled: !!resultsJobId,
  })

  // Neuen Auftrag anlegen und sofort starten
  const createMutation = useMutation({
    mutationFn: (payload: JobForm) => {
      // URLs zeilenweise zerlegen und leere Zeilen entfernen
      const urls = payload.urls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean)

      // Selektor-Paare in ein Objekt umwandeln (nur vollständige Paare)
      const selectors: Record<string, string> = {}
      for (const pair of payload.selectors) {
        const field = pair.field.trim()
        const selector = pair.selector.trim()
        if (field && selector) selectors[field] = selector
      }

      // Konfiguration zusammenstellen
      const config: JobConfig = {
        urls,
        mustContain: payload.mustContain.trim() || undefined,
        extractEmails: payload.extractEmails,
        useBrowser: payload.useBrowser,
        selectors:
          payload.type === 'structured' && Object.keys(selectors).length > 0
            ? selectors
            : undefined,
      }

      return api.post<ScrapeJob>('/api/scrape/jobs', {
        name: payload.name.trim(),
        type: payload.type,
        config,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrapeJobs'] })
      notify(
        'success',
        t('scraper.statusRunning', {
          defaultValue: 'Recherche-Auftrag gestartet',
        }),
      )
      closeForm()
    },
    onError: (err) => {
      notify(
        'error',
        err instanceof ApiError
          ? err.message
          : t('common.error', { defaultValue: 'Fehler' }),
      )
    },
  })

  // Auftrag löschen
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/scrape/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrapeJobs'] })
      notify(
        'success',
        t('scraper.deleted', { defaultValue: 'Auftrag gelöscht' }),
      )
    },
    onError: (err) => {
      notify(
        'error',
        err instanceof ApiError
          ? err.message
          : t('common.error', { defaultValue: 'Fehler' }),
      )
    },
  })

  // Ergebnisse mit E-Mail als Kontakte übernehmen
  const toContactsMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ created: number; skipped: number }>(
        `/api/scrape/jobs/${id}/to-contacts`,
        {},
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['scrapeJobs'] })
      notify(
        'success',
        t('scraper.toContactsDone', {
          created: res.created,
          skipped: res.skipped,
          defaultValue:
            '{{created}} als Kontakte übernommen, {{skipped}} übersprungen',
        }),
      )
    },
    onError: (err) => {
      notify(
        'error',
        err instanceof ApiError
          ? err.message
          : t('common.error', { defaultValue: 'Fehler' }),
      )
    },
  })

  // Formular für einen neuen Auftrag öffnen
  function openCreate() {
    setForm(emptyForm)
    setFormOpen(true)
  }

  // Formular schließen und zurücksetzen
  function closeForm() {
    setFormOpen(false)
    setForm(emptyForm)
  }

  // Ein Feld im Formular aktualisieren
  function updateField<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Ein Selektor-Paar an einer Position aktualisieren
  function updateSelector(index: number, key: keyof SelectorPair, value: string) {
    setForm((prev) => ({
      ...prev,
      selectors: prev.selectors.map((pair, i) =>
        i === index ? { ...pair, [key]: value } : pair,
      ),
    }))
  }

  // Auftrag absenden
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Name pruefen
    if (!form.name.trim()) {
      notify(
        'error',
        t('scraper.nameRequired', { defaultValue: 'Name ist erforderlich' }),
      )
      return
    }
    // Mindestens eine URL pruefen
    const urls = form.urls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
    if (urls.length === 0) {
      notify(
        'error',
        t('scraper.urlsRequired', {
          defaultValue: 'Mindestens eine Adresse ist erforderlich',
        }),
      )
      return
    }
    createMutation.mutate(form)
  }

  // Löschen mit eigenem Bestätigungsdialog
  async function handleDelete(job: ScrapeJob) {
    const ok = await confirm({
      message: t('scraper.deleteConfirm', {
        name: job.name,
        defaultValue: 'Auftrag "{{name}}" wirklich löschen?',
      }),
      danger: true,
      confirmLabel: t('common.delete'),
    })
    if (ok) deleteMutation.mutate(job.id)
  }

  // Statusabhängige Badge-Klasse ermitteln
  function statusBadgeClass(s: JobStatus): string {
    if (s === 'done') return 'badge badge-active'
    if (s === 'running') return 'badge badge-info'
    if (s === 'error') return 'badge badge-bounced'
    return 'badge badge-unsub'
  }

  // Statuslabel ermitteln
  function statusLabel(s: JobStatus): string {
    if (s === 'done') return t('scraper.statusDone', { defaultValue: 'Fertig' })
    if (s === 'running')
      return t('scraper.statusRunning', { defaultValue: 'Läuft' })
    if (s === 'error')
      return t('scraper.statusError', { defaultValue: 'Fehler' })
    return t('scraper.statusIdle')
  }

  // Typlabel ermitteln
  function typeLabel(type: JobType): string {
    return type === 'contacts'
      ? t('scraper.typeContacts', { defaultValue: 'Kontaktdaten' })
      : t('scraper.typeStructured', { defaultValue: 'Strukturierte Daten' })
  }

  // Ein Datenwert als lesbarer Text (Objekte werden als JSON dargestellt)
  function renderValue(value: unknown): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  // Geöffneten Auftrag aus der Liste ermitteln
  const openJob = jobs?.find((j) => j.id === resultsJobId) ?? null
  // Pruefen, ob ein Auftrag Ergebnisse mit E-Mail enthaelt (für Kontaktübernahme)
  function hasEmailResults(job: ScrapeJob): boolean {
    return job.type === 'contacts' || job.config.extractEmails === true
  }

  // Spaltenschluessel aus dem ersten Ergebnis ableiten
  const resultItems = results?.items ?? []
  const columns =
    resultItems.length > 0 ? Object.keys(resultItems[0].data) : []

  return (
    <>
      <PageHeader help={{ chapter: 'research' }}
        eyebrow={t('nav.scraper', { defaultValue: 'Recherche' })}
        title={t('scraper.title', { defaultValue: 'Recherche' })}
        subtitle={
          tab === 'discover'
            ? t('discovery.subtitle')
            : tab === 'cohorts'
              ? t('cohorts.subtitle')
              : tab === 'prospects'
                ? t('prospects.subtitle')
                : t('scraper.subtitle', {
                defaultValue:
                  'Strukturierte Daten gezielt von einzelnen Webseiten extrahieren.',
              })
        }
        actions={
          tab === 'discover' ? (
            <button className="btn btn-primary" data-tour="discovery-new" onClick={() => setDiscoverFormOpen(true)}>
              <Search size={16} />
              {t('discovery.add')}
            </button>
          ) : tab === 'cohorts' ? (
            <button className="btn btn-primary" onClick={() => setCohortReset((n) => n + 1)} data-tour="cohort-new">
              <Plus size={16} />
              {t('cohorts.add')}
            </button>
          ) : tab === 'prospects' ? (
            <>
              <button className="btn btn-secondary" onClick={() => setToContactsSignal((n) => n + 1)} data-tour="prospects-to-contacts">
                <UserPlus size={16} />
                {t('prospects.toContacts')}
              </button>
              <button className="btn btn-primary" onClick={() => setWriteSignal((n) => n + 1)} data-tour="prospects-write-all">
                <Send size={16} />
                {t('prospects.writeAll')}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={openCreate} data-tour="scrape-new">
              <Plus size={16} />
              {t('scraper.add', { defaultValue: 'Neuer Auftrag' })}
            </button>
          )
        }
      />

      <PageBody>
        {/* Produkt, für das gesucht und bewertet wird (nicht beim Webseiten-Auslesen) */}
        {tab !== 'pages' && <ProductSwitcher />}

        {/* Umschalter zwischen den Bereichen: am Desktop Reiter, auf dem Handy ein Auswahlfeld */}
        <div className="segmented scraper-tabs hide-mobile" role="tablist">
          {RESEARCH_TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={tab === key ? 'active' : ''}
              data-tour={`research-tab-${key}`}
              onClick={() => switchTab(key)}
            >
              {t(`discovery.tab.${key}`)}
            </button>
          ))}
        </div>
        <Select
          className="show-mobile scraper-tab-select"
          value={tab}
          onChange={(v) => switchTab(v as ResearchTab)}
          options={RESEARCH_TABS.map((key) => ({ value: key, label: t(`discovery.tab.${key}`) }))}
          aria-label={t('scraper.title', { defaultValue: 'Recherche' })}
        />

        {tab === 'discover' ? (
          <DiscoveryPanel
            formOpen={discoverFormOpen}
            onOpenForm={() => setDiscoverFormOpen(true)}
            onCloseForm={() => setDiscoverFormOpen(false)}
            presetBranch={presetBranch}
            onPresetUsed={() => setPresetBranch(null)}
          />
        ) : tab === 'cohorts' ? (
          <CohortPanel resetSignal={cohortReset} />
        ) : tab === 'prospects' ? (
          <ProspectsPanel toContactsSignal={toContactsSignal} writeSignal={writeSignal} />
        ) : /* Inhalt: Ladeanzeige, Leerzustand oder Auftrags-Liste */
        isLoading ? (
          <Loading />
        ) : !jobs || jobs.length === 0 ? (
          <EmptyState
            icon={<FileSearch size={28} />}
            title={t('common.empty', { defaultValue: 'Noch nichts vorhanden' })}
            description={t('scraper.emptyHint', {
              defaultValue:
                'Legen Sie einen Recherche-Auftrag an, um Daten von einer Webseite zu extrahieren.',
            })}
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} />
                {t('scraper.add', { defaultValue: 'Neuer Auftrag' })}
              </button>
            }
          />
        ) : (
          <div className="data-list">
            {jobs.map((job) => (
              <div className="data-row" key={job.id} data-job-id={job.id}>
                <div className="data-row-main">
                  {/* Titelzeile: Name des Auftrags */}
                  <div className="data-row-title">{job.name}</div>
                  {/* Meta: Typ, Anzahl Ergebnisse, Datum und Fehler */}
                  <div className="data-row-meta">
                    {typeLabel(job.type)} · {job._count.results}{' '}
                    {t('scraper.results', { defaultValue: 'Ergebnisse' })} ·{' '}
                    {new Date(job.createdAt).toLocaleDateString()}
                    {job.status === 'error' && job.error ? ` · ${job.error}` : ''}
                  </div>
                </div>
                <div className="data-row-aside">
                  {/* Statusanzeige als Badge, laufend mit drehendem Symbol */}
                  <span className={statusBadgeClass(job.status)}>
                    {job.status === 'running' && (
                      <RefreshCw size={13} className="scraper-spin" />
                    )}
                    {statusLabel(job.status)}
                  </span>
                  {/* Aktionen je Auftrag */}
                  <div className="data-row-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setResultsJobId(job.id)}
                      data-tour="scrape-results"
                    >
                      <Download size={14} />
                      {t('scraper.results', { defaultValue: 'Ergebnisse' })}
                    </button>
                    {job.status === 'done' &&
                      job._count.results > 0 &&
                      hasEmailResults(job) && (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => toContactsMutation.mutate(job.id)}
                          disabled={toContactsMutation.isPending}
                        >
                          <Mail size={14} />
                          {t('scraper.toContacts', {
                            defaultValue: 'Als Kontakte übernehmen',
                          })}
                        </button>
                      )}
                    <button
                      className="btn btn-sm btn-icon btn-ghost btn-danger"
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                      onClick={() => handleDelete(job)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>

      {/* Neuer-Auftrag-Modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={t('scraper.add', { defaultValue: 'Neuer Auftrag' })}
        subtitle={t('scraper.formSubtitle', {
          defaultValue: 'Adressen und Felder für die Recherche festlegen.',
        })}
        width={640}
        footer={
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={closeForm}>
              {t('common.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-tour="scrape-start"
            >
              <Play size={16} />
              {t('scraper.start', { defaultValue: 'Starten' })}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="scraper-form" data-tour="scrape-form">
          {/* Name */}
          <div className="field" data-tour="scrape-name">
            <label className="field-label" htmlFor="scrape-name">{t('common.name')} *</label>
            <input
              id="scrape-name"
              className="input"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Typ-Auswahl als segmentiertes Steuerelement */}
          <div className="field" data-tour="scrape-type">
            <label className="field-label">
              {t('scraper.type', { defaultValue: 'Art der Recherche' })}
            </label>
            <div className="segmented">
              <button
                type="button"
                className={form.type === 'structured' ? 'active' : ''}
                onClick={() => updateField('type', 'structured')}
              >
                {t('scraper.typeStructured', {
                  defaultValue: 'Strukturierte Daten',
                })}
              </button>
              <button
                type="button"
                className={form.type === 'contacts' ? 'active' : ''}
                onClick={() => updateField('type', 'contacts')}
              >
                {t('scraper.typeContacts', { defaultValue: 'Kontaktdaten' })}
              </button>
            </div>
          </div>

          {/* Adressen, eine pro Zeile */}
          <div className="field" data-tour="scrape-urls">
            <label className="field-label" htmlFor="scrape-urls">
              {t('scraper.urls', { defaultValue: 'Adressen' })} *
            </label>
            <textarea
              id="scrape-urls"
              className="textarea font-mono"
              rows={5}
              placeholder={'https://www.beispiel.de/team'}
              value={form.urls}
              onChange={(e) => updateField('urls', e.target.value)}
            />
            <p className="field-hint">
              {t('scraper.urlsHint', {
                defaultValue: 'Eine Adresse pro Zeile.',
              })}
            </p>
          </div>

          {/* Sachgebiet-Begriff, der vorkommen muss */}
          <div className="field" data-tour="scrape-must">
            <label className="field-label">
              {t('scraper.mustContain', {
                defaultValue: 'Muss enthalten (Sachgebiet)',
              })}
            </label>
            <input
              className="input"
              type="text"
              value={form.mustContain}
              onChange={(e) => updateField('mustContain', e.target.value)}
            />
            <p className="field-hint">
              {t('scraper.mustContainHint', {
                defaultValue:
                  'Nur Seiten verarbeiten, die diesen Begriff enthalten.',
              })}
            </p>
          </div>

          {/* Optionen */}
          <div className="field" data-tour="scrape-options">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.extractEmails}
                onChange={(e) => updateField('extractEmails', e.target.checked)}
              />
              <span>
                {t('scraper.extractEmails', {
                  defaultValue: 'E-Mail-Adressen erkennen',
                })}
              </span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.useBrowser}
                onChange={(e) => updateField('useBrowser', e.target.checked)}
              />
              <span>
                {t('scraper.useBrowser', {
                  defaultValue: 'Browser für dynamische Seiten verwenden',
                })}
              </span>
            </label>
          </div>

          {/* Selektor-Paare nur bei strukturierten Daten */}
          {form.type === 'structured' && (
            <div className="field">
              <label className="field-label">
                {t('scraper.selectors', {
                  defaultValue: 'Felder (optional)',
                })}
              </label>
              <p className="field-hint">
                {t('scraper.selectorsHint', {
                  defaultValue:
                    'Feldname und passender CSS-Selektor je Zeile.',
                })}
              </p>
              <div className="scraper-selectors">
                {form.selectors.map((pair, index) => (
                  <div key={index} className="scraper-selector-row">
                    <input
                      className="input"
                      type="text"
                      placeholder={t('scraper.selectorField', {
                        defaultValue: 'Feldname',
                      })}
                      value={pair.field}
                      onChange={(e) =>
                        updateSelector(index, 'field', e.target.value)
                      }
                    />
                    <input
                      className="input font-mono"
                      type="text"
                      placeholder={'.css-selektor'}
                      value={pair.selector}
                      onChange={(e) =>
                        updateSelector(index, 'selector', e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Ergebnis-Modal */}
      <Modal
        open={!!resultsJobId}
        onClose={() => setResultsJobId(null)}
        title={openJob?.name ?? t('scraper.results', { defaultValue: 'Ergebnisse' })}
        subtitle={t('scraper.resultsSubtitle', {
          count: results?.total ?? 0,
          defaultValue: '{{count}} Ergebnisse',
        })}
        width={820}
      >
        <div data-tour="scrape-results-view">
          {resultsLoading ? (
            <Loading />
          ) : resultItems.length === 0 ? (
            <EmptyState
              icon={<Globe size={28} />}
              title={t('common.empty', { defaultValue: 'Noch nichts vorhanden' })}
              description={t('scraper.resultsEmpty', {
                defaultValue: 'Für diesen Auftrag liegen keine Ergebnisse vor.',
              })}
            />
          ) : (
            <div className="scraper-results-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                    <th>{t('scraper.sourceUrl', { defaultValue: 'Quelle' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {resultItems.map((item) => (
                    <tr key={item.id}>
                      {columns.map((col) => (
                        <td key={col}>{renderValue(item.data[col])}</td>
                      ))}
                      <td className="font-mono scraper-source">
                        {item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.sourceUrl}
                          </a>
                        ) : (
                          <span className="cell-empty">{'·'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
