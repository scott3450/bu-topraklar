// Bölüm 1 — Aracı farkı (zeytin). Rakamlar config'ten; ayrıntı vault: Bolum-1.md
import { OLIVE } from '../sim/config'
import { Bidons, BottleCrates, Bubble, CoinFlight, Crates, Depot, FallingOlives, FloatMoney, Person, PriceTag, Truck, Walker } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type SceneProps } from './engine'
import { FAR, above, at, onRoad } from './road'

export const OIL_KG = Math.round(OLIVE.decares * OLIVE.kgPerDecare * OLIVE.oilYield)
export const COOP_FEE = 0.05 // 🎲 kooperatif hizmet payı
const TRADER_TOTAL = OIL_KG * OLIVE.traderPrice
export const NEED = 140_000 // 🎲 Ayşe Teyze'nin Aralık'ta ödemesi gereken gübre ve kira borcu
export const MARKET_CAP = 1250 // 🎲 market bu yıl en fazla bu kadar kg alır
const LATE_PRICE = 200 // 🎲 marketin almadığı yağ geç dönemde, pazarlık gücü olmadan ucuza gider
const GAP_COST = 0.4 // 🎲 eksik nakdi Ayşe Teyze tüccardan ön ödemeyle kapatır: pahalı borç (köyde yaygın)

/** Kararın sonucu: m = markete giden pay (0–1). */
export function ch1Model(m: number) {
  const mk = Math.round(OIL_KG * m)
  const tk = OIL_KG - mk
  const sold = Math.min(mk, MARKET_CAP)
  const over = mk - sold
  const now = tk * OLIVE.traderPrice
  const gap = Math.max(0, NEED - now)
  const marketNet = Math.round(sold * (OLIVE.chainPrice - OLIVE.bottlingCost) * (1 - COOP_FEE))
  const late = over * LATE_PRICE
  const interest = Math.round(gap * GAP_COST)
  const total = now + marketNet + late - interest
  return { mk, tk, sold, over, now, gap, marketNet, late, interest, total, coop: Math.round(sold * (OLIVE.chainPrice - OLIVE.bottlingCost) * COOP_FEE) }
}
export const SHELF_PER_LT = 855 // ✅ raf litresi 810–900 TL, orta değer

// Yerler (vadi koordinatı)
export const AYSE: [number, number] = [-1.4, 3.2] // yol kenarı: ağaçların önünde
export const AYSE_HOME: [number, number] = [-2.2, 6]
export const DEPOT: [number, number] = [-0.6, 5.2]
export const GOODS: [number, number] = [0.8, 4.3]
const CRATES: [number, number] = [-0.35, 3.3] // bahçenin yola bakan önü: ağaçların arkasında kalmasın
const WORKERS: [number, number][] = [[-2.1, 2.3], [1.15, 2.35]]
export const STOP_X = 2.3 // deponun görüş çizgisinin dışında

export const Ayse = ({ cheer = false }: { cheer?: boolean }) => (
  <group scale={1.35} position={at(...AYSE)}>
    <Person position={[0, 0, 0]} scarf="#c04e3a" shirt="#6a7f4f" anim={cheer ? 'cheer' : 'idle'} />
  </group>
)
export const say = (where: [number, number], text: string) => <Bubble position={at(where[0], where[1], 1.25)}>{text}</Bubble>

function Scene({ step, k, params }: SceneProps) {
  const M = ch1Model((params.market ?? 0) / 100)
  const full = 18
  const leftAfterTrader = Math.round(full * (M.mk / OIL_KG))
  let crates = 0
  let bidons = 0
  let bottles = 0
  if (step === 'harvest') crates = Math.floor(k * 9 + 0.2)
  if (step === 'press') {
    crates = Math.round((1 - k) * 9)
    bidons = Math.round(k * full)
  }
  if (step === 'trader' || step === 'choose') bidons = full
  if (step === 'sellTrader') bidons = Math.round(full - (full - leftAfterTrader) * seg(k, 0, 0.3))
  const bottleCrates = Math.max(1, Math.round(20 * (M.mk / OIL_KG)))
  if (step === 'bottle') {
    bidons = Math.round((1 - k) * leftAfterTrader)
    bottles = Math.round(k * bottleCrates)
  }
  if (step === 'marketGo') bottles = Math.round((1 - seg(k, 0.45, 0.65)) * bottleCrates)

  const stopT = STOP_X - 0.8
  const stopM = STOP_X + 1.0
  let trader: { x: number; dir: number; cargo: number } | null = null
  if (step === 'trader') trader = { x: -FAR + (stopT + FAR) * ease(seg(k, 0, 0.6)), dir: 1, cargo: 0 }
  if (step === 'choose') trader = { x: stopT, dir: 1, cargo: 0 }
  if (step === 'sellTrader') {
    const g = ease(seg(k, 0.3, 0.8))
    trader = { x: stopT - (stopT + FAR) * g, dir: g > 0 ? -1 : 1, cargo: Math.round(seg(k, 0, 0.3) * 16 * (M.tk / OIL_KG)) }
  }
  if (step === 'bottle' && M.tk === 0) {
    const g = ease(seg(k, 0, 0.6))
    trader = g < 1 ? { x: stopT - (stopT + FAR) * g, dir: -1, cargo: 0 } : null
  }
  let market: { x: number; dir: number; cargo: number } | null = null
  if (step === 'marketGo') {
    const come = ease(seg(k, 0, 0.45))
    const leave = ease(seg(k, 0.65, 1))
    market = { x: leave > 0 ? stopM + (FAR - stopM) * leave : FAR - (FAR - stopM) * come, dir: leave > 0 ? 1 : -1, cargo: Math.round(seg(k, 0.45, 0.65) * 16 * Math.min(1, M.sold / 1000)) }
  }
  if (step === 'marketBack') market = { x: FAR - (FAR - stopM) * ease(seg(k, 0, 0.6)), dir: -1, cargo: 0 }
  if (step === 'payout') market = { x: stopM + (FAR - stopM) * ease(seg(k, 0.5, 1)), dir: 1, cargo: 0 }
  const yaw = (d: number) => (d > 0 ? 0 : Math.PI)

  return (
    <group>
      <Depot position={at(...DEPOT)} />
      <Ayse cheer={step === 'payout'} />
      {step === 'harvest' && (
        <>
          {WORKERS.slice(0, 2).map(([x, z], i) => (
            <group key={i}>
              <group position={at(x, z)} scale={1.3}>
                <Person position={[0, 0, 0]} anim="pick" phase={i * 1.3} shirt={['#3f6b8a', '#8a5a3f'][i]} pole />
              </group>
              <FallingOlives position={at(x + 0.05, z - 0.45)} />
            </group>
          ))}
          <Walker from={at(0.15, 2.2)} to={at(CRATES[0] + 0.25, CRATES[1] - 0.15)} shirt="#5f7a4a" speed={0.5} />
          <Walker from={at(-1.2, 2.25)} to={at(CRATES[0] - 0.2, CRATES[1] - 0.15)} shirt="#a0583f" phase={1.4} speed={0.5} />
        </>
      )}
      {step === 'press' && <Walker from={at(CRATES[0], CRATES[1] + 0.3)} to={at(GOODS[0] - 0.3, GOODS[1] - 0.2)} shirt="#5f7a4a" speed={1.2} />}
      {crates > 0 && <Crates position={at(...CRATES)} n={crates} />}
      {bidons > 0 && <Bidons position={at(...GOODS)} n={bidons} />}
      {bottles > 0 && <BottleCrates position={at(...GOODS)} n={bottles} />}
      {trader && <Truck position={onRoad(trader.x)} yaw={yaw(trader.dir)} color="#8c8a7e" cargo={trader.cargo} />}
      {market && <Truck position={onRoad(market.x)} yaw={yaw(market.dir)} color="#1f8a8c" cargo={market.cargo} />}

      {((step === 'trader' && k > 0.62) || step === 'choose') && <PriceTag position={above(onRoad(stopT), 1.1)} text={`${OLIVE.traderPrice} ₺/kg`} />}
      {step === 'press' && k > 0.45 && <PriceTag position={at(GOODS[0] + 0.5, GOODS[1], 1.0)} text={`${OIL_KG.toLocaleString('tr-TR')} kg yağ`} />}
      {step === 'wait' && <PriceTag position={at(DEPOT[0], DEPOT[1], 1.7)} text="Market 60 gün sonra öder…" />}

      {step === 'intro' && k > 0.08 && say(AYSE, 'Bu yıl zeytin bol. Ama tüccar…')}
      {step === 'harvest' && k < 0.55 && say(AYSE, 'Hasat başladı!')}
      {step === 'trader' && k > 0.6 && say(AYSE, 'Yine 275. Başka alan yok.')}
      {step === 'sellTrader' && k > 0.72 && say(AYSE, M.gap > 0 ? 'Gübre parası yetmedi, tüccardan avans alacağım…' : M.mk > 0 ? 'Acil param tamam.' : 'Her yıl aynı…')}
      {step === 'bottle' && k > 0.5 && say(AYSE, 'Kendi şişemiz!')}
      {step === 'payout' && k > 0.5 && say(AYSE, M.over > 0 ? 'Fazla yağ elde kaldı…' : 'Emeğimin karşılığı bu!')}

      {step === 'sellTrader' && k > 0.45 && <CoinFlight from={above(onRoad(STOP_X - 0.8 - (STOP_X - 0.8 + FAR) * ease(seg(0.45, 0.3, 0.8))), 0.6)} to={at(AYSE_HOME[0], AYSE_HOME[1], 1.0)} />}
      {step === 'marketBack' && k > 0.55 && <CoinFlight from={above(onRoad(STOP_X + 1.0), 0.6)} to={at(DEPOT[0], DEPOT[1], 1.0)} n={12} />}
      {step === 'payout' && k > 0.02 && <CoinFlight from={at(DEPOT[0], DEPOT[1], 1.0)} to={at(AYSE_HOME[0], AYSE_HOME[1], 1.0)} n={10} />}
      {step === 'sellTrader' && k > 0.55 && <FloatMoney position={at(AYSE_HOME[0], AYSE_HOME[1], 1.7)} amount={M.now} big />}
      {step === 'marketBack' && k > 0.62 && <FloatMoney position={at(DEPOT[0], DEPOT[1], 1.6)} amount={M.marketNet + M.coop} />}
      {step === 'payout' && k > 0.08 && <FloatMoney position={at(AYSE_HOME[0], AYSE_HOME[1], 1.7)} amount={M.marketNet + M.late - M.interest} big />}
      {step === 'payout' && k > 0.32 && <FloatMoney position={at(DEPOT[0] + 0.6, DEPOT[1], 1.3)} amount={M.coop} />}
    </group>
  )
}

const DECISION: Decision = {
  question: 'Yağın ne kadarı şişelenip markete gitsin? Kalanı tüccara. Market 60 gün [[vade|vadeyle]] öder, tüccar peşin.',
  controls: [{ id: 'market', label: 'Markete', min: 0, max: 100, step: 10, def: 0, format: (v) => `%${v} · ${Math.round((OIL_KG * v) / 100).toLocaleString('tr-TR')} kg` }],
  meters: (p) => {
    const M = ch1Model((p.market ?? 0) / 100)
    return [
      { label: `Ayşe Teyze'nin acil ihtiyacı ${tl(NEED)}`, ok: M.gap === 0, text: M.gap === 0 ? 'karşılanıyor' : `${tl(M.gap)} eksik` },
      { label: `Marketin alacağı en fazla ${MARKET_CAP.toLocaleString('tr-TR')} kg`, ok: M.over === 0, text: M.over === 0 ? 'sığıyor' : `${M.over.toLocaleString('tr-TR')} kg fazla` },
    ]
  },
  next: (p) => ((p.market ?? 0) < 100 ? 'sellTrader' : 'bottle'),
  predict: { question: "Sence tüccardan gelen peşin para Ayşe Teyze'nin Aralık borcunu kapatır mı?", answer: (p) => ch1Model((p.market ?? 0) / 100).gap === 0 },
}

export const ch1: ChapterDef = {
  id: 1,
  title: '[[araci|Aracı]] farkı',
  goal: 'Ayşe Teyze daha çok kazansın',
  crop: 'Zeytinyağı',
  flow: {
    intro: { next: 'harvest', dur: 4.5 },
    harvest: { next: 'press', dur: 6 },
    press: { next: 'trader', dur: 4 },
    trader: { next: 'choose', dur: 5.5 },
    sellTrader: { next: (_, p) => ((p.market ?? 0) > 0 ? 'bottle' : 'result'), dur: 6 },
    bottle: { next: 'marketGo', dur: 4.5 },
    marketGo: { next: 'wait', dur: 4 },
    wait: { next: 'marketBack', dur: 3.5 },
    marketBack: { next: 'payout', dur: 4 },
    payout: { next: 'result', dur: 4.5 },
  },
  month: {
    intro: 'Ekim', harvest: 'Kasım', press: 'Aralık', trader: 'Aralık', choose: 'Aralık', sellTrader: 'Aralık',
    bottle: 'Aralık', marketGo: 'Aralık', wait: 'Ocak', marketBack: 'Şubat', payout: 'Şubat', result: 'Şubat',
  },
  shot: {
    intro: { f: [-1.0, 2.4], z: 1.9 },
    harvest: { f: [-0.4, 2.6], z: 1.9 },
    press: { f: [0.6, 4.0], z: 1.8 },
    trader: { f: [-1.0, 3.8], z: 1.35 },
    choose: { f: [0.4, 4.0], z: 1.6 },
    sellTrader: { f: [-2.5, 4.2], z: 1.15 },
    bottle: { f: [0.6, 4.2], z: 1.8 },
    marketGo: { f: [2.5, 4.0], z: 1.15 },
    wait: { f: [2.5, 4.0], z: 1.1 },
    marketBack: { f: [1.5, 4.2], z: 1.25 },
    payout: { f: [-0.8, 4.8], z: 1.45 },
    result: { f: [-0.4, 3.6], z: 1.2 },
  },
  valleyMonth: (s) => (s === 'intro' ? 0 : s === 'harvest' ? 1 : 2),
  lesson: '[[deger-zinciri|değer zinciri]]',
  icon: 'bottle',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = ch1Model((p.market ?? 0) / 100)
    const best = bestOf(DECISION, (q) => ch1Model(q.market / 100).total)
    const stars = starsFor(M.total, best, TRADER_TOTAL)
    const notes = [M.gap > 0 && `acil para ${tl(M.gap)} eksik kaldı, tüccardan alınan avansın bedeli ${tl(M.interest)}`, M.over > 0 && `marketin almadığı ${M.over.toLocaleString('tr-TR')} kg ucuza gitti`].filter(Boolean)
    return {
      good: stars >= 2,
      stars,
      caption: "Ayşe Teyze'nin eline geçen",
      value: tl(M.total),
      compare: notes.length ? `Dikkat: ${notes.join('; ')}` : M.mk === 0 ? 'Aracı farkı yine tüccarda kaldı' : `Tüccara hepsini vermekten ${tl(M.total - TRADER_TOTAL)} fazla`,
      chain: [
        { label: `Tüccara ${M.tk.toLocaleString('tr-TR')} kg, peşin`, value: tl(M.now) },
        { label: `Aralık borcu ${tl(NEED)}`, value: M.gap === 0 ? 'kapandı' : `${tl(M.gap)} eksik · avans bedeli −${tl(M.interest)}`, ok: M.gap === 0 },
        ...(M.mk > 0
          ? [
              { label: `Markete ${M.mk.toLocaleString('tr-TR')} kg, 60 gün [[vade|vadeli]]`, value: `+${tl(M.marketNet)}`, ok: true },
              ...(M.over > 0 ? [{ label: `Market ${MARKET_CAP.toLocaleString('tr-TR')} kg'dan fazlasını almadı`, value: `${M.over.toLocaleString('tr-TR')} kg ucuza`, ok: false }] : []),
            ]
          : []),
      ],
      bars: [
        { label: 'Hepsi tüccara', value: TRADER_TOTAL, max: best, unit: '₺', on: false },
        { label: 'Senin kararın', value: M.total, max: best, unit: '₺', on: true },
        { label: 'En iyi ayar', value: best, max: best, unit: '₺', on: false },
      ],
      barsNote: `Kilo başına Ayşe Teyze'ye: ${Math.round(M.total / OIL_KG)} ₺ · rafta litresi ${SHELF_PER_LT} ₺`,
      lesson: stars >= 2 ? '[[deger-zinciri|değer zinciri]]' : undefined,
    }
  },
  Scene,
}
