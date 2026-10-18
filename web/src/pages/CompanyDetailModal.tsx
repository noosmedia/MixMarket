// Detailansicht einer Firma aus der Recherche: Ansprechpartner, Kontakt,
// Unternehmensangaben, Merkmale der Webseite und Stellen, jeweils mit Fundstelle.
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, ExternalLink, RefreshCw, ScanSearch, Sparkles, UserPlus, UserRound } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { Loading } from '../components/Page'
import { Modal } from '../components/Modal'
import { useUi } from '../stores/ui'

export interface CompanySignal {
  id: string
  code: string
  valueText: string | null
  valueNum: number | null
  confidence: number
  evidenceUrl: string | null
}

export interface CompanyPerson {
  id: string
  fullName: string
  academicTitle: string | null
  salutation: 'herr' | 'frau' | null
  firstName: string | null
  lastName: string | null
  role: string | null
  isDecisionMaker: boolean
  source: 'impressum' | 'team'
  evidenceUrl: string | null
}

interface CompanyDetail {
  id: string
  name: string
  domain: string | null
  website: string | null
  phone: string | null
  email: string | null
  street: string | null
  postalCode: string | null
  city: string | null
  profileStatus: 'ok' | 'unreachable' | 'blocked' | 'error' | 'running' | null
  profileError: string | null
  profiledAt: string | null
  signals: CompanySignal[]
  people: CompanyPerson[]
  score: ProductScore | null
  scores: ProductScore[]
  prospect: { id: string; status: string } | null // schon Interessent für das gewählte Produkt?
}

// KI-Bewertung einer Firma für ein Produkt
interface ProductScore {
  productId: string
  productName: string
  score: number
  reason: string
  hook: string
  sizeClass: string | null
  sizeReason: string | null
  provider: 'claude' | 'codex'
  model: string | null
  createdAt: string
  stale: boolean
}

// Feste Rollen aus dem Impressum übersetzen; Rollen von Teamseiten bleiben im Original
const ROLE_KEYS: Record<string, string> = {
  Geschäftsführung: 'managing',
  'Geschäftsführende Gesellschaft': 'managingPartner',
  Inhaber: 'owner',
  Inhaberin: 'ownerFemale',
  Vertretungsberechtigt: 'representative',
  Vorstand: 'board',
  Prokura: 'procuration',
  'Inhaltlich verantwortlich': 'contentResponsible',
}

export function roleLabel(role: string | null, t: (key: string) => string): string | null {
  if (!role) return null
  const key = ROLE_KEYS[role]
  return key ? t(`company.role.${key}`) : role
}

// Fundstelle als kleiner Link hinter einem Wert
function Evidence({ url }: { url: string | null }) {
  const { t } = useTranslation()
  if (!url) return null
  return (
    <a className="company-evidence" href={url} target="_blank" rel="noreferrer" aria-label={t('company.evidence')}>
      <ExternalLink size={12} />
    </a>
  )
}

export function CompanyDetailModal({
  companyId,
  productId,
  onClose,
}: {
  companyId: string | null
  productId: string | null
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { notify } = useUi()
  const locale = i18n.language === 'en' ? 'en-US' : 'de-DE'

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['discoveryCompany', companyId, productId],
    queryFn: () => api.get<CompanyDetail>(`/api/discovery/companies/${companyId}?productId=${encodeURIComponent(productId ?? '')}`),
    enabled: !!companyId,
    // Während des Durchleuchtens laufend nachsehen
    refetchInterval: (query) => (query.state.data?.profileStatus === 'running' ? 2500 : false),
  })

  const profileMutation = useMutation({
    mutationFn: () => api.post<{ ok: boolean }>(`/api/discovery/companies/${companyId}/profile`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discoveryCompany', companyId, productId] })
      notify('info', t('company.profileStarted'))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('discovery.genericError')),
  })

  // Firma als Interessent des gewählten Produkts übernehmen
  const prospectMutation = useMutation({
    mutationFn: () => api.post<{ added: number }>('/api/prospects', { productId, companyIds: [companyId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discoveryCompany', companyId, productId] })
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
      notify('success', t('prospects.addedOne'))
    },
    onError: (err) => notify('error', err instanceof ApiError ? err.message : t('discovery.genericError')),
  })

  // Merkmale nach Code bündeln (E-Mail kann mehrfach vorkommen)
  const byCode = new Map<string, CompanySignal[]>()
  for (const s of data?.signals ?? []) byCode.set(s.code, [...(byCode.get(s.code) ?? []), s])
  const one = (code: string) => byCode.get(code)?.[0] ?? null
  const flag = (code: string) => {
    const s = one(code)
    return s ? (s.valueNum ? t('company.yes') : t('company.no')) : null
  }

  // Zeile einer Angabe mit Wert und Fundstelle
  function Row({ label, value, url }: { label: string; value: React.ReactNode; url?: string | null }) {
    if (value === null || value === undefined || value === '') return null
    return (
      <div className="company-row">
        <dt>{label}</dt>
        <dd>
          {value}
          <Evidence url={url ?? null} />
        </dd>
      </div>
    )
  }

  const running = data?.profileStatus === 'running' || profileMutation.isPending
  const lastUpdate = one('LAST_UPDATE')
  const year = one('COPYRIGHT_YEAR')
  const jobs = one('HIRING')?.valueText?.split('; ').filter(Boolean) ?? []

  return (
    <Modal open={!!companyId} onClose={onClose} title={data?.name ?? t('company.title')} subtitle={data?.domain ?? undefined} width={760}>
      {isLoading ? (
        <Loading />
      ) : isError || !data ? (
        <p className="discovery-note discovery-note-error">{error instanceof ApiError ? error.message : t('discovery.loadError')}</p>
      ) : (
        <div className="company-detail" data-tour="company-detail">
          {/* Stand des Durchleuchtens und Knopf zum erneuten Prüfen */}
          <div className="company-status">
            <span className="text-tertiary">
              {running
                ? t('company.running')
                : data.profiledAt
                  ? t('company.profiledAt', { date: new Date(data.profiledAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) })
                  : t('company.notProfiled')}
            </span>
            <div className="company-status-actions">
              {/* Interessent für das gewählte Produkt: Stand zeigen oder übernehmen */}
              {productId &&
                (data.prospect ? (
                  <span className="badge badge-accent">
                    {t('prospects.isProspect', { status: t(`prospects.status.${data.prospect.status}`) })}
                  </span>
                ) : (
                  <button className="btn btn-sm btn-secondary" onClick={() => prospectMutation.mutate()} disabled={prospectMutation.isPending} data-tour="company-add-prospect">
                    {prospectMutation.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <UserPlus size={14} />}
                    {t('prospects.addOne')}
                  </button>
                ))}
              {data.domain && (
                <button className="btn btn-sm btn-secondary" onClick={() => profileMutation.mutate()} disabled={running}>
                  {running ? <RefreshCw size={14} className="scraper-spin" /> : <ScanSearch size={14} />}
                  {data.profiledAt ? t('company.reprofile') : t('company.profile')}
                </button>
              )}
            </div>
          </div>
          {data.profileStatus && !['ok', 'running'].includes(data.profileStatus) && (
            <p className="discovery-note">{t(`company.status.${data.profileStatus}`)}{data.profileError ? `: ${data.profileError}` : ''}</p>
          )}
          {!data.domain && <p className="discovery-note">{t('company.noWebsite')}</p>}

          {/* KI-Bewertung */}
          {data.score && (
            <section className="company-section company-ai">
              <h3 className="company-heading">
                <Sparkles size={13} />
                {t('company.ai.titleFor', { product: data.score.productName })}
              </h3>
              <div className="company-ai-head">
                <span className="company-ai-score font-mono">{data.score.score}</span>
                <span className="text-tertiary">/ 10</span>
                {data.score.stale && <span className="badge badge-warning">{t('company.ai.stale')}</span>}
              </div>
              <p className="company-ai-reason">{data.score.reason}</p>
              <div className="company-ai-hook">
                <div className="company-ai-hook-label">{t('company.ai.hook')}</div>
                <p>{data.score.hook}</p>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(data.score?.hook ?? '')
                      notify('success', t('company.ai.copied'))
                    } catch {
                      notify('error', t('company.ai.copyFailed'))
                    }
                  }}
                >
                  <Copy size={14} />
                  {t('company.ai.copy')}
                </button>
              </div>
              <p className="field-hint">
                {t('company.ai.meta', {
                  provider: t(`ai.providers.${data.score.provider}`),
                  date: new Date(data.score.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }),
                })}
              </p>
            </section>
          )}

          {/* Bewertungen für die anderen Produkte */}
          {data.scores.filter((s) => s.productId !== productId).length > 0 && (
            <section className="company-section">
              <h3 className="company-heading">{t('company.ai.otherProducts')}</h3>
              <ul className="company-other-scores">
                {data.scores
                  .filter((s) => s.productId !== productId)
                  .map((s) => (
                    <li key={s.productId}>
                      <span className={`discovery-score ${s.score >= 7 ? 'is-high' : s.score <= 3 ? 'is-low' : ''}`}>{s.score}</span>
                      <span className="company-person-name">{s.productName}</span>
                      <span className="company-person-role">{s.reason}</span>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* Ansprechpartner */}
          <section className="company-section">
            <h3 className="company-heading">{t('company.people')}</h3>
            {data.people.length === 0 ? (
              <p className="text-tertiary company-empty">{data.profiledAt ? t('company.noPeople') : t('company.notProfiledHint')}</p>
            ) : (
              <ul className="company-people">
                {data.people.map((p) => (
                  <li key={p.id}>
                    <UserRound size={15} className="text-tertiary" />
                    {/* Name und Rolle */}
                    <span className="company-person-main">
                      <span className="company-person-name">
                        {p.salutation ? `${t(`company.salutation.${p.salutation}`)} ` : ''}
                        {p.fullName}
                      </span>
                      {p.role && <span className="company-person-role">{roleLabel(p.role, t)}</span>}
                    </span>
                    {/* Entscheider, Quelle und Beleg */}
                    <span className="company-person-meta">
                      {p.isDecisionMaker && <span className="badge badge-accent">{t('company.decisionMaker')}</span>}
                      <span className="text-tertiary company-person-source">{t(`company.source.${p.source}`)}</span>
                      <Evidence url={p.evidenceUrl} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Kontakt und Unternehmensangaben */}
          <section className="company-section">
            <h3 className="company-heading">{t('company.contact')}</h3>
            <dl className="company-list">
              <Row label={t('discovery.colAddress')} value={[data.street, [data.postalCode, data.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')} />
              <Row label={t('discovery.colPhone')} value={data.phone} />
              {(byCode.get('EMAIL') ?? []).map((e) => (
                <Row
                  key={e.id}
                  label={e.valueNum ? t('company.emailPersonal') : t('company.emailGeneral')}
                  value={<a className="discovery-link" href={`mailto:${e.valueText}`}>{e.valueText}</a>}
                  url={e.evidenceUrl}
                />
              ))}
              <Row label={t('company.impressum')} value={one('IMPRESSUM')?.valueNum ? t('company.found') : data.profiledAt ? t('company.notFound') : null} url={one('IMPRESSUM')?.evidenceUrl} />
              <Row label={t('company.legalForm')} value={one('LEGAL_FORM')?.valueText} url={one('LEGAL_FORM')?.evidenceUrl} />
              <Row label={t('company.register')} value={one('REGISTER')?.valueText} url={one('REGISTER')?.evidenceUrl} />
              <Row label={t('company.vatId')} value={one('VAT_ID')?.valueText} url={one('VAT_ID')?.evidenceUrl} />
              {/* Größe: genannte Zahl, KI-Schätzung und Hinweise */}
              <Row
                label={t('company.size.stated')}
                value={one('EMPLOYEES_STATED')?.valueText}
                url={one('EMPLOYEES_STATED')?.evidenceUrl}
              />
              {(() => {
                const ki = data.scores.find((s) => s.sizeClass && s.sizeClass !== 'unbekannt')
                return ki ? (
                  <Row
                    label={t('company.size.ki')}
                    value={`${t('company.chip.sizeClass', { value: ki.sizeClass })}${ki.sizeReason ? `. ${ki.sizeReason}` : ''}`}
                  />
                ) : null
              })()}
              <Row label={t('company.size.departments')} value={one('DEPARTMENTS')?.valueText} url={one('DEPARTMENTS')?.evidenceUrl} />
              <Row label={t('company.size.locations')} value={one('LOCATIONS')?.valueNum} />
              <Row
                label={t('company.size.hint')}
                value={one('SIZE_HINT') ? t('company.size.hintValue', { count: one('SIZE_HINT')?.valueNum ?? 0, basis: one('SIZE_HINT')?.valueText ?? '' }) : null}
              />
            </dl>
          </section>

          {/* Webseite */}
          {data.profiledAt && data.profileStatus === 'ok' && (
            <section className="company-section">
              <h3 className="company-heading">{t('company.website')}</h3>
              <dl className="company-list">
                <Row label={t('company.cms')} value={one('CMS')?.valueText} url={one('CMS')?.evidenceUrl} />
                <Row label={t('company.agency')} value={one('AGENCY')?.valueText} url={one('AGENCY')?.evidenceUrl} />
                <Row label={t('company.googleAds')} value={flag('GOOGLE_ADS')} />
                <Row label={t('company.metaPixel')} value={flag('META_PIXEL')} />
                <Row
                  label={t('company.booking')}
                  value={one('ONLINE_BOOKING')?.valueNum ? one('ONLINE_BOOKING')?.valueText : flag('ONLINE_BOOKING')}
                />
                <Row label={t('company.contactForm')} value={flag('CONTACT_FORM')} url={one('CONTACT_FORM')?.evidenceUrl} />
                <Row label={t('company.mobile')} value={flag('MOBILE_VIEWPORT')} />
                <Row label={t('company.https')} value={flag('HTTPS')} />
                <Row label={t('company.schema')} value={flag('SCHEMA_MARKUP')} />
                <Row label={t('company.copyright')} value={year?.valueText} />
                <Row
                  label={t('company.lastUpdate')}
                  value={lastUpdate ? new Date(lastUpdate.valueText as string).toLocaleDateString(locale) : null}
                  url={lastUpdate?.evidenceUrl}
                />
                <Row label={t('company.pages')} value={one('SITEMAP_PAGES')?.valueNum} />
                <Row label={t('company.social')} value={one('SOCIAL')?.valueText} />
                <Row label={t('company.tech')} value={one('TECH')?.valueText} />
              </dl>
              {one('ROBOTS_BLOCKED') && <p className="field-hint">{t('company.robotsBlocked', { paths: one('ROBOTS_BLOCKED')?.valueText })}</p>}
              <p className="field-hint">{t('company.adsHint')}</p>
            </section>
          )}

          {/* Stellen */}
          {(jobs.length > 0 || one('CAREER_PAGE')) && (
            <section className="company-section">
              <h3 className="company-heading">
                {t('company.jobs')}
                <Evidence url={one('HIRING')?.evidenceUrl ?? one('CAREER_PAGE')?.evidenceUrl ?? null} />
              </h3>
              {jobs.length ? (
                <ul className="company-jobs">
                  {jobs.map((j) => (
                    <li key={j}>{j}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-tertiary company-empty">{t('company.careerPageOnly')}</p>
              )}
            </section>
          )}
        </div>
      )}
    </Modal>
  )
}
