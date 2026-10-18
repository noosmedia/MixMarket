// Sperrliste: E-Mail-Adressen, die niemals wieder angeschrieben werden duerfen.
// Filterung nach Grund, manuelles Sperren und Freigeben einzelner Adressen.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldBan, Plus, Trash2, Search, Undo2 } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { PageHeader, PageBody, EmptyState, Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { flashRow, useJumpTarget, useUi } from '../stores/ui'
import './suppression.css'

// Moegliche Sperrgruende
type Reason = 'unsubscribed' | 'bounced' | 'complained' | 'manual'

// Ein Eintrag der Sperrliste
interface SuppressionEntry {
  id: string
  email: string
  reason: Reason
  note?: string
  createdAt: string
}

// Antwortformat der Liste
interface SuppressionResponse {
  items: SuppressionEntry[]
  total: number
}

// Filterwert: 'all' steht für alle Gruende, sonst ein konkreter Grund
type Filter = 'all' | Reason

export function SuppressionPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()

  // Aktiver Grund-Filter der Segmentleiste
  const [filter, setFilter] = useState<Filter>('all')
  // Freitextsuche über die E-Mail-Adressen
  const [search, setSearch] = useState('')
  // Steuerung des Modals zum Sperren einer Adresse
  const [modalOpen, setModalOpen] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formReason, setFormReason] = useState<Reason>('manual')
  const [formNote, setFormNote] = useState('')

  // Bei aktivem Filter den Grund als Query-Parameter mitgeben
  const reasonParam = filter === 'all' ? undefined : filter

  // Liste laden, Cache-Key hängt am gewählten Grund
  const { data, isLoading } = useQuery({
    queryKey: ['suppression', reasonParam ?? 'all'],
    queryFn: () =>
      api.get<SuppressionResponse>(
        `/api/suppression${reasonParam ? `?reason=${reasonParam}` : ''}`,
      ),
  })

  // Adresse sperren
  const addMutation = useMutation({
    mutationFn: (body: { email: string; reason: Reason; note?: string }) =>
      api.post<SuppressionEntry>('/api/suppression', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppression'] })
      notify('success', t('suppression.added'))
      closeModal()
    },
    onError: (error) => {
      // Fehlermeldung des Backends weiterreichen, sonst generischer Hinweis
      const message = error instanceof ApiError ? error.message : t('suppression.addError')
      notify('error', message)
    },
  })

  // Adresse wieder freigeben
  const releaseMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/suppression/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppression'] })
      notify('success', t('suppression.released'))
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : t('suppression.releaseError')
      notify('error', message)
    },
  })

  // Modal schließen und Formular zurücksetzen
  function closeModal() {
    setModalOpen(false)
    setFormEmail('')
    setFormReason('manual')
    setFormNote('')
  }

  // Formular absenden
  function handleSubmit() {
    const email = formEmail.trim()
    // Ohne Eingabe rot markieren statt still abzuweisen
    if (!email) {
      notify('warning', t('suppression.emailRequired'))
      return
    }
    addMutation.mutate({ email, reason: formReason, note: formNote.trim() || undefined })
  }

  // Freigeben mit eigenem Bestätigungsdialog (kein window.confirm)
  async function handleRelease(entry: SuppressionEntry) {
    const ok = await confirm({
      message: t('suppression.confirmRelease', { email: entry.email }),
      confirmLabel: t('suppression.release'),
      danger: true,
    })
    if (ok) releaseMutation.mutate(entry.id)
  }

  // Sprung aus der Suche: Adresse ins Suchfeld übernehmen und den Eintrag hervorheben
  useJumpTarget(
    ['suppression'],
    (jump) => {
      setFilter('all')
      setSearch(jump.title ?? '')
      flashRow(jump.id)
    },
    () => !!data,
  )

  // Sichtbare Einträge nach Freitextsuche filtern
  const term = search.trim().toLowerCase()
  const items = (data?.items ?? []).filter((e) =>
    term ? e.email.toLowerCase().includes(term) : true,
  )

  // Beschriftung je Grund (übersetzt)
  const reasonLabel: Record<Reason, string> = {
    unsubscribed: t('suppression.reasonUnsub'),
    bounced: t('suppression.reasonBounced'),
    complained: t('suppression.reasonComplained'),
    manual: t('suppression.reasonManual'),
  }

  // Badge-Klasse je Grund
  const reasonBadge: Record<Reason, string> = {
    unsubscribed: 'badge-unsub',
    bounced: 'badge-bounced',
    complained: 'badge-warning',
    manual: 'badge-info',
  }

  // Segmente der Filterleiste
  const segments: { key: Filter; label: string }[] = [
    { key: 'all', label: t('common.all') },
    { key: 'unsubscribed', label: t('suppression.reasonUnsub') },
    { key: 'bounced', label: t('suppression.reasonBounced') },
    { key: 'complained', label: t('suppression.reasonComplained') },
    { key: 'manual', label: t('suppression.reasonManual') },
  ]

  // Datum lesbar formatieren
  function formatDate(value: string): string {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <>
      <PageHeader help={{ chapter: 'suppression' }}
        eyebrow={t('suppression.title')}
        title={t('suppression.title')}
        subtitle={t('suppression.subtitle')}
        actions={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} data-tour="suppression-add">
            <Plus size={17} />
            {t('suppression.add')}
          </button>
        }
      />

      <PageBody>
        {/* Werkzeugleiste mit Grund-Filter und Suche */}
        <div className="toolbar" data-tour="suppression-toolbar">
          {/* Handy: Auswahlfeld statt Filterleiste, die fünf Filter passen nicht nebeneinander */}
          <Select
            className="show-mobile suppression-filter"
            value={filter}
            onChange={(v) => setFilter(v as typeof filter)}
            options={segments.map((seg) => ({ value: seg.key, label: seg.label }))}
            aria-label={t('suppression.reason')}
          />
          <div className="segmented hide-mobile">
            {segments.map((seg) => (
              <button
                key={seg.key}
                className={filter === seg.key ? 'active' : ''}
                onClick={() => setFilter(seg.key)}
              >
                {seg.label}
              </button>
            ))}
          </div>

          <div className="search-box">
            <Search size={16} />
            <input
              className="input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
            />
          </div>
        </div>

        {/* Ladezustand, Leerzustand oder Tabelle */}
        {isLoading ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ShieldBan size={40} />}
            title={t('common.empty')}
            description={t('suppression.emptyHint')}
            action={
              <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                <Plus size={17} />
                {t('suppression.add')}
              </button>
            }
          />
        ) : (
          <div className="panel">
            <table className="table table-stack">
              <thead>
                <tr>
                  <th>{t('suppression.email')}</th>
                  <th>{t('suppression.reason')}</th>
                  <th className="col-date">{t('suppression.date')}</th>
                  <th className="col-action" />
                </tr>
              </thead>
              <tbody>
                {items.map((entry) => (
                  <tr key={entry.id} data-row-id={entry.id}>
                    <td className="font-mono">{entry.email}</td>
                    <td>
                      <span className={`badge ${reasonBadge[entry.reason]}`}>
                        {reasonLabel[entry.reason]}
                      </span>
                    </td>
                    <td className="font-mono col-date">{formatDate(entry.createdAt)}</td>
                    <td className="col-action">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRelease(entry)}
                        data-tour="suppression-release"
                      >
                        <Undo2 size={16} />
                        {t('suppression.release')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>

      {/* Modal zum Sperren einer neuen Adresse */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={t('suppression.add')}
        subtitle={t('suppression.hint')}
        footer={
          <>
            <button className="btn btn-ghost" onClick={closeModal}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} data-tour="suppression-save">
              {t('common.save')}
            </button>
          </>
        }
      >
        <div className="field" data-tour="sup-email">
          <label className="field-label" htmlFor="sup-email">
            {t('suppression.email')}
          </label>
          <input
            id="sup-email"
            className="input"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="name@beispiel.de"
            autoFocus
          />
        </div>

        <div className="field" data-tour="sup-reason">
          <label className="field-label" htmlFor="sup-reason">
            {t('suppression.reason')}
          </label>
          <Select
            id="sup-reason"
            value={formReason}
            onChange={(v) => setFormReason(v as Reason)}
            options={[
              { value: 'manual', label: t('suppression.reasonManual') },
              { value: 'unsubscribed', label: t('suppression.reasonUnsub') },
              { value: 'bounced', label: t('suppression.reasonBounced') },
              { value: 'complained', label: t('suppression.reasonComplained') },
            ]}
          />
        </div>

        <div className="field" data-tour="sup-note">
          <label className="field-label" htmlFor="sup-note">
            {t('suppression.note')}
          </label>
          <input
            id="sup-note"
            className="input"
            type="text"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
          />
        </div>
      </Modal>
    </>
  )
}
