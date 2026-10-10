import { useState } from 'react'
import type { Palette } from '../theme/palettes'
import { TERIMLER } from './terimler'
import { useDefter } from './store'
import { Head } from '../ui/Head'

/** Sağ üstte Defter: karşılaşılan terimler oynadıkça dolar. */
export function Defter({ p }: { p: Palette }) {
  const seen = useDefter((s) => s.seen)
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState<string | null>(null)
  const terms = seen.map((id) => TERIMLER[id]).filter(Boolean)
  const chosen = pick ? TERIMLER[pick] : null
  const all = Object.keys(TERIMLER).length
  if (seen.length === 0) return null
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Defter"
        style={{ position: 'absolute', top: 16, right: 112, height: 40, padding: '0 12px', borderRadius: 20, border: 'none', background: p.ui.card, boxShadow: '0 6px 24px rgba(60,40,20,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, zIndex: 5, color: p.ui.text, fontFamily: p.ui.font, fontWeight: 700, fontSize: 14 }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
          <path d="M4 3h9a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3z" fill="none" stroke={p.ui.text} strokeWidth="1.8" />
          <path d="M4 14a3 3 0 0 1 3-3h9" fill="none" stroke={p.ui.text} strokeWidth="1.8" />
        </svg>
        {seen.length}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 64, right: 16, width: 'min(340px, calc(100% - 32px))', maxHeight: '70%', overflowY: 'auto', overflowX: 'hidden', padding: 16, borderRadius: p.ui.radius, background: p.ui.card, boxShadow: '0 6px 24px rgba(60,40,20,0.15)', fontFamily: p.ui.font, color: p.ui.text, zIndex: 6 }}>
          <Head color={p.accent} pad={16}>
            <span>DEFTER</span>
            <span style={{ opacity: 0.9 }}>
              {seen.length}/{all} terim
            </span>
          </Head>
          {/* terimler çip olarak; dokununca yalnız o terimin tanımı açılır (yer kaplamasın) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {terms.map((t) => (
              <button
                key={t.id}
                onClick={() => setPick(pick === t.id ? null : t.id)}
                style={{ padding: '6px 11px', borderRadius: 999, border: 'none', background: pick === t.id ? p.accent : p.ui.chip, color: pick === t.id ? '#ffffff' : p.ui.text, fontFamily: p.ui.font, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {t.name}
              </button>
            ))}
            {Array.from({ length: all - seen.length }, (_, i) => (
              <span key={i} style={{ padding: '6px 11px', borderRadius: 999, background: '#f1ece2', color: '#c8bca8', fontSize: 13, fontWeight: 700 }}>
                ?
              </span>
            ))}
          </div>
          {chosen && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: '#f6f3ec', display: 'grid', gap: 4, fontSize: 14, lineHeight: 1.4, animation: 'giris 200ms ease-out both' }}>
              <b style={{ color: p.accent }}>{chosen.name}</b>
              <span>{chosen.def}</span>
              <span style={{ color: p.ui.muted, fontSize: 13 }}>{chosen.example}</span>
              {chosen.source && <span style={{ fontSize: 12, color: p.ui.muted }}>✅ {chosen.source}</span>}
            </div>
          )}
        </div>
      )}
    </>
  )
}
