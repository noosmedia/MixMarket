// Befehlspalette (Cmd+K): Volltextsuche über alle Bereiche plus schnelles Springen zu jeder Seite.
// Treffer sind nach Bereich gruppiert, zeigen das Feld der Fundstelle und öffnen den Eintrag direkt.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  Send,
  Workflow,
  Globe,
  Mails,
  MessagesSquare,
  ShieldBan,
  Settings,
  Search,
  CornerDownLeft,
  Building2,
  Target,
  Package,
  Filter,
  MapPin,
  History,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'
import { api } from '../lib/api'
import { useUi, type JumpArea } from '../stores/ui'
import { useHandbook } from '../i18n/handbook'
import type { HandbookChapter } from '../types/handbook'
import './commandpalette.css'

// Zentrale Liste aller Navigationsziele. Wird auch von der Top-Navigation genutzt.
export const NAV_ITEMS = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/contacts', key: 'contacts', icon: Users },
  { to: '/lists', key: 'lists', icon: FolderOpen },
  { to: '/templates', key: 'templates', icon: FileText },
  { to: '/campaigns', key: 'campaigns', icon: Send },
  { to: '/automations', key: 'automations', icon: Workflow },
  { to: '/scraper', key: 'scraper', icon: Globe },
  { to: '/outbox', key: 'outbox', icon: Mails },
  { to: '/conversations', key: 'conversations', icon: MessagesSquare },
  { to: '/suppression', key: 'suppression', icon: ShieldBan },
  { to: '/activity', key: 'activity', icon: History },
  { to: '/handbook', key: 'handbook', icon: BookOpen },
  { to: '/settings', key: 'settings', icon: Settings },
]

// Je Bereich: Zielseite, Symbol und die Abfrage der Seite, die vor dem Sprung neu geladen wird.
// So öffnet die Seite den Eintrag im aktuellen Stand und nicht aus einem veralteten Zwischenspeicher.
const AREAS: Record<JumpArea, { to: string; icon: LucideIcon; queryKey: string[] }> = {
  contacts: { to: '/contacts', icon: Users, queryKey: ['contacts'] },
  companies: { to: '/scraper', icon: Building2, queryKey: ['discoveryCompany'] },
  prospects: { to: '/scraper', icon: Target, queryKey: ['prospects'] },
  outbox: { to: '/outbox', icon: Mails, queryKey: ['outbox'] },
  inbox: { to: '/conversations', icon: MessagesSquare, queryKey: ['inbox'] },
  products: { to: '/scraper', icon: Package, queryKey: ['products'] },
  lists: { to: '/lists', icon: FolderOpen, queryKey: ['lists'] },
  templates: { to: '/templates', icon: FileText, queryKey: ['templates'] },
  campaigns: { to: '/campaigns', icon: Send, queryKey: ['campaigns'] },
  automations: { to: '/automations', icon: Workflow, queryKey: ['automations'] },
  cohorts: { to: '/scraper', icon: Filter, queryKey: ['cohorts'] },
  searches: { to: '/scraper', icon: MapPin, queryKey: ['discoverySearches'] },
  scrapeJobs: { to: '/scraper', icon: Globe, queryKey: ['scrapeJobs'] },
  suppression: { to: '/suppression', icon: ShieldBan, queryKey: ['suppression'] },
}

interface SearchHit {
  id: string
  title: string
  subtitle: string | null
  field: string
  fieldDetail: string | null
  snippet: { before: string; match: string; after: string } | null
  productId?: string
}
interface SearchGroup {
  area: JumpArea
  total: number
  items: SearchHit[]
}

// Bereich der Suche: Datenbereiche vom Server oder das Handbuch (wird im Browser durchsucht)
type AreaKey = JumpArea | 'handbook'

// Treffer im Handbuch
interface DocHit {
  chapterId: string
  sectionId: string
  title: string
  chapterTitle: string
  snippet: SearchHit['snippet']
  rank: number
}

// Auswählbare Einträge der Liste, in der Reihenfolge der Tastatursteuerung
type Entry =
  | { kind: 'page'; key: string; to: string; label: string; icon: LucideIcon }
  | { kind: 'hit'; key: string; area: JumpArea; hit: SearchHit }
  | { kind: 'doc'; key: string; area: 'handbook'; doc: DocHit }
  | { kind: 'more'; key: string; area: AreaKey; total: number }

// Text vereinheitlichen wie bei der Suche auf dem Server; je Zeichen merken, woher es im Original stammt
function fold(text: string): { value: string; map: number[] } {
  let value = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const lower = text[i]!.toLowerCase()
    const out =
      lower === 'ä' ? 'ae' : lower === 'ö' ? 'oe' : lower === 'ü' ? 'ue' : lower === 'ß' ? 'ss' : lower.normalize('NFD').replace(/[^a-z0-9]/g, '')
    for (const ch of out) {
      value += ch
      map.push(i)
    }
  }
  return { value, map }
}

// Handbuch nach dem Begriff durchsuchen: zuerst Treffer im Abschnittstitel, dann im Text
function searchHandbook(chapters: HandbookChapter[], query: string): DocHit[] {
  const tokens = query
    .split(/\s+/)
    .map((w) => fold(w).value)
    .filter(Boolean)
  const compact = tokens.join('')
  if (compact.length < 2) return []
  const hits: DocHit[] = []
  for (const chapter of chapters) {
    for (const section of chapter.sections) {
      const body = section.blocks
        .map((b) =>
          b.type === 'p' || b.type === 'tip' || b.type === 'warning'
            ? b.text
            : b.type === 'terms'
              ? b.items.map((i) => `${i.term}: ${i.text}`).join(' ')
              : b.items.join(' '),
        )
        .join(' ')
        .replace(/\*\*/g, '')
      const title = fold(section.title)
      const text = fold(body)
      let rank = -1
      let snippet: SearchHit['snippet'] = null
      if (title.value.includes(compact)) rank = 0
      const pos = text.value.indexOf(compact)
      if (pos >= 0) {
        if (rank < 0) rank = 1
        const start = text.map[pos]!
        const end = text.map[pos + compact.length - 1]! + 1
        const from = Math.max(0, start - 50)
        const to = Math.min(body.length, end + 60)
        snippet = {
          before: (from > 0 ? '…' : '') + body.slice(from, start),
          match: body.slice(start, end),
          after: body.slice(end, to) + (to < body.length ? '…' : ''),
        }
      } else if (rank < 0 && tokens.length > 1 && tokens.every((tk) => title.value.includes(tk) || text.value.includes(tk))) {
        rank = 2
      }
      if (rank >= 0) {
        hits.push({ chapterId: chapter.id, sectionId: section.id, title: section.title, chapterTitle: chapter.title, snippet, rank })
      }
    }
  }
  return hits.sort((a, b) => a.rank - b.rank)
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setJump = useUi((s) => s.setJump)
  const handbook = useHandbook()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [area, setArea] = useState<AreaKey | null>(null)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Beim Schließen zurücksetzen, damit beim nächsten Öffnen sofort ein leeres Feld bereitsteht.
  // Würde erst beim Öffnen geleert, hängten sich schnell getippte Zeichen an den alten Begriff.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    } else {
      setQuery('')
      setDebounced('')
      setArea(null)
      setActive(0)
    }
  }, [open])

  // Erst suchen, wenn kurz nicht getippt wurde
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 220)
    return () => clearTimeout(timer)
  }, [query])

  const searching = debounced.length >= 2

  // Treffer über alle Bereiche laden
  const allQuery = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.get<{ groups: SearchGroup[] }>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: open && searching,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
  // Treffer nur im gewählten Bereich, dann mit mehr Einträgen
  const areaQuery = useQuery({
    queryKey: ['search', debounced, area],
    queryFn: () =>
      api.get<{ groups: SearchGroup[] }>(`/api/search?q=${encodeURIComponent(debounced)}&area=${area}`),
    enabled: open && searching && !!area && area !== 'handbook',
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })

  // Übersicht der Bereiche mit Trefferzahl stammt immer aus der Suche über alle Bereiche
  const overview = useMemo(() => (searching ? (allQuery.data?.groups ?? []) : []), [searching, allQuery.data])
  // Handbuch wird direkt im Browser durchsucht
  const docHits = useMemo(() => (searching ? searchHandbook(handbook, debounced) : []), [searching, handbook, debounced])
  const totalHits = overview.reduce((sum, g) => sum + g.total, 0) + docHits.length
  // Ein gewählter Bereich ohne Treffer für den neuen Begriff gilt als verlassen
  const areaValid = !!area && (area === 'handbook' ? docHits.length > 0 : overview.some((g) => g.area === area))
  const shownGroups = useMemo(
    () => (areaValid ? (area === 'handbook' ? [] : (areaQuery.data?.groups ?? [])) : overview),
    [areaValid, area, areaQuery.data, overview],
  )
  // Handbuchtreffer: im Bereich Handbuch alle, sonst die ersten fünf
  const shownDocs = areaValid ? (area === 'handbook' ? docHits.slice(0, 50) : []) : docHits.slice(0, 5)
  const loading = searching && (allQuery.isFetching || (areaValid && areaQuery.isFetching))
  const error = (allQuery.error ?? (areaValid ? areaQuery.error : null)) as Error | null

  // Seiten, deren Name zum Suchbegriff passt
  const pages = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = NAV_ITEMS.map((i) => ({ ...i, label: t(`nav.${i.key}`) }))
    if (!q) return items
    return items.filter((i) => i.label.toLowerCase().includes(q))
  }, [query, t])

  // Flache Liste aller auswählbaren Einträge
  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = []
    if (!areaValid) {
      for (const p of pages) list.push({ kind: 'page', key: `page:${p.to}`, to: p.to, label: p.label, icon: p.icon })
    }
    if (searching) {
      for (const g of shownGroups) {
        for (const hit of g.items) list.push({ kind: 'hit', key: `${g.area}:${hit.id}`, area: g.area, hit })
        if (!areaValid && g.total > g.items.length) {
          list.push({ kind: 'more', key: `more:${g.area}`, area: g.area, total: g.total })
        }
      }
      for (const doc of shownDocs) {
        list.push({ kind: 'doc', key: `doc:${doc.chapterId}:${doc.sectionId}`, area: 'handbook', doc })
      }
      if (!areaValid && docHits.length > shownDocs.length) {
        list.push({ kind: 'more', key: 'more:handbook', area: 'handbook', total: docHits.length })
      }
    }
    return list
  }, [pages, searching, shownGroups, areaValid, shownDocs, docHits.length])

  // Auswahl im gültigen Bereich halten
  useEffect(() => {
    if (active >= entries.length) setActive(Math.max(0, entries.length - 1))
  }, [entries, active])

  // Ausgewählten Eintrag beim Blättern mit den Pfeiltasten sichtbar halten
  useEffect(() => {
    listRef.current?.querySelector('.cmd-item.is-active')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  // Bereich wählen oder wieder alle zeigen
  const chooseArea = (next: AreaKey | null) => {
    setArea(next)
    setActive(0)
    listRef.current?.scrollTo({ top: 0 })
    inputRef.current?.focus()
  }

  // Eintrag öffnen: Seite aufrufen oder Treffer direkt auf seiner Seite öffnen
  const select = (entry: Entry) => {
    if (entry.kind === 'more') {
      chooseArea(entry.area)
      return
    }
    if (entry.kind === 'page') {
      navigate(entry.to)
    } else if (entry.kind === 'doc') {
      navigate(`/handbook/${entry.doc.chapterId}#${entry.doc.sectionId}`)
    } else {
      void queryClient.invalidateQueries({ queryKey: AREAS[entry.area].queryKey })
      setJump({ area: entry.area, id: entry.hit.id, productId: entry.hit.productId, title: entry.hit.title })
      navigate(AREAS[entry.area].to)
    }
    onClose()
  }

  // Tastatursteuerung
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      // Escape gilt nur der Suche, ein offenes Fenster dahinter bleibt offen
      e.stopPropagation()
      if (areaValid) chooseArea(null)
      else onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, entries.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = entries[active]
      if (target) select(target)
    }
  }

  // Einen Eintrag der Liste zeichnen
  const renderEntry = (entry: Entry) => {
    const index = entries.indexOf(entry)
    const isActive = index === active
    const className = `cmd-item${isActive ? ' is-active' : ''}${entry.kind === 'hit' || entry.kind === 'doc' ? ' cmd-item-hit' : ''}${entry.kind === 'more' ? ' cmd-item-more' : ''}`
    const handlers = {
      onMouseMove: () => {
        if (!isActive) setActive(index)
      },
      onClick: () => select(entry),
    }
    if (entry.kind === 'page') {
      const Icon = entry.icon
      return (
        <button key={entry.key} type="button" className={className} {...handlers}>
          <Icon size={17} className="cmd-item-icon" />
          <span className="cmd-item-label">{entry.label}</span>
          {isActive && <CornerDownLeft size={14} className="cmd-item-enter" />}
        </button>
      )
    }
    if (entry.kind === 'more') {
      return (
        <button key={entry.key} type="button" className={className} {...handlers}>
          <span className="cmd-item-label">
            {t('search.showAll', { count: entry.total, area: t(`search.area.${entry.area}`) })}
          </span>
          {isActive && <CornerDownLeft size={14} className="cmd-item-enter" />}
        </button>
      )
    }
    if (entry.kind === 'doc') {
      const { doc } = entry
      return (
        <button key={entry.key} type="button" className={className} {...handlers}>
          <BookOpen size={17} className="cmd-item-icon" />
          <span className="cmd-hit">
            <span className="cmd-hit-head">
              <span className="cmd-hit-title">{doc.title}</span>
              <span className="cmd-hit-sub">{doc.chapterTitle}</span>
            </span>
            {doc.snippet && (
              <span className="cmd-hit-snippet">
                <span className="cmd-hit-text">
                  {doc.snippet.before}
                  <mark>{doc.snippet.match}</mark>
                  {doc.snippet.after}
                </span>
              </span>
            )}
          </span>
          {isActive && <CornerDownLeft size={14} className="cmd-item-enter" />}
        </button>
      )
    }
    const { hit } = entry
    const Icon = AREAS[entry.area].icon
    const fieldLabel = t(`search.field.${hit.field}`, { defaultValue: hit.field })
    return (
      <button key={entry.key} type="button" className={className} {...handlers}>
        <Icon size={17} className="cmd-item-icon" />
        <span className="cmd-hit">
          <span className="cmd-hit-head">
            <span className="cmd-hit-title">{hit.title}</span>
            {hit.subtitle && <span className="cmd-hit-sub">{hit.subtitle}</span>}
          </span>
          {hit.snippet && (
            <span className="cmd-hit-snippet">
              <span className="cmd-hit-field">
                {hit.fieldDetail ? `${fieldLabel} (${hit.fieldDetail})` : fieldLabel}
              </span>
              <span className="cmd-hit-text">
                {hit.snippet.before}
                <mark>{hit.snippet.match}</mark>
                {hit.snippet.after}
              </span>
            </span>
          )}
        </span>
        {isActive && <CornerDownLeft size={14} className="cmd-item-enter" />}
      </button>
    )
  }

  const pageEntries = entries.filter((e) => e.kind === 'page')

  return createPortal(
    <div className="cmd-overlay" onClick={onClose}>
      <div
        className="cmd animate-in"
        role="dialog"
        aria-label={t('search.title')}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="cmd-input-row">
          <Search size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            autoFocus
            className="cmd-input"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
          />
          {loading && <span className="spinner cmd-spinner" aria-label={t('common.loading')} />}
          <kbd className="kbd">Esc</kbd>
        </div>

        {/* Bereiche, in denen der Begriff vorkommt, mit Trefferzahl */}
        {searching && (overview.length > 0 || docHits.length > 0) && (
          <div className="cmd-areas" role="tablist" aria-label={t('search.foundIn')}>
            <span className="cmd-areas-label">{t('search.foundIn')}</span>
            <button
              type="button"
              role="tab"
              aria-selected={!areaValid}
              className={`cmd-area${!areaValid ? ' is-active' : ''}`}
              onClick={() => chooseArea(null)}
            >
              {t('common.all')}
              <span className="cmd-area-count">{totalHits}</span>
            </button>
            {overview.map((g) => (
              <button
                key={g.area}
                type="button"
                role="tab"
                aria-selected={areaValid && area === g.area}
                className={`cmd-area${areaValid && area === g.area ? ' is-active' : ''}`}
                onClick={() => chooseArea(g.area)}
              >
                {t(`search.area.${g.area}`)}
                <span className="cmd-area-count">{g.total}</span>
              </button>
            ))}
            {docHits.length > 0 && (
              <button
                type="button"
                role="tab"
                aria-selected={areaValid && area === 'handbook'}
                className={`cmd-area${areaValid && area === 'handbook' ? ' is-active' : ''}`}
                onClick={() => chooseArea('handbook')}
              >
                {t('search.area.handbook')}
                <span className="cmd-area-count">{docHits.length}</span>
              </button>
            )}
          </div>
        )}

        {/* Während neue Treffer laden, bleiben die alten blass sichtbar statt zu springen */}
        <div className={`cmd-list${allQuery.isPlaceholderData || areaQuery.isPlaceholderData ? ' is-stale' : ''}`} ref={listRef}>
          {error && <div className="cmd-error">{t('search.error', { message: error.message })}</div>}

          {pageEntries.length > 0 && (
            <>
              {searching && <div className="cmd-group-head">{t('search.pages')}</div>}
              {pageEntries.map(renderEntry)}
            </>
          )}

          {searching &&
            shownGroups.map((g) => (
              <Fragment key={g.area}>
                <div className="cmd-group-head">
                  <span>{t(`search.area.${g.area}`)}</span>
                  <span className="cmd-group-count">{t('search.hits', { count: g.total })}</span>
                </div>
                {entries.filter((e) => e.kind !== 'page' && e.area === g.area).map(renderEntry)}
              </Fragment>
            ))}

          {searching && shownDocs.length > 0 && (
            <>
              <div className="cmd-group-head">
                <span>{t('search.area.handbook')}</span>
                <span className="cmd-group-count">{t('search.hits', { count: docHits.length })}</span>
              </div>
              {entries.filter((e) => e.kind !== 'page' && e.area === 'handbook').map(renderEntry)}
            </>
          )}

          {/* Hinweise statt leerer Fläche */}
          {query.trim().length === 1 && <div className="cmd-empty">{t('search.minChars')}</div>}
          {searching && !loading && !error && allQuery.isSuccess && overview.length === 0 && docHits.length === 0 && (
            <div className="cmd-empty">{t('search.noResults', { query: debounced })}</div>
          )}
          {query.trim().length === 0 && <div className="cmd-hint">{t('search.hint')}</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
