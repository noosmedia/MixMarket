// Firmensuche innerhalb der Recherche: Betriebe einer Branche in einem Ort
// über OpenStreetMap, DataForSEO oder Serper finden. Vor jeder kostenpflichtigen
// Suche werden die geschätzten Kosten angezeigt und bestätigt.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Play, RefreshCw, ScanSearch, Search, Trash2 } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { EmptyState, Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { useJumpTarget, useUi } from '../stores/ui'
import { useProduct } from '../stores/product'
import { Select } from '../components/Select'
import { CompanyDetailModal } from './CompanyDetailModal'
import { CompanyTable, type CompanyRow } from './CompanyTable'
import { ProLockButton } from '../pro/ProTeaser'
import './discovery.css'

type ProviderKey = 'osm' | 'dataforseo_listings' | 'dataforseo_serp' | 'serper'
type SearchStatus = 'pending' | 'running' | 'done' | 'error'

interface ProviderInfo {
  key: ProviderKey
  kind: 'listings' | 'serp'
  configured: boolean
  needsCoordinates: boolean
  signupUrl: string
}

interface BranchInfo {
  key: string
  de: string
  en: string
  term: string
  hasOsm: boolean
}

interface DiscoverySearch {
  id: string
  provider: ProviderKey
  branchKey: string | null
  term: string
  location: string
  radiusKm: number
  depth: number
  maxResults: number
  status: SearchStatus
  estimatedCost: number
  actualCost: number
  foundCount: number
  junkCount: number
  newCount: number
  knownCount: number
  error: string | null
  createdAt: string
  profileStatus: 'idle' | 'running' | 'done' | 'error'
  profileTotal: number
  profileDone: number
  profileError: string | null
}

interface EstimateResponse {
  cost: number
  maxSpend: number
  overBudget: boolean
}

// Formularzustand einer neuen Suche
interface SearchForm {
  provider: ProviderKey
  branchKey: string // leer = eigener Suchbegriff
  term: string
  location: string
  radiusKm: number
  depth: number
  maxResults: number
}

const emptyForm: SearchForm = {
  provider: 'osm',
  branchKey: 'roofer',
  term: '',
  location: '',
  radiusKm: 25,
  depth: 30,
  maxResults: 100,
}

const PROVIDER_ORDER: ProviderKey[] = ['osm', 'dataforseo_listings', 'dataforseo_serp', 'serper']
const RADIUS_OPTIONS = [5, 10, 25, 50, 100]
const DEPTH_OPTIONS = [10, 20, 30, 50, 100]
const MAX_RESULT_OPTIONS = [50, 100, 250, 500, 1000]

interface DiscoveryPanelProps {
  formOpen: boolean
  onOpenForm: () => void
  onCloseForm: () => void
  // Von außen vorgewählte Branche (Schlüssel), wird nach dem Übernehmen zurückgesetzt
  presetBranch?: string | null
  onPresetUsed?: () => void
}

export function DiscoveryPanel({ formOpen, onOpenForm, onCloseForm, presetBranch, onPresetUsed }: DiscoveryPanelProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()
  const [form, setForm] = useState<SearchForm>(emptyForm)
  const [openSearchId, setOpenSearchId] = useState<string | null>(null)
  const [detailCompanyId, setDetailCompanyId] = useState<string | null>(null)
  // Gewähltes Produkt: bestimmt, welche KI-Bewertung in der Liste erscheint
  const { productId } = useProduct()

  // Sprung aus der Suche: Firma im Detailfenster oder Suchlauf mit seinen Firmen öffnen
  useJumpTarget(['companies', 'searches'], (jump) => {
    if (jump.area === 'companies') setDetailCompanyId(jump.id)
    else setOpenSearchId(jump.id)
  })

  // Zahlen und Beträge im Format der gewählten Sprache
  const locale = i18n.language === 'en' ? 'en-US' : 'de-DE'
  // Kleinstbeträge mit drei Nachkommastellen, Obergrenzen mit zwei
  const formatUsd = (value: number, digits = 3) =>
    value === 0
      ? t('discovery.free')
      : `${new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)} USD`

  // Quellen, Branchen und bisherige Suchen laden
  const providersQuery = useQuery({
    queryKey: ['discoveryProviders'],
    queryFn: () => api.get<ProviderInfo[]>('/api/discovery/providers'),
  })
  const branchesQuery = useQuery({
    queryKey: ['discoveryBranches'],
    queryFn: () => api.get<BranchInfo[]>('/api/discovery/branches'),
    staleTime: Infinity,
  })
  const searchesQuery = useQuery({
    queryKey: ['discoverySearches'],
    queryFn: () => api.get<DiscoverySearch[]>('/api/discovery/searches'),
    // Solange eine Suche läuft, alle drei Sekunden nachsehen
    refetchInterval: (query) =>
      query.state.data?.some((s) => s.status === 'running' || s.status === 'pending' || s.profileStatus === 'running')
        ? 3000
        : false,
  })

  // Firmen der geöffneten Suche
  const companiesQuery = useQuery({
    queryKey: ['discoveryCompanies', openSearchId, productId],
    queryFn: () =>
      api.get<{ search: DiscoverySearch; items: CompanyRow[] }>(
        `/api/discovery/searches/${openSearchId}/companies?productId=${encodeURIComponent(productId ?? '')}`,
      ),
    enabled: !!openSearchId,
    // Während die Firmen durchleuchtet werden, Liste laufend auffrischen
    refetchInterval: (query) => (query.state.data?.search.profileStatus === 'running' ? 3000 : false),
  })

  const providers = providersQuery.data ?? []
  const selectedProvider = providers.find((p) => p.key === form.provider)
  const branches = useMemo(() => {
    const list = branchesQuery.data ?? []
    const label = (b: BranchInfo) => (i18n.language === 'en' ? b.en : b.de)
    return [...list].sort((a, b) => label(a).localeCompare(label(b), locale))
  }, [branchesQuery.data, i18n.language, locale])

  // Kosten laufend schätzen, kurz verzögert nach der letzten Eingabe
  const [estimateInput, setEstimateInput] = useState<SearchForm | null>(null)
  useEffect(() => {
    if (!formOpen) return
    const handle = setTimeout(() => setEstimateInput(form), 300)
    return () => clearTimeout(handle)
  }, [form, formOpen])
  const canEstimate = !!estimateInput && (estimateInput.branchKey !== '' || estimateInput.term.trim().length >= 2)
  const estimateQuery = useQuery({
    queryKey: ['discoveryEstimate', estimateInput],
    queryFn: () =>
      api.post<EstimateResponse>('/api/discovery/estimate', {
        ...toPayload(estimateInput as SearchForm),
        location: (estimateInput as SearchForm).location.trim() || 'Berlin',
      }),
    enabled: formOpen && canEstimate,
    retry: false,
  })

  // Formularwerte in den Aufbau der Schnittstelle bringen
  function toPayload(f: SearchForm) {
    return {
      provider: f.provider,
      branchKey: f.branchKey || null,
      term: f.branchKey ? null : f.term.trim(),
      location: f.location.trim(),
      radiusKm: f.radiusKm,
      depth: f.depth,
      maxResults: f.maxResults,
    }
  }

  // Fehlermeldung eines Aufrufs als Toast zeigen
  function showError(err: unknown) {
    notify('error', err instanceof ApiError ? err.message : t('discovery.genericError'))
  }

  const startMutation = useMutation({
    mutationFn: (f: SearchForm) => api.post<DiscoverySearch>('/api/discovery/searches', toPayload(f)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discoverySearches'] })
      notify('success', t('discovery.started'))
      onCloseForm()
    },
    onError: showError,
  })

  // Alle Firmen einer Suche durchleuchten
  const profileMutation = useMutation({
    mutationFn: (id: string) => api.post<{ ok: boolean }>(`/api/discovery/searches/${id}/profile`),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: ['discoverySearches'] })
      queryClient.invalidateQueries({ queryKey: ['discoveryCompanies', id] })
      notify('info', t('discovery.profileStarted'))
    },
    onError: showError,
  })

  // Fehlgeschlagene Suche mit denselben Angaben erneut starten
  const retryMutation = useMutation({
    mutationFn: (id: string) => api.post<DiscoverySearch>(`/api/discovery/searches/${id}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discoverySearches'] })
      notify('success', t('discovery.started'))
    },
    onError: showError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/discovery/searches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discoverySearches'] })
      notify('success', t('discovery.deleted'))
    },
    onError: showError,
  })

  // Formular beim Öffnen zurücksetzen und erste eingerichtete Quelle vorwählen
  useEffect(() => {
    if (formOpen) {
      setForm(emptyForm)
      setEstimateInput(null)
    }
  }, [formOpen])

  // Vorgewählte Branche ins Formular übernehmen, sobald die Branchenliste geladen ist (unbekannte Schlüssel ignorieren).
  // Steht bewusst nach dem Zurücksetzen beim Öffnen, damit die Vorwahl im selben Durchlauf gewinnt.
  useEffect(() => {
    if (!presetBranch || !branchesQuery.data) return
    if (branchesQuery.data.some((b) => b.key === presetBranch)) setForm((f) => ({ ...f, branchKey: presetBranch }))
    onPresetUsed?.()
  }, [presetBranch, branchesQuery.data, onPresetUsed])

  function update<K extends keyof SearchForm>(key: K, value: SearchForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Suche prüfen, bei Kosten bestätigen lassen und starten
  async function handleStart(e?: React.FormEvent) {
    e?.preventDefault()
    if (selectedProvider && !selectedProvider.configured) {
      notify('warning', t('discovery.providerMissing'))
      return
    }
    if (!form.branchKey && form.term.trim().length < 2) {
      notify('error', t('discovery.termRequired'))
      return
    }
    if (form.location.trim().length < 2) {
      notify('error', t('discovery.locationRequired'))
      return
    }
    const cost = estimateQuery.data?.cost ?? 0
    if (estimateQuery.data?.overBudget) {
      notify('error', t('discovery.overBudget', { max: formatUsd(estimateQuery.data.maxSpend, 2) }))
      return
    }
    if (cost > 0) {
      const ok = await confirm({
        message: t('discovery.confirmCost', { cost: formatUsd(cost) }),
        confirmLabel: t('discovery.start'),
      })
      if (!ok) return
    }
    startMutation.mutate(form)
  }

  async function handleDelete(search: DiscoverySearch) {
    const ok = await confirm({
      message: t('discovery.deleteConfirm', { name: `${search.term} ${search.location}` }),
      danger: true,
      confirmLabel: t('common.delete'),
    })
    if (ok) deleteMutation.mutate(search.id)
  }

  // Anzeigename einer Suche: Branche (in der gewählten Sprache) oder Suchbegriff
  function searchTitle(s: DiscoverySearch): string {
    const branch = branchesQuery.data?.find((b) => b.key === s.branchKey)
    const name = branch ? (i18n.language === 'en' ? branch.en : branch.de) : s.term
    return `${name} · ${s.location}`
  }

  function statusBadge(s: DiscoverySearch) {
    if (s.status === 'done') return <span className="badge badge-active">{t('discovery.statusDone')}</span>
    if (s.status === 'error') return <span className="badge badge-bounced">{t('discovery.statusError')}</span>
    return (
      <span className="badge badge-info">
        <RefreshCw size={13} className="scraper-spin" />
        {t('discovery.statusRunning')}
      </span>
    )
  }

  const searches = searchesQuery.data ?? []
  const openSearch = companiesQuery.data?.search ?? searches.find((s) => s.id === openSearchId)
  const companies = companiesQuery.data?.items ?? []
  const isSerp = selectedProvider?.kind === 'serp'
  const estimate = estimateQuery.data

  return (
    <>
      {/* Liste der bisherigen Suchen */}
      {searchesQuery.isLoading ? (
        <Loading />
      ) : searchesQuery.isError ? (
        <EmptyState
          icon={<Search size={28} />}
          title={t('discovery.loadError')}
          description={searchesQuery.error instanceof ApiError ? searchesQuery.error.message : undefined}
        />
      ) : searches.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title={t('discovery.emptyTitle')}
          description={t('discovery.emptyHint')}
          action={
            <button className="btn btn-primary" onClick={onOpenForm}>
              <Search size={16} />
              {t('discovery.add')}
            </button>
          }
        />
      ) : (
        <div className="data-list">
          {searches.map((s) => (
            <div className="data-row discovery-row" key={s.id} data-search-id={s.id}>
              <div className="data-row-main">
                <div className="data-row-title">{searchTitle(s)}</div>
                <div className="data-row-meta discovery-meta">
                  <span>{t(`discovery.provider.${s.provider}.name`)}</span>
                  {(s.provider === 'osm' || s.provider === 'dataforseo_listings') && <span>{s.radiusKm} km</span>}
                  {s.status === 'done' && (
                    <span>
                      {t('discovery.counts', { created: s.newCount, known: s.knownCount, junk: s.junkCount })}
                    </span>
                  )}
                  <span className="font-mono">{formatUsd(s.status === 'done' ? s.actualCost : s.estimatedCost)}</span>
                  <span>{new Date(s.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                {s.error && (
                  <div className={`discovery-note ${s.status === 'error' ? 'discovery-note-error' : ''}`}>{s.error}</div>
                )}
                {/* Laufende Suche: OpenStreetMap braucht unter Last bis zu einer Minute */}
                {(s.status === 'running' || s.status === 'pending') && (
                  <div className="discovery-progress" aria-live="polite">
                    <RefreshCw size={12} className="scraper-spin" />
                    {t('discovery.runningHint')}
                  </div>
                )}
                {/* Stand des Durchleuchtens */}
                {s.profileStatus === 'running' && (
                  <div className="discovery-progress" aria-live="polite" data-tour="discovery-profile-progress">
                    <RefreshCw size={12} className="scraper-spin" />
                    {t('discovery.profileProgress', { done: s.profileDone, total: s.profileTotal })}
                    <span className="discovery-progress-bar">
                      <span style={{ width: `${s.profileTotal ? (s.profileDone / s.profileTotal) * 100 : 0}%` }} />
                    </span>
                  </div>
                )}
                {s.profileStatus === 'done' && <div className="discovery-profiled" data-tour="discovery-profiled">{t('discovery.profileDone', { count: s.profileTotal })}</div>}
                {s.profileStatus === 'error' && s.profileError && (
                  <div className="discovery-note discovery-note-error">{s.profileError}</div>
                )}
              </div>
              <div className="data-row-aside">
                {statusBadge(s)}
                <div className="data-row-actions">
                  {s.status === 'done' && s.newCount + s.knownCount > 0 && s.profileStatus !== 'running' && (
                    <button
                      className={`btn btn-sm ${s.profileStatus === 'done' ? 'btn-ghost' : 'btn-secondary'}`}
                      data-tour="discovery-profile"
                      onClick={() => profileMutation.mutate(s.id)}
                      disabled={profileMutation.isPending}
                    >
                      <ScanSearch size={14} />
                      {s.profileStatus === 'done' ? t('discovery.reprofile') : t('discovery.profile')}
                    </button>
                  )}
                  {s.status === 'done' && s.newCount + s.knownCount > 0 && (
                    <button className="btn btn-sm btn-secondary" onClick={() => setOpenSearchId(s.id)} data-tour="discovery-show-companies">
                      <Building2 size={14} />
                      {t('discovery.showCompanies', { count: s.newCount + s.knownCount })}
                    </button>
                  )}
                  {s.status === 'error' && (
                    <button className="btn btn-sm btn-secondary" data-tour="discovery-retry" onClick={() => retryMutation.mutate(s.id)} disabled={retryMutation.isPending}>
                      <RefreshCw size={14} />
                      {t('discovery.retry')}
                    </button>
                  )}
                  {(s.status === 'done' || s.status === 'error') && s.profileStatus !== 'running' && (
                    <button
                      className="btn btn-sm btn-icon btn-ghost btn-danger"
                      aria-label={t('common.delete')}
                      onClick={() => handleDelete(s)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formular: neue Suche */}
      <Modal
        open={formOpen}
        onClose={onCloseForm}
        title={t('discovery.add')}
        subtitle={t('discovery.formSubtitle')}
        width={680}
        footer={
          <div className="discovery-footer">
            {/* Kostenzeile: zeigt vor dem Start, was die Suche kostet */}
            <div className="discovery-cost font-mono" aria-live="polite">
              <span className="discovery-cost-label">{t('discovery.costLabel')}</span>
              {!canEstimate ? (
                <span className="text-tertiary">{t('discovery.costPending')}</span>
              ) : estimateQuery.isFetching && !estimate ? (
                <span className="spinner" style={{ width: 14, height: 14 }} />
              ) : estimate ? (
                <span className={estimate.overBudget ? 'discovery-cost-over' : ''}>
                  {formatUsd(estimate.cost)}
                  {estimate.cost > 0 && (
                    <span className="text-tertiary"> / {t('discovery.costCap', { max: formatUsd(estimate.maxSpend, 2) })}</span>
                  )}
                </span>
              ) : (
                <span className="text-tertiary">{t('discovery.costUnknown')}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary" onClick={onCloseForm}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" data-tour="discovery-start" onClick={() => handleStart()} disabled={startMutation.isPending}>
                {startMutation.isPending ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Play size={16} />}
                {t('discovery.start')}
              </button>
            </div>
          </div>
        }
      >
        <form className="discovery-form" onSubmit={handleStart}>
          {/* Quelle wählen */}
          <fieldset className="field discovery-sources" data-tour="discovery-source">
            <legend className="field-label">{t('discovery.source')}</legend>
            {providersQuery.isLoading ? (
              <Loading />
            ) : (
              <div className="discovery-source-list" role="radiogroup">
                {/* Nur Quellen, die der Server anbietet: ohne MixMarket Pro nur OpenStreetMap */}
                {PROVIDER_ORDER.filter((key) => providers.some((x) => x.key === key)).map((key) => {
                  const p = providers.find((x) => x.key === key)
                  const active = form.provider === key
                  return (
                    <button
                      type="button"
                      key={key}
                      role="radio"
                      aria-checked={active}
                      aria-label={t(`discovery.provider.${key}.name`)}
                      className={`discovery-source ${active ? 'active' : ''}`}
                      onClick={() => update('provider', key)}
                    >
                      <span className="discovery-source-mark" aria-hidden="true" />
                      <span className="discovery-source-text">
                        <span className="discovery-source-name">{t(`discovery.provider.${key}.name`)}</span>
                        <span className="discovery-source-desc">{t(`discovery.provider.${key}.desc`)}</span>
                      </span>
                      <span className={`discovery-source-state ${p?.configured ? 'ok' : ''}`}>
                        {key === 'osm'
                          ? t('discovery.free')
                          : p?.configured
                            ? t('discovery.configured')
                            : t('discovery.notConfigured')}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            {/* Bezahlte Quellen gehören zu MixMarket Pro */}
            {!providersQuery.isLoading && !providers.some((x) => x.key !== 'osm') && (
              <ProLockButton feature="paidSources" label={t('discovery.moreSources')} className="btn btn-ghost btn-sm discovery-more-sources" />
            )}
            {selectedProvider && !selectedProvider.configured && (
              <p className="field-hint discovery-missing">
                {t('discovery.providerMissing')}{' '}
                <Link to="/settings#recherche-zugaenge" onClick={onCloseForm}>
                  {t('discovery.toSettings')}
                </Link>
              </p>
            )}
          </fieldset>

          {/* Branche oder eigener Suchbegriff */}
          <div className="discovery-grid">
            <div className="field" data-tour="discovery-branch">
              <label className="field-label" htmlFor="discovery-branch">
                {t('discovery.branch')}
              </label>
              <Select
                id="discovery-branch"
                value={form.branchKey}
                onChange={(v) => update('branchKey', v)}
                options={[
                  ...branches.map((b) => ({ value: b.key, label: i18n.language === 'en' ? b.en : b.de })),
                  { value: '', label: t('discovery.customTerm') },
                ]}
              />
            </div>
            {form.branchKey === '' ? (
              <div className="field">
                <label className="field-label" htmlFor="discovery-term">
                  {t('discovery.term')}
                </label>
                <input
                  id="discovery-term"
                  className="input"
                  value={form.term}
                  onChange={(e) => update('term', e.target.value)}
                  placeholder={t('discovery.termPlaceholder')}
                />
              </div>
            ) : (
              <div className="field">
                <span className="field-label">{t('discovery.searchTermUsed')}</span>
                <div className="discovery-term-preview font-mono">
                  {branches.find((b) => b.key === form.branchKey)?.term}
                </div>
              </div>
            )}
          </div>
          {form.provider === 'osm' && form.branchKey === '' && (
            <p className="field-hint discovery-missing">{t('discovery.osmNeedsBranch')}</p>
          )}

          {/* Ort und Umfang */}
          <div className="discovery-grid">
            <div className="field" data-tour="discovery-location">
              <label className="field-label" htmlFor="discovery-location">
                {t('discovery.location')}
              </label>
              <input
                id="discovery-location"
                className="input"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder={t('discovery.locationPlaceholder')}
              />
            </div>
            {isSerp ? (
              <div className="field" data-tour="discovery-scope">
                <label className="field-label" htmlFor="discovery-depth">
                  {t('discovery.depth')}
                </label>
                <Select
                  id="discovery-depth"
                  value={String(form.depth)}
                  onChange={(v) => update('depth', Number(v))}
                  options={DEPTH_OPTIONS.map((d) => ({ value: String(d), label: t('discovery.depthOption', { count: d }) }))}
                />
              </div>
            ) : (
              <div className="discovery-grid discovery-grid-tight" data-tour="discovery-scope">
                <div className="field">
                  <label className="field-label" htmlFor="discovery-radius">
                    {t('discovery.radius')}
                  </label>
                  <Select
                    id="discovery-radius"
                    value={String(form.radiusKm)}
                    onChange={(v) => update('radiusKm', Number(v))}
                    options={RADIUS_OPTIONS.map((r) => ({ value: String(r), label: `${r} km` }))}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="discovery-max">
                    {t('discovery.maxResults')}
                  </label>
                  <Select
                    id="discovery-max"
                    value={String(form.maxResults)}
                    onChange={(v) => update('maxResults', Number(v))}
                    options={MAX_RESULT_OPTIONS.map((m) => ({ value: String(m), label: t('discovery.maxResultsOption', { count: m }) }))}
                  />
                </div>
              </div>
            )}
          </div>
          <p className="field-hint">{isSerp ? t('discovery.serpHint') : t('discovery.listingsHint')}</p>
          {/* Absenden mit Enter ermöglichen */}
          <button type="submit" hidden />
        </form>
      </Modal>

      {/* Gefundene Firmen einer Suche */}
      <Modal
        open={!!openSearchId}
        onClose={() => setOpenSearchId(null)}
        title={openSearch ? searchTitle(openSearch) : t('discovery.companies')}
        subtitle={
          openSearch
            ? `${t(`discovery.provider.${openSearch.provider}.name`)} · ${t('discovery.companyCount', { count: companies.length })}`
            : undefined
        }
        width={1040}
      >
        {companiesQuery.isLoading ? (
          <Loading />
        ) : companiesQuery.isError ? (
          <EmptyState icon={<Building2 size={28} />} title={t('discovery.loadError')} />
        ) : (
          <>
            <CompanyTable
              companies={companies}
              showRank={!!openSearch && (openSearch.provider === 'dataforseo_serp' || openSearch.provider === 'serper')}
              showRating={openSearch?.provider === 'dataforseo_listings'}
              hideCategory={openSearch?.provider === 'osm'}
              showScore={companies.some((c) => c.score)}
              onOpen={setDetailCompanyId}
            />
            {/* Pflichthinweis der OpenStreetMap-Lizenz (ODbL) */}
            {openSearch?.provider === 'osm' && (
              <p className="discovery-attribution">
                {t('discovery.osmAttribution')}{' '}
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                  openstreetmap.org/copyright
                </a>
              </p>
            )}
          </>
        )}
      </Modal>

      {/* Detailansicht einer Firma */}
      <CompanyDetailModal
        productId={productId}
        companyId={detailCompanyId}
        onClose={() => {
          setDetailCompanyId(null)
          // Liste auffrischen, falls die Firma erneut durchleuchtet wurde
          queryClient.invalidateQueries({ queryKey: ['discoveryCompanies', openSearchId, productId] })
        }}
      />
    </>
  )
}
