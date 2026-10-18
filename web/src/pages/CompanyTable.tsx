// Gemeinsame Firmentabelle für Recherche und Zielgruppen: Firma, Ansprechpartner,
// Kontakt, Webseite und auffällige Merkmale. Ein Klick auf den Firmennamen
// öffnet die Detailansicht.
import { useTranslation } from 'react-i18next'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { roleLabel, type CompanyPerson, type CompanySignal } from './CompanyDetailModal'

export interface CompanyRow {
  id: string
  name: string
  domain: string | null
  website: string | null
  phone: string | null
  email: string | null
  street: string | null
  postalCode: string | null
  city: string | null
  category: string | null
  rating: number | null
  reviewCount: number | null
  sourceUrl: string | null
  rank: number | null
  profileStatus: 'ok' | 'unreachable' | 'blocked' | 'error' | 'running' | null
  signals: CompanySignal[]
  people: CompanyPerson[]
  score?: { score: number; reason: string; hook: string } | null
  sizeClass?: string | null // KI-Schätzung der Mitarbeiterzahl aus einer beliebigen Bewertung
}

// Auffällige Merkmale als kurze Hinweise in der Firmenliste
export function companyChips(c: CompanyRow, t: (key: string, opts?: Record<string, unknown>) => string): string[] {
  if (c.profileStatus === 'unreachable') return [t('company.chip.unreachable')]
  if (c.profileStatus === 'blocked') return [t('company.chip.blocked')]
  const num = (code: string) => c.signals.find((s) => s.code === code)?.valueNum ?? null
  const text = (code: string) => c.signals.find((s) => s.code === code)?.valueText ?? null
  const chips: string[] = []
  const cms = text('CMS')
  if (cms) chips.push(cms)
  if (num('GOOGLE_ADS') === 1) chips.push(t('company.chip.googleAds'))
  if (num('META_PIXEL') === 1) chips.push(t('company.chip.metaPixel'))
  if ((num('HIRING') ?? 0) > 0) chips.push(t('company.chip.hiring'))
  if (num('ONLINE_BOOKING') === 1) chips.push(t('company.chip.booking'))
  if (num('MOBILE_VIEWPORT') === 0) chips.push(t('company.chip.notMobile'))
  if (num('HTTPS') === 0) chips.push(t('company.chip.noHttps'))
  const year = num('COPYRIGHT_YEAR')
  if (year !== null && year < new Date().getFullYear() - 2) chips.push(t('company.chip.oldSite', { year }))
  if (text('AGENCY')) chips.push(t('company.chip.agency'))
  // Größe: genannte Zahl vor KI-Schätzung
  const stated = num('EMPLOYEES_STATED')
  if (stated) chips.unshift(t('company.chip.employees', { count: stated }))
  else if (c.sizeClass && c.sizeClass !== 'unbekannt') chips.unshift(t('company.chip.sizeClass', { value: c.sizeClass }))
  return chips
}

interface CompanyTableProps {
  companies: CompanyRow[]
  showRank?: boolean
  showRating?: boolean
  hideCategory?: boolean
  showScore?: boolean
  onOpen: (id: string) => void
}

export function CompanyTable({ companies, showRank, showRating, hideCategory, showScore, onOpen }: CompanyTableProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en-US' : 'de-DE'

  return (
    <div className="discovery-table-wrap">
      <table className="table discovery-table">
        <thead>
          <tr>
            {showRank && <th className="discovery-col-rank">{t('discovery.colRank')}</th>}
            {showScore && <th className="discovery-col-score">{t('discovery.colScore')}</th>}
            <th>{t('discovery.colCompany')}</th>
            <th>{t('discovery.colPerson')}</th>
            <th>{t('discovery.colContact')}</th>
            <th>{t('discovery.colWebsite')}</th>
            <th>{t('discovery.colSignals')}</th>
            {showRating && <th>{t('discovery.colRating')}</th>}
            <th aria-label={t('discovery.colSource')} />
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => {
            const person = c.people[0]
            const chips = companyChips(c, t)
            return (
              <tr key={c.id}>
                {showRank && <td className="font-mono discovery-col-rank">{c.rank ?? '·'}</td>}
                {showScore && (
                  <td className="discovery-col-score">
                    {c.score ? (
                      <span className={`discovery-score ${c.score.score >= 7 ? 'is-high' : c.score.score <= 3 ? 'is-low' : ''}`}>
                        {c.score.score}
                      </span>
                    ) : (
                      <span className="cell-empty">·</span>
                    )}
                  </td>
                )}
                <td>
                  {/* Firmenname öffnet die Detailansicht */}
                  <button type="button" className="discovery-company" onClick={() => onOpen(c.id)} data-tour="company-name">
                    {c.name}
                  </button>
                  {c.street || c.city ? (
                    <div className="discovery-sub">
                      {[c.street, [c.postalCode, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                    </div>
                  ) : null}
                  {/* Bei OpenStreetMap ist die Kategorie ein technischer Schlüssel, daher ausblendbar */}
                  {/* Branche nur als lesbarer Text, keine Rohwerte wie "apartment" aus OpenStreetMap */}
                  {c.category && !hideCategory && !/^[a-z_]+$/.test(c.category) && <div className="discovery-sub">{c.category}</div>}
                </td>
                <td>
                  {person ? (
                    <>
                      <div className="discovery-person">{person.fullName}</div>
                      {person.role && <div className="discovery-sub">{roleLabel(person.role, t)}</div>}
                    </>
                  ) : c.profileStatus === 'running' ? (
                    <RefreshCw size={13} className="scraper-spin text-tertiary" />
                  ) : (
                    <span className="cell-empty">·</span>
                  )}
                </td>
                <td className="discovery-nowrap">
                  {c.phone && <div className="font-mono">{c.phone}</div>}
                  {c.email && (
                    <a className="discovery-link" href={`mailto:${c.email}`}>
                      {c.email}
                    </a>
                  )}
                  {!c.phone && !c.email && <span className="cell-empty">·</span>}
                </td>
                <td>
                  {c.website ? (
                    <a className="discovery-link" href={c.website} target="_blank" rel="noreferrer">
                      {c.domain || c.website}
                    </a>
                  ) : (
                    <span className="discovery-sub">{t('discovery.noWebsite')}</span>
                  )}
                </td>
                <td>
                  {chips.length ? (
                    <div className="discovery-chips">
                      {chips.map((chip) => (
                        <span key={chip} className="discovery-chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="cell-empty">·</span>
                  )}
                </td>
                {showRating && (
                  <td className="font-mono discovery-nowrap">
                    {c.rating !== null
                      ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(c.rating)} (${c.reviewCount ?? 0})`
                      : '·'}
                  </td>
                )}
                <td>
                  {c.sourceUrl && (
                    <a
                      className="btn btn-sm btn-icon btn-ghost"
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t('discovery.colSource')}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
