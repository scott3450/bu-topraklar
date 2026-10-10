// Bölüm 3 — Birlikte ucuz (süt, toplu yem alımı). Karar: kaç aylık yem birden alınsın.
// Çok alınca indirim artar ama yem depoda bozulur ve peşin ödeme kasayı aşar.
import { MILK } from '../sim/config'
import { CoinFlight, FloatMoney, Person, PriceTag, Sacks, Truck } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { FAR, above, at, onRoad } from './road'
import { say } from './ch1'

const LITRES = Math.round((MILK.cows * MILK.kgPerCowYear) / 12)
const MARGIN = MILK.price - MILK.costPerLitre
const FEED = Math.round(LITRES * MILK.costPerLitre * MILK.feedShare) // bir çiftliğin aylık yemi
const FARMS = 4
const DISCOUNT = [0.05, 0.1, 0.12, 0.13, 0.14, 0.14] // 🎲 ay sayısına göre toptan indirim (3 ayda MILK.bulkFeedDiscount)
const SPOIL = [0, 0, 0, 0.04, 0.08, 0.13] // 🎲 köy deposunda 3 aydan uzun bekleyen yem nem kapar
const KASA = 900_000 // 🎲 yem peşin ödenir; kooperatif kasası
const f2 = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function ch3Model(p: Params) {
  const m = Math.round(p.ay ?? 1)
  const d = DISCOUNT[m - 1]
  const s = SPOIL[m - 1]
  const pay = Math.round(FARMS * m * FEED * (1 - d))
  const cashOk = pay <= KASA
  const save = cashOk ? FEED * (d - s) : 0 // çiftlik başına aylık net kazanç
  return { m, d, s, pay, cashOk, save, perL: MARGIN + save / LITRES }
}

const FATMA: [number, number] = [4.1, -0.9]
const BARN: [number, number] = [5.5, -2.5]
const SACKS: [number, number] = [5.0, 2.45]
const STOP = 5.6

function Scene({ step, k, params }: SceneProps) {
  const M = ch3Model(params)
  const all = M.m * 3
  const bad = Math.min(all - 1, Math.max(M.s > 0 ? 1 : 0, Math.round(all * M.s * 4))) // bozulmayı gözle görülür kıl
  let truck: { x: number; dir: number; cargo: number } | null = null
  let sacks = 0
  if (step === 'together') {
    const come = ease(seg(k, 0, 0.4))
    const leave = ease(seg(k, 0.65, 1))
    truck = { x: leave > 0 ? STOP + (FAR - STOP) * leave : -FAR + (STOP + FAR) * come, dir: 1, cargo: 16 - Math.round(seg(k, 0.4, 0.6) * 12) }
    sacks = Math.round(seg(k, 0.4, 0.6) * all)
  }
  if (step === 'short') {
    const come = ease(seg(k, 0, 0.4))
    const leave = ease(seg(k, 0.65, 1))
    truck = { x: leave > 0 ? STOP - (STOP + FAR) * leave : -FAR + (STOP + FAR) * come, dir: leave > 0 ? -1 : 1, cargo: 16 }
  }
  const rotten = step === 'spoil' ? Math.round(seg(k, 0.2, 0.6) * bad) : step === 'result' && M.cashOk ? bad : 0
  if (step === 'save') sacks = all
  if (step === 'spoil' || (step === 'result' && M.cashOk)) sacks = all - rotten
  const happy = step === 'save'

  return (
    <group>
      <group scale={1.35} position={at(...FATMA)}>
        <Person position={[0, 0, 0]} scarf="#7a4f8a" shirt="#4f6b8a" anim={happy ? 'cheer' : 'idle'} />
      </group>
      {sacks > 0 && <Sacks position={at(...SACKS)} n={sacks} />}
      {rotten > 0 && <Sacks position={at(SACKS[0] + 1.1, SACKS[1] + 0.2)} n={rotten} color="#6f7a4a" />}
      {truck && <Truck position={onRoad(truck.x)} yaw={truck.dir > 0 ? 0 : Math.PI} color="#1f8a8c" cargo={truck.cargo} />}

      {step === 'milk' && <PriceTag position={at(BARN[0], BARN[1], 2.6)} text={`Ayda ${LITRES.toLocaleString('tr-TR')} lt süt`} />}
      {step === 'math' && (
        <>
          <PriceTag position={at(BARN[0] - 1.2, BARN[1], 2.7)} text={`Süt ${f2(MILK.price)} ₺/lt`} />
          {k > 0.3 && <PriceTag position={at(BARN[0] + 0.9, BARN[1] + 0.6, 2.2)} text={`Maliyet ${f2(MILK.costPerLitre)} ₺/lt`} />}
        </>
      )}
      {step === 'together' && k > 0.35 && (
        <PriceTag position={above(onRoad(Math.min(truck?.x ?? STOP, 12)), 1.15)} text={`${FARMS} çiftlik · ${M.m} aylık · %${Math.round(M.d * 100)} indirim`} />
      )}
      {step === 'short' && k > 0.4 && <PriceTag position={above(onRoad(STOP), 1.15)} text={`Peşin ${tl(M.pay)}`} />}
      {step === 'spoil' && k > 0.3 && <PriceTag position={at(SACKS[0] + 1.2, SACKS[1] + 0.2, 1.0)} text={`%${Math.round(M.s * 100)} küflendi`} />}

      {step === 'intro' && k > 0.08 && say(FATMA, 'Yem yine zamlandı.')}
      {step === 'math' && k > 0.6 && say(FATMA, `Litrede ${Math.round(MARGIN * 100)} kuruş kalıyor.`)}
      {step === 'short' && k > 0.5 && say(FATMA, 'Kasada o kadar para yok!')}
      {happy && k > 0.3 && say(FATMA, 'Bu ay elime daha çok kaldı!')}
      {step === 'spoil' && k > 0.35 && say(FATMA, 'Yaz sıcağında yem bozuldu…')}

      {step === 'save' && k > 0.02 && <CoinFlight from={at(SACKS[0], SACKS[1], 0.5)} to={at(BARN[0], BARN[1], 1.8)} n={6} />}
      {step === 'save' && k > 0.1 && <FloatMoney position={at(BARN[0], BARN[1], 2.4)} amount={Math.round(FEED * M.d)} big />}
      {step === 'spoil' && k > 0.45 && <FloatMoney position={at(SACKS[0] + 1.1, SACKS[1], 1.4)} amount={-Math.round(FEED * M.m * M.s)} />}
    </group>
  )
}

const DECISION: Decision = {
  question: 'Dört çiftlik yemi birlikte alacak. Kaç aylık yem birden alınsın?',
  controls: [{ id: 'ay', label: 'Kaç aylık', min: 1, max: 6, step: 1, def: 1, format: (v) => `${v} ay · %${Math.round(DISCOUNT[v - 1] * 100)} indirim` }],
  meters: (p) => {
    const M = ch3Model(p)
    return [
      { label: 'Depoda bekleyen yem', ok: M.s === 0, text: M.s === 0 ? 'bozulmaz' : `%${Math.round(M.s * 100)} bozulur` },
      { label: `[[pesin|Peşin]] ödeme · kasa ${tl(KASA)}`, ok: M.cashOk, text: M.cashOk ? tl(M.pay) : `${tl(M.pay - KASA)} eksik` },
    ]
  },
  next: (p) => (ch3Model(p).cashOk ? 'together' : 'short'),
  predict: { question: 'Sence bu alımda yem bozulmadan biter ve kasa peşin ödemeye yeter mi?', answer: (p) => { const M = ch3Model(p); return M.cashOk && M.s === 0 } },
}

const score = (p: Params) => ch3Model(p).save

export const ch3: ChapterDef = {
  id: 3,
  title: 'Birlikte ucuz',
  goal: "Fatma Abla'nın elinde daha çok kalsın",
  crop: 'Süt · yem',
  flow: {
    intro: { next: 'milk', dur: 4 },
    milk: { next: 'math', dur: 3.5 },
    math: { next: 'choose', dur: 5.5 },
    together: { next: 'save', dur: 5.5 },
    save: { next: (_, p) => (ch3Model(p).s > 0 ? 'spoil' : 'result'), dur: 4 },
    spoil: { next: 'result', dur: 4.5 },
    short: { next: 'result', dur: 5 },
  },
  month: { intro: 'Mart', milk: 'Mart', math: 'Mart', choose: 'Mart', together: 'Nisan', short: 'Nisan', save: 'Nisan', spoil: 'Temmuz', result: 'Temmuz' },
  shot: {
    intro: { f: [4.2, -1.0], z: 1.9 },
    milk: { f: [5.2, -1.6], z: 1.6 },
    math: { f: [5.0, -1.4], z: 1.5 },
    choose: { f: [4.8, 0.4], z: 1.4 },
    together: { f: [5.4, 1.6], z: 1.2 },
    short: { f: [4.6, 1.6], z: 1.3 },
    save: { f: [5.0, -0.6], z: 1.5 },
    spoil: { f: [5.4, 2.0], z: 1.6 },
    result: { f: [4.8, 0.4], z: 1.2 },
  },
  valleyMonth: () => 5,
  lesson: '[[olcek|ölçek ekonomisi]] ve sınırı',
  icon: 'bigtruck',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = ch3Model(p)
    const best = bestOf(DECISION, score)
    const stars = starsFor(M.save, best, 0)
    return {
      good: stars >= 2,
      stars,
      caption: "Fatma Abla'ya litre başına kalan",
      value: `${f2(M.perL)} ₺`,
      compare: !M.cashOk
        ? 'Kasa peşin ödemeye yetmedi, yem yine tek tek alındı'
        : M.s > 0
          ? `İndirimin bir kısmını bozulan yem yedi: ayda ${tl(FEED * M.s)} kayıp`
          : `Tek başına almaktan ayda ${tl(M.save)} fazla`,
      chain: [
        { label: `${M.m} aylık yem, dört çiftlik birlikte · [[pesin|peşin]]`, value: M.cashOk ? `${tl(M.pay)} · kasa yetti` : `${tl(M.pay - KASA)} eksik`, ok: M.cashOk },
        ...(M.cashOk
          ? [
              { label: `Toptan indirim %${Math.round(M.d * 100)}`, value: `çiftlik başı ayda +${tl(FEED * M.d)}`, ok: true },
              ...(M.s > 0 ? [{ label: `Depoda bozulan yem %${Math.round(M.s * 100)}`, value: `ayda −${tl(FEED * M.s)}`, ok: false }] : []),
              { label: 'Fatma Abla\'ya ayda net', value: `+${tl(M.save)}`, ok: M.save > 0 },
            ]
          : []),
      ],
      bars: [
        { label: 'Tek başına', value: MARGIN, max: 3, unit: '₺/lt', on: false },
        { label: 'Senin kararın', value: M.perL, max: 3, unit: '₺/lt', on: true },
        { label: 'En iyi ayar', value: MARGIN + best / LITRES, max: 3, unit: '₺/lt', on: false },
      ],
      barsNote: 'Yem, süt maliyetinin yaklaşık üçte ikisi',
      lesson: stars >= 2 ? '[[olcek|ölçek ekonomisi]] ve sınırı' : undefined,
    }
  },
  Scene,
}
