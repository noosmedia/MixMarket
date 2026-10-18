// Interessenten je Produkt: Arbeitsliste für die Erstansprache. Je Firma Passung,
// Ansatzpunkt der KI, Ansprechpartner und Erreichbarkeit, dazu Status und Notiz.
// Von hier lassen sich Interessenten mit E-Mail in die Kontakte übernehmen oder über den
// Postausgang persönlich anschreiben (die KI schreibt je Firma eine Erstmail zur Freigabe).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Globe, Mail, Mails, Pencil, Phone, Send, Trash2, UserRound } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { EmptyState, Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { useJumpTarget, useUi } from '../stores/ui'
import { useProduct } from '../stores/product'
import { CompanyDetailModal, roleLabel } from './CompanyDetailModal'
import './prospects.css'

export const PROSPECT_STATUSES = ['new', 'contacted', 'talking', 'declined', 'customer'] as const
type ProspectStatus = (typeof PROSPECT_STATUSES)[number]

interface Prospect {
  id: string
  status: ProspectStatus
  notes: string | null
  personName: string | null
  contact: { id: string; email: string; consent: boolean } | null
  // Jüngste Mail im Postausgang, falls die Ansprache dort läuft
  outbox: { id: string; status: string; step: number } | null
  company: {
    id: string
    name: string
    website: string | null
    phone: string | null
    street: string | null
    postalCode: string | null
    city: string | null
    category: string | null
  }
  people: Array<{ fullName: string; role: string | null; isDecisionMaker: boolean }>
  person: { fullName: string; role: string | null } | null
  email: string | null
  emailPersonal: boolean
  score: { score: number; reason: string; hook: string | null; stale: boolean } | null
}

interface EnqueueResult {
  queued: number
  alreadyQueued: number
  notNew: number
  noEmail: number
  suppressed: number
  declined: number
  withoutConsent: number
}

interface ToContactsResult {
  created: number
  linked: number
  noEmail: number
  suppressed: number
  declined: number
  listName: string
}

// Bearbeitungsstand im Fenster "Interessent bearbeiten"
interface EditForm {
  personName: string
  status: ProspectStatus
  notes: string
}

export function ProspectsPanel({ toContactsSignal, writeSignal }: { toContactsSignal: number; writeSignal: number }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()
  const { productId } = useProduct()
  const [filter, setFilter] = useState<'all' | ProspectStatus>('all')
  const [openCompanyId, setOpenCompanyId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Prospect | null>(null)
  const [form, setForm] = useState<EditForm>({ personName: '', status: 'new', notes: '' })

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['prospects', productId],
    queryFn: () => api.get<{ items: Prospect[] }>(`/api/prospects?productId=${encodeURIComponent(productId ?? '')}`),
    enabled: !!productId,
  })
  const items = data?.items ?? []

  // Anzahl je Status für die Filterleiste
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const s of PROSPECT_STATUSES) c[s] = items.filter((p) => p.status === s).length
    return c
  }, [items])
  const visible = filter === 'all' ? items : items.filter((p) => p.status === filter)

  function showError(err: unknown) {
    notify('error', err instanceof ApiError ? err.message : t('discovery.genericError'))
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['prospects'] })
    queryClient.invalidateQueries({ queryKey: ['discoveryCompany'] })
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<EditForm> }) => api.patch<unknown>(`/api/prospects/${id}`, body),
    onSuccess: refresh,
    onError: showError,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/api/prospects/${id}`),
    onSuccess: () => {
      refresh()
      notify('success', t('prospects.removed'))
    },
    onError: showError,
  })

  const toContactsMutation = useMutation({
    mutationFn: () => api.post<ToContactsResult>('/api/prospects/to-contacts', { productId }),
    onSuccess: (r) => {
      refresh()
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      notify('success', t('prospects.toContactsDone', { created: r.created, linked: r.linked, list: r.listName }))
      if (r.noEmail > 0) notify('info', t('prospects.toContactsNoEmail', { count: r.noEmail }))
      if (r.suppressed > 0) notify('warning', t('prospects.toContactsSuppressed', { count: r.suppressed }))
      if (r.declined > 0) notify('info', t('prospects.toContactsDeclined', { count: r.declined }))
    },
    onError: showError,
  })

  // Interessenten in den Postausgang übernehmen: die KI schreibt danach je Firma die Erstmail
  const writeMutation = useMutation({
    mutationFn: (ids?: string[]) => api.post<EnqueueResult>('/api/outbox/enqueue', { productId, ...(ids ? { prospectIds: ids } : {}) }),
    onSuccess: (r) => {
      refresh()
      queryClient.invalidateQueries({ queryKey: ['outbox'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      if (r.queued > 0) notify('success', t('prospects.writeDone', { count: r.queued }))
      else notify('info', t('prospects.writeNothing'))
      if (r.alreadyQueued > 0) notify('info', t('prospects.writeAlready', { count: r.alreadyQueued }))
      if (r.noEmail > 0) notify('info', t('prospects.toContactsNoEmail', { count: r.noEmail }))
      if (r.suppressed > 0) notify('warning', t('prospects.toContactsSuppressed', { count: r.suppressed }))
    },
    onError: (err) => {
      const code = err instanceof ApiError ? (err.data as { code?: string } | undefined)?.code : undefined
      if (code === 'noAi') notify('error', t('outbox.noAiShort'))
      else showError(err)
    },
  })

  // Wer angeschrieben werden kann: Status "Neu", E-Mail bekannt, noch nicht im Postausgang
  const writable = (p: Prospect) => p.status === 'new' && !!p.email && !p.outbox

  // Erst erklären und auf die Rechtslage hinweisen, dann übernehmen
  async function startWriting(list: Prospect[], single?: Prospect) {
    if (!productId) {
      notify('error', t('products.required'))
      return
    }
    if (list.length === 0) {
      notify('error', t('prospects.writeNone'))
      return
    }
    // Ohne Kontakt mit Einwilligung gilt die Mail als Werbung ohne Einwilligung
    const needsWarning = list.some((p) => !p.contact?.consent)
    const ok = await confirm({
      message: single ? t('prospects.writeConfirmSingle', { name: single.company.name }) : t('prospects.writeConfirm', { count: list.length }),
      confirmLabel: t('prospects.write'),
      notes: [t('prospects.writeNote1'), t('prospects.writeNote2')],
      warnings: needsWarning ? [t('prospects.writeWarn')] : undefined,
    })
    if (ok) writeMutation.mutate(single ? [single.id] : list.map((p) => p.id))
  }

  // "Neue anschreiben" aus dem Seitenkopf
  const lastWriteSignal = useRef(writeSignal)
  useEffect(() => {
    if (writeSignal === lastWriteSignal.current) return
    lastWriteSignal.current = writeSignal
    void startWriting(items.filter(writable))
    // Bewusst nur auf das Signal aus dem Seitenkopf reagieren
  }, [writeSignal])

  // "In Kontakte übernehmen" aus dem Seitenkopf: erst erklären, dann ausführen
  const lastSignal = useRef(toContactsSignal)
  useEffect(() => {
    if (toContactsSignal === lastSignal.current) return
    lastSignal.current = toContactsSignal
    if (!productId) {
      notify('error', t('products.required'))
      return
    }
    // Interessenten mit "Kein Interesse" werden nicht übernommen
    const withEmail = items.filter((p) => p.email && p.status !== 'declined').length
    if (withEmail === 0) {
      notify('error', t('prospects.toContactsNone'))
      return
    }
    void confirm({
      message: t('prospects.toContactsConfirm', { count: withEmail }),
      confirmLabel: t('prospects.toContacts'),
      notes: [t('prospects.toContactsNote1'), t('prospects.toContactsNote2')],
    }).then((ok) => ok && toContactsMutation.mutate())
    // Bewusst nur auf das Signal aus dem Seitenkopf reagieren
  }, [toContactsSignal])

  function openEdit(p: Prospect) {
    setEditing(p)
    setForm({ personName: p.personName ?? '', status: p.status, notes: p.notes ?? '' })
  }

  function saveEdit() {
    if (!editing) return
    updateMutation.mutate(
      { id: editing.id, body: { personName: form.personName || '', status: form.status, notes: form.notes } },
      {
        onSuccess: () => {
          notify('success', t('prospects.saved'))
          setEditing(null)
        },
      },
    )
  }

  async function handleRemove(p: Prospect) {
    const ok = await confirm({
      message: t('prospects.removeConfirm', { name: p.company.name }),
      confirmLabel: t('prospects.remove'),
      danger: true,
    })
    if (ok) removeMutation.mutate(p.id)
  }

  const statusOptions = PROSPECT_STATUSES.map((s) => ({ value: s, label: t(`prospects.status.${s}`) }))
  const filterOptions = [
    { value: 'all', label: `${t('prospects.all')} (${counts.all})` },
    ...PROSPECT_STATUSES.map((s) => ({ value: s, label: `${t(`prospects.status.${s}`)} (${counts[s]})` })),
  ]

  // Sprung aus der Suche: Interessenten zum Bearbeiten öffnen, sobald sein Produkt gewählt und geladen ist
  useJumpTarget(
    ['prospects'],
    (jump) => {
      const prospect = data?.items.find((p) => p.id === jump.id)
      if (prospect) openEdit(prospect)
      else notify('error', t('search.notFound'))
    },
    (jump) => !!data && !isFetching && (!jump.productId || jump.productId === productId),
  )

  if (!productId) return <p className="text-tertiary">{t('products.required')}</p>
  if (isLoading) return <Loading />
  if (isError) return <p className="discovery-note discovery-note-error">{error instanceof ApiError ? error.message : t('discovery.loadError')}</p>

  if (items.length === 0) {
    return (
      <EmptyState icon={<UserRound size={28} />} title={t('prospects.emptyTitle')} description={t('prospects.emptyHint')} />
    )
  }

  return (
    <div className="prospects" data-tour="prospects-list">
      {/* Filter nach Status: am Desktop als Leiste, auf dem Handy als Auswahlfeld */}
      <div className="toolbar">
        <div className="segmented hide-mobile" role="tablist">
          {filterOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={filter === o.value}
              className={filter === o.value ? 'active' : ''}
              onClick={() => setFilter(o.value as typeof filter)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Select
          className="show-mobile"
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          options={filterOptions}
          aria-label={t('prospects.filter')}
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-tertiary prospects-none">{t('prospects.noMatch')}</p>
      ) : (
        <div className="data-list">
          {visible.map((p) => (
            <div className="data-row prospect-row" key={p.id} data-prospect-id={p.id}>
              <div className="data-row-main">
                {/* Firma mit Passung */}
                <div className="data-row-title">
                  {p.score ? (
                    <span className={`discovery-score ${p.score.score >= 7 ? 'is-high' : p.score.score <= 3 ? 'is-low' : ''}`}>
                      {p.score.score}
                    </span>
                  ) : null}
                  <button type="button" className="prospect-name" onClick={() => setOpenCompanyId(p.company.id)}>
                    {p.company.name}
                  </button>
                </div>
                <div className="data-row-meta discovery-meta">
                  {/* Branche nur als lesbarer Text, keine Rohwerte wie "apartment" aus OpenStreetMap */}
                  {p.company.category && !/^[a-z_]+$/.test(p.company.category) && <span>{p.company.category}</span>}
                  {p.company.city && <span>{p.company.city}</span>}
                  {p.contact && <span>{t('prospects.inContacts')}</span>}
                  {p.outbox && (
                    <Link className="prospect-outbox" to="/outbox">
                      <Mails size={13} />
                      {p.outbox.status === 'sent'
                        ? t('prospects.outboxSent', { n: p.outbox.step + 1 })
                        : t('prospects.inOutbox', { status: t(`outbox.status.${p.outbox.status}`) })}
                    </Link>
                  )}
                </div>

                {/* Ansatzpunkt der KI für die Ansprache */}
                {p.score?.hook ? (
                  <p className="prospect-hook">
                    {p.score.hook}
                    {p.score.stale && <span className="prospect-stale"> {t('prospects.stale')}</span>}
                  </p>
                ) : (
                  <p className="prospect-hook is-empty">{p.score ? t('prospects.noHook') : t('prospects.notScored')}</p>
                )}

                {/* Ansprechpartner und Erreichbarkeit */}
                <div className="prospect-reach">
                  <span className="prospect-reach-item">
                    <UserRound size={14} />
                    {p.person ? (
                      <>
                        <span className="prospect-person">{p.person.fullName}</span>
                        {p.person.role && <span className="text-tertiary">{roleLabel(p.person.role, t)}</span>}
                      </>
                    ) : (
                      <span className="text-tertiary">{t('prospects.noPerson')}</span>
                    )}
                  </span>
                  {p.company.phone && (
                    <a className="prospect-reach-item" href={`tel:${p.company.phone.replace(/[^\d+]/g, '')}`}>
                      <Phone size={14} />
                      <span className="font-mono">{p.company.phone}</span>
                    </a>
                  )}
                  {p.email && (
                    <a className="prospect-reach-item" href={`mailto:${p.email}`}>
                      <Mail size={14} />
                      <span>{p.email}</span>
                      {p.emailPersonal && <span className="badge badge-accent">{t('prospects.personal')}</span>}
                    </a>
                  )}
                  {p.company.website && (
                    <a className="prospect-reach-item" href={p.company.website} target="_blank" rel="noreferrer">
                      <Globe size={14} />
                      <span>{p.company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}
                </div>

                {p.notes && <p className="prospect-notes">{p.notes}</p>}
              </div>

              {/* Status direkt änderbar, Bearbeiten und Entfernen */}
              <div className="data-row-aside">
                <Select
                  className="prospect-status"
                  value={p.status}
                  onChange={(v) => updateMutation.mutate({ id: p.id, body: { status: v as ProspectStatus } })}
                  options={statusOptions}
                  aria-label={t('prospects.statusLabel')}
                />
                <div className="data-row-actions">
                  {writable(p) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => startWriting([p], p)}
                      aria-label={t('prospects.write')}
                      data-tour="prospect-write"
                    >
                      <Send size={14} />
                      <span className="btn-label">{t('prospects.write')}</span>
                    </button>
                  )}
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEdit(p)} aria-label={t('prospects.edit')}>
                    <Pencil size={14} />
                    <span className="btn-label">{t('common.edit')}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-icon btn-ghost"
                    onClick={() => handleRemove(p)}
                    aria-label={t('prospects.remove')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interessent bearbeiten: Ansprechpartner, Status, Notiz */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={t('prospects.edit')}
        subtitle={editing?.company.name}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <span className="spinner" style={{ width: 16, height: 16 }} />}
              {t('common.save')}
            </button>
          </>
        }
      >
        {editing && (
          <form
            className="prospect-form"
            onSubmit={(e) => {
              e.preventDefault()
              saveEdit()
            }}
          >
            <div className="field">
              <label className="field-label" htmlFor="prospect-person">
                {t('prospects.person')}
              </label>
              <Select
                id="prospect-person"
                value={form.personName}
                onChange={(v) => setForm({ ...form, personName: v })}
                options={[
                  { value: '', label: t('prospects.personAuto') },
                  ...editing.people.map((x) => ({
                    value: x.fullName,
                    label: x.role ? `${x.fullName} (${roleLabel(x.role, t)})` : x.fullName,
                  })),
                ]}
              />
              {editing.people.length === 0 && <div className="field-hint">{t('prospects.noPeopleHint')}</div>}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="prospect-status">
                {t('prospects.statusLabel')}
              </label>
              <Select
                id="prospect-status"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as ProspectStatus })}
                options={statusOptions}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="prospect-notes">
                {t('prospects.notes')}
              </label>
              <textarea
                id="prospect-notes"
                className="textarea"
                rows={5}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t('prospects.notesPlaceholder')}
              />
            </div>
          </form>
        )}
      </Modal>

      <CompanyDetailModal companyId={openCompanyId} productId={productId} onClose={() => setOpenCompanyId(null)} />
    </div>
  )
}
