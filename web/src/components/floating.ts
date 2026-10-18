// Gemeinsame Logik für aufklappende Fenster am Eingabefeld (Auswahlfeld, Kalender):
// Lage unter oder über dem Feld, Mitwandern beim Scrollen, Schließen bei Klick
// außerhalb und mit Escape. Das Fenster liegt per Portal im body und damit über Modals.
// Auf dem Handy (unter 768 px) kommt es als Blatt von unten über die volle Breite.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

export interface FloatingPosition {
  top: number
  left: number
  width: number
  maxHeight: number
  above: boolean
  sheet: boolean // Handy: Blatt von unten statt Fenster am Feld
}

interface FloatingOptions {
  minWidth?: number // Mindestbreite des Fensters in Pixeln
  preferredHeight?: number // gewünschte Höhe, entscheidet über oben oder unten
  align?: 'start' | 'center' // ist das Fenster breiter als das Feld: bündig links oder mittig
}

const SHEET_BELOW = 768 // unter dieser Breite als Blatt von unten

const GAP = 6 // Abstand zwischen Feld und Fenster
const EDGE = 8 // Mindestabstand zum Fensterrand

export function useFloating(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  { minWidth = 0, preferredHeight = 320, align = 'start' }: FloatingOptions = {},
): FloatingPosition | null {
  const [position, setPosition] = useState<FloatingPosition | null>(null)
  // Aktuelle Schließen-Funktion merken, damit die Listener nicht neu angelegt werden
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Lage berechnen: unten, wenn genug Platz ist, sonst oben
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    // Nur bei echter Änderung neu setzen: sonst springt eine gescrollte Liste zurück
    const apply = (next: FloatingPosition) =>
      setPosition((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.maxHeight === next.maxHeight &&
        prev.above === next.above &&
        prev.sheet === next.sheet
          ? prev
          : next,
      )
    const update = () => {
      const anchor = anchorRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const viewportW = window.innerWidth
      const viewportH = window.innerHeight
      if (viewportW < SHEET_BELOW) {
        apply({ top: 0, left: 0, width: viewportW, maxHeight: Math.round(viewportH * 0.75), above: false, sheet: true })
        return
      }
      const width = Math.min(Math.max(rect.width, minWidth), viewportW - EDGE * 2)
      const spaceBelow = viewportH - rect.bottom - GAP - EDGE
      const spaceAbove = rect.top - GAP - EDGE
      const above = spaceBelow < Math.min(preferredHeight, 240) && spaceAbove > spaceBelow
      const maxHeight = Math.max(160, Math.min(preferredHeight, above ? spaceAbove : spaceBelow))
      // Breiter als das Feld: je nach Wunsch mittig zum Feld, nie über den Rand hinaus
      const wanted = align === 'center' ? rect.left + (rect.width - width) / 2 : rect.left
      const left = Math.min(Math.max(EDGE, wanted), viewportW - width - EDGE)
      apply({
        top: above ? rect.top - GAP : rect.bottom + GAP,
        left,
        width,
        maxHeight,
        above,
        sheet: false,
      })
    }
    update()
    // Beim Scrollen (auch in Modals) und bei Größenänderung mitwandern
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, anchorRef, minWidth, preferredHeight, align])

  // Schließen bei Klick außerhalb und mit Escape. Escape wird abgefangen, bevor
  // ein umgebendes Modal es sieht, damit nur das Fenster schließt.
  // Bewusst "click" statt "pointerdown": iOS Safari verwirft sonst den Klick auf
  // das Element, das außerhalb angetippt wurde.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
      onCloseRef.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onCloseRef.current()
      anchorRef.current?.focus()
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open, anchorRef, panelRef])

  return position
}

// Inline-Stil für das Fenster aus der berechneten Lage
export function floatingStyle(p: FloatingPosition): React.CSSProperties {
  if (p.sheet) return { left: 0, right: 0, bottom: 0, maxHeight: p.maxHeight }
  return {
    top: p.above ? undefined : p.top,
    bottom: p.above ? window.innerHeight - p.top : undefined,
    left: p.left,
    width: p.width,
    maxHeight: p.maxHeight,
  }
}
