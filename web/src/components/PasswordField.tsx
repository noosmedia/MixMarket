// Passwortfeld mit Auge rechts im Feld, um die Eingabe kurz sichtbar zu machen.
// Wiederverwendbar für Passwörter und API-Schlüssel.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import './password-field.css'

interface PasswordFieldProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  mono?: boolean
}

export function PasswordField({ id, value, onChange, placeholder, autoComplete = 'off', mono }: PasswordFieldProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const label = visible
    ? t('common.hideSecret', { defaultValue: 'Verbergen' })
    : t('common.showSecret', { defaultValue: 'Anzeigen' })

  return (
    <div className="password-field">
      <input
        id={id}
        className={`input ${mono ? 'font-mono' : ''}`}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        spellCheck={false}
      />
      <button
        type="button"
        className="password-field-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
