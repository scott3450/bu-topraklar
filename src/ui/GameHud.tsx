import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { SINEMATIK, Sinematik } from './Sinematik'
import { useSettings } from '../fx/settings'
import { sheet, useNarrow } from './useNarrow'
import type { Palette } from '../theme/palettes'
import { useGame, projectedCash } from '../sim/store'
import { CARDS } from '../sim/cards'
import { INVEST, LOAN_RATE, LOAN_STEP, MONTHS, type InvestId } from '../sim/config'
import * as E from '../sim/engine'
import { view } from '../sim/events'
import { goals, incoming, tip } from '../sim/tips'
import { TERIMLER } from '../defter/terimler'
import { rich } from '../defter/Term'
import { Head } from './Head'
import { SEASON_NAMES, seasonOf } from '../theme/season'

const tl = (n: number) => (n < 0 ? '−₺' : '₺') + Math.abs(Math.round(n)).toLocaleString('tr-TR')

function card(p: Palette): CSSProperties {
  return {
    background: p.ui.card,
    color: p.ui.text,
    fontFamily: p.ui.font,
    borderRadius: 18,
    boxShadow: '0 6px 24px rgba(60,40,20,0.10)',
    backdropFilter: 'blur(8px)',
  }
}

function Btn({
  p,
  children,
  onClick,
  primary,
  disabled,
  active,
}: {
  p: Palette
  children: ReactNode
  onClick: () => void
  primary?: boolean
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '9px 12px',
        borderRadius: 10,
        border: primary || active ? 'none' : `1px solid ${p.groundSide}`,
        background: primary ? p.ui.button : active ? p.ui.chip : 'transparent',
        color: primary ? p.ui.buttonText : active ? p.ui.chipText : p.ui.text,
        fontFamily: p.ui.font,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        textAlign: 'left',
      }}
    >
      {children}
    </button>
  )
}

const Label = ({ p, children }: { p: Palette; children: ReactNode }) => (
  <div style={{ fontSize: 12, letterSpacing: 1, color: p.ui.muted, fontWeight: 700, margin: '14px 0 6px' }}>
    {children}
  </div>
)

// ── Üst çubuk ───────────────────────────────────────────────

export function GameBar({ p, onBack }: { p: Palette; onBack: () => void }) {
  const s = useGame((g) => g.s)
  const narrow = useNarrow()
  const chip: CSSProperties = { ...card(p), padding: narrow ? '7px 10px' : '10px 14px', fontSize: narrow ? 13 : 14 }
  return (
    <div style={{ position: 'absolute', top: narrow ? 10 : 16, left: narrow ? 10 : 16, right: 170, display: 'flex', gap: narrow ? 6 : 10, flexWrap: 'wrap' }}>
      {!narrow && <div style={{ ...chip, fontWeight: 700, fontSize: 17 }}>Bu Topraklar</div>}
      <button onClick={onBack} style={{ ...chip, border: 'none', cursor: 'pointer' }}>
        ← Türkiye
      </button>
      <div style={chip}>
        <b>{MONTHS[Math.min(s.month, 11)]}</b>
        {!narrow && <span style={{ color: p.ui.muted }}> · {SEASON_NAMES[seasonOf(Math.min(s.month, 11))]} · {s.year}. yıl</span>}
      </div>
      <div style={chip}>
        <span style={{ color: p.ui.muted }}>Kasa </span>
        <b style={{ color: s.cash < 0 ? p.ui.alert : p.ui.text }}>{tl(s.cash)}</b>
      </div>
      {incoming(s).net > 0 && (
        <div style={chip} title="Satıldı ama parası henüz gelmedi (üyelere kalan ödemeler düşülmüş)">
          <span style={{ color: p.ui.muted }}>Yolda </span>
          <b style={{ color: p.ui.good }}>+{tl(incoming(s).net)}</b>
          <span style={{ color: p.ui.muted }}> · {incoming(s).next}</span>
        </div>
      )}
      {s.debt > 0 && (
        <div style={chip}>
          <span style={{ color: p.ui.muted }}>Borç </span>
          <b>{tl(s.debt)}</b>
        </div>
      )}
      <div style={chip}>
        <span style={{ color: p.ui.muted }}>Üye </span>
        <b>{s.members.length}</b>
        <span style={{ color: p.ui.muted }}> / 4</span>
      </div>
      {s.members.length > 0 && (
        <div style={{ ...chip, display: 'flex', alignItems: 'center', gap: 8 }} title="Üyelerin kooperatife güveni; 35'in altında üye ayrılır">
          <span style={{ color: p.ui.muted }}>Güven</span>
          <span style={{ width: 56, height: 8, borderRadius: 4, background: '#e6dccb', overflow: 'hidden' }}>
            <span style={{ display: 'block', width: `${s.trust}%`, height: '100%', background: s.trust < 35 ? p.ui.alert : p.ui.good, transition: 'width 600ms' }} />
          </span>
          <b>{s.trust}</b>
        </div>
      )}
    </div>
  )
}

// ── Üretici kartı ───────────────────────────────────────────

const INFO: Record<E.ProducerId, { tag: string; name: string; sub: string; rows: [string, string][] }> = {
  ayse: {
    tag: 'ZEYTİN · AYDIN',
    name: 'Ayşe Teyze',
    sub: '40 dönüm zeytinlik',
    rows: [
      ['Hasat', 'Kasım–Ocak'],
      ['Tüccara yağ', 'kilo 275 TL'],
      ['Market rafında', 'litre 810–900 TL'],
    ],
  },
  mehmet: {
    tag: 'ÇAM BALI · MUĞLA',
    name: 'Mehmet Amca',
    sub: '120 kovan',
    rows: [
      ['Hasat', 'Eylül–Kasım'],
      ['Tüccar', 'teneke 4.300–4.500 TL'],
      ['Analizli', 'teneke 5.300 TL'],
    ],
  },
  fatma: {
    tag: 'SÜT · TİRE',
    name: 'Fatma Abla',
    sub: '15 inek',
    rows: [
      ['Aylık süt', '~4.000 litre'],
      ['Fiyat (USK)', 'litre 24,30 TL'],
      ['Maliyet', 'litre ~23,40 TL'],
    ],
  },
  hasan: {
    tag: 'DOMATES · MANİSA',
    name: 'Hasan Dayı',
    sub: '30 dönüm salçalık',
    rows: [
      ['Hasat', 'Temmuz–Eylül'],
      ['Hal', 'kilo 10–15 TL'],
      ['Fabrika', 'kilo 3,5–5 TL'],
    ],
  },
}

export function ProducerPanel({ p, id, onClose }: { p: Palette; id: E.ProducerId; onClose: () => void }) {
  const { s, reply, invite, act } = useGame()
  const info = INFO[id]
  const member = s.members.includes(id)
  const narrow = useNarrow()
  return (
    <div style={{ ...card(p), ...sheet(narrow, 300), padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, letterSpacing: 1, color: p.accent, fontWeight: 700 }}>{info.tag}</div>
        <button
          onClick={onClose}
          aria-label="Kapat"
          style={{ border: 'none', background: 'none', fontSize: 18, color: p.ui.muted, cursor: 'pointer', padding: 0 }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 2px' }}>{info.name}</div>
      <div style={{ fontSize: 14, color: p.ui.muted }}>{info.sub}</div>
      <div style={{ marginTop: 10 }}>
        {info.rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 14 }}>
            <span style={{ color: p.ui.muted }}>{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>

      {!member && (
        <>
          {reply?.id === id && (
            <div
              style={{
                margin: '12px 0 0',
                padding: '10px 12px',
                borderRadius: 10,
                background: p.ui.chip,
                fontSize: 14,
                fontStyle: 'italic',
              }}
            >
              “{reply.text}”
            </div>
          )}
          <div style={{ marginTop: 12, display: 'grid' }}>
            <Btn p={p} primary onClick={() => invite(id)}>
              Kooperatife davet et
            </Btn>
          </div>
        </>
      )}

      {member && id === 'ayse' && (
        <>
          <Label p={p}>YAĞ NEREYE SATILSIN</Label>
          <div style={{ display: 'grid', gap: 6 }}>
            <Btn p={p} active={s.oilChannel === 'tuccar'} onClick={() => act((x) => E.setOilChannel(x, 'tuccar'))}>
              Tüccara · hemen, ucuz
            </Btn>
            <Btn p={p} disabled={!s.invest.dolum} active={s.oilChannel === 'market'} onClick={() => act((x) => E.setOilChannel(x, 'market'))}>
              Markete şişeli · pahalı, 60 gün vade
            </Btn>
            <Btn p={p} disabled={!s.invest.dolum} active={s.oilChannel === 'dogrudan'} onClick={() => act((x) => E.setOilChannel(x, 'dogrudan'))}>
              Doğrudan · en pahalı, ayda 100 kg
            </Btn>
          </div>
        </>
      )}

      {member && id === 'mehmet' && (
        <>
          <Label p={p}>BAL NEREYE SATILSIN</Label>
          <div style={{ display: 'grid', gap: 6 }}>
            <Btn p={p} active={s.honeyChannel === 'tuccar'} onClick={() => act((x) => E.setHoneyChannel(x, 'tuccar'))}>
              Tüccara
            </Btn>
            <Btn p={p} disabled={!s.invest.analiz} active={s.honeyChannel === 'kooperatif'} onClick={() => act((x) => E.setHoneyChannel(x, 'kooperatif'))}>
              Analizli toplu satış
            </Btn>
            <Btn p={p} active={s.honeyChannel === 'dogrudan'} onClick={() => act((x) => E.setHoneyChannel(x, 'dogrudan'))}>
              Doğrudan · ayda 40 kg
            </Btn>
          </div>
        </>
      )}

      {member && (id === 'fatma' || id === 'hasan') && (
        <div style={{ marginTop: 12, fontSize: 14, color: p.ui.chipText }}>Üye</div>
      )}
    </div>
  )
}

// ── Kooperatif paneli ───────────────────────────────────────

export function CoopPanel({ p }: { p: Palette }) {
  const { s, act } = useGame()
  const narrow = useNarrow()
  const [open, setOpen] = useState(false)
  if (narrow && !open)
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ ...card(p), position: 'absolute', left: 10, bottom: 10, height: 64, width: 104, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
      >
        Kooperatif ▴
      </button>
    )
  return (
    <div
      style={{
        ...card(p),
        ...(narrow ? sheet(true) : { position: 'absolute', left: 16, bottom: 16, width: 270 }),
        padding: '4px 16px 16px',
      }}
    >
      {narrow && (
        <button
          onClick={() => setOpen(false)}
          aria-label="Kapat"
          style={{ float: 'right', marginTop: 10, border: 'none', background: 'none', fontSize: 18, color: p.ui.muted, cursor: 'pointer' }}
        >
          ×
        </button>
      )}
      <Label p={p}>YATIRIM</Label>
      <div style={{ display: 'grid', gap: 6 }}>
        {(Object.keys(INVEST) as InvestId[]).map((k) => (
          <Btn p={p} key={k} active={s.invest[k]} disabled={s.invest[k]} onClick={() => act((x) => E.buy(x, k))}>
            {INVEST[k].name}
            <span style={{ float: 'right', fontWeight: 400 }}>
              {s.invest[k] ? 'var' : tl(INVEST[k].cost * s.costIdx)}
            </span>
          </Btn>
        ))}
        <Btn p={p} active={s.bulkFeed} onClick={() => act((x) => E.setBulkFeed(x, !s.bulkFeed))}>
          Ortak yem alımı
          <span style={{ float: 'right', fontWeight: 400 }}>{s.bulkFeed ? 'açık' : 'kapalı'}</span>
        </Btn>
        {E.canSignContract(s) && (
          <Btn p={p} primary onClick={() => act(E.signContract)}>
            Fabrikayla domates sözleşmesi
          </Btn>
        )}
      </div>
      <Label p={p}>KREDİ · aylık %{(LOAN_RATE * 100).toLocaleString('tr-TR')}</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <Btn p={p} onClick={() => act(E.borrow)}>+ {tl(LOAN_STEP)}</Btn>
        <Btn p={p} disabled={s.debt <= 0 || s.cash < Math.min(LOAN_STEP, s.debt)} onClick={() => act(E.repay)}>
          Öde
        </Btn>
      </div>
    </div>
  )
}

// ── Ayı bitir ───────────────────────────────────────────────

export function EndMonthBar({ p }: { p: Palette }) {
  const { s, endMonth, openReport, passing } = useGame()
  const narrow = useNarrow()
  const place: CSSProperties = narrow
    ? { position: 'absolute', left: 122, right: 10, bottom: 10, padding: 10 }
    : { position: 'absolute', right: 16, bottom: 16, padding: 14, width: 240 }
  if (s.over)
    return (
      <div style={{ ...card(p), ...place, display: 'grid' }}>
        <Btn p={p} primary onClick={openReport}>
          {s.over === 'iflas' ? 'Neler oldu?' : 'Yıl sonu raporu'}
        </Btn>
      </div>
    )
  const next = projectedCash(s)
  const g = goals(s)
  return (
    <div style={{ ...card(p), ...place, width: narrow ? undefined : 280 }}>
      {!narrow && (
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, color: p.ui.muted, marginBottom: 6 }}>
            {s.year}. YILIN HEDEFLERİ · {g.filter((x) => x.done).length}/3
          </div>
          <div style={{ display: 'grid', gap: 3, fontSize: 13, marginBottom: 10 }}>
            {g.map((x) => (
              <div key={x.label} style={{ color: x.done ? p.ui.good : p.ui.text }}>
                {x.done ? '✓' : '○'} {x.label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.4, padding: '8px 10px', borderRadius: 10, background: p.ui.chip, marginBottom: 10 }}>
            <b>Emine:</b> {tip(s)}
          </div>
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: narrow ? 6 : 10 }}>
        <span style={{ color: p.ui.muted }}>Ay sonu kasa</span>
        <b style={{ color: next < 0 ? p.ui.alert : p.ui.text }}>{tl(next)}</b>
      </div>
      <div style={{ display: 'grid' }}>
        <Btn p={p} primary disabled={passing} onClick={endMonth}>
          {passing ? `${MONTHS[Math.max(0, s.month - 1)]} geçiyor…` : `${MONTHS[s.month]} ayını bitir →`}
        </Btn>
      </div>
    </div>
  )
}

// ── Ay sonu raporu ve kartlar ───────────────────────────────

/** Ayın tek satırı: kâr ile kasa ayrı şeylerdir; farkı söyler. */
function MonthSummary({ p, r }: { p: Palette; r: NonNullable<E.State['lastReport']> }) {
  const profit = r.profit ?? 0
  const cash = r.cashDelta ?? 0
  const gap = Math.abs(profit - cash) > 15_000
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['Bu ay kâr', profit],
          ['Kasa', cash],
        ].map(([k, v]) => (
          <div key={k as string} style={{ padding: '10px 12px', borderRadius: 12, background: p.ui.chip }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: p.ui.muted }}>{k}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: (v as number) < 0 ? p.ui.alert : p.ui.good }}>
              {(v as number) > 0 ? '+' : ''}
              {tl(v as number)}
            </div>
          </div>
        ))}
      </div>
      {gap && (
        <div style={{ fontSize: 13, lineHeight: 1.4, color: p.ui.muted }}>
          {cash < profit
            ? 'Kâr kasadan fazla: satışın parası henüz gelmedi ya da avans çıktı. Para yolda.'
            : 'Kasa kârdan fazla: daha önce yapılan satışların parası bu ay geldi.'}
        </div>
      )}
      {(r.fee ?? 0) > 0 && <div style={{ fontSize: 13, color: p.ui.muted }}>Hizmet payı ve toplu satış primi: <b style={{ color: p.ui.good }}>+{tl(r.fee ?? 0)}</b></div>}
    </div>
  )
}

export function ReportModal({ p }: { p: Palette }) {
  const { s, closeReport, choose } = useGame()
  const r = s.lastReport
  const ev = s.events[0] ? view(s, s.events[0]) : null
  const cards = s.newCards.map((id) => CARDS[id]).filter(Boolean)
  // sonuç kartından önce kısa görüntü (bir kez); sakin harekette yok
  const calm = useSettings((st) => st.calm)
  const evKey = ev ? `${ev.id}-${s.events.length}-${s.month}` : ''
  const [played, setPlayed] = useState('')
  const tur = ev ? SINEMATIK[ev.id] : undefined
  const playing = !!tur && !calm && played !== evKey
  const endFilm = useCallback(() => setPlayed(evKey), [evKey])
  if (playing && ev && tur)
    return <Sinematik tur={tur} hit={(s.events[0].amount ?? 0) > 0} title={ev.title} il={s.events[0].il} onDone={endFilm} />
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(58,42,28,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{ ...card(p), width: 'min(440px, 100%)', maxHeight: '85vh', overflowY: 'auto', overflowX: 'hidden', padding: 22 }}>
        {r && (
          <>
            <Head color={p.accent} pad={22}>{MONTHS[r.month].toLocaleUpperCase('tr')} SONU</Head>
            <MonthSummary p={p} r={r} />
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: p.ui.muted, fontWeight: 700 }}>Ayrıntı · {r.lines.length} kalem</summary>
            <div style={{ marginTop: 8 }}>
              {r.lines.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', fontSize: 14 }}>
                  <span>{l.label}</span>
                  <b style={{ color: l.amount < 0 ? p.accent : p.ui.chipText, whiteSpace: 'nowrap' }}>
                    {l.amount > 0 ? '+' : ''}
                    {tl(l.amount)}
                  </b>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${p.groundSide}`, marginTop: 6, paddingTop: 8, fontSize: 14 }}>
                <span style={{ color: p.ui.muted }}>Kasa</span>
                <b>{tl(s.cash)}</b>
              </div>
            </div>
            </details>
            <div>
              {r.notes.map((n, i) => (
                <div key={i} style={{ fontSize: 14, color: p.ui.muted, marginTop: 6 }}>
                  {n}
                </div>
              ))}
            </div>
          </>
        )}
        {cards.map((c) => (
          <div key={c.title} style={{ marginTop: 16, padding: 14, borderRadius: 12, background: p.ui.chip }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{c.title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6 }}>{c.body}</div>
            <div style={{ fontSize: 13, color: p.ui.chipText, marginTop: 8 }}>Gerçek hayatta: {c.term}</div>
          </div>
        ))}
        {ev && (
          <div key={`${ev.id}-${s.events.length}`} style={{ marginTop: 16, padding: 16, borderRadius: 16, background: '#ffffff', boxShadow: '0 4px 16px rgba(50,35,20,0.12)', overflow: 'hidden', animation: 'giris 300ms ease-out both' }}>
            <Head color={ev.id === 'kriz' || ev.id === 'guven' ? p.ui.alert : ev.id === 'don' || ev.id === 'don-sonuc' ? '#3f7fb5' : p.ui.warm} pad={16} radius={16}>
              <span>{ev.who.toLocaleUpperCase('tr')}</span>
              {s.events.length > 1 && <span style={{ opacity: 0.85 }}>+{s.events.length - 1} kart</span>}
            </Head>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{ev.title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 6 }}>{ev.text}</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {ev.options.map((o, i) => (
                <button
                  key={o.label}
                  onClick={() => choose(0, i)}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: `1px solid ${p.groundSide}`, background: p.ui.card, cursor: 'pointer', fontFamily: p.ui.font, color: p.ui.text }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{o.label}</div>
                  {o.detail && <div style={{ fontSize: 13, color: p.ui.muted, marginTop: 2 }}>{o.detail}</div>}
                </button>
              ))}
            </div>
            {ev.term && TERIMLER[ev.term] && <div style={{ fontSize: 13, color: p.ui.muted, marginTop: 10 }}>Defter: {rich(`[[${ev.term}|${TERIMLER[ev.term].name}]]`)}</div>}
          </div>
        )}
        <div style={{ display: 'grid', marginTop: 18 }}>
          <Btn p={p} primary disabled={!!ev} onClick={closeReport}>
            {ev ? 'Önce kartı karara bağla' : 'Devam'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

/** Köyde yeni bir yapı belirince kısa bildirim. */
export function GrowthToast({ p }: { p: Palette }) {
  const s = useGame((g) => g.s)
  const seen = useRef<number[] | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    const now = E.growth(s)
    if (seen.current) {
      const fresh = now.find((id) => !seen.current!.includes(id))
      if (fresh) setMsg(E.GROWTH_NAMES[fresh])
    }
    seen.current = now
  }, [s])
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3200)
    return () => clearTimeout(t)
  }, [msg])
  if (!msg) return null
  return (
    <div style={{ position: 'absolute', top: 76, left: '50%', transform: 'translateX(-50%)', ...card(p), padding: '10px 16px', fontSize: 15, fontWeight: 800, color: p.ui.chipText, animation: 'giris 300ms ease-out both', zIndex: 4, whiteSpace: 'nowrap' }}>
      Köy büyüdü: {msg}
    </div>
  )
}
