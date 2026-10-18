// Kampagnen-Seite: Verwaltung der E-Mail-Kampagnen (anlegen, bearbeiten, planen,
// versenden, abbrechen, löschen). Folgt den Mustern der uebrigen Seiten.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Plus, Trash2, Pencil, Clock, Play, X, Mail, Users } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { PageHeader, PageBody, EmptyState, Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { DateTimePicker } from '../components/DateTimePicker'
import { flashRow, useJumpTarget, useUi } from '../stores/ui'
import './campaigns.css'

// Moegliche Statuswerte einer Kampagne
type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'

// Verknuepfte Liste einer Kampagne (Backend liefert verschachtelte Struktur)
interface CampaignList {
  list: { id: string; name: string }
}

// Eine Kampagne, wie sie vom Backend geliefert wird
interface Campaign {
  id: string
  name: string
  subject: string
  fromName: string
  fromEmail: string
  templateId?: string
  status: CampaignStatus
  scheduledAt?: string
  sentAt?: string
  totalCount: number
  sentCount: number
  openCount: number
  clickCount: number
  unsubCount: number
  bounceCount: number
  createdAt: string
  lists: CampaignList[]
  template?: { name: string }
}

// Eine auswählbare Vorlage; ihr Betreff dient als Vorschlag für den Kampagnenbetreff
interface Template {
  id: string
  name: string
  subject?: string
}

// Eine auswählbare Liste samt Kontaktanzahl
interface ListOption {
  id: string
  name: string
  contactCount: number
}

// Ergebnis der Empfängerprüfung vor dem Versand
interface RecipientCheck {
  count: number
  withoutConsent: number
  researchWithoutConsent: number
  usesHook: boolean
  missingHook: number
  missingTemplate: boolean
  missingPostalAddress: boolean
}

// Pflichtfelder des Formulars, die als fehlerhaft markiert werden können
type FormField = 'name' | 'subject' | 'fromName' | 'fromEmail' | 'templateId'

// Eingabewerte des Anlegen- und Bearbeiten-Formulars
interface CampaignForm {
  name: string
  subject: string
  fromName: string
  fromEmail: string
  templateId: string
  listIds: string[]
  scheduledAt: string // lokale Zeit ohne Zeitzone, Format wie datetime-local (JJJJ-MM-TTTHH:MM)
}

// Leeres Formular als Ausgangszustand
const EMPTY_FORM: CampaignForm = {
  name: '',
  subject: '',
  fromName: '',
  fromEmail: '',
  templateId: '',
  listIds: [],
  scheduledAt: '',
}

// Wandelt einen ISO-Zeitstempel in den lokalen Wert der Datums-/Zeitauswahl um
function isoToLocalInput(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  // Zeitzonen-Versatz abziehen, damit die lokale Zeit im Eingabefeld erscheint
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function CampaignsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()

  // Steuert das Haupt-Modal und haelt die aktuell bearbeitete Kampagne (oder null beim Anlegen)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM)
  // Felder, die beim letzten Speichern fehlten oder ungültig waren
  const [invalid, setInvalid] = useState<FormField[]>([])

  // Steuert das separate Planen-Modal samt Zielkampagne und gewähltem Zeitpunkt
  const [scheduleTarget, setScheduleTarget] = useState<Campaign | null>(null)
  const [scheduleValue, setScheduleValue] = useState('')
  // Hinweise zu den Empfängern der zu planenden Kampagne
  const [scheduleWarnings, setScheduleWarnings] = useState<string[]>([])

  // Alle Kampagnen laden
  const { data: campaigns, isLoading, isFetching } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<Campaign[]>('/api/campaigns'),
  })

  // Vorlagen für die Auswahl laden
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<Template[]>('/api/templates'),
  })

  // Listen für die Mehrfachauswahl laden
  const { data: lists } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.get<ListOption[]>('/api/lists'),
  })

  // Absender aus dem Postfach als Vorschlag für neue Kampagnen
  const { data: mailbox } = useQuery({
    queryKey: ['mailboxSettings'],
    queryFn: () => api.get<{ mailFromName: string; mailFromAddress: string; smtpUser: string }>('/api/settings/mailbox'),
  })

  // Fehler einheitlich als Toast ausgeben
  function onError(error: unknown) {
    const message =
      error instanceof ApiError
        ? error.message
        : t('common.error')
    notify('error', message)
  }

  // Cache der Kampagnen erneuern
  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  }

  // Kampagne anlegen
  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<Campaign>('/api/campaigns', body),
    onSuccess: () => {
      refresh()
      notify('success', t('campaigns.saved'))
      closeModal()
    },
    onError,
  })

  // Kampagne aktualisieren
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.put<Campaign>(`/api/campaigns/${id}`, body),
    onSuccess: () => {
      refresh()
      notify('success', t('campaigns.saved'))
      closeModal()
    },
    onError,
  })

  // Kampagne sofort versenden
  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post<void>(`/api/campaigns/${id}/send`),
    onSuccess: () => {
      refresh()
      notify('success', t('campaigns.statusSending', { defaultValue: 'Wird versendet' }))
    },
    onError,
  })

  // Kampagne planen
  const scheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      api.post<void>(`/api/campaigns/${id}/schedule`, { scheduledAt }),
    onSuccess: () => {
      refresh()
      notify('success', t('campaigns.statusScheduled', { defaultValue: 'Geplant' }))
      closeSchedule()
    },
    onError,
  })

  // Geplante Kampagne abbrechen
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post<void>(`/api/campaigns/${id}/cancel`),
    onSuccess: () => {
      refresh()
      notify('success', t('campaigns.unscheduled'))
    },
    onError,
  })

  // Kampagne löschen
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/campaigns/${id}`),
    onSuccess: () => {
      refresh()
      notify('success', t('common.deleted'))
    },
    onError,
  })

  // Modal zum Anlegen öffnen
  function openCreate() {
    setEditing(null)
    setInvalid([])
    // Absender aus dem Postfach vorschlagen
    const fromEmail = mailbox?.mailFromAddress || (mailbox?.smtpUser?.includes('@') ? mailbox.smtpUser : '')
    setForm({ ...EMPTY_FORM, fromName: mailbox?.mailFromName ?? '', fromEmail: fromEmail ?? '' })
    setModalOpen(true)
  }

  // Modal zum Bearbeiten öffnen, vorhandene Werte übernehmen
  function openEdit(campaign: Campaign) {
    setEditing(campaign)
    setInvalid([])
    setForm({
      name: campaign.name,
      subject: campaign.subject,
      fromName: campaign.fromName,
      fromEmail: campaign.fromEmail,
      templateId: campaign.templateId ?? '',
      listIds: campaign.lists.map((entry) => entry.list.id),
      scheduledAt: isoToLocalInput(campaign.scheduledAt),
    })
    setModalOpen(true)
  }

  // Sprung aus der Suche: Entwurf zum Bearbeiten öffnen, sonst die Kampagne in der Liste zeigen
  useJumpTarget(
    ['campaigns'],
    (jump) => {
      const campaign = campaigns?.find((c) => c.id === jump.id)
      if (!campaign) notify('error', t('search.notFound'))
      else if (campaign.status === 'draft' || campaign.status === 'cancelled') openEdit(campaign)
      else flashRow(campaign.id)
    },
    () => !!campaigns && !isFetching,
  )

  // Haupt-Modal schließen und Zustand zurücksetzen
  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  // Eine Liste in der Mehrfachauswahl an- oder abwählen
  function toggleList(id: string) {
    setForm((prev) => ({
      ...prev,
      listIds: prev.listIds.includes(id)
        ? prev.listIds.filter((value) => value !== id)
        : [...prev.listIds, id],
    }))
  }

  // Formular absenden (Anlegen oder Bearbeiten)
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    // Pflichtfelder prüfen und fehlende rot markieren, statt still nichts zu tun
    const missing: FormField[] = []
    if (!form.name.trim()) missing.push('name')
    if (!form.subject.trim()) missing.push('subject')
    if (!form.fromName.trim()) missing.push('fromName')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.fromEmail.trim())) missing.push('fromEmail')
    // Geplant werden kann nur mit Vorlage
    if (form.scheduledAt && !form.templateId) missing.push('templateId')
    setInvalid(missing)
    if (missing.length) {
      notify('error', missing.includes('templateId') && missing.length === 1 ? t('campaigns.templateRequired') : t('campaigns.requiredMissing'))
      return
    }

    // Nutzdaten zusammenstellen, leere Felder bleiben weg
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      subject: form.subject.trim(),
      fromName: form.fromName.trim(),
      fromEmail: form.fromEmail.trim(),
      templateId: form.templateId || undefined,
      listIds: form.listIds,
      // Zuerst als Entwurf speichern; ein Zeitpunkt wird danach wie beim Knopf "Planen" geplant,
      // damit Empfängerprüfung und Warnhinweise auch hier greifen
      scheduledAt: null,
    }
    const scheduleAt = form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null

    void (async () => {
      let saved: Campaign
      try {
        saved = editing
          ? await updateMutation.mutateAsync({ id: editing.id, body })
          : await createMutation.mutateAsync(body)
      } catch {
        // Fehler meldet die Mutation selbst
        return
      }
      if (!scheduleAt) return
      const check = await checkRecipients(saved)
      if (!check) {
        notify('info', t('campaigns.savedAsDraft'))
        return
      }
      const ok = await confirm({
        message: t('campaigns.scheduleConfirm', { count: check.count, at: formatDateTime(scheduleAt) }),
        confirmLabel: t('campaigns.schedule', { defaultValue: 'Planen' }),
        warnings: check.warnings,
      })
      if (ok) scheduleMutation.mutate({ id: saved.id, scheduledAt: scheduleAt })
      else notify('info', t('campaigns.savedAsDraft'))
    })()
  }

  // Sofortversand: zuerst Empfängerzahl laden, dann bestätigen lassen
  // Empfänger prüfen: Anzahl nach Sperrliste und Warnhinweise (Recherche ohne Einwilligung, fehlender Ansatzpunkt)
  async function checkRecipients(campaign: Campaign): Promise<{ count: number; warnings: string[] } | null> {
    try {
      const result = await api.get<RecipientCheck>(`/api/campaigns/${campaign.id}/recipients`)
      // Ohne Vorlage oder Empfänger ist kein Versand möglich
      if (result.missingTemplate) {
        notify('error', t('campaigns.templateRequired'))
        return null
      }
      if (result.count === 0) {
        notify('error', t('campaigns.noRecipients'))
        return null
      }
      const warnings: string[] = []
      if (result.withoutConsent > 0) {
        warnings.push(
          result.researchWithoutConsent > 0
            ? t('campaigns.warnConsentResearch', { count: result.withoutConsent, research: result.researchWithoutConsent })
            : t('campaigns.warnConsent', { count: result.withoutConsent }),
        )
      }
      if (result.usesHook && result.missingHook > 0) warnings.push(t('campaigns.warnHook', { count: result.missingHook, ansatz: '{{ansatz}}' }))
      if (result.missingPostalAddress) warnings.push(t('campaigns.warnPostalAddress'))
      return { count: result.count, warnings }
    } catch (error) {
      onError(error)
      return null
    }
  }

  async function handleSend(campaign: Campaign) {
    const check = await checkRecipients(campaign)
    if (!check) return
    // Pausierte Kampagne: Versand fortsetzen, bereits versendete Mails werden übersprungen
    const resume = campaign.status === 'paused'
    // Versand bleibt möglich, die Warnungen stehen deutlich im Dialog
    const ok = await confirm({
      message: resume ? t('campaigns.resumeConfirm') : t('campaigns.sendConfirm', { count: check.count }),
      confirmLabel: resume ? t('campaigns.resume') : t('campaigns.sendNow', { defaultValue: 'Jetzt versenden' }),
      warnings: check.warnings,
    })
    if (ok) sendMutation.mutate(campaign.id)
  }

  // Planen-Modal mit vorhandenem Zeitpunkt öffnen
  function openSchedule(campaign: Campaign) {
    setScheduleTarget(campaign)
    setScheduleValue(isoToLocalInput(campaign.scheduledAt))
    setScheduleWarnings([])
    void checkRecipients(campaign).then((check) => setScheduleWarnings(check?.warnings ?? []))
  }

  // Planen-Modal schließen
  function closeSchedule() {
    setScheduleTarget(null)
    setScheduleValue('')
  }

  // Geplanten Zeitpunkt bestätigen und an das Backend schicken
  function handleSchedule(event: React.FormEvent) {
    event.preventDefault()
    if (!scheduleTarget) return
    // Ohne Zeitpunkt nicht still abbrechen, sondern Bescheid geben
    if (!scheduleValue) {
      notify('error', t('campaigns.scheduleRequired'))
      return
    }
    scheduleMutation.mutate({
      id: scheduleTarget.id,
      scheduledAt: new Date(scheduleValue).toISOString(),
    })
  }

  // Geplante Kampagne abbrechen (mit Bestätigung)
  async function handleCancel(campaign: Campaign) {
    const ok = await confirm({
      message: t('campaigns.unscheduleConfirm'),
      confirmLabel: t('campaigns.unschedule'),
    })
    if (ok) cancelMutation.mutate(campaign.id)
  }

  // Kampagne löschen (mit Bestätigung)
  async function handleDelete(campaign: Campaign) {
    const ok = await confirm({
      message: t('campaigns.deleteConfirm', {
        defaultValue: 'Möchten Sie diese Kampagne wirklich löschen?',
      }),
      danger: true,
      confirmLabel: t('common.delete'),
    })
    if (ok) deleteMutation.mutate(campaign.id)
  }

  // Passende Badge-Klasse je Status
  function badgeClass(status: CampaignStatus): string {
    if (status === 'scheduled') return 'badge badge-warning'
    if (status === 'sending') return 'badge badge-info'
    if (status === 'sent') return 'badge badge-active'
    // Pausiert nach einem Abbruch: braucht Aufmerksamkeit
    if (status === 'paused') return 'badge badge-bounced'
    // draft, cancelled
    return 'badge badge-unsub'
  }

  // Lesbarer Status-Text
  function statusLabel(status: CampaignStatus): string {
    switch (status) {
      case 'scheduled':
        return t('campaigns.statusScheduled', { defaultValue: 'Geplant' })
      case 'sending':
        return t('campaigns.statusSending', { defaultValue: 'Wird versendet' })
      case 'sent':
        return t('campaigns.statusSent', { defaultValue: 'Versendet' })
      case 'cancelled':
        return t('campaigns.statusCancelled', { defaultValue: 'Abgebrochen' })
      case 'paused':
        return t('campaigns.statusPaused')
      default:
        return t('campaigns.statusDraft', { defaultValue: 'Entwurf' })
    }
  }

  // Datum und Uhrzeit lesbar formatieren
  function formatDateTime(iso?: string): string {
    if (!iso) return ''
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Wird beim Anlegen oder Speichern gerade gearbeitet?
  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <PageHeader help={{ chapter: 'campaigns' }}
        title={t('campaigns.title')}
        actions={
          <button className="btn btn-primary" onClick={openCreate} data-tour="campaigns-add">
            <Plus size={18} />
            {t('campaigns.add', { defaultValue: 'Neue Kampagne' })}
          </button>
        }
      />

      <PageBody>
        {/* Ladezustand */}
        {isLoading ? (
          <Loading />
        ) : !campaigns || campaigns.length === 0 ? (
          // Leerzustand mit Aktion zum Anlegen
          <EmptyState
            icon={<Mail size={28} />}
            title={t('common.empty')}
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={18} />
                {t('campaigns.add', { defaultValue: 'Neue Kampagne' })}
              </button>
            }
          />
        ) : (
          // Tabelle aller Kampagnen
          <div className="panel campaigns-panel">
            <table className="table table-stack campaigns-table">
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} data-row-id={campaign.id}>
                    {/* Name und Betreff */}
                    <td className="campaign-main">
                      <div className="campaign-name font-display">{campaign.name}</div>
                      <div className="campaign-subject">{campaign.subject}</div>
                    </td>

                    {/* Status-Badge */}
                    <td className="campaign-status-cell">
                      <span className={badgeClass(campaign.status)}>
                        {statusLabel(campaign.status)}
                      </span>
                      {campaign.status === 'scheduled' && campaign.scheduledAt && (
                        <div className="campaign-scheduled-at">
                          <Clock size={13} />
                          <span>{formatDateTime(campaign.scheduledAt)}</span>
                        </div>
                      )}
                    </td>

                    {/* Kennzahlen */}
                    <td className="campaign-metrics" data-tour="campaign-metrics">
                      <div className="metric">
                        <span className="metric-label">
                          {t('campaigns.statusSent', { defaultValue: 'Versendet' })}
                        </span>
                        <span className="metric-value font-mono">{campaign.sentCount}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">
                          {t('campaigns.opens', { defaultValue: 'Öffnungen' })}
                        </span>
                        <span className="metric-value font-mono">{campaign.openCount}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">
                          {t('campaigns.clicks', { defaultValue: 'Klicks' })}
                        </span>
                        <span className="metric-value font-mono">{campaign.clickCount}</span>
                      </div>
                    </td>

                    {/* Aktionen je nach Status */}
                    <td className="campaign-actions">
                      {(campaign.status === 'draft' || campaign.status === 'cancelled') && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSend(campaign)}
                            data-tour="campaign-send"
                          >
                            <Play size={15} />
                            {t('campaigns.sendNow', { defaultValue: 'Jetzt versenden' })}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openSchedule(campaign)}
                            data-tour="campaign-plan"
                          >
                            <Clock size={15} />
                            {t('campaigns.schedule', { defaultValue: 'Planen' })}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => openEdit(campaign)}
                            aria-label={t('common.edit')}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDelete(campaign)}
                            aria-label={t('common.delete')}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}

                      {campaign.status === 'scheduled' && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCancel(campaign)}
                          >
                            <X size={15} />
                            {t('campaigns.unschedule')}
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDelete(campaign)}
                            aria-label={t('common.delete')}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}

                      {(campaign.status === 'sent' || campaign.status === 'sending') && (
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(campaign)}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}

                      {/* Nach einem Abbruch pausiert: Versand fortsetzen */}
                      {campaign.status === 'paused' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleSend(campaign)}>
                          <Play size={15} />
                          {t('campaigns.resume')}
                        </button>
                      )}

                      {/* Pausiert: Löschen */}
                      {campaign.status === 'paused' && (
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(campaign)}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>

      {/* Modal zum Anlegen und Bearbeiten */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? t('campaigns.edit') : t('campaigns.add', { defaultValue: 'Neue Kampagne' })}
        width={620}
        footer={
          <>
            <button className="btn btn-ghost" onClick={closeModal}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} aria-disabled={saving} data-tour="campaign-save">
              {t('common.save')}
            </button>
          </>
        }
      >
        <form className="campaign-form" onSubmit={handleSubmit}>
          {/* Name (Pflichtfeld) */}
          <div className="field" data-tour="campaign-name">
            <label className="field-label" htmlFor="campaign-name">
              {t('campaigns.name')} *
            </label>
            <input
              id="campaign-name"
              className={`input${invalid.includes('name') ? ' is-invalid' : ''}`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
              required
            />
          </div>

          {/* Betreff (Pflichtfeld) */}
          <div className="field" data-tour="campaign-subject">
            <label className="field-label" htmlFor="campaign-subject">
              {t('campaigns.subject', { defaultValue: 'Betreff' })} *
            </label>
            <input
              id="campaign-subject"
              className={`input${invalid.includes('subject') ? ' is-invalid' : ''}`}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>

          {/* Absendername und Absenderadresse nebeneinander, auf dem Handy untereinander */}
          <div className="campaign-sender" data-tour="campaign-sender">
            <div className="field flex-1">
              <label className="field-label" htmlFor="campaign-from-name">
                {t('campaigns.fromName', { defaultValue: 'Absendername' })} *
              </label>
              <input
                id="campaign-from-name"
                className={`input${invalid.includes('fromName') ? ' is-invalid' : ''}`}
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
              />
            </div>
            <div className="field flex-1">
              <label className="field-label" htmlFor="campaign-from-email">
                {t('campaigns.fromEmail', { defaultValue: 'Absenderadresse' })} *
              </label>
              <input
                id="campaign-from-email"
                className={`input${invalid.includes('fromEmail') ? ' is-invalid' : ''}`}
                type="email"
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
              />
            </div>
          </div>

          {/* Vorlagenauswahl */}
          <div className="field" data-tour="campaign-template">
            <label className="field-label" htmlFor="campaign-template">
              {t('campaigns.template', { defaultValue: 'Vorlage' })}
            </label>
            <Select
              id="campaign-template"
              className={invalid.includes('templateId') ? 'is-invalid' : ''}
              value={form.templateId}
              onChange={(v) => {
                // Leeren Betreff mit dem Betreff der Vorlage füllen
                const template = templates?.find((x) => x.id === v)
                setForm({ ...form, templateId: v, subject: form.subject.trim() ? form.subject : (template?.subject ?? '') })
              }}
              options={[
                { value: '', label: t('campaigns.noTemplate') },
                ...(templates ?? []).map((template) => ({ value: template.id, label: template.name })),
              ]}
            />
            <span className="field-hint">{t('campaigns.templateHint')}</span>
          </div>

          {/* Listenauswahl als Mehrfach-Checkboxen */}
          <div className="field" data-tour="campaign-lists">
            <label className="field-label">{t('campaigns.lists', { defaultValue: 'Listen' })}</label>
            <div className="campaign-lists">
              {!lists || lists.length === 0 ? (
                <span className="field-hint">{t('common.empty')}</span>
              ) : (
                lists.map((list) => (
                  <label key={list.id} className="campaign-list-option">
                    <input
                      type="checkbox"
                      checked={form.listIds.includes(list.id)}
                      onChange={() => toggleList(list.id)}
                    />
                    <span className="campaign-list-name">{list.name}</span>
                    <span className="campaign-list-count font-mono">
                      <Users size={13} />
                      {list.contactCount}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Optionaler Versandzeitpunkt */}
          <div className="field" data-tour="campaign-schedule">
            <label className="field-label" htmlFor="campaign-scheduled">
              {t('campaigns.scheduledFor', { defaultValue: 'Geplant für' })}
            </label>
            <DateTimePicker
              id="campaign-scheduled"
              value={form.scheduledAt}
              onChange={(v) => setForm({ ...form, scheduledAt: v })}
              min={new Date()}
              clearable
            />
            <span className="field-hint">
              {t('campaigns.scheduleHint', {
                defaultValue: 'Leer lassen, um die Kampagne als Entwurf zu speichern.',
              })}
            </span>
          </div>
        </form>
      </Modal>

      {/* Separates Modal zum Planen einer Kampagne */}
      <Modal
        open={scheduleTarget !== null}
        onClose={closeSchedule}
        title={t('campaigns.schedule', { defaultValue: 'Planen' })}
        width={440}
        footer={
          <>
            <button className="btn btn-ghost" onClick={closeSchedule}>
              {t('common.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSchedule}
              aria-disabled={scheduleMutation.isPending}
            >
              <Send size={16} />
              {t('campaigns.schedule', { defaultValue: 'Planen' })}
            </button>
          </>
        }
      >
        <form className="campaign-form" onSubmit={handleSchedule}>
          <div className="field">
            <label className="field-label" htmlFor="schedule-at">
              {t('campaigns.scheduledFor', { defaultValue: 'Geplant für' })}
            </label>
            <DateTimePicker
              id="schedule-at"
              value={scheduleValue}
              onChange={setScheduleValue}
              min={new Date()}
              autoFocus
            />
          </div>
          {/* Warnhinweise zu den Empfängern, Planen bleibt möglich */}
          {scheduleWarnings.length > 0 && (
            <ul className="confirm-list confirm-warnings">
              {scheduleWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </form>
      </Modal>
    </>
  )
}
