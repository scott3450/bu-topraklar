// Bölüm 5 — Hal ve sözleşme (domates). Karar: ürünün ne kadarı fabrikayla sözleşmeye bağlansın.
// Yaz gelince yıl iyi de olabilir kötü de; sözleşme kötü yılda borcu ödetir, iyi yılda kazancı kısar.
import { TOMATO } from '../sim/config'
import { CoinFlight, FloatMoney, Person, PriceTag, Truck } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { FAR, above, at, onRoad } from './road'
import { say } from './ch1'

const KG = TOMATO.decares * TOMATO.kgPerDecare
const HANDLE = TOMATO.pickCost + TOMATO.haulCost
const HAL_LOW = 4.0 // 🎲 kötü yıl: herkes aynı ay hale gelir, hal doyar
const HAL_HIGH = 11.0 // 🎲 iyi yıl
const COST = 750_000 // 🎲 fide, gübre, ilaç, su: sezon sonu bayiye borç (≈ dekara 25 bin ₺)
const CUT = TOMATO.commission + TOMATO.halFee + TOMATO.withholding
const halNet = (price: number) => price * (1 - CUT) - HANDLE
const CON_NET = TOMATO.factoryPrice - HANDLE
const f2 = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function ch5Model(p: Params) {
  const c = (p.soz ?? 0) / 100
  const good = (p.iyi ?? 0) > 0
  const con = KG * c * CON_NET
  const halBad = KG * (1 - c) * halNet(HAL_LOW)
  const halGood = KG * (1 - c) * halNet(HAL_HIGH)
  const bad = con + halBad - COST // borç ödendikten sonra kalan
  const fine = con + halGood - COST
  return { c, good, con, hal: good ? halGood : halBad, bad, fine, worstOk: bad >= 0, exp: (bad + fine) / 2, net: good ? fine : bad }
}

const HASAN: [number, number] = [2.6, 5.1]
const BOARD_X = 9.5
const STOP = 4.4

function Scene({ step, k, params }: SceneProps) {
  const M = ch5Model(params)
  type T = { x: number; dir: number; cargo: number; color: string }
  const trucks: T[] = []
  if (step === 'offer') {
    const come = ease(seg(k, 0, 0.45))
    trucks.push({ x: FAR - (FAR - STOP - 1) * come, dir: -1, cargo: 0, color: '#3f6b8a' })
  }
  if (step === 'choose') trucks.push({ x: STOP + 1, dir: -1, cargo: 0, color: '#3f6b8a' })
  if (step === 'grow') {
    const go = ease(seg(k, 0, 0.5))
    if (go < 1) trucks.push({ x: STOP + 1 + (FAR - STOP - 1) * go, dir: 1, cargo: 0, color: '#3f6b8a' })
  }
  // yazın bütün köy hale akar
  if (step === 'summer')
    for (let i = 0; i < 6; i++) {
      const t = seg(k, i * 0.1, i * 0.1 + 0.5)
      if (t > 0 && t < 1) trucks.push({ x: -FAR + 2 * FAR * t, dir: 1, cargo: 12, color: ['#8c8a7e', '#9a7b5a', '#7d8a6a'][i % 3] })
    }
  if (step === 'halSell') {
    const t = ease(seg(k, 0, 0.7))
    trucks.push({ x: STOP + (FAR - STOP) * t, dir: 1, cargo: Math.max(2, Math.round(14 * (1 - M.c))), color: '#8c8a7e' })
  }
  if (step === 'factory') {
    const come = ease(seg(k, 0, 0.35))
    const go = ease(seg(k, 0.6, 1))
    trucks.push({ x: go > 0 ? STOP + 1 + (FAR - STOP - 1) * go : FAR - (FAR - STOP - 1) * come, dir: go > 0 ? 1 : -1, cargo: Math.round(seg(k, 0.35, 0.6) * Math.max(2, 16 * M.c)), color: '#3f6b8a' })
  }
  const target = M.good ? HAL_HIGH : HAL_LOW
  const hal = step === 'summer' ? TOMATO.halPrice + (target - TOMATO.halPrice) * ease(seg(k, 0.15, 0.95)) : step === 'offer' || step === 'choose' ? TOMATO.halPrice : target
  const showBoard = ['offer', 'choose', 'summer', 'halSell', 'factory', 'result'].includes(step)
  const happy = (step === 'factory' && k > 0.5 && !M.good) || (step === 'halSell' && k > 0.5 && M.good)

  return (
    <group>
      <group scale={1.35} position={at(...HASAN)}>
        <Person position={[0, 0, 0]} shirt="#a0583f" anim={happy ? 'cheer' : 'idle'} />
      </group>
      {trucks.map((t, i) => (
        <Truck key={i} position={onRoad(t.x)} yaw={t.dir > 0 ? 0 : Math.PI} color={t.color} cargo={t.cargo} />
      ))}
      {showBoard && <PriceTag position={above(onRoad(BOARD_X), 1.6)} text={`Hal ${f2(hal)} ₺/kg`} />}
      {(step === 'offer' && k > 0.45) || step === 'choose' ? (
        <PriceTag position={above(onRoad(STOP + 1), 1.15)} text={`Fabrika ${f2(TOMATO.factoryPrice)} ₺/kg, sabit`} />
      ) : null}
      {step === 'grow' && k > 0.3 && <PriceTag position={at(HASAN[0], HASAN[1], 1.8)} text={`Bayiye borç ${tl(COST)}`} />}
      {step === 'halSell' && k > 0.3 && <PriceTag position={at(HASAN[0], HASAN[1], 1.6)} text="Komisyon %8 · Rüsum %1 · Stopaj %2" />}

      {step === 'intro' && k > 0.08 && say(HASAN, 'Geçen yaz domates yolda kaldı.')}
      {step === 'offer' && k > 0.55 && say(HASAN, 'Halde 12,50 diyorlar ama…')}
      {step === 'summer' && k > 0.55 && say(HASAN, M.good ? 'Bu yaz hal iyi!' : M.c > 0 ? 'Hal doldu, iyi ki sözleşme var.' : 'Hal doldu, fiyat düşüyor!')}
      {step === 'factory' && k > 0.5 && say(HASAN, M.good ? 'Sabit fiyat; bu yıl az kaldı.' : 'Fiyat düştü, bize dokunmadı.')}
      {step === 'halSell' && k > 0.75 && !M.good && say(HASAN, M.worstOk ? 'Borç çıktı, gerisi kâr.' : 'Bayi borcunu nasıl ödeyeceğim?')}

      {step === 'halSell' && k > 0.45 && <CoinFlight from={above(onRoad(BOARD_X), 1.2)} to={at(HASAN[0], HASAN[1], 1.0)} n={7} />}
      {step === 'factory' && k > 0.45 && <CoinFlight from={above(onRoad(STOP + 1), 0.6)} to={at(HASAN[0], HASAN[1], 1.0)} n={10} />}
      {step === 'halSell' && k > 0.55 && <FloatMoney position={at(HASAN[0], HASAN[1], 1.9)} amount={M.hal} big />}
      {step === 'factory' && k > 0.55 && <FloatMoney position={at(HASAN[0], HASAN[1], 1.9)} amount={M.con} big />}
    </group>
  )
}

const DECISION: Decision = {
  question: 'Domatesin ne kadarı fabrikayla [[sozlesmeli|sözleşmeye]] bağlansın? Kalanı yazın [[hal|hale]].',
  controls: [{ id: 'soz', label: 'Sözleşme', min: 0, max: 100, step: 10, def: 0, format: (v) => `%${v} · ${Math.round((KG * v) / 100_000).toLocaleString('tr-TR')} ton` }],
  meters: (p) => {
    const M = ch5Model(p)
    return [
      { label: `Kötü yıl (hal ${f2(HAL_LOW)}) · bayi borcu ${tl(COST)}`, ok: M.worstOk, text: M.worstOk ? `ödenir, ${tl(M.bad)} kalır` : `${tl(-M.bad)} eksik` },
      { label: `İyi yıl (hal ${f2(HAL_HIGH)})`, ok: true, text: `${tl(M.fine)} kalır` },
    ]
  },
  next: () => 'grow',
  roll: () => ({ iyi: Math.random() < 0.5 ? 1 : 0 }),
  predict: { question: 'Sence kötü yıl gelirse Hasan Dayı bayi borcunu ödeyebilir mi?', answer: (p) => ch5Model(p).worstOk },
}

// borcu kötü yılda bile ödeyen kararlar arasında beklenen kazanç
const score = (p: Params) => {
  const M = ch5Model(p)
  return M.worstOk ? M.exp : -Infinity
}

export const ch5: ChapterDef = {
  id: 5,
  title: 'Hal ve sözleşme',
  goal: 'Hasan Dayı fiyat kumarından çıksın',
  crop: 'Domates · risk',
  flow: {
    intro: { next: 'offer', dur: 4 },
    offer: { next: 'choose', dur: 5 },
    grow: { next: 'summer', dur: 4 },
    summer: { next: (_, p) => (ch5Model(p).c < 1 ? 'halSell' : 'factory'), dur: 6.5 },
    halSell: { next: (_, p) => (ch5Model(p).c > 0 ? 'factory' : 'result'), dur: 5 },
    factory: { next: 'result', dur: 5 },
  },
  month: { intro: 'Mart', offer: 'Mart', choose: 'Mart', grow: 'Haziran', summer: 'Temmuz', halSell: 'Ağustos', factory: 'Ağustos', result: 'Ağustos' },
  shot: {
    intro: { f: [2.8, 4.6], z: 1.9 },
    offer: { f: [4.4, 4.2], z: 1.5 },
    choose: { f: [4.6, 4.4], z: 1.5 },
    grow: { f: [4.4, 5.4], z: 1.6 },
    summer: { f: [5.0, 4.0], z: 1.0 },
    halSell: { f: [6.0, 4.2], z: 1.15 },
    factory: { f: [4.4, 4.6], z: 1.35 },
    result: { f: [4.4, 4.4], z: 1.1 },
  },
  valleyMonth: (s) => (['intro', 'offer', 'choose'].includes(s) ? 5 : s === 'grow' ? 8 : 9),
  lesson: '[[fiyat-riski|fiyat riskinden]] korunma',
  icon: 'contract',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = ch5Model(p)
    const best = bestOf(DECISION, score)
    const stars = M.worstOk ? Math.max(1, starsFor(M.exp, best, 0)) : 0
    const max = ch5Model({ soz: 0 }).fine
    return {
      good: stars >= 2,
      stars,
      caption: `${M.good ? 'İyi' : 'Kötü'} yıl · borç ödendikten sonra kalan`,
      value: tl(M.net),
      compare: !M.worstOk
        ? M.good
          ? 'Bu yıl şans yaver gitti; kötü yıl gelseydi borç ödenemeyecekti'
          : 'Hal çöktü, bayi borcu ödenemedi'
        : stars >= 2
          ? 'Kötü yılda bile borç ödeniyor, iyi yılın kazancı da büyük ölçüde duruyor'
          : 'Güvendesin ama fazla bağladın: iyi yılın kazancından vazgeçtin',
      chain: [
        { label: `%${Math.round(M.c * 100)} [[sozlesmeli|sözleşmeyle]] fabrikaya`, value: `+${tl(M.con)}`, ok: true },
        { label: `Kalanı hale · ${M.good ? 'iyi' : 'kötü'} yıl (${f2(M.good ? HAL_HIGH : HAL_LOW)} ₺)`, value: `+${tl(M.hal)}`, ok: M.good },
        { label: 'Bayi borcu', value: `−${tl(COST)}`, ok: M.net >= 0 },
      ],
      bars: [
        { label: `Kötü yıl (hal ${f2(HAL_LOW)})`, value: M.bad, max, unit: '₺', on: !M.good },
        { label: `İyi yıl (hal ${f2(HAL_HIGH)})`, value: M.fine, max, unit: '₺', on: M.good },
      ],
      barsNote: 'Halde kesinti: [[komisyon|komisyon]] %8, [[rusum|rüsum]] %1, [[stopaj|stopaj]] %2. Hangi yılın geleceği önceden bilinmez.',
      lesson: stars >= 2 ? '[[fiyat-riski|fiyat riskinden]] korunma' : undefined,
    }
  },
  Scene,
}
