// Türk köyü: bölgeye göre ev tipleri ve köyü köy yapan ayrıntılar
// (güneşli su ısıtıcısı, çanak anten, çınar altı kahvehane, bayraklı okul, traktör, odun yığını,
// elektrik direği, serender, kümbet ev).
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Paint } from './kit'
import { House, Mosque, Fountain } from './buildings'
import { Person } from '../chapter/actors'

type V3 = [number, number, number]
export type HouseStyle = 'ege' | 'karadeniz' | 'kerpic' | 'tas' | 'kumbet'

// ── küçük ayrıntılar ───────────────────────────────────────

/** Damdaki güneş enerjili su ısıtıcısı: eğik panel + yatay depo. */
export function SolarHeater({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      <mesh position={[0, 0.12, 0]} rotation-x={-0.6}>
        <boxGeometry args={[0.34, 0.02, 0.26]} />
        <meshStandardMaterial color="#2c3e57" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.24, -0.12]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.05, 0.36, 10]} />
        <meshStandardMaterial color="#d9dcdc" metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  )
}

/** Çanak anten. */
export function Dish({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.12, 5]} />
        <Paint color="#8c8478" />
      </mesh>
      <mesh position={[0, 0.13, 0.02]} rotation-x={-1.0}>
        <sphereGeometry args={[0.08, 10, 6, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#e9e6df" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** Türk bayrağı dokusu (ay yıldız), bir kez çizilir. */
let flagTex: THREE.CanvasTexture | null = null
function flag() {
  if (flagTex) return flagTex
  const c = document.createElement('canvas')
  c.width = 96
  c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#e30a17'
  g.fillRect(0, 0, 96, 64)
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.arc(34, 32, 16, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#e30a17'
  g.beginPath()
  g.arc(38, 32, 12.8, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#ffffff'
  g.beginPath()
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
    const x = 54 + Math.cos(a) * 8
    const y = 32 + Math.sin(a) * 8
    if (i) g.lineTo(x, y)
    else g.moveTo(x, y)
  }
  g.closePath()
  g.fill()
  flagTex = new THREE.CanvasTexture(c)
  flagTex.colorSpace = THREE.SRGBColorSpace
  return flagTex
}

export function FlagPole({ position, h = 1.6 }: { position: V3; h?: number }) {
  const t = useMemo(() => flag(), [])
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.02, h, 6]} />
        <meshStandardMaterial color="#d9dcdc" metalness={0.5} />
      </mesh>
      <mesh position={[0.21, h - 0.14, 0]}>
        <planeGeometry args={[0.42, 0.28]} />
        <meshStandardMaterial map={t} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** Köy okulu: tek katlı, geniş pencereli, önünde bayrak. */
export function School({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      <RoundedBox args={[1.9, 0.75, 1.0]} radius={0.04} smoothness={2} position={[0, 0.45, 0]} castShadow receiveShadow>
        <Paint color="#efe0c2" />
      </RoundedBox>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[1.98, 0.1, 1.08]} />
        <Paint color="#b8ab95" />
      </mesh>
      {[-0.6, -0.2, 0.2, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.52, 0.51]}>
          <boxGeometry args={[0.24, 0.26, 0.02]} />
          <Paint color="#5a7f97" />
        </mesh>
      ))}
      <mesh position={[0, 0.88, 0]} castShadow>
        <boxGeometry args={[2.1, 0.06, 1.2]} />
        <Paint color="#b5573a" />
      </mesh>
      <FlagPole position={[1.25, 0, 0.75]} />
    </group>
  )
}

/** Çınar ağacı: kalın gövde, geniş yuvarlak taç. */
export function PlaneTree({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.2, 1.0, 9]} />
        <Paint color="#9a8a72" />
      </mesh>
      {([[0, 1.4, 0, 0.75], [0.5, 1.25, 0.2, 0.5], [-0.45, 1.3, -0.15, 0.55], [0.1, 1.75, -0.2, 0.5]] as number[][]).map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 12, 9]} />
          <Paint color={['#6f9a4e', '#7aa556', '#678f47', '#80a85c'][i]} />
        </mesh>
      ))}
    </group>
  )
}

// Kahvehane: masalar çınarın önünde (varsayılan kamera +x +z'den bakar) bir sıra; her masada
// karşılıklı iki tabure, kameraya göre yan yana, böylece masa ve bardaklar görünür.
// Tabure açısı a: oturanın masaya göre yeri; shirt yoksa tabure boş.
const ROW = (k: number): [number, number] => [0.53 + k * 0.67, 0.53 - k * 0.67]
const SIDE_A = -Math.PI / 4 // kameraya göre sağ
const SIDE_B = (3 * Math.PI) / 4 // sol
export type TeaTable = { x: number; z: number; seats: { a: number; cap?: string; shirt?: string }[]; tavla?: boolean }
const TEA_TABLES: TeaTable[] = [
  { x: ROW(-1)[0], z: ROW(-1)[1], seats: [{ a: SIDE_A, cap: '#2f3a44', shirt: '#7a6a52' }, { a: SIDE_B, shirt: '#5f6b4a' }] },
  { x: ROW(0)[0], z: ROW(0)[1], tavla: true, seats: [{ a: SIDE_A, cap: '#3b3a36', shirt: '#6a5a4a' }, { a: SIDE_B, cap: '#5a4a3a', shirt: '#4f5d6a' }] },
  { x: ROW(1)[0], z: ROW(1)[1], seats: [{ a: SIDE_A, cap: '#4a3f36', shirt: '#8a7a62' }, { a: SIDE_B }] },
]
const SEAT_R = 0.3
// çaycı ağaçla masalar arasında gider gelir (gövdeden 0,4 uzakta)
const WAITER_PATH: [number, number][] = [[-0.14, 0.7], [0.28, 0.28], [0.7, -0.14]]
// Aydın vadisi: önü Emine'nin evi, kamerada ağacın solunda tek tavla masası
export const VALLEY_TEA = {
  tables: [{ x: -0.75, z: 0.75, tavla: true, seats: [{ a: SIDE_A, cap: '#3b3a36', shirt: '#6a5a4a' }, { a: SIDE_B, cap: '#5a4a3a', shirt: '#4f5d6a' }] }] as TeaTable[],
  waiter: [[0.25, 0.6], [-0.45, 1.05]] as [number, number][],
}

/** İnce belli çay bardağı tabağıyla. */
function TeaGlass({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.026, 0.026, 0.005, 10]} />
        <Paint color="#f4efe6" />
      </mesh>
      <mesh position={[0, 0.024, 0]}>
        <cylinderGeometry args={[0.016, 0.012, 0.042, 8]} />
        <meshStandardMaterial color="#a8401c" roughness={0.2} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

/** Masa masa dolaşan çaycı: elinde tepsi, uçlarda durur. */
function Waiter({ path }: { path: [number, number][] }) {
  const g = useRef<THREE.Group>(null)
  const [walking, setWalking] = useState(true)
  const seg = useMemo(() => {
    const lens = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]))
    return { lens, total: lens.reduce((a, b) => a + b, 0) }
  }, [path])
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    const walkT = seg.total / 0.18
    const T = 2 * (walkT + 3)
    let u = (clock.elapsedTime + 1.3) % T
    let back = false
    if (u > T / 2) {
      u -= T / 2
      back = true
    }
    const moving = u < walkT
    if (moving !== walking) setWalking(moving)
    let dist = (Math.min(u, walkT) / walkT) * seg.total
    if (back) dist = seg.total - dist
    let i = 0
    while (i < seg.lens.length - 1 && dist > seg.lens[i]) dist -= seg.lens[i++]
    const a = path[i]
    const b = path[i + 1]
    const f = seg.lens[i] ? dist / seg.lens[i] : 0
    el.position.set(a[0] + (b[0] - a[0]) * f, 0, a[1] + (b[1] - a[1]) * f)
    el.rotation.y = moving ? Math.atan2(b[0] - a[0], b[1] - a[1]) + (back ? Math.PI : 0) : Math.PI / 4
  })
  return (
    <group ref={g} scale={1.2}>
      <Person position={[0, 0, 0]} shirt="#f1ece2" anim={walking ? 'walk' : 'idle'} />
      {/* tepsi ve bardaklar */}
      <group position={[0.1, 0.4, 0.1]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.008, 12]} />
          <meshStandardMaterial color="#c9ccc8" metalness={0.6} roughness={0.3} />
        </mesh>
        <TeaGlass position={[0.03, 0.005, 0]} />
        <TeaGlass position={[-0.03, 0.005, 0.01]} />
      </group>
    </group>
  )
}

/** Çınar altında kahvehane: masalarda çay içen, tavla oynayan dayılar; arada çaycı. */
export function Teahouse({ position, tables = TEA_TABLES, waiter = WAITER_PATH }: { position: V3; tables?: TeaTable[]; waiter?: [number, number][] }) {
  return (
    <group position={position}>
      <PlaneTree position={[0, 0, 0]} />
      {tables.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.02, 10]} />
            <Paint color="#e9dcc3" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.2, 5]} />
            <Paint color="#5a4632" />
          </mesh>
          {t.tavla && (
            <mesh position={[0, 0.215, 0]} rotation-y={0.3}>
              <boxGeometry args={[0.13, 0.012, 0.09]} />
              <Paint color="#7a4a2a" />
            </mesh>
          )}
          {t.seats.map((s, j) => {
            const sx = Math.cos(s.a) * SEAT_R
            const sz = Math.sin(s.a) * SEAT_R
            return (
              <group key={j}>
                <mesh position={[sx, 0.04, sz]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.08, 8]} />
                  <Paint color="#2f6f8f" />
                </mesh>
                {s.shirt && (
                  <>
                    {/* oturan: alçak taburede, ayaktakinden belirgin kısa; yüzü masaya dönük */}
                    <group position={[sx, -0.088, sz]} rotation-y={Math.atan2(-sx, -sz)} scale={1.2}>
                      <Person position={[0, 0, 0]} shirt={s.shirt} cap={s.cap} anim="sit" phase={i * 2.3 + j * 1.7} />
                    </group>
                    {!t.tavla && <TeaGlass position={[sx * 0.3, 0.21, sz * 0.3]} />}
                  </>
                )}
              </group>
            )
          })}
        </group>
      ))}
      <Waiter path={waiter} />
    </group>
  )
}

/** Çeşme başında sohbet eden teyzeler, birbirine dönük; side −1 çeşmenin batısı (köyde kahvehaneden uzak), 1 doğusu. */
export function Gossip({ at, x, z, side = -1 }: { at: (x: number, z: number, dy?: number) => V3; x: number; z: number; side?: 1 | -1 }) {
  const WOMEN = [
    { dx: 0.45, dz: 0.5, shirt: '#8a5a6a', scarf: '#f1ece2' },
    { dx: 0.85, dz: 0.45, shirt: '#5f7a8a', scarf: '#c04e3a' },
    { dx: 0.65, dz: 0.12, shirt: '#7a6a4a', scarf: '#d8c26a' },
  ].map((w) => ({ ...w, dx: w.dx * side }))
  const mx = WOMEN.reduce((a, w) => a + w.dx, 0) / WOMEN.length
  const mz = WOMEN.reduce((a, w) => a + w.dz, 0) / WOMEN.length
  return (
    <group>
      {WOMEN.map((w, i) => (
        <group key={i} position={at(x + w.dx, z + w.dz)} scale={1.25}>
          <Person position={[0, 0, 0]} shirt={w.shirt} scarf={w.scarf} anim="chat" phase={i * 2.1} rot={Math.atan2(mx - w.dx, mz - w.dz)} />
        </group>
      ))}
    </group>
  )
}

/** Kırmızı traktör. */
export function Tractor({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      <mesh position={[0.1, 0.24, 0]} castShadow>
        <boxGeometry args={[0.5, 0.18, 0.26]} />
        <Paint color="#c43a2f" />
      </mesh>
      <mesh position={[-0.12, 0.42, 0]} castShadow>
        <boxGeometry args={[0.2, 0.22, 0.24]} />
        <Paint color="#c43a2f" />
      </mesh>
      <mesh position={[-0.12, 0.55, 0]}>
        <boxGeometry args={[0.26, 0.03, 0.3]} />
        <Paint color="#3b3530" />
      </mesh>
      {([[-0.15, 0.17, 0.2], [-0.15, 0.17, -0.2]] as V3[]).map((q, i) => (
        <mesh key={i} position={q} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.17, 0.17, 0.08, 12]} />
          <Paint color="#2f2a26" />
        </mesh>
      ))}
      {([[0.3, 0.09, 0.15], [0.3, 0.09, -0.15]] as V3[]).map((q, i) => (
        <mesh key={i} position={q} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.09, 0.09, 0.06, 10]} />
          <Paint color="#2f2a26" />
        </mesh>
      ))}
    </group>
  )
}

/** Odun yığını. */
export function Woodpile({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[(i % 3) * 0.1 - 0.1, 0.05 + Math.floor(i / 3) * 0.09, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.045, 0.045, 0.4, 7]} />
          <Paint color={i % 2 ? '#8a6440' : '#a07a52'} />
        </mesh>
      ))}
    </group>
  )
}

/** Elektrik direği. */
export function PowerPole({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 1.5, 6]} />
        <Paint color="#8a7a62" />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <boxGeometry args={[0.36, 0.03, 0.03]} />
        <Paint color="#8a7a62" />
      </mesh>
    </group>
  )
}

// ── bölgesel ev tipleri ────────────────────────────────────

/** Karadeniz: taş temel, ahşap gövde, gri saç beşik çatı. */
function KaradenizHouse({ rot }: { rot: number }) {
  return (
    <group rotation-y={rot}>
      <RoundedBox args={[1.1, 0.35, 0.9]} radius={0.03} smoothness={2} position={[0, 0.18, 0]} castShadow>
        <Paint color="#a9a294" />
      </RoundedBox>
      <RoundedBox args={[1.06, 0.6, 0.86]} radius={0.03} smoothness={2} position={[0, 0.65, 0]} castShadow>
        <Paint color="#8a5e3c" />
      </RoundedBox>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.66, 0.44]}>
          <boxGeometry args={[0.18, 0.22, 0.02]} />
          <Paint color="#e9e2d2" />
        </mesh>
      ))}
      <group position={[0, 0.95, 0]} rotation-y={Math.PI / 2}>
        <mesh position={[0, 0.2, 0.3]} rotation-x={0.65} castShadow>
          <boxGeometry args={[1.04, 0.03, 0.75]} />
          <meshStandardMaterial color="#9aa1a3" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.2, -0.3]} rotation-x={-0.65} castShadow>
          <boxGeometry args={[1.04, 0.03, 0.75]} />
          <meshStandardMaterial color="#9aa1a3" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

/** Serender: direkler üstünde ahşap ambar (Karadeniz). */
export function Serender({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      {[[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.25, z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 5]} />
          <Paint color="#6b4a30" />
        </mesh>
      ))}
      <mesh position={[0, 0.53, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.5]} />
        <Paint color="#6b4a30" />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.52, 0.34, 0.42]} />
        <Paint color="#9a6a42" />
      </mesh>
      <mesh position={[0, 0.98, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[0.46, 0.26, 4]} />
        <meshStandardMaterial color="#9aa1a3" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** İç Anadolu: kerpiç, düz dam, dışa taşan hatıl uçları. */
function KerpicHouse({ rot }: { rot: number }) {
  return (
    <group rotation-y={rot}>
      <RoundedBox args={[1.15, 0.72, 0.95]} radius={0.06} smoothness={3} position={[0, 0.36, 0]} castShadow receiveShadow>
        <Paint color="#c8a77c" />
      </RoundedBox>
      <RoundedBox args={[1.22, 0.08, 1.02]} radius={0.03} smoothness={2} position={[0, 0.76, 0]} castShadow>
        <Paint color="#b39268" />
      </RoundedBox>
      {[-0.45, -0.15, 0.15, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.7, 0.52]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 5]} />
          <Paint color="#6b4a30" />
        </mesh>
      ))}
      <mesh position={[0.25, 0.28, 0.48]}>
        <boxGeometry args={[0.2, 0.36, 0.02]} />
        <Paint color="#6b4a30" />
      </mesh>
      <mesh position={[-0.28, 0.45, 0.48]}>
        <boxGeometry args={[0.16, 0.16, 0.02]} />
        <Paint color="#4f6b7a" />
      </mesh>
    </group>
  )
}

/** Doğu: kaba taş, düz dam, damda ot/tezek yığını. */
function StoneHouse({ rot }: { rot: number }) {
  return (
    <group rotation-y={rot}>
      <RoundedBox args={[1.1, 0.7, 0.95]} radius={0.05} smoothness={2} position={[0, 0.35, 0]} castShadow receiveShadow>
        <Paint color="#a39b8c" />
      </RoundedBox>
      <RoundedBox args={[1.16, 0.08, 1.0]} radius={0.03} smoothness={2} position={[0, 0.74, 0]}>
        <Paint color="#8f8676" />
      </RoundedBox>
      <mesh position={[-0.2, 0.86, -0.1]} scale={[1, 0.6, 1]} castShadow>
        <sphereGeometry args={[0.24, 9, 7]} />
        <Paint color="#c9b47a" />
      </mesh>
      <mesh position={[0.25, 0.28, 0.48]}>
        <boxGeometry args={[0.2, 0.36, 0.02]} />
        <Paint color="#5a4632" />
      </mesh>
    </group>
  )
}

/** Harran kümbet evi: yan yana konik kubbeler. */
function KumbetHouse({ rot }: { rot: number }) {
  return (
    <group rotation-y={rot}>
      {[-0.4, 0, 0.4].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <Paint color="#d4b98e" />
          </mesh>
          <mesh position={[0, 0.62, 0]} castShadow>
            <coneGeometry args={[0.22, 0.5, 10]} />
            <Paint color="#d9bf94" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Bölge tipine göre ev; isteğe bağlı damda güneşli ısıtıcı ve çanak. */
export function VillageHouse({ position, rot = 0, style, solar = false, dish = false }: { position: V3; rot?: number; style: HouseStyle; solar?: boolean; dish?: boolean }) {
  const roofY = style === 'ege' ? 1.22 : style === 'karadeniz' ? 1.25 : 0.82
  return (
    <group position={position}>
      {style === 'ege' && <House position={[0, 0, 0]} rot={rot} />}
      {style === 'karadeniz' && <KaradenizHouse rot={rot} />}
      {style === 'kerpic' && <KerpicHouse rot={rot} />}
      {style === 'tas' && <StoneHouse rot={rot} />}
      {style === 'kumbet' && <KumbetHouse rot={rot} />}
      {solar && style !== 'kumbet' && <SolarHeater position={[0.2, roofY, 0.05]} rot={rot} />}
      {dish && style !== 'kumbet' && <Dish position={[-0.32, roofY - 0.05, 0.25]} rot={rot + 0.6} />}
    </group>
  )
}

/** Ev bu noktaya konursa tarla parsellerinden birine değer mi (merkezden parsel kenarına < 0,7). */
export function onPlot(plots: { x: number; z: number; w: number; d: number }[], x: number, z: number) {
  return plots.some((q) => {
    const nx = Math.max(q.x - q.w / 2, Math.min(x, q.x + q.w / 2))
    const nz = Math.max(q.z - q.d / 2, Math.min(z, q.z + q.d / 2))
    return Math.hypot(nx - x, nz - z) < 0.7
  })
}

/** Köy yerleşimi (saf hesap, testli): evler birbirine ve ortak yapılara girmez. */
export function villageLayout(center: [number, number], n: number, seed: number, mosque: boolean, avoid?: (x: number, z: number) => boolean) {
  const r = (i: number) => {
    const s = Math.sin((i + 1) * 12.9898 * seed) * 43758.5453
    return s - Math.floor(s)
  }
  const [cx, cz] = center
  // iç içe girmesin: her yapının kapladığı daire; ev ancak hepsinden uzaksa konur.
  // Açılar hafif çarpık kalır (köy elle kurulmuş gibi), ama çatılar birbirine değmez.
  const taken: { x: number; z: number; r: number }[] = [
    ...(mosque ? [{ x: cx - 0.2, z: cz - 0.2, r: 1.05 }] : []),
    { x: cx + 1.6, z: cz + 1.4, r: 1.6 }, // kahvehane (masalar ve oturanlar dahil)
    { x: cx + 2.9, z: cz + 2.7, r: 0.8 }, // kahvehanenin önü meydan: kameradan bakınca masaları ev kapatmasın
    { x: cx - 2.6, z: cz + 2.0, r: 1.1 }, // okul
    { x: cx + 0.6, z: cz + 1.0, r: 0.4 }, // çeşme
    { x: cx - 0.05, z: cz + 1.35, r: 0.45 }, // çeşme başındaki teyzeler
    { x: cx + 2.6, z: cz - 0.6, r: 0.55 }, // traktör
  ]
  const HOUSE_R = 0.78
  const houses: { x: number; z: number; rot: number }[] = []
  for (let i = 0, tries = 0; houses.length < n && tries < 400; tries++, i++) {
    const a = i * 2.3 + seed + tries * 0.37
    const rad = 1.6 + r(i) * 1.6 + Math.floor(tries / n) * 0.35 // sığmazsa biraz dışarı açılır
    const x = cx + Math.cos(a) * rad * 1.3
    const z = cz + Math.sin(a) * rad * 0.85
    if (taken.some((t) => Math.hypot(t.x - x, t.z - z) < t.r + HOUSE_R)) continue
    if (Math.hypot(x - cx, z - cz) > 6) continue // köy dağılmasın: sığmayan ev hiç konmaz
    if (avoid?.(x, z)) continue // dere yatağı, deniz, tarla
    houses.push({ x, z, rot: (r(i + 9) - 0.5) * 0.7 })
    taken.push({ x, z, r: HOUSE_R })
  }
  return houses
}

/** Bütün bir köy: evler, cami, okul, kahvehane, çeşme, traktör, odun, direkler. */
export function Village({
  center,
  style,
  at,
  n = 6,
  seed = 1,
  mosque = true,
  avoid,
}: {
  center: [number, number]
  style: HouseStyle
  at: (x: number, z: number, dy?: number) => V3
  n?: number
  seed?: number
  mosque?: boolean
  avoid?: (x: number, z: number) => boolean
}) {
  const [cx, cz] = center
  const houses = villageLayout(center, n, seed, mosque, avoid)
  return (
    <group>
      {houses.map((h, i) => (
        <VillageHouse key={i} position={at(h.x, h.z)} rot={h.rot} style={style} solar={i % 2 === 0} dish={i % 3 === 1} />
      ))}
      {mosque && <Mosque position={at(cx - 0.2, cz - 0.2)} rot={0.3} />}
      <Teahouse position={at(cx + 1.6, cz + 1.4)} />
      <School position={at(cx - 2.6, cz + 2.0)} rot={0.15} />
      <Fountain position={at(cx + 0.6, cz + 1.0)} />
      <Gossip at={at} x={cx + 0.6} z={cz + 1.0} />
      <Tractor position={at(cx + 2.6, cz - 0.6)} rot={0.8} />
      <Woodpile position={at(houses[0].x + 0.7, houses[0].z + 0.3)} rot={houses[0].rot} />
      {style === 'karadeniz' && <Serender position={at(houses[1].x + 0.8, houses[1].z - 0.4)} rot={0.4} />}
    </group>
  )
}
