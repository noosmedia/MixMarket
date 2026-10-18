// Listen-Seite: Verwaltung der Kontaktlisten (anlegen, bearbeiten, löschen).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Plus, Trash2, Pencil } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { PageHeader, PageBody, EmptyState, Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { useJumpTarget, useUi } from '../stores/ui'
import './lists.css'

// Moegliche Listentypen
type ListType = 'normal' | 'unsubscribed' | 'bounced' | 'complained'

// Eine Kontaktliste, wie sie vom Backend geliefert wird
interface List {
  id: string
  name: string
  description?: string
  type: ListType
  color?: string
  contactCount: number
  createdAt: string
}

// Eingabewerte des Formulars (Anlegen und Bearbeiten)
interface ListForm {
  name: string
  description: string
  type: ListType
  color: string
}

// Leeres Formular als Ausgangszustand
const EMPTY_FORM: ListForm = { name: '', description: '', type: 'normal', color: '' }

export function ListsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()

  // Steuert das Modal und haelt die aktuell bearbeitete Liste (oder null beim Anlegen)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<List | null>(null)
  const [form, setForm] = useState<ListForm>(EMPTY_FORM)

  // Alle Listen laden
  const { data: lists, isLoading, isFetching } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.get<List[]>('/api/lists'),
  })

  // Nach Erfolg den Cache erneuern und Modal schließen
  function onSuccess(messageKey: string) {
    queryClient.invalidateQueries({ queryKey: ['lists'] })
    notify('success', t(messageKey))
    closeModal()
  }

  // Fehler als Toast ausgeben
  function onError(error: unknown) {
    const message = error instanceof ApiError ? error.message : t('common.error')
    notify('error', message)
  }

  // Liste anlegen
  const createMutation = useMutation({
    mutationFn: (body: Partial<ListForm>) => api.post<List>('/api/lists', body),
    onSuccess: () => onSuccess('lists.saved'),
    onError,
  })

  // Liste aktualisieren
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ListForm> }) =>
      api.put<List>(`/api/lists/${id}`, body),
    onSuccess: () => onSuccess('lists.saved'),
    onError,
  })

  // Liste löschen
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      notify('success', t('common.deleted'))
    },
    onError,
  })

  // Modal zum Anlegen öffnen
  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  // Modal zum Bearbeiten öffnen, vorhandene Werte übernehmen
  function openEdit(list: List) {
    setEditing(list)
    setForm({
      name: list.name,
      description: list.description ?? '',
      type: list.type,
      color: list.color ?? '',
    })
    setModalOpen(true)
  }

  // Sprung aus der Suche: Liste zum Bearbeiten öffnen, sobald die Listen geladen sind
  useJumpTarget(
    ['lists'],
    (jump) => {
      const list = lists?.find((l) => l.id === jump.id)
      if (list) openEdit(list)
      else notify('error', t('search.notFound'))
    },
    () => !!lists && !isFetching,
  )

  // Modal schließen und Zustand zurücksetzen
  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  // Formular absenden (Anlegen oder Bearbeiten)
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.name.trim()) return

    // Nur gefuellte Felder übermitteln
    const body: Partial<ListForm> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      color: form.color.trim() || undefined,
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, body })
    } else {
      createMutation.mutate(body)
    }
  }

  // Löschen mit eigenem Bestätigungsdialog
  async function handleDelete(list: List) {
    const ok = await confirm({
      message: t('lists.deleteConfirm'),
      danger: true,
      confirmLabel: t('common.delete'),
    })
    if (ok) deleteMutation.mutate(list.id)
  }

  // Passende Badge-Variantenklasse je Typ
  function typeBadgeClass(type: ListType): string {
    if (type === 'unsubscribed') return 'badge-unsub'
    if (type === 'bounced') return 'badge-bounced'
    return 'badge-accent'
  }

  // Lesbarer Typ-Name
  function typeLabel(type: ListType): string {
    if (type === 'unsubscribed') return t('lists.typeUnsub')
    if (type === 'bounced') return t('lists.typeBounced')
    return t('lists.typeNormal')
  }

  // Wird beim Anlegen oder Speichern gerade gearbeitet?
  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <PageHeader help={{ chapter: 'lists' }}
        title={t('lists.title')}
        actions={
          <button className="btn btn-primary" onClick={openCreate} data-tour="lists-add">
            <Plus size={18} />
            {t('lists.add')}
          </button>
        }
      />

      <PageBody>
        {/* Ladezustand */}
        {isLoading ? (
          <Loading />
        ) : !lists || lists.length === 0 ? (
          // Leerzustand mit Aktion zum Anlegen
          <EmptyState
            icon={<FolderOpen size={28} />}
            title={t('common.empty')}
            description={t('lists.emptyHint')}
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={18} />
                {t('lists.add')}
              </button>
            }
          />
        ) : (
          // Integrierte Zeilen-Liste mit allen Listen
          <div className="data-list">
            {lists.map((list) => (
              <div className="data-row" key={list.id}>
                {/* Hauptbereich: Name und Beschreibung */}
                <div className="data-row-main">
                  <div className="data-row-title">
                    {/* Optionaler Farbpunkt vor dem Namen */}
                    {list.color && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: list.color,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {list.name}
                  </div>
                  {list.description && (
                    <div className="data-row-meta">{list.description}</div>
                  )}
                </div>

                {/* Nebenbereich: Typ-Badge, Kontaktanzahl und Aktionen */}
                <div className="data-row-aside">
                  <span className={`badge ${typeBadgeClass(list.type)}`}>
                    {typeLabel(list.type)}
                  </span>
                  {/* Kontaktanzahl führt zu den Mitgliedern der Liste */}
                  <button
                    type="button"
                    className="list-members-link font-mono"
                    data-tour="list-members"
                    data-list-id={list.id}
                    onClick={() => navigate(`/contacts?list=${list.id}`)}
                    aria-label={t('lists.showMembers', { name: list.name })}
                  >
                    {list.contactCount} {t('lists.contacts')}
                  </button>
                  <div className="data-row-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEdit(list)}
                      aria-label={t('common.edit')}
                    >
                      <Pencil size={14} />
                      <span className="btn-label">{t('common.edit')}</span>
                    </button>
                    <button
                      className="btn btn-sm btn-icon btn-ghost"
                      aria-label={t('common.delete')}
                      onClick={() => handleDelete(list)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>

      {/* Modal zum Anlegen und Bearbeiten */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? t('lists.edit') : t('lists.add')}
        footer={
          <>
            <button className="btn btn-ghost" onClick={closeModal}>
              {t('common.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              aria-disabled={saving}
              data-tour="list-save"
            >
              {t('common.save')}
            </button>
          </>
        }
      >
        <form className="list-form" onSubmit={handleSubmit}>
          {/* Name (Pflichtfeld) */}
          <div className="field" data-tour="list-name">
            <label className="field-label" htmlFor="list-name">
              {t('common.name')}
            </label>
            <input
              id="list-name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
              required
            />
          </div>

          {/* Beschreibung */}
          <div className="field" data-tour="list-desc">
            <label className="field-label" htmlFor="list-desc">
              {t('lists.description')}
            </label>
            <textarea
              id="list-desc"
              className="textarea"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Typ */}
          <div className="field" data-tour="list-type">
            <label className="field-label" htmlFor="list-type">
              {t('lists.type')}
            </label>
            <Select
              id="list-type"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v as ListType })}
              options={[
                { value: 'normal', label: t('lists.typeNormal') },
                { value: 'unsubscribed', label: t('lists.typeUnsub') },
                { value: 'bounced', label: t('lists.typeBounced') },
              ]}
            />
          </div>

          {/* Farbe (optional) */}
          <div className="field">
            <label className="field-label" htmlFor="list-color">
              {t('lists.color')}
            </label>
            <input
              id="list-color"
              className="input"
              type="text"
              placeholder="#0066ff"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </>
  )
}
