// Haupt-Routing der App. Trennt oeffentliche (Login) und geschützte Bereiche.
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './stores/auth'
import { Layout } from './components/Layout'
import { ToastHost } from './components/ToastHost'
import { ConfirmHost } from './components/ConfirmHost'
import { LoginPage, SetupPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ContactsPage } from './pages/ContactsPage'
import { ListsPage } from './pages/ListsPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { ProSlot } from './pro/host'
import { ProPage } from './pro/ProTeaser'
import { ScraperPage } from './pages/ScraperPage'
import { SuppressionPage } from './pages/SuppressionPage'
import { SettingsPage } from './pages/SettingsPage'
import { ActivityPage } from './pages/ActivityPage'
import { HandbookPage } from './pages/HandbookPage'
import { OutboxPage } from './pages/OutboxPage'
import { ConversationsPage } from './pages/ConversationsPage'

// Schützt Routen vor nicht Angemeldeten; ohne Konto geht es zur Ersteinrichtung
function Protected({ children }: { children: React.ReactNode }) {
  const { user, initialized, needsSetup, offline } = useAuth()
  const { t } = useTranslation()
  if (!initialized) {
    return (
      <div className="flex items-center" style={{ justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <div className="spinner" />
        {/* Server nicht erreichbar: Hinweis statt Anmeldeseite, MixMarket versucht es selbst erneut */}
        {offline && (
          <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 16px' }}>
            <div style={{ fontWeight: 600 }}>{t('auth.offline')}</div>
            <div className="text-tertiary" style={{ fontSize: 13, marginTop: 4 }}>
              {t('auth.offlineHint')}
            </div>
          </div>
        )}
      </div>
    )
  }
  if (!user) return <Navigate to={needsSetup ? '/setup' : '/login'} replace />
  return <>{children}</>
}

export function App() {
  const loadMe = useAuth((s) => s.loadMe)

  // Beim Start pruefen, ob bereits eine Sitzung besteht
  useEffect(() => {
    void loadMe()
  }, [loadMe])

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route
          path="/*"
          element={
            <Protected>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/contacts" element={<ContactsPage />} />
                  <Route path="/lists" element={<ListsPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/campaigns" element={<CampaignsPage />} />
                  {/* Automatisierungen gehören zu MixMarket Pro */}
                  <Route
                    path="/automations"
                    element={
                      <ProSlot name="page.automations" fallback={<ProPage feature="automations" eyebrowKey="nav.automations" help="automations" />} />
                    }
                  />
                  <Route path="/scraper" element={<ScraperPage />} />
                  <Route path="/outbox" element={<OutboxPage />} />
                  <Route path="/conversations" element={<ConversationsPage />} />
                  <Route path="/suppression" element={<SuppressionPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/activity" element={<ActivityPage />} />
                  <Route path="/handbook" element={<HandbookPage />} />
                  <Route path="/handbook/:chapter" element={<HandbookPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Protected>
          }
        />
      </Routes>
      <ToastHost />
      <ConfirmHost />
    </>
  )
}
