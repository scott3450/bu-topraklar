// Ege köy yapıları: badanalı yumuşak duvar, saçaklı kırma çatı ve kiremit sıraları, mavi pancur,
// taş temel. Prizma gibi değil, elle yapılmış maket gibi görünsün.
import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Paint } from './kit'

type V3 = [number, number, number]

// Kiremit sıraları: yatay bantlı küçük doku (bir kez üretilir)
let tileTex: THREE.CanvasTexture | null = null
function tiles() {
  if (tileTex) return tileTex
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 64
  const g = c.getContext('2d')!
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#ffffff' : '#e8e0dc'
    g.fillRect(0, i * 8, 32, 8)
    g.fillStyle = 'rgba(0,0,0,0.18)'
    g.fillRect(0, i * 8 + 7, 32, 1)
  }
  tileTex = new THREE.CanvasTexture(c)
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping
  tileTex.colorSpace = THREE.SRGBColorSpace
  return tileTex
}

/** Kırma çatı (dört yana eğimli). ridge: mahya uzunluğu oranı. UV: v eğim boyunca. */
function hipRoofGeometry(w: number, d: number, h: number, rows: number) {
  const hw = w / 2
  const hd = d / 2
  const r = Math.max(0, hw - hd) // mahyanın yarı boyu
  const A: V3 = [-hw, 0, -hd], B: V3 = [hw, 0, -hd], C: V3 = [hw, 0, hd], D: V3 = [-hw, 0, hd]
  const R1: V3 = [-r, h, 0], R2: V3 = [r, h, 0]
  const pos: number[] = []
  const uv: number[] = []
  const tri = (a: V3, b: V3, c: V3, ua: number[], ub: number[], uc: number[]) => {
    pos.push(...a, ...b, ...c)
    uv.push(...ua, ...ub, ...uc)
  }
  const s = rows
  // ön ve arka yamuklar
  tri(D, C, R2, [0, 0], [w, 0], [hw + r, s]); tri(D, R2, R1, [0, 0], [hw + r, s], [hw - r, s])
  tri(B, A, R1, [0, 0], [w, 0], [hw + r, s]); tri(B, R1, R2, [0, 0], [hw + r, s], [hw - r, s])
  // yan üçgenler
  tri(C, B, R2, [0, 0], [d, 0], [hd, s])
  tri(A, D, R1, [0, 0], [d, 0], [hd, s])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Beşik çatı, iki eğimli yüz (ambar için). */
function gableRoofGeometry(w: number, d: number, h: number, rows: number) {
  const hw = w / 2
  const hd = d / 2
  const pos = [
    -hw, 0, hd, hw, 0, hd, hw, h, 0, -hw, 0, hd, hw, h, 0, -hw, h, 0,
    hw, 0, -hd, -hw, 0, -hd, -hw, h, 0, hw, 0, -hd, -hw, h, 0, hw, h, 0,
  ]
  const uv = [0, 0, w, 0, w, rows, 0, 0, w, rows, 0, rows, 0, 0, w, 0, w, rows, 0, 0, w, rows, 0, rows]
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

function Roof({ kind, w, d, h, color }: { kind: 'hip' | 'gable'; w: number; d: number; h: number; color: string }) {
  const geo = useMemo(() => (kind === 'hip' ? hipRoofGeometry(w, d, h, 5) : gableRoofGeometry(w, d, h, 5)), [kind, w, d, h])
  const tex = useMemo(() => {
    const t = tiles().clone()
    t.needsUpdate = true
    t.repeat.set(1.6, 1)
    return t
  }, [])
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={color} map={tex} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* saçak kalınlığı */}
      <RoundedBox args={[w + 0.02, 0.05, d + 0.02]} radius={0.02} smoothness={2} position={[0, -0.02, 0]}>
        <Paint color="#8a4a33" />
      </RoundedBox>
    </group>
  )
}

function Window({ position, rotY = 0 }: { position: V3; rotY?: number }) {
  return (
    <group position={position} rotation-y={rotY}>
      <mesh>
        <boxGeometry args={[0.16, 0.2, 0.02]} />
        <Paint color="#5a7f97" />
      </mesh>
      {/* pancurlar */}
      <mesh position={[-0.12, 0, 0.01]}>
        <boxGeometry args={[0.07, 0.22, 0.02]} />
        <Paint color="#2f6f8f" />
      </mesh>
      <mesh position={[0.12, 0, 0.01]}>
        <boxGeometry args={[0.07, 0.22, 0.02]} />
        <Paint color="#2f6f8f" />
      </mesh>
    </group>
  )
}

/** Ege köy evi. */
export function House({ position, rot = 0, roof = '#c4623f', wall = '#f4ede1', size = 1 }: { position: V3; rot?: number; roof?: string; wall?: string; size?: number }) {
  const w = 1.15
  const d = 0.95
  const hgt = 0.82
  return (
    <group position={position} rotation-y={rot} scale={size}>
      {/* taş temel */}
      <RoundedBox args={[w + 0.06, 0.14, d + 0.06]} radius={0.03} smoothness={2} position={[0, 0.07, 0]} receiveShadow>
        <Paint color="#b8ab95" />
      </RoundedBox>
      <RoundedBox args={[w, hgt, d]} radius={0.05} smoothness={3} position={[0, 0.12 + hgt / 2, 0]} castShadow receiveShadow>
        <Paint color={wall} />
      </RoundedBox>
      {/* kapı ve pencereler */}
      <mesh position={[0.22, 0.38, d / 2 + 0.012]}>
        <boxGeometry args={[0.2, 0.36, 0.02]} />
        <Paint color="#7a5236" />
      </mesh>
      <Window position={[-0.26, 0.62, d / 2 + 0.014]} />
      <Window position={[w / 2 + 0.014, 0.62, 0.1]} rotY={Math.PI / 2} />
      {/* çatı: saçak taşar */}
      <group position={[0, 0.12 + hgt + 0.01, 0]}>
        <Roof kind="hip" w={w + 0.24} d={d + 0.24} h={0.42} color={roof} />
      </group>
      {/* şapkalı baca */}
      <mesh position={[-0.3, 1.32, -0.18]} castShadow>
        <boxGeometry args={[0.13, 0.36, 0.13]} />
        <Paint color={wall} />
      </mesh>
      <mesh position={[-0.3, 1.52, -0.18]}>
        <boxGeometry args={[0.19, 0.04, 0.19]} />
        <Paint color="#8a4a33" />
      </mesh>
      {/* saksılar */}
      {[-0.05, 0.47].map((x, i) => (
        <group key={i} position={[x, 0.14, d / 2 + 0.12]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.05, 0.04, 0.1, 8]} />
            <Paint color="#b5603f" />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <Paint color={i ? '#d0566a' : '#6f9a4e'} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Ambar / ahır: taş alt, ahşap üst, beşik çatı, çift kapı, saman balyaları. */
export function Barn({ position, rot = 0, roof = '#c4623f' }: { position: V3; rot?: number; roof?: string }) {
  const w = 3
  const d = 2
  return (
    <group position={position} rotation-y={rot}>
      <RoundedBox args={[w, 0.6, d]} radius={0.05} smoothness={2} position={[0, 0.3, 0]} castShadow receiveShadow>
        <Paint color="#c2b49a" />
      </RoundedBox>
      <RoundedBox args={[w - 0.04, 0.8, d - 0.04]} radius={0.04} smoothness={2} position={[0, 1.0, 0]} castShadow receiveShadow>
        <Paint color="#a67c52" />
      </RoundedBox>
      {/* ahşap tahta çizgileri */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-w / 2 + 0.17 + i * 0.33, 1.0, d / 2 - 0.005]}>
          <boxGeometry args={[0.02, 0.78, 0.02]} />
          <Paint color="#8a6440" />
        </mesh>
      ))}
      {/* çift kapı */}
      <mesh position={[0.6, 0.52, d / 2 + 0.01]}>
        <boxGeometry args={[0.8, 1.0, 0.03]} />
        <Paint color="#7a5236" />
      </mesh>
      <mesh position={[0.6, 0.52, d / 2 + 0.03]} rotation-z={0.9}>
        <boxGeometry args={[1.15, 0.05, 0.02]} />
        <Paint color="#e9dcc3" />
      </mesh>
      <mesh position={[0.6, 0.52, d / 2 + 0.03]} rotation-z={-0.9}>
        <boxGeometry args={[1.15, 0.05, 0.02]} />
        <Paint color="#e9dcc3" />
      </mesh>
      <Window position={[-0.8, 1.05, d / 2 + 0.02]} />
      <group position={[0, 1.42, 0]}>
        <Roof kind="gable" w={w + 0.3} d={d + 0.34} h={0.75} color={roof} />
      </group>
      {/* saman balyaları */}
      {[[-1.75, 0.3], [-1.75, -0.3], [-1.75, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, i === 2 ? 0.48 : 0.16, z]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.3, 12]} />
          <Paint color="#d9bf72" />
        </mesh>
      ))}
    </group>
  )
}

/** Kooperatif deposu: badanalı, turkuaz kapı, tabela. */
export function CoopDepot({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      <RoundedBox args={[1.8, 0.14, 1.3]} radius={0.03} smoothness={2} position={[0, 0.07, 0]}>
        <Paint color="#b8ab95" />
      </RoundedBox>
      <RoundedBox args={[1.7, 0.8, 1.2]} radius={0.05} smoothness={3} position={[0, 0.52, 0]} castShadow receiveShadow>
        <Paint color="#f4ede1" />
      </RoundedBox>
      <mesh position={[0, 0.42, 0.612]}>
        <boxGeometry args={[0.5, 0.56, 0.02]} />
        <Paint color="#1f8a8c" />
      </mesh>
      <mesh position={[0, 0.84, 0.62]}>
        <boxGeometry args={[0.9, 0.16, 0.02]} />
        <Paint color="#1f8a8c" />
      </mesh>
      <Window position={[-0.55, 0.58, 0.614]} />
      <Window position={[0.55, 0.58, 0.614]} />
      <group position={[0, 0.93, 0]}>
        <Roof kind="hip" w={2.0} d={1.5} h={0.45} color="#c4623f" />
      </group>
    </group>
  )
}

/** Köy camisi: küçük kubbe ve ince minare. */
export function Mosque({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      <RoundedBox args={[1.3, 0.14, 1.3]} radius={0.03} smoothness={2} position={[0, 0.07, 0]}>
        <Paint color="#b8ab95" />
      </RoundedBox>
      <RoundedBox args={[1.1, 0.8, 1.1]} radius={0.05} smoothness={3} position={[0, 0.54, 0]} castShadow receiveShadow>
        <Paint color="#f4ede1" />
      </RoundedBox>
      <mesh position={[0, 0.94, 0]} castShadow>
        <sphereGeometry args={[0.46, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Paint color="#9aa7ad" />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 6]} />
        <Paint color="#c9a440" />
      </mesh>
      {/* minare */}
      <group position={[0.68, 0, 0.42]}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 1.9, 10]} />
          <Paint color="#f4ede1" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.05, 12]} />
          <Paint color="#d8cdb8" />
        </mesh>
        <mesh position={[0, 2.08, 0]} castShadow>
          <coneGeometry args={[0.09, 0.36, 10]} />
          <Paint color="#9aa7ad" />
        </mesh>
      </group>
      <mesh position={[0, 0.4, 0.56]}>
        <boxGeometry args={[0.28, 0.46, 0.02]} />
        <Paint color="#2f6f8f" />
      </mesh>
    </group>
  )
}

/** Köy çeşmesi. */
export function Fountain({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.5, 0.5, 0.2]} radius={0.03} smoothness={2} position={[0, 0.25, 0]} castShadow>
        <Paint color="#d8cdb8" />
      </RoundedBox>
      <mesh position={[0, 0.07, 0.2]}>
        <boxGeometry args={[0.5, 0.14, 0.26]} />
        <Paint color="#b8ab95" />
      </mesh>
      <mesh position={[0, 0.15, 0.2]}>
        <boxGeometry args={[0.42, 0.02, 0.18]} />
        <meshStandardMaterial color="#7fb2b4" roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Alçak taş duvar (iki nokta arası). */
export function StoneWall({ from, to, y = 0 }: { from: [number, number]; to: [number, number]; y?: number }) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const len = Math.hypot(dx, dz)
  return (
    <RoundedBox
      args={[len, 0.18, 0.12]}
      radius={0.04}
      smoothness={2}
      position={[(from[0] + to[0]) / 2, y + 0.09, (from[1] + to[1]) / 2]}
      rotation-y={-Math.atan2(dz, dx)}
      castShadow
    >
      <Paint color="#bfb29c" />
    </RoundedBox>
  )
}

/** Soğutmalı süt tankı (bölüm 3'ün izi). */
export function MilkTank({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.9, 16]} />
        <meshStandardMaterial color="#dfe6e8" metalness={0.5} roughness={0.35} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.08, 0]}>
          <boxGeometry args={[0.06, 0.16, 0.4]} />
          <Paint color="#8c8478" />
        </mesh>
      ))}
    </group>
  )
}

/** Yem silosu. */
export function Silo({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 1.6, 16]} />
        <meshStandardMaterial color="#cfd6d8" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <coneGeometry args={[0.34, 0.3, 16]} />
        <meshStandardMaterial color="#b8c0c2" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** Tabela: direk + levha (renk, isteğe bağlı onay işareti). */
export function Sign({ position, color = '#1f8a8c', check = false, rot = 0 }: { position: V3; color?: string; check?: boolean; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
        <Paint color="#7a5236" />
      </mesh>
      <RoundedBox args={[0.5, 0.3, 0.04]} radius={0.03} smoothness={2} position={[0, 0.66, 0]} castShadow>
        <Paint color={color} />
      </RoundedBox>
      {check && (
        <mesh position={[0, 0.66, 0.03]} rotation-z={-0.6}>
          <boxGeometry args={[0.2, 0.05, 0.01]} />
          <Paint color="#fffaf1" />
        </mesh>
      )}
    </group>
  )
}

/** Şişeleme atölyesi: küçük badanalı yapı, bacadan buhar yerine turkuaz kapı ve önünde şişe kasaları. */
export function BottlingShed({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      <RoundedBox args={[1.1, 0.6, 0.8]} radius={0.04} smoothness={3} position={[0, 0.3, 0]} castShadow receiveShadow>
        <Paint color="#f4ede1" />
      </RoundedBox>
      <mesh position={[0.18, 0.26, 0.41]}>
        <boxGeometry args={[0.32, 0.44, 0.02]} />
        <Paint color="#1f8a8c" />
      </mesh>
      <Window position={[-0.3, 0.36, 0.41]} />
      <group position={[0, 0.6, 0]}>
        <Roof kind="gable" w={1.25} d={0.95} h={0.32} color="#c4623f" />
      </group>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[-0.32 + i * 0.2, 0.06, 0.62]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.12, 0.14]} />
            <Paint color="#b98a55" />
          </mesh>
          {[-0.05, 0.05].map((x) => (
            <mesh key={x} position={[x, 0.1, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.1, 6]} />
              <meshStandardMaterial color="#5a7a2a" roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** Bayram süsü: iki direk arasında renkli üçgen bayraklar (güven yüksekken köy şenlenir). */
export function Bunting({ from, to }: { from: V3; to: V3 }) {
  const n = 11
  const colors = ['#c43a2f', '#e8c23a', '#1f8a8c', '#f4ede1']
  return (
    <group>
      {[from, to].map((q, i) => (
        <mesh key={i} position={[q[0], q[1] + 0.45, q[2]]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.9, 6]} />
          <Paint color="#7a6248" />
        </mesh>
      ))}
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n
        const sag = Math.sin(t * Math.PI) * 0.18
        const x = from[0] + (to[0] - from[0]) * t
        const z = from[2] + (to[2] - from[2]) * t
        const y = from[1] + (to[1] - from[1]) * t + 0.86 - sag
        return (
          <mesh key={i} position={[x, y, z]} rotation={[0, Math.atan2(to[0] - from[0], to[2] - from[2]) + Math.PI / 2, Math.PI]}>
            <coneGeometry args={[0.06, 0.14, 3]} />
            <Paint color={colors[i % colors.length]} />
          </mesh>
        )
      })}
    </group>
  )
}
