// Anwendungsrahmen im Linear-Stil: schlanke Top-Navigation plus Befehlspalette.
// Keine klassische Sidebar. Unter 1360 px passt die volle Navigation nicht in die
// Kopfleiste, dann öffnet ein Menüknopf eine Seitenleiste mit allen Bereichen.
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Settings, Sun, Moon, LogOut, Search, ChevronDown, Menu, X, Languages, History, HelpCircle, ShieldBan, Download, RefreshCw, Route } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../stores/auth'
import { useUi } from '../stores/ui'
import { Wordmark } from './Logo'
import { CommandPalette, NAV_ITEMS } from './CommandPalette'
import { Modal } from './Modal'
import { RecoveryKeyPanel, forgetPendingKey, readPendingKey } from './RecoveryKeyPanel'
import { ControlBanner } from './ControlBanner'
import { UpdateDialog, useUpdateStatus } from './UpdateDialog'
import { ProSlot, loadPro, proFunction, usePro, useProFeature } from '../pro/host'
import { ProBadge, ProInfoDialog } from '../pro/ProTeaser'
import './layout.css'

// Apple-Geräte zeigen Cmd, alle anderen Strg als Taste für die Suche
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme, language, setLanguage } = useUi()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Update-Fenster; checkOnOpen sorgt beim Menüpunkt "Nach Updates suchen" für eine frische Prüfung
  const [update, setUpdate] = useState<{ open: boolean; checkOnOpen: boolean }>({ open: false, checkOnOpen: false })
  // Wurde die Seite neu geladen, bevor der neue Wiederherstellungsschlüssel bestätigt war, erscheint er hier erneut
  const [pendingKey, setPendingKey] = useState(() => readPendingKey())
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // MixMarket Pro: nach der Anmeldung Stand holen und bei aktivem Pro das Paket laden.
  // Ist Pro aktiv, steht hinter dem Schriftzug klein "Pro".
  const proActive = usePro((s) => s.active)
  useEffect(() => {
    if (user) void loadPro()
  }, [user])

  // Geführte Touren (Pro) aus dem Benutzermenü; ohne Pro erklärt ein Fenster, was die Touren können
  const toursActive = useProFeature('tours')
  const [toursInfo, setToursInfo] = useState(false)
  const openTours = () => {
    setMenuOpen(false)
    if (!toursActive) return setToursInfo(true)
    // Älteres Pro-Paket ohne Liste im Menü: Touren über das Handbuch
    const openList = proFunction<() => void>('tours.openList')
    if (openList) openList()
    else navigate('/handbook')
  }

  // Seitenleiste schließen, sobald eine andere Seite geöffnet wird
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Offene Seitenleiste: Escape schließt sie, die Seite dahinter scrollt nicht mit
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  // Cmd+K oder Ctrl+K oeffnet die Befehlspalette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Benutzermenue bei Klick ausserhalb schliessen
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Offene Antworten für den Zähler an "Gespräche"
  const inboxQuery = useQuery({
    queryKey: ['inboxSummary'],
    queryFn: () => api.get<{ open: number }>('/api/inbox/summary'),
    refetchInterval: 60000,
    enabled: !!user,
  })
  const openReplies = inboxQuery.data?.open ?? 0

  // Neuere Version auf GitHub: Punkt am Profilknopf und eigener Menüpunkt
  const updateQuery = useUpdateStatus(!!user)
  const updateAvailable = !!updateQuery.data?.available
  const navCount = (key: string) =>
    key === 'conversations' && openReplies > 0 ? (
      <span className="nav-count font-mono" aria-label={t('nav.conversationsOpen', { count: openReplies })}>
        {openReplies > 99 ? '99+' : openReplies}
      </span>
    ) : null

  const initials = (user?.name || user?.email || '?').slice(0, 2).toUpperCase()
  // Hauptnavigation (ohne Sperrliste, Aktivitäten, Handbuch und Einstellungen; die liegen im Benutzermenü bzw. rechts)
  const mainNav = NAV_ITEMS.filter((i) => !['/suppression', '/settings', '/activity', '/handbook'].includes(i.to))

  return (
    <div className="shell">
      <header className="topbar glass">
        <div className="topbar-inner">
          {/* Menüknopf, nur wenn die volle Navigation nicht in die Leiste passt */}
          <button
            className="tool-btn menu-btn"
            data-tour="nav-menu"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('nav.menu')}
            aria-expanded={drawerOpen}
          >
            <Menu size={19} />
          </button>

          {/* Marke */}
          <button className="brand" onClick={() => navigate('/')} aria-label={t('nav.dashboard')}>
            <Wordmark pro={proActive} />
          </button>

          {/* Hauptnavigation */}
          <nav className="topnav" data-tour="nav-main">
            {mainNav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `topnav-item ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={16} className="topnav-icon" />
                  <span>{t(`nav.${item.key}`)}</span>
                  {navCount(item.key)}
                  <span className="topnav-marker" aria-hidden="true" />
                </NavLink>
              )
            })}
          </nav>

          {/* Rechte Werkzeuge */}
          <div className="topbar-tools" data-tour="nav-tools">
            <button className="search-trigger" onClick={() => setPaletteOpen(true)} aria-label={t('common.search')} data-tour="nav-search">
              <Search size={15} />
              <span className="search-trigger-label">{t('common.search')}</span>
              <kbd className="kbd">{isMac ? t('nav.shortcutMac') : t('nav.shortcutOther')}</kbd>
            </button>

            {/* Handbuch: jederzeit erreichbar */}
            <NavLink
              to="/handbook"
              className={({ isActive }) => `tool-btn tool-help${isActive ? ' is-active' : ''}`}
              data-tour="nav-help"
              aria-label={t('nav.handbook')}
            >
              <HelpCircle size={17} />
            </NavLink>

            <button className="tool-btn tool-theme" onClick={toggleTheme} aria-label={t('nav.toggleTheme')}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              className="tool-btn lang"
              onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
              aria-label={t('nav.switchLanguage')}
            >
              {language.toUpperCase()}
            </button>

            {/* Benutzermenue */}
            <div className="user-menu" ref={menuRef}>
              <button
                className="user-trigger"
                data-tour="user-menu-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={updateAvailable ? `${t('nav.userMenu')}, ${t('update.menuAvailable')}` : t('nav.userMenu')}
              >
                <span className="user-avatar">
                  {initials}
                  {updateAvailable && <span className="update-dot" aria-hidden="true" />}
                </span>
                <ChevronDown size={14} className="user-chevron" />
              </button>
              {menuOpen && (
                <div className="user-dropdown animate-in">
                  <div className="user-dropdown-head">
                    <div className="user-name">{user?.name}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/suppression')
                    }}
                  >
                    <ShieldBan size={16} />
                    {t('nav.suppression')}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/activity')
                    }}
                  >
                    <History size={16} />
                    {t('nav.activity')}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/settings')
                    }}
                  >
                    <Settings size={16} />
                    {t('nav.settings')}
                  </button>
                  <button className="dropdown-item" onClick={openTours}>
                    <Route size={16} />
                    <span className="dropdown-label">{t('pro.feature.tours.title')}</span>
                    {!toursActive && <ProBadge />}
                  </button>
                  <button
                    className={`dropdown-item${updateAvailable ? ' has-update' : ''}`}
                    onClick={() => {
                      setMenuOpen(false)
                      setUpdate({ open: true, checkOnOpen: !updateAvailable })
                    }}
                  >
                    {updateAvailable ? <Download size={16} /> : <RefreshCw size={16} />}
                    <span className="dropdown-label">{updateAvailable ? t('update.menuAvailable') : t('update.menuCheck')}</span>
                    {updateAvailable && <span className="update-dot is-inline" aria-hidden="true" />}
                  </button>
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Seitenleiste mit allen Bereichen für schmale Bildschirme */}
      <div
        className={`drawer-overlay${drawerOpen ? ' is-open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside className={`drawer${drawerOpen ? ' is-open' : ''}`} aria-label={t('nav.menu')} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <Wordmark pro={proActive} />
          <button className="tool-btn" onClick={() => setDrawerOpen(false)} aria-label={t('nav.closeMenu')} tabIndex={drawerOpen ? 0 : -1}>
            <X size={19} />
          </button>
        </div>
        <nav className="drawer-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                tabIndex={drawerOpen ? 0 : -1}
                className={({ isActive }) => `drawer-item ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={18} className="drawer-icon" />
                <span>{t(`nav.${item.key}`)}</span>
                {navCount(item.key)}
              </NavLink>
            )
          })}
        </nav>
        {/* Darstellung und Sprache, auf dem Handy nur hier erreichbar */}
        <div className="drawer-tools">
          <button className="drawer-item" onClick={toggleTheme} tabIndex={drawerOpen ? 0 : -1}>
            {theme === 'dark' ? <Sun size={18} className="drawer-icon" /> : <Moon size={18} className="drawer-icon" />}
            <span>{theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')}</span>
          </button>
          <button
            className="drawer-item"
            onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
            tabIndex={drawerOpen ? 0 : -1}
          >
            <Languages size={18} className="drawer-icon" />
            <span>{t('nav.switchLanguage')}</span>
          </button>
        </div>
        <div className="drawer-user">
          <div className="drawer-user-text">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="drawer-item danger" onClick={handleLogout} tabIndex={drawerOpen ? 0 : -1}>
            <LogOut size={18} className="drawer-icon" />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="content">
        {/* Not-Aus und KI-Pause auf jeder Seite sichtbar */}
        <ControlBanner />
        <div className="content-inner">{children}</div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Pro: Ebenen über allen Seiten (z. B. geführte Touren) */}
      <ProSlot name="layout.overlay" />

      <ProInfoDialog feature="tours" open={toursInfo} onClose={() => setToursInfo(false)} />

      <UpdateDialog
        open={update.open}
        checkOnOpen={update.checkOnOpen}
        onClose={() => setUpdate({ open: false, checkOnOpen: false })}
      />

      {/* Ohne Titel und Schließen-Knopf: der Schlüssel muss erst bestätigt werden */}
      <Modal open={!!pendingKey} onClose={() => undefined} width={480}>
        {pendingKey && (
          <RecoveryKeyPanel
            recoveryKey={pendingKey.key}
            email={pendingKey.email}
            onDone={() => {
              forgetPendingKey()
              setPendingKey(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
