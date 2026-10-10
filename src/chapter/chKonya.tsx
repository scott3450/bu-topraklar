// Özel bölüm — Konya, "Harman fiyatı" (buğday, TMO, lisanslı depo). Konya'nın il sahnesinde oynar.
// Karar: lisanslı depodaki buğdayın ne kadarı hemen TMO'ya gitsin, kalanı kaç ay beklesin. Ders: hasat baskısı ve ELÜS.
import { Bubble, CoinFlight, FloatMoney, Person, PriceTag, Truck } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { ilPlan } from '../scene/ilgen'
import { makeHeight } from '../scene/landgen'
import { DEPO_RENT, ELUS_LOAN, RENT_SUPPORT } from '../data/aileler'

type V3 = [number, number, number]

const P = 240_000 // 🎲 Hacı Rıza ve komşularının buğdayı (kg), ≈ 690 dönüm × 350 kg
const TUCCAR = 14.8 // ≈ harmanda tüccar, peşin: herkes aynı hafta satınca fiyat TMO'nun altına iner
const TMO = 16.5 // ✅ TMO 2026 ekmeklik buğday alım fiyatı; ✅ ELÜS ile TMO'ya satana ödeme peşin
const NAKLIYE = 0.3 // ≈ depoya nakliye ve analiz ₺/kg
// ay (0 = Temmuz, hemen) → ≈ borsa fiyatı ₺/kg. ✅ TMO Ekim'den itibaren 18,5 ₺'ye satar, piyasanın tavanı olur;
// bahara doğru yeni hasat beklentisi fiyatı indirir ≈
const PRICE = [16.5, 16.8, 17.3, 17.9, 18.3, 18.5, 18.5, 18.4, 18.1, 17.6]
const MONTHS = ['Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan']
const MONTHS_DA = ["Temmuz'da", "Ağustos'ta", "Eylül'de", "Ekim'de", "Kasım'da", "Aralık'ta", "Ocak'ta", "Şubat'ta", "Mart'ta", "Nisan'da"]
const SUPPORTED = 6 // ✅ kira desteği 6 aya kadar
const NEED = 3_100_000 // 🎲 Temmuz'da peşin: biçerdöver, mazot, gübre bayisi, Tarım Kredi taksiti

const kgs = (n: number) => `${Math.round(n / 1000).toLocaleString('tr-TR')} ton`
const lira = (n: number) => `${n.toLocaleString('tr-TR')} ₺`
const rentOf = (a: number) => Array.from({ length: a }, (_, i) => (i < SUPPORTED ? DEPO_RENT * (1 - RENT_SUPPORT) : DEPO_RENT)).reduce((x, y) => x + y, 0)

export function konyaModel(p: Params) {
  const a = Math.round(p.ay ?? 0)
  const h = a === 0 ? 1 : (p.hemen ?? 0) / 100 // beklemeyince hepsi hemen satılır
  const kgH = P * h
  const kgW = P - kgH
  const loan = kgW * TMO * ELUS_LOAN // ELÜS kredisi, faizsiz ≈
  const cash = kgH * TMO + loan
  const rent = kgW * rentOf(a)
  const later = kgW * PRICE[a]
  const net = kgH * (TMO - NAKLIYE) + later - kgW * NAKLIYE - rent
  return { a, h, kgH, kgW, loan, cash, rent, later, net, price: PRICE[a], safe: cash >= NEED }
}
const BASE = konyaModel({ hemen: 100, ay: 0 }).net // hepsi hemen TMO'ya
const FLOOR = P * TUCCAR // hepsi harmanda tüccara

// ── Sahne ───────────────────────────────────────────────────

const PLAN = ilPlan('Konya')
const height = makeHeight(PLAN.recipe)
const at = (x: number, z: number, dy = 0): V3 => [x, height(x, z) + dy, z]
const [VX, VZ] = PLAN.village
const road = PLAN.recipe.road
const roadZ = (x: number) => {
  for (let i = 0; i < road.length - 1; i++) if (x >= road[i][0] && x <= road[i + 1][0]) return road[i][1] + ((x - road[i][0]) / (road[i + 1][0] - road[i][0])) * (road[i + 1][1] - road[i][1])
  return road[0][1]
}
const onRoad = (x: number): V3 => at(x, roadZ(x) + 0.35, 0.02)
// lisanslı depo: köyden uzakta, yolun kuzeyinde parsellerle yol arasındaki boş şeritte (Konya planı: parsel kenarı z≈1,25, yol z≈2,6)
const SILO: [number, number] = [-3.2, 1.72]
// biçilen tarla: köyden uzak (köy evleri parsel kenarına taşabiliyor), depoya en yakın buğday
const WHEAT = PLAN.plots
  .filter((p) => p.urun === 'bugday' && Math.hypot(p.x - VX, p.z - VZ) > 7)
  .sort((a, b) => Math.hypot(a.x - SILO[0], a.z - SILO[1]) - Math.hypot(b.x - SILO[0], b.z - SILO[1]))[0]
const RIZA: [number, number] = [WHEAT.x - 1, (WHEAT.z - WHEAT.d / 2 + roadZ(WHEAT.x) + 0.35) / 2] // tarla ile yol arasında
const STOP_D = SILO[0] - 0.6 // depoya buğday taşıyan kamyon
const STOP_C = WHEAT.x + 2.6 // tüccar kamyonu, doğudan gelir
const FAR = 20
const up = (q: V3, dy: number): V3 => [q[0], q[1] + dy, q[2]]

/** Biçerdöver: kırmızı gövde, önde döner tambur, arkada saman tozu. */
function Combine({ position, run }: { position: V3; run: boolean }) {
  const t = run ? performance.now() / 120 : 0
  return (
    <group position={position} scale={0.9}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.9, 0.42, 0.55]} />
        <meshStandardMaterial color="#b8322a" />
      </mesh>
      <mesh position={[-0.15, 0.68, 0]} castShadow>
        <boxGeometry args={[0.36, 0.3, 0.42]} />
        <meshStandardMaterial color="#d9e2e3" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.62, 0.18, 0]} rotation={[Math.PI / 2, t, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.95, 8]} />
        <meshStandardMaterial color="#d8b45a" />
      </mesh>
      {[-0.28, 0.28].map((z) => (
        <mesh key={z} position={[-0.2, 0.12, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.08, 10]} />
          <meshStandardMaterial color="#2c2c2c" />
        </mesh>
      ))}
      {run &&
        [0, 1, 2].map((i) => (
          <mesh key={i} position={[-0.55 - ((t * 0.05 + i * 0.25) % 0.7), 0.35 + i * 0.05, 0]}>
            <sphereGeometry args={[0.07 + i * 0.02, 6, 5]} />
            <meshStandardMaterial color="#e3cf93" transparent opacity={0.5} />
          </mesh>
        ))}
    </group>
  )
}

/** Lisanslı depo: üç çelik silo ve kantar. `fill` 0–1 silonun dolu görünen payı. */
function Silos({ fill }: { fill: number }) {
  const [x, y, z] = at(...SILO)
  return (
    <group position={[x, y, z]}>
      {[-0.55, 0, 0.55].map((dx, i) => (
        <group key={i} position={[dx, 0, 0]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.24, 1.4, 14]} />
            <meshStandardMaterial color="#c9cdd0" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.52, 0]}>
            <coneGeometry args={[0.26, 0.25, 14]} />
            <meshStandardMaterial color="#aeb3b6" metalness={0.4} roughness={0.5} />
          </mesh>
          {/* dolu kısım: önde ince altın şerit */}
          <mesh position={[0, 0.05 + 0.65 * fill, 0.245]}>
            <boxGeometry args={[0.12, Math.max(0.01, 1.3 * fill), 0.01]} />
            <meshStandardMaterial color="#d8b45a" />
          </mesh>
        </group>
      ))}
      <mesh position={[1.35, 0.03, 0]} receiveShadow>
        <boxGeometry args={[0.8, 0.05, 0.5]} />
        <meshStandardMaterial color="#8c8a7e" />
      </mesh>
    </group>
  )
}

/** Biçilmemiş buğday: tarlanın biçerdöverin önünde kalan kısmı, başak boyunda altın örtü. */
function Standing({ from }: { from: number }) {
  const x1 = WHEAT.x + WHEAT.w / 2 - 0.15
  const w = x1 - from
  if (w <= 0.05) return null
  const rows = Math.max(1, Math.floor((WHEAT.d - 0.3) / 0.28))
  return (
    <group>
      {Array.from({ length: rows }, (_, r) => {
        const z = WHEAT.z - WHEAT.d / 2 + 0.25 + r * 0.28
        const [, y] = at(from + w / 2, z)
        return (
          <mesh key={r} position={[from + w / 2, y + 0.11, z]} castShadow>
            <boxGeometry args={[w, 0.22, 0.2]} />
            <meshStandardMaterial color={r % 2 ? '#d9b75c' : '#e3c46e'} />
          </mesh>
        )
      })}
    </group>
  )
}

function Scene({ step, k, params }: SceneProps) {
  const M = konyaModel(params)
  const say = (text: string) => <Bubble position={at(RIZA[0], RIZA[1], 1.25)}>{text}</Bubble>
  const cx = WHEAT.x - WHEAT.w / 2 + 0.4 + (WHEAT.w - 0.8) * (step === 'intro' ? seg(k, 0, 0.9) : 1)
  const arrive = step === 'harman' ? ease(seg(k, 0, 0.5)) : 1
  const showC = step === 'harman'
  const xC = STOP_C + (FAR - STOP_C) * (1 - arrive)
  const haul = step === 'depo' ? seg(k, 0.1, 0.8) : 0
  const xD = WHEAT.x + (STOP_D - WHEAT.x) * ease(haul)
  const fill = step === 'intro' || step === 'harman' ? 0 : step === 'depo' ? haul : step === 'sell' ? 1 - seg(k, 0.2, 0.7) : 1
  const i = step === 'wait' ? Math.round(seg(k, 0.05, 0.85) * M.a) : M.a
  const leave = step === 'sell' ? ease(seg(k, 0.2, 0.8)) : 0

  return (
    <group>
      <Silos fill={Math.max(0, Math.min(1, fill))} />
      {step === 'intro' && <Standing from={cx + 0.45} />}
      {(step === 'intro' || step === 'harman') && <Combine position={at(cx, WHEAT.z)} run={step === 'intro' && k < 0.9} />}
      <group scale={1.35} position={at(...RIZA)}>
        <Person position={[0, 0, 0]} shirt="#5f6f8a" anim={step === 'sell' && k > 0.75 && M.safe ? 'cheer' : 'idle'} />
      </group>
      {showC && <Truck position={onRoad(xC)} yaw={Math.PI} color="#8c8a7e" />}
      {step === 'depo' && <Truck position={onRoad(xD)} yaw={Math.PI} color="#d9b44a" cargo={12} />}
      {step === 'sell' && <Truck position={onRoad(STOP_D + 0.8 + leave * FAR)} yaw={0} color="#3f6b8a" cargo={leave > 0 ? 14 : 0} />}

      {showC && k > 0.4 && <PriceTag position={up(onRoad(STOP_C), 1.2)} text={`Tüccar ${lira(TUCCAR)}, tarlada peşin`} />}
      {showC && k > 0.6 && <PriceTag position={at(SILO[0], SILO[1], 2.1)} text={`TMO ${lira(TMO)}`} />}
      {step === 'depo' && k > 0.5 && <PriceTag position={at(SILO[0], SILO[1], 2.1)} text={`ELÜS · değerin %${ELUS_LOAN * 100}'i kredi, hemen`} />}
      {(step === 'wait' || step === 'sell') && M.a > 0 && <PriceTag position={at(SILO[0], SILO[1], 2.1)} text={`${MONTHS[i]} · ${lira(PRICE[i])}`} />}

      {step === 'intro' && k > 0.15 && say('Bereketli yıl. Ama bütün ova aynı hafta biçiyor.')}
      {step === 'harman' && k > 0.7 && say('Herkes harmanda satınca tüccar fiyatı kırar.')}
      {step === 'depo' && k > 0.6 && say('Depoya koyduk, senedi elimizde. Bankaya gösterince kredi var.')}
      {step === 'wait' && k > 0.5 && say(M.a === 0 ? 'Beklemedik, hepsi TMO\'ya gitti.' : M.a >= 8 ? 'Bahar geldi, yeni hasat yaklaşıyor…' : 'Fiyat yükseliyor, kira az.')}
      {step === 'sell' && k > 0.8 && say(!M.safe ? 'Bugünkü para borca yetmedi!' : 'Borç da ödendi, buğday da değerinden satıldı.')}

      {step === 'sell' && k > 0.75 && <CoinFlight from={onRoad(STOP_D + 0.8)} to={at(RIZA[0], RIZA[1], 1)} n={8} />}
      {step === 'sell' && k > 0.8 && <FloatMoney position={at(RIZA[0], RIZA[1], 1.8)} amount={M.net} big />}
    </group>
  )
}

// ── Karar ───────────────────────────────────────────────────

const DECISION: Decision = {
  question: `${kgs(P)} buğday [[elus|lisanslı depoda]]. Ne kadarı hemen TMO'ya gitsin, kalanı ne zamana kadar beklesin? Bugün ödenecek borç ${tl(NEED)}.`,
  controls: [
    { id: 'hemen', label: "Hemen TMO'ya", min: 0, max: 100, step: 10, def: 100, format: (v) => `%${v} · ${lira(TMO)}, peşin` },
    { id: 'ay', label: 'Kalanı sat', min: 0, max: 9, step: 1, def: 0, format: (v) => (v === 0 ? 'beklemeden' : `${MONTHS[v]} · ≈ ${lira(PRICE[v])}`) },
  ],
  meters: (p) => {
    const M = konyaModel(p)
    return [
      { label: `Bugünkü borç ${tl(NEED)}`, ok: M.safe, text: M.safe ? 'ödenir' : `${tl(NEED - M.cash)} eksik` },
      { label: 'Bugün gelen', text: M.loan > 0 ? `${tl(M.kgH * TMO)} + ELÜS kredisi ${tl(M.loan)}` : tl(M.cash) },
      { label: 'Depo kirası (devlet payı düşülmüş)', text: tl(M.rent) },
    ]
  },
  next: () => 'wait',
  predict: { question: "Sence bu karar, hepsini hemen TMO'ya vermekten fazla kazandırır mı?", answer: (p) => konyaModel(p).safe && konyaModel(p).net > BASE },
}

const score = (p: Params) => {
  const M = konyaModel(p)
  return M.safe ? M.net : -Infinity
}

export const chKonya: ChapterDef = {
  id: 104,
  il: 'Konya',
  offset: [0, 0],
  title: 'Harman fiyatı',
  goal: 'Buğday hasat ucuzluğuna gitmesin, borç da ödensin',
  crop: 'Buğday · TMO · lisanslı depo',
  flow: {
    intro: { next: 'harman', dur: 5.5 },
    harman: { next: 'depo', dur: 5.5 },
    depo: { next: 'choose', dur: 5 },
    wait: { next: 'sell', dur: 6 },
    sell: { next: 'result', dur: 7 },
  },
  month: { intro: 'Temmuz', harman: 'Temmuz', depo: 'Temmuz', choose: 'Temmuz', wait: 'Depoda', sell: 'Satış', result: 'Satış' },
  shot: {
    intro: { f: [WHEAT.x, WHEAT.z], z: 1.6 },
    harman: { f: [WHEAT.x, roadZ(WHEAT.x)], z: 1.35 },
    depo: { f: [(WHEAT.x + SILO[0]) / 2, roadZ(WHEAT.x)], z: 1.3 },
    choose: { f: [SILO[0], SILO[1]], z: 1.3 },
    wait: { f: [SILO[0], SILO[1]], z: 1.6 },
    sell: { f: [(RIZA[0] + SILO[0]) / 2, roadZ(WHEAT.x)], z: 1.2 },
    result: { f: [SILO[0], SILO[1]], z: 1.15 },
  },
  lesson: '[[elus|lisanslı depo]]: hasat ucuzluğundan kaçmak',
  icon: 'sack',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = konyaModel(p)
    const best = bestOf(DECISION, score)
    const stars = M.safe ? starsFor(M.net, best, FLOOR) : 0
    return {
      good: stars >= 2,
      stars,
      caption: 'Hacı Rıza ve komşularının eline geçen',
      value: tl(M.net),
      compare: !M.safe
        ? `Bugünkü para borca yetmedi: ${tl(NEED - M.cash)} eksik`
        : M.a === 0
          ? "Hepsi hemen TMO'ya: güvenli, ama depodaki fiyat artışı kaçtı"
          : M.a >= 8
            ? 'Fazla beklendi: bahara doğru yeni hasat fiyatı indirdi, kira desteği bitti'
            : M.h > 0.5
              ? 'Borca gerekenden fazlası hemen satıldı'
              : stars >= 3
                ? "Borç kadarı hemen TMO'ya, gerisi ELÜS kredisiyle depoda bekledi"
                : 'Biraz daha iyisi mümkündü',
      chain: [
        { label: `Hemen TMO'ya ${kgs(M.kgH)}`, value: `+${tl(M.kgH * TMO)}` },
        { label: M.kgW > 0 ? `Depoda ${kgs(M.kgW)} → ELÜS kredisi` : 'Depoda bekleyen yok', value: M.kgW > 0 ? `+${tl(M.loan)}` : '—', ok: M.safe },
        { label: `Bugünkü borç ${tl(NEED)}`, value: M.safe ? 'ödendi' : `${tl(NEED - M.cash)} eksik`, ok: M.safe },
        ...(M.kgW > 0
          ? [{ label: `${MONTHS_DA[M.a]} ${kgs(M.kgW)} · ${lira(M.price)}`, value: `+${tl(M.later)}, kira −${tl(M.rent)}`, ok: M.price > TMO }]
          : [{ label: 'Harmanda tüccara verilseydi', value: tl(FLOOR), ok: true }]),
      ],
      bars: [
        { label: 'Hepsi harmanda tüccara', value: FLOOR, max: best, unit: '₺', on: false },
        { label: 'Senin kararın', value: M.net, max: best, unit: '₺', on: true },
        { label: 'En iyi ayar', value: best, max: best, unit: '₺', on: false },
      ],
      barsNote: `Tüccar ${lira(TUCCAR)}; TMO ${lira(TMO)} (ELÜS ile peşin); depo kirası ton başı ayda 85,5 ₺, %${RENT_SUPPORT * 100}'i devletten`,
      lesson: stars >= 2 ? '[[elus|lisanslı depo]]: hasat ucuzluğundan kaçmak' : undefined,
    }
  },
  Scene,
}
