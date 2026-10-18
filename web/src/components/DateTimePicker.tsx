// App-eigene Auswahl von Datum und Uhrzeit statt des Browser-Kalenders.
// Der Wert hat dasselbe Format wie ein datetime-local-Feld ("2026-10-16T14:30",
// lokale Zeit ohne Zeitzone), damit die aufrufenden Seiten unverändert rechnen.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { floatingStyle, useFloating } from './floating'
import './select.css'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  id?: string
  min?: Date // frühester erlaubter Zeitpunkt
  placeholder?: string
  autoFocus?: boolean
  clearable?: boolean // Knopf "Leeren" anbieten
}

interface Day {
  y: number
  m: number // 0 bis 11
  d: number
}

const pad = (n: number) => String(n).padStart(2, '0')
const sameDay = (a: Day | null, b: Day | null) => !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d
const dayOf = (date: Date): Day => ({ y: date.getFullYear(), m: date.getMonth(), d: date.getDate() })
const dayKey = (day: Day) => `${day.y}-${pad(day.m + 1)}-${pad(day.d)}`

// Wert "JJJJ-MM-TTTHH:MM" in ein Datum umwandeln, ungültig ergibt null
function parseValue(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!m) return null
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]))
  return Number.isNaN(date.getTime()) ? null : date
}

function formatValue(date: Date): string {
  return `${dayKey(dayOf(date))}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Vorschlag beim ersten Öffnen: nächste volle Viertelstunde
function nextQuarterHour(): Date {
  const date = new Date()
  date.setSeconds(0, 0)
  date.setMinutes(Math.ceil((date.getMinutes() + 1) / 15) * 15)
  return date
}

export function DateTimePicker({
  value,
  onChange,
  id,
  min,
  placeholder,
  autoFocus,
  clearable = false,
}: DateTimePickerProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en-GB' : 'de-DE'
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState({ y: 0, m: 0 })
  const [draft, setDraft] = useState<Day | null>(null)
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Nach Tastaturbewegung den Fokus auf den neuen Tag setzen
  const focusDay = useRef(false)

  const current = parseValue(value)
  const position = useFloating(open, triggerRef, panelRef, () => setOpen(false), {
    minWidth: 300,
    preferredHeight: 440,
    align: 'center',
  })

  useEffect(() => {
    if (autoFocus) triggerRef.current?.focus()
  }, [autoFocus])

  // Beim Öffnen mit dem gewählten Wert oder einem Vorschlag beginnen
  function openPanel() {
    const base = current ?? nextQuarterHour()
    setView({ y: base.getFullYear(), m: base.getMonth() })
    setDraft(dayOf(base))
    setHour(pad(base.getHours()))
    setMinute(pad(base.getMinutes()))
    setError(null)
    focusDay.current = true
    setOpen(true)
  }

  // Fokus auf den markierten Tag, sobald das Fenster steht oder der Tag wechselt
  useEffect(() => {
    if (!open || !position || !focusDay.current || !draft) return
    focusDay.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${dayKey(draft)}"]`)?.focus()
  }, [open, position, draft])

  // Frühester Tag, der noch gewählt werden darf
  const minDay = min ? new Date(min.getFullYear(), min.getMonth(), min.getDate()) : null
  const isBeforeMin = (day: Day) => !!minDay && new Date(day.y, day.m, day.d) < minDay

  // 6 Wochen ab dem Montag vor dem Monatsersten
  const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7
  const cells: Day[] = Array.from({ length: 42 }, (_, i) => dayOf(new Date(view.y, view.m, 1 - offset + i)))
  const today = dayOf(new Date())
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2024, 0, 1 + i)),
  )
  const monthTitle = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(view.y, view.m, 1))

  function moveMonth(delta: number) {
    const date = new Date(view.y, view.m + delta, 1)
    setView({ y: date.getFullYear(), m: date.getMonth() })
  }

  // Tag wählen; liegt er in einem anderen Monat, dorthin blättern
  function pickDay(day: Day, withFocus = false) {
    // Vergangene Tage bleiben klickbar und erklären, warum sie nicht gehen
    if (isBeforeMin(day)) {
      setError(t('datetime.tooEarly'))
      return
    }
    setDraft(day)
    setView({ y: day.y, m: day.m })
    setError(null)
    focusDay.current = withFocus
  }

  // Pfeiltasten im Kalender: Tag, Woche, mit Bild auf/ab ein Monat
  function onGridKey(e: React.KeyboardEvent) {
    if (!draft) return
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    let next: Date | null = null
    if (e.key in steps) next = new Date(draft.y, draft.m, draft.d + steps[e.key])
    else if (e.key === 'PageUp') next = new Date(draft.y, draft.m - 1, draft.d)
    else if (e.key === 'PageDown') next = new Date(draft.y, draft.m + 1, draft.d)
    if (!next) return
    e.preventDefault()
    pickDay(dayOf(next), true)
  }

  // Prüfen und übernehmen
  function apply() {
    if (!draft) return
    const h = Number(hour)
    const mi = Number(minute)
    if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute) || h > 23 || mi > 59) {
      setError(t('datetime.invalidTime'))
      return
    }
    const date = new Date(draft.y, draft.m, draft.d, h, mi)
    if (min && date < min) {
      setError(t('datetime.tooEarly'))
      return
    }
    onChange(formatValue(date))
    setOpen(false)
    triggerRef.current?.focus()
  }

  function onTimeKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      apply()
    }
  }

  const label = current
    ? new Intl.DateTimeFormat(lang, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(current)
    : (placeholder ?? t('datetime.placeholder'))

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`select select-trigger${open ? ' is-open' : ''}${current ? '' : ' is-placeholder'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            openPanel()
          }
        }}
      >
        <span className="select-trigger-label">{label}</span>
        <CalendarDays size={15} className="select-trigger-icon is-static" aria-hidden />
      </button>

      {open &&
        position &&
        createPortal(
          <>
          {/* Handy: abgedunkelter Hintergrund hinter dem Blatt */}
          {position.sheet && <div className="float-backdrop" aria-hidden="true" />}
          <div
            ref={panelRef}
            className={`float-panel dtp-panel${position.above ? ' is-above' : ''}${position.sheet ? ' is-sheet' : ''}`}
            style={floatingStyle(position)}
            role="dialog"
            aria-label={t('datetime.placeholder')}
          >
            {/* Monat wechseln */}
            <div className="dtp-head">
              <button type="button" className="dtp-nav" onClick={() => moveMonth(-1)} aria-label={t('datetime.prevMonth')}>
                <ChevronLeft size={16} />
              </button>
              <span className="dtp-month">{monthTitle}</span>
              <button type="button" className="dtp-nav" onClick={() => moveMonth(1)} aria-label={t('datetime.nextMonth')}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Kalenderblatt */}
            <div className="dtp-weekdays" aria-hidden>
              {weekdays.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="dtp-grid" ref={gridRef} role="grid" onKeyDown={onGridKey}>
              {cells.map((day) => {
                const outside = day.m !== view.m
                const disabled = isBeforeMin(day)
                const selected = sameDay(day, draft)
                return (
                  <button
                    key={dayKey(day)}
                    type="button"
                    data-day={dayKey(day)}
                    tabIndex={selected ? 0 : -1}
                    className={`dtp-day${outside ? ' is-outside' : ''}${selected ? ' is-selected' : ''}${sameDay(day, today) ? ' is-today' : ''}`}
                    aria-pressed={selected}
                    aria-disabled={disabled || undefined}
                    onClick={() => pickDay(day)}
                  >
                    {day.d}
                  </button>
                )
              })}
            </div>

            {/* Uhrzeit */}
            <div className="dtp-time">
              <span className="dtp-time-label">{t('datetime.time')}</span>
              <input
                className="input dtp-time-input font-mono"
                inputMode="numeric"
                maxLength={2}
                value={hour}
                onChange={(e) => {
                  setHour(e.target.value.replace(/\D/g, ''))
                  setError(null)
                }}
                onFocus={(e) => e.target.select()}
                onKeyDown={onTimeKey}
                aria-label={t('datetime.hour')}
              />
              <span className="dtp-time-sep">:</span>
              <input
                className="input dtp-time-input font-mono"
                inputMode="numeric"
                maxLength={2}
                value={minute}
                onChange={(e) => {
                  setMinute(e.target.value.replace(/\D/g, ''))
                  setError(null)
                }}
                onFocus={(e) => e.target.select()}
                onKeyDown={onTimeKey}
                aria-label={t('datetime.minute')}
              />
              {/* "Uhr" nur, wo die Sprache es kennt */}
              {t('datetime.clock') && <span className="dtp-time-unit">{t('datetime.clock')}</span>}
            </div>
            {error && <div className="dtp-error">{error}</div>}

            {/* Aktionen */}
            <div className="dtp-actions">
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => pickDay(today, true)}>
                {t('datetime.today')}
              </button>
              {clearable && current && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                    triggerRef.current?.focus()
                  }}
                >
                  {t('datetime.clear')}
                </button>
              )}
              <button type="button" className="btn btn-sm btn-primary dtp-apply" onClick={apply}>
                {t('datetime.apply')}
              </button>
            </div>
          </div>
          </>,
          document.body,
        )}
    </>
  )
}
