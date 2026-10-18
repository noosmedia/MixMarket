// Abschnitt der Einstellungen: KI-Bewertung. Anbieter (Claude-Abo oder
// ChatGPT-Abo) und optionales Modell. Was verkauft wird und wer der ideale
// Kunde ist, steht je Produkt in der Recherche unter "Produkte verwalten".
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, ShieldCheck, Sparkles } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { Loading } from '../components/Page'
import { useUi } from '../stores/ui'
import { Select } from '../components/Select'

type Provider = 'claude' | 'codex'

interface AiSettingsData {
  provider: Provider | null
  model: string
}

export function AiSettings() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notify } = useUi()

  const [provider, setProvider] = useState<Provider | null>(null)
  const [model, setModel] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['aiSettings'],
    queryFn: () => api.get<AiSettingsData>('/api/ai/settings'),
  })

  // Modelle, die das gewählte Abo anbietet
  const modelsQuery = useQuery({
    queryKey: ['aiModels', provider],
    queryFn: () => api.get<{ models: Array<{ value: string; label: string }> }>(`/api/ai/models?provider=${provider}`),
    enabled: provider !== null,
  })
  const modelOptions = [
    { value: '', label: t('ai.modelDefault') },
    ...(modelsQuery.data?.models ?? []),
    // Früher frei eingetragener Name, der nicht in der Liste steht, bleibt wählbar
    ...(model && !(modelsQuery.data?.models ?? []).some((m) => m.value === model) ? [{ value: model, label: model }] : []),
  ]

  // Gespeicherte Werte übernehmen
  useEffect(() => {
    if (!data) return
    setProvider(data.provider)
    setModel(data.model)
  }, [data])

  // Nach dem Laden zum Abschnitt springen, wenn die Zielgruppen hierher verlinken
  useEffect(() => {
    if (data && window.location.hash === '#ki-bewertung') {
      document.getElementById('ki-bewertung')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => api.put<{ ok: boolean }>('/api/ai/settings', { provider, model: model.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSettings'] })
      notify('success', t('ai.saved'))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('discovery.genericError')),
  })

  const checkMutation = useMutation({
    mutationFn: () => api.post<{ ok: boolean; message: string }>('/api/ai/check', { provider }),
    onSuccess: (result) => notify(result.ok ? 'success' : 'error', result.ok ? t('ai.checkOk') : result.message),
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('discovery.genericError')),
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (model.trim() && !/^[A-Za-z0-9._:-]+$/.test(model.trim())) {
      notify('error', t('ai.modelInvalid'))
      return
    }
    saveMutation.mutate()
  }

  return (
    <form className="panel" id="ki-bewertung" onSubmit={handleSave}>
      <div className="settings-panel-head">
        <span className="settings-panel-icon">
          <Sparkles size={18} />
        </span>
        <div className="settings-panel-titles">
          <div className="eyebrow">{t('nav.scraper')}</div>
          <h2 className="settings-panel-title font-display">{t('ai.title')}</h2>
        </div>
      </div>
      <p className="settings-smtp-hint providers-intro">{t('ai.intro')}</p>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <span className="badge badge-warning">
          <AlertTriangle size={14} />
          {error instanceof ApiError ? error.message : t('discovery.loadError')}
        </span>
      ) : (
        <>
          {/* Anbieter */}
          <div className="providers-block">
            <div className="field" data-tour="ai-provider">
              <span className="field-label">{t('ai.provider')}</span>
              <div className="segmented" role="radiogroup" aria-label={t('ai.provider')}>
                {(['claude', 'codex'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={provider === p}
                    className={provider === p ? 'active' : ''}
                    onClick={() => {
                      // Beim Wechsel des Abos gilt dessen Standardmodell, Modellnamen passen nicht zum anderen Abo
                      if (p !== provider) setModel('')
                      setProvider(p)
                    }}
                  >
                    {t(`ai.providers.${p}`)}
                  </button>
                ))}
              </div>
              <div className="field-hint">{provider ? t(`ai.providerHint.${provider}`) : t('ai.providerNone')}</div>
            </div>
            <div className="settings-grid-2">
              <div className="field" data-tour="ai-model">
                <label className="field-label" htmlFor="ai-model">
                  {t('ai.model')}
                </label>
                <Select id="ai-model" value={model} onChange={(v) => setModel(v)} options={modelOptions} />
                <div className="field-hint">{t('ai.modelHint')}</div>
              </div>
            </div>
            <div className="providers-actions">
              <button
                type="button"
                data-tour="ai-check"
                className="btn btn-sm btn-secondary"
                onClick={() => (provider ? checkMutation.mutate() : notify('warning', t('ai.providerNone')))}
                disabled={checkMutation.isPending}
              >
                {checkMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <ShieldCheck size={14} />}
                {t('ai.check')}
              </button>
              <span className="field-hint">{t('ai.securityNote')}</span>
            </div>
          </div>

          {/* Produkte werden in der Recherche gepflegt */}
          <p className="field-hint">
            {t('ai.productsHint')} <Link to="/scraper">{t('ai.productsLink')}</Link>
          </p>

          <div className="settings-actions">
            <button className="btn btn-primary" type="submit" disabled={saveMutation.isPending} data-tour="ai-save">
              {saveMutation.isPending ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Check size={16} />}
              {t('ai.save')}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
