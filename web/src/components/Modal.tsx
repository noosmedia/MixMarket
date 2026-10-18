// Wiederverwendbares Modal über createPortal. Schließt bei Klick auf den
// Hintergrund oder mit Escape. Eigene Komponente, kein Browser-Dialog.
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './modal.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number
}

// Stapel der offenen Modals: Escape schließt nur das oberste, und das
// Scrollen der Seite wird erst freigegeben, wenn kein Modal mehr offen ist
const openStack: symbol[] = []

export function Modal({ open, onClose, title, subtitle, children, footer, width = 540 }: ModalProps) {
  // Aktuelle Schließen-Funktion merken, damit ein neues Rendern die
  // Reihenfolge im Stapel nicht verändert
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Escape schließt das Modal
  useEffect(() => {
    if (!open) return
    const id = Symbol('modal')
    openStack.push(id)
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === id) onCloseRef.current()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      openStack.splice(openStack.indexOf(id), 1)
      if (openStack.length === 0) document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal animate-in"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {(title || subtitle) && (
          <div className="modal-header">
            <div>
              {title && <h2 className="modal-title font-display">{title}</h2>}
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
            <button className="modal-close" onClick={onClose} aria-label="Schließen">
              <X size={19} />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
