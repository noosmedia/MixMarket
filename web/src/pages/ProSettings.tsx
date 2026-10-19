// Abschnitt der Einstellungen: MixMarket Pro. Abo kaufen (Monat oder Jahr), Schlüssel eintragen und
// freischalten, Stand des Abos sehen, Abo verwalten und den Schlüssel wieder entfernen.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ExternalLink, KeyRound, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { Modal } from '../components/Modal'
import { Loading } from '../components/Page'
import { useUi } from '../stores/ui'
import { clearPro, reloadPro, usePro } from '../pro/host'
import '../pro/pro.css'

type LicenseStatus = 'none' | 'unavailable' | 'active' | 'offline' | 'invalid' | 'expired' | 'installations' | 'outdated' | 'error'

// Antwort von GET /api/pro/license
interface LicenseInfo {
  status: LicenseStatus
  plan: 'monthly' | 'yearly' | 'granted' | null
  periodEnd: string | null
  // Abo gekündigt: endet zu periodEnd
  cancelAtPeriodEnd: boolean
  validUntil: string | null
  offline: boolean
  keyHint: string | null
  proVersion: string | null
  message: string | null
  checkedAt: string | null
  configured: boolean
  devMode: boolean
  coreVersion: string
}

type Plan = { amount: number; currency: string; taxIncluded: boolean } | null
type Plans = { monthly: Plan; yearly: Plan }

export function ProSettings() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { notify } = useUi()
  const webActive = usePro((s) => s.active)
  const [key, setKey] = useState('')
  const [removeOpen, setRemoveOpen] = useState(false)
  const lang = i18n.language === 'en' ? 'en' : 'de'
  const locale = lang === 'en' ? 'en-US' : 'de-DE'

  const licenseQuery = useQuery({
    queryKey: ['proLicense'],
    queryFn: () => api.get<LicenseInfo>('/api/pro/license'),
  })
  const license = licenseQuery.data

  // Preise nur zeigen, wenn noch kein laufendes Abo da ist
  const wantsPlans = !!license?.configured && !license.devMode && ['none', 'invalid', 'expired', 'error'].includes(license.status)
  const plansQuery = useQuery({
    queryKey: ['proPlans'],
    queryFn: () => api.get<Plans>('/api/pro/license/plans'),
    enabled: wantsPlans,
    staleTime: 60 * 60 * 1000,
    retry: false,
  })

  // Oberfläche an den Stand des Servers angleichen: Pro laden, wenn aktiv, sonst Einschübe zurücksetzen
  useEffect(() => {
    if (!license || license.devMode) return
    if (license.status === 'active' && !webActive) void reloadPro()
    if (license.status !== 'active' && webActive) clearPro()
  }, [license, webActive])

  function showError(err: unknown) {
    notify('error', err instanceof ApiError ? err.message : t('common.error'))
  }

  function updated(next: LicenseInfo) {
    queryClient.setQueryData(['proLicense'], next)
  }

  const activateMutation = useMutation({
    mutationFn: () => api.post<LicenseInfo>('/api/pro/license', { key }),
    onSuccess: (next) => {
      updated(next)
      if (next.status === 'active') {
        setKey('')
        notify('success', t('proLicense.activated'))
      } else {
        notify('error', t(`proLicense.status.${next.status}.text`))
      }
    },
    onError: showError,
  })

  const checkMutation = useMutation({
    mutationFn: () => api.post<LicenseInfo>('/api/pro/license/check'),
    onSuccess: (next) => {
      updated(next)
      notify(next.status === 'active' ? 'success' : 'warning', t(`proLicense.status.${next.status}.title`))
    },
    onError: showError,
  })

  const removeMutation = useMutation({
    mutationFn: () => api.delete<LicenseInfo>('/api/pro/license'),
    onSuccess: (next) => {
      updated(next)
      setRemoveOpen(false)
      clearPro()
      notify('info', t('proLicense.removed'))
    },
    onError: showError,
  })

  // Nach „Abo verwalten“ kommt der Nutzer aus dem Stripe-Fenster zurück: dann still neu prüfen,
  // damit eine Kündigung oder eine neue Zahlungsart sofort angezeigt wird
  const recheckOnReturn = useRef(false)
  useEffect(() => {
    const onFocus = () => {
      if (!recheckOnReturn.current) return
      recheckOnReturn.current = false
      api.post<LicenseInfo>('/api/pro/license/check').then(updated, () => undefined)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Stripe-Seite in neuem Fenster öffnen. Das Fenster wird sofort beim Klick geöffnet, damit der
  // Browser es nicht als ungefragtes Fenster blockiert, und bekommt die Adresse, sobald sie da ist.
  const openExternal = useMutation({
    mutationFn: async (kind: 'monthly' | 'yearly' | 'portal') => {
      const win = window.open('', '_blank')
      try {
        const res =
          kind === 'portal'
            ? await api.post<{ url: string }>('/api/pro/license/portal')
            : await api.post<{ url: string }>('/api/pro/license/checkout', { plan: kind, lang })
        if (win) {
          win.opener = null
          win.location.href = res.url
        } else {
          window.location.href = res.url
        }
        if (kind === 'portal') recheckOnReturn.current = true
      } catch (err) {
        win?.close()
        throw err
      }
    },
    onError: showError,
  })

  function activate(e: React.FormEvent) {
    e.preventDefault()
    if (activateMutation.isPending) return
    if (!key.trim()) {
      notify('error', t('proLicense.keyMissing'))
      return
    }
    activateMutation.mutate()
  }

  function price(plan: Plan, kind: 'monthly' | 'yearly'): string | null {
    if (!plan) return null
    const amount = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: plan.currency.toUpperCase(),
      minimumFractionDigits: plan.amount % 100 ? 2 : 0,
    }).format(plan.amount / 100)
    return t(kind === 'monthly' ? 'proLicense.perMonth' : 'proLicense.perYear', { amount })
  }

  // Ersparnis des Jahresabos gegenüber zwölf Monatsabos in ganzen Prozent (nur bei gleicher Währung)
  function yearlySaving(plans: Plans | undefined): number | null {
    const m = plans?.monthly
    const y = plans?.yearly
    if (!m || !y || m.currency !== y.currency || m.amount <= 0) return null
    const percent = Math.round((1 - y.amount / (m.amount * 12)) * 100)
    return percent >= 1 ? percent : null
  }

  // Freischaltung ohne Enddatum: der Lizenzserver meldet dafür den 31.12.9999
  const unlimited = (value: string | null) => !!value && new Date(value).getUTCFullYear() >= 9999
  const date = (value: string | null) => (value ? new Date(value).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '')
  const dateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''

  const head = (
    <div className="settings-panel-head">
      <span className="settings-panel-icon">
        <Sparkles size={18} />
      </span>
      <div className="settings-panel-titles">
        <h2 className="settings-panel-title font-display">MixMarket Pro</h2>
      </div>
      {license && license.configured && !license.devMode && (
        <span className={`badge ${license.status === 'active' ? 'badge-active' : license.status === 'none' ? 'badge-unsub' : 'badge-warning'} pro-license-badge`}>
          <span className="badge-dot" />
          {t(`proLicense.status.${license.status}.title`)}
        </span>
      )}
    </div>
  )

  if (licenseQuery.isLoading) {
    return (
      <div className="panel" id="mixmarket-pro">
        {head}
        <Loading />
      </div>
    )
  }

  if (licenseQuery.isError || !license) {
    return (
      <div className="panel" id="mixmarket-pro">
        {head}
        <span className="badge badge-warning badge-multiline">
          <AlertTriangle size={14} />
          {licenseQuery.error instanceof ApiError ? licenseQuery.error.message : t('common.error')}
        </span>
      </div>
    )
  }

  const hasKey = !!license.keyHint
  const busy = activateMutation.isPending || checkMutation.isPending || removeMutation.isPending

  return (
    <div className="panel" id="mixmarket-pro">
      {head}
      <p className="settings-smtp-hint providers-intro">{t('proLicense.intro')}</p>

      {/* Entwicklungsmodus oder kein Lizenzserver: nur Hinweis */}
      {license.devMode && <p className="field-hint">{t('proLicense.devMode')}</p>}
      {!license.devMode && !license.configured && <p className="field-hint">{t('proLicense.status.unavailable.text')}</p>}

      {!license.devMode && license.configured && (
        <>
          {/* Stand des Abos */}
          {license.status === 'active' ? (
            <div className="providers-block">
              <dl className="pro-license-facts">
                <dt>{t('proLicense.plan')}</dt>
                <dd>{license.plan ? t(`proLicense.plans.${license.plan}`) : ''}</dd>
                {license.plan === 'granted' ? (
                  <>
                    {/* Ohne Abo freigeschaltet: kein Zahlungszeitraum, nur gültig bis oder unbegrenzt */}
                    <dt>{t('proLicense.validUntil')}</dt>
                    <dd>{unlimited(license.periodEnd) ? t('proLicense.unlimited') : date(license.periodEnd)}</dd>
                  </>
                ) : (
                  <>
                    <dt>{t(license.cancelAtPeriodEnd ? 'proLicense.endsOn' : 'proLicense.paidUntil')}</dt>
                    <dd>{date(license.periodEnd)}</dd>
                  </>
                )}
                <dt>{t('proLicense.key')}</dt>
                <dd className="pro-license-key">MMPRO-…{license.keyHint}</dd>
              </dl>
              {license.cancelAtPeriodEnd && (
                <p className="pro-license-note">
                  <AlertTriangle size={14} />
                  {t('proLicense.cancelledNote', { date: date(license.periodEnd) })}
                </p>
              )}
              {license.offline && (
                <p className="pro-license-note">
                  <AlertTriangle size={14} />
                  {t('proLicense.offlineGrace', { until: dateTime(license.validUntil) })}
                </p>
              )}
              <div className="providers-actions">
                {license.plan !== 'granted' && (
                  <button className="btn btn-sm btn-secondary" type="button" onClick={() => openExternal.mutate('portal')}>
                    {openExternal.isPending && openExternal.variables === 'portal' ? (
                      <span className="spinner" style={{ width: 14, height: 14 }} />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                    {t('proLicense.manage')}
                  </button>
                )}
                {license.offline && (
                  <button className="btn btn-sm btn-secondary" type="button" onClick={() => !busy && checkMutation.mutate()}>
                    {checkMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={14} />}
                    {t('proLicense.checkNow')}
                  </button>
                )}
                <button className="btn btn-sm btn-ghost" type="button" onClick={() => setRemoveOpen(true)}>
                  <Trash2 size={14} />
                  {t('proLicense.remove')}
                </button>
              </div>
            </div>
          ) : (
            license.status !== 'none' && (
              <div className="providers-block">
                <p className="pro-license-note">
                  <AlertTriangle size={14} />
                  <span>
                    {license.status === 'expired' && license.plan === 'granted'
                      ? t('proLicense.grantedExpired')
                      : t(`proLicense.status.${license.status}.text`)}
                    {license.status === 'outdated' && license.message ? ` (${license.message})` : ''}
                    {license.status === 'error' && license.message ? ` ${license.message}` : ''}
                  </span>
                </p>
                {hasKey && (
                  <div className="providers-actions">
                    <span className="field-hint pro-license-key">
                      {t('proLicense.key')}: MMPRO-…{license.keyHint}
                    </span>
                  </div>
                )}
                {hasKey && (
                  <div className="providers-actions">
                    <button className="btn btn-sm btn-secondary" type="button" onClick={() => !busy && checkMutation.mutate()}>
                      {checkMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={14} />}
                      {t('proLicense.checkNow')}
                    </button>
                    {license.status === 'expired' && license.plan !== 'granted' && (
                      <button className="btn btn-sm btn-secondary" type="button" onClick={() => openExternal.mutate('portal')}>
                        {openExternal.isPending && openExternal.variables === 'portal' ? (
                          <span className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                          <ExternalLink size={14} />
                        )}
                        {t('proLicense.manage')}
                      </button>
                    )}
                    <button className="btn btn-sm btn-ghost" type="button" onClick={() => setRemoveOpen(true)}>
                      <Trash2 size={14} />
                      {t('proLicense.remove')}
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Kaufen: nur ohne laufendes Abo */}
          {wantsPlans && (
            <div className="providers-block">
              <div>
                <div className="providers-block-title">{t('proLicense.buyTitle')}</div>
                <div className="field-hint">{t('proLicense.buyHint')}</div>
              </div>
              <div className="providers-actions pro-plan-options">
                {(['monthly', 'yearly'] as const).map((kind) => {
                  const saving = kind === 'yearly' ? yearlySaving(plansQuery.data) : null
                  return (
                    <div key={kind} className="pro-plan-option">
                      {/* Über dem Jahresabo: Ersparnis gegenüber zwölf Monaten; beim Monatsabo bleibt die Zeile leer */}
                      <span className={`pro-plan-saving${saving ? '' : ' is-empty'}`} aria-hidden={!saving}>
                        {saving ? t('proLicense.yearlySaving', { percent: saving }) : '\u00a0'}
                      </span>
                      <button className="btn btn-sm btn-secondary" type="button" onClick={() => openExternal.mutate(kind)}>
                        {openExternal.isPending && openExternal.variables === kind ? (
                          <span className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                          <ExternalLink size={14} />
                        )}
                        {t(`proLicense.plans.${kind}`)}
                        {price(plansQuery.data?.[kind] ?? null, kind) && <span className="pro-license-price">{price(plansQuery.data?.[kind] ?? null, kind)}</span>}
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="field-hint">
                {t('proLicense.renewal')}
                {plansQuery.data && (plansQuery.data.monthly?.taxIncluded || plansQuery.data.yearly?.taxIncluded) ? ` ${t('proLicense.taxIncluded')}` : ''}
              </div>
            </div>
          )}

          {/* Schlüssel eintragen: ohne Schlüssel oder wenn der gespeicherte nicht (mehr) gilt. Ist der Schlüssel in
              Ordnung und nur der Lizenzserver weg oder die Version unpassend, hilft ein anderer Schlüssel nicht. */}
          {(!hasKey || ['invalid', 'expired', 'installations', 'error'].includes(license.status)) && license.status !== 'active' && (
            <form className="providers-block" onSubmit={activate}>
              <div className="field">
                <label className="field-label" htmlFor="pro-key">
                  {t('proLicense.keyLabel')}
                </label>
                <input
                  id="pro-key"
                  className="input pro-license-input"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="MMPRO-XXXXX-XXXXX-XXXXX-XXXXX"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="field-hint">{t('proLicense.keyHint')}</div>
              </div>
              <div className="providers-actions">
                <button className="btn btn-sm btn-primary" type="submit">
                  {activateMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <KeyRound size={14} />}
                  {t('proLicense.activate')}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Schlüssel entfernen: eigene Rückfrage, Abbrechen als Standard */}
      <Modal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title={t('proLicense.removeTitle')}
        width={460}
        footer={
          <>
            <button className="btn btn-secondary" type="button" onClick={() => setRemoveOpen(false)} autoFocus>
              {t('common.cancel')}
            </button>
            <button className="btn btn-danger" type="button" onClick={() => !removeMutation.isPending && removeMutation.mutate()}>
              {removeMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
              {t('proLicense.remove')}
            </button>
          </>
        }
      >
        <p className="pro-dialog-text">{t('proLicense.removeText')}</p>
      </Modal>
    </div>
  )
}
