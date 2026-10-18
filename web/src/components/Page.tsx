// Wiederverwendbare Seiten-Bausteine: Kopfzeile, Leerzustand, Ladeanzeige, Statistik-Kachel.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HelpCircle } from 'lucide-react'
import type { HandbookChapterId } from '../types/handbook'
import './page.css'

// Seitenkopf mit Titel, optionaler Beschreibung, Aktionsbereich rechts und
// optionalem Hilfe-Knopf, der zum passenden Kapitel des Handbuchs führt
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  help,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  help?: { chapter: HandbookChapterId; section?: string }
}) {
  const { t } = useTranslation()
  return (
    <div className="page-header">
      <div className="page-header-text">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <div className="page-title-row">
          <h1 className="page-title font-display">{title}</h1>
          {help && (
            <Link
              to={`/handbook/${help.chapter}${help.section ? `#${help.section}` : ''}`}
              className="page-help"
              aria-label={t('handbook.helpFor', { title })}
            >
              <HelpCircle size={15} />
              <span>{t('handbook.help')}</span>
            </Link>
          )}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}

// Inhaltsbereich einer Seite mit einheitlichem Innenabstand
export function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="page-body">{children}</div>
}

// Leerzustand mit Symbol, Text und optionaler Aktion
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-desc">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

// Zentrierte Ladeanzeige
export function Loading() {
  return (
    <div className="page-loading">
      <div className="spinner" />
    </div>
  )
}

// Statistik-Kachel für das Dashboard
export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: boolean
}) {
  return (
    <div className={`stat-tile ${accent ? 'stat-tile-accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value font-mono">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  )
}
