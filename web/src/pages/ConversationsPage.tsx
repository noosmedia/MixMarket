// Gespräche: Antworten auf eigene Mails, je Kontakt zusammengefasst. Links die Gespräche,
// rechts der ganze Verlauf mit eigenen Mails, Antworten und eigenen Antworten, darunter der
// Antwortentwurf. Nichts geht ohne Klick auf "Senden" hinaus. Auf schmalen Bildschirmen öffnet
// das Gespräch in einem Fenster.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  FlaskConical,
  Inbox,
  MailWarning,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { EmptyState, Loading, PageBody, PageHeader } from '../components/Page'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { flashRow, useJumpTarget, useUi } from '../stores/ui'
import { ProSlot, useProFeature } from '../pro/host'
import { ProLockButton } from '../pro/ProTeaser'
import './outbox.css'
import './conversations.css'

type Filter = 'open' | 'all' | 'bounce'
const FILTERS: Filter[] = ['open', 'all', 'bounce']
const CATEGORIES = ['interested', 'question', 'not_interested', 'unsubscribe', 'other'] as const
type Category = (typeof CATEGORIES)[number]
const PROSPECT_STATUSES = ['new', 'contacted', 'talking', 'declined', 'customer'] as const

interface Summary {
  open: number
  bounces: number
  imapReady: boolean
  testMode: boolean
  aiReady: boolean
  checkedAt: string | null
  lastError: string | null
}

interface ConversationItem {
  id: string
  kind: 'reply' | 'auto_reply' | 'bounce'
  status: 'open' | 'done'
  category: Category | null
  summary: string | null
  aiStatus: string
  subject: string
  preview: string
  fromEmail: string
  fromName: string | null
  receivedAt: string
  bounceType: 'hard' | 'soft' | null
  bounceRecipient: string | null
  contact: { id: string; email: string; name: string | null; company: string | null; status: string } | null
  prospect: { id: string; status: string; product: { id: string; name: string }; company: string } | null
  open: number
  total: number
  drafts: number
}

interface Entry {
  type: 'out' | 'campaign' | 'in' | 'reply'
  id: string
  at: string
  subject?: string
  body?: string
  text?: string
  main?: string
  step?: number
  testMode?: boolean
  campaign?: string
  kind?: 'reply' | 'auto_reply' | 'bounce'
  status?: 'open' | 'done'
  category?: Category | null
  summary?: string | null
  aiStatus?: string
  aiError?: string | null
  fromEmail?: string
  fromName?: string | null
  bounceType?: 'hard' | 'soft' | null
  bounceRecipient?: string | null
}

interface Draft {
  id: string
  inboxMessageId: string
  status: 'generating' | 'review' | 'failed'
  subject: string
  body: string
  error: string | null
  editedByUser: boolean
  updatedAt: string
}

interface Thread {
  id: string
  contact: { id: string; email: string; name: string | null; company: string | null; status: string; consent: boolean } | null
  prospect: {
    id: string
    status: string
    company: { id: string; name: string; city: string | null; website: string | null }
    product: { id: string; name: string }
  } | null
  suppressed: string | null
  replyTargetId: string | null
  open: number
  entries: Entry[]
  draft: Draft | null
}

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

// Kennzeichnung einer eingegangenen Mail: Einordnung, Abwesenheit, Rückläufer oder KI läuft
function chipOf(
  t: (key: string) => string,
  m: { kind?: string; category?: Category | null; aiStatus?: string; bounceType?: string | null },
  // KI-Einordnung (MixMarket Pro) aktiv
  aiActive: boolean,
): { label: string; tone: string } {
  if (m.kind === 'bounce')
    return { label: m.bounceType === 'soft' ? t('inbox.bounceSoft') : t('inbox.bounceHard'), tone: 'is-failed' }
  if (m.kind === 'auto_reply') return { label: t('inbox.autoReply'), tone: 'is-waiting' }
  if (m.category) {
    const tone =
      m.category === 'interested'
        ? 'is-approved'
        : m.category === 'question'
          ? 'is-review'
          : m.category === 'other'
            ? ''
            : 'is-failed'
    return { label: t(`inbox.category.${m.category}`), tone }
  }
  if (!aiActive) return { label: t('inbox.uncategorized'), tone: '' }
  if (m.aiStatus === 'failed') return { label: t('inbox.aiFailed'), tone: 'is-failed' }
  return { label: t('inbox.aiPending'), tone: 'is-generating' }
}

export function ConversationsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useUi()
  const split = useSplitView()
  const locale = i18n.language === 'en' ? 'en-GB' : 'de-DE'
  const [filter, setFilter] = useState<Filter>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Aus der Suche geöffnetes Gespräch; bleibt offen, auch wenn es in der Liste nicht obenauf liegt
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  const summaryQuery = useQuery({
    queryKey: ['inboxSummary'],
    queryFn: () => api.get<Summary>('/api/inbox/summary'),
    refetchInterval: 30000,
  })
  const summary = summaryQuery.data

  const aiActive = useProFeature('inboxAi')
  const listQuery = useQuery({
    queryKey: ['inbox', filter],
    queryFn: () => api.get<{ items: ConversationItem[] }>(`/api/inbox?filter=${filter}`),
    // Solange die KI einordnet, öfter nachsehen
    refetchInterval: (query) =>
      aiActive && query.state.data?.items.some((m) => m.aiStatus === 'pending' || m.aiStatus === 'running') ? 5000 : 30000,
  })
  const items = listQuery.data?.items ?? []

  // Auf breiten Bildschirmen immer ein Gespräch zeigen
  useEffect(() => {
    if (!split || listQuery.isFetching) return
    if (!items.length) {
      if (selectedId) setSelectedId(null)
      return
    }
    if (!selectedId || !items.some((m) => m.id === selectedId)) setSelectedId(items[0]!.id)
  }, [split, items, selectedId, listQuery.isFetching])

  // Sprung aus der Suche: Gespräch unter "Alle" öffnen
  useJumpTarget(['inbox'], (jump) => {
    setFilter('all')
    setSelectedId(null)
    setPinnedId(jump.id)
    flashRow(jump.id)
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['inbox'] })
    queryClient.invalidateQueries({ queryKey: ['inboxSummary'] })
    queryClient.invalidateQueries({ queryKey: ['inboxThread'] })
    queryClient.invalidateQueries({ queryKey: ['prospects'] })
    queryClient.invalidateQueries({ queryKey: ['outbox'] })
  }

  const checkMutation = useMutation({
    mutationFn: () => api.post<{ checked: boolean; stored: number; error?: string; code?: string }>('/api/inbox/check'),
    onSuccess: (r) => {
      refresh()
      if (r.code === 'noImap') notify('error', t('inbox.noImap'))
      else if (r.error) notify('error', t('inbox.pollError', { error: r.error }))
      else if (r.stored > 0) notify('success', t('inbox.checked', { count: r.stored }))
      else notify('info', t('inbox.checkedNone'))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('common.error')),
  })

  const formatAt = (value: string) =>
    new Date(value).toLocaleString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  // Angezeigtes Gespräch: das aus der Suche, sonst das gewählte
  const threadId = pinnedId ?? (items.some((m) => m.id === selectedId) ? selectedId : null)
  const filterLabel = (f: Filter) =>
    f === 'open' && summary
      ? `${t('inbox.filter.open')} (${summary.open})`
      : f === 'bounce' && summary
        ? `${t('inbox.filter.bounce')} (${summary.bounces})`
        : t(`inbox.filter.${f}`)

  return (
    <>
      <PageHeader
        help={{ chapter: 'conversations' }}
        eyebrow={t('inbox.title')}
        title={t('inbox.title')}
        // Ohne KI (MixMarket Pro) ohne Hinweis auf Einordnung und Entwürfe
        subtitle={aiActive ? t('inbox.subtitle') : t('inbox.subtitleFree')}
        actions={
          <button className="btn btn-secondary" onClick={() => checkMutation.mutate()} data-tour="conv-check">
            {checkMutation.isPending ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <RefreshCw size={16} />}
            {t('inbox.check')}
          </button>
        }
      />

      <PageBody>
        {summary && !summary.imapReady && (
          <div className="outbox-banner">
            <Inbox size={16} />
            <span>{t('inbox.noImap')}</span>
            <button type="button" className="outbox-banner-link" onClick={() => openSettingsSection(navigate, 'postfach')}>
              {t('inbox.noImapLink')}
            </button>
          </div>
        )}
        {summary?.imapReady && summary.lastError && (
          <div className="outbox-banner is-danger">
            <MailWarning size={16} />
            <span>{t('inbox.pollError', { error: summary.lastError })}</span>
            <button type="button" className="outbox-banner-link" onClick={() => openSettingsSection(navigate, 'postfach')}>
              {t('inbox.noImapLink')}
            </button>
          </div>
        )}
        {summary?.testMode && (
          <div className="outbox-banner">
            <FlaskConical size={16} />
            <span>{t('inbox.testMode')}</span>
          </div>
        )}
        {summary && !summary.aiReady && (
          <div className="outbox-banner is-danger">
            <Sparkles size={16} />
            <span>{t('inbox.noAi')}</span>
            <button type="button" className="outbox-banner-link" onClick={() => openSettingsSection(navigate, 'ki-bewertung')}>
              {t('outbox.noAiLink')}
            </button>
          </div>
        )}

        {summary?.imapReady && (
          <div className="outbox-state">
            <span className="outbox-state-item">
              {summary.checkedAt ? t('inbox.state.checkedAt', { at: formatAt(summary.checkedAt) }) : t('inbox.state.never')}
            </span>
            <span className="outbox-state-item">{t('inbox.state.interval')}</span>
          </div>
        )}

        <div className="toolbar outbox-toolbar" data-tour="conv-filters">
          <div className="segmented hide-mobile" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className={filter === f ? 'active' : ''}
                onClick={() => {
                  setFilter(f)
                  setSelectedId(null)
                  setPinnedId(null)
                }}
              >
                {t(`inbox.filter.${f}`)}
                {f !== 'all' && summary && (
                  <span className="outbox-count font-mono">{f === 'open' ? summary.open : summary.bounces}</span>
                )}
              </button>
            ))}
          </div>
          <Select
            className="show-mobile outbox-tab-select"
            value={filter}
            onChange={(v) => {
              setFilter(v as Filter)
              setSelectedId(null)
              setPinnedId(null)
            }}
            options={FILTERS.map((f) => ({ value: f, label: filterLabel(f) }))}
            aria-label={t('inbox.filterLabel')}
          />
        </div>

        {listQuery.isLoading ? (
          <Loading />
        ) : listQuery.isError ? (
          <p className="outbox-error">{listQuery.error instanceof ApiError ? listQuery.error.message : t('inbox.loadError')}</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox size={28} />}
            title={t(`inbox.empty.${filter}`)}
            description={t(`inbox.empty.${filter}Hint`)}
          />
        ) : (
          <div className={`outbox-split${split ? ' is-split' : ''}`}>
            <div className="outbox-list" role="listbox" aria-label={t('inbox.title')} data-tour="conv-list">
              {items.map((m) => (
                <ConversationRow
                  key={m.id}
                  item={m}
                  active={split && !pinnedId && m.id === selectedId}
                  formatAt={formatAt}
                  onSelect={() => {
                    setPinnedId(null)
                    setSelectedId(m.id)
                  }}
                />
              ))}
            </div>
            {split && (
              <div className="outbox-reader-pane">
                {threadId ? (
                  <ThreadView key={threadId} id={threadId} formatAt={formatAt} onChanged={refresh} />
                ) : (
                  <p className="outbox-select-hint">{t('inbox.select')}</p>
                )}
              </div>
            )}
          </div>
        )}
      </PageBody>

      <Modal
        open={!split && !!threadId}
        onClose={() => {
          setSelectedId(null)
          setPinnedId(null)
        }}
        width={720}
      >
        {!split && threadId && (
          <ThreadView
            key={threadId}
            id={threadId}
            formatAt={formatAt}
            onChanged={refresh}
            onBack={() => {
              setSelectedId(null)
              setPinnedId(null)
            }}
          />
        )}
      </Modal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Zeile der Liste
// ---------------------------------------------------------------------------

function ConversationRow({
  item: m,
  active,
  formatAt,
  onSelect,
}: {
  item: ConversationItem
  active: boolean
  formatAt: (v: string) => string
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const aiActive = useProFeature('inboxAi')
  const chip = chipOf(t, m, aiActive)
  const title =
    m.kind === 'bounce'
      ? (m.bounceRecipient ?? m.fromEmail)
      : m.prospect?.company || m.contact?.company || m.fromName || m.fromEmail
  const who = m.kind === 'bounce' ? null : m.contact?.name || m.fromName || m.fromEmail
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-row-id={m.id}
      className={`outbox-row conv-row${active ? ' is-active' : ''}${m.open > 0 ? ' is-unread' : ''}`}
      onClick={onSelect}
    >
      <span className="outbox-row-top">
        <span className="outbox-row-company">{title}</span>
        <span className="outbox-row-when font-mono">{formatAt(m.receivedAt)}</span>
      </span>
      <span className="outbox-row-meta">
        <span className={`outbox-chip ${chip.tone}`}>
          {aiActive && (m.aiStatus === 'pending' || m.aiStatus === 'running') && m.kind === 'reply' && (
            <span className="spinner outbox-chip-spinner" />
          )}
          {chip.label}
        </span>
        {who && <span className="outbox-row-to">{who}</span>}
        {m.open > 0 && m.total > 1 && <span className="conv-badge">{t('inbox.openCount', { count: m.open })}</span>}
        {m.drafts > 0 && <span className="conv-badge is-draft">{t('inbox.draftCount', { count: m.drafts })}</span>}
      </span>
      <span className="outbox-row-subject">{m.summary || m.subject}</span>
      {!m.summary && m.preview && <span className="outbox-row-preview">{m.preview}</span>}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Verlauf eines Gesprächs mit Antwortentwurf
// ---------------------------------------------------------------------------

function ThreadView({
  id,
  formatAt,
  onChanged,
  onBack,
}: {
  id: string
  formatAt: (v: string) => string
  onChanged: () => void
  onBack?: () => void
}) {
  const { t } = useTranslation()
  const { notify } = useUi()
  const aiActive = useProFeature('inboxAi')
  const query = useQuery({
    queryKey: ['inboxThread', id],
    queryFn: () => api.get<Thread>(`/api/inbox/${id}/thread`),
    // Solange die KI (MixMarket Pro) einordnet oder schreibt, öfter nachsehen
    refetchInterval: (q) => {
      const d = q.state.data
      const busy =
        aiActive &&
        (d?.draft?.status === 'generating' ||
          d?.entries.some((e) => e.type === 'in' && (e.aiStatus === 'pending' || e.aiStatus === 'running')))
      return busy ? 4000 : false
    },
  })
  const thread = query.data

  function showError(err: unknown) {
    const code = err instanceof ApiError ? (err.data as { code?: string } | undefined)?.code : undefined
    notify('error', code === 'noAi' ? t('inbox.noAiShort') : err instanceof ApiError ? err.message : t('common.error'))
  }

  const doneMutation = useMutation({
    mutationFn: (open: boolean) => api.post<{ ok: boolean }>(`/api/inbox/${id}/done`, { open }),
    onSuccess: (_r, open) => {
      onChanged()
      notify('success', open ? t('inbox.reopenToast') : t('inbox.doneToast'))
    },
    onError: showError,
  })
  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch<unknown>(`/api/prospects/${thread?.prospect?.id}`, { status }),
    onSuccess: () => {
      onChanged()
      notify('success', t('inbox.prospectSaved'))
    },
    onError: showError,
  })
  const categoryMutation = useMutation({
    mutationFn: ({ messageId, category }: { messageId: string; category: Category }) =>
      api.patch<{ ok: boolean }>(`/api/inbox/${messageId}`, { category }),
    onSuccess: () => {
      onChanged()
      notify('success', t('inbox.categoryChanged'))
    },
    onError: showError,
  })

  if (query.isLoading || !thread) return <Loading />

  const lastIn = [...thread.entries].reverse().find((e) => e.type === 'in')
  const title =
    thread.prospect?.company.name ||
    thread.contact?.company ||
    lastIn?.fromName ||
    lastIn?.bounceRecipient ||
    lastIn?.fromEmail ||
    ''
  const isBounceOnly = thread.entries.every((e) => e.type !== 'in' || e.kind === 'bounce')

  return (
    <article className="outbox-reader conv-reader" data-tour="conv-thread">
      {onBack && (
        <button type="button" className="outbox-back" onClick={onBack}>
          <ArrowLeft size={15} />
          {t('inbox.back')}
        </button>
      )}

      <header className="outbox-reader-head conv-head">
        <div className="conv-head-top">
          <div className="outbox-reader-title">
            <h2 className="font-display">{title}</h2>
            <span className="outbox-reader-product">
              {[
                thread.contact?.name,
                thread.contact?.email ?? lastIn?.bounceRecipient ?? lastIn?.fromEmail,
                thread.prospect?.product.name,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
          {thread.open > 0 ? (
            <button className="btn btn-secondary btn-sm" onClick={() => doneMutation.mutate(false)} data-tour="conv-done">
              <Check size={15} />
              {t('inbox.done')}
            </button>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => doneMutation.mutate(true)} data-tour="conv-done">
              <Undo2 size={15} />
              {t('inbox.reopen')}
            </button>
          )}
        </div>
        {thread.prospect && (
          <div className="conv-prospect" data-tour="conv-prospect-status">
            <span className="field-label">{t('inbox.prospectStatus')}</span>
            <Select
              className="conv-status"
              value={thread.prospect.status}
              onChange={(v) => statusMutation.mutate(v)}
              options={PROSPECT_STATUSES.map((s) => ({ value: s, label: t(`prospects.status.${s}`) }))}
              aria-label={t('inbox.prospectStatus')}
            />
          </div>
        )}
      </header>

      {/* Verlauf, älteste Mail zuerst */}
      <ol className="conv-thread">
        {thread.entries.map((e) => (
          <ThreadEntry
            key={`${e.type}-${e.id}`}
            entry={e}
            formatAt={formatAt}
            onCategory={(category) => categoryMutation.mutate({ messageId: e.id, category })}
          />
        ))}
      </ol>

      {!isBounceOnly && <Composer thread={thread} onChanged={onChanged} />}
    </article>
  )
}

function ThreadEntry({
  entry: e,
  formatAt,
  onCategory,
}: {
  entry: Entry
  formatAt: (v: string) => string
  onCategory: (c: Category) => void
}) {
  const { t } = useTranslation()
  const [quote, setQuote] = useState(false)
  const own = e.type !== 'in'
  const label =
    e.type === 'out'
      ? t('inbox.entry.outStep', { step: (e.step ?? 0) + 1 })
      : e.type === 'campaign'
        ? t('inbox.entry.campaign', { name: e.campaign })
        : e.type === 'reply'
          ? t('inbox.entry.reply')
          : e.kind === 'bounce'
            ? t('inbox.entry.bounce')
            : t('inbox.entry.in', { name: e.fromName || e.fromEmail })
  const aiActive = useProFeature('inboxAi')
  const chip = e.type === 'in' ? chipOf(t, e, aiActive) : null
  const fullText = e.type === 'in' ? (e.text ?? '') : (e.body ?? '')
  const mainText = e.type === 'in' ? (e.main ?? fullText) : fullText
  const hasQuote = e.type === 'in' && mainText.trim() !== fullText.trim()

  return (
    <li className={`conv-entry${own ? ' is-own' : ' is-in'}${e.kind === 'bounce' ? ' is-bounce' : ''}`}>
      <div className="conv-entry-head">
        <span className="conv-entry-label">{label}</span>
        <span className="conv-entry-at font-mono">{formatAt(e.at)}</span>
      </div>
      {e.subject && <div className="conv-entry-subject">{e.subject}</div>}
      {chip && (
        <div className="conv-entry-meta">
          <span className={`outbox-chip ${chip.tone}`}>
            {aiActive && (e.aiStatus === 'pending' || e.aiStatus === 'running') && e.kind === 'reply' && (
              <span className="spinner outbox-chip-spinner" />
            )}
            {chip.label}
          </span>
          {e.summary && <span className="conv-summary">{e.summary}</span>}
          {e.kind === 'reply' && (
            <Select
              className="conv-category"
              value={e.category ?? ''}
              placeholder={t('inbox.categoryLabel')}
              onChange={(v) => onCategory(v as Category)}
              options={CATEGORIES.map((c) => ({ value: c, label: t(`inbox.category.${c}`) }))}
              aria-label={t('inbox.categoryLabel')}
            />
          )}
        </div>
      )}
      {e.kind === 'bounce' ? (
        <p className="conv-note">
          {t('inbox.bounceNote', { email: e.bounceRecipient ?? '' })}{' '}
          {e.bounceType === 'soft' ? t('inbox.bounceSoftNote') : t('inbox.bounceHardNote')}
        </p>
      ) : (
        <>
          {e.kind === 'auto_reply' && <p className="conv-note">{t('inbox.autoReplyNote')}</p>}
          {e.type === 'campaign' ? null : <div className="conv-text">{quote ? fullText : mainText}</div>}
          {hasQuote && (
            <button type="button" className="conv-quote-toggle" onClick={() => setQuote(!quote)}>
              {quote ? t('inbox.hideQuote') : t('inbox.showQuote')}
            </button>
          )}
          {e.testMode && <span className="outbox-flag conv-test">{t('inbox.entry.testSent')}</span>}
          {e.aiError && <p className="outbox-error">{e.aiError}</p>}
        </>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------
// Antwort schreiben, prüfen und senden
// ---------------------------------------------------------------------------

function Composer({ thread, onChanged }: { thread: Thread; onChanged: () => void }) {
  const { t } = useTranslation()
  const { notify, confirm } = useUi()
  const draft = thread.draft
  const [subject, setSubject] = useState(draft?.subject ?? '')
  const [body, setBody] = useState(draft?.body ?? '')
  const [dirty, setDirty] = useState(false)
  const [invalid, setInvalid] = useState<Array<'subject' | 'body'>>([])

  // Neue Fassung vom Server übernehmen, solange nicht gerade getippt wurde
  useEffect(() => {
    if (dirty) return
    setSubject(draft?.subject ?? '')
    setBody(draft?.body ?? '')
  }, [draft?.id, draft?.updatedAt, draft?.subject, draft?.body, dirty])

  function showError(err: unknown) {
    const code = err instanceof ApiError ? (err.data as { code?: string } | undefined)?.code : undefined
    notify('error', code === 'noAi' ? t('inbox.noAiShort') : err instanceof ApiError ? err.message : t('common.error'))
  }

  const target = draft?.inboxMessageId ?? thread.replyTargetId
  // KI-Entwurf angefordert (MixMarket Pro): Eingaben verwerfen und neu laden
  const onAiQueued = () => {
    setDirty(false)
    onChanged()
  }
  const composeMutation = useMutation({
    mutationFn: () => api.post<{ id: string }>(`/api/inbox/${target}/compose`),
    onSuccess: () => onChanged(),
    onError: showError,
  })
  const saveMutation = useMutation({
    mutationFn: () => api.put<{ ok: boolean }>(`/api/inbox/replies/${draft?.id}`, { subject: subject.trim(), body: body.trim() }),
    onSuccess: () => {
      setDirty(false)
      onChanged()
    },
    onError: showError,
  })
  const sendMutation = useMutation({
    mutationFn: () => api.post<{ ok: boolean; testMode: boolean }>(`/api/inbox/replies/${draft?.id}/send`),
    onSuccess: (r) => {
      setDirty(false)
      onChanged()
      notify('success', r.testMode ? t('inbox.composer.sentTest') : t('inbox.composer.sent'))
    },
    onError: showError,
  })
  const discardMutation = useMutation({
    mutationFn: () => api.post<{ ok: boolean }>(`/api/inbox/replies/${draft?.id}/discard`),
    onSuccess: () => {
      setDirty(false)
      onChanged()
      notify('success', t('inbox.composer.discarded'))
    },
    onError: showError,
  })

  function validate(): boolean {
    const missing: Array<'subject' | 'body'> = []
    if (!subject.trim()) missing.push('subject')
    if (body.trim().length < 10) missing.push('body')
    setInvalid(missing)
    if (missing.length)
      notify('error', missing.includes('subject') ? t('inbox.composer.subjectRequired') : t('inbox.composer.bodyRequired'))
    return missing.length === 0
  }

  async function send() {
    if (!validate()) return
    const email = thread.contact?.email ?? ''
    const ok = await confirm({
      message: t('inbox.composer.sendConfirm', { email }),
      confirmLabel: t('inbox.composer.send'),
      notes: [t('inbox.composer.sendNote')],
    })
    if (!ok) return
    // Änderungen erst speichern, dann senden
    if (dirty) await saveMutation.mutateAsync().catch(() => undefined)
    sendMutation.mutate()
  }

  async function discard() {
    const ok = await confirm({
      message: t('inbox.composer.discardConfirm'),
      confirmLabel: t('inbox.composer.discard'),
      danger: true,
    })
    if (ok) discardMutation.mutate()
  }

  if (thread.suppressed) {
    return (
      <section className="conv-composer" data-tour="conv-composer">
        <p className="conv-note">
          {t('inbox.composer.suppressed', { reason: t(`suppression.reason${reasonKey(thread.suppressed)}`) })}
        </p>
      </section>
    )
  }
  if (!target) return null

  return (
    <section className="conv-composer" data-tour="conv-composer">
      <h3 className="conv-composer-title">{t('inbox.composer.title')}</h3>
      {!draft ? (
        <div className="outbox-actions">
          {/* KI-Entwurf gehört zu MixMarket Pro */}
          <ProSlot
            name="inbox.aiDraft"
            target={target}
            onQueued={onAiQueued}
            fallback={<ProLockButton feature="inboxAi" label={t('inbox.composer.aiDraft')} icon={<Sparkles size={16} />} />}
          />
          <button className="btn btn-secondary" onClick={() => composeMutation.mutate()} data-tour="conv-self-write">
            <PenLine size={15} />
            {t('inbox.composer.selfWrite')}
          </button>
        </div>
      ) : draft.status === 'generating' ? (
        <div className="outbox-writing">
          <span className="spinner" />
          <div>
            <div>{t('inbox.composer.writing')}</div>
            <div className="text-tertiary">{t('inbox.composer.writingHint')}</div>
          </div>
        </div>
      ) : (
        <>
          {draft.status === 'failed' && draft.error && (
            <p className="outbox-error">{t('inbox.composer.failed', { error: draft.error })}</p>
          )}
          <div className="field">
            <label className="field-label" htmlFor="conv-subject">
              {t('inbox.composer.subject')}
            </label>
            <input
              id="conv-subject"
              className={`input${invalid.includes('subject') ? ' is-invalid' : ''}`}
              value={subject}
              onChange={(ev) => {
                setSubject(ev.target.value)
                setDirty(true)
              }}
            />
          </div>
          <textarea
            className={`textarea outbox-editor conv-editor${invalid.includes('body') ? ' is-invalid' : ''}`}
            value={body}
            onChange={(ev) => {
              setBody(ev.target.value)
              setDirty(true)
            }}
            rows={12}
            aria-label={t('inbox.composer.body')}
          />
          <footer className="outbox-actions">
            <button className="btn btn-primary" onClick={send} data-tour="conv-send">
              {sendMutation.isPending ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <Send size={15} />}
              {t('inbox.composer.send')}
            </button>
            {dirty && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (validate())
                    saveMutation.mutate(undefined, { onSuccess: () => notify('success', t('inbox.composer.saved')) })
                }}
              >
                <Check size={15} />
                {t('inbox.composer.save')}
              </button>
            )}
            {/* Neu schreiben lassen gehört zu MixMarket Pro */}
            <ProSlot name="inbox.rewrite" target={target} onQueued={onAiQueued} />
            <span className="outbox-actions-spacer" />
            <button className="btn btn-ghost" onClick={discard} data-tour="conv-discard">
              <Trash2 size={15} />
              {t('inbox.composer.discard')}
            </button>
          </footer>
        </>
      )}

    </section>
  )
}

// Sperrgrund auf den vorhandenen Übersetzungsschlüssel der Sperrliste abbilden
function reasonKey(reason: string): string {
  if (reason === 'unsubscribed') return 'Unsub'
  if (reason === 'bounced') return 'Bounced'
  if (reason === 'complained') return 'Complained'
  return 'Manual'
}
