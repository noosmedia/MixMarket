// Kontakte-Seite: Liste aller B2B-Kontakte mit Suche, Status- und Listenfilter, Blättern,
// Anlegen/Bearbeiten-Formular (inklusive Status) und einfachem CSV-Import in eine Liste.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Search, Upload, Trash2, Pencil, Mail, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { PageHeader, PageBody, EmptyState, Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { useJumpTarget, useUi } from '../stores/ui'
import './contacts.css'

// Moegliche Status eines Kontakts
type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained'

// Datenmodell eines Kontakts (entspricht der Backend-Antwort)
interface Contact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  salutation?: 'herr' | 'frau' | null
  academicTitle?: string | null
  company?: string
  position?: string
  website?: string
  country?: string
  sector?: string
  status: ContactStatus
  consent: boolean
  notes?: string
  createdAt: string
  lists: { listId: string }[]
}

// Liste für die Mehrfachauswahl
interface MailList {
  id: string
  name: string
  type: string
  color: string
  contactCount: number
}

// Antwortformat der Kontaktliste
interface ContactsResponse {
  items: Contact[]
  total: number
  page: number
  pageSize: number
}

// Formularzustand für Anlegen/Bearbeiten
interface ContactForm {
  email: string
  salutation: '' | 'herr' | 'frau'
  academicTitle: string
  firstName: string
  lastName: string
  company: string
  position: string
  country: string
  sector: string
  website: string
  notes: string
  consent: boolean
  listIds: string[]
  // Nur beim Bearbeiten: Status des Kontakts
  status: ContactStatus
}

// Kontakte je Seite
const PAGE_SIZE = 50

// Leeres Formular als Ausgangszustand
const emptyForm: ContactForm = {
  email: '',
  salutation: '',
  academicTitle: '',
  firstName: '',
  lastName: '',
  company: '',
  position: '',
  country: '',
  sector: '',
  website: '',
  notes: '',
  consent: false,
  listIds: [],
  status: 'active',
}

// Statusfilter-Optionen für das segmentierte Steuerelement
const STATUS_FILTERS: { key: '' | ContactStatus; labelKey: string }[] = [
  { key: '', labelKey: 'common.all' },
  { key: 'active', labelKey: 'contacts.statusActive' },
  { key: 'unsubscribed', labelKey: 'contacts.statusUnsub' },
  { key: 'bounced', labelKey: 'contacts.statusBounced' },
  { key: 'complained', labelKey: 'contacts.statusComplained' },
]

export function ContactsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()

  // Such- und Filterzustand; eine Liste kann über die Adresse vorgewählt sein (/contacts?list=...)
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | ContactStatus>('')
  const [listFilter, setListFilter] = useState(searchParams.get('list') ?? '')
  const [page, setPage] = useState(1)
  // Ziel-Liste für den Import (optional)
  const [importListId, setImportListId] = useState('')

  // Bei neuem Filter wieder auf der ersten Seite beginnen
  useEffect(() => {
    setPage(1)
  }, [search, status, listFilter])

  // Listenfilter in der Adresse mitführen, damit "Mitglieder anzeigen" und Zurück funktionieren
  useEffect(() => {
    const current = searchParams.get('list') ?? ''
    if (current !== listFilter) {
      const next = new URLSearchParams(searchParams)
      if (listFilter) next.set('list', listFilter)
      else next.delete('list')
      setSearchParams(next, { replace: true })
    }
  }, [listFilter, searchParams, setSearchParams])

  // Modalsteuerung
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyForm)
  const [importText, setImportText] = useState('')

  // Kontakte laden, abhängig von Suche und Status
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['contacts', search, status, listFilter, page],
    queryFn: () =>
      api.get<ContactsResponse>(
        `/api/contacts?search=${encodeURIComponent(search)}&status=${status}&listId=${encodeURIComponent(listFilter)}&page=${page}&pageSize=${PAGE_SIZE}`,
      ),
    placeholderData: (previous) => previous,
  })
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  // Verfügbare Listen für die Mehrfachauswahl
  const { data: lists } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.get<MailList[]>('/api/lists'),
  })

  // Kontakt anlegen oder aktualisieren
  const saveMutation = useMutation({
    mutationFn: async (payload: ContactForm) => {
      // Body zusammenstellen, leere Felder bleiben optional
      const body = {
        email: payload.email,
        // Anrede und Titel für den Platzhalter {{anrede}}; leer heißt keine Angabe
        salutation: payload.salutation || null,
        academicTitle: payload.academicTitle.trim() || null,
        firstName: payload.firstName || undefined,
        lastName: payload.lastName || undefined,
        company: payload.company || undefined,
        position: payload.position || undefined,
        country: payload.country || undefined,
        sector: payload.sector || undefined,
        website: payload.website || undefined,
        notes: payload.notes || undefined,
        consent: payload.consent,
        listIds: payload.listIds,
      }
      if (!editId) return api.post<Contact>('/api/contacts', body)
      // Status getrennt ändern: setzt bzw. hebt auch die Sperre auf
      const saved = await api.put<Contact>(`/api/contacts/${editId}`, body)
      if (saved.status !== payload.status) {
        return api.patch<Contact>(`/api/contacts/${editId}/status`, { status: payload.status })
      }
      return saved
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      notify(
        'success',
        editId
          ? t('contacts.savedEdit', { defaultValue: 'Kontakt aktualisiert' })
          : t('contacts.savedNew', { defaultValue: 'Kontakt angelegt' }),
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

  // Kontakt löschen
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      notify('success', t('contacts.deleted', { defaultValue: 'Kontakt gelöscht' }))
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

  // Kontakte importieren
  const importMutation = useMutation({
    mutationFn: (contacts: Partial<Contact>[]) =>
      api.post<{ created: number; updated: number; skipped: number; total: number }>(
        '/api/contacts/import',
        { contacts, ...(importListId ? { listIds: [importListId] } : {}) },
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      notify(
        'success',
        t('contacts.importDone', { created: res.created, updated: res.updated, skipped: res.skipped }),
      )
      setImportOpen(false)
      setImportText('')
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

  // Formular für einen neuen Kontakt öffnen
  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  // Formular mit vorhandenen Daten öffnen
  function openEdit(contact: Contact) {
    setEditId(contact.id)
    setForm({
      email: contact.email,
      salutation: contact.salutation ?? '',
      academicTitle: contact.academicTitle ?? '',
      firstName: contact.firstName ?? '',
      lastName: contact.lastName ?? '',
      company: contact.company ?? '',
      position: contact.position ?? '',
      country: contact.country ?? '',
      sector: contact.sector ?? '',
      website: contact.website ?? '',
      notes: contact.notes ?? '',
      consent: contact.consent,
      listIds: contact.lists.map((l) => l.listId),
      status: contact.status,
    })
    setFormOpen(true)
  }

  // Sprung aus der Suche: Kontakt laden und zum Bearbeiten öffnen, auch wenn er nicht in der Liste steht
  useJumpTarget(['contacts'], (jump) => {
    api
      .get<Contact>(`/api/contacts/${jump.id}`)
      .then(openEdit)
      .catch(() => notify('error', t('search.notFound')))
  })

  // Formular schließen und zurücksetzen
  function closeForm() {
    setFormOpen(false)
    setEditId(null)
    setForm(emptyForm)
  }

  // Ein Feld im Formular aktualisieren
  function updateField<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Listenauswahl umschalten
  function toggleList(id: string) {
    setForm((prev) => ({
      ...prev,
      listIds: prev.listIds.includes(id)
        ? prev.listIds.filter((x) => x !== id)
        : [...prev.listIds, id],
    }))
  }

  // Löschen mit eigenem Bestätigungsdialog
  async function handleDelete(contact: Contact) {
    const ok = await confirm({
      message: t('contacts.deleteConfirm'),
      danger: true,
      confirmLabel: t('common.delete'),
    })
    if (ok) deleteMutation.mutate(contact.id)
  }

  // Formular absenden
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.trim()) {
      notify(
        'error',
        t('contacts.emailRequired', { defaultValue: 'E-Mail ist erforderlich' }),
      )
      return
    }
    saveMutation.mutate(form)
  }

  // Importtext zeilenweise zerlegen: email,firstName,lastName,company
  function handleImport() {
    const rows = importText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [email, firstName, lastName, company] = line
          .split(',')
          .map((v) => v.trim())
        return { email, firstName, lastName, company } as Partial<Contact>
      })
      .filter((row) => row.email && row.email.includes('@'))

    if (rows.length === 0) {
      notify(
        'warning',
        t('contacts.importEmpty', {
          defaultValue: 'Keine gültigen Zeilen gefunden',
        }),
      )
      return
    }
    importMutation.mutate(rows)
  }

  // Statusabhängige Badge-Klasse ermitteln
  function statusBadgeClass(s: ContactStatus): string {
    if (s === 'active') return 'badge badge-active'
    if (s === 'bounced' || s === 'complained') return 'badge badge-bounced'
    return 'badge badge-unsub'
  }

  // Statuslabel ermitteln
  function statusLabel(s: ContactStatus): string {
    if (s === 'active') return t('contacts.statusActive')
    if (s === 'bounced') return t('contacts.statusBounced')
    if (s === 'complained')
      return t('contacts.statusComplained', { defaultValue: 'Beschwerde' })
    return t('contacts.statusUnsub')
  }

  // Anzeigenamen aus Vor- und Nachname zusammenbauen
  function fullName(c: Contact): string {
    return [c.firstName, c.lastName].filter(Boolean).join(' ')
  }

  const items = data?.items ?? []

  return (
    <>
      <PageHeader help={{ chapter: 'contacts' }}
        eyebrow={t('nav.contacts')}
        title={t('contacts.title')}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={() => setImportOpen(true)} data-tour="contacts-import">
              <Upload size={16} />
              {t('contacts.import')}
            </button>
            <button className="btn btn-primary" onClick={openCreate} data-tour="contacts-add">
              <Plus size={16} />
              {t('contacts.add')}
            </button>
          </div>
        }
      />

      <PageBody>
        {/* Werkzeugleiste: Suche und Statusfilter */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              className="input"
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            className="contacts-filter show-mobile"
            value={status}
            onChange={(v) => setStatus(v as '' | ContactStatus)}
            options={STATUS_FILTERS.map((f) => ({ value: f.key, label: t(f.labelKey) }))}
          />
          <div className="segmented hide-mobile">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key || 'all'}
                className={status === f.key ? 'active' : ''}
                onClick={() => setStatus(f.key)}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>
          <Select
            id="contacts-list-filter"
            className="contacts-filter"
            value={listFilter}
            onChange={setListFilter}
            options={[
              { value: '', label: t('contacts.allLists') },
              ...(lists ?? []).map((l) => ({ value: l.id, label: `${l.name} (${l.contactCount})` })),
            ]}
          />
        </div>

        {/* Inhalt: Ladeanzeige, Leerzustand oder Tabelle */}
        {isLoading ? (
          <Loading />
        ) : isError ? (
          <p className="discovery-note discovery-note-error">
            {error instanceof ApiError ? error.message : t('common.error')}
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={search || status || listFilter ? t('common.noMatches') : t('common.empty')}
            description={search || status || listFilter ? t('contacts.emptyFilteredHint') : t('contacts.emptyHint')}
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} />
                {t('contacts.add')}
              </button>
            }
          />
        ) : (
          <div className="card contacts-table-wrap">
            <table className="table table-stack">
              <thead>
                <tr>
                  <th>{t('contacts.email')}</th>
                  <th>{t('contacts.company')}</th>
                  <th>{t('contacts.sector')}</th>
                  <th>{t('common.status')}</th>
                  <th className="col-actions">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="contact-cell">
                        <span className="contact-email">
                          <Mail size={14} className="contact-email-icon" />
                          {c.email}
                        </span>
                        {fullName(c) && (
                          <span className="contact-name">{fullName(c)}</span>
                        )}
                      </div>
                    </td>
                    <td className="stack-line">
                      {c.company || <span className="cell-empty">{'·'}</span>}
                    </td>
                    <td className="stack-line">
                      {c.sector || <span className="cell-empty">{'·'}</span>}
                    </td>
                    <td>
                      <span className={statusBadgeClass(c.status)}>
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="flex items-center gap-2 row-actions">
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => openEdit(c)}
                          aria-label={t('common.edit')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm btn-danger"
                          onClick={() => handleDelete(c)}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Anzahl und Blättern */}
            <div className="contacts-pager">
              <span className="contacts-count">{t('contacts.count', { count: data?.total ?? 0 })}</span>
              {totalPages > 1 && (
                <div className="contacts-pager-nav">
                  <button
                    className="btn btn-secondary btn-sm btn-icon"
                    onClick={() => page > 1 && setPage(page - 1)}
                    aria-label={t('contacts.prevPage')}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-mono contacts-page">{t('contacts.page', { page, total: totalPages })}</span>
                  <button
                    className="btn btn-secondary btn-sm btn-icon"
                    onClick={() => page < totalPages && setPage(page + 1)}
                    aria-label={t('contacts.nextPage')}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </PageBody>

      {/* Anlegen/Bearbeiten-Modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editId ? t('common.edit') : t('contacts.add')}
        width={620}
        footer={
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={closeForm}>
              {t('common.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              data-tour="contact-save"
            >
              {t('common.save')}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="contact-form" data-tour="contact-form">
          {/* E-Mail (Pflichtfeld) */}
          <div className="field" data-tour="contact-email">
            <label className="field-label" htmlFor="contact-email">{t('contacts.email')} *</label>
            <input
              id="contact-email"
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Anrede und Titel nebeneinander, für die Briefanrede {{anrede}} */}
          <div className="form-row" data-tour="contact-salutation">
            <div className="field">
              <label className="field-label" htmlFor="contact-salutation">
                {t('contacts.salutation')}
              </label>
              <Select
                id="contact-salutation"
                value={form.salutation}
                onChange={(v) => updateField('salutation', v as ContactForm['salutation'])}
                options={[
                  { value: '', label: t('contacts.salutationNone') },
                  { value: 'frau', label: t('contacts.salutationFrau') },
                  { value: 'herr', label: t('contacts.salutationHerr') },
                ]}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="contact-title">
                {t('contacts.academicTitle')}
              </label>
              <input
                id="contact-title"
                className="input"
                type="text"
                value={form.academicTitle}
                onChange={(e) => updateField('academicTitle', e.target.value)}
                placeholder={t('contacts.academicTitlePlaceholder')}
              />
            </div>
          </div>

          {/* Vor- und Nachname nebeneinander */}
          <div className="form-row" data-tour="contact-name">
            <div className="field">
              <label className="field-label">{t('contacts.firstName')}</label>
              <input
                className="input"
                type="text"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">{t('contacts.lastName')}</label>
              <input
                className="input"
                type="text"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
              />
            </div>
          </div>

          {/* Firma und Position nebeneinander */}
          <div className="form-row" data-tour="contact-company">
            <div className="field">
              <label className="field-label">{t('contacts.company')}</label>
              <input
                className="input"
                type="text"
                value={form.company}
                onChange={(e) => updateField('company', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">{t('contacts.position')}</label>
              <input
                className="input"
                type="text"
                value={form.position}
                onChange={(e) => updateField('position', e.target.value)}
              />
            </div>
          </div>

          {/* Land und Sachgebiet nebeneinander */}
          <div className="form-row">
            <div className="field">
              <label className="field-label">{t('contacts.country')}</label>
              <input
                className="input"
                type="text"
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">{t('contacts.sector')}</label>
              <input
                className="input"
                type="text"
                value={form.sector}
                onChange={(e) => updateField('sector', e.target.value)}
              />
            </div>
          </div>

          {/* Webseite */}
          <div className="field">
            <label className="field-label">{t('contacts.website')}</label>
            <input
              className="input"
              type="text"
              value={form.website}
              onChange={(e) => updateField('website', e.target.value)}
            />
          </div>

          {/* Notizen */}
          <div className="field">
            <label className="field-label">{t('contacts.notes')}</label>
            <textarea
              className="textarea"
              rows={3}
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </div>

          {/* Status, nur beim Bearbeiten: abgemeldet, unzustellbar und Beschwerde sperren die Adresse */}
          {editId && (
            <div className="field">
              <label className="field-label" htmlFor="contact-status">
                {t('common.status')}
              </label>
              <Select
                id="contact-status"
                value={form.status}
                onChange={(v) => updateField('status', v as ContactStatus)}
                options={STATUS_FILTERS.filter((f) => f.key).map((f) => ({ value: f.key, label: t(f.labelKey) }))}
              />
              <p className="field-hint">{t('contacts.statusHint')}</p>
            </div>
          )}

          {/* Einwilligung */}
          <div className="field" data-tour="contact-consent">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => updateField('consent', e.target.checked)}
              />
              <span>{t('contacts.consent')}</span>
            </label>
          </div>

          {/* Listen-Mehrfachauswahl */}
          {lists && lists.length > 0 && (
            <div className="field" data-tour="contact-lists">
              <label className="field-label">{t('contacts.addToLists')}</label>
              <div className="list-picker">
                {lists.map((l) => (
                  <label key={l.id} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={form.listIds.includes(l.id)}
                      onChange={() => toggleList(l.id)}
                    />
                    <span className="badge-dot" style={{ background: l.color }} />
                    <span>{l.name}</span>
                    <span className="field-hint list-count">{l.contactCount}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Import-Modal */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title={t('contacts.import')}
        subtitle={t('contacts.importSubtitle', {
          defaultValue: 'Eine Zeile pro Kontakt',
        })}
        width={560}
        footer={
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={() => setImportOpen(false)}>
              {t('common.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importMutation.isPending}
              data-tour="import-submit"
            >
              <Upload size={16} />
              {t('contacts.import')}
            </button>
          </div>
        }
      >
        <div className="field" data-tour="import-text">
          <label className="field-label" htmlFor="import-text">
            {t('contacts.importFormat', {
              defaultValue: 'E-Mail, Vorname, Nachname, Firma',
            })}
          </label>
          <textarea
            id="import-text"
            className="textarea font-mono"
            rows={10}
            placeholder={'max@firma.de, Max, Mustermann, Firma GmbH'}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <p className="field-hint">{t('contacts.importHint')}</p>
        </div>
        <div className="field" data-tour="import-list">
          <label className="field-label" htmlFor="import-list">
            {t('contacts.importList')}
          </label>
          <Select
            id="import-list"
            value={importListId}
            onChange={setImportListId}
            options={[
              { value: '', label: t('contacts.importNoList') },
              ...(lists ?? []).map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
          <p className="field-hint">{t('contacts.importListHint')}</p>
        </div>
      </Modal>
    </>
  )
}
