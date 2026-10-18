// App-eigenes Auswahlfeld statt des Browser-Dropdowns. Öffnet ein gestaltetes
// Fenster mit den Einträgen, bei langen Listen mit Suchfeld. Bedienung per Maus,
// Touch und Tastatur (Pfeiltasten, Pos1, Ende, Enter, Escape, Anfangsbuchstabe).
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Search } from 'lucide-react'
import { floatingStyle, useFloating } from './floating'
import './select.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  id?: string
  placeholder?: string // Text, wenn kein Eintrag gewählt ist
  className?: string
  searchable?: boolean // Suchfeld anzeigen; Standard: ab 12 Einträgen
  'aria-label'?: string
}

const SEARCH_FROM = 12

export function Select({
  value,
  options,
  onChange,
  id,
  placeholder,
  className = '',
  searchable,
  'aria-label': ariaLabel,
}: SelectProps) {
  const { t } = useTranslation()
  const listId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(-1)
  // Tippen von Anfangsbuchstaben bei geschlossenem und offenem Fenster
  const typeAhead = useRef({ text: '', at: 0 })

  const withSearch = searchable ?? options.length >= SEARCH_FROM
  const selected = options.find((o) => o.value === value)

  // Einträge nach Suchbegriff filtern
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
  }, [options, query])

  const position = useFloating(open, triggerRef, panelRef, () => setOpen(false), {
    minWidth: 200,
    preferredHeight: withSearch ? 360 : 300,
  })

  // Beim Öffnen: gewählten Eintrag markieren und Fokus ins Fenster setzen
  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    const frame = requestAnimationFrame(() => (withSearch ? searchRef.current : listRef.current)?.focus())
    return () => cancelAnimationFrame(frame)
    // Bewusst nur beim Öffnen ausführen, nicht bei jeder Wertänderung
  }, [open])

  // Markierten Eintrag sichtbar halten
  useEffect(() => {
    if (!open || active < 0) return
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, position])

  function choose(option: SelectOption | undefined) {
    if (!option || option.disabled) return
    if (option.value !== value) onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  // Nächsten wählbaren Eintrag in einer Richtung suchen
  function step(from: number, dir: 1 | -1): number {
    for (let i = from + dir; i >= 0 && i < visible.length; i += dir) if (!visible[i].disabled) return i
    return from
  }

  // Anfangsbuchstaben: springt zum ersten passenden Eintrag
  function findByTyping(char: string, list: SelectOption[], start: number): number {
    const now = Date.now()
    const ta = typeAhead.current
    ta.text = now - ta.at > 700 ? char : ta.text + char
    ta.at = now
    const text = ta.text.toLowerCase()
    for (let n = 0; n < list.length; n++) {
      const i = (start + (ta.text.length > 1 ? 0 : 1) + n) % list.length
      if (!list[i].disabled && list[i].label.toLowerCase().startsWith(text)) return i
    }
    return -1
  }

  // Tastatur am geschlossenen Feld: Pfeiltasten öffnen, Buchstaben wählen direkt
  function onTriggerKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
    } else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const current = options.findIndex((o) => o.value === value)
      const i = findByTyping(e.key, options, current)
      if (i >= 0) onChange(options[i].value)
    }
  }

  // Tastatur im offenen Fenster
  function onPanelKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => step(a, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => step(a, -1))
    } else if (e.key === 'Home' && !withSearch) {
      e.preventDefault()
      setActive(step(-1, 1))
    } else if (e.key === 'End' && !withSearch) {
      e.preventDefault()
      setActive(step(visible.length, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(visible[active])
    } else if (e.key === 'Tab') {
      setOpen(false)
    } else if (!withSearch && e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const i = findByTyping(e.key, visible, active)
      if (i >= 0) setActive(i)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`select select-trigger${open ? ' is-open' : ''}${selected ? '' : ' is-placeholder'} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
      >
        <span className="select-trigger-label">{selected?.label ?? placeholder ?? t('common.choose')}</span>
        <ChevronDown size={15} className="select-trigger-icon" aria-hidden />
      </button>

      {open &&
        position &&
        createPortal(
          <>
          {/* Handy: abgedunkelter Hintergrund hinter dem Blatt */}
          {position.sheet && <div className="float-backdrop" aria-hidden="true" />}
          <div
            ref={panelRef}
            className={`float-panel select-panel${position.above ? ' is-above' : ''}${position.sheet ? ' is-sheet' : ''}`}
            style={floatingStyle(position)}
            onKeyDown={onPanelKey}
          >
            {withSearch && (
              <div className="select-search">
                <Search size={14} aria-hidden />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setActive(0)
                  }}
                  placeholder={t('common.filter')}
                  aria-label={t('common.filter')}
                  aria-controls={listId}
                  aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
                />
              </div>
            )}
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              className="select-list"
              aria-label={ariaLabel}
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            >
              {visible.length === 0 && <li className="select-empty">{t('common.noMatches')}</li>}
              {visible.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={o.value === value}
                  aria-disabled={o.disabled || undefined}
                  className={`select-option${i === active ? ' is-active' : ''}${o.value === value ? ' is-selected' : ''}${o.disabled ? ' is-disabled' : ''}`}
                  onMouseMove={() => !o.disabled && i !== active && setActive(i)}
                  onClick={() => choose(o)}
                >
                  <span className="select-option-label">{o.label}</span>
                  {o.value === value && <Check size={14} className="select-option-check" aria-hidden />}
                </li>
              ))}
            </ul>
          </div>
          </>,
          document.body,
        )}
    </>
  )
}
