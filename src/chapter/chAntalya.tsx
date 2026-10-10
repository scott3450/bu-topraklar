// Özel bölüm — Antalya, "Kalıntı" (sera domatesi, ihracat). Antalya'nın il sahnesinde oynar.
// Karar: son ilaçtan sonra kaç gün beklensin, ne kadarı ihracatçıya gitsin. Ders: bekleme süresi ve kalıntı analizi.
import { Bubble, Crates, FloatMoney, Person, PriceTag, Truck } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { ilPlan } from '../scene/ilgen'
import { makeHeight } from '../scene/landgen'
import { TOMATO } from '../sim/config'

type V3 = [number, number, number]

const P = 30_000 // 🎲 Ahmet Abi ve komşularının bu haftaki domatesi (kg); ✅ Antalya'da dekarda ~15 t (2025)
const ORDER = 0.6 // 🎲 ihracatçının siparişi: 18 ton
const EXPORT = 35 // ≈ ihracatçının sabit fiyatı ₺/kg (Antalya'dan İstanbul'a toptan sevkiyat Temmuz 2026'da 35 ₺ ✅; ihracatçı fiyatı yayımlanmıyor)
const HAL = 30 // ✅ Antalya hali Eylül 2026 domates 20–45 ₺/kg
const CUT = TOMATO.commission + TOMATO.halFee + TOMATO.withholding // ✅ %8 komisyon + %1 rüsum + %2 stopaj
const HAL_NET = HAL * (1 - CUT)
const IADE = 12 // ≈ dönen parti iç piyasada, iade nakliyesi düşülmüş ₺/kg
const PHI = 3 // ≈ etikette yazan bekleme süresi (gün)
const ROT = 0.03 // ≈ toplanmayı bekleyen domatesin günlük kaybı (aşırı olgunlaşma, çatlama)
const risk = (g: number) => (g >= PHI ? 0.02 : 0.25 * (PHI - g)) // ≈ analizde sınırı aşma ihtimali

const ton = (n: number) => `${(Math.round(n / 100) / 10).toLocaleString('tr-TR')} ton`
const lira = (n: number) => `${n.toLocaleString('tr-TR')} ₺`

export function antalyaModel(p: Params) {
  const g = Math.round(p.gun ?? 0)
  const x = (p.ihracat ?? 0) / 100
  const kg = P * (1 - ROT * g)
  const kgE = Math.min(P * x, kg) // sipariş tonla verilir; bekleyince kaybolan hale gidecek paydan düşer
  const kgH = kg - kgE
  const r = risk(g)
  const hit = (p.u ?? 1) < r // gerçekleşen: parti döndü mü
  const expected = kgE * ((1 - r) * EXPORT + r * IADE) + kgH * HAL_NET
  const net = kgE * (hit ? IADE : EXPORT) + kgH * HAL_NET
  return { g, x, kg, kgE, kgH, r, hit, expected, net, lost: P - kg }
}
const FLOOR = antalyaModel({ gun: 0, ihracat: ORDER * 100 }).expected // beklemeden hepsi ihracata

// ── Sahne ───────────────────────────────────────────────────

const PLAN = ilPlan('Antalya')
const height = makeHeight(PLAN.recipe)
const at = (x: number, z: number, dy = 0): V3 => [x, height(x, z) + dy, z]
const [VX, VZ] = PLAN.village
const road = PLAN.recipe.road
const roadZ = (x: number) => {
  for (let i = 0; i < road.length - 1; i++) if (x >= road[i][0] && x <= road[i + 1][0]) return road[i][1] + ((x - road[i][0]) / (road[i + 1][0] - road[i][0])) * (road[i + 1][1] - road[i][1])
  return road[0][1]
}
const onRoad = (x: number): V3 => at(x, roadZ(x) + 0.35, 0.02)
// seralar: köyden biraz uzak, yola en yakın sera parseli
const GH = PLAN.plots
  .filter((p) => p.urun === 'sera' && Math.hypot(p.x - VX, p.z - VZ) > 4.5)
  .sort((a, b) => Math.abs(a.z + a.d / 2 - roadZ(a.x)) - Math.abs(b.z + b.d / 2 - roadZ(b.x)))[0]
const EDGE = GH.z + GH.d / 2 // seraların yola bakan kenarı
const AHMET: [number, number] = [GH.x + 1.2, (EDGE + roadZ(GH.x)) / 2]
const PILE: [number, number] = [GH.x - 0.6, (EDGE + roadZ(GH.x)) / 2]
const STOP_E = GH.x + 3.2 // ihracatçının frigorifik TIR'ı
const STOP_H = GH.x - 3.2 // hal kamyonu
const FAR = 20
const up = (q: V3, dy: number): V3 => [q[0], q[1] + dy, q[2]]

/** Sırt pompalı ilaççı: seraların önünde yürür, arkasında ince sis. */
function Sprayer({ t }: { t: number }) {
  const x = GH.x - GH.w / 2 + 0.3 + (GH.w - 0.6) * t
  const pos = at(x, EDGE - 0.15)
  return (
    <group position={pos}>
      <group scale={1.2}>
        <Person position={[0, 0, 0]} shirt="#5c7a5a" anim="idle" />
      </group>
      <mesh position={[-0.12, 0.55, 0]}>
        <boxGeometry args={[0.12, 0.2, 0.1]} />
        <meshStandardMaterial color="#d9c34a" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.3 - i * 0.18, 0.4 + i * 0.03, 0]}>
          <sphereGeometry args={[0.09 + i * 0.03, 6, 5]} />
          <meshStandardMaterial color="#e8f0e6" transparent opacity={0.35 - i * 0.08} />
        </mesh>
      ))}
    </group>
  )
}

function Scene({ step, k, params }: SceneProps) {
  const M = antalyaModel(params)
  const say = (text: string) => <Bubble position={at(AHMET[0], AHMET[1], 1.25)}>{text}</Bubble>
  const arrive = step === 'siparis' ? ease(seg(k, 0, 0.5)) : 1
  const showE = ['siparis', 'choose', 'bekle', 'sevk'].includes(step) || (step === 'analiz' && M.hit && k > 0.55)
  const leaveE = step === 'sevk' ? ease(seg(k, 0.5, 1)) : 0
  const backE = step === 'analiz' && M.hit ? 1 - ease(seg(k, 0.55, 0.95)) : 0
  const xE = step === 'analiz' ? STOP_E + (FAR - STOP_E) * backE : STOP_E + (FAR - STOP_E) * (1 - arrive) + (FAR - STOP_E) * leaveE
  const leaveH = step === 'sevk' ? ease(seg(k, 0.5, 1)) : 0
  const showH = step === 'sevk' && M.kgH > 0
  const day = step === 'bekle' ? Math.round(seg(k, 0.05, 0.85) * M.g) : M.g
  const crates = step === 'bekle' ? Math.round(seg(k, 0.1, 0.9) * 10) : step === 'choose' || step === 'siparis' ? 0 : step === 'sevk' ? Math.round(10 * (1 - seg(k, 0.2, 0.5))) : 0

  return (
    <group>
      {step === 'intro' && <Sprayer t={seg(k, 0, 0.9)} />}
      <group scale={1.35} position={at(...AHMET)}>
        <Person position={[0, 0, 0]} shirt="#a0583f" anim={step === 'bekle' ? 'pick' : step === 'analiz' && k > 0.8 && !M.hit ? 'cheer' : 'idle'} />
      </group>
      {crates > 0 && <Crates position={at(...PILE)} n={crates} />}
      {showE && <Truck position={onRoad(xE)} yaw={Math.PI} color="#eef1f2" cargo={step === 'sevk' && k > 0.3 ? Math.round(14 * M.x / ORDER) : step === 'analiz' ? 10 : 0} />}
      {showH && <Truck position={onRoad(STOP_H - (STOP_H + FAR) * leaveH)} yaw={0} color="#8c8a7e" cargo={k > 0.3 ? 10 : 0} />}

      {step === 'intro' && k > 0.35 && <PriceTag position={at(GH.x, EDGE, 1.4)} text={`İlaç etiketi: hasattan ${PHI} gün önce kes`} />}
      {step === 'siparis' && k > 0.4 && <PriceTag position={up(onRoad(STOP_E), 1.3)} text={`İhracatçı ${lira(EXPORT)} · ${ton(P * ORDER)} · analizli`} />}
      {step === 'siparis' && k > 0.6 && <PriceTag position={up(onRoad(STOP_H), 1.3)} text={`Hal ≈ ${lira(HAL)} · kesinti %${Math.round(CUT * 100)}`} />}
      {step === 'bekle' && <PriceTag position={at(GH.x, EDGE, 1.4)} text={day === 0 ? 'Bugün topla' : `İlaçtan sonra ${day}. gün`} />}
      {step === 'analiz' && k > 0.25 && <PriceTag position={up(onRoad(GH.x + 6), 1.5)} text={M.x === 0 ? 'İhracat yok' : M.hit ? 'Analiz: kalıntı sınırın üstünde · iade' : 'Analiz: temiz ✓'} />}

      {step === 'intro' && k > 0.15 && say('Beyaz sinek çıktı, dün ilaç attık.')}
      {step === 'siparis' && k > 0.7 && say('Kamyon yarın yükleyecek. Hasat beklemez…')}
      {step === 'bekle' && k > 0.5 && say(M.g === 0 ? 'Bekleyemeyiz, topluyoruz.' : M.g > PHI + 1 ? 'Domates dalda kızarıp çatlıyor.' : 'Etiketteki günü bekledik.')}
      {step === 'analiz' && k > 0.8 && M.x > 0 && say(M.hit ? 'Parti döndü! Hale yarı fiyatına gidecek.' : 'Geçti. Alıcı yine gelir.')}
      {step === 'analiz' && k > 0.85 && <FloatMoney position={up(onRoad(STOP_E + 1), 1.2)} amount={M.net} big />}
    </group>
  )
}

// ── Karar ───────────────────────────────────────────────────

const DECISION: Decision = {
  question: `Dün ilaç atıldı; etiket "${PHI} gün bekle" diyor. İhracatçı ${ton(P * ORDER)} istiyor ve partiyi [[kalinti|kalıntı]] analizine sokacak. Kaç gün beklensin, ne kadarı ihracata gitsin?`,
  controls: [
    { id: 'gun', label: 'Hasattan önce bekle', min: 0, max: 7, step: 1, def: 0, format: (v) => (v === 0 ? 'beklemeden' : `${v} gün · ${ton(P * ROT * v)} kayıp`) },
    { id: 'ihracat', label: 'İhracatçıya', min: 0, max: ORDER * 100, step: 10, def: 0, format: (v) => `%${v} · ${lira(EXPORT)}, kalanı hale` },
  ],
  meters: (p) => {
    const M = antalyaModel(p)
    return [
      { label: 'Analizde dönme ihtimali', ok: M.kgE > 0 ? M.r < 0.1 : undefined, text: M.kgE > 0 ? `%${Math.round(M.r * 100)}` : 'ihracat yok' },
      { label: 'Bekleyince kaybolan', text: ton(M.lost) },
      { label: 'Halde kesinti sonrası', text: `${lira(Math.round(HAL_NET * 10) / 10)}/kg` },
    ]
  },
  next: () => 'bekle',
  roll: () => ({ u: Math.random() }),
  predict: { question: 'Sence parti analizden geçer mi?', answer: (p) => !antalyaModel(p).hit },
}

const score = (p: Params) => antalyaModel(p).expected

export const chAntalya: ChapterDef = {
  id: 105,
  il: 'Antalya',
  offset: [0, 0],
  title: 'Kalıntı',
  goal: 'Domates ihracattan dönmesin, dalda da çürümesin',
  crop: 'Sera domatesi · ihracat',
  flow: {
    intro: { next: 'siparis', dur: 5.5 },
    siparis: { next: 'choose', dur: 5.5 },
    bekle: { next: 'sevk', dur: 6 },
    sevk: { next: 'analiz', dur: 5 },
    analiz: { next: 'result', dur: 7 },
  },
  month: { intro: 'Kasım', siparis: 'Kasım', choose: 'Kasım', bekle: 'Kasım', sevk: 'Kasım', analiz: 'Aralık', result: 'Aralık' },
  shot: {
    intro: { f: [GH.x, EDGE], z: 1.6 },
    siparis: { f: [GH.x, roadZ(GH.x)], z: 1.3 },
    choose: { f: [GH.x, EDGE + 0.5], z: 1.3 },
    bekle: { f: [GH.x, EDGE], z: 1.6 },
    sevk: { f: [GH.x, roadZ(GH.x)], z: 1.25 },
    analiz: { f: [GH.x + 3, roadZ(GH.x + 3)], z: 1.2 },
    result: { f: [GH.x, EDGE + 0.5], z: 1.15 },
  },
  lesson: '[[kalinti|kalıntı]]: ilacın bekleme süresi',
  icon: 'lab',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = antalyaModel(p)
    const best = bestOf(DECISION, score)
    // yıldız şansa değil karara bağlı: beklenen değer
    const stars = starsFor(M.expected, best, FLOOR)
    return {
      good: stars >= 2,
      stars,
      caption: 'Ahmet Abi ve komşularının eline geçen',
      value: tl(M.net),
      compare:
        M.kgE > 0 && M.g < PHI
          ? M.hit
            ? 'Bekleme süresine uyulmadı, parti döndü'
            : `Bekleme süresine uyulmadı; bu sefer şans yaver gitti (dönme ihtimali %${Math.round(M.r * 100)})`
          : M.g > PHI + 1
            ? 'Gereğinden uzun beklendi: domates dalda kaybedildi'
            : M.x < ORDER
              ? 'Sipariş dolmadı: fazlası hale kesintiyle gitti'
              : stars >= 3
                ? 'Etiketteki gün beklendi, sipariş tam gitti, analiz temiz'
                : 'Biraz daha iyisi mümkündü',
      chain: [
        { label: M.g === 0 ? 'Beklemeden toplandı' : `${M.g} gün beklendi`, value: M.g ? `−${ton(M.lost)} domates` : '—', ok: M.g >= PHI },
        { label: `İhracata ${ton(M.kgE)} · analiz`, value: M.kgE === 0 ? '—' : M.hit ? `döndü, ${lira(IADE)}/kg` : `+${tl(M.kgE * EXPORT)}`, ok: M.kgE > 0 && !M.hit },
        { label: `Hale ${ton(M.kgH)} · ${lira(HAL)}, %${Math.round(CUT * 100)} kesinti`, value: `+${tl(M.kgH * HAL_NET)}` },
      ],
      bars: [
        { label: 'Beklemeden hepsi ihracata (ortalama)', value: FLOOR, max: best, unit: '₺', on: false },
        { label: 'Senin kararın (ortalama)', value: M.expected, max: best, unit: '₺', on: true },
        { label: 'En iyi ayar', value: best, max: best, unit: '₺', on: false },
      ],
      barsNote: `İhracat ${lira(EXPORT)}; hal ${lira(HAL)} eksi %8 komisyon, %1 rüsum, %2 stopaj; dönen parti ${lira(IADE)}`,
      lesson: stars >= 2 ? '[[kalinti|kalıntı]]: ilacın bekleme süresi' : undefined,
    }
  },
  Scene,
}
