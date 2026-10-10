// Bölüm 2 — Kâr var, kasa boş (vade + ihtiyat). İki üyenin yağı markete; market 60 gün sonra öder.
// Karar: avans oranı ve kredi. Kışın beklenmedik bir gider çıkar; kasada tampon yoksa batılır.
import { LOAN_RATE, LOAN_STEP, OLIVE, START_CASH } from '../sim/config'
import { Bidons, CoinFlight, CoinStack, Depot, FloatMoney, Person, PriceTag, Truck } from './actors'
import { Tractor } from '../scene/village'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { FAR, above, at, onRoad } from './road'
import { AYSE_HOME, Ayse, AYSE, COOP_FEE, DEPOT, GOODS, OIL_KG, STOP_X, say } from './ch1'

const KG = OIL_KG * 2
const BASE = KG * OLIVE.traderPrice // avans tüccar fiyatı üstünden
const MARKET = KG * (OLIVE.chainPrice - OLIVE.bottlingCost)
const MEMBERS = Math.round(MARKET * (1 - COOP_FEE))
const COOP = MARKET - MEMBERS
const NEED = 360_000 // 🎲 iki üyenin kışlık acil ihtiyacı (gübre, yakacak, borç)
const REPAIR = 120_000 // 🎲 Ocak'ta traktör tamiri: beklenmedik gider
const INTEREST = Math.round(LOAN_STEP * LOAN_RATE * 2) // iki ay

export function ch2Model(p: Params) {
  const a = (p.avans ?? 50) / 100
  const loan = (p.kredi ?? 0) > 0
  const adv = Math.round(BASE * a)
  const low = START_CASH + (loan ? LOAN_STEP : 0) - adv // avanstan sonra kasa
  const afterRepair = low - REPAIR
  const needOk = adv >= NEED
  const broke = low < 0 || afterRepair < 0
  const ok = needOk && !broke
  const final = START_CASH + COOP - REPAIR - (loan ? INTEREST : 0)
  return { a, loan, adv, low, afterRepair, needOk, broke, ok, final }
}

const EMINE: [number, number] = [-2.7, 3.35]
const EMINE_HOME: [number, number] = [-4, 5.8]
const KASA: [number, number] = [0.9, 6.0] // deponun önünde, görünür

function cash(step: string, k: number, p: Params) {
  const M = ch2Model(p)
  if (['intro', 'deliver', 'market', 'choose'].includes(step)) return START_CASH
  if (step === 'bank') return START_CASH + LOAN_STEP * ease(k)
  if (step === 'pay') return START_CASH + (M.loan ? LOAN_STEP : 0) - M.adv * ease(k)
  if (step === 'wait') return M.low - (k > 0.4 ? REPAIR : 0)
  if (step === 'angry' || (step === 'result' && !M.ok)) return Math.min(M.low, M.afterRepair)
  if (step === 'result') return M.final
  if (step === 'back') return M.afterRepair + (k > 0.6 ? MARKET : 0)
  return M.afterRepair + MARKET - (MEMBERS - M.adv + (M.loan ? LOAN_STEP + INTEREST : 0)) * ease(k)
}

function Scene({ step, k, params }: SceneProps) {
  const M = ch2Model(params)
  const full = 24
  const bidons = step === 'deliver' ? Math.round(k * full) : step === 'market' ? Math.round((1 - seg(k, 0.4, 0.6)) * full) : 0
  const stopM = STOP_X + 1.0
  let truck: { x: number; dir: number; cargo: number } | null = null
  if (step === 'market') {
    const come = ease(seg(k, 0, 0.4))
    const leave = ease(seg(k, 0.62, 1))
    truck = { x: leave > 0 ? stopM + (FAR - stopM) * leave : FAR - (FAR - stopM) * come, dir: leave > 0 ? 1 : -1, cargo: Math.round(seg(k, 0.4, 0.6) * 16) }
  }
  if (step === 'back') truck = { x: FAR - (FAR - stopM) * ease(seg(k, 0, 0.6)), dir: -1, cargo: 0 }
  if (step === 'settle') truck = { x: stopM + (FAR - stopM) * ease(seg(k, 0.4, 1)), dir: 1, cargo: 0 }
  const c = cash(step, k, params)
  const angry = step === 'angry'
  const happy = step === 'settle' && k > 0.4
  const half = M.adv / 2

  return (
    <group>
      <Depot position={at(...DEPOT)} />
      <Ayse cheer={happy} />
      <group scale={1.35} position={at(...EMINE)}>
        <Person position={[0, 0, 0]} scarf="#3f6b8a" shirt="#8a5a3f" anim={happy ? 'cheer' : 'idle'} phase={1.2} />
      </group>
      <group position={at(...KASA)} scale={1.7}>
        <CoinStack position={[0, 0, 0]} amount={c} />
      </group>
      <PriceTag position={at(KASA[0], KASA[1], 1.6)} text={`Kasa ${tl(c)}`} />
      {bidons > 0 && <Bidons position={at(...GOODS)} n={bidons} />}
      {truck && <Truck position={onRoad(truck.x)} yaw={truck.dir > 0 ? 0 : Math.PI} color="#1f8a8c" cargo={truck.cargo} />}
      {step === 'wait' && <Tractor position={at(KASA[0] + 1.3, KASA[1] + 0.5)} rot={0.6} />}

      {step === 'deliver' && k > 0.5 && <PriceTag position={at(GOODS[0] + 0.5, GOODS[1], 1.0)} text={`${KG.toLocaleString('tr-TR')} kg yağ`} />}
      {step === 'market' && k > 0.3 && <PriceTag position={above(onRoad(stopM), 1.15)} text="Market öder: 60 gün sonra" />}
      {step === 'wait' && k > 0.35 && <PriceTag position={at(KASA[0] + 1.3, KASA[1] + 0.5, 1.0)} text={`Traktör tamiri ${tl(REPAIR)}`} />}
      {step === 'bank' && <PriceTag position={at(KASA[0], KASA[1], 2.0)} text={`Kredi · aylık %${(LOAN_RATE * 100).toLocaleString('tr-TR')}`} />}

      {step === 'intro' && k > 0.08 && say(AYSE, 'Bu yıl Emine de bizimle.')}
      {step === 'deliver' && k > 0.45 && say(EMINE, 'Kışın hep bir masraf çıkar, kasada para bırakın.')}
      {step === 'market' && k > 0.5 && say(AYSE, 'Kışlık paramız lazım ama…')}
      {step === 'pay' && k > 0.5 && say(EMINE, M.needOk ? 'Kışı çıkarırız, sağ olun.' : 'Bu kadarla gübre bile alamam!')}
      {step === 'wait' && k > 0.55 && say(AYSE, M.afterRepair < 0 ? 'Kasada para kalmadı!' : 'İyi ki kasada para varmış.')}
      {angry && say(EMINE, M.broke ? 'Param nerede?' : 'Başka kapıya gidiyoruz.')}
      {happy && say(AYSE, 'Hepsi geldi!')}

      {step === 'bank' && k > 0.15 && <CoinFlight from={at(KASA[0] + 6, KASA[1] + 2, 2)} to={at(KASA[0], KASA[1], 0.4)} n={8} />}
      {step === 'bank' && k > 0.3 && <FloatMoney position={at(KASA[0], KASA[1], 1.0)} amount={LOAN_STEP} />}
      {step === 'pay' && k > 0.1 && M.adv > 0 && (
        <>
          <CoinFlight from={at(KASA[0], KASA[1], 0.4)} to={at(AYSE_HOME[0], AYSE_HOME[1], 1.0)} />
          <CoinFlight from={at(KASA[0], KASA[1], 0.4)} to={at(EMINE_HOME[0], EMINE_HOME[1], 1.0)} />
          <FloatMoney position={at(AYSE_HOME[0], AYSE_HOME[1], 1.7)} amount={half} />
          <FloatMoney position={at(EMINE_HOME[0], EMINE_HOME[1], 1.7)} amount={half} />
        </>
      )}
      {step === 'wait' && k > 0.4 && <FloatMoney position={at(KASA[0], KASA[1], 1.0)} amount={-REPAIR} />}
      {step === 'back' && k > 0.55 && <CoinFlight from={above(onRoad(stopM), 0.6)} to={at(KASA[0], KASA[1], 0.4)} n={14} />}
      {step === 'back' && k > 0.62 && <FloatMoney position={at(KASA[0], KASA[1], 1.0)} amount={MARKET} big />}
      {step === 'settle' && k > 0.05 && (
        <>
          <CoinFlight from={at(KASA[0], KASA[1], 0.4)} to={at(AYSE_HOME[0], AYSE_HOME[1], 1.0)} />
          <CoinFlight from={at(KASA[0], KASA[1], 0.4)} to={at(EMINE_HOME[0], EMINE_HOME[1], 1.0)} />
          <FloatMoney position={at(AYSE_HOME[0], AYSE_HOME[1], 1.7)} amount={(MEMBERS - M.adv) / 2} />
          <FloatMoney position={at(EMINE_HOME[0], EMINE_HOME[1], 1.7)} amount={(MEMBERS - M.adv) / 2} />
        </>
      )}
      {step === 'settle' && M.loan && k > 0.45 && <FloatMoney position={at(KASA[0], KASA[1], 1.0)} amount={-(LOAN_STEP + INTEREST)} />}
    </group>
  )
}

const DECISION: Decision = {
  question: 'Üyelere teslimde [[avans|avansın]] yüzde kaçını ödersin? Kalanı market ödeyince.',
  controls: [
    { id: 'avans', label: 'Avans', min: 0, max: 100, step: 10, def: 100, format: (v) => `%${v} · ${tl((BASE * v) / 100)}` },
    { id: 'kredi', label: `Kredi al (${tl(LOAN_STEP)}, aylık %${(LOAN_RATE * 100).toLocaleString('tr-TR')})`, min: 0, max: 1, step: 1, def: 0, toggle: true, format: (v) => (v ? 'evet' : 'hayır') },
  ],
  meters: (p) => {
    const M = ch2Model(p)
    return [
      { label: `Üyelerin kışlık ihtiyacı ${tl(NEED)}`, ok: M.needOk, text: M.needOk ? 'karşılanıyor' : `${tl(NEED - M.adv)} eksik` },
      { label: 'Avanstan sonra kasada kalan', ok: M.low < 0 ? false : undefined, text: tl(M.low) }, // yeterli mi? oyuncu karar verir
    ]
  },
  next: (p) => ((p.kredi ?? 0) > 0 ? 'bank' : 'pay'),
  predict: { question: 'Sence kasa Ocak ayını çıkarabilir mi?', answer: (p) => !ch2Model(p).broke },
}

const score = (p: Params) => {
  const M = ch2Model(p)
  return M.ok ? M.final : 0
}

export const ch2: ChapterDef = {
  id: 2,
  title: 'Kâr var, kasa boş',
  goal: 'Kasa kışı çıkarsın, üyeler kalsın',
  crop: 'Zeytinyağı · vade',
  flow: {
    intro: { next: 'deliver', dur: 4 },
    deliver: { next: 'market', dur: 5 },
    market: { next: 'choose', dur: 5 },
    bank: { next: 'pay', dur: 3.5 },
    pay: { next: 'wait', dur: 4.5 },
    wait: { next: (_, p) => (ch2Model(p).ok ? 'back' : 'angry'), dur: 5 },
    back: { next: 'settle', dur: 4 },
    settle: { next: 'result', dur: 4.5 },
    angry: { next: 'result', dur: 4 },
  },
  month: {
    intro: 'Aralık', deliver: 'Aralık', market: 'Aralık', choose: 'Aralık', bank: 'Aralık', pay: 'Aralık',
    angry: 'Ocak', wait: 'Ocak', back: 'Şubat', settle: 'Şubat', result: 'Şubat',
  },
  shot: {
    intro: { f: [-1.6, 3.6], z: 1.8 },
    deliver: { f: [-0.2, 4.4], z: 1.7 },
    market: { f: [1.8, 4.2], z: 1.3 },
    choose: { f: [-0.6, 4.6], z: 1.6 },
    bank: { f: [0.6, 5.6], z: 1.9 },
    pay: { f: [-1.6, 5.2], z: 1.45 },
    angry: { f: [-1.2, 4.4], z: 1.7 },
    wait: { f: [1.0, 5.6], z: 1.6 },
    back: { f: [1.4, 4.6], z: 1.3 },
    settle: { f: [-1.6, 5.0], z: 1.4 },
    result: { f: [-0.6, 4.2], z: 1.2 },
  },
  valleyMonth: () => 2,
  lesson: '[[isletme-sermayesi|işletme sermayesi]] ve [[ihtiyat|ihtiyat payı]]',
  icon: 'coins',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = ch2Model(p)
    const best = bestOf(DECISION, score)
    const stars = M.ok ? starsFor(M.final, best, START_CASH - REPAIR - 70_000) : 0
    return {
      good: stars >= 2,
      stars,
      caption: M.ok ? 'Yıl sonu kasa' : M.broke ? 'Kasa yetmedi' : 'Üyeler ayrıldı',
      value: M.ok ? tl(M.final) : M.broke ? `${tl(-Math.min(M.low, M.afterRepair))} eksik` : `${tl(NEED - M.adv)} eksik avans`,
      compare: M.ok
        ? M.loan
          ? `Kasa ayakta; bedeli ${tl(INTEREST)} [[faiz|faiz]]`
          : 'Tamir parasını da kasadan karşıladın'
        : M.broke
          ? 'Kasa dibe vurdu, tamir parası çıkmadı'
          : 'Üyeler kışı çıkaramadı ve ayrıldı',
      bars: [],
      chain: [
        { label: `Aralık: üyelere %${Math.round(M.a * 100)} [[avans|avans]]`, value: `${tl(M.adv)} · ${M.needOk ? 'yetti' : 'yetmedi'}`, ok: M.needOk },
        ...(M.loan ? [{ label: 'Bankadan kredi', value: `+${tl(LOAN_STEP)}` }] : []),
        { label: 'Kasada kalan', value: tl(M.low), ok: M.low >= 0 },
        { label: `Ocak: traktör tamiri ${tl(REPAIR)}`, value: M.afterRepair >= 0 ? `kasa ${tl(M.afterRepair)}` : `${tl(-M.afterRepair)} eksik`, ok: M.afterRepair >= 0 },
        ...(M.ok ? [{ label: 'Şubat: market kasaya ödedi', value: `+${tl(MARKET)}`, ok: true }] : []),
      ],
      lesson: stars >= 2 ? '[[isletme-sermayesi|işletme sermayesi]] ve [[ihtiyat|ihtiyat payı]]' : undefined,
    }
  },
  Scene,
}
