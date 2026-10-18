// Zeigt Toast-Benachrichtigungen oben rechts an. Einheitliches System.
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { useUi, type ToastKind } from '../stores/ui'
import './toast.css'

// Passendes Icon je Kategorie
const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

export function ToastHost() {
  const { toasts, dismiss } = useUi()

  return (
    <div className="toast-host">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind]
        return (
          <div key={toast.id} className={`toast toast-${toast.kind}`} role="status">
            <Icon size={18} className="toast-icon" />
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Schließen">
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
