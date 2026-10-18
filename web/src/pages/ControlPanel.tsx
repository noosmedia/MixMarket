// Steuerung auf der Übersicht: "Wartet auf Sie" (Aufgaben und Hinweise), Autopilot je Bereich mit
// Not-Aus und Grenzen sowie die Auslastung der KI-Abos und des Versands.
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, OctagonX, Play, RefreshCw } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { Loading } from '../components/Page'
import { Select } from '../components/Select'
import { useUi } from '../stores/ui'
import { usePro, useProFeature, type ProFeature } from '../pro/host'
import { ProLockButton } from '../pro/ProTeaser'
import './control.css'

interface Control {
  autopilotResearch: boolean
  autopilotWriting: boolean
  autopilotMinScore: number
  autopilotSending: boolean
  autopilotReplies: boolean
  bounceStopPercent: number
  aiPausePercent: number
  sendingStopped: boolean
  sendingStoppedAt: string | null
  sendingStopReason: 'manual' | 'bounces' | null
}

interface Notice {
  id: string
  createdAt: string
  kind: 'unsubscribe' | 'bounce' | 'stop' | 'aiPause'
  label: string | null
  params: Record<string, unknown> | null
}

interface ControlData {
  control: Control
  aiPause: { paused: boolean; until: string | null; utilization: number | null }
  tasks: {
    review: number
    failedOutbox: number
    openReplies: number
    drafts: number
    bounces: number
    pausedCampaigns: number
    pollError: string | null
    imapReady: boolean
    testMode: boolean
    aiReady: boolean
    companyReady: boolean
    hasProduct: boolean
    hasSearch: boolean
  }
  notices: Notice[]
}

interface QuotaWindow {
  utilization: number
  resetsAt: string | null
}
interface Quota {
  provider: 'claude' | 'codex'
  fiveHour: QuotaWindow | null
  sevenDay: QuotaWindow | null
  observedAt: string | null
  error: string | null
}
type CallCounts = Record<'scoring' | 'outbox' | 'inbox', { ok: number; failed: number }>
interface Usage {
  provider: 'claude' | 'codex' | null
  quotas: { claude: Quota; codex: Quota }
  aiPause: { paused: boolean; until: string | null; utilization: number | null }
  aiPausePercent: number
  calls: { day: CallCounts; week: CallCounts }
  sends: {
    today: { outbox: number; campaigns: number; automations: number; replies: number; total: number }
    outboxTestToday: number
    outboxDailyLimit: number
  }
  bounces: { hard24: number; percent24: number; stopPercent: number }
}

function useFormat() {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en-GB' : 'de-DE'
  return (value: string | null | undefined) =>
    value
      ? new Date(value).toLocaleString(locale, {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : ''
}

// Alles, was nach einer Änderung neu geladen werden muss
function useRefresh() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['control'] })
    queryClient.invalidateQueries({ queryKey: ['controlState'] })
    queryClient.invalidateQueries({ queryKey: ['controlUsage'] })
  }
}

export function useControl() {
  return useQuery({ queryKey: ['control'], queryFn: () => api.get<ControlData>('/api/control'), refetchInterval: 30000 })
}

// ---------------------------------------------------------------------------
// Wartet auf Sie
// ---------------------------------------------------------------------------

export function WaitingList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { notify } = useUi()
  const refresh = useRefresh()
  const format = useFormat()
  const { data, isLoading, isError } = useControl()
  // Geführte Touren (MixMarket Pro): gibt es eine Tour zum Schritt, startet der Klick sie
  const tourFns = usePro((s) => (s.active ? s.functions : null))
  const hasTour = (key: string) => !!(tourFns?.['tours.has'] as ((k: string) => boolean) | undefined)?.(key)
  const startTour = (key: string) => (tourFns?.['tours.start'] as ((k: string) => void) | undefined)?.(key)

  const dismiss = useMutation({
    mutationFn: (id: string) => api.post<{ ok: boolean }>(`/api/control/notices/${id}/dismiss`),
    onSuccess: () => refresh(),
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('common.error')),
  })
  const dismissAll = useMutation({
    mutationFn: () => api.post<{ dismissed: number }>('/api/control/notices/dismiss-all'),
    onSuccess: () => refresh(),
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('common.error')),
  })

  if (isLoading) return <Loading />
  if (isError || !data) return <p className="ctl-error">{t('control.loadError')}</p>

  const tk = data.tasks
  const tasks = [
    { key: 'review', count: tk.review, to: '/outbox' },
    { key: 'openReplies', count: tk.openReplies, to: '/conversations' },
    { key: 'drafts', count: tk.drafts, to: '/conversations' },
    { key: 'failedOutbox', count: tk.failedOutbox, to: '/outbox' },
    { key: 'bounces', count: tk.bounces, to: '/conversations' },
    { key: 'pausedCampaigns', count: tk.pausedCampaigns, to: '/campaigns' },
  ].filter((x) => x.count > 0)

  const noticeText = (n: Notice) => {
    const p = n.params ?? {}
    if (n.kind === 'unsubscribe')
      return t(p.via === 'reply' ? 'control.notice.unsubscribeReply' : 'control.notice.unsubscribeLink', { email: n.label })
    if (n.kind === 'bounce') return t('control.notice.bounce', { email: n.label })
    if (n.kind === 'stop') return p.reason === 'bounces' ? t('control.notice.stopBounces', p) : t('control.notice.stopManual')
    const utilization = Math.round(Number(p.utilization ?? 0))
    return p.until
      ? t('control.notice.aiPauseUntil', { until: format(String(p.until)), utilization })
      : t('control.notice.aiPause', { utilization })
  }

  // Erste Schritte nach der Ersteinrichtung: verschwinden, sobald alles erledigt ist.
  // Gibt es eine geführte Tour zum Schritt, startet der Klick die Tour statt nur die Seite zu öffnen.
  const setup = [
    { key: 'company', done: tk.companyReady, to: '/settings#unternehmen' },
    { key: 'ai', done: tk.aiReady, to: '/settings#ki-bewertung' },
    { key: 'mailbox', done: !tk.testMode, to: '/settings#postfach' },
    { key: 'product', done: tk.hasProduct, to: '/scraper' },
    { key: 'search', done: tk.hasSearch, to: '/scraper' },
  ]
  const setupOpen = setup.some((x) => !x.done)

  const empty = !tasks.length && !data.notices.length && !tk.pollError && !setupOpen
  return (
    <div className="ctl-waiting">
      {setupOpen && (
        <section className="ctl-setup" aria-label={t('control.setup.title')}>
          <div className="ctl-setup-head">
            <span className="ctl-setup-title">{t('control.setup.title')}</span>
            <span className="ctl-setup-progress font-mono">
              {t('control.setup.progress', { done: setup.filter((x) => x.done).length, total: setup.length })}
            </span>
          </div>
          <div className="ctl-list">
            {setup.map((step) => (
              <button
                key={step.key}
                type="button"
                className={`ctl-row is-task is-setup${step.done ? ' is-done' : ''}`}
                onClick={() => (!step.done && hasTour(step.key) ? startTour(step.key) : navigate(step.to))}
              >
                <span className="ctl-setup-mark">{step.done && <Check size={14} />}</span>
                <span className="ctl-row-text">
                  {t(`control.setup.${step.key}`)}
                  <span className="ctl-setup-hint">{t(`control.setup.${step.key}Hint`)}</span>
                </span>
                {!step.done && hasTour(step.key) && <span className="ctl-setup-tour">{t('tours.common.guided')}</span>}
                <ArrowRight size={15} className="ctl-row-arrow" />
              </button>
            ))}
          </div>
        </section>
      )}
      {empty && <p className="ctl-all-done">{t('control.allDone')}</p>}
      {(tasks.length > 0 || tk.pollError) && (
        <div className="ctl-list">
          {tasks.map((task) => (
            <button key={task.key} type="button" className="ctl-row is-task" onClick={() => navigate(task.to)}>
              <span className="ctl-count font-mono">{task.count}</span>
              <span className="ctl-row-text">{t(`control.task.${task.key}`, { count: task.count })}</span>
              <ArrowRight size={15} className="ctl-row-arrow" />
            </button>
          ))}
          {tk.pollError && (
            <button type="button" className="ctl-row is-task is-danger" onClick={() => navigate('/conversations')}>
              <span className="ctl-count font-mono">!</span>
              <span className="ctl-row-text">{t('control.task.pollError', { error: tk.pollError })}</span>
              <ArrowRight size={15} className="ctl-row-arrow" />
            </button>
          )}
        </div>
      )}
      {data.notices.length > 0 && (
        <div className="ctl-list ctl-notices">
          {data.notices.map((n) => (
            <div key={n.id} className={`ctl-row is-notice is-${n.kind}`}>
              <span className="ctl-dot" aria-hidden="true" />
              <span className="ctl-row-text">{noticeText(n)}</span>
              <span className="ctl-row-at font-mono">{format(n.createdAt)}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => dismiss.mutate(n.id)}
                aria-label={t('control.dismiss')}
              >
                <Check size={14} />
                <span className="btn-label">{t('control.dismiss')}</span>
              </button>
            </div>
          ))}
          {data.notices.length > 1 && (
            <div className="ctl-notices-foot">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => dismissAll.mutate()}>
                {t('control.dismissAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Steuerung: Autopilot, Not-Aus, Grenzen
// ---------------------------------------------------------------------------

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`ctl-switch${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="ctl-switch-track" aria-hidden="true">
        <span className="ctl-switch-thumb" />
      </span>
      <span className="ctl-switch-label">{checked ? t('control.on') : t('control.off')}</span>
    </button>
  )
}

export function SteeringPanel() {
  const { t } = useTranslation()
  const { notify, confirm } = useUi()
  const refresh = useRefresh()
  const format = useFormat()
  const { data } = useControl()
  // Autopilot für Recherche und Schreiben sowie die KI in Gespräche gehören zu MixMarket Pro
  const proAutopilot = useProFeature('autopilot')
  const proInboxAi = useProFeature('inboxAi')

  const save = useMutation({
    mutationFn: (body: Partial<Control>) => api.put<Control>('/api/control', body),
    onSuccess: () => {
      refresh()
      notify('success', t('control.saved'))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('common.error')),
  })
  const stop = useMutation({
    mutationFn: () => api.post<Control>('/api/control/stop'),
    onSuccess: () => {
      refresh()
      notify('warning', t('control.stoppedToast'))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('common.error')),
  })
  const resume = useMutation({
    mutationFn: () => api.post<Control>('/api/control/resume'),
    onSuccess: () => {
      refresh()
      notify('success', t('control.resumedToast'))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('common.error')),
  })

  if (!data) return <Loading />
  const c = data.control

  async function askStop() {
    const ok = await confirm({
      message: t('control.stopConfirm'),
      confirmLabel: t('control.stop'),
      danger: true,
      notes: [t('control.stopNote')],
    })
    if (ok) stop.mutate()
  }
  async function askResume() {
    const ok = await confirm({
      message: t('control.resumeConfirm'),
      confirmLabel: t('control.resume'),
      notes: [t('control.resumeNote')],
    })
    if (ok) resume.mutate()
  }

  // locked: Pro-Funktion ohne aktives MixMarket Pro, statt des Schalters erscheint der Pro-Hinweis
  const areas: Array<{ key: 'research' | 'writing' | 'sending' | 'replies'; field: keyof Control; pro?: ProFeature; locked: boolean }> = [
    { key: 'research', field: 'autopilotResearch', pro: 'autopilot', locked: !proAutopilot },
    { key: 'writing', field: 'autopilotWriting', pro: 'autopilot', locked: !proAutopilot },
    { key: 'sending', field: 'autopilotSending', locked: false },
    { key: 'replies', field: 'autopilotReplies', pro: 'inboxAi', locked: !proInboxAi },
  ]

  return (
    <div className="ctl-steering">
      {/* Autopilot je Bereich */}
      <div className="ctl-autopilot" data-tour="ctl-autopilot">
        <div className="ctl-sub">{t('control.autopilot')}</div>
        {areas.map((a) => (
          <div key={a.key} className="ctl-area" data-tour={`ctl-area-${a.key}`}>
            <div className="ctl-area-text">
              <div className="ctl-area-name">{t(`control.area.${a.key}`)}</div>
              <div className="ctl-area-hint">{t(`control.area.${a.key}Hint`)}</div>
              {a.key === 'writing' && !a.locked && (
                <div className="ctl-area-extra">
                  <span className="field-label">{t('control.minScore')}</span>
                  <Select
                    className="ctl-select"
                    value={String(c.autopilotMinScore)}
                    onChange={(v) => save.mutate({ autopilotMinScore: Number(v) })}
                    options={[5, 6, 7, 8, 9, 10].map((n) => ({
                      value: String(n),
                      label: t('control.minScoreValue', { score: n }),
                    }))}
                    aria-label={t('control.minScore')}
                  />
                </div>
              )}
            </div>
            {a.locked && a.pro ? (
              <ProLockButton feature={a.pro} className="btn btn-ghost btn-sm ctl-area-lock" />
            ) : (
              <Switch
                checked={Boolean(c[a.field])}
                onChange={(v) => save.mutate({ [a.field]: v })}
                label={t(`control.area.${a.key}`)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Not-Aus und Grenzen */}
      <div className="ctl-side">
        <div className={`ctl-stop${c.sendingStopped ? ' is-stopped' : ''}`} data-tour="ctl-stop">
          <div className="ctl-sub">{t('control.stopTitle')}</div>
          <div className="ctl-stop-state">
            <span className="ctl-stop-light" aria-hidden="true" />
            {c.sendingStopped ? t('control.stopped') : t('control.running')}
          </div>
          {c.sendingStopped ? (
            <>
              <p className="ctl-stop-hint">
                {c.sendingStopReason ? t(`control.stoppedReason.${c.sendingStopReason}`) : ''}
                {c.sendingStoppedAt ? ` · ${t('control.stoppedSince', { at: format(c.sendingStoppedAt) })}` : ''}
              </p>
              <button type="button" className="btn btn-primary" onClick={askResume}>
                <Play size={15} />
                {t('control.resume')}
              </button>
            </>
          ) : (
            <>
              <p className="ctl-stop-hint">{t('control.runningHint')}</p>
              <button type="button" className="btn btn-danger" onClick={askStop}>
                <OctagonX size={16} />
                {t('control.stop')}
              </button>
            </>
          )}
        </div>

        <div className="ctl-thresholds" data-tour="ctl-thresholds">
          <div className="ctl-sub">{t('control.thresholds')}</div>
          <div className="field">
            <label className="field-label" htmlFor="ctl-bounce">
              {t('control.bounceStop')}
            </label>
            <Select
              id="ctl-bounce"
              value={String(c.bounceStopPercent)}
              onChange={(v) => save.mutate({ bounceStopPercent: Number(v) })}
              options={[2, 3, 5, 8, 10, 15].map((n) => ({ value: String(n), label: `${n} %` }))}
            />
            <div className="field-hint">{t('control.bounceStopHint')}</div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="ctl-ai">
              {t('control.aiPause')}
            </label>
            <Select
              id="ctl-ai"
              value={String(c.aiPausePercent)}
              onChange={(v) => save.mutate({ aiPausePercent: Number(v) })}
              options={[50, 60, 70, 80, 90, 95, 100].map((n) => ({
                value: String(n),
                label: n === 100 ? t('control.never') : `${n} %`,
              }))}
            />
            <div className="field-hint">{t('control.aiPauseHint')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Auslastung
// ---------------------------------------------------------------------------

function Meter({
  label,
  window,
  limit,
  format,
}: {
  label: string
  window: QuotaWindow | null
  limit: number
  format: (v: string) => string
}) {
  const { t } = useTranslation()
  const value = window ? Math.round(window.utilization) : null
  return (
    <div className="ctl-meter">
      <div className="ctl-meter-head">
        <span>{label}</span>
        <span className="font-mono">{value === null ? '·' : `${value} %`}</span>
      </div>
      <div className="ctl-meter-bar" aria-hidden="true">
        <span className={value !== null && value >= limit ? 'is-over' : ''} style={{ width: `${Math.min(100, value ?? 0)}%` }} />
        {limit < 100 && <i style={{ left: `${limit}%` }} />}
      </div>
      {window?.resetsAt && <div className="ctl-meter-reset">{t('control.resetsAt', { at: format(window.resetsAt) })}</div>}
    </div>
  )
}

export function UsagePanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['controlUsage'],
    queryFn: () => api.get<Usage>('/api/control/usage'),
    refetchInterval: 120000,
  })

  async function refreshNow() {
    const fresh = await api.get<Usage>('/api/control/usage?refresh=1')
    queryClient.setQueryData(['controlUsage'], fresh)
  }

  if (isLoading || !data) return <Loading />

  const areas: Array<'scoring' | 'outbox' | 'inbox'> = ['scoring', 'outbox', 'inbox']
  return (
    <div className="ctl-usage">
      <div className="ctl-quotas">
        {(['claude', 'codex'] as const).map((key) => {
          const q = data.quotas[key]
          const active = data.provider === key
          return (
            <div key={key} className={`ctl-quota${active ? ' is-active' : ''}`}>
              <div className="ctl-quota-head">
                <span className="ctl-quota-name">{t(`control.provider.${key}`)}</span>
                {active && <span className="badge badge-accent">{t('control.active')}</span>}
              </div>
              {q.error ? (
                <p className="ctl-quota-error">{t('control.unavailable', { error: q.error })}</p>
              ) : (
                <>
                  <Meter
                    label={t('control.fiveHour')}
                    window={q.fiveHour}
                    limit={active ? data.aiPausePercent : 100}
                    format={format}
                  />
                  <Meter
                    label={t('control.sevenDay')}
                    window={q.sevenDay}
                    limit={active ? data.aiPausePercent : 100}
                    format={format}
                  />
                  {q.observedAt && <div className="ctl-meter-reset">{t('control.observedAt', { at: format(q.observedAt) })}</div>}
                </>
              )}
            </div>
          )
        })}
      </div>
      <p className="ctl-note">{t('control.quotaNote')}</p>

      <div className="ctl-figures">
        <div className="ctl-figure">
          <div className="ctl-sub">{t('control.calls')}</div>
          <table className="ctl-table">
            <thead>
              <tr>
                <th />
                <th>{t('control.callsDay')}</th>
                <th>{t('control.callsWeek')}</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a}>
                  <td>{t(`control.callArea.${a}`)}</td>
                  <td className="font-mono">
                    {data.calls.day[a].ok + data.calls.day[a].failed}
                    {data.calls.day[a].failed > 0 && (
                      <span className="ctl-failed"> {t('control.callsFailed', { count: data.calls.day[a].failed })}</span>
                    )}
                  </td>
                  <td className="font-mono">{data.calls.week[a].ok + data.calls.week[a].failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ctl-figure">
          <div className="ctl-sub">{t('control.sends')}</div>
          <dl className="ctl-dl">
            <div>
              <dt>{t('control.sendsOutbox')}</dt>
              <dd className="font-mono">
                {t('control.sendsOutboxValue', {
                  sent: data.sends.today.outbox + data.sends.outboxTestToday,
                  limit: data.sends.outboxDailyLimit,
                })}
                {data.sends.outboxTestToday > 0 && (
                  <span className="ctl-muted"> · {t('control.sendsTest', { count: data.sends.outboxTestToday })}</span>
                )}
              </dd>
            </div>
            <div>
              <dt>{t('control.sendsCampaigns')}</dt>
              <dd className="font-mono">{data.sends.today.campaigns}</dd>
            </div>
            <div>
              <dt>{t('control.sendsAutomations')}</dt>
              <dd className="font-mono">{data.sends.today.automations}</dd>
            </div>
            <div>
              <dt>{t('control.sendsReplies')}</dt>
              <dd className="font-mono">{data.sends.today.replies}</dd>
            </div>
            <div>
              <dt>{t('control.bounces24')}</dt>
              <dd
                className={`font-mono${data.bounces.percent24 >= data.bounces.stopPercent && data.bounces.hard24 > 0 ? ' ctl-failed' : ''}`}
              >
                {t('control.bouncesValue', {
                  count: data.bounces.hard24,
                  percent: data.bounces.percent24,
                  limit: data.bounces.stopPercent,
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="ctl-usage-foot">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refreshNow()}>
          {isFetching ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={14} />}
          {t('control.refresh')}
        </button>
      </div>
    </div>
  )
}
