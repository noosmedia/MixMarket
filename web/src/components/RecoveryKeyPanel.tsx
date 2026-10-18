// Zeigt einen frisch erzeugten Wiederherstellungsschlüssel genau einmal an: zum Kopieren,
// Herunterladen als Textdatei und mit Bestätigung, dass er sicher aufbewahrt ist.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Copy, Download, KeyRound } from 'lucide-react'
import { useUi } from '../stores/ui'
import './recovery-key.css'

// Neuer Schlüssel wird bis zur Bestätigung gemerkt, damit er beim Neuladen nicht verloren geht
export const PENDING_KEY_STORAGE = 'mixmarket-pending-key'
export function rememberPendingKey(key: string, email: string) {
  try {
    sessionStorage.setItem(PENDING_KEY_STORAGE, JSON.stringify({ key, email }))
  } catch {
    // Ohne Speicher bleibt nur die Anzeige auf dieser Seite
  }
}
export function forgetPendingKey() {
  try {
    sessionStorage.removeItem(PENDING_KEY_STORAGE)
  } catch {
    // nichts zu tun
  }
}
export function readPendingKey(): { key: string; email: string } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY_STORAGE)
    return raw ? (JSON.parse(raw) as { key: string; email: string }) : null
  } catch {
    return null
  }
}

interface RecoveryKeyPanelProps {
  recoveryKey: string
  email: string
  onDone: () => void
  // Beschriftung des Weiter-Knopfs, z. B. "Weiter zu MixMarket" oder "Fertig"
  doneLabel?: string
}

export function RecoveryKeyPanel({ recoveryKey, email, onDone, doneLabel }: RecoveryKeyPanelProps) {
  const { t } = useTranslation()
  const { notify } = useUi()
  const [stored, setStored] = useState(false)
  const [warn, setWarn] = useState(false)

  // In die Zwischenablage kopieren
  async function copy() {
    try {
      await navigator.clipboard.writeText(recoveryKey)
      notify('success', t('recovery.copied'))
    } catch {
      notify('error', t('recovery.copyFailed'))
    }
  }

  // Als Textdatei speichern, mit kurzer Anleitung für den Ernstfall
  function download() {
    const text = [
      t('recovery.fileTitle'),
      '',
      `${t('recovery.fileAccount')}: ${email}`,
      `${t('recovery.fileKey')}: ${recoveryKey}`,
      '',
      t('recovery.fileHint'),
      '',
    ].join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t('recovery.fileName')
    a.click()
    URL.revokeObjectURL(url)
  }

  // Weiter erst nach Bestätigung; sonst Hinweis statt gesperrtem Knopf
  function done() {
    if (!stored) {
      setWarn(true)
      return
    }
    onDone()
  }

  return (
    <div className="recovery">
      <div className="recovery-head">
        <KeyRound size={18} />
        <span>{t('recovery.title')}</span>
      </div>
      <p className="recovery-text">{t('recovery.intro')}</p>
      <div className="recovery-key font-mono" aria-label={t('recovery.title')}>
        {recoveryKey}
      </div>
      <div className="recovery-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
          <Copy size={14} />
          {t('recovery.copy')}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={download}>
          <Download size={14} />
          {t('recovery.download')}
        </button>
      </div>
      <label className={`checkbox-row recovery-confirm${warn && !stored ? ' is-invalid' : ''}`}>
        <input
          type="checkbox"
          checked={stored}
          onChange={(e) => {
            setStored(e.target.checked)
            setWarn(false)
          }}
        />
        <span>{t('recovery.confirm')}</span>
      </label>
      {warn && !stored && <p className="recovery-warn">{t('recovery.confirmRequired')}</p>}
      <button type="button" className="btn btn-primary recovery-done" onClick={done}>
        {doneLabel ?? t('recovery.continue')}
        <ArrowRight size={16} />
      </button>
    </div>
  )
}
