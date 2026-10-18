// Abschnitt der Einstellungen: das eigene Konto. Name und E-Mail ändern, Passwort ändern und
// einen neuen Wiederherstellungsschlüssel erzeugen. MixMarket hat genau dieses eine Konto.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, KeyRound, UserRound } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { Modal } from '../components/Modal'
import { PasswordField } from '../components/PasswordField'
import { RecoveryKeyPanel } from '../components/RecoveryKeyPanel'
import { useAuth, type User } from '../stores/auth'
import { useUi } from '../stores/ui'

// Mindestlänge wie auf dem Server
const MIN_PASSWORD_LENGTH = 10

export function AccountSettings() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify } = useUi()
  const { user, setUser } = useAuth()

  // Name und E-Mail
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [emailPassword, setEmailPassword] = useState('')
  // Passwort ändern
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  // Neuer Wiederherstellungsschlüssel
  const [keyOpen, setKeyOpen] = useState(false)
  const [keyPassword, setKeyPassword] = useState('')
  const [freshKey, setFreshKey] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  const keyQuery = useQuery({
    queryKey: ['recoveryKeyStatus'],
    queryFn: () => api.get<{ exists: boolean }>('/api/auth/recovery-key'),
  })

  function showError(err: unknown) {
    notify('error', err instanceof ApiError ? err.message : t('common.error'))
  }

  const emailChanged = !!user && email.trim().toLowerCase() !== user.email

  const accountMutation = useMutation({
    mutationFn: () =>
      api.put<{ user: User }>('/api/auth/account', {
        name: name.trim(),
        email: email.trim(),
        ...(emailChanged ? { currentPassword: emailPassword } : {}),
      }),
    onSuccess: (res) => {
      setUser(res.user)
      setEmailPassword('')
      notify('success', t('account.saved'))
    },
    onError: showError,
  })

  const passwordMutation = useMutation({
    mutationFn: () => api.put<{ ok: boolean }>('/api/auth/password', { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setNewPassword2('')
      notify('success', t('account.passwordChanged'))
    },
    onError: showError,
  })

  const keyMutation = useMutation({
    mutationFn: () => api.post<{ recoveryKey: string }>('/api/auth/recovery-key', { currentPassword: keyPassword }),
    onSuccess: (res) => {
      setKeyPassword('')
      setFreshKey(res.recoveryKey)
      queryClient.invalidateQueries({ queryKey: ['recoveryKeyStatus'] })
    },
    onError: showError,
  })

  function saveAccount(e: React.FormEvent) {
    e.preventDefault()
    if (accountMutation.isPending) return
    if (!name.trim() || !email.trim()) {
      notify('error', t('auth.fillAll'))
      return
    }
    if (emailChanged && !emailPassword) {
      notify('error', t('account.currentPasswordForEmail'))
      return
    }
    accountMutation.mutate()
  }

  function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordMutation.isPending) return
    if (!currentPassword || !newPassword) {
      notify('error', t('auth.fillAll'))
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      notify('error', t('auth.passwordTooShort', { count: MIN_PASSWORD_LENGTH }))
      return
    }
    if (newPassword !== newPassword2) {
      notify('error', t('auth.passwordMismatch'))
      return
    }
    passwordMutation.mutate()
  }

  function createKey(e: React.FormEvent) {
    e.preventDefault()
    if (keyMutation.isPending) return
    if (!keyPassword) {
      notify('error', t('account.newKeyConfirmHint'))
      return
    }
    keyMutation.mutate()
  }

  function closeKey() {
    setKeyOpen(false)
    setKeyPassword('')
    setFreshKey('')
  }

  return (
    <div className="panel" id="konto">
      <div className="settings-panel-head">
        <span className="settings-panel-icon">
          <UserRound size={18} />
        </span>
        <div className="settings-panel-titles">
          <h2 className="settings-panel-title font-display">{t('account.title')}</h2>
        </div>
      </div>
      <p className="settings-smtp-hint providers-intro">{t('account.intro')}</p>

      {/* Name und E-Mail */}
      <form className="providers-block" onSubmit={saveAccount} data-tour="account-identity">
        <div className="settings-grid-2">
          <div className="field">
            <label className="field-label" htmlFor="acc-name">
              {t('account.name')}
            </label>
            <input id="acc-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="acc-email">
              {t('account.email')}
            </label>
            <input
              id="acc-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>
        {emailChanged && (
          <div className="field account-narrow">
            <label className="field-label" htmlFor="acc-email-pw">
              {t('account.currentPassword')}
            </label>
            <PasswordField id="acc-email-pw" value={emailPassword} onChange={setEmailPassword} autoComplete="current-password" />
            <div className="field-hint">{t('account.currentPasswordForEmail')}</div>
          </div>
        )}
        <div className="providers-actions">
          <button className="btn btn-sm btn-primary" type="submit">
            {accountMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
            {t('account.save')}
          </button>
        </div>
      </form>

      {/* Passwort ändern */}
      <form className="providers-block" onSubmit={changePassword} data-tour="account-password">
        <div>
          <div className="providers-block-title">{t('account.passwordTitle')}</div>
          <div className="field-hint">{t('account.passwordHint')}</div>
        </div>
        <div className="field account-narrow">
          <label className="field-label" htmlFor="acc-current">
            {t('account.currentPassword')}
          </label>
          <PasswordField id="acc-current" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
        </div>
        <div className="settings-grid-2">
          <div className="field">
            <label className="field-label" htmlFor="acc-new">
              {t('auth.newPassword')}
            </label>
            <PasswordField id="acc-new" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            <div className="field-hint">{t('auth.passwordRule', { count: MIN_PASSWORD_LENGTH })}</div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="acc-new2">
              {t('auth.newPasswordRepeat')}
            </label>
            <PasswordField id="acc-new2" value={newPassword2} onChange={setNewPassword2} autoComplete="new-password" />
          </div>
        </div>
        <div className="providers-actions">
          <button className="btn btn-sm btn-secondary" type="submit">
            {passwordMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <KeyRound size={14} />}
            {t('account.changePassword')}
          </button>
        </div>
      </form>

      {/* Wiederherstellungsschlüssel */}
      <div className="providers-block" data-tour="account-key">
        <div>
          <div className="providers-block-title">{t('account.keyTitle')}</div>
          <div className="field-hint">{keyQuery.data?.exists === false ? t('account.keyMissing') : t('account.keyExists')}</div>
        </div>
        <div className="providers-actions">
          <button className="btn btn-sm btn-secondary" type="button" onClick={() => setKeyOpen(true)}>
            <KeyRound size={14} />
            {t('account.newKey')}
          </button>
        </div>
      </div>

      <Modal open={keyOpen} onClose={closeKey} title={t('account.keyTitle')} width={480}>
        {freshKey ? (
          <RecoveryKeyPanel recoveryKey={freshKey} email={user?.email ?? ''} onDone={closeKey} doneLabel={t('account.keyDone')} />
        ) : (
          <form className="account-key-form" onSubmit={createKey}>
            <p className="field-hint">{t('account.keyExists')}</p>
            <div className="field">
              <label className="field-label" htmlFor="acc-key-pw">
                {t('account.currentPassword')}
              </label>
              <PasswordField id="acc-key-pw" value={keyPassword} onChange={setKeyPassword} autoComplete="current-password" />
              <div className="field-hint">{t('account.newKeyConfirmHint')}</div>
            </div>
            <div className="providers-actions">
              <button className="btn btn-sm btn-primary" type="submit">
                {keyMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <KeyRound size={14} />}
                {t('account.newKey')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
