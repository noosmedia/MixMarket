// Logo-Komponente. Monochrom: zwei feine ueberlappende Kreise (Mix/Schnittmenge)
// in der aktuellen Textfarbe, ohne Kachel. Passt sich Hell und Dunkel an.

// Reine Bildmarke
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Voller Kreis und ein zweiter, leicht versetzter, der die Schnittmenge bildet */}
      <circle cx="11" cy="14" r="7" stroke="currentColor" strokeWidth="1.6" opacity="0.95" />
      <circle cx="17" cy="14" r="7" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
    </svg>
  )
}

// Bildmarke plus Schriftzug; mit pro steht dahinter klein und dünn "Pro"
export function Wordmark({ markSize = 22, pro = false }: { markSize?: number; pro?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <LogoMark size={markSize} />
      <span
        className="font-display"
        style={{ fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.035em' }}
      >
        MixMarket
        {pro && <span className="wordmark-pro">Pro</span>}
      </span>
    </span>
  )
}
