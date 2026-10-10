// Özel bölüm — Şanlıurfa, "Su" (pamuk, Harran Ovası, GAP). Şanlıurfa'nın il sahnesinde oynar, beş sezonu gösterir.
// Karar: tarlanın ne kadarı damlaya geçsin, salmada ne kadar su verilsin. Ders: fazla su verim değil tuz getirir.
import { Bubble, FloatMoney, Person, PriceTag, Sacks } from './actors'
import { bestOf, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { ilPlan } from '../scene/ilgen'
import { makeHeight } from '../scene/landgen'

type V3 = [number, number, number]

const L = 300 // 🎲 Mahmut Dayı ve komşularının pamuk tarlası (dekar)
const Y = 450 // ✅ kütlü pamukta dekarda 400–450 kg (Söke 2026); Harran için ≈
const PRICE = 31 // ✅ Çukobirlik 2025/26 ön alım, 44 randıman kütlü 31 ₺/kg
const DRIP_GAIN = 0.15 // ≈ damlada su ve gübre köke gider, verim artar
const DRIP_COST = 10_500 // ✅ damla sistemi dekarda 9–12 bin ₺ (2025)
const GRANT = 0.5 // ✅ tarla içi damla sulamaya %50 hibe (Kırsal Kalkınma 2026/10)
const BUDGET = 900_000 // 🎲 kooperatifin bu yıl ayırabildiği
const SALT = 0.02 // ≈ salmada drenajsız her yıl verimi yiyen tuz (Harran'da hektara yılda ~2,56 t tuz ✅)
const YEARS = 5

const pct = (n: number) => `%${Math.round(n * 100)}`
const tons = (kg: number) => `${Math.round(kg / 1000).toLocaleString('tr-TR')} ton`

/** Salmada su (ihtiyacın katı) → verim çarpanı: az su verimi düşürür, fazlası artırmaz, biraz da azaltır. */
const waterYield = (w: number) => (w < 1 ? 1 - 0.9 * (1 - w) : 1 - 0.04 * (w - 1))

export function sanliurfaModel(p: Params) {
  const d = (p.damla ?? 0) / 100
  const w = (p.su ?? 100) / 100
  const cost = d * L * DRIP_COST * (1 - GRANT)
  const fS = waterYield(w)
  const saltS = SALT * w // salmada yıllık tuz
  const saltD = SALT / 2 // ✅ damlada tuz yarıya iner
  const year = (t: number) => {
    const s = (1 - d) * L * Y * fS * (1 - (t - 1) * saltS)
    const dr = d * L * Y * (1 + DRIP_GAIN) * (1 - (t - 1) * saltD)
    return s + dr
  }
  const kgs = Array.from({ length: YEARS }, (_, i) => year(i + 1))
  const revenue = kgs.reduce((a, k) => a + k * PRICE, 0)
  const net = revenue - cost
  const drop = 1 - kgs[YEARS - 1] / kgs[0]
  return { d, w, cost, kgs, revenue, net, drop, saltS, safe: cost <= BUDGET, waterUse: (1 - d) * w + d * 0.55 } // ✅ damla %45 az su
}
const FLOOR = sanliurfaModel({ damla: 0, su: 160 }).net // hepsi salma, bol su

// ── Sahne ───────────────────────────────────────────────────

const PLAN = ilPlan('Şanlıurfa')
const height = makeHeight(PLAN.recipe)
const at = (x: number, z: number, dy = 0): V3 => [x, height(x, z) + dy, z]
const [VX, VZ] = PLAN.village
const road = PLAN.recipe.road
const roadZ = (x: number) => {
  for (let i = 0; i < road.length - 1; i++) if (x >= road[i][0] && x <= road[i + 1][0]) return road[i][1] + ((x - road[i][0]) / (road[i + 1][0] - road[i][0])) * (road[i + 1][1] - road[i][1])
  return road[0][1]
}
// pamuk tarlası: köyden uzak, yola en yakın; komşusu (tuzdan terk edilen) aynı sırada başka bir pamuk parseli
const COTTON = PLAN.plots.filter((p) => p.urun === 'pamuk' && Math.hypot(p.x - VX, p.z - VZ) > 7)
const FIELD = [...COTTON].sort((a, b) => Math.abs(a.z + a.d / 2 - roadZ(a.x)) - Math.abs(b.z + b.d / 2 - roadZ(b.x)))[0]
const NEIGHBOR = COTTON.filter((p) => p !== FIELD).sort((a, b) => Math.hypot(a.x - FIELD.x, a.z - FIELD.z) - Math.hypot(b.x - FIELD.x, b.z - FIELD.z))[0]
const EDGE = FIELD.z + FIELD.d / 2
const MAHMUT: [number, number] = [FIELD.x - FIELD.w / 2 + 0.5, (EDGE + roadZ(FIELD.x)) / 2]
const up = (q: V3, dy: number): V3 => [q[0], q[1] + dy, q[2]]

// tarlada sabit "tuz lekesi" noktaları (her sahnede aynı)
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const SPOTS = Array.from({ length: 60 }, (_, i) => [hash(i) * 0.92 + 0.04, hash(i + 500) * 0.9 + 0.05] as [number, number])

/** Bir parselin bir dilimine su, tuz ya da damla hortumu. x0–x1 parselin genişliğinde pay (0–1). */
function Strip({ plot, x0, x1, water, salt, hoses }: { plot: typeof FIELD; x0: number; x1: number; water: number; salt: number; hoses: boolean }) {
  if (x1 - x0 < 0.01) return null
  const left = plot.x - plot.w / 2
  const cx = left + plot.w * (x0 + x1) / 2
  const w = plot.w * (x1 - x0)
  const [, y] = at(cx, plot.z)
  const n = Math.round(SPOTS.length * Math.min(1, salt))
  return (
    <group>
      {water > 0 && (
        <mesh position={[cx, y + 0.04, plot.z]}>
          <boxGeometry args={[w - 0.1, 0.02, plot.d - 0.2]} />
          <meshStandardMaterial color="#5b9bb5" transparent opacity={0.25 + 0.35 * Math.min(1, water)} />
        </mesh>
      )}
      {hoses &&
        Array.from({ length: Math.max(1, Math.floor((plot.d - 0.3) / 0.35)) }, (_, r) => {
          const z = plot.z - plot.d / 2 + 0.2 + r * 0.35
          return (
            <mesh key={r} position={[cx, at(cx, z)[1] + 0.03, z]}>
              <boxGeometry args={[w - 0.15, 0.025, 0.03]} />
              <meshStandardMaterial color="#26282a" />
            </mesh>
          )
        })}
      {SPOTS.slice(0, n)
        .filter(([u]) => u >= x0 && u <= x1)
        .map(([u, v], i) => {
          const x = left + plot.w * u
          const z = plot.z - plot.d / 2 + plot.d * v
          return (
            <mesh key={i} position={[x, at(x, z)[1] + 0.05, z]} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[0.12 + (i % 3) * 0.05, 10]} />
              <meshStandardMaterial color="#f1eee6" />
            </mesh>
          )
        })}
    </group>
  )
}

function Scene({ step, k, params }: SceneProps) {
  const M = sanliurfaModel(params)
  const say = (text: string) => <Bubble position={at(MAHMUT[0], MAHMUT[1], 1.25)}>{text}</Bubble>
  const decided = ['yillar', 'hasat', 'result'].includes(step)
  const d = decided ? M.d : 0
  const w = decided ? M.w : 1.5 // karardan önce ova alışkanlığı: bol su
  const t = step === 'yillar' ? 1 + Math.round(seg(k, 0.05, 0.85) * (YEARS - 1)) : decided ? YEARS : 1
  // tuz görünür olsun diye büyütülmüş ölçek: 5. yılda salmanın tuzu lekelerin %40–80'i
  const saltSeen = decided ? (t - 1) * M.saltS * 4 : 0
  const flood = step === 'intro' ? seg(k, 0.1, 0.6) : step === 'yillar' ? 0.6 : step === 'tuz' || step === 'choose' ? 0.8 : 0
  const yearKg = M.kgs[Math.min(YEARS, t) - 1]

  return (
    <group>
      <Strip plot={FIELD} x0={0} x1={d} water={0} salt={(t - 1) * (0.02 / 2) * 4} hoses />
      <Strip plot={FIELD} x0={d} x1={1} water={flood * w} salt={saltSeen} hoses={false} />
      {NEIGHBOR && <Strip plot={NEIGHBOR} x0={0} x1={1} water={0} salt={step === 'intro' ? 0.3 : 0.85} hoses={false} />}
      <group scale={1.35} position={at(...MAHMUT)}>
        <Person position={[0, 0, 0]} shirt="#6a5a8a" anim={step === 'hasat' && k > 0.6 && M.drop < 0.08 ? 'cheer' : 'idle'} />
      </group>
      {step === 'hasat' && <Sacks position={at(MAHMUT[0] + 1.2, MAHMUT[1])} n={Math.round(seg(k, 0.1, 0.6) * 10)} color="#f4f1ea" />}

      {step === 'intro' && k > 0.4 && <PriceTag position={at(FIELD.x, FIELD.z, 1.2)} text="Salma: suyun yarısı toprağa gider" />}
      {step === 'tuz' && k > 0.3 && NEIGHBOR && <PriceTag position={at(NEIGHBOR.x, NEIGHBOR.z, 1.2)} text="Tuzlanmış tarla · ekilmiyor" />}
      {step === 'yillar' && <PriceTag position={at(FIELD.x + FIELD.w * 0.3, FIELD.z - FIELD.d * 0.3, 1.1)} text={`${t}. yıl · ${tons(yearKg)} pamuk`} />}

      {step === 'intro' && k > 0.15 && say('Su bol. Ne kadar verirsek o kadar pamuk.')}
      {step === 'tuz' && k > 0.55 && say('Komşunun tarlasında da öyle diyorlardı. Bak şimdi.')}
      {step === 'yillar' && k > 0.55 && say(M.w < 0.95 ? 'Pamuk susuz kaldı.' : M.saltS > 0.025 ? 'Toprak beyazlıyor…' : M.d > 0 ? 'Damlalı tarafta tuz az.' : 'Tuz yavaş yavaş birikiyor.')}
      {step === 'hasat' && k > 0.7 && <FloatMoney position={up(at(MAHMUT[0] + 1.2, MAHMUT[1]), 1.4)} amount={M.net} big />}
    </group>
  )
}

// ── Karar ───────────────────────────────────────────────────

const DECISION: Decision = {
  question: `${L} dönüm pamuk, Harran'da. Ne kadarı damlaya geçsin (%${GRANT * 100} hibe), salmada ne kadar su verilsin? Kasada ${tl(BUDGET)}.`,
  controls: [
    { id: 'damla', label: 'Damlaya geç', min: 0, max: 100, step: 10, def: 0, format: (v) => `%${v} · ${tl((v / 100) * L * DRIP_COST * (1 - GRANT))}` },
    { id: 'su', label: 'Salmada su', min: 60, max: 160, step: 10, def: 150, format: (v) => (v === 100 ? 'ihtiyaç kadar' : v < 100 ? `ihtiyacın %${v}'i` : `ihtiyacın %${v}'i, fazlası`) },
  ],
  meters: (p) => {
    const M = sanliurfaModel(p)
    return [
      { label: `Kasa ${tl(BUDGET)}`, ok: M.safe, text: M.safe ? `${tl(BUDGET - M.cost)} kalır` : `${tl(M.cost - BUDGET)} eksik` },
      { label: 'Kullanılan su', text: pct(M.waterUse) },
    ]
  },
  next: () => 'yillar',
  predict: { question: 'Sence beş yıl sonra verim %5\'ten fazla düşer mi?', answer: (p) => sanliurfaModel(p).drop > 0.05 },
}

const score = (p: Params) => {
  const M = sanliurfaModel(p)
  return M.safe ? M.net : -Infinity
}

export const chSanliurfa: ChapterDef = {
  id: 106,
  il: 'Şanlıurfa',
  offset: [0, 0],
  title: 'Su',
  goal: 'Pamuk beş yıl sonra da bu toprakta yetişsin',
  crop: 'Pamuk · Harran · sulama',
  flow: {
    intro: { next: 'tuz', dur: 5.5 },
    tuz: { next: 'choose', dur: 5 },
    yillar: { next: 'hasat', dur: 8 },
    hasat: { next: 'result', dur: 6 },
  },
  month: { intro: 'Haziran', tuz: 'Haziran', choose: 'Haziran', yillar: 'Beş yıl', hasat: 'Ekim', result: 'Ekim' },
  shot: {
    intro: { f: [FIELD.x, FIELD.z], z: 1.5 },
    tuz: { f: [(FIELD.x + (NEIGHBOR?.x ?? FIELD.x)) / 2, (FIELD.z + (NEIGHBOR?.z ?? FIELD.z)) / 2], z: 1.35 },
    choose: { f: [FIELD.x, FIELD.z + 0.5], z: 1.3 },
    yillar: { f: [FIELD.x, FIELD.z], z: 1.45 },
    hasat: { f: [MAHMUT[0] + 0.6, MAHMUT[1]], z: 1.2 },
    result: { f: [FIELD.x, FIELD.z + 0.5], z: 1.15 },
  },
  lesson: '[[tuzlanma|tuzlanma]]: fazla suyun bedeli',
  icon: 'coins',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = sanliurfaModel(p)
    const best = bestOf(DECISION, score)
    const stars = M.safe ? starsFor(M.net, best, FLOOR) : 0
    return {
      good: stars >= 2,
      stars,
      caption: 'Beş yılda Mahmut Dayı ve komşularının eline geçen',
      value: tl(M.net),
      compare: !M.safe
        ? `Kasa yetmedi: ${tl(M.cost - BUDGET)} eksik`
        : M.w > 1.15
          ? 'Fazla su verimi artırmadı, toprağa tuz bıraktı'
          : M.w < 0.95
            ? 'Su az verildi: pamuk susuz kaldı'
            : M.d < 0.4
              ? 'Su doğru, ama damlanın verimi ve az tuzu kaçtı'
              : stars >= 3
                ? 'Kasanın yettiği kadar damla, salmada ihtiyaç kadar su'
                : 'Biraz daha iyisi mümkündü',
      chain: [
        { label: `Damla ${pct(M.d)} · hibe sonrası`, value: M.d ? `−${tl(M.cost)}` : '—' },
        { label: `Salmada su ${pct(M.w)}`, value: `yılda ${pct(M.saltS)} tuz kaybı`, ok: M.w <= 1.05 && M.w >= 0.95 },
        { label: `1. yıl ${tons(M.kgs[0])} → 5. yıl ${tons(M.kgs[YEARS - 1])}`, value: `−${pct(M.drop)}`, ok: M.drop < 0.06 },
        { label: `Beş yılda pamuk · ${PRICE} ₺/kg`, value: `+${tl(M.revenue)}` },
      ],
      bars: [
        { label: 'Hepsi salma, bol su', value: FLOOR, max: best, unit: '₺', on: false },
        { label: 'Senin kararın', value: M.net, max: best, unit: '₺', on: true },
        { label: 'En iyi ayar', value: best, max: best, unit: '₺', on: false },
      ],
      barsNote: `Pamuk ${PRICE} ₺/kg; damla dekarda ${tl(DRIP_COST)}, %${GRANT * 100}'si hibe; damla %45 az su kullanır, tuzu yarıya indirir`,
      lesson: stars >= 2 ? '[[tuzlanma|tuzlanma]]: fazla suyun bedeli' : undefined,
    }
  },
  Scene,
}
