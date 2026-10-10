import { useEffect, useState, type ReactNode } from 'react'
import type { Palette } from '../theme/palettes'
import { OLIVE } from '../sim/config'
import { SHELF_PER_LT } from '../chapter/ch1'

const KEY = 'bu-topraklar-giris'
export function introSeen() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return true // depolama yoksa her açılışta gösterme
  }
}
function markSeen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* gizli pencere */
  }
}

const SLIDE_MS = 5500

/** İlk açılış: üç kısa kare, sonra harita. Dokununca ilerler. */
export function Intro({ p, onDone }: { p: Palette; onDone: () => void }) {
  const [i, setI] = useState(0)
  const slides: ReactNode[] = [
    <>
      <div style={{ fontSize: 13, letterSpacing: 1.2, color: p.accent, fontWeight: 800 }}>AYDIN · EKİM</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>Şehirden köyüne döndün.</div>
    </>,
    <>
      <div style={{ fontSize: 20, fontWeight: 800 }}>Zeytin bol. Ama fiyatı tüccar koyuyor.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10, marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 14, color: p.ui.muted }}>Tüccar öder</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{OLIVE.traderPrice} ₺<span style={{ fontSize: 14, color: p.ui.muted }}>/kg</span></div>
        </div>
        <div style={{ fontSize: 22, color: p.ui.muted }}>→</div>
        <div>
          <div style={{ fontSize: 14, color: p.ui.muted }}>Rafta</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: p.accent }}>{SHELF_PER_LT} ₺<span style={{ fontSize: 14, color: p.ui.muted }}>/lt</span></div>
        </div>
      </div>
    </>,
    <>
      <div style={{ fontSize: 20, fontWeight: 800 }}>Tek başına kimse pazarlık edemiyor.</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: p.accent }}>Bir kooperatif kur.</div>
    </>,
  ]
  const last = i === slides.length - 1
  const finish = () => (markSeen(), onDone())
  useEffect(() => {
    if (last) return
    const t = setTimeout(() => setI(i + 1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [i, last])

  return (
    <div
      onClick={() => (last ? undefined : setI(i + 1))}
      style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(30,48,58,0.35)', zIndex: 900, cursor: last ? 'default' : 'pointer' }}
    >
      <div
        key={i}
        style={{ width: 'min(440px, 100%)', boxSizing: 'border-box', padding: 24, borderRadius: 18, background: p.ui.card, color: p.ui.text, fontFamily: p.ui.font, boxShadow: '0 10px 40px rgba(30,40,40,0.25)', animation: 'giris 400ms ease-out both' }}
      >
        {slides[i]}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {slides.map((_, j) => (
              <span key={j} style={{ width: j === i ? 18 : 6, height: 6, borderRadius: 3, background: j <= i ? p.accent : '#d8cdb9', transition: 'width 200ms' }} />
            ))}
          </div>
          {last ? (
            <button onClick={finish} style={{ padding: '11px 18px', borderRadius: 10, border: 'none', background: p.ui.button, color: p.ui.buttonText, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: p.ui.font }}>
              Başla
            </button>
          ) : (
            <button onClick={(e) => (e.stopPropagation(), finish())} style={{ border: 'none', background: 'none', color: p.ui.muted, fontSize: 14, cursor: 'pointer', fontFamily: p.ui.font }}>
              Geç
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
