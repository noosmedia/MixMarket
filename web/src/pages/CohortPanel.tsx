// Zielgruppen: aus den gefundenen Firmen über Merkmale eine Auswahl
// zusammenstellen. Jedes Merkmal steht auf "egal", "muss" oder "darf nicht";
// die Anzahl passender Firmen wird beim Umschalten sofort neu gezählt.
// Unbekannte Merkmale (Firma noch nicht durchleuchtet) zählen nie als passend.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Save, Sparkles, Trash2, UserPlus, Users, X } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { EmptyState, Loading } from '../components/Page'
import { useJumpTarget, useUi } from '../stores/ui'
import { useProduct } from '../stores/product'
import { Select } from '../components/Select'
import { useProducts } from './ProductSwitcher'
import { CompanyDetailModal } from './CompanyDetailModal'
import { CompanyTable, type CompanyRow } from './CompanyTable'
import './cohorts.css'

type Mode = 'must' | 'mustNot'
type Group = 'contact' | 'website' | 'company' | 'search' | 'ai'

interface ConditionInfo {
  key: string
  group: Group
  param: 'cms' | 'legalForm' | 'score' | 'size' | null
}

interface Condition {
  key: string
  value?: string | null
  mode: Mode
}

interface Filter {
  searchIds: string[]
  conditions: Condition[]
}

interface PreviewResult {
  total: number
  count: number
  stats: Record<string, { yes: number; no: number; unknown: number }>
  options: { cms: Array<{ value: string; count: number }>; legalForm: Array<{ value: string; count: number }> }
  items: CompanyRow[]
}

interface SavedCohort {
  id: string
  productId: string | null
  name: string
  description: string | null
  filter: Filter
  count: number
  total: number
}

interface SearchInfo {
  id: string
  term: string
  location: string
  status: string
  newCount: number
  knownCount: number
}

const GROUPS: Group[] = ['contact', 'website', 'company', 'search', 'ai']
// Auswahl für die Mindest-Passung der KI-Bewertung
const SCORE_OPTIONS = [5, 6, 7, 8, 9].map((v) => ({ value: String(v), count: 0 }))
// Auswahl für die geschätzte Mindestgröße in Mitarbeitern
const SIZE_OPTIONS = [5, 10, 20, 50, 100, 250].map((v) => ({ value: String(v), count: 0 }))

// Stand eines KI-Bewertungslaufs
interface ScoringJob {
  id: string
  status: 'running' | 'done' | 'error' | 'cancelled'
  total: number
  done: number
  failed: number
  skipped: number
  error: string | null
  createdAt: string
}
const EMPTY_FILTER: Filter = { searchIds: [], conditions: [] }

interface CohortPanelProps {
  resetSignal: number // erhöht sich, wenn oben "Neue Zielgruppe" geklickt wird
}

export function CohortPanel({ resetSignal }: CohortPanelProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()
  // Gewähltes Produkt: Zielgruppen, Bewertungen und Merkmal "KI-Passung" beziehen sich darauf
  const { productId } = useProduct()
  const productName = useProducts().data?.find((p) => p.id === productId)?.name ?? ''

  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER)
  const [scopeAll, setScopeAll] = useState(true)
  const [name, setName] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  // Beim Wechsel des Produkts die geladene Zielgruppe lösen (Merkmale bleiben stehen)
  useEffect(() => {
    setSelectedId(null)
    setName('')
  }, [productId])

  // "Neue Zielgruppe" setzt alles zurück
  useEffect(() => {
    setFilter(EMPTY_FILTER)
    setScopeAll(true)
    setName('')
    setSelectedId(null)
  }, [resetSignal])

  const conditionsQuery = useQuery({
    queryKey: ['cohortConditions'],
    queryFn: () => api.get<ConditionInfo[]>('/api/cohorts/conditions'),
    staleTime: Infinity,
  })
  const searchesQuery = useQuery({
    queryKey: ['discoverySearches'],
    queryFn: () => api.get<SearchInfo[]>('/api/discovery/searches'),
  })
  // Neuester KI-Bewertungslauf; während er läuft, alle zwei Sekunden nachsehen
  const [rescore, setRescore] = useState(false)
  // Interessenten übernehmen: leer = alle Firmen der Auswahl, sonst ab dieser Passung
  const [leadMinScore, setLeadMinScore] = useState('')
  const jobQuery = useQuery({
    queryKey: ['scoringJob', productId],
    queryFn: () => api.get<ScoringJob | null>(`/api/ai/jobs/latest?productId=${encodeURIComponent(productId ?? '')}`),
    enabled: !!productId,
    refetchInterval: (query) => (query.state.data?.status === 'running' ? 2000 : false),
  })
  const job = jobQuery.data ?? null
  // Wenn ein Lauf endet: Ergebnisliste neu laden und Bescheid geben
  const [lastJobStatus, setLastJobStatus] = useState<string | null>(null)
  useEffect(() => {
    if (!job) return
    if (lastJobStatus === 'running' && job.status !== 'running') {
      queryClient.invalidateQueries({ queryKey: ['cohortPreview'] })
      // Passung erscheint auch in den Firmenlisten der Suchen und in der Produktzählung
      queryClient.invalidateQueries({ queryKey: ['discoveryCompanies'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      if (job.status === 'done') notify('success', t('cohorts.scoreDone', { count: job.done }))
      if (job.status === 'error') notify('error', job.error ?? t('discovery.genericError'))
    }
    setLastJobStatus(job.status)
  }, [job, lastJobStatus, notify, queryClient, t])

  // Firmen der aktuellen Auswahl als Interessenten übernehmen (schon vorhandene werden übersprungen)
  const addProspectsMutation = useMutation({
    mutationFn: () =>
      api.post<{ added: number; existing: number; belowScore: number }>('/api/prospects', {
        productId,
        filter: effectiveFilter,
        minScore: leadMinScore ? Number(leadMinScore) : null,
      }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
      queryClient.invalidateQueries({ queryKey: ['discoveryCompany'] })
      notify(r.added > 0 ? 'success' : 'info', t('prospects.addDone', { added: r.added, existing: r.existing }))
      if (r.belowScore > 0) notify('info', t('prospects.addBelow', { count: r.belowScore }))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('discovery.genericError')),
  })

  const scoreMutation = useMutation({
    mutationFn: () =>
      api.post<ScoringJob & { notProfiled: number }>('/api/ai/score', {
        productId,
        filter: effectiveFilter,
        cohortId: selectedId,
        rescore,
      }),
    onSuccess: (started) => {
      queryClient.invalidateQueries({ queryKey: ['scoringJob'] })
      notify('info', t('cohorts.scoreStarted', { count: started.total }))
      if (started.notProfiled > 0) notify('warning', t('cohorts.scoreNotProfiled', { count: started.notProfiled }))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('discovery.genericError')),
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post<{ ok: boolean }>(`/api/ai/jobs/${id}/cancel`),
    onSuccess: () => notify('info', t('cohorts.scoreCancelling')),
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('discovery.genericError')),
  })

  const cohortsQuery = useQuery({
    queryKey: ['cohorts', productId],
    queryFn: () => api.get<SavedCohort[]>(`/api/cohorts?productId=${encodeURIComponent(productId ?? '')}`),
    enabled: !!productId,
  })

  // Sprung aus der Suche: gespeicherte Zielgruppe laden, sobald ihr Produkt gewählt ist
  useJumpTarget(
    ['cohorts'],
    (jump) => {
      const cohort = cohortsQuery.data?.find((c) => c.id === jump.id)
      if (cohort) loadCohort(cohort)
      else notify('error', t('search.notFound'))
    },
    (jump) => !!cohortsQuery.data && !cohortsQuery.isFetching && (!jump.productId || jump.productId === productId),
  )

  // Vorschau kurz verzögert nach der letzten Änderung neu berechnen
  const effectiveFilter = useMemo<Filter>(
    () => ({ ...filter, productId, searchIds: scopeAll ? [] : filter.searchIds }),
    [filter, scopeAll, productId],
  )
  const [debounced, setDebounced] = useState<Filter>(effectiveFilter)
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(effectiveFilter), 200)
    return () => clearTimeout(handle)
  }, [effectiveFilter])
  // Bei "Bestimmte Suchen" ohne Auswahl wird nichts gezählt, sondern ein Hinweis gezeigt
  const scopeMissing = !scopeAll && filter.searchIds.length === 0
  const previewQuery = useQuery({
    queryKey: ['cohortPreview', debounced],
    queryFn: () => api.post<PreviewResult>('/api/cohorts/preview', debounced),
    placeholderData: keepPreviousData,
    enabled: !scopeMissing,
  })
  const preview = scopeMissing ? undefined : previewQuery.data

  function showError(err: unknown) {
    notify('error', err instanceof ApiError ? err.message : t('discovery.genericError'))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      // Speichern ordnet die Zielgruppe dem gewählten Produkt zu
      const body = { productId, name: name.trim(), filter: effectiveFilter }
      return selectedId
        ? api.put<SavedCohort>(`/api/cohorts/${selectedId}`, body)
        : api.post<SavedCohort>('/api/cohorts', body)
    },
    onSuccess: (saved) => {
      setSelectedId(saved.id)
      queryClient.invalidateQueries({ queryKey: ['cohorts'] })
      notify('success', t('cohorts.saved'))
    },
    onError: showError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/cohorts/${id}`),
    onSuccess: () => {
      setSelectedId(null)
      setName('')
      setFilter(EMPTY_FILTER)
      setScopeAll(true)
      queryClient.invalidateQueries({ queryKey: ['cohorts'] })
      notify('success', t('cohorts.deleted'))
    },
    onError: showError,
  })

  // Gespeicherte Zielgruppe laden
  function loadCohort(c: SavedCohort) {
    setSelectedId(c.id)
    setName(c.name)
    setFilter({ searchIds: c.filter.searchIds ?? [], conditions: c.filter.conditions ?? [] })
    setScopeAll(!(c.filter.searchIds ?? []).length)
  }

  // Zustand eines Merkmals: egal (nicht im Filter), muss, darf nicht
  function modeOf(key: string): Mode | null {
    return filter.conditions.find((c) => c.key === key)?.mode ?? null
  }
  function valueOf(key: string): string {
    return filter.conditions.find((c) => c.key === key)?.value ?? ''
  }
  function setMode(key: string, mode: Mode | null) {
    setFilter((prev) => {
      const rest = prev.conditions.filter((c) => c.key !== key)
      const current = prev.conditions.find((c) => c.key === key)
      return { ...prev, conditions: mode ? [...rest, { key, mode, value: current?.value ?? null }] : rest }
    })
  }
  function setValue(key: string, value: string) {
    setFilter((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) => (c.key === key ? { ...c, value: value || null } : c)),
    }))
  }
  function toggleSearch(id: string) {
    setFilter((prev) => ({
      ...prev,
      searchIds: prev.searchIds.includes(id) ? prev.searchIds.filter((s) => s !== id) : [...prev.searchIds, id],
    }))
  }

  async function handleDelete() {
    if (!selectedId) return
    const ok = await confirm({
      message: t('cohorts.deleteConfirm', { name }),
      danger: true,
      confirmLabel: t('common.delete'),
    })
    if (ok) deleteMutation.mutate(selectedId)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      notify('error', t('cohorts.nameRequired'))
      return
    }
    if (!scopeAll && filter.searchIds.length === 0) {
      notify('error', t('cohorts.scopeRequired'))
      return
    }
    saveMutation.mutate()
  }

  const conditions = conditionsQuery.data ?? []
  const searches = (searchesQuery.data ?? []).filter((s) => s.status === 'done' && s.newCount + s.knownCount > 0)
  const share = preview && preview.total ? preview.count / preview.total : 0

  if (conditionsQuery.isLoading) return <Loading />
  if ((searchesQuery.data ?? []).length === 0 && !searchesQuery.isLoading) {
    return <EmptyState icon={<Users size={28} />} title={t('cohorts.emptyTitle')} description={t('cohorts.emptyHint')} />
  }

  return (
    <>
      <div className="cohort-layout">
        {/* Linke Spalte: Umfang und Merkmale */}
        <div className="cohort-builder">
          <section className="cohort-block" data-tour="cohort-scope">
            <div className="cohort-block-head">{t('cohorts.scope')}</div>
            <div className="segmented">
              <button type="button" className={scopeAll ? 'active' : ''} onClick={() => setScopeAll(true)}>
                {t('cohorts.scopeAll')}
              </button>
              <button type="button" className={!scopeAll ? 'active' : ''} onClick={() => setScopeAll(false)}>
                {t('cohorts.scopeSearches')}
              </button>
            </div>
            {!scopeAll && (
              <div className="cohort-searches">
                {searches.map((s) => (
                  <label key={s.id} className="checkbox-row">
                    <input type="checkbox" checked={filter.searchIds.includes(s.id)} onChange={() => toggleSearch(s.id)} />
                    <span>
                      {s.term} · {s.location}
                    </span>
                    <span className="cohort-muted font-mono">{s.newCount + s.knownCount}</span>
                  </label>
                ))}
              </div>
            )}
          </section>

          {GROUPS.map((group) => (
            <section className="cohort-block" key={group} data-tour={`cohort-group-${group}`}>
              <div className="cohort-block-head">{t(`cohorts.group.${group}`)}</div>
              <ul className="cohort-conditions">
                {conditions
                  .filter((c) => c.group === group)
                  .map((c) => {
                    const mode = modeOf(c.key)
                    const stat = preview?.stats[c.key]
                    const options =
                      c.param === 'score'
                        ? SCORE_OPTIONS
                        : c.param === 'size'
                          ? SIZE_OPTIONS
                          : c.param
                            ? preview?.options[c.param] ?? []
                            : []
                    return (
                      <li key={c.key} className={`cohort-condition ${mode ? `is-${mode}` : ''}`}>
                        <div className="cohort-condition-text">
                          <span className="cohort-condition-label">{t(`cohorts.cond.${c.key}`)}</span>
                          {stat && (
                            <span className="cohort-muted font-mono">
                              {t('cohorts.stat', { yes: stat.yes, no: stat.no, unknown: stat.unknown })}
                            </span>
                          )}
                          {c.param && (
                            <Select
                              className="cohort-value"
                              value={valueOf(c.key)}
                              onChange={(v) => {
                                if (!mode) setMode(c.key, 'must')
                                setValue(c.key, v)
                              }}
                              aria-label={t(`cohorts.cond.${c.key}`)}
                              options={[
                                // Ohne Wahl gilt bei Passung und Größe ein Standardwert, das steht auch so da
                                {
                                  value: '',
                                  label:
                                    c.param === 'score'
                                      ? t('cohorts.scoreDefault')
                                      : c.param === 'size'
                                        ? t('cohorts.sizeDefault')
                                        : t('cohorts.anyValue'),
                                },
                                ...options.map((o) => ({
                                  value: o.value,
                                  label:
                                    c.param === 'score'
                                      ? t('cohorts.scoreAtLeast', { value: o.value })
                                      : c.param === 'size'
                                        ? t('cohorts.sizeAtLeast', { value: o.value })
                                        : `${o.value} (${o.count})`,
                                })),
                              ]}
                            />
                          )}
                        </div>
                        {/* Dreistufiger Schalter: egal, muss, darf nicht */}
                        <div className="cohort-switch" role="radiogroup" aria-label={t(`cohorts.cond.${c.key}`)}>
                          {([null, 'must', 'mustNot'] as const).map((m) => (
                            <button
                              key={m ?? 'any'}
                              type="button"
                              role="radio"
                              aria-checked={mode === m}
                              className={mode === m ? 'active' : ''}
                              onClick={() => setMode(c.key, m)}
                            >
                              {t(`cohorts.mode.${m ?? 'any'}`)}
                            </button>
                          ))}
                        </div>
                      </li>
                    )
                  })}
              </ul>
            </section>
          ))}
          <p className="field-hint">{t('cohorts.unknownHint')}</p>
        </div>

        {/* Rechte Spalte: Live-Zählung, Speichern, gespeicherte Zielgruppen */}
        <aside className="cohort-side">
          <div className="cohort-count" aria-live="polite" data-tour="cohort-count">
            <div className="cohort-count-number font-mono">{preview ? preview.count : '·'}</div>
            <div className="cohort-count-label">
              {scopeMissing
                ? t('cohorts.scopeRequired')
                : preview
                  ? t('cohorts.countOf', { total: preview.total })
                  : previewQuery.isError
                    ? t('discovery.loadError')
                    : ''}
              {previewQuery.isFetching && <span className="spinner cohort-spinner" />}
            </div>
            <div className="cohort-count-bar">
              <span style={{ width: `${share * 100}%` }} />
            </div>
          </div>

          {/* KI-Bewertung der aktuellen Auswahl */}
          <div className="cohort-ai" data-tour="cohort-ai">
            <div className="cohort-block-head">
              {productName ? t('cohorts.aiTitleFor', { product: productName }) : t('cohorts.aiTitle')}
            </div>
            {job?.status === 'running' ? (
              <div className="cohort-ai-progress" aria-live="polite" data-tour="cohort-score-progress">
                <div className="discovery-progress">
                  <span className="spinner" style={{ width: 12, height: 12 }} />
                  {t('cohorts.scoreProgress', { done: job.done + job.failed, total: job.total })}
                </div>
                <div className="cohort-count-bar">
                  <span style={{ width: `${job.total ? ((job.done + job.failed) / job.total) * 100 : 0}%` }} />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => cancelMutation.mutate(job.id)}
                  disabled={cancelMutation.isPending}
                >
                  <X size={14} />
                  {t('cohorts.scoreCancel')}
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  data-tour="cohort-score"
                  onClick={() =>
                    !productId
                      ? notify('error', t('products.required'))
                      : scopeMissing
                        ? notify('error', t('cohorts.scopeRequired'))
                        : scoreMutation.mutate()
                  }
                  disabled={scoreMutation.isPending}
                >
                  {scoreMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Sparkles size={14} />}
                  {t('cohorts.score')}
                </button>
                <label className="checkbox-row cohort-muted">
                  <input type="checkbox" checked={rescore} onChange={(e) => setRescore(e.target.checked)} />
                  <span>{t('cohorts.rescore')}</span>
                </label>
                {job && (
                  <p className={`cohort-muted ${job.status === 'error' ? 'cohort-ai-error' : ''}`}>
                    {job.status === 'error'
                      ? `${t('cohorts.scoreLastError')}: ${job.error ?? ''}`
                      : t(`cohorts.scoreLast.${job.status}`, { done: job.done, failed: job.failed })}
                  </p>
                )}
                <p className="cohort-muted">
                  {t('cohorts.aiHint')} <Link to="/settings#ki-bewertung">{t('cohorts.aiSettings')}</Link>
                </p>
              </>
            )}
          </div>

          {/* Firmen dieser Auswahl als Interessenten des Produkts übernehmen */}
          <div className="cohort-ai cohort-leads" data-tour="cohort-leads">
            <div className="cohort-block-head">
              {productName ? t('prospects.addTitleFor', { product: productName }) : t('prospects.addTitle')}
            </div>
            <div className="cohort-leads-row">
              <Select
                className="cohort-leads-score"
                value={leadMinScore}
                onChange={setLeadMinScore}
                aria-label={t('prospects.minScore')}
                options={[
                  { value: '', label: t('prospects.anyScore') },
                  ...['5', '6', '7', '8'].map((v) => ({ value: v, label: t('prospects.scoreFrom', { value: v }) })),
                ]}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                data-tour="cohort-leads-add"
                onClick={() =>
                  !productId
                    ? notify('error', t('products.required'))
                    : scopeMissing
                      ? notify('error', t('cohorts.scopeRequired'))
                      : addProspectsMutation.mutate()
                }
                disabled={addProspectsMutation.isPending}
              >
                {addProspectsMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <UserPlus size={14} />}
                {t('prospects.add')}
              </button>
            </div>
            <p className="cohort-muted">{t('prospects.addHint')}</p>
          </div>

          <form className="cohort-save" onSubmit={handleSave} data-tour="cohort-save-form">
            {/* Gewählte Merkmale stehen hier statt unter der Zahl, damit die Knöpfe darüber beim Anklicken nicht verrutschen */}
            {filter.conditions.length > 0 && (
              <ul className="cohort-summary">
                {filter.conditions.map((c) => (
                  <li key={c.key}>
                    <span className="cohort-summary-mode">{c.mode === 'must' ? '+' : '−'}</span>
                    {t(`cohorts.cond.${c.key}`)}
                    {/* Zahlenwerte lesbar ausschreiben, Textwerte wie Rechtsform direkt */}
                    {c.value
                      ? `: ${
                          c.key === 'AI_SCORE_MIN'
                            ? t('cohorts.scoreAtLeast', { value: c.value })
                            : c.key === 'SIZE_MIN'
                              ? t('cohorts.sizeAtLeast', { value: c.value })
                              : c.value
                        }`
                      : ''}
                  </li>
                ))}
              </ul>
            )}
            <label className="field-label" htmlFor="cohort-name">
              {t('cohorts.name')}
            </label>
            <input
              id="cohort-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('cohorts.namePlaceholder')}
            />
            <div className="cohort-save-actions">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saveMutation.isPending} data-tour="cohort-save">
                <Save size={14} />
                {selectedId ? t('cohorts.update') : t('cohorts.save')}
              </button>
              {selectedId && (
                <button type="button" className="btn btn-ghost btn-danger btn-sm" onClick={handleDelete}>
                  <Trash2 size={14} />
                  {t('common.delete')}
                </button>
              )}
            </div>
          </form>

          <div className="cohort-saved">
            <div className="cohort-block-head">{t('cohorts.savedTitle')}</div>
            {cohortsQuery.isLoading ? (
              <Loading />
            ) : (cohortsQuery.data ?? []).length === 0 ? (
              <p className="cohort-muted">{t('cohorts.noneSaved')}</p>
            ) : (
              <ul>
                {(cohortsQuery.data ?? []).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`cohort-saved-item ${selectedId === c.id ? 'active' : ''}`}
                      onClick={() => loadCohort(c)}
                    >
                      <span>
                        {c.name}
                        {!c.productId && <span className="cohort-noproduct">{t('cohorts.noProduct')}</span>}
                      </span>
                      <span className="font-mono cohort-muted">{c.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Passende Firmen */}
      <section className="cohort-results" data-tour="cohort-results">
        <div className="cohort-block-head">
          {t('cohorts.results')}
          {preview && preview.count > preview.items.length && (
            <span className="cohort-muted"> · {t('cohorts.showingFirst', { count: preview.items.length })}</span>
          )}
        </div>
        {previewQuery.isError ? (
          <p className="discovery-note discovery-note-error">
            {previewQuery.error instanceof ApiError ? previewQuery.error.message : t('discovery.loadError')}
          </p>
        ) : scopeMissing ? (
          <p className="cohort-muted cohort-none">{t('cohorts.scopeRequired')}</p>
        ) : !preview ? (
          <Loading />
        ) : preview.count === 0 ? (
          <p className="cohort-muted cohort-none">{t('cohorts.noMatches')}</p>
        ) : (
          <CompanyTable
            companies={preview.items}
            showRank
            showRating
            showScore={preview.items.some((c) => c.score)}
            onOpen={setDetailId}
          />
        )}
      </section>

      <CompanyDetailModal
        productId={productId}
        companyId={detailId}
        onClose={() => {
          setDetailId(null)
          queryClient.invalidateQueries({ queryKey: ['cohortPreview'] })
        }}
      />
    </>
  )
}
