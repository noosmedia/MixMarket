// Postausgang: persönliche Mails an einzelne Interessenten. Links die Liste je Ansicht
// (Zur Freigabe, Geplant, Gesendet, Beendet), rechts die gewählte Mail mit ihrem Ablauf.
// Auf schmalen Bildschirmen öffnet die Mail in einem Fenster. Von hier aus wird freigegeben,
// bearbeitet, neu geschrieben, abgelehnt oder der Ablauf beendet.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Eye,
  FlaskConical,
  MousePointerClick,
  OctagonX,
  Pencil,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { EmptyState, Loading, PageBody, PageHeader } from '../components/Page'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { flashRow, useJumpTarget, useUi } from '../stores/ui'
import { useProduct } from '../stores/product'
import { ProSlot } from '../pro/host'
import { ProLockButton } from '../pro/ProTeaser'
import './outbox.css'

type OutboxStatus = 'waiting' | 'generating' | 'review' | 'approved' | 'sent' | 'rejected' | 'failed' | 'cancelled'
type Tab = 'review' | 'planned' | 'sent' | 'stopped'
const TABS: Tab[] = ['review', 'planned', 'sent', 'stopped']
// Zustände je Reiter, wie auf dem Server
const TAB_STATUSES: Record<Tab, string[]> = {
  review: ['review', 'generating'],
  planned: ['approved', 'waiting'],
  sent: ['sent'],
  stopped: ['rejected', 'failed', 'cancelled'],
}

// Teile, die der Versand unter den Text setzt (Signatur, Anschrift, Abmeldehinweis)
interface MailAppendix {
  signature: string
  postalAddress: string
  unsubText: string
  unsubLink: string
}

interface OutboxMessage {
  id: string
  status: OutboxStatus
  step: number
  followUps: number
  toEmail: string
  subject: string
  body: string
  plannedAt: string
  sentAt: string | null
  testMode: boolean
  error: string | null
  stopReason: string | null
  editedByUser: boolean
  openedAt: string | null
  clickedAt: string | null
  createdAt: string
  updatedAt: string
  product: { id: string; name: string }
  company: { id: string; name: string; city: string | null }
  prospect: { id: string; status: string }
  contact: {
    id: string
    email: string
    name: string | null
    withoutConsent: boolean
  } | null
}

interface SendRules {
  dailyLimit: number
  days: number[]
  from: string
  to: string
  gapMinutes: number
}

interface OutboxState {
  rules: SendRules
  sentToday: number
  inWindow: boolean
  nextWindow: string | null
  testMode: boolean
  aiReady: boolean
}

interface OutboxList {
  items: OutboxMessage[]
  tabs: Record<Tab, number>
  state: OutboxState
}

interface Sequence {
  followUps: number
  intervals: number[]
  approval: boolean
  language: 'de' | 'en'
  instructions: string
}

interface Product {
  id: string
  name: string
}

// Zustände, in denen die Mail noch geändert, freigegeben oder abgelehnt werden kann
const EDITABLE: OutboxStatus[] = ['review', 'approved', 'failed']
// Zustände, die zum laufenden Ablauf gehören
const OPEN: OutboxStatus[] = ['waiting', 'generating', 'review', 'approved']

// Breite, ab der Liste und Mail nebeneinander stehen
const SPLIT_QUERY = '(min-width: 1024px)'

function useSplitView(): boolean {
  const [split, setSplit] = useState(() => typeof window !== 'undefined' && window.matchMedia(SPLIT_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(SPLIT_QUERY)
    const onChange = () => setSplit(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return split
}

// Abschnitt der Einstellungen öffnen und hinscrollen, sobald er gezeichnet ist
function openSettingsSection(navigate: (to: string) => void, id: string) {
  navigate('/settings')
  let tries = 0
  const tick = () => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else if (tries++ < 30) window.setTimeout(tick, 100)
  }
  window.setTimeout(tick, 50)
}

export function OutboxPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()
  const split = useSplitView()
  const locale = i18n.language === 'en' ? 'en-GB' : 'de-DE'

  const [tab, setTab] = useState<Tab>('review')
  const [productFilter, setProductFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sequenceOpen, setSequenceOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<Product[]>('/api/products'),
  })
  const products = productsQuery.data ?? []

  const listQuery = useQuery({
    queryKey: ['outbox', tab, productFilter],
    queryFn: () =>
      api.get<OutboxList>(`/api/outbox?tab=${tab}${productFilter ? `&productId=${encodeURIComponent(productFilter)}` : ''}`),
    // Solange die KI schreibt, öfter nachsehen; sonst genügt ein ruhiger Takt für den Versand
    refetchInterval: (query) => (query.state.data?.items.some((m) => m.status === 'generating') ? 4000 : 30000),
  })
  const items = listQuery.data?.items ?? []
  const state = listQuery.data?.state

  // Auf breiten Bildschirmen immer eine Mail zeigen: die gewählte, sonst die erste der Liste
  useEffect(() => {
    if (!split || listQuery.isFetching) return
    if (!items.length) {
      if (selectedId) setSelectedId(null)
      return
    }
    if (!selectedId || !items.some((m) => m.id === selectedId)) setSelectedId(items[0]!.id)
  }, [split, items, selectedId, listQuery.isFetching])

  // Sprung aus der Suche: Reiter der Mail wählen und sie öffnen
  useJumpTarget(['outbox'], (jump) => {
    void api
      .get<OutboxMessage>(`/api/outbox/${jump.id}`)
      .then((m) => {
        const target = TABS.find((key) => TAB_STATUSES[key].includes(m.status)) ?? 'review'
        setProductFilter('')
        setTab(target)
        setSelectedId(m.id)
        flashRow(m.id)
      })
      .catch(() => notify('error', t('search.notFound')))
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['outbox'] })
    queryClient.invalidateQueries({ queryKey: ['outboxMessage'] })
    queryClient.invalidateQueries({ queryKey: ['prospects'] })
  }

  function showError(err: unknown) {
    notify('error', err instanceof ApiError ? err.message : t('common.error'))
  }

  // Lesbarer Zeitpunkt, z. B. "Mo., 19.10., 08:00"
  const formatAt = (value: string) =>
    new Date(value).toLocaleString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  // Versandtage als "Mo bis Fr" oder "Mo, Mi, Fr"
  const daysLabel = (days: number[]) => {
    if (!days.length) return t('outbox.state.noDays')
    const consecutive = days.every((d, i) => i === 0 || d === days[i - 1]! + 1)
    if (consecutive && days.length >= 3) {
      return t('outbox.dayRange', {
        from: t(`outbox.day.${days[0]}`),
        to: t(`outbox.day.${days[days.length - 1]}`),
      })
    }
    return days.map((d) => t(`outbox.day.${d}`)).join(', ')
  }

  const reviewNoConsent = tab === 'review' ? items.filter((m) => m.status === 'review' && m.contact?.withoutConsent).length : 0
  const selected = items.find((m) => m.id === selectedId) ?? null
  const tabCounts = listQuery.data?.tabs
  const tabOptions = TABS.map((key) => ({
    value: key,
    label: `${t(`outbox.tab.${key}`)} (${tabCounts?.[key] ?? 0})`,
  }))
  const productOptions = [{ value: '', label: t('outbox.allProducts') }, ...products.map((p) => ({ value: p.id, label: p.name }))]

  return (
    <>
      <PageHeader
        help={{ chapter: 'outbox' }}
        eyebrow={t('outbox.title')}
        title={t('outbox.title')}
        subtitle={t('outbox.subtitle')}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setSequenceOpen(true)} data-tour="outbox-sequence">
              <SlidersHorizontal size={16} />
              {t('outbox.sequence')}
            </button>
            <button className="btn btn-secondary" onClick={() => setRulesOpen(true)} data-tour="outbox-rules">
              <Clock size={16} />
              {t('outbox.rules')}
            </button>
          </>
        }
      />

      <PageBody>
        {/* Hinweise: ohne Postfach nur Testversand, ohne KI keine Entwürfe */}
        {state?.testMode && (
          <div className="outbox-banner">
            <FlaskConical size={16} />
            <span>{t('outbox.testMode')}</span>
            <button type="button" className="outbox-banner-link" onClick={() => openSettingsSection(navigate, 'postfach')}>
              {t('outbox.testModeLink')}
            </button>
          </div>
        )}
        {state && !state.aiReady && (
          <div className="outbox-banner is-danger">
            <Sparkles size={16} />
            <span>{t('outbox.noAi')}</span>
            <button type="button" className="outbox-banner-link" onClick={() => openSettingsSection(navigate, 'ki-bewertung')}>
              {t('outbox.noAiLink')}
            </button>
          </div>
        )}

        {/* Lage des Versands: heute gesendet, Fenster, nächster Versand */}
        {state && (
          <div className="outbox-state" data-tour="outbox-state">
            <span className="outbox-state-item">
              <span className="outbox-meter" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.min(100, (state.sentToday / Math.max(1, state.rules.dailyLimit)) * 100)}%`,
                  }}
                />
              </span>
              {t('outbox.state.sentToday', {
                sent: state.sentToday,
                limit: state.rules.dailyLimit,
              })}
            </span>
            <span className="outbox-state-item">
              {t('outbox.state.window', {
                days: daysLabel(state.rules.days),
                from: state.rules.from,
                to: state.rules.to,
              })}
            </span>
            <span className={`outbox-state-item${state.inWindow ? ' is-open' : ''}`}>
              {state.sentToday >= state.rules.dailyLimit
                ? t('outbox.state.limitReached')
                : state.inWindow
                  ? t('outbox.state.open')
                  : state.nextWindow
                    ? t('outbox.state.next', { at: formatAt(state.nextWindow) })
                    : t('outbox.state.noDays')}
            </span>
          </div>
        )}

        {/* Ansicht, Produkt und Sammelfreigabe */}
        <div className="toolbar outbox-toolbar" data-tour="outbox-toolbar">
          <div className="segmented hide-mobile" role="tablist">
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? 'active' : ''}
                onClick={() => {
                  setTab(key)
                  setSelectedId(null)
                }}
              >
                {t(`outbox.tab.${key}`)}
                <span className="outbox-count font-mono">{tabCounts?.[key] ?? 0}</span>
              </button>
            ))}
          </div>
          <Select
            className="show-mobile outbox-tab-select"
            value={tab}
            onChange={(v) => {
              setTab(v as Tab)
              setSelectedId(null)
            }}
            options={tabOptions}
            aria-label={t('outbox.tabLabel')}
          />
          <Select
            className="outbox-product-select"
            value={productFilter}
            onChange={(v) => {
              setProductFilter(v)
              setSelectedId(null)
            }}
            options={productOptions}
            aria-label={t('outbox.productFilter')}
          />
          {/* "Alle freigeben" gehört zu MixMarket Pro */}
          {tab === 'review' && (
            <ProSlot
              name="outbox.approveAll"
              items={items}
              productFilter={productFilter}
              dailyLimit={state?.rules.dailyLimit ?? 20}
              refresh={refresh}
              fallback={
                <ProLockButton
                  feature="approveAll"
                  label={t('outbox.approveAll')}
                  icon={<CheckCheck size={16} />}
                  className="btn btn-secondary outbox-approve-all"
                />
              }
            />
          )}
        </div>

        {reviewNoConsent > 0 && <p className="outbox-consent">{t('outbox.consentWarn', { count: reviewNoConsent })}</p>}

        {listQuery.isLoading ? (
          <Loading />
        ) : listQuery.isError ? (
          <p className="outbox-error">{listQuery.error instanceof ApiError ? listQuery.error.message : t('outbox.loadError')}</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Send size={28} />}
            title={t(`outbox.empty.${tab}`)}
            description={t(`outbox.empty.${tab}Hint`)}
            action={
              tab === 'review' ? (
                <Link className="btn btn-secondary" to="/scraper">
                  {t('outbox.toProspects')}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className={`outbox-split${split ? ' is-split' : ''}`}>
            <div className="outbox-list" role="listbox" aria-label={t(`outbox.tab.${tab}`)} data-tour="outbox-list">
              {items.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  active={split && m.id === selectedId}
                  formatAt={formatAt}
                  nextWindow={state?.nextWindow ?? null}
                  onSelect={() => setSelectedId(m.id)}
                />
              ))}
            </div>
            {split && (
              <div className="outbox-reader-pane">
                {selected ? (
                  <MessageReader
                    key={selected.id}
                    summary={selected}
                    formatAt={formatAt}
                    nextWindow={state?.nextWindow ?? null}
                    onChanged={refresh}
                  />
                ) : (
                  <p className="outbox-select-hint">{t('outbox.select')}</p>
                )}
              </div>
            )}
          </div>
        )}
      </PageBody>

      {/* Schmale Bildschirme: die Mail öffnet in einem Fenster */}
      <Modal open={!split && !!selected} onClose={() => setSelectedId(null)} width={720}>
        {!split && selected && (
          <MessageReader
            key={selected.id}
            summary={selected}
            formatAt={formatAt}
            nextWindow={state?.nextWindow ?? null}
            onChanged={refresh}
            onBack={() => setSelectedId(null)}
          />
        )}
      </Modal>

      <SequenceModal open={sequenceOpen} onClose={() => setSequenceOpen(false)} products={products} preferred={productFilter} />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} rules={state?.rules ?? null} onSaved={refresh} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Zeile der Liste
// ---------------------------------------------------------------------------

function stepLabel(t: (key: string, opts?: Record<string, unknown>) => string, step: number) {
  return step === 0 ? t('outbox.step.first') : t('outbox.step.followUp', { n: step })
}

function statusLabel(t: (key: string) => string, m: Pick<OutboxMessage, 'status' | 'testMode'>) {
  return m.status === 'sent' && m.testMode ? t('outbox.status.sentTest') : t(`outbox.status.${m.status}`)
}

function MessageRow({
  message: m,
  active,
  formatAt,
  nextWindow,
  onSelect,
}: {
  message: OutboxMessage
  active: boolean
  formatAt: (v: string) => string
  nextWindow: string | null
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const when =
    m.status === 'sent' && m.sentAt
      ? formatAt(m.sentAt)
      : m.status === 'approved'
        ? formatAt(effectiveAt(m.plannedAt, nextWindow))
        : m.status === 'waiting'
          ? formatAt(m.plannedAt)
          : formatAt(m.updatedAt)
  // Vorschau: erste Zeile nach der Anrede
  const preview = m.body.split('\n').slice(1).join(' ').replace(/\s+/g, ' ').trim()

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-row-id={m.id}
      className={`outbox-row${active ? ' is-active' : ''} is-${m.status}`}
      onClick={onSelect}
    >
      <span className="outbox-row-top">
        <span className="outbox-row-company">{m.company.name}</span>
        <span className="outbox-row-when font-mono">{when}</span>
      </span>
      <span className="outbox-row-meta">
        <span className={`outbox-chip is-${m.status}${m.testMode ? ' is-test' : ''}`}>
          {m.status === 'generating' && <span className="spinner outbox-chip-spinner" />}
          {statusLabel(t, m)}
        </span>
        <span>{stepLabel(t, m.step)}</span>
        <span className="outbox-row-to">{m.contact?.name || m.toEmail}</span>
        {m.contact?.withoutConsent && OPEN.includes(m.status) && <span className="outbox-flag">{t('outbox.noConsent')}</span>}
      </span>
      <span className="outbox-row-subject">
        {m.status === 'generating'
          ? t('outbox.writing')
          : m.status === 'waiting'
            ? t('outbox.waitingNote')
            : m.subject || (m.stopReason ? t(`outbox.stopReason.${m.stopReason}`) : '')}
      </span>
      {m.status !== 'generating' && m.status !== 'waiting' && preview && <span className="outbox-row-preview">{preview}</span>}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Ansicht einer Mail mit Ablauf und Aktionen
// ---------------------------------------------------------------------------

// Frühester tatsächlicher Versand: der Termin der Mail, aber nicht vor dem nächsten Versandfenster
function effectiveAt(plannedAt: string, nextWindow: string | null): string {
  return nextWindow && new Date(nextWindow) > new Date(plannedAt) ? nextWindow : plannedAt
}

function MessageReader({
  summary,
  formatAt,
  nextWindow,
  onChanged,
  onBack,
}: {
  summary: OutboxMessage
  formatAt: (v: string) => string
  nextWindow: string | null
  onChanged: () => void
  onBack?: () => void
}) {
  const { t } = useTranslation()
  const { notify, confirm } = useUi()
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState(summary.subject)
  const [body, setBody] = useState(summary.body)
  const [invalid, setInvalid] = useState<Array<'subject' | 'body'>>([])
  const [rewriteOpen, setRewriteOpen] = useState(false)

  // Volle Fassung samt Verlauf; die Zusammenfassung der Liste dient bis dahin als Anzeige
  const detailQuery = useQuery({
    queryKey: ['outboxMessage', summary.id, summary.updatedAt],
    queryFn: () => api.get<OutboxMessage & { thread: OutboxMessage[]; appendix?: MailAppendix }>(`/api/outbox/${summary.id}`),
  })
  const m = detailQuery.data ?? { ...summary, thread: [] as OutboxMessage[], appendix: undefined }

  // Neue Fassung aus der Liste übernehmen, solange nicht gerade bearbeitet wird
  useEffect(() => {
    if (editing) return
    setSubject(summary.subject)
    setBody(summary.body)
  }, [summary.subject, summary.body, editing])

  function showError(err: unknown) {
    notify('error', err instanceof ApiError ? err.message : t('common.error'))
  }

  const approveMutation = useMutation({
    mutationFn: () => api.post<OutboxMessage>(`/api/outbox/${m.id}/approve`),
    onSuccess: () => {
      onChanged()
      notify('success', t('outbox.approved'))
    },
    onError: showError,
  })
  const saveMutation = useMutation({
    mutationFn: () =>
      api.put<OutboxMessage>(`/api/outbox/${m.id}`, {
        subject: subject.trim(),
        body: body.trim(),
      }),
    onSuccess: () => {
      setEditing(false)
      onChanged()
      notify('success', t('outbox.saved'))
    },
    onError: showError,
  })
  const rejectMutation = useMutation({
    mutationFn: () => api.post<{ ok: boolean }>(`/api/outbox/${m.id}/reject`),
    onSuccess: () => {
      onChanged()
      notify('success', t('outbox.rejectedToast'))
      onBack?.()
    },
    onError: showError,
  })
  const stopMutation = useMutation({
    mutationFn: () => api.post<{ stopped: number }>(`/api/outbox/${m.id}/stop`),
    onSuccess: () => {
      onChanged()
      notify('success', t('outbox.stoppedToast'))
      onBack?.()
    },
    onError: showError,
  })

  function save() {
    const missing: Array<'subject' | 'body'> = []
    if (!subject.trim()) missing.push('subject')
    if (body.trim().length < 10) missing.push('body')
    setInvalid(missing)
    if (missing.length) {
      notify('error', missing.includes('subject') ? t('outbox.subjectRequired') : t('outbox.bodyRequired'))
      return
    }
    saveMutation.mutate()
  }

  async function reject() {
    const ok = await confirm({
      message: t('outbox.rejectConfirm', { name: m.company.name }),
      confirmLabel: t('outbox.reject'),
      danger: true,
    })
    if (ok) rejectMutation.mutate()
  }

  async function stop() {
    const ok = await confirm({
      message: t('outbox.stopConfirm', { name: m.company.name }),
      confirmLabel: t('outbox.stop'),
      danger: true,
    })
    if (ok) stopMutation.mutate()
  }

  const canEdit = EDITABLE.includes(m.status) && !!m.body
  const canReject = EDITABLE.includes(m.status)
  const canStop = OPEN.includes(m.status)
  const canRewrite = EDITABLE.includes(m.status)

  return (
    <article className="outbox-reader" data-tour="outbox-reader">
      {onBack && (
        <button type="button" className="outbox-back" onClick={onBack}>
          <ArrowLeft size={15} />
          {t('outbox.back')}
        </button>
      )}

      <header className="outbox-reader-head">
        <div className="outbox-reader-title">
          <h2 className="font-display">{m.company.name}</h2>
          <span className="outbox-reader-product">
            {m.product.name}
            {m.company.city ? ` · ${m.company.city}` : ''}
          </span>
        </div>
        <Timeline current={m} thread={m.thread} formatAt={formatAt} nextWindow={nextWindow} />
      </header>

      {/* Kopfangaben der Mail */}
      <dl className="outbox-fields">
        <div>
          <dt>{t('outbox.to')}</dt>
          <dd>
            {m.contact?.name ? (
              <>
                {m.contact.name} <span className="text-tertiary">{`<${m.toEmail}>`}</span>
              </>
            ) : (
              m.toEmail
            )}
            {m.contact?.withoutConsent && <span className="outbox-flag">{t('outbox.noConsent')}</span>}
          </dd>
        </div>
        {/* Vor dem Schreiben beendete Mails haben noch keinen Betreff */}
        {(editing || m.subject) && (
          <div>
            <dt>{t('outbox.subject')}</dt>
            <dd>
              {editing ? (
                <input
                  className={`input${invalid.includes('subject') ? ' is-invalid' : ''}`}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  aria-label={t('outbox.subject')}
                />
              ) : (
                <span className="outbox-subject">{m.subject}</span>
              )}
            </dd>
          </div>
        )}
      </dl>

      {/* Lage dieser Mail: Termin, Versand, Öffnung, Fehler, Grund des Endes */}
      <div className="outbox-facts">
        {/* Beim Testversand sagt der Hinweis weiter unten alles, die Kennzeichnung entfällt dann */}
        {!(m.status === 'sent' && m.testMode) && (
          <span className={`outbox-chip is-${m.status}`}>
            {m.status === 'generating' && <span className="spinner outbox-chip-spinner" />}
            {statusLabel(t, m)}
          </span>
        )}
        {m.status === 'approved' && (
          <span>
            {t('outbox.plannedFor', {
              at: formatAt(effectiveAt(m.plannedAt, nextWindow)),
            })}
          </span>
        )}
        {m.status === 'review' && (
          <span>
            {t('outbox.afterApproval', {
              at: formatAt(effectiveAt(m.plannedAt, nextWindow)),
            })}
          </span>
        )}
        {m.status === 'waiting' && <span>{t('outbox.dueAt', { at: formatAt(m.plannedAt) })}</span>}
        {m.status === 'sent' && m.sentAt && <span>{t('outbox.sentAt', { at: formatAt(m.sentAt) })}</span>}
        {m.status === 'sent' && m.testMode && <span className="outbox-flag">{t('outbox.testSent')}</span>}
        {m.openedAt && (
          <span className="outbox-fact-icon">
            <Eye size={14} />
            {t('outbox.opened')}
          </span>
        )}
        {m.clickedAt && (
          <span className="outbox-fact-icon">
            <MousePointerClick size={14} />
            {t('outbox.clicked')}
          </span>
        )}
        {m.editedByUser && <span>{t('outbox.edited')}</span>}
        {m.status === 'cancelled' && m.stopReason && <span>{t(`outbox.stopReason.${m.stopReason}`)}</span>}
      </div>
      {m.error && (
        <p className="outbox-error">
          <strong>{t('outbox.errorLabel')}:</strong> {m.error}
        </p>
      )}

      {/* Inhalt */}
      {m.status === 'generating' ? (
        <div className="outbox-writing">
          <span className="spinner" />
          <div>
            <div>{t('outbox.writing')}</div>
            <div className="text-tertiary">{t('outbox.writingHint')}</div>
          </div>
        </div>
      ) : m.status === 'waiting' ? (
        <p className="outbox-waiting">{t('outbox.waitingNote')}</p>
      ) : editing ? (
        <textarea
          className={`textarea outbox-editor${invalid.includes('body') ? ' is-invalid' : ''}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          aria-label={t('outbox.body')}
        />
      ) : (
        m.body && (
          <div className="outbox-body">
            {m.body}
            {/* Was beim Versand angehängt wird, damit die Vorschau der fertigen Mail entspricht */}
            {m.appendix && (
              <div className="outbox-appendix">
                {m.appendix.signature && <div className="outbox-appendix-signature">{m.appendix.signature}</div>}
                <div className="outbox-appendix-footer">
                  {m.appendix.postalAddress && <div>{m.appendix.postalAddress}</div>}
                  <div>
                    {m.appendix.unsubText} <u>{m.appendix.unsubLink}</u>.
                  </div>
                </div>
                <div className="outbox-appendix-note">{t('outbox.appendixNote')}</div>
              </div>
            )}
          </div>
        )
      )}

      {/* Aktionen */}
      {(canEdit || canReject || canStop || canRewrite) && (
        <footer className="outbox-actions">
          {editing ? (
            <>
              <button className="btn btn-primary" onClick={save}>
                {saveMutation.isPending ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <Check size={16} />}
                {t('common.save')}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditing(false)
                  setSubject(m.subject)
                  setBody(m.body)
                  setInvalid([])
                }}
              >
                {t('common.cancel')}
              </button>
            </>
          ) : (
            <>
              {m.status === 'review' && (
                <button className="btn btn-primary" onClick={() => approveMutation.mutate()} data-tour="outbox-approve">
                  {approveMutation.isPending ? (
                    <span className="spinner" style={{ width: 15, height: 15 }} />
                  ) : (
                    <Check size={16} />
                  )}
                  {t('outbox.approve')}
                </button>
              )}
              {canEdit && (
                <button className="btn btn-secondary" onClick={() => setEditing(true)} data-tour="outbox-edit">
                  <Pencil size={15} />
                  {t('outbox.edit')}
                </button>
              )}
              {canRewrite && (
                <button className="btn btn-secondary" onClick={() => setRewriteOpen(true)} data-tour="outbox-rewrite">
                  <RotateCcw size={15} />
                  {t('outbox.rewrite')}
                </button>
              )}
              <span className="outbox-actions-spacer" />
              {canReject && (
                <button className="btn btn-ghost" onClick={reject} data-tour="outbox-reject">
                  <X size={15} />
                  {t('outbox.reject')}
                </button>
              )}
              {canStop && (
                <button className="btn btn-ghost outbox-stop" onClick={stop} data-tour="outbox-stop">
                  <OctagonX size={15} />
                  {t('outbox.stop')}
                </button>
              )}
            </>
          )}
        </footer>
      )}

      <RewriteModal open={rewriteOpen} onClose={() => setRewriteOpen(false)} messageId={m.id} onDone={onChanged} />
    </article>
  )
}

// Ablauf eines Interessenten als Leiste: Erstmail und Nachfass-Mails mit ihrem Stand
function Timeline({
  current,
  thread,
  formatAt,
  nextWindow,
}: {
  current: OutboxMessage
  thread: OutboxMessage[]
  formatAt: (v: string) => string
  nextWindow: string | null
}) {
  const { t } = useTranslation()
  const all = [current, ...thread]
  const total = Math.max(current.followUps, ...all.map((x) => x.step)) + 1
  // Je Schritt die jüngste Nachricht
  const byStep = new Map<number, OutboxMessage>()
  for (const x of all) {
    const prev = byStep.get(x.step)
    if (!prev || new Date(x.createdAt) > new Date(prev.createdAt)) byStep.set(x.step, x)
  }
  // Endet der Ablauf, gibt es keine weiteren Schritte mehr
  const ended = all.some((x) => x.status === 'cancelled' || x.status === 'rejected')

  return (
    <ol className="outbox-timeline" aria-label={t('outbox.step.of', { n: current.step + 1, total })}>
      {Array.from({ length: total }, (_, step) => {
        const x = byStep.get(step)
        const state = x ? x.status : ended ? 'cancelled' : 'future'
        const date = x?.sentAt ?? (x && OPEN.includes(x.status) ? effectiveAt(x.plannedAt, nextWindow) : null)
        return (
          <li key={step} className={`outbox-tl-step is-${state}${step === current.step ? ' is-current' : ''}`}>
            <span className="outbox-tl-dot" aria-hidden="true" />
            <span className="outbox-tl-label">{stepLabel(t, step)}</span>
            <span className="outbox-tl-date font-mono">
              {x ? (x.status === 'sent' || !date ? statusLabel(t, x) : formatAt(date)) : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// Neu schreiben lassen
// ---------------------------------------------------------------------------

function RewriteModal({
  open,
  onClose,
  messageId,
  onDone,
}: {
  open: boolean
  onClose: () => void
  messageId: string
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { notify } = useUi()
  const [hint, setHint] = useState('')
  const mutation = useMutation({
    mutationFn: () =>
      api.post<OutboxMessage>(`/api/outbox/${messageId}/rewrite`, {
        hint: hint.trim() || null,
      }),
    onSuccess: () => {
      setHint('')
      onClose()
      onDone()
      notify('info', t('outbox.rewriteQueued'))
    },
    onError: (err) => {
      const code = err instanceof ApiError ? (err.data as { code?: string } | undefined)?.code : undefined
      notify('error', code === 'noAi' ? t('outbox.noAiShort') : err instanceof ApiError ? err.message : t('common.error'))
    },
  })
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('outbox.rewriteTitle')}
      width={480}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-primary" onClick={() => mutation.mutate()}>
            {mutation.isPending ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <RotateCcw size={15} />}
            {t('outbox.rewrite')}
          </button>
        </>
      }
    >
      <div className="field">
        <label className="field-label" htmlFor="outbox-hint">
          {t('outbox.rewriteLabel')} <span className="text-tertiary">({t('outbox.rewriteOptional')})</span>
        </label>
        <textarea
          id="outbox-hint"
          className="textarea"
          rows={3}
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder={t('outbox.rewritePlaceholder')}
          autoFocus
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Ablauf je Produkt
// ---------------------------------------------------------------------------

function SequenceModal({
  open,
  onClose,
  products,
  preferred,
}: {
  open: boolean
  onClose: () => void
  products: Product[]
  preferred: string
}) {
  const { t } = useTranslation()
  const { notify } = useUi()
  const queryClient = useQueryClient()
  const storedProduct = useProduct((s) => s.productId)
  const [productId, setProductId] = useState('')
  const [form, setForm] = useState<Sequence | null>(null)
  const [invalid, setInvalid] = useState<number[]>([])

  // Beim Öffnen: Produkt aus dem Filter, sonst das in der Recherche gewählte, sonst das erste
  useEffect(() => {
    if (!open) return
    const pick = [preferred, storedProduct, products[0]?.id].find((id) => id && products.some((p) => p.id === id)) ?? ''
    setProductId(pick)
    setForm(null)
    setInvalid([])
  }, [open, preferred, storedProduct, products])

  const seqQuery = useQuery({
    queryKey: ['outboxSequence', productId],
    queryFn: () => api.get<Sequence>(`/api/outbox/sequence/${productId}`),
    enabled: open && !!productId,
  })
  useEffect(() => {
    if (seqQuery.data)
      setForm({
        ...seqQuery.data,
        instructions: seqQuery.data.instructions ?? '',
      })
  }, [seqQuery.data])

  const mutation = useMutation({
    mutationFn: (body: Sequence) => api.put<Sequence>(`/api/outbox/sequence/${productId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outboxSequence'] })
      queryClient.invalidateQueries({ queryKey: ['outbox'] })
      notify('success', t('outbox.seq.saved'))
      onClose()
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('common.error')),
  })

  function save() {
    if (!form) return
    const bad = form.intervals
      .slice(0, form.followUps)
      .map((v, i) => (!Number.isInteger(v) || v < 1 || v > 60 ? i : -1))
      .filter((i) => i >= 0)
    setInvalid(bad)
    if (bad.length) {
      notify('error', t('outbox.rule.invalidNumber'))
      return
    }
    mutation.mutate({
      ...form,
      intervals: form.intervals.slice(0, form.followUps),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('outbox.sequenceTitle')}
      subtitle={t('outbox.sequenceSubtitle')}
      width={560}
      footer={
        products.length ? (
          <>
            <button className="btn btn-ghost" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={save} data-tour="seq-save">
              {mutation.isPending && <span className="spinner" style={{ width: 15, height: 15 }} />}
              {t('common.save')}
            </button>
          </>
        ) : undefined
      }
    >
      {!products.length ? (
        <p className="text-tertiary">{t('outbox.seq.noProduct')}</p>
      ) : (
        <div className="outbox-form">
          <div className="field" data-tour="seq-product">
            <label className="field-label" htmlFor="seq-product">
              {t('outbox.seq.product')}
            </label>
            <Select
              id="seq-product"
              value={productId}
              onChange={setProductId}
              options={products.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
          {!form ? (
            <Loading />
          ) : (
            <>
              {/* Nachfass-Mails gehören zu MixMarket Pro */}
              <ProSlot
                name="outbox.sequenceFollowUps"
                followUps={form.followUps}
                intervals={form.intervals}
                invalid={invalid}
                onChange={(followUps: number, intervals: number[]) => setForm({ ...form, followUps, intervals })}
                fallback={
                  <div className="field" data-tour="seq-followups">
                    <span className="field-label">{t('outbox.seq.followUps')}</span>
                    <ProLockButton feature="followUps" label={t('pro.feature.followUps.title')} className="btn btn-ghost btn-sm outbox-followups-lock" />
                  </div>
                }
              />
              <div className="field" data-tour="seq-language">
                <label className="field-label" htmlFor="seq-language">
                  {t('outbox.seq.language')}
                </label>
                <Select
                  id="seq-language"
                  value={form.language}
                  onChange={(v) => setForm({ ...form, language: v as 'de' | 'en' })}
                  options={[
                    { value: 'de', label: t('outbox.language.de') },
                    { value: 'en', label: t('outbox.language.en') },
                  ]}
                />
              </div>
              <div className="field" data-tour="seq-approval">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.approval}
                    onChange={(e) => setForm({ ...form, approval: e.target.checked })}
                  />
                  <span>{t('outbox.seq.approval')}</span>
                </label>
                <div className="field-hint">{t('outbox.seq.approvalHint')}</div>
              </div>
              <div className="field" data-tour="seq-instructions">
                <label className="field-label" htmlFor="seq-instructions">
                  {t('outbox.seq.instructions')}
                </label>
                <textarea
                  id="seq-instructions"
                  className="textarea"
                  rows={3}
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder={t('outbox.seq.instructionsPlaceholder')}
                />
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Versandregeln
// ---------------------------------------------------------------------------

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
type RuleField = 'dailyLimit' | 'days' | 'from' | 'to' | 'gapMinutes'

function RulesModal({
  open,
  onClose,
  rules,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  rules: SendRules | null
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const { notify } = useUi()
  const [form, setForm] = useState({
    dailyLimit: '20',
    days: [1, 2, 3, 4, 5],
    from: '08:00',
    to: '17:00',
    gapMinutes: '3',
  })
  const [invalid, setInvalid] = useState<RuleField[]>([])

  useEffect(() => {
    if (!open || !rules) return
    setForm({
      dailyLimit: String(rules.dailyLimit),
      days: rules.days,
      from: rules.from,
      to: rules.to,
      gapMinutes: String(rules.gapMinutes),
    })
    setInvalid([])
  }, [open, rules])

  const mutation = useMutation({
    mutationFn: () =>
      api.put<SendRules>('/api/outbox/rules', {
        dailyLimit: Number(form.dailyLimit),
        days: form.days,
        from: form.from,
        to: form.to,
        gapMinutes: Number(form.gapMinutes),
      }),
    onSuccess: () => {
      onSaved()
      notify('success', t('outbox.rule.saved'))
      onClose()
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('common.error')),
  })

  const allDays = useMemo(() => [1, 2, 3, 4, 5, 6, 7], [])

  function save() {
    const bad: RuleField[] = []
    const limit = Number(form.dailyLimit)
    const gap = Number(form.gapMinutes)
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) bad.push('dailyLimit')
    if (!Number.isInteger(gap) || gap < 1 || gap > 240) bad.push('gapMinutes')
    if (!form.days.length) bad.push('days')
    if (!TIME.test(form.from)) bad.push('from')
    if (!TIME.test(form.to)) bad.push('to')
    const windowBad = TIME.test(form.from) && TIME.test(form.to) && form.from >= form.to
    if (windowBad) bad.push('to')
    setInvalid(bad)
    if (bad.length) {
      notify(
        'error',
        bad.includes('days')
          ? t('outbox.rule.noDays')
          : bad.includes('from') || (bad.includes('to') && !windowBad)
            ? t('outbox.rule.invalidTime')
            : windowBad
              ? t('outbox.rule.invalidWindow')
              : t('outbox.rule.invalidNumber'),
      )
      return
    }
    mutation.mutate()
  }

  const cls = (field: RuleField, base = 'input') => `${base}${invalid.includes(field) ? ' is-invalid' : ''}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('outbox.rulesTitle')}
      subtitle={t('outbox.rulesSubtitle')}
      width={520}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-primary" onClick={save} data-tour="rules-save">
            {mutation.isPending && <span className="spinner" style={{ width: 15, height: 15 }} />}
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="outbox-form">
        <div className="field" data-tour="rules-days">
          <span className="field-label">{t('outbox.rule.days')}</span>
          <div
            className={`outbox-days${invalid.includes('days') ? ' is-invalid' : ''}`}
            role="group"
            aria-label={t('outbox.rule.days')}
          >
            {allDays.map((d) => {
              const on = form.days.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  className={`outbox-day${on ? ' is-on' : ''}`}
                  onClick={() =>
                    setForm({
                      ...form,
                      days: on ? form.days.filter((x) => x !== d) : [...form.days, d].sort((a, b) => a - b),
                    })
                  }
                >
                  {t(`outbox.day.${d}`)}
                </button>
              )
            })}
          </div>
        </div>
        <div className="outbox-grid-2" data-tour="rules-window">
          <div className="field">
            <label className="field-label" htmlFor="rule-from">
              {t('outbox.rule.from')}
            </label>
            <input
              id="rule-from"
              className={cls('from', 'input font-mono')}
              inputMode="numeric"
              placeholder="08:00"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value.trim() })}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rule-to">
              {t('outbox.rule.to')}
            </label>
            <input
              id="rule-to"
              className={cls('to', 'input font-mono')}
              inputMode="numeric"
              placeholder="17:00"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value.trim() })}
            />
          </div>
        </div>
        <div className="field-hint outbox-time-hint">{t('outbox.rule.timeHint')}</div>
        <div className="outbox-grid-2" data-tour="rules-limits">
          <div className="field">
            <label className="field-label" htmlFor="rule-limit">
              {t('outbox.rule.dailyLimit')}
            </label>
            <span className="outbox-number">
              <input
                id="rule-limit"
                className={cls('dailyLimit', 'input font-mono')}
                type="number"
                min={1}
                max={500}
                value={form.dailyLimit}
                onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
              />
              <span className="text-tertiary">{t('outbox.rule.perDay')}</span>
            </span>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rule-gap">
              {t('outbox.rule.gap')}
            </label>
            <span className="outbox-number">
              <input
                id="rule-gap"
                className={cls('gapMinutes', 'input font-mono')}
                type="number"
                min={1}
                max={240}
                value={form.gapMinutes}
                onChange={(e) => setForm({ ...form, gapMinutes: e.target.value })}
              />
              <span className="text-tertiary">{t('outbox.rule.minutes')}</span>
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
