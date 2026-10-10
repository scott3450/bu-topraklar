import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Palette } from '../theme/palettes'
import { useNarrow } from '../ui/useNarrow'
import { capStars, clock, defaults, nextOf, useChapter, type Bar, type ChapterDef, type Icon, type Link, type Params } from './engine'
import { CHAPTERS } from './chapters'
import { plain, rich } from '../defter/Term'
import { Head } from '../ui/Head'
import { useDeclutter } from './declutter'
import { ilYonelme } from '../data/kilit'

function card(p: Palette): CSSProperties {
  return {
    background: p.ui.card,
    color: p.ui.text,
    fontFamily: p.ui.font,
    borderRadius: 18,
    boxShadow: '0 6px 24px rgba(60,40,20,0.12)',
    backdropFilter: 'blur(8px)',
  }
}

/** Karar kartlarının küçük çizimleri. */
export function Glyph({ icon, c }: { icon: Icon; c: string }) {
  const dark = '#3b3530'
  const svg = (children: ReactNode) => (
    <svg width="46" height="30" viewBox="0 0 46 30" aria-hidden>
      {children}
    </svg>
  )
  switch (icon) {
    case 'truck':
    case 'bigtruck':
      return svg(
        <>
          <rect x="2" y={icon === 'bigtruck' ? 3 : 7} width={icon === 'bigtruck' ? 27 : 23} height={icon === 'bigtruck' ? 19 : 15} rx="2" fill={c} opacity="0.55" />
          <path d="M29 10h9l6 6v6H29z" fill={c} />
          <circle cx="10" cy="24" r="4" fill={dark} />
          <circle cx="35" cy="24" r="4" fill={dark} />
        </>,
      )
    case 'bottle':
      return svg([6, 18, 30].map((x) => <path key={x} d={`M${x + 3} 2h4v6l3 4v16h-10V12l3-4z`} fill={c} opacity={x === 18 ? 1 : 0.6} />))
    case 'coins':
      return svg([0, 1, 2, 3].map((i) => <ellipse key={i} cx={16 + (i % 2) * 12} cy={24 - i * 5} rx="9" ry="3.5" fill={c} opacity={0.6 + i * 0.1} />))
    case 'loan':
      return svg(
        <>
          <path d="M4 12 23 3l19 9z" fill={c} />
          {[9, 18, 27, 36].map((x) => <rect key={x} x={x} y="13" width="4" height="10" fill={c} opacity="0.6" />)}
          <rect x="4" y="24" width="38" height="3" fill={c} />
        </>,
      )
    case 'sack':
      return svg(<path d="M17 4h12l-2 4c7 3 10 9 10 14 0 4-4 6-14 6S9 26 9 22c0-5 3-11 10-14z" fill={c} />)
    case 'jar':
    case 'lab':
      return svg(
        <>
          <rect x="12" y="4" width="22" height="5" rx="1" fill={c} />
          <rect x="10" y="9" width="26" height="19" rx="4" fill={c} opacity="0.6" />
          {icon === 'lab' && <path d="m17 18 4 4 8-9" stroke="#fffaf1" strokeWidth="3" fill="none" />}
        </>,
      )
    case 'hal':
      return svg(
        <>
          <rect x="4" y="4" width="38" height="16" rx="2" fill={c} />
          <path d="m9 15 7-5 6 3 7-6 7 8" stroke="#fffaf1" strokeWidth="2.5" fill="none" />
          <rect x="21" y="20" width="4" height="8" fill={c} />
        </>,
      )
    case 'contract':
      return svg(
        <>
          <rect x="11" y="2" width="24" height="26" rx="2" fill={c} opacity="0.6" />
          {[8, 13, 18].map((y) => <rect key={y} x="15" y={y} width="16" height="2" fill="#fffaf1" />)}
          <path d="M16 24c3-3 5 2 8-1s3 1 6-1" stroke={c} strokeWidth="2" fill="none" />
        </>,
      )
  }
}

/** Rakamı sıfırdan sayarak gösterir ("₺782.496", "2,73 ₺", "₺193.800 eksik"). */
function CountUp({ text }: { text: string }) {
  const m = text.match(/^(.*?)([\d.]+(?:,\d+)?)(.*)$/)
  const target = m ? parseFloat(m[2].replace(/\./g, '').replace(',', '.')) : 0
  const decimals = m && m[2].includes(',') ? m[2].split(',')[1].length : 0
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!m) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1100)
      setV(target * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text])
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]}
      {v.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {m[3]}
    </>
  )
}

function ShareBar({ p, b }: { p: Palette; b: Bar }) {
  const full = Math.max(0, Math.min(100, (b.value / b.max) * 100))
  const [w, setW] = useState(0)
  useEffect(() => {
    const id = setTimeout(() => setW(full), 120)
    return () => clearTimeout(id)
  }, [full])
  const val = b.unit === '₺' ? (b.value < 0 ? '−₺' : '₺') + Math.abs(Math.round(b.value)).toLocaleString('tr-TR') : `${b.value.toLocaleString('tr-TR', { minimumFractionDigits: b.value < 100 ? 2 : 0, maximumFractionDigits: b.value < 100 ? 2 : 0 })} ${b.unit}`
  return (
    <div style={{ opacity: b.on ? 1 : 0.55 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
        <span>{b.label}</span>
        <b style={{ color: b.value < 0 ? '#e5533d' : undefined }}>{val}</b>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: '#e6dccb', overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', borderRadius: 7, background: b.value < 0 ? '#e5533d' : p.accent, transition: 'width 900ms cubic-bezier(.2,.8,.2,1)' }} />
      </div>
    </div>
  )
}

const btn = (p: Palette, primary: boolean): CSSProperties => ({
  padding: '11px 16px',
  borderRadius: 10,
  border: primary ? 'none' : `1px solid ${p.groundSide}`,
  background: primary ? p.ui.button : 'transparent',
  color: primary ? p.ui.buttonText : p.ui.text,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: p.ui.font,
})

/** Kampanya bitti: beş ders, tek bakışta. */
function Summary({ p, onClose }: { p: Palette; onClose: () => void }) {
  const stars = useChapter((c) => c.stars)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,42,28,0.45)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 1000 }}>
      <div style={{ ...card(p), width: 'min(520px, 100%)', padding: 24, animation: 'giris 300ms ease-out both' }}>
        <Head color={p.accent} pad={24}>AYDIN · KAMPANYA BİTTİ</Head>
        <div style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 14px' }}>Kooperatif ayakta</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {CHAPTERS.map((c) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 10, alignItems: 'center' }}>
              <Glyph icon={c.icon} c={p.accent} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{plain(c.title)}</div>
                <div style={{ fontSize: 14, color: p.ui.muted }}>{rich(c.lesson)}</div>
              </div>
              <Stars n={stars[c.id] ?? 0} size={14} />
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ ...btn(p, true), marginTop: 18 }}>
          Bölümlere dön
        </button>
      </div>
    </div>
  )
}

export function Stars({ n, size = 22 }: { n: number; size?: number }) {
  return (
    <span aria-label={`${n} yıldız`} style={{ fontSize: size, letterSpacing: 2, lineHeight: 1, whiteSpace: 'nowrap' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ color: i < n ? '#f0a21b' : '#d8cdb9' }}>★</span>
      ))}
    </span>
  )
}

/** Neden-sonuç zinciri: halkalar sırayla belirir. */
function Chain({ p, links }: { p: Palette; links: Link[] }) {
  return (
    <div style={{ display: 'grid', gap: 4, marginTop: 12, padding: '10px 12px', borderRadius: 12, background: '#f6f3ec' }}>
      {links.map((l, i) => (
        <div key={l.label} style={{ display: 'grid', gridTemplateColumns: '16px 1fr auto', gap: 8, alignItems: 'baseline', fontSize: 13, animation: `giris 300ms ease-out ${300 + i * 450}ms both` }}>
          <b style={{ color: l.ok === undefined ? p.ui.muted : l.ok ? p.ui.chipText : '#e5533d', textAlign: 'center' }}>{i === 0 ? '●' : '↓'}</b>
          <span>{rich(l.label)}</span>
          <b style={{ whiteSpace: 'nowrap', color: l.ok === false ? '#e5533d' : p.ui.text }}>{l.value}</b>
        </div>
      ))}
    </div>
  )
}

/** Karar anı: kaydırıcılar, canlı sınır göstergeleri, tek düğme. */
function DecisionPanel({ p, def, narrow }: { p: Palette; def: ChapterDef; narrow: boolean }) {
  const d = def.decision
  const last = useChapter((c) => c.params)
  const decide = useChapter((c) => c.decide)
  const tries = useChapter((c) => c.tries)
  const [v, setV] = useState<Params>(() => ({ ...defaults(d), ...last }))
  const [asking, setAsking] = useState(false)
  const meters = d.meters(v)
  const go = (extra: Params) => decide({ ...v, ...extra, ...d.roll?.() }, d.next(v), clock.now)
  const box = useRef<HTMLDivElement>(null)
  useDeclutter(box, -1) // sahnedeki etiketler kartın üstüne binmesin
  if (asking && d.predict)
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: narrow ? 10 : 24, display: 'flex', justifyContent: 'center', padding: '0 10px' }}>
        <div ref={box} style={{ ...card(p), width: 'min(440px, 100%)', padding: narrow ? 16 : 20, display: 'grid', gap: 14, animation: 'giris 300ms ease-out both' }}>
          <Head color={p.ui.warm} pad={narrow ? 16 : 20}>TAHMİN ET</Head>
          <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>{rich(d.predict.question)}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => go({ tahmin: 1 })} style={{ ...btn(p, true), flex: 1 }}>Evet</button>
            <button onClick={() => go({ tahmin: 0 })} style={{ ...btn(p, true), flex: 1 }}>Hayır</button>
          </div>
          <button onClick={() => setAsking(false)} style={{ ...btn(p, false), border: 'none', padding: 0, justifySelf: 'start', color: p.ui.muted, fontWeight: 600 }}>‹ Kararı değiştir</button>
        </div>
      </div>
    )
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: narrow ? 10 : 24, display: 'flex', justifyContent: 'center', padding: '0 10px' }}>
      <div ref={box} style={{ ...card(p), width: 'min(440px, 100%)', padding: narrow ? 16 : 20, display: 'grid', gap: 14, animation: 'giris 300ms ease-out both' }}>
        <Head color={p.accent} pad={narrow ? 16 : 20}>
          <span>KARAR</span>
          <span style={{ opacity: 0.85 }}>{def.month.choose ?? ''}</span>
        </Head>
        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{rich(d.question)}</div>
        {d.controls.map((c) =>
          c.toggle ? (
            <button
              key={c.id}
              role="switch"
              aria-checked={!!v[c.id]}
              onClick={() => setV({ ...v, [c.id]: v[c.id] ? 0 : 1 })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: p.ui.text, fontFamily: p.ui.font, fontSize: 14, textAlign: 'left' }}
            >
              <span>{plain(c.label)}</span>
              <span style={{ width: 42, height: 24, borderRadius: 12, background: v[c.id] ? p.accent : '#d8cdb9', position: 'relative', flexShrink: 0, transition: 'background 150ms' }}>
                <span style={{ position: 'absolute', top: 3, left: v[c.id] ? 21 : 3, width: 18, height: 18, borderRadius: 9, background: '#fffaf1', transition: 'left 150ms' }} />
              </span>
            </button>
          ) : (
            <label key={c.id} style={{ display: 'grid', gap: 6, fontSize: 14 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{rich(c.label)}</span>
                <b>{c.format(v[c.id])}</b>
              </span>
              <input
                type="range"
                min={c.min}
                max={c.max}
                step={c.step}
                value={v[c.id]}
                onChange={(e) => setV({ ...v, [c.id]: Number(e.target.value) })}
                style={{ width: '100%', accentColor: p.accent, height: 28, cursor: 'pointer' }}
              />
            </label>
          ),
        )}
        <div style={{ display: 'grid', gap: 6 }}>
          {meters.map((m) => (
            <div key={m.label} style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 8, alignItems: 'baseline', fontSize: 14 }}>
              <b style={{ color: m.ok === undefined ? p.ui.muted : m.ok ? p.ui.chipText : '#e5533d' }}>{m.ok === undefined ? '•' : m.ok ? '✓' : '✗'}</b>
              <span style={{ color: p.ui.muted }}>{rich(m.label)}</span>
              <b style={{ color: m.ok === false ? '#e5533d' : p.ui.text, whiteSpace: 'nowrap' }}>{m.text}</b>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button onClick={() => (d.predict ? setAsking(true) : go({}))} style={btn(p, true)}>
            Kararı ver
          </button>
          {tries > 1 && <span style={{ fontSize: 13, color: p.ui.muted }}>{tries}. deneme · en fazla <Stars n={capStars(3, tries)} size={13} /></span>}
        </div>
      </div>
    </div>
  )
}

export function ChapterHud({ p, def, onMenu }: { p: Palette; def: ChapterDef; onMenu: () => void }) {
  const [summary, setSummary] = useState(false)
  const { step, path, params, go, retry, restart, complete, start } = useChapter()
  const narrow = useNarrow()
  const chip: CSSProperties = { ...card(p), padding: narrow ? '7px 10px' : '9px 14px', fontSize: narrow ? 13 : 14 }
  const next = nextOf(def, step, path, params)
  const tries = useChapter((c) => c.tries)
  const raw = step === 'result' && path ? def.result(path, params) : null
  const res = raw && { ...raw, stars: capStars(raw.stars ?? 0, tries), good: capStars(raw.stars ?? 0, tries) >= 2 }
  const capped = !!raw && (raw.stars ?? 0) > (res?.stars ?? 0)
  const resBox = useRef<HTMLDivElement>(null)
  useDeclutter(resBox, -1)
  const guess = res && def.decision.predict && params.tahmin !== undefined ? (params.tahmin > 0) === def.decision.predict.answer(params) : null
  const nextChapter = def.il ? undefined : CHAPTERS.find((c) => c.id === def.id + 1)

  useEffect(() => {
    if (res) complete(def.id, res.stars ?? 0)
  }, [res?.stars, def.id, complete])

  return (
    <>
      <div style={{ position: 'absolute', top: narrow ? 10 : 16, left: narrow ? 10 : 16, right: 170, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onMenu} style={{ ...chip, border: 'none', cursor: 'pointer' }}>
          ← {def.il ?? 'Bölümler'}
        </button>
        <div style={chip}>
          <span style={{ color: p.ui.muted }}>{def.il ? `${def.il} · özel bölüm` : `Bölüm ${def.id}`} · </span>
          <b>{rich(def.title)}</b>
        </div>
        <div style={chip}>
          <span style={{ color: p.accent, fontWeight: 800 }}>◎ </span>
          {def.goal}
        </div>
        <div style={{ ...chip, fontWeight: 700 }}>{def.month[step] ?? ''}</div>
      </div>

      {next && (
        <button
          onClick={() => go(next, clock.now)}
          style={{ ...chip, position: 'absolute', right: narrow ? 10 : 16, bottom: narrow ? 10 : 16, border: 'none', cursor: 'pointer', color: p.ui.muted }}
        >
          Atla ›
        </button>
      )}

      {step === 'choose' && <DecisionPanel key={def.id} p={p} def={def} narrow={narrow} />}

      {res && !summary && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: narrow ? 10 : 24, display: 'flex', justifyContent: 'center', padding: '0 10px' }}>
          <div ref={resBox} style={{ ...card(p), width: 'min(430px, 100%)', maxHeight: '72vh', overflowY: 'auto', overflowX: 'hidden', padding: 20, animation: 'giris 300ms ease-out both' }}>
            <Head color={res.good ? p.ui.good : p.ui.alert} pad={20}>
              <span>{res.good ? 'SONUÇ' : 'OLMADI'}</span>
              <span style={{ background: '#ffffff', borderRadius: 999, padding: '2px 8px', lineHeight: 1 }}>
                <Stars n={res.stars ?? 0} size={16} />
              </span>
            </Head>
            {/* üst: büyük rakam ve küçük açıklaması; tahmin sonucu yanda rozet */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.05, color: res.good ? p.ui.text : p.ui.alert }}>
                  <CountUp text={res.value} />
                </div>
                <div style={{ fontSize: 13, color: p.ui.muted, marginTop: 2 }}>{res.caption}</div>
              </div>
              {guess !== null && (
                <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 999, background: guess ? '#e7f3ea' : '#fbe7e3', color: guess ? p.ui.good : p.ui.alert }}>
                  {guess ? 'Tahmin ✓' : 'Tahmin ✗'}
                </span>
              )}
            </div>
            <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.35, color: res.good ? p.ui.text : p.ui.alert }}>{rich(res.compare)}</div>
            {res.chain && <Chain p={p} links={res.chain} />}
            {/* karşılaştırma çubukları ve notlar: isteyen açar */}
            {res.bars.length > 0 && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: p.ui.muted }}>Karşılaştır</summary>
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                  {res.bars.map((b) => (
                    <ShareBar key={b.label} p={p} b={b} />
                  ))}
                  {res.barsNote && <div style={{ fontSize: 13, color: p.ui.muted }}>{rich(res.barsNote)}</div>}
                </div>
              </details>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {res.good && res.lesson && (
                <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 999, background: p.ui.chip }}>
                  Bunun adı: <b>{rich(res.lesson)}</b>
                </span>
              )}
              {capped && <span style={{ fontSize: 12, color: p.ui.muted, alignSelf: 'center' }}>{tries}. deneme: en fazla {res.stars} yıldız</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {!res.good ? (
                <>
                  <button onClick={() => retry(clock.now)} style={btn(p, true)}>Kararı değiştir</button>
                  <button onClick={onMenu} style={btn(p, false)}>Bölümler</button>
                </>
              ) : (
                <>
                  {nextChapter ? (
                    <button onClick={() => start(nextChapter.id)} style={btn(p, true)}>Sonraki bölüm ›</button>
                  ) : (
                    def.il ? (
                      <button onClick={onMenu} style={btn(p, true)}>{ilYonelme(def.il)} dön ›</button>
                    ) : (
                      <button onClick={() => setSummary(true)} style={btn(p, true)}>Kampanya özeti</button>
                    )
                  )}
                  {(res.stars ?? 0) < 3 && <button onClick={() => retry(clock.now)} style={btn(p, false)}>Kararı değiştir</button>}
                  <button onClick={restart} style={btn(p, false)}>Baştan izle</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {summary && <Summary p={p} onClose={() => (setSummary(false), onMenu())} />}
    </>
  )
}
