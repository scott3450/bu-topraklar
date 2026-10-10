import { useState, type CSSProperties } from 'react'
import type { Palette } from '../theme/palettes'
import { useSettings, type Quality } from './settings'

/** Sağ üstte ayar düğmesi: grafik kalitesi ve sakin hareket. */
export function SettingsPanel({ p }: { p: Palette }) {
  const { quality, calm, set } = useSettings()
  const [open, setOpen] = useState(false)
  const seg = (on: boolean): CSSProperties => ({
    flex: 1,
    padding: '8px 6px',
    border: 'none',
    borderRadius: 8,
    background: on ? p.ui.button : 'transparent',
    color: on ? p.ui.buttonText : p.ui.text,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: p.ui.font,
  })
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Ayarlar"
        style={{ position: 'absolute', top: 16, right: 64, width: 40, height: 40, borderRadius: 20, border: 'none', background: p.ui.card, boxShadow: '0 6px 24px rgba(60,40,20,0.12)', cursor: 'pointer', display: 'grid', placeItems: 'center', zIndex: 5 }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="10" r="3" fill="none" stroke={p.ui.text} strokeWidth="1.8" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4
            return <line key={i} x1={10 + Math.cos(a) * 5.5} y1={10 + Math.sin(a) * 5.5} x2={10 + Math.cos(a) * 8} y2={10 + Math.sin(a) * 8} stroke={p.ui.text} strokeWidth="2" strokeLinecap="round" />
          })}
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 64, right: 16, width: 250, padding: 14, borderRadius: 18, background: p.ui.card, boxShadow: '0 6px 24px rgba(60,40,20,0.15)', fontFamily: p.ui.font, color: p.ui.text, zIndex: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: p.ui.muted, marginBottom: 6 }}>GRAFİK</div>
          <div style={{ display: 'flex', gap: 4, background: p.ui.chip, borderRadius: 10, padding: 3 }}>
            {(['yuksek', 'orta', 'dusuk'] as Quality[]).map((q) => (
              <button key={q} onClick={() => set({ quality: q })} style={seg(quality === q)}>
                {q === 'yuksek' ? 'Yüksek' : q === 'orta' ? 'Orta' : 'Düşük'}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={calm} onChange={(e) => set({ calm: e.target.checked })} />
            Sakin hareket (kamera uçuşu ve kuşlar kapalı)
          </label>
        </div>
      )}
    </>
  )
}
