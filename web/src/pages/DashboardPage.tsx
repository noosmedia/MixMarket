// Dashboard: integrierte Übersicht ohne Cards. Oben "Wartet auf Sie", Steuerung und Auslastung,
// darunter Kennzahlen als Band mit Haarlinien-Trennung, Verlauf und Schnellzugriff.
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Send, UserPlus, FileText, ArrowRight, Route } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../stores/auth'
import { PageHeader, PageBody, Loading } from '../components/Page'
import { SteeringPanel, UsagePanel, WaitingList } from './ControlPanel'
import { ProSlot } from '../pro/host'
import { ProLockButton } from '../pro/ProTeaser'
import './dashboard.css'

interface Overview {
  contacts: number
  activeContacts: number
  lists: number
  campaigns: number
  suppressed: number
  totalSent: number
  openRate: number
  clickRate: number
}
interface TimelinePoint {
  date: string
  sent: number
  opens: number
  clicks: number
}

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: overview, isLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: () => api.get<Overview>('/api/stats/overview'),
  })
  const { data: timeline } = useQuery({
    queryKey: ['timeline'],
    queryFn: () => api.get<TimelinePoint[]>('/api/stats/timeline'),
  })

  if (isLoading || !overview) return <Loading />

  const firstName = user?.name?.split(' ')[0] || ''

  // Kennzahlen als Band (kein Kasten je Wert, sondern Spalten mit Haarlinien)
  const stats = [
    { label: t('dashboard.activeContacts'), value: overview.activeContacts.toLocaleString('de-DE') },
    { label: t('dashboard.lists'), value: overview.lists },
    { label: t('dashboard.campaigns'), value: overview.campaigns },
    { label: t('dashboard.sent'), value: overview.totalSent.toLocaleString('de-DE') },
    { label: t('dashboard.openRate'), value: `${overview.openRate}%` },
    { label: t('dashboard.clickRate'), value: `${overview.clickRate}%` },
  ]

  // Schnellzugriffe
  const actions = [
    { label: t('dashboard.newCampaign'), icon: Send, to: '/campaigns' },
    { label: t('dashboard.newContact'), icon: UserPlus, to: '/contacts' },
    { label: t('dashboard.newTemplate'), icon: FileText, to: '/templates' },
  ]

  return (
    <>
      <PageHeader help={{ chapter: 'dashboard' }}
        eyebrow={t('dashboard.greeting') + (firstName ? `, ${firstName}` : '')}
        title={t('dashboard.title')}
        subtitle={t('app.tagline')}
        actions={
          // Geführte Touren (Pro) direkt von der Übersicht aus starten
          <ProSlot
            name="dashboard.actions"
            className="btn btn-secondary"
            fallback={<ProLockButton feature="tours" label={t('pro.feature.tours.title')} icon={<Route size={16} />} />}
          />
        }
      />
      <PageBody>
        {/* Was als Nächstes zu tun ist: Freigaben, Antworten, Hinweise */}
        <section className="dash-section is-first" data-tour="dash-waiting">
          <div className="dash-section-head">
            <h2 className="dash-section-title">{t('control.waiting')}</h2>
          </div>
          <WaitingList />
        </section>

        {/* Autopilot, Not-Aus und Grenzen */}
        <section className="dash-section" data-tour="dash-steering">
          <div className="dash-section-head">
            <h2 className="dash-section-title">{t('control.steering')}</h2>
          </div>
          <SteeringPanel />
        </section>

        {/* Auslastung der KI-Abos und des Versands */}
        <section className="dash-section" data-tour="dash-usage">
          <div className="dash-section-head">
            <h2 className="dash-section-title">{t('control.usage')}</h2>
          </div>
          <UsagePanel />
        </section>

        {/* Kennzahlen-Band */}
        <section className="dash-section">
        <div className="stats-strip">
          {stats.map((s, i) => (
            <div className="stat-col" key={i}>
              <div className="stat-col-label">{s.label}</div>
              <div className="stat-col-value font-mono">{s.value}</div>
            </div>
          ))}
        </div>
        </section>

        {/* Verlauf */}
        <section className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">{t('dashboard.timeline')}</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline ?? []} margin={{ left: -18, right: 4, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--text-primary)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--text-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
                tickFormatter={(d: string) => d.slice(8)}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text-primary)',
                }}
                labelStyle={{ color: 'var(--text-tertiary)' }}
                cursor={{ stroke: 'var(--border-strong)' }}
              />
              <Area
                type="monotone"
                dataKey="sent"
                stroke="var(--text-primary)"
                strokeWidth={2}
                fill="url(#gSent)"
                name={t('dashboard.chartSent')}
              />
              <Area
                type="monotone"
                dataKey="opens"
                stroke="var(--text-tertiary)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill="transparent"
                name={t('dashboard.chartOpens')}
              />
              {/* Klicks als feine gepunktete Linie */}
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="var(--text-dim)"
                strokeWidth={1.5}
                strokeDasharray="1 3"
                fill="transparent"
                name={t('dashboard.chartClicks')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {/* Schnellzugriff */}
        <section className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">{t('dashboard.quickActions')}</h2>
          </div>
          <div className="quick-row">
            {actions.map((a) => {
              const Icon = a.icon
              return (
                <button key={a.to} className="quick-link" onClick={() => navigate(a.to)}>
                  <Icon size={18} className="quick-link-icon" />
                  <span className="quick-link-label">{a.label}</span>
                  <ArrowRight size={15} className="quick-link-arrow" />
                </button>
              )
            })}
          </div>
        </section>
      </PageBody>
    </>
  )
}
