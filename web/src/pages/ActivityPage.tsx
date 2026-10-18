// Aktivitätsprotokoll: wer wann was getan hat (Sie, MixMarket selbst, KI-Agenten).
// Einträge nach Tagen gruppiert, mit Filtern, Suche und aufklappbaren Einzelheiten.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery } from '@tanstack/react-query'
import { AlertTriangle, Bot, ChevronDown, Cog, History, Search, UserRound, XCircle } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { EmptyState, Loading, PageBody, PageHeader } from '../components/Page'
import { Select } from '../components/Select'
import './activity.css'

const AREAS = [
  'auth',
  'contacts',
  'lists',
  'templates',
  'campaigns',
  'automations',
  'research',
  'products',
  'prospects',
  'suppression',
  'settings',
  'mailbox',
  'ai',
  'outbox',
  'inbox',
  'control',
] as const

interface Change {
  field: string
  from: unknown
  to: unknown
}

interface Activity {
  id: string
  createdAt: string
  actorType: 'user' | 'system' | 'agent'
  actorName: string | null
  area: string
  action: string
  level: 'info' | 'warning' | 'error'
  entityType: string | null
  entityId: string | null
  label: string | null
  params: Record<string, unknown> | null
  details: (Record<string, unknown> & { changes?: Change[] }) | null
}

interface ActivityPage {
  items: Activity[]
  nextCursor: string | null
}

export function ActivityPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en-US' : 'de-DE'
  const [area, setArea] = useState('')
  const [actor, setActor] = useState('')
  const [days, setDays] = useState('30')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  // Suchtext erst nach kurzer Tipppause anwenden
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Einträge seitenweise laden; die erste Seite aktualisiert sich alle 30 Sekunden
  const query = useInfiniteQuery({
    queryKey: ['activity', area, actor, days, debounced],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '50' })
      if (area) params.set('area', area)
      if (actor) params.set('actor', actor)
      if (days) params.set('days', days)
      if (debounced) params.set('q', debounced)
      if (pageParam) params.set('before', pageParam)
      return api.get<ActivityPage>(`/api/activity?${params.toString()}`)
    },
    initialPageParam: '',
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: 30_000,
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])

  // Nach Tagen gruppieren (lokale Zeit)
  const groups = useMemo(() => {
    const map = new Map<string, Activity[]>()
    for (const item of items) {
      const d = new Date(item.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return [...map.values()]
  }, [items])

  // Überschrift eines Tages: Heute, Gestern oder Datum
  function dayLabel(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
    if (same(d, today)) return t('activity.today')
    if (same(d, yesterday)) return t('activity.yesterday')
    return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Anzeigetext einer Aktion; Zahlen und Zeitpunkte aus params werden eingesetzt
  function message(a: Activity) {
    const params: Record<string, unknown> = { ...(a.params ?? {}) }
    if (typeof params.at === 'string') {
      params.at = new Date(params.at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
    }
    if (typeof params.estimatedCost === 'number') {
      params.estimatedCost = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(params.estimatedCost)
    }
    if (typeof params.reason === 'string') params.reason = t(`activity.reason.${params.reason}`, { defaultValue: params.reason })
    if (typeof params.category === 'string') params.category = t(`inbox.category.${params.category}`, { defaultValue: params.category })
    // Ein und aus, Erfolg und Fehlschlag als Wort statt als Wahrheitswert
    if (typeof params.active === 'boolean') params.state = t(params.active ? 'activity.state.on' : 'activity.state.off')
    if (typeof params.ok === 'boolean') params.result = t(params.ok ? 'activity.result.ok' : 'activity.result.failed')
    if (typeof params.provider === 'string') {
      params.provider = t(`activity.provider.${params.provider}`, { defaultValue: params.provider })
    }
    return t(`activity.action.${a.action}`, { ...params, defaultValue: a.action })
  }

  // Wer: Name des Nutzers, "MixMarket" für das System oder der Name des Agenten
  function actorLabel(a: Activity) {
    if (a.actorType === 'system') return t('activity.actor.system')
    if (a.actorType === 'agent') return a.actorName ?? t('activity.actor.agent')
    return a.actorName ?? t('activity.actor.unknownUser')
  }

  // Symbol je Handelndem
  function actorIcon(type: Activity['actorType']) {
    if (type === 'agent') return <Bot size={14} />
    if (type === 'system') return <Cog size={14} />
    return <UserRound size={14} />
  }

  // Wert einer Änderung lesbar machen
  function formatValue(value: unknown, field?: string) {
    if (value === null || value === undefined || value === '') return <span className="activity-empty">{t('activity.emptyValue')}</span>
    // Verschlüsselungsart so zeigen, wie sie in den Einstellungen heißt
    if (field?.endsWith('Security') && (value === 'tls' || value === 'starttls')) {
      return value === 'tls' ? t('mailbox.securityTls') : t('mailbox.securityStarttls')
    }
    if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no')
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
    }
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  // Einzelheiten eines Eintrags: geänderte Felder und weitere Angaben
  function details(a: Activity) {
    const d = a.details ?? {}
    const changes = Array.isArray(d.changes) ? d.changes : []
    const rest = Object.entries(d).filter(([k]) => k !== 'changes')
    return (
      <div className="activity-details">
        {changes.length > 0 && (
          <table className="activity-changes">
            <thead>
              <tr>
                <th>{t('activity.field')}</th>
                <th>{t('activity.before')}</th>
                <th>{t('activity.after')}</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.field}>
                  <td className="activity-field">{t(`activity.fields.${c.field}`, { defaultValue: c.field })}</td>
                  <td>{formatValue(c.from, c.field)}</td>
                  <td>{formatValue(c.to, c.field)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rest.map(([key, value]) => (
          <div key={key} className="activity-detail-row">
            <span className="activity-field">{t(`activity.detail.${key}`, { defaultValue: key })}</span>
            {typeof value === 'string' && value.length > 80 ? (
              <pre className="activity-pre">{value}</pre>
            ) : (
              <span>
                {key === 'result' && typeof value === 'string'
                  ? t(`mailbox.result.${value}`, { defaultValue: value })
                  : key === 'reason' && typeof value === 'string'
                    ? t(`activity.reasonText.${value}`, { defaultValue: value })
                    : formatValue(value)}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  const areaOptions = [
    { value: '', label: t('activity.allAreas') },
    ...AREAS.map((a) => ({ value: a, label: t(`activity.area.${a}`) })),
  ]
  const actorOptions = [
    { value: '', label: t('activity.allActors') },
    { value: 'user', label: t('activity.actorFilter.user') },
    { value: 'system', label: t('activity.actorFilter.system') },
    { value: 'agent', label: t('activity.actorFilter.agent') },
  ]
  const dayOptions = [
    { value: '1', label: t('activity.range.1') },
    { value: '7', label: t('activity.range.7') },
    { value: '30', label: t('activity.range.30') },
    { value: '365', label: t('activity.range.365') },
    { value: '', label: t('activity.range.all') },
  ]
  const filtered = Boolean(area || actor || debounced || days !== '30')

  return (
    <>
      <PageHeader help={{ chapter: 'activity' }} eyebrow="MixMarket" title={t('activity.title')} subtitle={t('activity.subtitle')} />
      <PageBody>
        <div className="toolbar activity-toolbar" data-tour="activity-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              className="input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('activity.searchPlaceholder')}
              aria-label={t('activity.searchPlaceholder')}
            />
          </div>
          <Select className="activity-filter" value={area} options={areaOptions} onChange={setArea} />
          <Select className="activity-filter" value={actor} options={actorOptions} onChange={setActor} />
          <Select className="activity-filter" value={days} options={dayOptions} onChange={setDays} />
        </div>

        {query.isLoading ? (
          <Loading />
        ) : query.isError ? (
          <div className="activity-error">
            <XCircle size={16} />
            {query.error instanceof ApiError ? query.error.message : t('activity.loadError')}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<History size={22} />}
            title={filtered ? t('activity.emptyFiltered') : t('activity.empty')}
            description={filtered ? t('activity.emptyFilteredHint') : t('activity.emptyHint')}
          />
        ) : (
          <div className="activity-list" data-tour="activity-list">
            {groups.map((group) => (
              <section key={group[0]!.id} className="activity-day">
                <h2 className="activity-day-head">{dayLabel(group[0]!.createdAt)}</h2>
                {group.map((a) => {
                  const hasDetails = Boolean(a.details && Object.keys(a.details).length)
                  const isOpen = open === a.id
                  return (
                    <div key={a.id} className={`activity-row level-${a.level}${isOpen ? ' is-open' : ''}`}>
                      <button
                        type="button"
                        className="activity-main"
                        onClick={() => hasDetails && setOpen(isOpen ? null : a.id)}
                        aria-expanded={hasDetails ? isOpen : undefined}
                        data-static={!hasDetails || undefined}
                      >
                        <span className="activity-time font-mono">
                          {new Date(a.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`activity-actor actor-${a.actorType}`}>
                          {actorIcon(a.actorType)}
                          <span>{actorLabel(a)}</span>
                        </span>
                        <span className="activity-text">
                          {a.level !== 'info' && <AlertTriangle size={14} className="activity-level-icon" />}
                          <span className="activity-message">{message(a)}</span>
                          {a.label && <span className="activity-label">{a.label}</span>}
                        </span>
                        <span className="activity-area">{t(`activity.area.${a.area}`, { defaultValue: a.area })}</span>
                        <span className="activity-chevron" aria-hidden="true">
                          {hasDetails && <ChevronDown size={16} />}
                        </span>
                      </button>
                      {isOpen && details(a)}
                    </div>
                  )
                })}
              </section>
            ))}
            {query.hasNextPage && (
              <div className="activity-more">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => !query.isFetchingNextPage && query.fetchNextPage()}
                >
                  {query.isFetchingNextPage && <span className="spinner" style={{ width: 14, height: 14 }} />}
                  {t('activity.loadMore')}
                </button>
              </div>
            )}
          </div>
        )}
      </PageBody>
    </>
  )
}
