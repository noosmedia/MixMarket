// Vorlagen-Seite: Verwaltung der E-Mail-Vorlagen (anlegen, bearbeiten, löschen)
// samt Live-Vorschau und klickbaren Platzhaltern.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Trash2, Pencil, Eye, Code2, Layers } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { PageHeader, PageBody, EmptyState, Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { Select } from '../components/Select'
import { useJumpTarget, useUi } from '../stores/ui'
import { ProSlot } from '../pro/host'
import { ProLockButton } from '../pro/ProTeaser'
import './templates.css'

// Eine E-Mail-Vorlage, wie sie vom Backend geliefert wird
interface Template {
  id: string
  name: string
  subject: string
  htmlBody: string
  textBody?: string
  // Sprache von Anrede, Abmelde-Hinweis und Footer
  language: 'de' | 'en'
  updatedAt: string
}

// Antwort der Platzhalter-Schnittstelle
interface PlaceholdersResponse {
  placeholders: string[]
}

// Eingabewerte des Editor-Formulars (Anlegen und Bearbeiten)
interface TemplateForm {
  name: string
  subject: string
  htmlBody: string
  language: 'de' | 'en'
}

// Leeres Formular als Ausgangszustand
const EMPTY_FORM: TemplateForm = { name: '', subject: '', htmlBody: '', language: 'de' }

// Anzeigemodi im Editor-Modal
type ViewMode = 'editor' | 'preview'

export function TemplatesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()

  // Steuert das Modal und haelt die aktuell bearbeitete Vorlage (oder null beim Anlegen)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM)
  // Felder, die beim letzten Speichern fehlten
  const [invalid, setInvalid] = useState<string[]>([])
  // Aktiver Reiter (nur auf schmalen Schirmen relevant, breit zeigen wir beides)
  const [view, setView] = useState<ViewMode>('editor')

  // Alle Vorlagen laden
  const { data: templates, isLoading, isFetching } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<Template[]>('/api/templates'),
  })

  // Verfügbare Platzhalter laden (z.B. firstName, company)
  const { data: placeholderData } = useQuery({
    queryKey: ['templates', 'placeholders'],
    queryFn: () => api.get<PlaceholdersResponse>('/api/templates/placeholders'),
  })
  const placeholders = placeholderData?.placeholders ?? []

  // Nach Erfolg den Cache erneuern, Toast zeigen und Modal schließen
  function onSuccess() {
    queryClient.invalidateQueries({ queryKey: ['templates'] })
    notify('success', t('common.saved'))
    closeModal()
  }

  // Fehler als Toast ausgeben
  function onError(error: unknown) {
    const message =
      error instanceof ApiError
        ? error.message
        : t('common.error', { defaultValue: 'Es ist ein Fehler aufgetreten' })
    notify('error', message)
  }

  // Vorlage anlegen
  const createMutation = useMutation({
    mutationFn: (body: TemplateForm) => api.post<Template>('/api/templates', body),
    onSuccess,
    onError,
  })

  // Vorlage aktualisieren (teilweise)
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<TemplateForm> }) =>
      api.put<Template>(`/api/templates/${id}`, body),
    onSuccess,
    onError,
  })

  // Vorlage löschen
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      notify('success', t('common.deleted'))
    },
    onError,
  })

  // Modal zum Anlegen öffnen
  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setInvalid([])
    setView('editor')
    setModalOpen(true)
  }

  // Modal zum Bearbeiten öffnen, vorhandene Werte übernehmen
  function openEdit(template: Template) {
    setEditing(template)
    setInvalid([])
    setForm({
      name: template.name,
      subject: template.subject,
      htmlBody: template.htmlBody,
      language: template.language === 'en' ? 'en' : 'de',
    })
    setView('editor')
    setModalOpen(true)
  }

  // Sprung aus der Suche: Vorlage zum Bearbeiten öffnen, sobald die Vorlagen geladen sind
  useJumpTarget(
    ['templates'],
    (jump) => {
      const template = templates?.find((x) => x.id === jump.id)
      if (template) openEdit(template)
      else notify('error', t('search.notFound'))
    },
    () => !!templates && !isFetching,
  )

  // Modal schließen und Zustand zurücksetzen
  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  // Platzhalter an den HTML-Text anhängen, wenn ein Chip geklickt wird
  function appendPlaceholder(name: string) {
    setForm((prev) => ({ ...prev, htmlBody: `${prev.htmlBody}{{${name}}}` }))
  }

  // Formular absenden (Anlegen oder Bearbeiten)
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    // Pflichtfelder prüfen und fehlende rot markieren, statt still nichts zu tun
    const missing: string[] = []
    if (!form.name.trim()) missing.push('name')
    if (!form.subject.trim()) missing.push('subject')
    setInvalid(missing)
    if (missing.length) {
      notify('error', t('campaigns.requiredMissing'))
      return
    }

    const body: TemplateForm = {
      name: form.name.trim(),
      subject: form.subject.trim(),
      htmlBody: form.htmlBody,
      language: form.language,
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, body })
    } else {
      createMutation.mutate(body)
    }
  }

  // Löschen mit eigenem Bestätigungsdialog (kein window.confirm)
  async function handleDelete(template: Template) {
    const ok = await confirm({
      message: t('templates.deleteConfirm', {
        defaultValue: 'Diese Vorlage wirklich löschen?',
      }),
      danger: true,
      confirmLabel: t('common.delete', { defaultValue: 'Löschen' }),
    })
    if (ok) deleteMutation.mutate(template.id)
  }

  // Datum lesbar formatieren
  function formatDate(value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Wird gerade gespeichert?
  const saving = createMutation.isPending || updateMutation.isPending

  // Vorschaubereich, der den HTML-Text rendert
  const previewPane = (
    <div className="template-pane" data-tour="template-preview">
      <div className="field-label flex items-center gap-2">
        <Eye size={15} />
        {t('templates.preview', { defaultValue: 'Vorschau' })}
      </div>
      {form.htmlBody.trim() ? (
        // Live-Vorschau in einem abgeschotteten Rahmen: keine Skripte (auch keine onerror-Attribute), keine
        // Formulare, keine externen Inhalte. Ohne Skripte kann fremdes HTML in einer Vorlage nichts ausführen.
        // allow-same-origin nur, damit jeder Browser den Rahmen zeichnet; ohne allow-scripts ist das sicher.
        <iframe
          className="template-preview template-preview-frame"
          sandbox="allow-same-origin"
          referrerPolicy="no-referrer"
          title={t('templates.preview', { defaultValue: 'Vorschau' })}
          srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>body{margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;line-height:1.5;background:#fff}</style></head><body>${form.htmlBody}</body></html>`}
        />
      ) : (
        <div className="template-preview template-preview-empty">
          {t('templates.previewEmpty', {
            defaultValue: 'Hier sehen Sie die fertige Mail, sobald Sie HTML eingeben.',
          })}
        </div>
      )}
    </div>
  )

  // Editorbereich mit Betreff, HTML-Text und Platzhaltern
  const editorPane = (
    <div className="template-pane" data-tour="template-editor">
      <div className="field-label flex items-center gap-2">
        <Code2 size={15} />
        {t('templates.htmlBody', { defaultValue: 'HTML-Inhalt' })}
      </div>
      <textarea
        id="template-html"
        className="textarea template-html-input"
        style={{ fontFamily: 'var(--font-mono)' }}
        value={form.htmlBody}
        onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
        spellCheck={false}
      />

      {/* Platzhalter-Hilfe: klickbare Chips */}
      {placeholders.length > 0 && (
        <div className="field" style={{ marginTop: 'var(--space-4)' }} data-tour="template-placeholders">
          <div className="field-label">
            {t('templates.placeholders', { defaultValue: 'Platzhalter' })}
          </div>
          <div className="template-placeholders">
            {placeholders.map((name) => (
              <button
                key={name}
                type="button"
                className="template-chip"
                onClick={() => appendPlaceholder(name)}
              >
                {`{{${name}}}`}
              </button>
            ))}
          </div>
          <p className="field-hint">
            {t('templates.placeholderHint', { anrede: '{{anrede}}', ansatz: '{{ansatz}}' })}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <>
      <PageHeader help={{ chapter: 'templates' }}
        eyebrow={t('templates.eyebrow', { defaultValue: 'E-Mail' })}
        title={t('templates.title', { defaultValue: 'Vorlagen' })}
        actions={
          <>
            {/* Vorlagenpakete je Branche (MixMarket Pro), ohne Pro ein erklärender Knopf */}
            <ProSlot
              name="templates.packs"
              fallback={<ProLockButton feature="templatePacks" label={t('pro.feature.templatePacks.title')} icon={<Layers size={18} />} />}
            />
            <button className="btn btn-primary" onClick={openCreate} data-tour="templates-add">
              <Plus size={18} />
              {t('templates.add', { defaultValue: 'Vorlage erstellen' })}
            </button>
          </>
        }
      />

      <PageBody>
        {/* Ladezustand */}
        {isLoading ? (
          <Loading />
        ) : !templates || templates.length === 0 ? (
          // Leerzustand mit Aktion zum Anlegen
          <EmptyState
            icon={<FileText size={28} />}
            title={t('common.empty', { defaultValue: 'Noch nichts vorhanden' })}
            description={t('templates.subtitle', {
              defaultValue: 'Erstellen Sie wiederverwendbare E-Mail-Vorlagen für Ihre Kampagnen.',
            })}
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={18} />
                {t('templates.add', { defaultValue: 'Vorlage erstellen' })}
              </button>
            }
          />
        ) : (
          // Integrierte Zeilen-Liste mit allen Vorlagen (keine Karten)
          <div className="data-list">
            {templates.map((template) => (
              <div className="data-row" key={template.id}>
                {/* Name und Betreff der Vorlage */}
                <div className="data-row-main">
                  <div className="data-row-title">
                    <FileText size={16} />
                    {template.name}
                    <span className="badge badge-unsub template-lang">{template.language === 'en' ? 'EN' : 'DE'}</span>
                  </div>
                  <div className="data-row-meta">{template.subject}</div>
                </div>

                {/* Datum und Aktionen rechts */}
                <div className="data-row-aside">
                  <span
                    className="font-mono"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}
                  >
                    {formatDate(template.updatedAt)}
                  </span>
                  <div className="data-row-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEdit(template)}
                      aria-label={t('common.edit')}
                    >
                      <Pencil size={14} />
                      <span className="btn-label">{t('common.edit')}</span>
                    </button>
                    <button
                      className="btn btn-sm btn-icon btn-ghost"
                      aria-label={t('common.delete')}
                      onClick={() => handleDelete(template)}
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

      {/* Grosses Editor-Modal mit Live-Vorschau */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        width={820}
        title={
          editing
            ? t('templates.edit')
            : t('templates.add', { defaultValue: 'Vorlage erstellen' })
        }
        footer={
          <>
            <button className="btn btn-ghost" onClick={closeModal}>
              {t('common.cancel', { defaultValue: 'Abbrechen' })}
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} aria-disabled={saving} data-tour="template-save">
              {t('common.save', { defaultValue: 'Speichern' })}
            </button>
          </>
        }
      >
        <form className="template-form" onSubmit={handleSubmit}>
          {/* Name (Pflichtfeld) */}
          {/* Name und Sprache nebeneinander */}
          <div className="template-head-row" data-tour="template-head">
            <div className="field">
              <label className="field-label" htmlFor="template-name">
                {t('common.name')} *
              </label>
              <input
                id="template-name"
                className={`input${invalid.includes('name') ? ' is-invalid' : ''}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="template-language">
                {t('templates.language')}
              </label>
              <Select
                id="template-language"
                value={form.language}
                onChange={(v) => setForm({ ...form, language: v === 'en' ? 'en' : 'de' })}
                options={[
                  { value: 'de', label: t('templates.languageDe') },
                  { value: 'en', label: t('templates.languageEn') },
                ]}
              />
            </div>
          </div>
          <p className="field-hint template-lang-hint">{t('templates.languageHint', { anrede: '{{anrede}}' })}</p>

          {/* Betreff (Pflichtfeld) */}
          <div className="field" data-tour="template-subject">
            <label className="field-label" htmlFor="template-subject">
              {t('templates.subject', { defaultValue: 'Betreff' })} *
            </label>
            <input
              id="template-subject"
              className={`input${invalid.includes('subject') ? ' is-invalid' : ''}`}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          {/* Umschaltung Editor/Vorschau, nur auf schmalen Schirmen sichtbar */}
          <div className="segmented template-view-toggle">
            <button
              type="button"
              className={view === 'editor' ? 'active' : ''}
              onClick={() => setView('editor')}
            >
              <Code2 size={15} />
              {t('templates.editor', { defaultValue: 'Editor' })}
            </button>
            <button
              type="button"
              className={view === 'preview' ? 'active' : ''}
              onClick={() => setView('preview')}
            >
              <Eye size={15} />
              {t('templates.preview', { defaultValue: 'Vorschau' })}
            </button>
          </div>

          {/* Editor und Vorschau: breit zweispaltig, schmal je nach Reiter */}
          <div className="template-split">
            <div className={`template-col${view === 'preview' ? ' is-inactive' : ''}`}>{editorPane}</div>
            <div className={`template-col${view === 'editor' ? ' is-inactive' : ''}`}>{previewPane}</div>
          </div>
        </form>
      </Modal>
    </>
  )
}
