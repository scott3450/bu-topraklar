import { useEffect, useState } from 'react'
import { muted, setMuted, startAmbient } from './audio'
import type { Palette } from '../theme/palettes'

/** Sağ üstte ses düğmesi; ilk dokunuşta ortam sesi başlar. */
export function SoundToggle({ p }: { p: Palette }) {
  const [off, setOff] = useState(muted())
  useEffect(() => {
    const first = () => startAmbient()
    window.addEventListener('pointerdown', first, { once: true })
    return () => window.removeEventListener('pointerdown', first)
  }, [])
  return (
    <button
      onClick={() => {
        setMuted(!off)
        setOff(!off)
        startAmbient()
      }}
      aria-label={off ? 'Sesi aç' : 'Sesi kapat'}
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        border: 'none',
        background: p.ui.card,
        boxShadow: '0 6px 24px rgba(60,40,20,0.12)',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        zIndex: 5,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
        <path d="M3 7h3l4-3v12l-4-3H3z" fill={p.ui.text} />
        {off ? (
          <path d="m13 7 5 6m0-6-5 6" stroke={p.ui.text} strokeWidth="1.8" />
        ) : (
          <path d="M13 6.5c1.5 1 1.5 6 0 7m2.5-9c3 2 3 9 0 11" stroke={p.ui.text} strokeWidth="1.6" fill="none" />
        )}
      </svg>
    </button>
  )
}
