import { useEffect, useState } from 'react'
import type { Palette } from '../theme/palettes'
import { useGame } from '../sim/store'
import { CARDS } from '../sim/cards'
import { MONTHS, START_CASH } from '../sim/config'
import { YEAR_UNLOCKS } from '../data/kilit'
import { useProgress } from '../data/progress'
import * as E from '../sim/engine'
import { Head } from './Head'

const tl = (n: number) => (n < 0 ? '−₺' : '₺') + Math.abs(Math.round(n)).toLocaleString('tr-TR')
const short = (n: number) => {
  const a = Math.abs(n)
  const v = a >= 1_000_000 ? (a / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' mn' : Math.round(a / 1000) + ' bin'
  return (n < 0 ? '−' : '') + v
}

// Kasanın 12 aylık seyri: tek seri, sıfır çizgisine oturan çubuklar, üzerine gelince ay ve tutar.
function CashBars({ p, values }: { p: Palette; values: number[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 360
  const H = 120
  const pad = 4
  const max = Math.max(START_CASH, ...values, 1)
  const min = Math.min(0, ...values)
  const y = (v: number) => pad + ((max - v) / (max - min)) * (H - pad * 2)
  const bw = (W - 11 * 2) / 12
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label="Kasanın aylara göre seyri">
        {/* başlangıç kasası kılavuz çizgisi */}
        <line x1={0} x2={W} y1={y(START_CASH)} y2={y(START_CASH)} stroke={p.groundSide} strokeDasharray="3 4" strokeWidth={1} />
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke={p.ui.muted} strokeWidth={1} />
        {values.map((v, i) => {
          const x = i * (bw + 2)
          const top = Math.min(y(v), y(0))
          const h = Math.max(2, Math.abs(y(v) - y(0)))
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x - 1} y={0} width={bw + 2} height={H + 18} fill="transparent" />
              <rect
                x={x}
                y={top}
                width={bw}
                height={h}
                rx={4}
                fill={p.accent}
                opacity={hover === null || hover === i ? 1 : 0.45}
              />
              <text x={x + bw / 2} y={H + 14} textAnchor="middle" fontSize={9} fill={p.ui.muted}>
                {MONTHS[i].slice(0, 3)}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${((hover + 0.5) / 12) * 100}%`,
            top: -8,
            transform: 'translate(-50%, -100%)',
            padding: '4px 8px',
            borderRadius: 6,
            background: p.ui.text,
            color: p.ui.card,
            fontSize: 13,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {MONTHS[hover]} sonu · {tl(values[hover])}
        </div>
      )}
      <div style={{ fontSize: 12, color: p.ui.muted, marginTop: 2 }}>Kesikli çizgi: başlangıç kasası</div>
    </div>
  )
}

export function YearEnd({ p, onMap }: { p: Palette; onMap?: () => void }) {
  const { s, restart, closeReport, nextYear } = useGame()
  const finishYear = useProgress((g) => g.finishYear)
  const unlock = s.over === 'yil-bitti' ? YEAR_UNLOCKS[s.year - 1] : undefined
  useEffect(() => {
    if (s.over === 'yil-bitti') finishYear(s.year)
  }, [s.over, s.year, finishYear])
  const [open, setOpen] = useState<string | null>(null)
  const value = E.valueCreated(s) - s.prevValue
  const parts = E.valueParts(s)
  const learned = [...new Set([...s.cardsSeen, ...s.newCards])].filter((id) => CARDS[id])
  const broke = s.over === 'iflas'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(58,42,28,0.35)',
        overflow: 'auto',
        padding: '32px 16px',
        fontFamily: p.ui.font,
        color: p.ui.text,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          background: p.ui.card,
          borderRadius: 18,
          padding: 28,
          boxShadow: '0 10px 40px rgba(60,40,20,0.18)',
        }}
      >
        <Head color={broke ? p.ui.alert : p.accent} pad={28}>
          {broke ? `${MONTHS[s.lastReport?.month ?? 0].toLocaleUpperCase('tr')} · KOOPERATİF BATTI` : `${s.year}. YILIN SONU`}
        </Head>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>{tl(value)}</div>
          <div style={{ fontSize: 15, color: p.ui.muted }}>kooperatifin üyelere kattığı değer</div>
        </div>
        {broke && (
          <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Kasa eksiye düştü ve ödemeler yapılamadı. Kâğıt üstündeki değer
            {value > 0 ? ' pozitif olsa bile' : ''} nakit bittiği an oyun biter.
          </div>
        )}

        {!broke && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 18 }}>
            {[
              ['Üye', `${s.members.length} / 4`],
              ['En zor ay', s.history.length ? `${MONTHS[s.history.indexOf(Math.min(...s.history))]} · ${short(Math.min(...s.history))}` : '—'],
              ['Güven', `${s.trust} / 100`],
              ['Kasa', short(s.cash)],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: 12, borderRadius: 12, background: p.ui.chip }}>
                <div style={{ fontSize: 12, color: p.ui.muted, fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
        {unlock && (
          <div style={{ marginTop: 18, padding: 18, borderRadius: 18, background: p.accent, color: '#fffaf1', animation: 'giris 500ms ease-out 300ms both' }}>
            <div style={{ fontSize: 12, letterSpacing: 1.2, fontWeight: 800, opacity: 0.85 }}>DAVET GELDİ · KOMŞU OLMASA DA ŞUBE AÇABİLİRSİN</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2 }}>{unlock.il}</div>
            <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 4 }}>{unlock.ders}</div>
            {onMap && (
              <button onClick={onMap} style={{ marginTop: 12, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,250,241,0.7)', background: 'transparent', color: '#fffaf1', fontFamily: p.ui.font, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Haritada gör ›
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 22 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1, color: p.ui.muted, fontWeight: 700, marginBottom: 8 }}>KASA, AY AY</div>
            <CashBars p={p} values={s.history} />
          </div>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1, color: p.ui.muted, fontWeight: 700, marginBottom: 8 }}>DEĞER NEREDEN GELDİ</div>
            {parts.map((x) => (
              <div key={x.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14, padding: '4px 0' }}>
                <span>{x.label}</span>
                <b style={{ whiteSpace: 'nowrap' }}>{short(x.amount)}</b>
              </div>
            ))}
            <div style={{ fontSize: 13, color: p.ui.muted, marginTop: 6 }}>
              Üye: {s.members.length ? s.members.map((m) => E.NAMES[m]).join(', ') : 'yok'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, letterSpacing: 1, color: p.ui.muted, fontWeight: 700, margin: '26px 0 8px' }}>
          BU YIL ÖĞRENDİKLERİN · {learned.length}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {learned.map((id) => {
            const c = CARDS[id]
            const isOpen = open === id
            return (
              <button
                key={id}
                onClick={() => setOpen(isOpen ? null : id)}
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderRadius: 12,
                  border: 'none',
                  background: p.ui.chip,
                  color: p.ui.text,
                  fontFamily: p.ui.font,
                  cursor: 'pointer',
                  gridColumn: isOpen ? '1 / -1' : undefined,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: p.ui.chipText, marginTop: 3 }}>{c.term}</div>
                {isOpen && <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 8 }}>{c.body}</div>}
              </button>
            )
          })}
        </div>

        {s.log.length > 0 && (
          <>
            <div style={{ fontSize: 12, letterSpacing: 1, color: p.ui.muted, fontWeight: 700, margin: '26px 0 8px' }}>
              KARARLARIN
            </div>
            <div style={{ borderLeft: `2px solid ${p.groundSide}`, paddingLeft: 14 }}>
              {s.log.map((l, i) => (
                <div key={i} style={{ fontSize: 14, padding: '3px 0' }}>
                  <span style={{ color: p.ui.muted, display: 'inline-block', width: 64 }}>{MONTHS[l.month]}</span>
                  {l.text}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 26, flexWrap: 'wrap' }}>
          {!broke && (
            <button
              onClick={nextYear}
              style={{ padding: '12px 18px', borderRadius: 10, border: 'none', background: p.ui.button, color: p.ui.buttonText, fontFamily: p.ui.font, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {s.year + 1}. yıla başla ›
            </button>
          )}
          <button
            onClick={restart}
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              border: broke ? 'none' : `1px solid ${p.groundSide}`,
              background: broke ? p.ui.button : 'transparent',
              color: broke ? p.ui.buttonText : p.ui.text,
              fontFamily: p.ui.font,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Yeniden başla
          </button>
          {s.lastReport && (
            <button
              onClick={closeReport}
              style={{
                padding: '12px 18px',
                borderRadius: 10,
                border: `1px solid ${p.groundSide}`,
                background: 'transparent',
                color: p.ui.text,
                fontFamily: p.ui.font,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Vadiye bak
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
