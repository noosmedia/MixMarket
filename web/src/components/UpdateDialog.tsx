// Updates: Abgleich der eigenen Version mit GitHub, Hinweis im Benutzermenü und Fenster mit den
// Neuerungen. Im Programm lädt und installiert ein Knopf die neue Version. Aktualisiert wird nie ohne Klick.
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Download, ExternalLink, RefreshCw, RotateCw } from 'lucide-react'
import { api } from '../lib/api'
import { desktop, type DesktopBridge } from '../lib/desktop'
import { useUi } from '../stores/ui'
import { Modal } from './Modal'

export interface UpdateStatus {
  current: string
  latest: string | null
  available: boolean
  notes: string | null
  checkedAt: string
  error: 'unreachable' | null
  repoUrl: string
}

// Stand der Updates; der Server fragt höchstens einmal am Tag bei GitHub nach
export function useUpdateStatus(enabled: boolean) {
  return useQuery({
    queryKey: ['updateStatus'],
    queryFn: () => api.get<UpdateStatus>('/api/settings/update'),
    enabled,
    staleTime: 60 * 60 * 1000,
    refetchInterval: 6 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// Abschnitte aus dem CHANGELOG als schlichte Liste darstellen (Versionen, Rubriken, Punkte)
function ChangeNotes({ notes }: { notes: string }) {
  const blocks: React.ReactNode[] = []
  let items: string[] = []
  const flush = (key: string) => {
    if (!items.length) return
    blocks.push(
      <ul key={key} className="update-notes-list">
        {items.map((text, i) => (
          <li key={i}>{text}</li>
        ))}
      </ul>,
    )
    items = []
  }
  notes.split('\n').forEach((raw, index) => {
    const line = raw.replace(/\*\*/g, '').trim()
    if (!line) return
    if (line.startsWith('- ')) {
      items.push(line.slice(2))
      return
    }
    flush(`l${index}`)
    if (line.startsWith('### ')) blocks.push(<div key={index} className="update-notes-section">{line.slice(4)}</div>)
    else if (line.startsWith('## ')) blocks.push(<div key={index} className="update-notes-version font-mono">{line.slice(3)}</div>)
    else blocks.push(<p key={index} className="update-notes-text">{line}</p>)
  })
  flush('end')
  return <div className="update-notes">{blocks}</div>
}

// Installiertes Programm: neue Version laden und installieren (Fortschritt, Fehler mit vollständiger Meldung).
// macOS kann sich ohne Apple-Signatur nicht selbst ersetzen; dort führt der Knopf zur Download-Seite.
type DesktopStep =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'downloading'; percent: number }
  | { kind: 'ready' }
  | { kind: 'installing' }
  | { kind: 'manual' }
  | { kind: 'notYet' }
  | { kind: 'error'; message: string }

function DesktopUpdate({ bridge, latest, repoUrl }: { bridge: DesktopBridge; latest: string; repoUrl: string }) {
  const { t } = useTranslation()
  const [step, setStep] = useState<DesktopStep>({ kind: 'idle' })
  const releasesUrl = `${repoUrl}/releases/latest`

  // Fortschritt des Downloads mitlesen, solange das Fenster offen ist
  useEffect(() => bridge.onUpdateProgress((percent) => setStep({ kind: 'downloading', percent })), [bridge])

  async function start() {
    // Läuft schon: zweiter Klick ändert nichts (Knopf bleibt klickbar, zeigt aber den Fortschritt)
    if (step.kind === 'checking' || step.kind === 'downloading' || step.kind === 'installing') return
    setStep({ kind: 'checking' })
    const check = await bridge.checkUpdate()
    if (check.status === 'unsupported') return setStep({ kind: 'manual' })
    if (check.status === 'error') return setStep({ kind: 'error', message: check.message })
    // GitHub kennt die Version schon, das Installationspaket ist aber noch nicht fertig gebaut
    if (check.status === 'none') return setStep({ kind: 'notYet' })
    setStep({ kind: 'downloading', percent: 0 })
    const result = await bridge.downloadUpdate()
    setStep(result.ok ? { kind: 'ready' } : { kind: 'error', message: result.message ?? '' })
  }

  async function install() {
    setStep({ kind: 'installing' })
    await bridge.installUpdate()
  }

  const busy = step.kind === 'checking' || step.kind === 'downloading' || step.kind === 'installing'
  return (
    <section className="update-block">
      <h3 className="update-heading">{t('update.howTo')}</h3>
      {step.kind === 'idle' && <p className="update-text">{t('update.desktopIntro', { version: latest })}</p>}
      {step.kind === 'checking' && (
        <div className="update-state">
          <span className="spinner" />
          <span>{t('update.desktopChecking')}</span>
        </div>
      )}
      {step.kind === 'downloading' && (
        <div className="update-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={step.percent}>
          <div className="update-progress-text">
            <span>{t('update.desktopDownloading')}</span>
            <span className="font-mono">{step.percent} %</span>
          </div>
          <div className="update-progress-bar">
            <span style={{ width: `${step.percent}%` }} />
          </div>
        </div>
      )}
      {step.kind === 'ready' && <p className="update-text">{t('update.desktopReady')}</p>}
      {step.kind === 'installing' && (
        <div className="update-state">
          <span className="spinner" />
          <span>{t('update.desktopInstalling')}</span>
        </div>
      )}
      {step.kind === 'manual' && <p className="update-text">{t(bridge.platform === 'darwin' ? 'update.desktopManualMac' : 'update.desktopManual')}</p>}
      {step.kind === 'notYet' && <p className="update-text">{t('update.desktopNotYet', { version: latest })}</p>}
      {step.kind === 'error' && (
        <>
          <p className="update-text">{t('update.desktopFailed')}</p>
          {step.message && <pre className="update-error font-mono">{step.message}</pre>}
        </>
      )}
      <p className="update-hint">
        <Check size={14} />
        {t('update.dataSafe')}
      </p>
      <div className="update-actions">
        {(step.kind === 'idle' || busy) && (
          <button type="button" className="btn btn-primary" onClick={start}>
            {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Download size={16} />}
            {t('update.desktopUpdate')}
          </button>
        )}
        {step.kind === 'ready' && (
          <button type="button" className="btn btn-primary" onClick={install}>
            <RotateCw size={16} />
            {t('update.desktopRestart')}
          </button>
        )}
        {(step.kind === 'notYet' || step.kind === 'error') && (
          <button type="button" className="btn btn-secondary" onClick={start}>
            <RefreshCw size={16} />
            {t('update.checkAgain')}
          </button>
        )}
        {(step.kind === 'manual' || step.kind === 'error') && (
          <a className="btn btn-primary" href={releasesUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            {t('update.desktopDownloadPage')}
          </a>
        )}
      </div>
    </section>
  )
}

// checkOnOpen: beim Öffnen sofort neu bei GitHub nachsehen (Menüpunkt "Nach Updates suchen")
export function UpdateDialog({ open, onClose, checkOnOpen }: { open: boolean; onClose: () => void; checkOnOpen: boolean }) {
  const { t, i18n } = useTranslation()
  const { notify } = useUi()
  const queryClient = useQueryClient()
  const status = useUpdateStatus(open)
  const [checking, setChecking] = useState(false)
  // Brücke zum Programm: Aktualisieren per Knopf
  const bridge = desktop()
  const data = status.data

  // Sofort neu bei GitHub nachsehen
  async function checkNow() {
    setChecking(true)
    try {
      const fresh = await api.get<UpdateStatus>('/api/settings/update?force=1')
      queryClient.setQueryData(['updateStatus'], fresh)
    } catch {
      notify('error', t('update.checkFailed'))
    } finally {
      setChecking(false)
    }
  }

  // Nur beim Öffnen auslösen, nicht bei jedem neuen Zeichnen
  useEffect(() => {
    if (open && checkOnOpen) void checkNow()
  }, [open, checkOnOpen])

  const checkedAt = data
    ? new Date(data.checkedAt).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const title = data?.available ? t('update.titleAvailable', { version: data.latest }) : t('update.title')
  const subtitle = data ? t('update.current', { version: data.current }) : undefined

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} width={560}>
      {/* Laden oder gerade neu prüfen */}
      {(status.isLoading || checking) && (
        <div className="update-state">
          <span className="spinner" />
          <span>{t('update.checking')}</span>
        </div>
      )}

      {/* Server nicht erreichbar */}
      {!status.isLoading && !checking && status.isError && <p className="update-text">{t('update.checkFailed')}</p>}

      {/* Ergebnis: neueste Version, GitHub nicht erreichbar oder Update verfügbar */}
      {!status.isLoading && !checking && data && !data.available && (
        <div className="update-uptodate">
          <p className="update-text">{data.error ? t('update.unreachable') : t('update.upToDate')}</p>
          <div className="update-meta">
            <span>{t('update.checkedAt', { time: checkedAt })}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={checkNow}>
              <RefreshCw size={14} />
              {t('update.checkAgain')}
            </button>
          </div>
        </div>
      )}

      {!checking && data?.available && (
        <>
          {data.notes && (
            <section className="update-block">
              <h3 className="update-heading">{t('update.whatsNew')}</h3>
              <ChangeNotes notes={data.notes} />
            </section>
          )}
          {bridge && <DesktopUpdate bridge={bridge} latest={data.latest ?? ''} repoUrl={data.repoUrl} />}
          <a className="update-link" href={data.repoUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            {t('update.onGithub')}
          </a>
        </>
      )}
    </Modal>
  )
}
