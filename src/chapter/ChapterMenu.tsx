import { useState, type CSSProperties } from 'react'
import type { Palette } from '../theme/palettes'
import { useNarrow } from '../ui/useNarrow'
import { useChapter } from './engine'
import { CHAPTERS } from './chapters'
import { Stars } from './ChapterHud'
import { plain } from '../defter/Term'
import { bolumu } from '../data/kilit'

/**
 * Aydın'a girince: ekranda tek bir büyük kart (sıradaki bölüm), üstünde numaralı küçük düğmeler.
 * Bölümler sırayla açılır, en sonda serbest yıl. Hepsi birden ekranı kaplamaz.
 */
export function ChapterMenu({ p, onBack, onFree }: { p: Palette; onBack: () => void; onFree: () => void }) {
  const { done, stars, start } = useChapter()
  const narrow = useNarrow()
  const card: CSSProperties = {
    background: p.ui.card,
    color: p.ui.text,
    fontFamily: p.ui.font,
    borderRadius: 18,
    boxShadow: '0 6px 24px rgba(60,40,20,0.12)',
    backdropFilter: 'blur(8px)',
  }
  const open = (id: number) => id === 1 || done.includes(id - 1)
  const allDone = CHAPTERS.every((c) => done.includes(c.id))
  const next = CHAPTERS.find((c) => open(c.id) && !done.includes(c.id))?.id ?? 0 // 0 = serbest yıl
  const [pick, setPick] = useState<number>(next)
  const c = CHAPTERS.find((x) => x.id === pick)
  const can = c ? open(c.id) : allDone

  const dot = (id: number, enabled: boolean, ok: boolean): CSSProperties => ({
    minWidth: 38,
    height: 38,
    padding: id === 0 ? '0 12px' : 0,
    borderRadius: 19,
    border: pick === id ? `2px solid ${p.accent}` : '2px solid transparent',
    background: ok ? p.ui.chip : p.ui.card,
    color: enabled ? p.ui.text : p.ui.muted,
    opacity: enabled ? 1 : 0.55,
    fontFamily: p.ui.font,
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 3px 12px rgba(60,40,20,0.12)',
    whiteSpace: 'nowrap',
  })

  return (
    <>
      <div style={{ position: 'absolute', top: narrow ? 10 : 16, left: narrow ? 10 : 16, display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={{ ...card, border: 'none', padding: '9px 14px', fontSize: 14, cursor: 'pointer' }}>
          ← Türkiye
        </button>
        <div style={{ ...card, padding: '9px 14px', fontSize: 14, fontWeight: 700 }}>Aydın</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: narrow ? 10 : 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '0 10px' }}>
        {/* numaralı küçük düğmeler: bitenler yeşil zeminli, kilitliler soluk */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {CHAPTERS.map((x) => (
            <button key={x.id} onClick={() => setPick(x.id)} aria-label={`Bölüm ${x.id}`} style={dot(x.id, open(x.id), done.includes(x.id))}>
              {x.id}
            </button>
          ))}
          <button onClick={() => setPick(0)} style={dot(0, allDone, false)}>
            Serbest
          </button>
        </div>
        {/* seçili bölüm: tek büyük kart */}
        <div key={pick} style={{ ...card, width: 'min(420px, 100%)', padding: 18, display: 'grid', gap: 6, animation: 'giris 250ms ease-out both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: p.ui.muted }}>
            <span>{c ? `Bölüm ${c.id}` : 'Serbest oyun'}{can ? '' : ' · kilitli'}</span>
            {c && (stars[c.id] ?? 0) > 0 && <Stars n={stars[c.id]} size={14} />}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{c ? plain(c.title) : 'Yaşayan kooperatif'}</div>
          <div style={{ fontSize: 14, color: p.ui.muted }}>{c ? `${c.crop} · ${c.goal}` : 'Ay ay yönet, krizleri atlat, köyü büyüt, yeni iller aç'}</div>
          <button
            disabled={!can}
            onClick={() => (c ? start(c.id) : onFree())}
            style={{ marginTop: 8, justifySelf: 'start', padding: '11px 18px', borderRadius: 10, border: 'none', background: can ? p.ui.button : '#d8cdb9', color: can ? p.ui.buttonText : p.ui.muted, fontWeight: 700, fontSize: 15, cursor: can ? 'pointer' : 'default', fontFamily: p.ui.font }}
          >
            {!can ? (c ? `Önce ${bolumu(c.id - 1)} bitir` : 'Önce beş bölümü bitir') : c && done.includes(c.id) ? 'Tekrar oyna' : 'Oyna ›'}
          </button>
        </div>
      </div>
    </>
  )
}
