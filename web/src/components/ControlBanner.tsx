// Balken oben auf jeder Seite, solange der Not-Aus aktiv ist oder die KI pausiert.
// Der Not-Aus lässt sich hier direkt aufheben (mit Rückfrage).
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { OctagonX, PauseCircle, Play } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useUi } from '../stores/ui'

interface ControlState {
  sendingStopped: boolean
  sendingStoppedAt: string | null
  sendingStopReason: string | null
  aiPaused: boolean
  aiPausedUntil: string | null
}

export function ControlBanner() {
  const { t, i18n } = useTranslation()
  const { notify, confirm } = useUi()
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ['controlState'],
    queryFn: () => api.get<ControlState>('/api/control/state'),
    refetchInterval: 30000,
  })
  const resume = useMutation({
    mutationFn: () => api.post<unknown>('/api/control/resume'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlState'] })
      queryClient.invalidateQueries({ queryKey: ['control'] })
      notify('success', t('control.resumedToast'))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('common.error')),
  })
  if (!data || (!data.sendingStopped && !data.aiPaused)) return null

  const locale = i18n.language === 'en' ? 'en-GB' : 'de-DE'
  const until = data.aiPausedUntil
    ? new Date(data.aiPausedUntil).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  async function askResume() {
    const ok = await confirm({
      message: t('control.resumeConfirm'),
      confirmLabel: t('control.resume'),
      notes: [t('control.resumeNote')],
    })
    if (ok) resume.mutate()
  }

  return (
    <div className="control-banners">
      {data.sendingStopped && (
        <div className="control-banner is-stopped" role="alert">
          <OctagonX size={16} />
          <span>{t('control.banner.stopped')}</span>
          <button type="button" className="control-banner-btn" onClick={askResume}>
            <Play size={13} />
            {t('control.resume')}
          </button>
        </div>
      )}
      {data.aiPaused && (
        <div className="control-banner is-paused" role="status">
          <PauseCircle size={16} />
          <span>{until ? t('control.banner.aiPausedUntil', { until }) : t('control.banner.aiPaused')}</span>
        </div>
      )}
    </div>
  )
}
