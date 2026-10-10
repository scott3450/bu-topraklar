import { useState, type CSSProperties } from 'react'
import type { Palette } from '../theme/palettes'
import { ILLER, FACTS } from '../data/iller'
import { URUNLER } from '../data/urunler'
import { REGION_NAMES } from '../scene/TurkeyMap'
import { sheet, sideSheet, useNarrow } from './useNarrow'
import { UrunSimge } from './UrunSimge'
import { subeDurumu } from '../data/kilit'
import { useGame } from '../sim/store'
import { CHAPTERS, ozelOf } from '../chapter/chapters'
import { useChapter } from '../chapter/engine'
import { Stars } from '../chapter/ChapterHud'
import { useProgress } from '../data/progress'

const RELIEF: Record<string, string> = { o: 'ova', t: 'tepelik', y: 'yayla', d: 'dağlık' }

function card(p: Palette): CSSProperties {
  return { background: p.ui.card, color: p.ui.text, fontFamily: p.ui.font, borderRadius: 18, boxShadow: '0 6px 24px rgba(60,40,20,0.10)', backdropFilter: 'blur(8px)' }
}

/** İl keşfi: arazi, iklim ve başlıca ürünler (kaynaklıysa rakamla). */
export function IlHud({ p, name, region, climate, onBack, done = [] }: { p: Palette; name: string; region: string; climate: string; onBack: () => void; done?: number[] }) {
  const il = ILLER[name]
  const years = useProgress((g) => g.years)
  const game = useGame((g) => g.s)
  const ozel = ozelOf(name)
  const chapterDone = useChapter((c) => c.done)
  const stars = useChapter((c) => c.stars)
  const startChapter = useChapter((c) => c.start)
  const ozelOpen = CHAPTERS.every((c) => chapterDone.includes(c.id))
  const durum = subeDurumu(name, game, years)
  void done
  const narrow = useNarrow()
  const [open, setOpen] = useState(!narrow)
  const [acik, setAcik] = useState<string | null>(null) // açılan ürün satırı
  const chip: CSSProperties = { ...card(p), padding: narrow ? '7px 10px' : '10px 14px', fontSize: narrow ? 13 : 14 }
  return (
    <>
      <div style={{ position: 'absolute', top: narrow ? 10 : 16, left: narrow ? 10 : 16, right: 170, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...chip, border: 'none', cursor: 'pointer' }}>← Türkiye</button>
        <button onClick={() => setOpen(!open)} style={{ ...chip, border: 'none', cursor: 'pointer' }}>
          <b>{name}</b>
          <span style={{ color: p.ui.muted }}> · {REGION_NAMES[region]} · {RELIEF[il.relief]}{il.coast ? ', kıyı' : ''}</span>
        </button>
        <div style={{ ...chip, fontWeight: 700, color: durum.kind === 'sube' || durum.kind === 'merkez' ? p.ui.chipText : durum.kind === 'acilabilir' ? p.ui.warm : p.ui.muted }}>
          {durum.kind === 'merkez'
            ? 'Merkez'
            : durum.kind === 'sube'
              ? '✓ Şube'
              : durum.kind === 'acilabilir'
                ? 'Şube açılabilir'
                : durum.kind === 'yakinda'
                  ? `Yakında · ${durum.aile}`
                  : 'Keşif · komşunda şube yok'}
        </div>
        {ozel && (
          <button
            disabled={!ozelOpen}
            onClick={() => startChapter(ozel.id)}
            title={ozelOpen ? '' : "Önce Aydın'daki beş bölümü bitir"}
            style={{ ...chip, border: 'none', cursor: ozelOpen ? 'pointer' : 'default', background: ozelOpen ? p.ui.warm : p.ui.card, color: ozelOpen ? '#ffffff' : p.ui.muted, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ★ Özel bölüm: {ozel.title}
            {(stars[ozel.id] ?? 0) > 0 && (
              <span style={{ background: '#fff', borderRadius: 999, padding: '1px 6px' }}>
                <Stars n={stars[ozel.id]} size={12} />
              </span>
            )}
          </button>
        )}
      </div>
      {open && (
        <div style={{ ...card(p), ...(sideSheet() ?? { ...sheet(narrow, 320), top: narrow ? undefined : 116, bottom: narrow ? 10 : undefined }), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: p.accent }}>İKLİM</div>
          <div style={{ fontSize: 15, lineHeight: 1.45, fontWeight: 600, color: p.ui.text, marginTop: 4 }}>{climate}</div>
          {/* satırda simge, ad ve tek bilgi; açıklama ve kaynak dokununca (Tercihler: ayrıntı katlanır, okunaklılık) */}
          <div style={{ marginTop: 10 }}>
            {il.products.map((id, i) => {
              const u = URUNLER[id]
              const f = FACTS[name]?.[id]
              const isOpen = acik === id
              return (
                <div key={id} style={{ borderTop: i ? '1px solid rgba(120,95,60,0.14)' : 'none' }}>
                  <button
                    onClick={() => f && setAcik(isOpen ? null : id)}
                    aria-expanded={f ? isOpen : undefined}
                    style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', alignItems: 'center', gap: 12, width: '100%', padding: '10px 0', background: 'none', border: 'none', cursor: f ? 'pointer' : 'default', textAlign: 'left', color: p.ui.text, fontFamily: p.ui.font }}
                  >
                    <span style={{ width: 48, height: 48, borderRadius: 14, background: '#f6efe2', display: 'grid', placeItems: 'center' }}>
                      <UrunSimge id={id} size={38} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{u.name}</span>
                      <span style={{ display: 'block', fontSize: 14, lineHeight: 1.35, marginTop: 3, color: p.ui.text, opacity: 0.82 }}>{f ? f.fact : u.why}</span>
                    </span>
                    <span style={{ fontSize: 16, color: p.ui.muted, visibility: f ? 'visible' : 'hidden', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}>›</span>
                  </button>
                  {isOpen && f && (
                    <div style={{ padding: '0 0 12px 60px', animation: 'giris 200ms ease-out both' }}>
                      <div style={{ fontSize: 14, lineHeight: 1.45, fontWeight: 500, color: p.ui.muted }}>{u.why}</div>
                      <a href={f.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: p.ui.muted }}>
                        Kaynak: {f.source} ↗
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
