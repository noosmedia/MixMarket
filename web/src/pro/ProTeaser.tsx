// Hinweise auf MixMarket Pro in der kostenlosen Version.
// Statt einer Pro-Funktion zeigt der Kern einen klickbaren Hinweis; ein Klick erklärt im Fenster,
// was die Funktion kann und dass sie zu MixMarket Pro gehört.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Sparkles } from 'lucide-react'
import { Modal } from '../components/Modal'
import { PageBody, PageHeader } from '../components/Page'
import type { HandbookChapterId } from '../types/handbook'
import type { ProFeature } from './host'
import './pro.css'

// Kleines Abzeichen "Pro" neben Überschriften und in Menüs
export function ProBadge() {
  const { t } = useTranslation()
  return <span className="pro-badge">{t('pro.badge')}</span>
}

// Knopf zum Bereich "MixMarket Pro" in den Einstellungen (kaufen oder Schlüssel eintragen)
function ProUnlockButton({ onDone, className = 'btn btn-sm btn-secondary' }: { onDone?: () => void; className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onDone?.()
        navigate('/settings#mixmarket-pro')
      }}
    >
      <KeyRound size={14} />
      {t('pro.unlock')}
    </button>
  )
}

// Fenster mit der Erklärung einer Pro-Funktion
export function ProInfoDialog({ feature, open, onClose }: { feature: ProFeature; open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(`pro.feature.${feature}.title`)}
      subtitle={t('pro.dialogSubtitle')}
      width={480}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
          <ProUnlockButton onDone={onClose} className="btn btn-primary" />
        </>
      }
    >
      <p className="pro-dialog-text">{t(`pro.feature.${feature}.desc`)}</p>
      <p className="pro-dialog-hint">
        <Sparkles size={14} />
        {t('pro.dialogHint')}
      </p>
    </Modal>
  )
}

// Knopf anstelle einer Pro-Funktion: sieht aus wie der echte Knopf, trägt das Abzeichen und erklärt per Klick
export function ProLockButton({
  feature,
  label,
  icon,
  className = 'btn btn-secondary',
}: {
  feature: ProFeature
  // Ohne Beschriftung zeigt der Knopf nur das Abzeichen (z. B. anstelle eines Schalters)
  label?: string
  icon?: React.ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={`${className} pro-lock`}
        onClick={() => setOpen(true)}
        aria-label={label ? undefined : `${t(`pro.feature.${feature}.title`)}: ${t('pro.dialogSubtitle')}`}
      >
        {icon}
        {label}
        <ProBadge />
      </button>
      <ProInfoDialog feature={feature} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

// Ganzer Bereich anstelle einer Pro-Funktion (z. B. eine Seite oder ein Abschnitt)
export function ProPanel({ feature }: { feature: ProFeature }) {
  const { t } = useTranslation()
  return (
    <div className="pro-panel">
      <div className="pro-panel-head">
        <Sparkles size={16} />
        <span>{t(`pro.feature.${feature}.title`)}</span>
        <ProBadge />
      </div>
      <p className="pro-panel-text">{t(`pro.feature.${feature}.desc`)}</p>
      <p className="pro-panel-hint">{t('pro.dialogHint')}</p>
      <div className="pro-dialog-link">
        <ProUnlockButton />
      </div>
    </div>
  )
}

// Ganze Seite anstelle einer Pro-Seite (z. B. Automatisierungen)
export function ProPage({ feature, eyebrowKey, help }: { feature: ProFeature; eyebrowKey: string; help?: HandbookChapterId }) {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader eyebrow={t(eyebrowKey)} title={t(`pro.feature.${feature}.title`)} help={help ? { chapter: help } : undefined} />
      <PageBody>
        <ProPanel feature={feature} />
      </PageBody>
    </>
  )
}
