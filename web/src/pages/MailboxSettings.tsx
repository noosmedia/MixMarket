// Abschnitt der Einstellungen: Postfach für Versand (SMTP) und Empfang (IMAP).
// Passwörter werden nie angezeigt; ein leeres Passwortfeld lässt das gespeicherte unverändert.
// "Verbindung testen" speichert ungesicherte Änderungen zuerst und prüft dann den Zugang.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Inbox, Mail, ShieldCheck, Trash2 } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { Loading } from '../components/Page'
import { PasswordField } from '../components/PasswordField'
import { Select } from '../components/Select'
import { useUi } from '../stores/ui'

type Security = 'tls' | 'starttls'
type Protocol = 'smtp' | 'imap'

interface MailboxData {
  smtpHost: string
  smtpPort: number | null
  smtpSecurity: Security
  smtpUser: string
  smtpPasswordSet: boolean
  smtpPasswordUnreadable: boolean
  mailFromAddress: string
  mailFromName: string
  imapHost: string
  imapPort: number | null
  imapSecurity: Security
  imapSameLogin: boolean
  imapUser: string
  imapPasswordSet: boolean
  imapPasswordUnreadable: boolean
  imapFolder: string
  sendMode: 'settings' | 'env' | 'test'
  envFallback: boolean
  defaultPorts: { smtp: Record<Security, number>; imap: Record<Security, number> }
}

interface TestResult {
  ok: boolean
  code: 'ok' | 'missing' | 'auth' | 'connect' | 'tls' | 'folder' | 'error'
  detail?: string
  messages?: number
  folders?: string[]
}

interface Form {
  smtpHost: string
  smtpPort: string
  smtpSecurity: Security
  smtpUser: string
  smtpPassword: string
  mailFromAddress: string
  mailFromName: string
  imapHost: string
  imapPort: string
  imapSecurity: Security
  imapSameLogin: boolean
  imapUser: string
  imapPassword: string
  imapFolder: string
}

const EMPTY: Form = {
  smtpHost: '',
  smtpPort: '',
  smtpSecurity: 'tls',
  smtpUser: '',
  smtpPassword: '',
  mailFromAddress: '',
  mailFromName: '',
  imapHost: '',
  imapPort: '',
  imapSecurity: 'tls',
  imapSameLogin: true,
  imapUser: '',
  imapPassword: '',
  imapFolder: 'INBOX',
}

// Gespeicherten Stand in Formularwerte übersetzen
function toForm(d: MailboxData): Form {
  return {
    smtpHost: d.smtpHost,
    smtpPort: d.smtpPort ? String(d.smtpPort) : '',
    smtpSecurity: d.smtpSecurity,
    smtpUser: d.smtpUser,
    smtpPassword: '',
    mailFromAddress: d.mailFromAddress,
    mailFromName: d.mailFromName,
    imapHost: d.imapHost,
    imapPort: d.imapPort ? String(d.imapPort) : '',
    imapSecurity: d.imapSecurity,
    imapSameLogin: d.imapSameLogin,
    imapUser: d.imapUser,
    imapPassword: '',
    imapFolder: d.imapFolder || 'INBOX',
  }
}

export function MailboxSettings() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify, confirm } = useUi()
  const [form, setForm] = useState<Form>(EMPTY)
  // Ergebnis des letzten Tests je Zugang, bleibt sichtbar bis zur nächsten Änderung
  const [results, setResults] = useState<Partial<Record<Protocol, TestResult>>>({})
  // Ordner, die der letzte IMAP-Test gemeldet hat (dann Auswahl statt Freitext)
  const [folders, setFolders] = useState<string[]>([])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['mailboxSettings'],
    queryFn: () => api.get<MailboxData>('/api/settings/mailbox'),
  })

  // Sprung zum Abschnitt, wenn die Übersicht ("Erste Schritte") hierher verlinkt
  useEffect(() => {
    if (data && window.location.hash === '#postfach') {
      document.getElementById('postfach')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [data])

  useEffect(() => {
    if (data) setForm(toForm(data))
  }, [data])

  // Ungesicherte Änderungen gegenüber dem gespeicherten Stand
  const dirty = useMemo(() => {
    if (!data) return false
    const saved = toForm(data)
    return (Object.keys(saved) as Array<keyof Form>).some((k) => saved[k] !== form[k])
  }, [data, form])

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Verschlüsselung wechseln: Port mitziehen, solange er leer ist oder dem bisherigen Standard entspricht
  function setSecurity(protocol: Protocol, next: Security) {
    if (!data) return
    const ports = data.defaultPorts[protocol]
    setForm((f) => {
      const current = protocol === 'smtp' ? f.smtpPort : f.imapPort
      const previous = protocol === 'smtp' ? f.smtpSecurity : f.imapSecurity
      const port = !current || current === String(ports[previous]) ? String(ports[next]) : current
      return protocol === 'smtp'
        ? { ...f, smtpSecurity: next, smtpPort: port }
        : { ...f, imapSecurity: next, imapPort: port }
    })
  }

  function showError(err: unknown) {
    notify('error', err instanceof ApiError ? err.message : t('mailbox.saveError'))
  }

  // Formular in die Anfrage übersetzen; leere Passwörter werden nicht mitgeschickt
  function payload(): Record<string, unknown> | null {
    const smtpPort = form.smtpPort.trim() ? Number(form.smtpPort) : null
    const imapPort = form.imapPort.trim() ? Number(form.imapPort) : null
    for (const p of [smtpPort, imapPort]) {
      if (p !== null && (!Number.isInteger(p) || p < 1 || p > 65535)) {
        notify('error', t('mailbox.portInvalid'))
        return null
      }
    }
    return {
      smtpHost: form.smtpHost.trim(),
      smtpPort,
      smtpSecurity: form.smtpSecurity,
      smtpUser: form.smtpUser.trim(),
      ...(form.smtpPassword ? { smtpPassword: form.smtpPassword } : {}),
      mailFromAddress: form.mailFromAddress.trim(),
      mailFromName: form.mailFromName.trim(),
      imapHost: form.imapHost.trim(),
      imapPort,
      imapSecurity: form.imapSecurity,
      imapSameLogin: form.imapSameLogin,
      imapUser: form.imapUser.trim(),
      ...(form.imapPassword ? { imapPassword: form.imapPassword } : {}),
      imapFolder: form.imapFolder.trim(),
    }
  }

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.put<{ ok: boolean }>('/api/settings/mailbox', body),
    onSuccess: () => {
      setResults({})
      queryClient.invalidateQueries({ queryKey: ['mailboxSettings'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const testMutation = useMutation({
    mutationFn: (protocol: Protocol) => api.post<TestResult>('/api/settings/mailbox/test', { protocol }),
    onSuccess: (result, protocol) => {
      setResults((r) => ({ ...r, [protocol]: result }))
      if (protocol === 'imap' && result.folders?.length) setFolders(result.folders)
      if (result.ok) {
        notify(
          'success',
          protocol === 'smtp' ? t('mailbox.smtpOk') : t('mailbox.imapOk', { count: result.messages ?? 0 }),
        )
      } else {
        notify('error', t(`mailbox.result.${result.code}`))
      }
    },
    onError: showError,
  })

  // Laufende Speicherung oder Prüfung: weitere Klicks werden ignoriert statt Knöpfe zu sperren
  const busy = saveMutation.isPending || testMutation.isPending

  // Speichern
  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    const body = payload()
    if (!body) return
    saveMutation.mutate(body, {
      onSuccess: () => notify('success', t('mailbox.saved')),
      onError: showError,
    })
  }

  // Testen; ungesicherte Änderungen vorher speichern, sonst würde der alte Stand geprüft
  function handleTest(protocol: Protocol) {
    if (busy) return
    if (!dirty) {
      testMutation.mutate(protocol)
      return
    }
    const body = payload()
    if (!body) return
    saveMutation.mutate(body, {
      onSuccess: () => testMutation.mutate(protocol),
      onError: showError,
    })
  }

  // Zugang entfernen, nach Rückfrage
  async function handleClear(protocol: Protocol) {
    if (busy) return
    const ok = await confirm({
      message: protocol === 'smtp' ? t('mailbox.clearSmtpConfirm') : t('mailbox.clearImapConfirm'),
      danger: true,
      confirmLabel: t('mailbox.clear'),
    })
    if (!ok) return
    if (protocol === 'imap') setFolders([])
    saveMutation.mutate(protocol === 'smtp' ? { clearSmtp: true } : { clearImap: true }, {
      onSuccess: () => notify('success', t('mailbox.cleared')),
      onError: showError,
    })
  }

  const securityOptions = [
    { value: 'tls', label: t('mailbox.securityTls') },
    { value: 'starttls', label: t('mailbox.securityStarttls') },
  ]

  // Ergebnis eines Tests mit vollständiger Meldung des Mailservers
  function resultLine(protocol: Protocol) {
    const r = results[protocol]
    if (!r) return null
    return (
      <div className={`mailbox-result ${r.ok ? 'is-ok' : 'is-error'}`} role="status">
        <div className="mailbox-result-head">
          {r.ok ? <Check size={15} /> : <AlertTriangle size={15} />}
          <span>
            {r.ok
              ? protocol === 'smtp'
                ? t('mailbox.smtpOk')
                : t('mailbox.imapOk', { count: r.messages ?? 0 })
              : t(`mailbox.result.${r.code}`)}
          </span>
        </div>
        {!r.ok && r.code === 'folder' && r.folders?.length ? (
          <div className="mailbox-result-detail">{t('mailbox.foldersAvailable', { folders: r.folders.join(', ') })}</div>
        ) : null}
        {!r.ok && r.detail && r.code !== 'folder' && <pre className="mailbox-result-detail">{r.detail}</pre>}
      </div>
    )
  }

  // Status oben im Abschnitt: woher der Versand seine Daten nimmt
  function modeBadge() {
    if (!data) return null
    if (data.smtpPasswordUnreadable || data.imapPasswordUnreadable) {
      return (
        <span className="badge badge-bounced">
          <AlertTriangle size={14} />
          {t('mailbox.unreadable')}
        </span>
      )
    }
    if (data.sendMode === 'settings') {
      return (
        <span className="badge badge-active">
          <Check size={14} />
          {t('mailbox.modeSettings')}
        </span>
      )
    }
    if (data.sendMode === 'env') {
      return (
        <span className="badge badge-active">
          <Check size={14} />
          {t('mailbox.modeEnv')}
        </span>
      )
    }
    return (
      <span className="badge badge-warning">
        <AlertTriangle size={14} />
        {t('mailbox.modeTest')}
      </span>
    )
  }

  const imapFolderOptions = folders.length
    ? [
        ...folders.map((f) => ({ value: f, label: f })),
        ...(form.imapFolder && !folders.includes(form.imapFolder) ? [{ value: form.imapFolder, label: form.imapFolder }] : []),
      ]
    : []

  return (
    <form className="panel" id="postfach" onSubmit={handleSave}>
      <div className="settings-panel-head mailbox-head">
        <span className="settings-panel-icon">
          <Mail size={18} />
        </span>
        <div className="settings-panel-titles">
          <h2 className="settings-panel-title font-display">{t('mailbox.title')}</h2>
        </div>
        {modeBadge()}
      </div>
      <p className="settings-smtp-hint providers-intro">{t('mailbox.intro')}</p>
      {data?.sendMode === 'test' && <p className="mailbox-note">{t('mailbox.testModeHint')}</p>}
      {data?.envFallback && data.sendMode === 'env' && <p className="mailbox-note">{t('mailbox.envHint')}</p>}

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <span className="badge badge-warning badge-multiline">
          <AlertTriangle size={14} />
          {error instanceof ApiError ? error.message : t('mailbox.loadError')}
        </span>
      ) : (
        <>
          {/* Versand über SMTP */}
          <div className="providers-block" data-tour="mailbox-smtp">
            <div className="providers-block-head">
              <div>
                <div className="providers-block-title">{t('mailbox.smtpTitle')}</div>
                <div className="field-hint">{t('mailbox.smtpHint')}</div>
              </div>
            </div>
            <div className="settings-grid-2" data-tour="mailbox-sender">
              <div className="field">
                <label className="field-label" htmlFor="mb-from-name">
                  {t('mailbox.fromName')}
                </label>
                <input
                  id="mb-from-name"
                  className="input"
                  value={form.mailFromName}
                  onChange={(e) => set('mailFromName', e.target.value)}
                  placeholder={t('mailbox.fromNamePlaceholder')}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="mb-from-address">
                  {t('mailbox.fromAddress')}
                </label>
                <input
                  id="mb-from-address"
                  className="input"
                  type="email"
                  value={form.mailFromAddress}
                  onChange={(e) => set('mailFromAddress', e.target.value)}
                  placeholder="vertrieb@firma.de"
                />
              </div>
            </div>
            {/* Ratschlag zur Absender-Domain: Erstansprache nicht über die Hauptdomain */}
            <p className="field-hint mailbox-domain-hint">{t('mailbox.domainHint')}</p>
            <div className="mailbox-server-row" data-tour="mailbox-smtp-server">
              <div className="field">
                <label className="field-label" htmlFor="mb-smtp-host">
                  {t('mailbox.server')}
                </label>
                <input
                  id="mb-smtp-host"
                  className="input"
                  value={form.smtpHost}
                  onChange={(e) => set('smtpHost', e.target.value)}
                  placeholder="smtp.firma.de"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="mb-smtp-security">
                  {t('mailbox.security')}
                </label>
                <Select
                  id="mb-smtp-security"
                  value={form.smtpSecurity}
                  options={securityOptions}
                  onChange={(v) => setSecurity('smtp', v as Security)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="mb-smtp-port">
                  {t('mailbox.port')}
                </label>
                <input
                  id="mb-smtp-port"
                  className="input font-mono"
                  inputMode="numeric"
                  value={form.smtpPort}
                  onChange={(e) => set('smtpPort', e.target.value.replace(/\D/g, ''))}
                  placeholder={String(data?.defaultPorts.smtp[form.smtpSecurity] ?? '')}
                />
              </div>
            </div>
            <div className="settings-grid-2" data-tour="mailbox-smtp-login">
              <div className="field">
                <label className="field-label" htmlFor="mb-smtp-user">
                  {t('mailbox.user')}
                </label>
                <input
                  id="mb-smtp-user"
                  className="input"
                  value={form.smtpUser}
                  onChange={(e) => set('smtpUser', e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="vertrieb@firma.de"
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="mb-smtp-password">
                  {t('mailbox.password')}
                </label>
                <PasswordField
                  id="mb-smtp-password"
                  value={form.smtpPassword}
                  onChange={(v) => set('smtpPassword', v)}
                  autoComplete="new-password"
                  placeholder={data?.smtpPasswordSet ? t('providers.keepStored') : ''}
                />
              </div>
            </div>
            {resultLine('smtp')}
            <div className="providers-actions">
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleTest('smtp')} data-tour="mailbox-smtp-test">
                {testMutation.isPending && testMutation.variables === 'smtp' ? (
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                ) : (
                  <ShieldCheck size={14} />
                )}
                {t('mailbox.test')}
              </button>
              {data?.smtpHost && (
                <button type="button" className="btn btn-sm btn-ghost btn-danger" onClick={() => handleClear('smtp')}>
                  <Trash2 size={14} />
                  {t('mailbox.clear')}
                </button>
              )}
            </div>
          </div>

          {/* Empfang über IMAP */}
          <div className="providers-block" data-tour="mailbox-imap">
            <div className="providers-block-head">
              <div>
                <div className="providers-block-title">{t('mailbox.imapTitle')}</div>
                <div className="field-hint">{t('mailbox.imapHint')}</div>
              </div>
            </div>
            <div className="mailbox-server-row" data-tour="mailbox-imap-server">
              <div className="field">
                <label className="field-label" htmlFor="mb-imap-host">
                  {t('mailbox.server')}
                </label>
                <input
                  id="mb-imap-host"
                  className="input"
                  value={form.imapHost}
                  onChange={(e) => set('imapHost', e.target.value)}
                  placeholder="imap.firma.de"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="mb-imap-security">
                  {t('mailbox.security')}
                </label>
                <Select
                  id="mb-imap-security"
                  value={form.imapSecurity}
                  options={securityOptions}
                  onChange={(v) => setSecurity('imap', v as Security)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="mb-imap-port">
                  {t('mailbox.port')}
                </label>
                <input
                  id="mb-imap-port"
                  className="input font-mono"
                  inputMode="numeric"
                  value={form.imapPort}
                  onChange={(e) => set('imapPort', e.target.value.replace(/\D/g, ''))}
                  placeholder={String(data?.defaultPorts.imap[form.imapSecurity] ?? '')}
                />
              </div>
            </div>
            <label className="checkbox-row providers-check" data-tour="mailbox-imap-same">
              <input
                type="checkbox"
                checked={form.imapSameLogin}
                onChange={(e) => set('imapSameLogin', e.target.checked)}
              />
              <span>{t('mailbox.sameLogin')}</span>
            </label>
            {!form.imapSameLogin && (
              <div className="settings-grid-2">
                <div className="field">
                  <label className="field-label" htmlFor="mb-imap-user">
                    {t('mailbox.user')}
                  </label>
                  <input
                    id="mb-imap-user"
                    className="input"
                    value={form.imapUser}
                    onChange={(e) => set('imapUser', e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="mb-imap-password">
                    {t('mailbox.password')}
                  </label>
                  <PasswordField
                    id="mb-imap-password"
                    value={form.imapPassword}
                    onChange={(v) => set('imapPassword', v)}
                    autoComplete="new-password"
                    placeholder={data?.imapPasswordSet ? t('providers.keepStored') : ''}
                  />
                </div>
              </div>
            )}
            <div className="field mailbox-folder" data-tour="mailbox-imap-folder">
              <label className="field-label" htmlFor="mb-imap-folder">
                {t('mailbox.folder')}
              </label>
              {imapFolderOptions.length ? (
                <Select
                  id="mb-imap-folder"
                  value={form.imapFolder}
                  options={imapFolderOptions}
                  onChange={(v) => set('imapFolder', v)}
                />
              ) : (
                <input
                  id="mb-imap-folder"
                  className="input"
                  value={form.imapFolder}
                  onChange={(e) => set('imapFolder', e.target.value)}
                  spellCheck={false}
                />
              )}
              <div className="field-hint">{t('mailbox.folderHint')}</div>
            </div>
            {resultLine('imap')}
            <div className="providers-actions">
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleTest('imap')} data-tour="mailbox-imap-test">
                {testMutation.isPending && testMutation.variables === 'imap' ? (
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                ) : (
                  <Inbox size={14} />
                )}
                {t('mailbox.test')}
              </button>
              {data?.imapHost && (
                <button type="button" className="btn btn-sm btn-ghost btn-danger" onClick={() => handleClear('imap')}>
                  <Trash2 size={14} />
                  {t('mailbox.clear')}
                </button>
              )}
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn btn-primary" type="submit" data-tour="mailbox-save">
              {saveMutation.isPending ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Check size={16} />}
              {t('mailbox.save')}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
