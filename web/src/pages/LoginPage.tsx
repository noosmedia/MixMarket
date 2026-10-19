// Anmeldung, "Passwort vergessen" und Ersteinrichtung. Geteiltes Layout: links Markenbild, rechts Formular.
// MixMarket hat genau ein Konto: gibt es noch keins, führt die App zur Ersteinrichtung.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Copy, KeyRound, Terminal } from 'lucide-react'
import { useAuth, type User } from '../stores/auth'
import { useUi } from '../stores/ui'
import { ApiError } from '../lib/api'
import { desktop } from '../lib/desktop'
import { LogoMark } from '../components/Logo'
import { PasswordField } from '../components/PasswordField'
import { RecoveryKeyPanel, forgetPendingKey, rememberPendingKey } from '../components/RecoveryKeyPanel'
import './login.css'

// Befehl der Notlösung in der Quellcode-Fassung, im MixMarket-Ordner auf dem Rechner auszuführen.
// Im installierten Programm öffnet stattdessen ein Knopf das eigene Fenster des Programms.
const RESET_COMMAND = 'npm run reset-password'
// Mindestlänge wie auf dem Server
const MIN_PASSWORD_LENGTH = 10

// Gemeinsamer Rahmen: Markenbühne links, Formular rechts, Sprachwahl oben rechts
function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { theme, language, setLanguage } = useUi()
  return (
    <div className="login" data-theme={theme}>
      <div className="login-stage">
        <div className="stage-glow" />
        <div className="stage-content">
          <div className="stage-brand">
            <LogoMark size={32} />
            <span className="font-display">MixMarket</span>
          </div>
          <h1 className="stage-headline font-display">
            {t('auth.stageHeadline1')}
            <br />
            <span className="stage-accent">{t('auth.stageHeadline2')}</span>
          </h1>
          <p className="stage-text">{t('auth.stageText')}</p>
          <div className="stage-footer">{t('auth.stageFooter')}</div>
        </div>
      </div>
      <div className="login-form-side">
        <button
          type="button"
          className="tool-btn login-lang"
          onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
          aria-label={t('nav.switchLanguage')}
        >
          {language === 'de' ? 'EN' : 'DE'}
        </button>
        <div className="login-form">{children}</div>
      </div>
    </div>
  )
}

// Meldungen des Servers in der Sprache der Oberfläche; unbekannte Fälle mit der Servermeldung
function authError(err: unknown, t: (key: string, options?: Record<string, unknown>) => string, kind: 'login' | 'recover' | 'setup'): string {
  if (!(err instanceof ApiError)) return t(kind === 'login' ? 'auth.loginError' : kind === 'recover' ? 'auth.recoverError' : 'auth.setupError')
  if (err.status === 429) return t('auth.errorLocked', { count: Number(err.data?.retryAfterMinutes ?? 5) })
  if (err.status === 401) return t(kind === 'recover' ? 'auth.errorRecover' : 'auth.errorLogin')
  if (err.status === 409) return t('auth.errorAlreadySetup')
  if (err.status === 403 && err.data?.code === 'setupCode') return t('auth.errorSetupCode')
  if (err.status === 400 && /E-Mail/.test(err.message)) return t('auth.errorEmail')
  return err.message
}



export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, needsSetup, login, recover, setUser } = useAuth()
  const { notify, language, theme } = useUi()
  // Brücke zum installierten Programm (im Browser null)
  const program = desktop()
  const [mode, setMode] = useState<'login' | 'recover' | 'key'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [freshKey, setFreshKey] = useState('')
  const [freshUser, setFreshUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Notlösung ohne Schlüssel: bewusst versteckt, öffnet sich nur über das geheime "s" in der Überschrift
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  // Noch nicht eingerichtet: zur Ersteinrichtung; schon angemeldet: in die App
  useEffect(() => {
    if (needsSetup) navigate('/setup', { replace: true })
    else if (user) navigate('/', { replace: true })
  }, [user, needsSetup, navigate])

  function switchMode(next: 'login' | 'recover') {
    setMode(next)
    setError('')
    setEmergencyOpen(false)
  }

  // Programm: Passwort wurde im Fenster "Passwort neu setzen" geändert, zurück zur Anmeldung
  useEffect(() => {
    if (!program) return
    return program.onPasswordReset(() => {
      setMode('login')
      setError('')
      setEmergencyOpen(false)
      setPassword('')
      notify('success', t('auth.emergencyAppDone'))
    })
  }, [program, notify, t])

  // Programm: eigenes Fenster zum Neusetzen öffnen (Eingabe dort, nicht in dieser Seite)
  async function openProgramReset() {
    try {
      await program?.openPasswordReset(language, theme)
    } catch {
      notify('error', t('auth.emergencyAppFailed'))
    }
  }

  // Überschrift "Passwort vergessen" mit dem versteckten Auslöser: das erste "s" im Wort aus
  // auth.secretWord (Deutsch "vergessen", Englisch "password"). Der Mauszeiger ändert sich dort nicht.
  function recoverTitle() {
    const title = t('auth.recoverTitle')
    const word = t('auth.secretWord')
    const start = title.indexOf(word)
    const at = start >= 0 ? title.indexOf('s', start) : -1
    if (at < 0) return title
    return (
      <>
        {title.slice(0, at)}
        <span className="login-secret" onClick={() => setEmergencyOpen((open) => !open)}>
          {title[at]}
        </span>
        {title.slice(at + 1)}
      </>
    )
  }

  // Anmeldung absenden
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    if (!email.trim() || !password) {
      setError(t('auth.fillAll'))
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      notify('success', t('auth.welcomeBack'))
      navigate('/')
    } catch (err) {
      setError(authError(err, t, 'login'))
    } finally {
      setLoading(false)
    }
  }

  // Passwort mit dem Wiederherstellungsschlüssel neu setzen
  async function handleRecover(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    if (!email.trim() || !recoveryKey.trim() || !newPassword) {
      setError(t('auth.fillAll'))
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.passwordTooShort', { count: MIN_PASSWORD_LENGTH }))
      return
    }
    if (newPassword !== newPassword2) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    try {
      const res = await recover(email.trim(), recoveryKey, newPassword)
      setFreshUser(res.user)
      setFreshKey(res.recoveryKey)
      rememberPendingKey(res.recoveryKey, email.trim())
      setMode('key')
    } catch (err) {
      setError(authError(err, t, 'recover'))
    } finally {
      setLoading(false)
    }
  }

  // Befehl der Notlösung kopieren
  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(RESET_COMMAND)
      notify('success', t('recovery.copied'))
    } catch {
      notify('error', t('recovery.copyFailed'))
    }
  }

  if (mode === 'key') {
    return (
      <AuthShell>
        <div className="form-head">
          <div className="eyebrow">{t('app.name')}</div>
          <h2 className="font-display">{t('auth.recoveredTitle')}</h2>
          <p>{t('auth.recoveredSubtitle')}</p>
        </div>
        <RecoveryKeyPanel
          recoveryKey={freshKey}
          email={email.trim()}
          onDone={() => {
            // Erst nach der Bestätigung in der App anmelden
            forgetPendingKey()
            if (freshUser) setUser(freshUser)
            navigate('/')
          }}
        />
      </AuthShell>
    )
  }

  if (mode === 'recover') {
    return (
      <AuthShell>
        <form className="login-form-inner" onSubmit={handleRecover} noValidate>
          <div className="form-head">
            <div className="eyebrow">{t('app.name')}</div>
            <h2 className="font-display">{recoverTitle()}</h2>
            <p>{t('auth.recoverSubtitle')}</p>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rec-email">
              {t('auth.email')}
            </label>
            <input
              id="rec-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@firma.de"
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rec-key">
              {t('auth.recoveryKey')}
            </label>
            <input
              id="rec-key"
              className="input font-mono"
              autoComplete="off"
              spellCheck={false}
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rec-new">
              {t('auth.newPassword')}
            </label>
            <PasswordField id="rec-new" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            <div className="field-hint">{t('auth.passwordRule', { count: MIN_PASSWORD_LENGTH })}</div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rec-new2">
              {t('auth.newPasswordRepeat')}
            </label>
            <PasswordField id="rec-new2" value={newPassword2} onChange={setNewPassword2} autoComplete="new-password" />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="btn btn-primary login-submit" type="submit">
            {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
            {t('auth.recoverSubmit')}
            {!loading && <ArrowRight size={17} />}
          </button>
          <button type="button" className="login-link" onClick={() => switchMode('login')}>
            <ArrowLeft size={14} />
            {t('auth.backToLogin')}
          </button>

          {/* Notlösung ohne Schlüssel: nur sichtbar nach Klick auf das versteckte "s" (steht im Handbuch) */}
          {emergencyOpen && program && (
            <div className="login-emergency">
              <div className="login-emergency-head">
                <KeyRound size={15} />
                <span>{t('auth.emergencyTitle')}</span>
              </div>
              <p>{t('auth.emergencyAppText')}</p>
              <button type="button" className="btn btn-secondary btn-sm login-emergency-action" onClick={openProgramReset}>
                <KeyRound size={14} />
                {t('auth.emergencyAppButton')}
              </button>
            </div>
          )}
          {emergencyOpen && !program && (
            <div className="login-emergency">
              <div className="login-emergency-head">
                <Terminal size={15} />
                <span>{t('auth.emergencyTitle')}</span>
              </div>
              <p>{t('auth.emergencyText')}</p>
              <div className="login-command">
                <code className="font-mono">{RESET_COMMAND}</code>
                <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={copyCommand} aria-label={t('recovery.copy')}>
                  <Copy size={14} />
                </button>
              </div>
              <p>{t('auth.emergencyAfter')}</p>
            </div>
          )}
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <form className="login-form-inner" onSubmit={handleLogin} noValidate>
        <div className="form-head">
          <div className="eyebrow">{t('app.name')}</div>
          <h2 className="font-display">{t('auth.loginTitle')}</h2>
          <p>{t('auth.loginSubtitle')}</p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="email">
            {t('auth.email')}
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@firma.de"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="password">
            {t('auth.password')}
          </label>
          <PasswordField id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="btn btn-primary login-submit" type="submit">
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16 }} />
              {t('auth.loggingIn')}
            </>
          ) : (
            <>
              {t('auth.login')}
              <ArrowRight size={17} />
            </>
          )}
        </button>
        <button type="button" className="login-link" onClick={() => switchMode('recover')}>
          {t('auth.forgotPassword')}
        </button>
      </form>
    </AuthShell>
  )
}

// Ersteinrichtung: das einzige Konto anlegen, danach den Wiederherstellungsschlüssel zeigen
export function SetupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, needsSetup, initialized, setup, setUser, setupCodeRequired } = useAuth()
  const [setupCode, setSetupCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [freshKey, setFreshKey] = useState('')
  const [freshUser, setFreshUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Schon eingerichtet: zur Anmeldung bzw. in die App
  useEffect(() => {
    if (!initialized || freshKey) return
    if (user) navigate('/', { replace: true })
    else if (!needsSetup) navigate('/login', { replace: true })
  }, [initialized, needsSetup, user, freshKey, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    if (!name.trim() || !email.trim() || !password || (setupCodeRequired && !setupCode.trim())) {
      setError(t('auth.fillAll'))
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.passwordTooShort', { count: MIN_PASSWORD_LENGTH }))
      return
    }
    if (password !== password2) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    try {
      const res = await setup(name.trim(), email.trim(), password, setupCodeRequired ? setupCode.trim() : undefined)
      setFreshUser(res.user)
      setFreshKey(res.recoveryKey)
      rememberPendingKey(res.recoveryKey, email.trim())
    } catch (err) {
      setError(authError(err, t, 'setup'))
    } finally {
      setLoading(false)
    }
  }

  if (freshKey) {
    return (
      <AuthShell>
        <div className="form-head">
          <div className="eyebrow">{t('app.name')}</div>
          <h2 className="font-display">{t('auth.setupDoneTitle')}</h2>
          <p>{t('auth.setupDoneSubtitle')}</p>
        </div>
        <RecoveryKeyPanel
          recoveryKey={freshKey}
          email={email.trim()}
          onDone={() => {
            // Erst nach der Bestätigung in der App anmelden
            forgetPendingKey()
            if (freshUser) setUser(freshUser)
            navigate('/')
          }}
        />
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <form className="login-form-inner" onSubmit={handleSubmit} noValidate>
        <div className="form-head">
          <div className="eyebrow">{t('app.name')}</div>
          <h2 className="font-display">{t('auth.setupTitle')}</h2>
          <p>{t('auth.setupSubtitle')}</p>
        </div>
        {/* Nur bei Einrichtung von einem anderen Rechner: Code aus dem Serverprotokoll */}
        {setupCodeRequired && (
          <div className="field">
            <label className="field-label" htmlFor="setup-code">
              {t('auth.setupCode')}
            </label>
            <input
              id="setup-code"
              className="input font-mono"
              autoComplete="off"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value.toUpperCase())}
              placeholder="ABCD-EFGH"
            />
            <div className="field-hint">{t('auth.setupCodeHint')}</div>
          </div>
        )}
        <div className="field">
          <label className="field-label" htmlFor="setup-name">
            {t('auth.name')}
          </label>
          <input id="setup-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="setup-email">
            {t('auth.email')}
          </label>
          <input
            id="setup-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@firma.de"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="setup-password">
            {t('auth.password')}
          </label>
          <PasswordField id="setup-password" value={password} onChange={setPassword} autoComplete="new-password" />
          <div className="field-hint">{t('auth.passwordRule', { count: MIN_PASSWORD_LENGTH })}</div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="setup-password2">
            {t('auth.passwordRepeat')}
          </label>
          <PasswordField id="setup-password2" value={password2} onChange={setPassword2} autoComplete="new-password" />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button className="btn btn-primary login-submit" type="submit">
          {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
          {t('auth.setupSubmit')}
          {!loading && <ArrowRight size={17} />}
        </button>
      </form>
    </AuthShell>
  )
}
