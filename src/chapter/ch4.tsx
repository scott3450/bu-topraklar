// Bölüm 4 — Güven (çam balı, analiz). Karar: kaç arıcı birlikte satsın, analiz yaptırılsın mı.
// Analiz sabit bir masraftır: paylaşan çoğaldıkça ucuzlar, ama belgeli balın alıcısı sınırlıdır.
import { HONEY, INVEST } from '../sim/config'
import { Bidons, CoinFlight, FloatMoney, Person, PriceTag, Truck } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { FAR, above, at, onRoad } from './road'
import { say } from './ch1'

const KG_EACH = HONEY.hives * HONEY.kgPerHive
const TIN = 27 // kg, bir teneke
const ANALYSIS = INVEST.analiz.cost
const BUYER_CAP = 6000 // 🎲 belgeli balı alan toptancı bu yıl en fazla bu kadar kg alır
const TRADER_EACH = KG_EACH * HONEY.traderPrice
const tin = (perKg: number) => Math.round((perKg * TIN) / 100) * 100
const kg = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} kg`

export function ch4Model(p: Params) {
  const n = Math.round(p.arici ?? 1)
  const lab = (p.analiz ?? 0) > 0
  const total = n * KG_EACH
  const toBuyer = lab ? Math.min(total, BUYER_CAP) : 0
  const rest = total - toBuyer // tüccara giden
  const money = toBuyer * HONEY.coopPrice + rest * HONEY.traderPrice - (lab ? ANALYSIS : 0)
  return { n, lab, total, toBuyer, rest, money, each: money / n, share: lab ? ANALYSIS / n : 0 }
}

const MEHMET: [number, number] = [-5.1, -2.9]
const HELPERS: [number, number][] = [[-7.0, -3.3], [-6.1, -4.7]]
const PILE: [number, number] = [-6.4, 2.7]
const STOP = -5.4

type T = { x: number; dir: number; cargo: number; color: string }

function Scene({ step, k, params }: SceneProps) {
  const M = ch4Model(params)
  const own = 6 // Mehmet Amca'nın kendi tenekeleri (görsel ölçek)
  const group = Math.min(24, own * M.n)
  const left = Math.round(group * (M.rest / M.total))
  let tins = 0
  if (step === 'stack') tins = Math.round(k * own)
  if (['trader', 'choose'].includes(step)) tins = own
  if (step === 'sell') tins = Math.round((1 - seg(k, 0, 0.3)) * own)
  if (step === 'lab') tins = own + Math.round(seg(k, 0, 0.4) * (group - own)) // diğer arıcılar balını getirir
  if (step === 'buyer') tins = group - Math.round(seg(k, 0.4, 0.6) * (group - left))
  if (step === 'pay' || (step === 'result' && M.lab)) tins = left

  const trucks: T[] = []
  if (step === 'trader') trucks.push({ x: -FAR + (STOP - 0.6 + FAR) * ease(seg(k, 0, 0.6)), dir: 1, cargo: 0, color: '#8c8a7e' })
  if (step === 'choose') trucks.push({ x: STOP - 0.6, dir: 1, cargo: 0, color: '#8c8a7e' })
  if (step === 'sell') {
    const g = ease(seg(k, 0.3, 0.8))
    trucks.push({ x: STOP - 0.6 - (STOP - 0.6 + FAR) * g, dir: g > 0 ? -1 : 1, cargo: Math.round(seg(k, 0, 0.3) * 16), color: '#8c8a7e' })
  }
  if (step === 'lab') {
    const leaveT = ease(seg(k, 0, 0.5))
    const come = ease(seg(k, 0.2, 0.6))
    const go = ease(seg(k, 0.8, 1))
    trucks.push({ x: go > 0 ? STOP + 1 + (FAR - STOP - 1) * go : FAR - (FAR - STOP - 1) * come, dir: go > 0 ? 1 : -1, cargo: 0, color: '#eef0ea' })
    if (leaveT < 1) trucks.push({ x: STOP - 0.6 - (STOP - 0.6 + FAR) * leaveT, dir: -1, cargo: 0, color: '#8c8a7e' })
  }
  if (step === 'buyer') {
    const come = ease(seg(k, 0, 0.4))
    const go = ease(seg(k, 0.62, 1))
    trucks.push({ x: go > 0 ? STOP + 1 + (FAR - STOP - 1) * go : FAR - (FAR - STOP - 1) * come, dir: go > 0 ? 1 : -1, cargo: Math.round(seg(k, 0.4, 0.6) * 16), color: '#1f8a8c' })
  }

  const working = step === 'harvest'
  const happy = step === 'pay' && M.each > TRADER_EACH
  return (
    <group>
      <group scale={1.35} position={at(...MEHMET)}>
        <Person position={[0, 0, 0]} shirt="#8a6a3f" anim={working ? 'pick' : happy ? 'cheer' : 'idle'} />
      </group>
      {working &&
        HELPERS.map(([x, z], i) => (
          <group key={i} scale={1.3} position={at(x, z)}>
            <Person position={[0, 0, 0]} shirt={['#5f7a4a', '#3f6b8a'][i]} anim="pick" phase={i + 1} />
          </group>
        ))}
      {tins > 0 && <Bidons position={at(...PILE)} n={tins} color="#c9ccc6" />}
      {trucks.map((t, i) => (
        <Truck key={i} position={onRoad(t.x)} yaw={t.dir > 0 ? 0 : Math.PI} color={t.color} cargo={t.cargo} />
      ))}

      {step === 'stack' && k > 0.4 && <PriceTag position={at(PILE[0] + 0.5, PILE[1], 1.0)} text={`Arıcı başına ${kg(KG_EACH)} bal`} />}
      {((step === 'trader' && k > 0.6) || step === 'choose') && (
        <PriceTag position={above(onRoad(STOP - 0.6), 1.1)} text={`${tin(HONEY.traderPrice).toLocaleString('tr-TR')} ₺/teneke`} />
      )}
      {step === 'lab' && k > 0.55 && <PriceTag position={at(PILE[0] + 0.5, PILE[1], 1.2)} text={`${M.n} arıcı · analiz: gerçek çam balı ✓`} />}
      {step === 'buyer' && k > 0.3 && <PriceTag position={above(onRoad(STOP + 1), 1.15)} text={`${tin(HONEY.coopPrice).toLocaleString('tr-TR')} ₺/teneke · en fazla ${kg(BUYER_CAP)}`} />}
      {step === 'pay' && M.rest > 0 && <PriceTag position={at(PILE[0] + 0.5, PILE[1], 1.2)} text={`Kalan ${kg(M.rest)} tüccara`} />}

      {step === 'intro' && k > 0.08 && say(MEHMET, 'Tüccar "sahte olabilir" diyor.')}
      {step === 'trader' && k > 0.62 && say(MEHMET, 'Sahte balla aynı fiyat!')}
      {step === 'sell' && k > 0.72 && say(MEHMET, 'Emeğimiz sahteyle bir…')}
      {step === 'pay' && k > 0.35 && say(MEHMET, happy ? 'Balımız artık belgeli!' : 'Analiz parası tek başıma ağır geldi.')}

      {step === 'sell' && k > 0.35 && <CoinFlight from={above(onRoad(STOP - 0.6), 0.6)} to={at(PILE[0], PILE[1], 0.6)} />}
      {step === 'pay' && k > 0.02 && <CoinFlight from={above(onRoad(STOP + 3), 0.6)} to={at(PILE[0], PILE[1], 0.6)} n={12} />}
      {step === 'sell' && k > 0.5 && <FloatMoney position={at(PILE[0], PILE[1], 1.3)} amount={M.money} big />}
      {step === 'lab' && k > 0.6 && <FloatMoney position={at(PILE[0] + 0.8, PILE[1], 1.1)} amount={-ANALYSIS} />}
      {step === 'pay' && k > 0.08 && <FloatMoney position={at(PILE[0], PILE[1], 1.3)} amount={Math.round(M.each)} big />}
    </group>
  )
}

const DECISION: Decision = {
  question: `Analiz ${tl(ANALYSIS)}, bir [[sabit-masraf|sabit masraf]]. Kaç arıcı birlikte satsın, analiz yaptırılsın mı?`,
  controls: [
    { id: 'arici', label: 'Arıcı', min: 1, max: 5, step: 1, def: 1, format: (v) => `${v} · ${kg(v * KG_EACH)}` },
    { id: 'analiz', label: 'Analiz yaptır', min: 0, max: 1, step: 1, def: 0, toggle: true, format: (v) => (v ? 'evet' : 'hayır') },
  ],
  meters: (p) => {
    const M = ch4Model(p)
    const premium = KG_EACH * (HONEY.coopPrice - HONEY.traderPrice)
    return [
      M.lab
        ? { label: 'Arıcı başına analiz payı', ok: M.share < premium, text: tl(M.share) }
        : { label: '[[belge|Kalite belgesi]]', ok: false, text: 'yok, tüccar fiyatı' },
      { label: `Belgeli balın alıcısı en fazla ${kg(BUYER_CAP)}`, ok: M.total <= BUYER_CAP, text: M.total <= BUYER_CAP ? kg(M.total) : `${kg(M.total - BUYER_CAP)} fazla` },
    ]
  },
  next: (p) => ((p.analiz ?? 0) > 0 ? 'lab' : 'sell'),
  predict: { question: 'Sence arıcı başına tüccarın vereceğinden fazla kalır mı?', answer: (p) => ch4Model(p).each > TRADER_EACH },
}

const score = (p: Params) => ch4Model(p).each

export const ch4: ChapterDef = {
  id: 4,
  title: 'Güven',
  goal: 'Bal hak ettiği fiyata satılsın',
  crop: 'Çam balı · analiz',
  flow: {
    intro: { next: 'harvest', dur: 4 },
    harvest: { next: 'stack', dur: 5 },
    stack: { next: 'trader', dur: 3.5 },
    trader: { next: 'choose', dur: 5.5 },
    sell: { next: 'result', dur: 5.5 },
    lab: { next: 'buyer', dur: 5 },
    buyer: { next: 'pay', dur: 5 },
    pay: { next: 'result', dur: 4 },
  },
  month: { intro: 'Eylül', harvest: 'Eylül', stack: 'Ekim', trader: 'Ekim', choose: 'Ekim', sell: 'Ekim', lab: 'Ekim', buyer: 'Kasım', pay: 'Kasım', result: 'Kasım' },
  shot: {
    intro: { f: [-5.4, -3.0], z: 1.9 },
    harvest: { f: [-6.2, -3.8], z: 1.6 },
    stack: { f: [-6.0, 2.4], z: 1.7 },
    trader: { f: [-7.0, 2.8], z: 1.35 },
    choose: { f: [-5.8, 2.6], z: 1.5 },
    sell: { f: [-8.0, 3.0], z: 1.15 },
    lab: { f: [-4.8, 2.8], z: 1.3 },
    buyer: { f: [-4.0, 2.9], z: 1.2 },
    pay: { f: [-6.0, 2.6], z: 1.5 },
    result: { f: [-5.6, 1.0], z: 1.1 },
  },
  valleyMonth: () => 0,
  lesson: '[[belge|kalite belgesi]] ve paylaşılan [[sabit-masraf|sabit masraf]]',
  icon: 'lab',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = ch4Model(p)
    const best = bestOf(DECISION, score)
    const stars = starsFor(M.each, best, TRADER_EACH)
    const per = (v: number) => Math.round(v / KG_EACH)
    return {
      good: stars >= 2,
      stars,
      caption: 'Arıcı başına eline geçen',
      value: tl(M.each),
      compare: !M.lab
        ? 'Belgesiz bal, sahteyle aynı fiyata gitti'
        : M.each <= TRADER_EACH
          ? `Analiz parası az kişiye bölündü: tüccardan ${tl(TRADER_EACH - M.each)} az`
          : M.rest > 0
            ? `Alıcının almadığı ${kg(M.rest)} tüccara gitti`
            : `Tüccara vermekten ${tl(M.each - TRADER_EACH)} fazla`,
      chain: M.lab
        ? [
            { label: `Analiz ${tl(ANALYSIS)} ÷ ${M.n} arıcı`, value: `kişi başı ${tl(M.share)}`, ok: M.share < KG_EACH * (HONEY.coopPrice - HONEY.traderPrice) },
            { label: `Belgeli satış ${kg(M.toBuyer)}`, value: `+${tl(M.toBuyer * HONEY.coopPrice)}`, ok: true },
            ...(M.rest > 0 ? [{ label: `Alıcı sınırını aşan ${kg(M.rest)} tüccara`, value: `+${tl(M.rest * HONEY.traderPrice)}`, ok: false }] : []),
            { label: 'Arıcı başına net', value: tl(M.each), ok: M.each > TRADER_EACH },
          ]
        : [{ label: `Belgesiz ${kg(M.total)} tüccara`, value: tl(M.money), ok: false }],
      bars: [
        { label: 'Tüccar', value: per(TRADER_EACH), max: 220, unit: '₺/kg', on: false },
        { label: 'Senin kararın', value: per(M.each), max: 220, unit: '₺/kg', on: true },
        { label: 'En iyi ayar', value: per(best), max: 220, unit: '₺/kg', on: false },
      ],
      barsNote: `Belgeli alım ${tin(HONEY.coopPrice).toLocaleString('tr-TR')} ₺/teneke · tüccar ${tin(HONEY.traderPrice).toLocaleString('tr-TR')} ₺/teneke`,
      lesson: stars >= 2 ? '[[belge|kalite belgesi]] ve paylaşılan [[sabit-masraf|sabit masraf]]' : undefined,
    }
  },
  Scene,
}
