// Özel bölüm — Malatya, "Don gecesi" (kayısı, TARSİM). Malatya'nın il sahnesinde oynar.
// Karar: dar bütçeyle bahçelerin ne kadarı sigortalansın, ne kadarına önlem alınsın. Don yazı turayla gelir.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Bubble, CoinFlight, FloatMoney, Person, PriceTag } from './actors'
import { bestOf, ease, seg, starsFor, tl, type ChapterDef, type Decision, type Params, type SceneProps } from './engine'
import { ilPlan, type Plot } from '../scene/ilgen'
import { makeHeight, noise } from '../scene/landgen'

type V3 = [number, number, number]

const VALUE = 1_200_000 // 🎲 Hüseyin Amca ile komşularının kayısısının değeri (bu yıl, tüccar fiyatıyla)
const BUDGET = 45_000 // 🎲 baharda bu iş için ayrılabilen para
const DEBT = 790_000 // 🎲 sonbaharda bankaya ve bayiye ödenecek borç
const CHANCE = 0.4 // ≈ bu bahar don ihtimali (Malatya'da ilkbahar donu sık; 2025'te büyük kayıp yaşandı)
const SEVERE = 0.5 // ≈ don gelirse sert (−4°C altı) olma ihtimali
const PREM_FULL = VALUE * 0.06 * 0.5 // ≈ prim %6, yarısı devletten (✅ %50 destek; 2026'da yalnız kış donunda %70)
const GUARD_FULL = VALUE * 0.02 // ≈ bütün bahçeye sisleme ve rüzgâr makinesi
const COVER = 0.6 // ≈ kayısıda don teminatında muafiyet ve kapsam sonrası ödenen pay
// kayıp oranları: [önlemsiz, önlemli] — önlem hafif donda çok, sert donda az işe yarar
const LOSS = { hafif: [0.4, 0.05], sert: [0.8, 0.45] } as const

export function malatyaModel(p: Params) {
  const ins = (p.sigorta ?? 0) / 100
  const guard = (p.onlem ?? 0) / 100
  const prem = PREM_FULL * ins
  const gcost = GUARD_FULL * guard
  const cost = prem + gcost
  const short = cost > BUDGET + 1
  const loss = (k: keyof typeof LOSS) => VALUE * ((1 - guard) * LOSS[k][0] + guard * LOSS[k][1])
  const after = (L: number) => VALUE - L * (1 - COVER * ins) - cost // donda eline geçen
  const worst = after(loss('sert'))
  const fine = VALUE - cost
  const exp = (1 - CHANCE) * fine + CHANCE * ((1 - SEVERE) * after(loss('hafif')) + SEVERE * worst)
  const frost = (p.don ?? 0) > 0
  const kind: keyof typeof LOSS = (p.sert ?? 0) > 0 ? 'sert' : 'hafif'
  const lossNow = frost ? loss(kind) : 0
  const payNow = lossNow * COVER * ins
  return { ins, guard, prem, gcost, cost, short, worst, fine, exp, frost, kind, lossNow, payNow, net: VALUE - lossNow + payNow - cost, safe: worst >= DEBT && !short }
}

// ── Sahne ───────────────────────────────────────────────────

const PLAN = ilPlan('Malatya')
const height = makeHeight(PLAN.recipe)
const at = (x: number, z: number, dy = 0): V3 => [x, height(x, z) + dy, z]
const [VX, VZ] = PLAN.village

function cells(p: Plot, dx: number, dz: number, jitter = 0) {
  const out: [number, number][] = []
  for (let x = p.x - p.w / 2 + dx / 2; x < p.x + p.w / 2; x += dx)
    for (let z = p.z - p.d / 2 + dz / 2; z < p.z + p.d / 2; z += dz)
      out.push([x + (noise(x * 5, z * 5, 3) - 0.5) * jitter, z + (noise(x * 4, z * 6, 4) - 0.5) * jitter])
  return out
}

// Hüseyin Amca'nın bahçeleri: köye en yakın üç kayısı parseli (il sahnesindeki ağaçların aynısı)
const ORCH = PLAN.plots
  .filter((p) => p.urun === 'kayisi')
  .sort((a, b) => Math.hypot(a.x - VX, a.z - VZ) - Math.hypot(b.x - VX, b.z - VZ))
  .slice(0, 3)
const TREES: [number, number][] = ORCH.flatMap((p) => cells(p, 1.15 * 0.85, 1.05 * 0.85, 0.15))
const CENTER: [number, number] = [ORCH.reduce((a, p) => a + p.x, 0) / ORCH.length, ORCH.reduce((a, p) => a + p.z, 0) / ORCH.length]
const HUSEYIN: [number, number] = [ORCH[0].x - ORCH[0].w / 2 - 0.6, ORCH[0].z + 0.4]

/** Çiçekler: taçların üstünde; don vurunca kavrulur. guardedShare: önlem alınan ağaçların payı. */
function Blossoms({ burnt, guardedBurnt, guardedShare }: { burnt: number; guardedBurnt: number; guardedShare: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const per = 9
  const pts = useMemo(() => {
    const out: { p: V3; tree: number }[] = []
    TREES.forEach(([x, z], t) => {
      const [, y] = at(x, z)
      for (let i = 0; i < per; i++) {
        const a = noise(t * 3.1, i * 1.7, 9) * Math.PI * 2
        const up = 0.25 + noise(t * 1.3, i * 2.9, 5) * 0.75
        const r = 0.33
        out.push({ p: [x + Math.cos(a) * r * Math.sqrt(1 - up * up), y + 0.61 + up * r * 0.9, z + Math.sin(a) * r * Math.sqrt(1 - up * up)], tree: t })
      }
    })
    return out
  }, [])
  const fresh = useMemo(() => new THREE.Color('#f7e4ea'), [])
  const brown = useMemo(() => new THREE.Color('#8a6a4a'), [])
  useFrame(() => {
    const m = ref.current
    if (!m) return
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    pts.forEach((b, i) => {
      o.position.set(...b.p)
      o.scale.setScalar(1)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      const guarded = b.tree / TREES.length < guardedShare
      const k = guarded ? guardedBurnt : burnt // önlemli ağaçta az kavrulur
      const hit = noise(i * 0.7, b.tree * 1.1, 2) < k
      c.copy(fresh).lerp(brown, hit ? 1 : 0)
      m.setColorAt(i, c)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pts.length]} frustumCulled={false}>
      <icosahedronGeometry args={[0.065, 0]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  )
}

/** Gece kırağısı: bahçelerin üstünde parıldayan buz kristalleri. */
function Frost({ on }: { on: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const n = 160
  const pts = useMemo(() => Array.from({ length: n }, (_, i) => {
    const [x, z] = TREES[i % TREES.length]
    return at(x + (noise(i, 1, 3) - 0.5) * 0.9, z + (noise(i, 2, 3) - 0.5) * 0.9, 0.3 + noise(i, 3, 3) * 0.9)
  }), [])
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const o = new THREE.Object3D()
    pts.forEach((q, i) => {
      o.position.set(q[0], q[1] - ((clock.elapsedTime * 0.15 + i * 0.37) % 1) * 0.3, q[2])
      o.scale.setScalar(on * (0.6 + 0.4 * Math.sin(clock.elapsedTime * 4 + i)))
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false}>
      <octahedronGeometry args={[0.035, 0]} />
      <meshBasicMaterial color="#e8f4ff" />
    </instancedMesh>
  )
}

/** Sisleme ateşi: titreyen turuncu ışık ve yükselen duman. */
function SmudgePot({ position, phase }: { position: V3; phase: number }) {
  const glow = useRef<THREE.Mesh>(null)
  const puff = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    if (glow.current) glow.current.scale.setScalar(0.8 + Math.sin(t * 13) * 0.15 + Math.sin(t * 7) * 0.1)
    puff.current?.children.forEach((c, i) => {
      const u = (t * 0.4 + i / 3) % 1
      c.position.set(Math.sin(t + i) * 0.05, 0.15 + u * 0.8, 0)
      c.scale.setScalar(0.06 + u * 0.12)
    })
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 8]} />
        <meshStandardMaterial color="#3b3530" />
      </mesh>
      <mesh ref={glow} position={[0, 0.13, 0]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshBasicMaterial color="#ff9a3a" />
      </mesh>
      <pointLight position={[0, 0.25, 0]} color="#ff9a3a" intensity={0.6} distance={1.6} decay={2} />
      <group ref={puff}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 6, 5]} />
            <meshStandardMaterial color="#9a958c" transparent opacity={0.45} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Rüzgâr makinesi: soğuk havayı karıştıran direkli pervane. */
function WindMachine({ position, spin }: { position: V3; spin: boolean }) {
  const rotor = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (rotor.current && spin) rotor.current.rotation.z += dt * 9
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 1.4, 6]} />
        <meshStandardMaterial color="#c9ccc6" />
      </mesh>
      <group ref={rotor} position={[0, 1.4, 0.06]}>
        {[0, Math.PI].map((r) => (
          <mesh key={r} rotation-z={r} position={[0, 0, 0]}>
            <boxGeometry args={[0.06, 0.6, 0.02]} />
            <meshStandardMaterial color="#e8ebe6" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Scene({ step, k, params }: SceneProps) {
  const M = malatyaModel(params)
  const guardedTrees = TREES.slice(0, Math.round(TREES.length * M.guard))
  const showGuard = ['prep', 'night', 'morning', 'result'].includes(step)
  const grow = M.frost ? (step === 'night' ? seg(k, 0.6, 0.95) : ['morning', 'result'].includes(step) ? 1 : 0) : 0
  const L = LOSS[M.kind]
  const low = !M.frost ? 1 : M.kind === 'sert' ? -5 : -2
  const temp = step === 'night' ? 4 + (low - 4) * ease(seg(k, 0, 0.8)) : null
  const say = (text: string) => <Bubble position={at(HUSEYIN[0], HUSEYIN[1], 1.25)}>{text}</Bubble>
  const pots = guardedTrees.filter((_, i) => i % 3 === 0)
  const machines = M.guard > 0 ? ORCH.slice(0, Math.max(1, Math.round(ORCH.length * M.guard))).map((p) => at(p.x, p.z + p.d / 2 - 0.3)) : []

  return (
    <group>
      <Blossoms burnt={grow * L[0]} guardedBurnt={grow * L[1]} guardedShare={M.guard} />
      <Frost on={step === 'night' ? seg(k, 0.4, 0.7) * (M.frost ? 1 : 0.35) : 0} />
      <group scale={1.35} position={at(...HUSEYIN)}>
        <Person position={[0, 0, 0]} shirt="#6a5a3f" anim={step === 'morning' && (!M.frost || M.safe) ? 'cheer' : 'idle'} />
      </group>
      {showGuard && pots.map(([x, z], i) => <SmudgePot key={i} position={at(x + 0.35, z)} phase={i * 0.7} />)}
      {showGuard && machines.map((q, i) => <WindMachine key={i} position={q} spin={step === 'night'} />)}

      {step === 'warn' && k > 0.2 && <PriceTag position={at(CENTER[0], CENTER[1], 1.9)} text={`Meteoroloji: bu gece don ihtimali %${CHANCE * 100}`} />}
      {temp !== null && <PriceTag position={at(CENTER[0], CENTER[1], 1.9)} text={`Gece ${temp.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}°C`} />}
      {step === 'morning' && k > 0.2 && <PriceTag position={at(CENTER[0], CENTER[1], 1.9)} text={M.frost ? `${M.kind === 'sert' ? 'Sert' : 'Hafif'} don: kayıp ${tl(M.lossNow)}` : 'Don gelmedi'} />}

      {step === 'intro' && k > 0.1 && say('Kayısı çiçeğe durdu. En güzel, en korkulu zaman.')}
      {step === 'warn' && k > 0.5 && say('Bir gece don, bütün yılın emeği…')}
      {step === 'prep' && k > 0.3 && say(M.guard > 0 ? 'Ateşleri yakın, makineleri çalıştırın!' : 'Allah korusun, bekleyeceğiz.')}
      {step === 'morning' && k > 0.45 && say(!M.frost ? 'Çiçekler sağlam, şükür.' : M.ins > 0 ? 'Yandı ama sigorta var.' : 'Bu yıl borcu nasıl ödeyeceğiz?')}

      {step === 'morning' && M.frost && M.ins > 0 && k > 0.5 && (
        <>
          <CoinFlight from={at(VX, VZ, 2)} to={at(HUSEYIN[0], HUSEYIN[1], 1)} n={10} />
          <FloatMoney position={at(HUSEYIN[0], HUSEYIN[1], 1.8)} amount={M.payNow} big />
        </>
      )}
    </group>
  )
}

// ── Karar ───────────────────────────────────────────────────

const DECISION: Decision = {
  question: `Bütçe ${tl(BUDGET)}. Bahçelerin ne kadarı [[tarsim|TARSİM]]'le sigortalansın, ne kadarına önlem alınsın?`,
  controls: [
    { id: 'sigorta', label: 'Sigorta', min: 0, max: 100, step: 10, def: 0, format: (v) => `%${v} · ${tl((PREM_FULL * v) / 100)}` },
    { id: 'onlem', label: 'Önlem (sisleme, rüzgâr makinesi)', min: 0, max: 100, step: 10, def: 0, format: (v) => `%${v} · ${tl((GUARD_FULL * v) / 100)}` },
  ],
  meters: (p) => {
    const M = malatyaModel(p)
    return [
      { label: `Bütçe ${tl(BUDGET)}`, ok: !M.short, text: M.short ? `${tl(M.cost - BUDGET)} aşıyor` : `${tl(BUDGET - M.cost)} artıyor` },
      { label: 'Sert donda eline geçen', text: tl(M.worst) },
    ]
  },
  next: () => 'prep',
  roll: () => ({ don: Math.random() < CHANCE ? 1 : 0, sert: Math.random() < SEVERE ? 1 : 0 }),
  predict: { question: `Sence sert don gelirse Hüseyin Amca sonbaharda ${tl(DEBT)} borcunu ödeyebilir mi?`, answer: (p) => malatyaModel(p).safe },
}

const score = (p: Params) => {
  const M = malatyaModel(p)
  return M.safe && !M.short ? M.exp : -Infinity
}
const FLOOR = malatyaModel({}).exp // hiçbir şey yapmamanın beklenen değeri

export const chMalatya: ChapterDef = {
  id: 101,
  il: 'Malatya',
  offset: [0, 0],
  title: 'Don gecesi',
  goal: 'Bir gecelik don bütün yılı götürmesin',
  crop: 'Kayısı · TARSİM',
  flow: {
    intro: { next: 'warn', dur: 5 },
    warn: { next: 'choose', dur: 5 },
    prep: { next: 'night', dur: 4.5 },
    night: { next: 'morning', dur: 8 },
    morning: { next: 'result', dur: 5.5 },
  },
  month: { intro: 'Mart', warn: 'Mart', choose: 'Mart', prep: 'Mart', night: 'Mart gecesi', morning: 'Mart', result: 'Mart' },
  shot: {
    intro: { f: [HUSEYIN[0] + 1.5, HUSEYIN[1] - 0.5], z: 1.6 },
    warn: { f: CENTER, z: 1.3 },
    choose: { f: CENTER, z: 1.2 },
    prep: { f: CENTER, z: 1.45 },
    night: { f: CENTER, z: 1.6 },
    morning: { f: CENTER, z: 1.4 },
    result: { f: CENTER, z: 1.15 },
  },
  night: (s) => (s === 'night' ? 1 : s === 'prep' ? 0.45 : 0),
  lesson: '[[tarsim|tarım sigortası]] ve önlem',
  icon: 'contract',
  decision: DECISION,
  result: (_path, p = {}) => {
    const M = malatyaModel(p)
    const best = bestOf(DECISION, score)
    const stars = M.safe ? Math.max(1, starsFor(M.exp, best, FLOOR)) : 0
    return {
      good: stars >= 2,
      stars,
      caption: `${M.frost ? (M.kind === 'sert' ? 'Sert don' : 'Hafif don') : 'Don gelmedi'} · Hüseyin Amca'nın eline geçen`,
      value: tl(M.net),
      compare: M.short
        ? 'Bütçe aşıldı: bu kadar sigorta ve önlem birden yapılamaz'
        : !M.safe
          ? M.frost && M.kind === 'sert'
            ? `Sert don geldi, borç ${tl(DEBT)}: ödenemedi`
            : 'Bu yıl şans yaver gitti; sert don gelseydi borç ödenemeyecekti'
          : stars >= 3
            ? 'Önlem hafif donu, sigorta sert donu karşıladı: her durumda borç ödeniyor'
            : 'Borç güvende ama bütçe daha iyi dağıtılabilirdi',
      chain: [
        { label: `%${Math.round(M.ins * 100)} sigorta (primin yarısı devletten)`, value: `−${tl(M.prem)}` },
        { label: `%${Math.round(M.guard * 100)} bahçede önlem`, value: `−${tl(M.gcost)}` },
        { label: M.frost ? `Gece ${M.kind === 'sert' ? 'sert' : 'hafif'} don` : 'Gece don gelmedi', value: M.frost ? `kayıp −${tl(M.lossNow)}` : 'kayıp yok', ok: !M.frost },
        ...(M.frost && M.ins > 0 ? [{ label: 'TARSİM hasar ödemesi', value: `+${tl(M.payNow)}`, ok: true }] : []),
        { label: `Sonbahar borcu ${tl(DEBT)}`, value: M.net >= DEBT ? 'ödenir' : `${tl(DEBT - M.net)} eksik`, ok: M.net >= DEBT },
      ],
      bars: [
        { label: 'Sert don gelirse', value: M.worst, max: VALUE, unit: '₺', on: M.frost && M.kind === 'sert' },
        { label: 'Gelmezse', value: M.fine, max: VALUE, unit: '₺', on: !M.frost },
      ],
      barsNote: 'Don gelir mi bilinmez; yıldız sonuca değil karara verilir',
      lesson: stars >= 2 ? '[[tarsim|tarım sigortası]] ve önlem' : undefined,
    }
  },
  Scene,
}
