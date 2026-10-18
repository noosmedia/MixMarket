// Einstellungsseite. Bündelt Unternehmensdaten, Postfach, Recherche-Zugänge, KI und Darstellung.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Building2, Palette, Languages, AlertTriangle, Moon, Sun } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { PageHeader, PageBody, Loading } from '../components/Page'
import { useUi } from '../stores/ui'
import { ProSlot } from '../pro/host'
import { ProPanel } from '../pro/ProTeaser'
import { AiSettings } from './AiSettings'
import { MailboxSettings } from './MailboxSettings'
import { AccountSettings } from './AccountSettings'
import { ProSettings } from './ProSettings'
import './settings.css'

// Form der gespeicherten Einstellungen, wie sie vom Backend kommen
interface SettingsData {
  id: string
  companyName?: string
  postalAddress?: string
  signatureHtml?: string
  unsubFooterDe?: string
  unsubFooterEn?: string
  updatedAt?: string
}

// Antwort von GET /api/settings
interface SettingsResponse {
  settings: SettingsData
  smtpConfigured: boolean
}

// Nur die Felder, die per PUT geschickt werden duerfen
interface SettingsForm {
  companyName: string
  postalAddress: string
  signatureHtml: string
  unsubFooterDe: string
  unsubFooterEn: string
}

// Leeres Formular als Ausgangszustand
const emptyForm: SettingsForm = {
  companyName: '',
  postalAddress: '',
  signatureHtml: '',
  unsubFooterDe: '',
  unsubFooterEn: '',
}

export function SettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  // Darstellung und Benachrichtigungen aus dem zentralen UI-Store
  const { notify, theme, setTheme, language, setLanguage } = useUi()

  // Lokaler Formularzustand, getrennt von der Serverantwort
  const [form, setForm] = useState<SettingsForm>(emptyForm)

  // Einstellungen laden
  const { data, isLoading, isError, error } = useQuery<SettingsResponse>({
    queryKey: ['settings'],
    queryFn: () => api.get<SettingsResponse>('/api/settings'),
  })

  // Sprung zum Abschnitt, wenn die Übersicht ("Erste Schritte") oder ein Pro-Hinweis hierher verlinkt.
  // Ohne MixMarket Pro steht unter #recherche-zugaenge der Pro-Hinweis, der springt ebenfalls hierher.
  const { hash } = useLocation()
  useEffect(() => {
    if (data && ['#unternehmen', '#recherche-zugaenge', '#mixmarket-pro'].includes(hash)) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [data, hash])

  // Geladene Werte in das Formular übernehmen
  useEffect(() => {
    if (data?.settings) {
      const s = data.settings
      setForm({
        companyName: s.companyName ?? '',
        postalAddress: s.postalAddress ?? '',
        signatureHtml: s.signatureHtml ?? '',
        unsubFooterDe: s.unsubFooterDe ?? '',
        unsubFooterEn: s.unsubFooterEn ?? '',
      })
    }
  }, [data])

  // Einstellungen speichern
  const saveMutation = useMutation({
    mutationFn: (body: SettingsForm) => api.put<SettingsResponse>('/api/settings', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      notify('success', t('settings.saved'))
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : t('common.save')
      notify('error', message)
    },
  })

  // Einzelnes Feld im Formular aktualisieren
  const update = (key: keyof SettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Speichern absenden
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  // Ladezustand
  if (isLoading) {
    return (
      <>
        <PageHeader help={{ chapter: 'settings' }} eyebrow="MixMarket" title={t('settings.title')} />
        <PageBody>
          <Loading />
        </PageBody>
      </>
    )
  }

  // Fehlerzustand
  if (isError) {
    const message = error instanceof ApiError ? error.message : t('settings.title')
    return (
      <>
        <PageHeader help={{ chapter: 'settings' }} eyebrow="MixMarket" title={t('settings.title')} />
        <PageBody>
          <div className="panel">
            <div className="settings-smtp-status">
              <span className="badge badge-warning badge-multiline">
                <AlertTriangle size={14} />
                {message}
              </span>
            </div>
          </div>
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader help={{ chapter: 'settings' }} eyebrow="MixMarket" title={t('settings.title')} />
      <PageBody>
        <div className="settings-stack">
          {/* Block: eigenes Konto (Anmeldung, Passwort, Wiederherstellungsschlüssel) */}
          <AccountSettings />

          {/* Block: MixMarket Pro (Abo kaufen, Schlüssel eintragen, Abo verwalten) */}
          <ProSettings />

          {/* Block: Unternehmensdaten */}
          <form className="panel settings-form" id="unternehmen" onSubmit={handleSave}>
            <div className="settings-panel-head">
              <span className="settings-panel-icon">
                <Building2 size={18} />
              </span>
              <div className="settings-panel-titles">
                <h2 className="settings-panel-title font-display">{t('settings.company')}</h2>
              </div>
            </div>

            <div className="field" data-tour="company-name">
              <label className="field-label" htmlFor="companyName">
                {t('settings.companyName')}
              </label>
              <input
                id="companyName"
                className="input"
                type="text"
                value={form.companyName}
                onChange={(e) => update('companyName', e.target.value)}
                placeholder={t('settings.companyNamePlaceholder')}
              />
            </div>

            <div className="field" data-tour="company-address">
              <label className="field-label" htmlFor="postalAddress">
                {t('settings.postalAddress')}
              </label>
              <textarea
                id="postalAddress"
                className="textarea"
                rows={3}
                value={form.postalAddress}
                onChange={(e) => update('postalAddress', e.target.value)}
                placeholder={t('settings.postalAddressPlaceholder')}
              />
              {/* Hinweis: Pflichtangabe für den E-Mail-Footer */}
              <div className="field-hint">
                {t('settings.postalAddressHint', {
                  defaultValue: 'Erscheint im Footer jeder versendeten E-Mail.',
                })}
              </div>
            </div>

            <div className="field" data-tour="company-signature">
              <label className="field-label" htmlFor="signatureHtml">
                {t('settings.signature')}
              </label>
              <textarea
                id="signatureHtml"
                className="textarea"
                rows={4}
                value={form.signatureHtml}
                onChange={(e) => update('signatureHtml', e.target.value)}
                placeholder={t('settings.signaturePlaceholder')}
              />
              <div className="field-hint">{t('settings.signatureHint')}</div>
            </div>

            <div className="settings-grid-2" data-tour="company-footers">
              <div className="field">
                <label className="field-label" htmlFor="unsubFooterDe">
                  {t('settings.unsubFooterDe')}
                </label>
                <textarea
                  id="unsubFooterDe"
                  className="textarea"
                  rows={3}
                  value={form.unsubFooterDe}
                  onChange={(e) => update('unsubFooterDe', e.target.value)}
                  placeholder="Abmelden"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="unsubFooterEn">
                  {t('settings.unsubFooterEn')}
                </label>
                <textarea
                  id="unsubFooterEn"
                  className="textarea"
                  rows={3}
                  value={form.unsubFooterEn}
                  onChange={(e) => update('unsubFooterEn', e.target.value)}
                  placeholder="Unsubscribe"
                />
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn btn-primary" type="submit" disabled={saveMutation.isPending} data-tour="company-save">
                {saveMutation.isPending ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                    {t('common.save')}
                  </>
                ) : (
                  <>
                    <Settings size={16} />
                    {t('common.save')}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Block: Postfach für Versand und Empfang */}
          <MailboxSettings />

          {/* Block: Zugänge zu den Suchquellen der Recherche */}
          {/* Zugänge zu bezahlten Suchquellen gehören zu MixMarket Pro */}
          <ProSlot
            name="settings.providers"
            fallback={
              <div id="recherche-zugaenge">
                <ProPanel feature="paidSources" />
              </div>
            }
          />

          {/* Block: KI-Bewertung der gefundenen Firmen */}
          <AiSettings />

          {/* Block: Darstellung */}
          <div className="panel">
            <div className="settings-panel-head">
              <span className="settings-panel-icon">
                <Palette size={18} />
              </span>
              <div className="settings-panel-titles">
                <h2 className="settings-panel-title font-display">{t('settings.appearance')}</h2>
              </div>
            </div>

            {/* Theme-Umschalter: wirkt sofort */}
            <div className="settings-option-row">
              <span className="field-label" style={{ margin: 0 }}>
                {t('settings.theme')}
              </span>
              <div className="segmented">
                <button
                  type="button"
                  className={theme === 'dark' ? 'active' : ''}
                  onClick={() => setTheme('dark')}
                >
                  <span className="flex items-center gap-2">
                    <Moon size={15} />
                    {t('settings.themeDark')}
                  </span>
                </button>
                <button
                  type="button"
                  className={theme === 'light' ? 'active' : ''}
                  onClick={() => setTheme('light')}
                >
                  <span className="flex items-center gap-2">
                    <Sun size={15} />
                    {t('settings.themeLight')}
                  </span>
                </button>
              </div>
            </div>

            {/* Sprach-Umschalter: wirkt sofort */}
            <div className="settings-option-row">
              <span className="field-label" style={{ margin: 0 }}>
                {t('settings.language')}
              </span>
              <div className="segmented">
                <button
                  type="button"
                  className={language === 'de' ? 'active' : ''}
                  onClick={() => setLanguage('de')}
                >
                  <span className="flex items-center gap-2">
                    <Languages size={15} />
                    DE
                  </span>
                </button>
                <button
                  type="button"
                  className={language === 'en' ? 'active' : ''}
                  onClick={() => setLanguage('en')}
                >
                  <span className="flex items-center gap-2">
                    <Languages size={15} />
                    EN
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  )
}
