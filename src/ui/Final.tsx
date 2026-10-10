// Bölge hedefi (haritada çip) ve final ekranı: kooperatifin hikâyesi. Az metin: büyük rakam, çipler, bölge satırları.
import { useEffect, useState } from 'react'
import type { Palette } from '../theme/palettes'
import { useGame } from '../sim/store'
import * as E from '../sim/engine'
import { bolgeler, finalReady } from '../data/final'
import { useDefter } from '../defter/store'
import { useChapter } from '../chapter/engine'
import { CHAPTERS, OZEL } from '../chapter/chapters'
import { useProgress } from '../data/progress'
import { Head } from './Head'
import { useNarrow } from './useNarrow'

const KEY = 'bu-topraklar-final' // final bir kez kendiliğinden açılır
const seen = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
const markSeen = () => {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* gizli pencere */
  }
}
const tl = (n: number) => (n < 0 ? '−₺' : '₺') + Math.abs(Math.round(n)).toLocaleString('tr-TR')

/** Haritada üst ortada: yedi bölgenin noktası; hepsi dolunca final buradan açılır. */
export function BolgeHedefi({ p }: { p: Palette }) {
  const subeler = useGame((g) => g.s.subeler)
  const iller = subeler.map((b) => b.il)
  const rows = bolgeler(iller)
  const done = rows.filter((r) => r.iller.length).length
  const ready = finalReady(iller)
  const narrow = useNarrow()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (ready && !seen()) setOpen(true)
  }, [ready])
  return (
    <>
      <button
        onClick={() => ready && setOpen(true)}
        title={rows.map((r) => `${r.name}: ${r.iller.join(', ') || '—'}`).join('\n')}
        style={{
          position: 'absolute',
          top: narrow ? 64 : 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 14px',
          borderRadius: 999,
          border: 'none',
          background: p.ui.card,
          color: p.ui.text,
          fontFamily: p.ui.font,
          fontWeight: 700,
          fontSize: 14,
          boxShadow: '0 6px 24px rgba(60,40,20,0.10)',
          cursor: ready ? 'pointer' : 'default',
        }}
      >
        <span>Bölgeler {done}/7</span>
        <span style={{ display: 'flex', gap: 4 }}>
          {rows.map((r) => (
            <span key={r.id} style={{ width: 9, height: 9, borderRadius: 9, background: r.iller.length ? p.accent : p.groundSide }} />
          ))}
        </span>
        {ready && <span style={{ color: p.accent }}>· Hikâye</span>}
      </button>
      {open && (
        <Final
          p={p}
          onClose={() => {
            markSeen()
            setOpen(false)
          }}
        />
      )}
    </>
  )
}

export function Final({ p, onClose }: { p: Palette; onClose: () => void }) {
  const s = useGame((g) => g.s)
  const years = useProgress((g) => g.years)
  const terms = useDefter((d) => d.seen.length)
  const stars = useChapter((c) => c.stars)
  const rows = bolgeler(s.subeler.map((b) => b.il))
  const all = [...CHAPTERS, ...OZEL]
  const got = all.reduce((a, c) => a + (stars[c.id] ?? 0), 0)
  const chips: [string, string][] = [
    ['Yıl', String(Math.max(years, s.year))],
    ['Şube', String(s.subeler.length)],
    ['Üye', String(s.members.length)],
    ['Defter', `${terms} terim`],
    ['Yıldız', `${got} / ${all.length * 3}`],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(58,42,28,0.35)', overflow: 'auto', padding: '32px 16px', fontFamily: p.ui.font, color: p.ui.text, zIndex: 20 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', background: p.ui.card, borderRadius: 18, padding: 28, boxShadow: '0 10px 40px rgba(60,40,20,0.18)', overflow: 'hidden' }}>
        <Head color={p.accent} pad={28}>
          <span>KOOPERATİFİN HİKÂYESİ</span>
          <span style={{ opacity: 0.9 }}>yedi bölge</span>
        </Head>
        <div style={{ fontSize: 15, color: p.ui.muted, marginTop: 4 }}>Şehirden köyüne döndün. Bugün kooperatif yedi bölgede.</div>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, marginTop: 10 }}>{tl(E.valueCreated(s))}</div>
        <div style={{ fontSize: 14, color: p.ui.muted }}>üreticilere kattığı değer</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 8, marginTop: 16 }}>
          {chips.map(([k, v]) => (
            <div key={k} style={{ padding: 10, borderRadius: 12, background: p.ui.chip }}>
              <div style={{ fontSize: 12, color: p.ui.muted, fontWeight: 700 }}>{k}</div>
              <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 6, marginTop: 18 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <b>{r.name}</b>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {r.iller.map((il) => (
                  <span key={il} style={{ padding: '3px 9px', borderRadius: 999, background: p.ui.chip, fontWeight: 600 }}>
                    {il}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ marginTop: 22, padding: '11px 18px', borderRadius: 12, border: 'none', background: p.ui.button, color: p.ui.buttonText, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: p.ui.font }}
        >
          Haritayı doldurmaya devam
        </button>
      </div>
    </div>
  )
}
