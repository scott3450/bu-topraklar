// Özel bölüm — Erzurum, "Uzun kış" (hayvancılık, kışlık yem). Erzurum'un il sahnesinde oynar.
// Karar: kışa kaç hayvan girsin (kalanı sonbaharda satılır), ne kadar ot stoklansın. Kışın uzunluğu şansa bağlı;
// yıldız beklenen değerden. Ders: stok ve kışın uzunluğuna göre plan.
import { Bubble, FloatMoney, Person, PriceTag, Truck } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { ilPlan } from '../scene/ilgen'
import { makeHeight } from '../scene/landgen'
import { Cow } from '../scene/Valley'
import { HAY_AUTUMN, HAY_NEED, HAY_WINTER, WINTER_MONTHS } from '../data/aileler'

type V3 = [number, number, number]

const N = 100 // 🎲 Yusuf Amca ve komşularının hayvanı (baş)
const KG = 420 // ≈ canlı ağırlık
const AUTUMN = 360 // ≈ ₺/kg canlı, sonbaharda herkes satarken
const SPRING = 413 // ✅ Erzurum kurbanlık canlı ağırlık 413 ₺/kg (2026)
const FORCED = 300 // ≈ şubatta otu biten hayvanını satar
const OWN = 150_000 // 🎲 köyün çayırından biçilen ot (kg)
const OWN_COST = 3 // ≈ biçme ve balyalama ₺/kg
const BUDGET = 600_000 // 🎲 kooperatifin kışa ayırdığı para
const LEFTOVER = 2 // ≈ baharda artan otun değeri ₺/kg
const WS = Object.entries(WINTER_MONTHS).map(([w, p]) => [Number(w), p] as const)

const tons = (kg: number) => `${Math.round(kg / 1000).toLocaleString('tr-TR')} ton`
const MONTHS = ['Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs']

/** Bir kış (w ay) için sonuç. */
function winter(kis: number, stok: number, w: number) {
  const cost = Math.min(stok, OWN) * OWN_COST + Math.max(0, stok - OWN) * HAY_AUTUMN
  const cash = BUDGET - cost
  const need = kis * HAY_NEED * w
  const short = Math.max(0, need - stok)
  const buy = Math.min(short, Math.max(0, cash) / HAY_WINTER)
  const unpaid = short - buy
  const forced = unpaid > 0 ? Math.min(kis, unpaid / (HAY_NEED * 3)) : 0 // otu bitince kalan üç ayın ihtiyacı kadar hayvan satılır
  const left = Math.max(0, stok - need)
  const value = (N - kis) * KG * AUTUMN + (kis - forced) * KG * SPRING + forced * KG * FORCED + left * LEFTOVER - cost - buy * HAY_WINTER
  return { cost, need, short, buy, forced, left, value }
}

export function erzurumModel(p: Params) {
  const kis = p.kis ?? 100
  const stok = (p.stok ?? 0) * 1000
  const r = p.u ?? 0.5 // şans: kışın uzunluğu
  let acc = 0
  const w = WS.find(([, pr]) => r < (acc += pr))?.[0] ?? WS[WS.length - 1][0]
  const actual = winter(kis, stok, w)
  const expected = WS.reduce((a, [m, pr]) => a + pr * winter(kis, stok, m).value, 0)
  const cost = actual.cost
  return { kis, stok, w, ...actual, expected, safe: cost <= BUDGET, sold: N - kis }
}
const FLOOR = erzurumModel({ kis: 100, stok: 0 }).expected // hepsi kışa, stoksuz

// ── Sahne ───────────────────────────────────────────────────

const PLAN = ilPlan('Erzurum')
const height = makeHeight(PLAN.recipe)
const at = (x: number, z: number, dy = 0): V3 => [x, height(x, z) + dy, z]
const road = PLAN.recipe.road
const roadZ = (x: number) => {
  for (let i = 0; i < road.length - 1; i++) if (x >= road[i][0] && x <= road[i + 1][0]) return road[i][1] + ((x - road[i][0]) / (road[i + 1][0] - road[i][0])) * (road[i + 1][1] - road[i][1])
  return road[0][1]
}
const onRoad = (x: number): V3 => at(x, roadZ(x) + 0.35, 0.02)
// ahır: köyden uzak, yolun kuzeyinde, mera parseli ile dere arasındaki boşlukta (Erzurum planı: x -6…0 boş, dere x≈0,5)
const BARN: [number, number] = [-2.8, roadZ(-2.8) - 1.3]
const HAY: [number, number] = [BARN[0] + 1.7, BARN[1] + 0.1] // ahırın doğusunda
const PEN: [number, number] = [BARN[0] - 0.9, BARN[1] - 1.5] // ağıl, ahırın kuzeyinde
const YUSUF: [number, number] = [BARN[0] - 0.4, roadZ(BARN[0]) - 0.55]
const STOP = BARN[0] + 3.6 // celep kamyonu, ot kamyonu
const FAR = 20
const YAYLA: [number, number] = [BARN[0] - 3, BARN[1] - 8] // kuzeyde yayla
const up = (q: V3, dy: number): V3 => [q[0], q[1] + dy, q[2]]

/** Ahır: taş duvar, toprak dam (Doğu Anadolu ahırı alçak ve geniştir). */
function Barn({ snow }: { snow: boolean }) {
  const [x, y, z] = at(...BARN)
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.6, 1.1]} />
        <meshStandardMaterial color="#8d7f6c" />
      </mesh>
      <mesh position={[0, 0.64, 0]} castShadow>
        <boxGeometry args={[1.95, 0.08, 1.25]} />
        <meshStandardMaterial color={snow ? '#f3f4f6' : '#6c5a43'} />
      </mesh>
      <mesh position={[0, 0.22, 0.56]}>
        <boxGeometry args={[0.36, 0.44, 0.02]} />
        <meshStandardMaterial color="#3f3326" />
      </mesh>
    </group>
  )
}

/** Ot yığını: stokun tonuna göre balya sayısı; kış ilerledikçe azalır. */
function HayStack({ amount, snow }: { amount: number; snow: boolean }) {
  const n = Math.max(0, Math.round(amount))
  const [x, y, z] = at(...HAY)
  return (
    <group position={[x, y, z]}>
      {Array.from({ length: n }, (_, i) => {
        const row = Math.floor(i / 12)
        const j = i % 12
        return (
          <mesh key={i} position={[(j % 4) * 0.28 - 0.42, 0.09 + row * 0.18, Math.floor(j / 4) * 0.22 - 0.22]} castShadow>
            <boxGeometry args={[0.26, 0.17, 0.2]} />
            <meshStandardMaterial color={snow && row === Math.floor((n - 1) / 12) ? '#eef0f2' : '#c9b26a'} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Kar: düşen taneler. */
function Snow({ k }: { k: number }) {
  return (
    <group>
      {Array.from({ length: 40 }, (_, i) => {
        const x = BARN[0] - 4 + ((i * 37) % 80) / 10
        const z = BARN[1] - 2 + ((i * 53) % 50) / 10
        const fall = ((k * 3 + i * 0.137) % 1) * 2.5
        return (
          <mesh key={i} position={at(x, z, 2.6 - fall)}>
            <sphereGeometry args={[0.035, 4, 3]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        )
      })}
    </group>
  )
}

function Scene({ step, k, params }: SceneProps) {
  const M = erzurumModel(params)
  const say = (text: string) => <Bubble position={at(YUSUF[0], YUSUF[1], 1.25)}>{text}</Bubble>
  const decided = ['kis', 'bahar', 'result'].includes(step)
  const winterStep = step === 'kis'
  // ot: balya başına ~4 ton; kışta ihtiyaç kadarı eriyor, biterse kamyonla pahalı ot gelir
  const BALE = 4000
  const used = winterStep ? Math.min(M.stok, M.need * seg(k, 0.05, 0.85)) : decided ? Math.min(M.stok, M.need) : 0
  const stack = step === 'intro' ? 0 : step === 'ot' ? (40 * seg(k, 0.1, 0.8)) : decided ? (M.stok - used) / BALE : 40
  const month = Math.min(M.w - 1, Math.floor(seg(k, 0.05, 0.85) * M.w)) // Kasım'dan başlar, kışın son ayında durur
  const empty = winterStep && M.short > 0 && M.stok - used <= 1
  // inekler: yayladan iner, kışta ahırda (görünmez), baharda çıkar; satılanlar celebe
  const herd = 6
  const down = step === 'intro' ? ease(seg(k, 0, 0.8)) : 1
  const kept = Math.round((herd * M.kis) / N)
  const showCows = step === 'intro' || step === 'ot' || step === 'choose' || step === 'bahar'
  const cowsVisible = step === 'bahar' ? Math.max(0, Math.round((herd * (M.kis - M.forced)) / N)) : step === 'intro' || step === 'ot' || step === 'choose' ? herd : kept
  const arrive = step === 'ot' ? ease(seg(k, 0.3, 0.7)) : 1

  return (
    <group>
      <Barn snow={winterStep} />
      <HayStack amount={stack} snow={winterStep} />
      {winterStep && <Snow k={k} />}
      {showCows &&
        Array.from({ length: cowsVisible }, (_, i) => {
          const tx = PEN[0] + (i % 3) * 1.05
          const tz = PEN[1] - Math.floor(i / 3) * 0.9 - (step === 'bahar' ? 1.2 : 0)
          const x = YAYLA[0] + (tx - YAYLA[0]) * down
          const z = YAYLA[1] + (tz - YAYLA[1]) * down
          return <Cow key={i} position={at(x, z)} rotation={step === 'intro' && down < 1 ? Math.PI / 2 : (i % 2) * 0.3} />
        })}
      <group scale={1.35} position={at(...YUSUF)}>
        <Person position={[0, 0, 0]} shirt="#5a4a3a" anim={step === 'bahar' && k > 0.6 && M.forced === 0 ? 'cheer' : 'idle'} />
      </group>
      {step === 'ot' && <Truck position={onRoad(STOP + (FAR - STOP) * (1 - arrive))} yaw={Math.PI} color="#8c8a7e" />}
      {empty && <Truck position={onRoad(STOP + (FAR - STOP) * (1 - ease(seg(k, 0.6, 0.8))))} yaw={Math.PI} color={M.forced > 0 ? '#8c8a7e' : '#c9a24a'} cargo={M.forced > 0 ? 0 : 8} />}

      {step === 'ot' && k > 0.6 && <PriceTag position={up(onRoad(STOP), 1.3)} text={`Celep: ${AUTUMN} ₺/kg canlı · herkes satıyor`} />}
      {step === 'ot' && k > 0.35 && <PriceTag position={at(HAY[0], HAY[1], 1.2)} text={`Çayırdan ot ${OWN_COST} ₺/kg · fazlası ${HAY_AUTUMN.toLocaleString('tr-TR')} ₺`} />}
      {winterStep && <PriceTag position={at(HAY[0], HAY[1], 1.4)} text={empty ? (M.forced > 0 ? `${MONTHS[month]} · ot bitti, para da` : `${MONTHS[month]} · ot ${HAY_WINTER.toLocaleString('tr-TR')} ₺/kg'dan alınıyor`) : `${MONTHS[month]} · ${tons(Math.max(0, M.stok - used))} ot kaldı`} />}
      {step === 'bahar' && k > 0.3 && <PriceTag position={up(onRoad(STOP), 1.3)} text={`Bahar: ${SPRING} ₺/kg canlı`} />}

      {step === 'intro' && k > 0.2 && say('Yayladan indik. Kış altı ay, bazen yedi.')}
      {step === 'ot' && k > 0.75 && say('Herkes şimdi satıyor, celep fiyatı kırıyor.')}
      {winterStep && k > 0.5 && say(M.forced > 0 ? 'Ot bitti, hayvanı yok pahasına veriyoruz.' : M.short > 0 ? 'Kış uzadı, ot pahalı.' : 'Ahır sıcak, ot yetiyor.')}
      {step === 'bahar' && k > 0.7 && <FloatMoney position={up(onRoad(STOP + 1), 1.2)} amount={M.value} big />}
    </group>
  )
}

// ── Karar ───────────────────────────────────────────────────

const DECISION: Decision = {
  question: `${N} hayvan yayladan indi. Kaçı kışa girsin (gerisi celebe), ne kadar [[kislik|kışlık ot]] stoklansın? Kasada ${tl(BUDGET)}.`,
  controls: [
    { id: 'kis', label: 'Kışa giren', min: 40, max: 100, step: 10, def: 100, format: (v) => `${v} baş · ${N - v} satılır` },
    { id: 'stok', label: 'Ot stoğu', min: 0, max: 250, step: 25, def: 100, format: (v) => `${v} ton` },
  ],
  meters: (p) => {
    const M = erzurumModel(p)
    return [
      { label: `Kasa ${tl(BUDGET)}`, ok: M.safe, text: M.safe ? `kışa ${tl(BUDGET - M.cost)} kalır` : `${tl(M.cost - BUDGET)} eksik` },
      { label: 'Altı aylık ihtiyaç', text: tons(M.kis * HAY_NEED * 6) },
    ]
  },
  next: () => 'kis',
  roll: () => ({ u: Math.random() }),
  predict: { question: 'Sence ot bahara kadar yeter mi?', answer: (p) => erzurumModel(p).short === 0 },
}

const score = (p: Params) => {
  const M = erzurumModel(p)
  return M.safe ? M.expected : -Infinity
}

export const chErzurum: ChapterDef = {
  id: 107,
  il: 'Erzurum',
  offset: [0, 0],
  title: 'Uzun kış',
  goal: 'Hayvanlar bahara ot bitmeden çıksın',
  crop: 'Hayvancılık · kışlık yem',
  flow: {
    intro: { next: 'ot', dur: 5.5 },
    ot: { next: 'choose', dur: 6 },
    kis: { next: 'bahar', dur: 8 },
    bahar: { next: 'result', dur: 6 },
  },
  month: { intro: 'Eylül', ot: 'Ekim', choose: 'Ekim', kis: 'Kış', bahar: 'Mayıs', result: 'Mayıs' },
  shot: {
    intro: { f: [BARN[0] - 1.5, BARN[1] - 1], z: 1.6 },
    ot: { f: [BARN[0], roadZ(BARN[0])], z: 1.35 },
    choose: { f: [BARN[0], BARN[1] + 0.5], z: 1.3 },
    kis: { f: [BARN[0], BARN[1]], z: 1.45 },
    bahar: { f: [BARN[0] + 0.5, roadZ(BARN[0])], z: 1.3 },
    result: { f: [BARN[0], BARN[1] + 0.5], z: 1.15 },
  },
  lesson: '[[kislik|kışlık yem]]: uzun kışa göre stok',
  icon: 'sack',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = erzurumModel(p)
    const best = bestOf(DECISION, score)
    const stars = M.safe ? starsFor(M.expected, best, FLOOR) : 0
    return {
      good: stars >= 2,
      stars,
      caption: 'Yusuf Amca ve komşularının eline geçen',
      value: tl(M.value),
      compare: !M.safe
        ? `Kasa yetmedi: ${tl(M.cost - BUDGET)} eksik`
        : M.forced > 0
          ? `Ot bitti: ${Math.round(M.forced)} hayvan şubatta ucuza satıldı`
          : M.short > 0 && stars < 3
            ? `Kış ${M.w} ay sürdü, eksik ot ${HAY_WINTER.toLocaleString('tr-TR')} ₺'den alındı`
            : M.kis <= 50
              ? 'Çoğu hayvan sonbaharda ucuza satıldı; bahar fiyatı kaçtı'
              : stars >= 3
                ? `Uzun kışı da karşılayan stok, kasanın yettiği kadar hayvan (bu kış ${M.w} ay)`
                : 'Biraz daha iyisi mümkündü',
      chain: [
        { label: `Sonbaharda celebe ${M.sold} baş · ${AUTUMN} ₺/kg`, value: `+${tl(M.sold * KG * AUTUMN)}` },
        { label: `${tons(M.stok)} ot stoklandı`, value: `−${tl(M.cost)}`, ok: M.safe },
        { label: `Kış ${M.w} ay · ihtiyaç ${tons(M.need)}`, value: M.short > 0 ? `${tons(M.short)} eksik` : `${tons(M.left)} arttı`, ok: M.short === 0 },
        { label: `Baharda ${Math.round(M.kis - M.forced)} baş · ${SPRING} ₺/kg`, value: M.forced > 0 ? `${Math.round(M.forced)} baş şubatta ${FORCED} ₺'den` : 'hepsi sağ salim', ok: M.forced === 0 },
      ],
      bars: [
        { label: 'Hepsi kışa, stoksuz (ortalama)', value: FLOOR, max: best, unit: '₺', on: false },
        { label: 'Senin kararın (ortalama)', value: M.expected, max: best, unit: '₺', on: true },
        { label: 'En iyi ayar', value: best, max: best, unit: '₺', on: false },
      ],
      barsNote: `Sonbahar ${AUTUMN} ₺/kg, bahar ${SPRING} ₺/kg canlı; ot çayırdan ${OWN_COST} ₺, sonbaharda ${HAY_AUTUMN.toLocaleString('tr-TR')} ₺, kışın ${HAY_WINTER.toLocaleString('tr-TR')} ₺; kış 5–7 ay`,
      lesson: stars >= 2 ? '[[kislik|kışlık yem]]: uzun kışa göre stok' : undefined,
    }
  },
  Scene,
}
