import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Paint, mix, usePalette } from './kit'
import type { ProducerId } from '../sim/engine'
import { Terrain } from './Terrain'
import { Barn, BottlingShed, Bunting, CoopDepot, Fountain, MilkTank, Mosque, Sign, Silo } from './buildings'
import { Gossip, PowerPole, School, Teahouse, VALLEY_TEA, VillageHouse, Woodpile } from './village'
import { roadZAt } from './roadline'
import { Flock, Grow, SowingField, Strollers } from './life'
import { Truck } from '../chapter/actors'
import { PineForest, SmallOrchard } from './instanced'
import { EGE_VALLEY, makeHeight, noise, scatterOutside, zoneWeight } from './landgen'

export const height = makeHeight(EGE_VALLEY)
export const at = (x: number, z: number, dy = 0): [number, number, number] => [x, height(x, z) + dy, z]

// Ege vadisi, yer tutucu geometriyle. Koordinat: x doğu, z güney, y yukarı.
// Sol üst yamaçta kovanlar, ortada zeytinlik (hasatta), sağda ahır, önde sera, arada köy yolu.

type V3 = [number, number, number]

const FRUIT: V3[] = [
  [0.35, 0.9, 0.3], [-0.3, 1.0, 0.32], [0.1, 1.2, 0.35], [0.42, 1.05, -0.1], [-0.4, 0.88, -0.05],
]

// Zeytin: eğri gövde, gümüşi yeşil yuvarlak kümeler
const OLIVE_BLOBS: { q: V3; r: number; tone: number }[] = [
  { q: [0, 0.98, 0], r: 0.42, tone: 0 },
  { q: [0.3, 0.9, 0.14], r: 0.3, tone: 0.35 },
  { q: [-0.28, 0.92, -0.1], r: 0.32, tone: 0.15 },
  { q: [0.06, 1.16, -0.2], r: 0.27, tone: 0.5 },
  { q: [-0.12, 0.86, 0.3], r: 0.24, tone: 0.25 },
]

export function OliveTree({ position, scale = 1, fruit = false }: { position: V3; scale?: number; fruit?: boolean }) {
  const p = usePalette()
  return (
    <group position={position} scale={scale}>
      {fruit &&
        FRUIT.map((q, i) => (
          <mesh key={i} position={q}>
            <sphereGeometry args={[0.055, 6, 5]} />
            <Paint color="#4a3048" />
          </mesh>
        ))}
      <mesh position={[0.03, 0.22, 0]} rotation-z={-0.18} castShadow>
        <cylinderGeometry args={[0.08, 0.13, 0.46, 7]} />
        <Paint color={p.trunk} />
      </mesh>
      <mesh position={[-0.02, 0.58, 0.02]} rotation-z={0.22} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.36, 7]} />
        <Paint color={p.trunk} />
      </mesh>
      {OLIVE_BLOBS.map((b, i) => (
        <mesh key={i} position={b.q} scale={[1, 0.82, 1]} castShadow>
          <sphereGeometry args={[b.r, 12, 9]} />
          <Paint color={mix(p.olive, '#b4bb92', b.tone)} />
        </mesh>
      ))}
    </group>
  )
}

// Kızılçam: yumuşak, üst üste iki taç
export function Pine({ position }: { position: V3 }) {
  const p = usePalette()
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.6, 7]} />
        <Paint color={p.trunk} />
      </mesh>
      <mesh position={[0, 0.9, 0]} scale={[1, 0.85, 1]} castShadow>
        <sphereGeometry args={[0.44, 12, 9]} />
        <Paint color={p.pine} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.34, 0.75, 12]} />
        <Paint color={mix(p.pine, '#8fae6e', 0.2)} />
      </mesh>
    </group>
  )
}

export function Hive({ position }: { position: V3 }) {
  const p = usePalette()
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.35, 0.4, 0.3]} />
        <Paint color={p.hive} />
      </mesh>
      <mesh position={[0, 0.43, 0]} castShadow>
        <boxGeometry args={[0.42, 0.06, 0.36]} />
        <Paint color={p.hiveLid} />
      </mesh>
    </group>
  )
}

export function Cow({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const p = usePalette()
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.7, 0.35, 0.3]} />
        <Paint color={p.cow} />
      </mesh>
      <mesh position={[0.42, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <Paint color={p.cow} />
      </mesh>
      {[-0.25, 0.25].map((x) =>
        [-0.1, 0.1].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.09, z]}>
            <boxGeometry args={[0.07, 0.18, 0.07]} />
            <Paint color={p.trunk} />
          </mesh>
        )),
      )}
    </group>
  )
}


type Stage = 'bos' | 'fide' | 'yesil' | 'kirmizi'

function tomatoStage(m: number): Stage {
  if (m >= 9 && m <= 11) return 'kirmizi' // Temmuz–Eylül hasat
  if (m === 8) return 'yesil' // Haziran
  if (m >= 5) return 'fide' // Mart–Mayıs
  return 'bos' // Ekim–Şubat
}

// Hasan Dayı'nın açık tarlası: mevsime göre boş toprak, fide, yeşil, kırmızı.
function TomatoField({ position, month }: { position: V3; month: number }) {
  const p = usePalette()
  const stage = tomatoStage(month)
  const rows = [-0.8, -0.27, 0.27, 0.8]
  const xs = [-1.4, -0.85, -0.3, 0.25, 0.8, 1.35]
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.04, 2.2]} />
        <Paint color="#a5825c" />
      </mesh>
      {rows.map((z) => (
        <group key={z}>
          <mesh position={[0, 0.06, z]}>
            <boxGeometry args={[3.4, 0.05, 0.18]} />
            <Paint color="#8c6a48" />
          </mesh>
          {stage !== 'bos' &&
            xs.map((x) => (
              <group key={x} position={[x, 0, z]}>
                <mesh position={[0, stage === 'fide' ? 0.1 : 0.2, 0]} castShadow>
                  <icosahedronGeometry args={[stage === 'fide' ? 0.07 : 0.17, 0]} />
                  <Paint color={p.tomatoLeaf} />
                </mesh>
                {stage === 'kirmizi' &&
                  [[0.1, 0.22, 0.09], [-0.09, 0.3, -0.06], [0.02, 0.14, -0.12]].map((q, i) => (
                    <mesh key={i} position={q as V3}>
                      <sphereGeometry args={[0.06, 8, 6]} />
                      <Paint color={p.tomato} />
                    </mesh>
                  ))}
              </group>
            ))}
        </group>
      ))}
    </group>
  )
}

// Bal mevsiminde kovanların etrafında uçan arılar.
function Bees({ center }: { center: V3 }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    const t = clock.elapsedTime
    el.children.forEach((b, i) => {
      const a = t * (1.2 + (i % 3) * 0.4) + i * 1.7
      const r = 0.6 + (i % 4) * 0.35
      b.position.set(Math.cos(a) * r * 1.6, 0.7 + Math.sin(a * 2.3 + i) * 0.25, Math.sin(a) * r)
    })
  })
  return (
    <group ref={g} position={center}>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.035, 5, 4]} />
          <meshBasicMaterial color="#e2b23a" />
        </mesh>
      ))}
    </group>
  )
}

// Kış: bacadan yükselen duman.
function Smoke({ position }: { position: V3 }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    const t = clock.elapsedTime
    el.children.forEach((c, i) => {
      const k = (t * 0.35 + i / el.children.length) % 1
      c.position.set(Math.sin(k * 5 + i) * 0.08 + k * 0.25, k * 1.4, 0)
      c.scale.setScalar(0.6 + k * 1.4)
      const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial
      m.opacity = 0.55 * (1 - k)
    })
  })
  return (
    <group ref={g} position={position}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshStandardMaterial color="#f4f1ea" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// İlkbahar kır çiçekleri; sabit, sözde rastgele yerler.
const FLOWERS: { pos: V3; c: string }[] = Array.from({ length: 110 }, (_, i) => {
  const r1 = Math.sin(i * 12.9898) * 43758.5453
  const r2 = Math.sin(i * 78.233) * 12345.6789
  const fx = r1 - Math.floor(r1)
  const fz = r2 - Math.floor(r2)
  return {
    pos: [-8.5 + fx * 17, 0.04, -1.5 + fz * 8.2] as V3,
    c: ['#f6f1e7', '#e9a7b8', '#e8c94a', '#c9b3e0'][i % 4],
  }
}).filter(({ pos: [x, , z] }) => !(x > -4.2 && x < 3.4 && z > -2 && z < 3.6) && !(z > 3 && z < 4.2) && !(x > 2.6 && x < 6.6 && z > 4.3))

function Crate({ position }: { position: V3 }) {
  const p = usePalette()
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.28, 0.2, 0.2]} />
      <Paint color={p.crate} />
    </mesh>
  )
}

function Pin({ position, color, lift = 0 }: { position: V3; color: string; lift?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9 + lift, 0]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <Paint color={color} />
      </mesh>
      <mesh position={[0, 0.55 + lift, 0]} rotation-x={Math.PI}>
        <coneGeometry args={[0.18, 0.5, 16]} />
        <Paint color={color} />
      </mesh>
    </group>
  )
}

// Üreticilerin yeri: tıklanınca kartı açılır. Üye olanın iğnesi vurgu renginde.
const SPOTS: { id: ProducerId; pin: V3; hit: V3; size: V3 }[] = [
  { id: 'ayse', pin: at(0, 1.2, 1.2), hit: at(-0.4, 0.8, 0.8), size: [7, 1.6, 5.4] },
  { id: 'mehmet', pin: at(-6.4, -3.9, 0.9), hit: at(-6.4, -3.9, 0.6), size: [4.5, 1.6, 3] },
  { id: 'fatma', pin: at(5.5, -2.3, 2.6), hit: at(5.5, -1.2, 1), size: [4.5, 2.4, 5] },
  { id: 'hasan', pin: at(4.5, 5.6, 0.9), hit: at(4.5, 5.6, 0.5), size: [4, 1.4, 2.4] },
]

function Producers({
  members,
  selected,
  onPick,
}: {
  members: ProducerId[]
  selected: ProducerId | null
  onPick: (id: ProducerId) => void
}) {
  const p = usePalette()
  const [hover, setHover] = useState<ProducerId | null>(null)
  return (
    <>
      {SPOTS.map((sp) => (
        <group key={sp.id}>
          <mesh
            position={sp.hit}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHover(sp.id)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              setHover(null)
              document.body.style.cursor = 'default'
            }}
            onClick={(e) => {
              e.stopPropagation()
              onPick(sp.id)
            }}
          >
            <boxGeometry args={sp.size} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <Pin
            position={sp.pin}
            color={members.includes(sp.id) ? p.accent : p.ui.muted}
            lift={hover === sp.id || selected === sp.id ? 0.25 : 0}
          />
        </group>
      ))}
    </>
  )
}

// Köy evleri: [x, z, dönüş, boy]
const VILLAGE: [number, number, number, number][] = [
  [-4, 5.8, 0.2, 1], [-2.2, 6, -0.15, 1], [-5.3, 8.3, -0.4, 0.9], [-3.0, 8.6, 0.35, 1.05],
  [-7.9, 5.4, 0.6, 0.9], [-0.9, 8.4, -0.2, 0.85],
]

// Yol boyunca elektrik direkleri
const POLES = [-15, -11, -7, -3.5, 1, 5, 9, 13]

// Çevre tepelerde kendiliğinden çam ormanı: yükseğe ve oynanan alanın dışına
const WILD_PINES: [number, number][] = (() => {
  const out: [number, number][] = []
  const [W, D] = EGE_VALLEY.size
  for (let x = -W / 2 + 0.6; x < W / 2 - 0.6; x += 0.9)
    for (let z = -D / 2 + 0.6; z < D / 2 - 0.6; z += 0.9) {
      const jx = x + (noise(x * 3.1, z * 3.1, 11) - 0.5) * 0.7
      const jz = z + (noise(x * 2.7, z * 2.7, 12) - 0.5) * 0.7
      const h = height(jx, jz)
      const inPlay = Math.abs(jx + 0.5) < 10.5 && jz > -8 && jz < 8
      if (h > 1.55 && !inPlay && noise(jx * 1.3, jz * 1.3, 13) > 0.42) out.push([jx, jz])
    }
  return out
})()

// Oyun alanının dışında ufka kadar orman
const OUTER_PINES = scatterOutside(height, EGE_VALLEY.size, 48, 1.5, 1.2, 41)

// Dekoratif zeytinlikler: sıralı, hafif düzensiz
const GROVE_TREES: [number, number][] = EGE_VALLEY.groves.flatMap((g) => {
  const t: [number, number][] = []
  for (let x = g.x - g.w / 2 + 0.5; x <= g.x + g.w / 2 - 0.4; x += 1.0)
    for (let z = g.z - g.d / 2 + 0.5; z <= g.z + g.d / 2 - 0.4; z += 0.95)
      if (zoneWeight(x, z, g) > 0.5) t.push([x + (noise(x * 4, z * 4, 5) - 0.5) * 0.25, z])
  return t
})

// Tepede dağınık çamlar (kovanların çevresi boş kalır)
const PINES: [number, number][] = [
  [-8.4, -6.4], [-7.4, -6.6], [-6.2, -6.3], [-5.1, -6.0], [-8.6, -5.2], [-4.4, -5.2],
  [-7.9, -4.6], [-8.6, -3.6], [-3.9, -6.4], [-5.6, -5.5], [-8.1, -2.6], [-3.2, -5.6],
  [-2.6, -6.6], [-6.9, -5.6],
]
const HIVES: [number, number][] = [
  [-7.2, -3.6], [-6.6, -3.4], [-6.0, -3.6], [-5.4, -3.4], [-6.9, -4.3], [-6.2, -4.4], [-5.6, -4.2],
]
// ilki (-6.5, 5.4)'teydi; kahvehanenin tavla masasına yer açmak için batıya alındı
const STRAY_OLIVES: [number, number][] = [[-8.7, 4.4], [7.6, 3.2], [-7.8, 1.5], [-6.4, 0.2], [8.2, 1.2]]
// Dere boyunca kavaklar
const POPLARS: [number, number][] = [
  [1.6, -6.4], [3.4, -5.6], [5.6, -5.1], [7.8, -4.6], [2.8, -4.6], [6.6, -3.7],
  [10.4, -3.9], [12.2, -2.0], [14.4, -2.5], [16.0, -1.0], [0.2, -9.6], [-0.8, -11.8],
]

function Poplar({ position }: { position: V3 }) {
  const p = usePalette()
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.5, 5]} />
        <Paint color={p.trunk} />
      </mesh>
      <mesh position={[0, 1.05, 0]} scale={[0.32, 1, 0.32]} castShadow>
        <sphereGeometry args={[0.7, 8, 8]} />
        <Paint color="#7d9a55" />
      </mesh>
    </group>
  )
}

/** Otlayan inek: küçük bir halkada ağır ağır yürür, arada durur. */
function Grazing({ center, phase }: { center: [number, number]; phase: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    const t = clock.elapsedTime * 0.12 + phase
    const walk = Math.max(0, Math.sin(t * 3)) // yürü-dur
    const a = t + walk * 0.6
    const x = center[0] + Math.cos(a) * 0.8
    const z = center[1] + Math.sin(a) * 0.5
    el.position.set(x, height(x, z), z)
    el.rotation.y = -a - Math.PI / 2
  })
  return (
    <group ref={g}>
      <Cow position={[0, 0, 0]} />
    </group>
  )
}

// köylülerin yürüyüş yolları: çeşme ↔ kahvehane, camiden köye, yol boyu
const STROLLS: [number, number][][] = [
  [[-3.5, 5.25], [-4.6, 5.3], [-5.3, 5.2]], // çeşme başındaki teyzelerin batısından, kahvehane önüne
  [[-6.3, 7.5], [-5.0, 7.2], [-3.9, 6.0]],
  [[-8.5, roadZAt(-8.5) + 0.55], [-4, roadZAt(-4) + 0.55], [1.5, roadZAt(1.5) + 0.55]],
  [[-4.4, 9.7], [-4.0, 8.2], [-3.4, 6.9]],
]

export function Valley({
  month,
  members,
  selected,
  onPick,
  chapter = false,
  upgrades = [],
  playing = false,
}: {
  chapter?: boolean // bölüm modunda üretici iğneleri gizli
  upgrades?: number[] // bitirilen bölümler: köyde kalıcı izler
  playing?: boolean // bir bölüm oynanırken izler gizli (sahne bölüme ait)
  month: number
  members: ProducerId[]
  selected: ProducerId | null
  onPick: (id: ProducerId) => void
}) {
  const p = usePalette()
  const m = month % 12
  const fruit = m <= 1 // Ekim–Kasım: tane ağaçta
  const harvest = m >= 1 && m <= 3 // Kasım–Ocak: branda serili
  const crates = m === 1 ? 3 : m === 2 ? 6 : m === 3 ? 9 : 0
  const winter = m >= 2 && m <= 4
  const spring = m >= 5 && m <= 7
  const honey = m === 11 || m <= 1

  const olives: V3[] = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) olives.push(at(-2.6 + c * 1.25 + (r % 2) * 0.6, -1 + r * 1.2))

  return (
    <group>
      <Terrain recipe={EGE_VALLEY} height={height} />

      {/* zeytinlik */}
      {olives.map((pos, i) => (
        <OliveTree key={i} position={pos} scale={0.9 + ((i * 7) % 5) * 0.05} fruit={fruit} />
      ))}
      {harvest &&
        ([[-2.6, -1], [-0.1, 0.2], [1.25, 1.4], [-1.95, 2.6]] as [number, number][]).map(([x, z], i) => (
          <mesh key={i} position={at(x, z, 0.03)} receiveShadow>
            <boxGeometry args={[1.5, 0.02, 1.1]} />
            <Paint color={p.tarp} />
          </mesh>
        ))}
      {Array.from({ length: crates }, (_, i) => (
        <Crate key={i} position={at(1.6 + (i % 3) * 0.3, 2.9, 0.1 + Math.floor(i / 3) * 0.2)} />
      ))}

      {/* tepede çam ormanı ve kovanlar */}
      <PineForest points={PINES.map(([x, z]) => at(x, z))} />
      {HIVES.map(([x, z], i) => (
        <Hive key={i} position={at(x, z)} />
      ))}
      {honey && <Bees center={at(-6.4, -3.9)} />}

      {/* ahır ve inekler */}
      <Barn position={at(5.5, -2.5)} />
      <Grazing center={[4.6, 0.2]} phase={0} />
      {!winter && <Grazing center={[6.2, 0.8]} phase={2.1} />}
      {!winter && <Grazing center={[5.6, -0.1]} phase={4.2} />}

      {/* domates tarlası */}
      <TomatoField position={at(4.5, 5.6)} month={m} />

      {spring &&
        FLOWERS.map((f, i) => (
          <mesh key={i} position={at(f.pos[0], f.pos[2], 0.05)}>
            <sphereGeometry args={[0.09, 6, 5]} />
            <Paint color={f.c} />
          </mesh>
        ))}

      {/* köy: evler, cami, çeşme, taş duvarlar */}
      {VILLAGE.map(([x, z, r, sz], i) => (
        <group key={i}>
          <group scale={sz}>
            <VillageHouse position={[x / sz, height(x, z) / sz, z / sz]} rot={r} style="ege" solar={i % 2 === 0} dish={i % 3 === 1} />
          </group>
          {winter && i < 3 && <Smoke position={[x - 0.3 * sz, height(x, z) + 1.6 * sz, z - 0.18 * sz]} />}
        </group>
      ))}
      <Mosque position={at(-6.8, 7.0)} rot={0.3} />
      <Fountain position={at(-3.4, 4.6)} />
      <Gossip at={at} x={-3.4} z={4.6} side={1} />
      <Teahouse position={at(-5.7, 4.5)} tables={VALLEY_TEA.tables} waiter={VALLEY_TEA.waiter} />
      <School position={at(-4.4, 10.3)} rot={0.15} />
      {/* nadas tarlasında ekim: traktör sıra sıra gider, filizler büyür */}
      <SowingField x={2.6} z={9.4} w={2.9} d={2.3} at={at} />
      {/* yonca tarlasında koyun sürüsü, çoban ve köpek */}
      {!winter && <Flock center={[7.6, 8.4]} n={14} roam={1.1} at={at} seed={3} />}
      <Strollers at={at} paths={STROLLS} />
      <Woodpile position={at(-3.2, 6.5)} rot={-0.15} />
      {POLES.map((x) => (
        <PowerPole key={x} position={at(x, roadZAt(x) + 0.85)} />
      ))}
      {/* köy büyür: her bitirilen bölümün kalıcı izi */}
      {/* yeni yapı zıplayarak belirir; anahtar değişmediği sürece bir kez */}
      {!playing && upgrades.includes(1) && (
        <Grow key="u1" at={at(-0.6, 5.2)}>
          <CoopDepot position={at(-0.6, 5.2)} />
          <Sign position={at(0.6, 4.55)} />
        </Grow>
      )}
      {!playing && upgrades.includes(2) && <Grow key="u2" at={at(1.1, 5.9)}><Sign position={at(1.1, 5.9)} color="#e2b23a" /></Grow>}
      {!playing && upgrades.includes(3) && (
        <Grow key="u3" at={at(7.6, -2.0)}>
          <MilkTank position={at(7.6, -2.0)} />
          <Silo position={at(7.4, -3.4)} />
        </Grow>
      )}
      {!playing && upgrades.includes(4) && <Grow key="u4" at={at(-5.2, -2.6)}><Sign position={at(-5.2, -2.6)} check rot={0.4} /></Grow>}
      {!playing && upgrades.includes(5) && <Grow key="u5" at={at(6.8, 4.6)}><Truck position={at(6.8, 4.6, 0.02)} yaw={0.3} color="#3f6b8a" cargo={8} /></Grow>}
      {!playing && upgrades.includes(6) && <Grow key="u6" at={at(0.9, 7.2)}><BottlingShed position={at(0.9, 7.2)} rot={0.1} /></Grow>}
      {!playing && upgrades.includes(7) && <Grow key="u7" at={at(-4.5, 4.0)}><Bunting from={at(-3.0, 4.0)} to={at(-6.1, 3.9)} /></Grow>}
      {!chapter && <Producers members={members} selected={selected} onPick={onPick} />}
      {STRAY_OLIVES.map(([x, z], i) => (
        <OliveTree key={i} position={at(x, z)} scale={0.75 + (i % 3) * 0.08} />
      ))}
      {POPLARS.map(([x, z], i) => (
        <Poplar key={i} position={at(x, z)} />
      ))}
      <PineForest points={WILD_PINES.map(([x, z]) => at(x, z))} />
      <PineForest points={OUTER_PINES.map(([x, z]) => at(x, z, -0.04))} />
      <SmallOrchard points={GROVE_TREES.map(([x, z]) => at(x, z))} s={0.8} />
    </group>
  )
}
