// Updates: Abgleich der eigenen Version mit GitHub, Hinweis im Benutzermenü und Fenster mit den
// Neuerungen und den Befehlen zum Aktualisieren. Aktualisiert wird nicht automatisch.
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
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

// Befehle zum Aktualisieren, im MixMarket-Ordner auszuführen
const UPDATE_COMMANDS = ['git pull', 'npm install', 'npm run db:push']

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

// checkOnOpen: beim Öffnen sofort neu bei GitHub nachsehen (Menüpunkt "Nach Updates suchen")
export function UpdateDialog({ open, onClose, checkOnOpen }: { open: boolean; onClose: () => void; checkOnOpen: boolean }) {
  const { t, i18n } = useTranslation()
  const { notify } = useUi()
  const queryClient = useQueryClient()
  const status = useUpdateStatus(open)
  const [checking, setChecking] = useState(false)
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

  async function copyCommands() {
    try {
      await navigator.clipboard.writeText(UPDATE_COMMANDS.join('\n'))
      notify('success', t('update.copied'))
    } catch {
      notify('error', t('update.copyFailed'))
    }
  }

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
          <section className="update-block">
            <h3 className="update-heading">{t('update.howTo')}</h3>
            <ol className="update-steps">
              <li>{t('update.stepStop')}</li>
              <li>
                {t('update.stepRun')}
                <div className="update-commands">
                  <code className="font-mono">
                    {UPDATE_COMMANDS.map((command) => (
                      <span key={command}>{command}</span>
                    ))}
                  </code>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={copyCommands} aria-label={t('update.copy')}>
                    <Copy size={15} />
                  </button>
                </div>
              </li>
              <li>{t('update.stepStart')}</li>
            </ol>
            <p className="update-hint">
              <Check size={14} />
              {t('update.dataSafe')}
            </p>
          </section>
          <a className="update-link" href={data.repoUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            {t('update.onGithub')}
          </a>
        </>
      )}
    </Modal>
  )
}
