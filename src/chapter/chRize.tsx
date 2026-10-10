// Özel bölüm — Rize, "Çay kotası" (yaş çay, ÇAYKUR kontenjanı). Rize'nin il sahnesinde oynar.
// Karar: ne kadarı elle (pahalı, kaliteli) toplansın, ne kadarı ÇAYKUR'a gönderilsin. Ders: kaliteli iş kotaya.
import { Bubble, CoinFlight, Crates, FloatMoney, Person, PriceTag, Truck } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { ilPlan } from '../scene/ilgen'
import { makeHeight } from '../scene/landgen'

type V3 = [number, number, number]

const P = 8000 // 🎲 Zeynep Hanım ve komşularının ilk sürgünü (kg), ≈ 20 dönüm × 400 kg
const KOTA = 5000 // 🎲 bu sürgünde ÇAYKUR kontenjanı (kg); ✅ kontenjan dekarda günlük 50 → 30 kg'a indi (Dünya)
const CAYKUR = 35 // ✅ 2026 yaş çay alım fiyatı (Habertürk)
const OZEL = 27 // ✅ kotaya giremeyen çayın özel sektör fiyatı (Cumhuriyet, 4.6.2026)
const GERI = 24 // ≈ kota dolunca geri dönen yaprak bekler, özele daha ucuza gider
const EL = 6 // ≈ elle toplama işçiliği ₺/kg
const MAKAS = 2.5 // ≈ makasla toplama ₺/kg
const KESINTI = 0.2 // ≈ makaslı yaprakta ÇAYKUR kalite kesintisi

const pct = (n: number) => `%${Math.round(n * 100)}`
const kg = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} kg`

export function rizeModel(p: Params) {
  const el = (p.el ?? 0) / 100
  const send = (p.caykur ?? 0) / 100
  const elToC = Math.min(el, send) * P // ÇAYKUR'a önce elle toplanan, kaliteli yaprak
  const makasToC = Math.max(0, send - el) * P
  const accEl = Math.min(elToC, KOTA)
  const accMakas = Math.min(makasToC, KOTA - accEl)
  const returned = elToC + makasToC - accEl - accMakas
  const toOzel = (1 - send) * P
  const kesinti = accMakas * CAYKUR * KESINTI
  const revenue = accEl * CAYKUR + accMakas * CAYKUR * (1 - KESINTI) + returned * GERI + toOzel * OZEL
  const labor = P * (el * EL + (1 - el) * MAKAS)
  const wastedHand = Math.max(0, el - send) * P // elle toplanıp özele giden: boşa işçilik
  return { el, send, accEl, accMakas, returned, toOzel, kesinti, revenue, labor, wastedHand, net: revenue - labor, sentKg: send * P }
}

// ── Sahne ───────────────────────────────────────────────────

const PLAN = ilPlan('Rize')
const height = makeHeight(PLAN.recipe)
const at = (x: number, z: number, dy = 0): V3 => [x, height(x, z) + dy, z]
const [VX, VZ] = PLAN.village
const TEA = PLAN.plots
  .filter((p) => p.urun === 'cay')
  .sort((a, b) => Math.hypot(a.x - VX, a.z - VZ) - Math.hypot(b.x - VX, b.z - VZ))
  .slice(0, 2)
const road = PLAN.recipe.road
const roadZ = (x: number) => {
  for (let i = 0; i < road.length - 1; i++) if (x >= road[i][0] && x <= road[i + 1][0]) return road[i][1] + ((x - road[i][0]) / (road[i + 1][0] - road[i][0])) * (road[i + 1][1] - road[i][1])
  return road[0][1]
}
const onRoad = (x: number): V3 => at(x, roadZ(x) + 0.35, 0.02)
const STOP_C = TEA[0].x + 1.5 // ÇAYKUR alım noktası
const STOP_O = TEA[0].x - 2.5 // özel fabrika kamyonu
const ZEYNEP: [number, number] = [TEA[0].x - TEA[0].w / 2 - 0.5, TEA[0].z]
const PILE: [number, number] = [TEA[0].x, roadZ(TEA[0].x) - 0.9]
const FAR = 20

function Scene({ step, k, params }: SceneProps) {
  const M = rizeModel(params)
  const say = (text: string) => <Bubble position={at(ZEYNEP[0], ZEYNEP[1], 1.25)}>{text}</Bubble>
  // toplayıcılar: elle toplayanlar (başörtülü), makasla toplayanlar (sırıklı)
  const workers = TEA.flatMap((p, pi) => [-0.35, 0, 0.35].map((dz, i) => ({ x: p.x - p.w / 4 + i * (p.w / 4), z: p.z + dz, n: pi * 3 + i })))
  const handCount = Math.round(workers.length * M.el)
  const picking = step === 'intro' || step === 'pick'
  const crates = step === 'pick' ? Math.round(seg(k, 0, 0.9) * 12) : step === 'deliver' ? Math.round((1 - seg(k, 0.3, 0.7)) * 12) : 0
  // ÇAYKUR kamyonu alım noktasına gelir, yüklenir, sağa gider; özel fabrika kamyonu sola
  const arrive = step === 'kantar' ? ease(seg(k, 0, 0.5)) : 1
  const leave = step === 'deliver' ? ease(seg(k, 0.7, 1)) : 0
  const showC = ['kantar', 'choose', 'pick', 'deliver'].includes(step)
  const xC = STOP_C + (FAR - STOP_C) * (1 - arrive) + (FAR - STOP_C) * leave
  const loadC = step === 'deliver' ? Math.round(seg(k, 0.3, 0.7) * 16 * Math.min(1, M.sentKg / P)) : 0
  const showO = step === 'deliver' && M.toOzel + M.returned > 0
  const xO = STOP_O - (STOP_O + FAR) * leave
  const loadO = step === 'deliver' ? Math.round(seg(k, 0.35, 0.7) * 12) : 0

  return (
    <group>
      {workers.map((w, i) => (
        <group key={i} scale={1.25} position={at(w.x, w.z)}>
          <Person position={[0, 0, 0]} anim={picking ? 'pick' : 'idle'} phase={i * 0.8} shirt={i < handCount ? '#3f8a5a' : '#8a7a5a'} scarf={i < handCount ? '#d0566a' : undefined} pole={i >= handCount} />
        </group>
      ))}
      <group scale={1.35} position={at(...ZEYNEP)}>
        <Person position={[0, 0, 0]} scarf="#2f6b8a" shirt="#6a4f7a" anim={step === 'deliver' && k > 0.75 && M.returned === 0 ? 'cheer' : 'idle'} />
      </group>
      {crates > 0 && <Crates position={at(...PILE)} n={crates} />}
      {showC && <Truck position={onRoad(xC)} yaw={step === 'kantar' && arrive < 1 ? Math.PI : 0} color="#2f7d4a" cargo={loadC} />}
      {showO && <Truck position={onRoad(xO)} yaw={Math.PI} color="#8c8a7e" cargo={loadO} />}

      {(step === 'kantar' || step === 'choose') && (
        <>
          <PriceTag position={[...onRoad(STOP_C)].map((v, i) => (i === 1 ? v + 1.2 : v)) as V3} text={`ÇAYKUR ${CAYKUR} ₺/kg · kota ${kg(KOTA)}`} />
          {step === 'kantar' && k > 0.4 && <PriceTag position={at(PILE[0] - 2, PILE[1], 1.4)} text={`Özel fabrika ${OZEL} ₺/kg, peşin`} />}
        </>
      )}
      {step === 'pick' && k > 0.3 && <PriceTag position={at(TEA[0].x, TEA[0].z, 1.5)} text={`Elle ${pct(M.el)} · makasla ${pct(1 - M.el)}`} />}
      {step === 'deliver' && k > 0.45 && M.returned > 0 && <PriceTag position={[...onRoad(STOP_C)].map((v, i) => (i === 1 ? v + 1.2 : v)) as V3} text={`Kota doldu: ${kg(M.returned)} geri döndü`} />}
      {step === 'deliver' && k > 0.45 && M.accMakas > 0 && M.returned === 0 && <PriceTag position={[...onRoad(STOP_C)].map((v, i) => (i === 1 ? v + 1.2 : v)) as V3} text={`Makaslı yaprakta ${pct(KESINTI)} kesinti`} />}

      {step === 'intro' && k > 0.1 && say('İlk sürgün geldi; yaprak taze, fiyat iyi.')}
      {step === 'kantar' && k > 0.55 && say('ÇAYKUR iyi verir ama kota dar.')}
      {step === 'pick' && k > 0.6 && say(M.el > 0.5 ? 'Elle toplamak pahalı ama yaprak temiz.' : 'Makasla hızlı biter, kalite düşer.')}
      {step === 'deliver' && k > 0.8 && say(M.returned > 0 ? 'Fazlası geri döndü, ucuza gitti.' : M.wastedHand > 0 ? 'Elle topladığımızı özele verdik…' : 'Her yaprak doğru yere gitti.')}

      {step === 'deliver' && k > 0.75 && <CoinFlight from={onRoad(STOP_C)} to={at(ZEYNEP[0], ZEYNEP[1], 1)} n={8} />}
      {step === 'deliver' && k > 0.8 && <FloatMoney position={at(ZEYNEP[0], ZEYNEP[1], 1.8)} amount={M.net} big />}
    </group>
  )
}

// ── Karar ───────────────────────────────────────────────────

const DECISION: Decision = {
  question: `İlk sürgün ${kg(P)}. Ne kadarı elle toplansın, ne kadarı ÇAYKUR'a gitsin? [[kontenjan|Kota]] ${kg(KOTA)}.`,
  controls: [
    { id: 'el', label: 'Elle toplama', min: 0, max: 100, step: 10, def: 0, format: (v) => `%${v} · işçilik ${tl(P * ((v / 100) * EL + (1 - v / 100) * MAKAS))}` },
    { id: 'caykur', label: "ÇAYKUR'a", min: 0, max: 100, step: 10, def: 0, format: (v) => `%${v} · ${kg((P * v) / 100)}` },
  ],
  meters: (p) => {
    const M = rizeModel(p)
    return [
      { label: `ÇAYKUR kotası ${kg(KOTA)}`, ok: M.returned === 0, text: M.returned === 0 ? 'sığıyor' : `${kg(M.returned)} geri döner` },
      { label: "ÇAYKUR'a giden makaslı yaprak", ok: M.accMakas === 0, text: M.accMakas === 0 ? 'yok' : `${kg(M.accMakas)} · kesinti` },
    ]
  },
  next: () => 'pick',
  predict: { question: "Sence ÇAYKUR'dan yaprak geri döner mi?", answer: (p) => rizeModel(p).returned > 0 },
}

const score = (p: Params) => rizeModel(p).net
const FLOOR = rizeModel({ el: 0, caykur: 0 }).net // hepsi makas, hepsi özel

export const chRize: ChapterDef = {
  id: 102,
  il: 'Rize',
  offset: [0, 0],
  title: 'Çay kotası',
  goal: 'Her yaprak en iyi fiyatına gitsin',
  crop: 'Yaş çay · ÇAYKUR',
  flow: {
    intro: { next: 'kantar', dur: 5 },
    kantar: { next: 'choose', dur: 5 },
    pick: { next: 'deliver', dur: 5.5 },
    deliver: { next: 'result', dur: 7 },
  },
  month: { intro: 'Mayıs', kantar: 'Mayıs', choose: 'Mayıs', pick: 'Mayıs', deliver: 'Haziran', result: 'Haziran' },
  shot: {
    intro: { f: [TEA[0].x, TEA[0].z], z: 1.6 },
    kantar: { f: [STOP_C - 1, roadZ(STOP_C)], z: 1.4 },
    choose: { f: [TEA[0].x, TEA[0].z + 0.8], z: 1.25 },
    pick: { f: [TEA[0].x, TEA[0].z], z: 1.5 },
    deliver: { f: [(STOP_C + STOP_O) / 2, roadZ(STOP_C)], z: 1.2 },
    result: { f: [TEA[0].x, TEA[0].z + 0.8], z: 1.15 },
  },
  lesson: 'kalite ve [[kontenjan|kota]]: kaliteli iş kotaya',
  icon: 'sack',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = rizeModel(p)
    const best = bestOf(DECISION, score)
    const stars = starsFor(M.net, best, FLOOR)
    return {
      good: stars >= 2,
      stars,
      caption: 'Zeynep Hanım ve komşularının eline geçen',
      value: tl(M.net),
      compare:
        M.returned > 0
          ? `Kotadan fazla gönderildi: ${kg(M.returned)} geri dönüp ucuza gitti`
          : M.accMakas > 0
            ? "Makaslı yaprak ÇAYKUR'a gitti, kalite kesintisi yedi"
            : M.wastedHand > 0
              ? 'Elle toplanan yaprağın bir kısmı özele gitti: işçilik boşa'
              : stars >= 3
                ? 'Kaliteli yaprak kotaya, gerisi makasla özele: tam yerinde'
                : 'Daha çoğu kotaya sığardı',
      chain: [
        { label: `Elle ${pct(M.el)}, makasla ${pct(1 - M.el)}`, value: `işçilik −${tl(M.labor)}` },
        { label: `ÇAYKUR kabul etti: ${kg(M.accEl + M.accMakas)}`, value: `+${tl((M.accEl + M.accMakas * (1 - KESINTI)) * CAYKUR)}`, ok: M.accMakas === 0 },
        ...(M.returned > 0 ? [{ label: `Kota doldu, geri dönen ${kg(M.returned)}`, value: `+${tl(M.returned * GERI)} (ucuza)`, ok: false }] : []),
        { label: `Özel fabrikaya ${kg(M.toOzel)}, peşin`, value: `+${tl(M.toOzel * OZEL)}`, ok: M.wastedHand === 0 },
      ],
      bars: [
        { label: 'Hepsi makas, hepsi özel', value: FLOOR, max: best, unit: '₺', on: false },
        { label: 'Senin kararın', value: M.net, max: best, unit: '₺', on: true },
        { label: 'En iyi ayar', value: best, max: best, unit: '₺', on: false },
      ],
      barsNote: `ÇAYKUR ${CAYKUR} ₺, özel ${OZEL} ₺; makaslı yaprakta %${KESINTI * 100} kesinti`,
      lesson: stars >= 2 ? 'kalite ve [[kontenjan|kota]]: kaliteli iş kotaya' : undefined,
    }
  },
  Scene,
}
