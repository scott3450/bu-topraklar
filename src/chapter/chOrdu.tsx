// Özel bölüm — Ordu, "Randıman" (fındık, TMO). Ordu'nun il sahnesinde oynar.
// Karar: harmanda ne kadar ayıklansın, ne kadarı tüccara peşin gitsin. Ders: kalite primi ve nakit ihtiyacı birlikte.
import { Bubble, CoinFlight, FloatMoney, Person, PriceTag, Truck } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { ilPlan } from '../scene/ilgen'
import { makeHeight } from '../scene/landgen'

type V3 = [number, number, number]

const P = 6000 // 🎲 Kâzım Amca ve komşularının kabuklu fındığı (kg), ≈ 60 dönüm × 100 kg
const TMO = 250 // ✅ TMO 2026/27 Levant kalite, %50 randıman esaslı
const PRIM = 5 // ✅ %50'nin üstündeki her randıman puanı için ₺/kg (altında aynı oranda düşülür ≈)
const TUCCAR = 200 // ✅ serbest piyasa ~200 ₺ (Levant, 50 randıman); tüccar randımana bakmadan, peşin öder ≈
const NEED = 400_000 // 🎲 Eylül'de peşin ödenecek: işçi yevmiyesi, bayi borcu
// ayıklama yoğunluğu (0–100) → randıman, kalan kilo payı, işçilik ₺/kg. İlk ayıklama boş ve çürüğü atar (az kilo,
// çok randıman); sıkı ayıklama sağlam fındığı da götürür. ≈ (Faz 7'de doğrulanacak)
const R: Record<number, number> = { 0: 47, 20: 50, 40: 52, 60: 53.2, 80: 53.8, 100: 54 }
const K: Record<number, number> = { 0: 1, 20: 0.99, 40: 0.975, 60: 0.955, 80: 0.93, 100: 0.9 }
const L: Record<number, number> = { 0: 0, 20: 0.6, 40: 1.3, 60: 2.2, 80: 3.4, 100: 4.8 }

const kgs = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} kg`

export function orduModel(p: Params) {
  const e = Math.round((p.ayikla ?? 0) / 20) * 20
  const t = (p.tuccar ?? 0) / 100
  const kg = P * K[e]
  const randiman = R[e]
  const tmoPrice = TMO + PRIM * (randiman - 50)
  const kgT = kg * t
  const kgM = kg - kgT
  const cash = kgT * TUCCAR // peşin gelen
  const labor = P * L[e]
  const net = kgM * tmoPrice + kgT * TUCCAR - labor
  return { e, t, kg, randiman, tmoPrice, kgT, kgM, cash, labor, net, safe: cash >= NEED, lost: P - kg }
}

// ── Sahne ───────────────────────────────────────────────────

const PLAN = ilPlan('Ordu')
const height = makeHeight(PLAN.recipe)
const at = (x: number, z: number, dy = 0): V3 => [x, height(x, z) + dy, z]
const [VX, VZ] = PLAN.village
const HAZEL = PLAN.plots
  .filter((p) => p.urun === 'findik')
  .sort((a, b) => Math.hypot(a.x - VX, a.z - VZ) - Math.hypot(b.x - VX, b.z - VZ))[0]
const road = PLAN.recipe.road
const roadZ = (x: number) => {
  for (let i = 0; i < road.length - 1; i++) if (x >= road[i][0] && x <= road[i + 1][0]) return road[i][1] + ((x - road[i][0]) / (road[i + 1][0] - road[i][0])) * (road[i + 1][1] - road[i][1])
  return road[0][1]
}
const onRoad = (x: number): V3 => at(x, roadZ(x) + 0.35, 0.02)
// harman yeri: bahçe ile yol arasında
const HARMAN: [number, number] = [HAZEL.x, (HAZEL.z + roadZ(HAZEL.x)) / 2]
const KAZIM: [number, number] = [HARMAN[0] - 1.4, HARMAN[1] - 0.3]
const STOP_T = HARMAN[0] + 2 // TMO alım kamyonu
const STOP_C = HARMAN[0] - 2.4 // tüccar kamyonu
const FAR = 20
const up = (q: V3, dy: number): V3 => [q[0], q[1] + dy, q[2]]

/** Harman: branda üstünde fındık yığını; ayıklanan boş/çürükler yanda ayrı yığın. */
function Harman({ amount, reject }: { amount: number; reject: number }) {
  const [x, y, z] = at(...HARMAN)
  const n = Math.round(amount * 40)
  const r = Math.round(reject * 40)
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[1.8, 0.02, 1.2]} />
        <meshStandardMaterial color="#4f7a6a" />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[((i * 37) % 13) / 13 - 0.5, 0.05 + Math.floor(i / 20) * 0.05, (((i * 17) % 11) / 11 - 0.5) * 0.7]}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshStandardMaterial color="#a8743f" />
        </mesh>
      ))}
      {Array.from({ length: r }, (_, i) => (
        <mesh key={`r${i}`} position={[1.15 + ((i * 7) % 5) * 0.06, 0.04 + Math.floor(i / 10) * 0.04, ((i * 3) % 4) * 0.06 - 0.1]}>
          <sphereGeometry args={[0.04, 5, 4]} />
          <meshStandardMaterial color="#5a4a3a" />
        </mesh>
      ))}
    </group>
  )
}

function Scene({ step, k, params }: SceneProps) {
  const M = orduModel(params)
  const say = (text: string) => <Bubble position={at(KAZIM[0], KAZIM[1], 1.25)}>{text}</Bubble>
  const sorting = step === 'sort'
  const amount = step === 'deliver' ? 1 - seg(k, 0.3, 0.7) : ['intro', 'harman', 'choose', 'sort'].includes(step) ? 1 : 0
  const reject = step === 'sort' ? seg(k, 0.1, 0.9) * (1 - K[M.e]) * 8 : step === 'deliver' || step === 'result' ? (1 - K[M.e]) * 8 : 0
  const arrive = step === 'harman' ? ease(seg(k, 0, 0.5)) : 1
  const leave = step === 'deliver' ? ease(seg(k, 0.7, 1)) : 0
  const showT = ['harman', 'choose', 'sort', 'deliver'].includes(step)
  const xT = STOP_T + (FAR - STOP_T) * (1 - arrive) + (FAR - STOP_T) * leave
  const showC = (step === 'harman' || step === 'choose' || step === 'sort' || step === 'deliver') && (step !== 'deliver' || M.t > 0)
  const xC = STOP_C - (STOP_C + FAR) * (1 - arrive) - (STOP_C + FAR) * leave
  const sorters = [-0.6, 0, 0.6].map((dx, i) => at(HARMAN[0] + dx, HARMAN[1] + 0.85 + (i % 2) * 0.1))

  return (
    <group>
      <Harman amount={amount} reject={Math.min(1, reject)} />
      {sorters.map((q, i) => (
        <group key={i} scale={1.2} position={q} rotation-y={Math.PI}>
          <Person position={[0, 0, 0]} anim={sorting || step === 'intro' ? 'pick' : 'idle'} phase={i} shirt={['#3f6b8a', '#a0583f', '#5f7a4a'][i]} scarf={i === 1 ? '#d8c26a' : undefined} />
        </group>
      ))}
      <group scale={1.35} position={at(...KAZIM)}>
        <Person position={[0, 0, 0]} shirt="#7a5a3f" anim={step === 'deliver' && k > 0.75 && M.safe ? 'cheer' : 'idle'} />
      </group>
      {showT && <Truck position={onRoad(xT)} yaw={step === 'harman' && arrive < 1 ? Math.PI : 0} color="#d9b44a" cargo={step === 'deliver' ? Math.round(seg(k, 0.3, 0.7) * 16 * (1 - M.t)) : 0} />}
      {showC && <Truck position={onRoad(xC)} yaw={Math.PI} color="#8c8a7e" cargo={step === 'deliver' ? Math.round(seg(k, 0.3, 0.7) * 16 * M.t) : 0} />}

      {(step === 'harman' || step === 'choose') && k > 0.3 && <PriceTag position={up(onRoad(STOP_T), 1.2)} text={`TMO ${TMO} ₺ · her randıman puanı +${PRIM} ₺ · 3 hafta sonra`} />}
      {(step === 'harman' || step === 'choose') && k > 0.5 && <PriceTag position={up(onRoad(STOP_C), 1.2)} text={`Tüccar ${TUCCAR} ₺, peşin`} />}
      {sorting && k > 0.3 && <PriceTag position={at(HARMAN[0], HARMAN[1], 1.3)} text={`Randıman %${M.randiman.toLocaleString('tr-TR')}`} />}

      {step === 'intro' && k > 0.1 && say('Fındık harmanda kurudu. Şimdi asıl iş başlıyor.')}
      {step === 'harman' && k > 0.6 && say('TMO iyi verir ama parası üç hafta sonra.')}
      {sorting && k > 0.55 && say(M.e === 0 ? 'Ayıklamadan götürüyoruz, vakit nakittir.' : M.e >= 80 ? 'Bu kadar ayıklayınca sağlamı da gidiyor…' : 'Boşu, çürüğü ayır; randıman çıksın.')}
      {step === 'deliver' && k > 0.8 && say(!M.safe ? 'Peşin para borca yetmedi!' : 'Borç ödendi, TMO parası yolda.')}

      {step === 'deliver' && k > 0.75 && M.t > 0 && <CoinFlight from={onRoad(STOP_C)} to={at(KAZIM[0], KAZIM[1], 1)} n={8} />}
      {step === 'deliver' && k > 0.8 && <FloatMoney position={at(KAZIM[0], KAZIM[1], 1.8)} amount={M.cash} big />}
    </group>
  )
}

// ── Karar ───────────────────────────────────────────────────

const DECISION: Decision = {
  question: `Harmanda ${kgs(P)} fındık. Ne kadar ayıklansın, ne kadarı tüccara peşin gitsin? Gerisi TMO'ya, [[randiman|randımana]] göre.`,
  controls: [
    { id: 'ayikla', label: 'Ayıklama', min: 0, max: 100, step: 20, def: 0, format: (v) => `%${v} · randıman %${R[v].toLocaleString('tr-TR')}` },
    { id: 'tuccar', label: 'Tüccara peşin', min: 0, max: 100, step: 10, def: 0, format: (v) => `%${v} · ${tl((P * v) / 100 * TUCCAR)}` },
  ],
  meters: (p) => {
    const M = orduModel(p)
    return [
      { label: `Peşin borç ${tl(NEED)}`, ok: M.safe, text: M.safe ? 'ödenir' : `${tl(NEED - M.cash)} eksik` },
      { label: 'TMO kilo fiyatı', text: `${M.tmoPrice.toLocaleString('tr-TR')} ₺` },
      { label: 'Ayıklamada giden', text: `${kgs(M.lost)} · işçilik ${tl(M.labor)}` },
    ]
  },
  next: () => 'sort',
  predict: { question: `Sence TMO bu fındığa ${TMO} ₺'den fazla verir mi?`, answer: (p) => orduModel(p).tmoPrice > TMO },
}

const score = (p: Params) => {
  const M = orduModel(p)
  return M.safe ? M.net : -Infinity
}
const FLOOR = orduModel({ ayikla: 0, tuccar: 100 }).net // hepsi ayıklanmadan tüccara

export const chOrdu: ChapterDef = {
  id: 103,
  il: 'Ordu',
  offset: [0, 0],
  title: 'Randıman',
  goal: 'Fındık hak ettiği fiyata satılsın, borç da ödensin',
  crop: 'Fındık · TMO',
  flow: {
    intro: { next: 'harman', dur: 5 },
    harman: { next: 'choose', dur: 5.5 },
    sort: { next: 'deliver', dur: 5.5 },
    deliver: { next: 'result', dur: 7 },
  },
  month: { intro: 'Ağustos', harman: 'Eylül', choose: 'Eylül', sort: 'Eylül', deliver: 'Eylül', result: 'Eylül' },
  shot: {
    intro: { f: [HARMAN[0], HARMAN[1]], z: 1.7 },
    harman: { f: [HARMAN[0], roadZ(HARMAN[0])], z: 1.3 },
    choose: { f: [HARMAN[0], HARMAN[1] + 0.5], z: 1.25 },
    sort: { f: [HARMAN[0], HARMAN[1]], z: 1.7 },
    deliver: { f: [HARMAN[0], roadZ(HARMAN[0])], z: 1.2 },
    result: { f: [HARMAN[0], HARMAN[1] + 0.5], z: 1.15 },
  },
  lesson: '[[randiman|randıman]]: kalitenin fiyatı',
  icon: 'sack',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = orduModel(p)
    const best = bestOf(DECISION, score)
    const stars = M.safe ? starsFor(M.net, best, FLOOR) : 0
    return {
      good: stars >= 2,
      stars,
      caption: "Kâzım Amca ve komşularının eline geçen",
      value: tl(M.net),
      compare: !M.safe
        ? `Peşin para borca yetmedi: ${tl(NEED - M.cash)} eksik`
        : M.e === 0
          ? 'Ayıklanmayan fındık randıman primini kaçırdı'
          : M.e >= 80
            ? 'Fazla ayıklandı: sağlam fındık da gitti, işçilik pahalıya geldi'
            : M.t > 0.5
              ? "Borca gerekenden fazlası tüccara ucuza gitti"
              : stars >= 3
                ? "Boş ve çürük ayrıldı, borç kadarı peşin, gerisi TMO'ya primli"
                : 'Biraz daha iyisi mümkündü',
      chain: [
        { label: `%${M.e} ayıklama → randıman %${M.randiman.toLocaleString('tr-TR')}`, value: `−${kgs(M.lost)}, işçilik −${tl(M.labor)}` },
        { label: `Tüccara peşin ${kgs(M.kgT)}`, value: `+${tl(M.cash)}`, ok: M.safe },
        { label: `Peşin borç ${tl(NEED)}`, value: M.safe ? 'ödendi' : `${tl(NEED - M.cash)} eksik`, ok: M.safe },
        { label: `TMO'ya ${kgs(M.kgM)} · ${M.tmoPrice.toLocaleString('tr-TR')} ₺`, value: `+${tl(M.kgM * M.tmoPrice)} (3 hafta sonra)`, ok: M.tmoPrice >= TMO },
      ],
      bars: [
        { label: 'Hepsi ayıklanmadan tüccara', value: FLOOR, max: best, unit: '₺', on: false },
        { label: 'Senin kararın', value: M.net, max: best, unit: '₺', on: true },
        { label: 'En iyi ayar', value: best, max: best, unit: '₺', on: false },
      ],
      barsNote: `TMO ${TMO} ₺ (%50 randıman, puan başı ${PRIM} ₺); tüccar ${TUCCAR} ₺ peşin`,
      lesson: stars >= 2 ? '[[randiman|randıman]]: kalitenin fiyatı' : undefined,
    }
  },
  Scene,
}
