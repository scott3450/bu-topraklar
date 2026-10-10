// Figürü olmayan her ilde, baskın ürününün küçük simgesi. İli yükselince simge de yükselir.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import provinces from '../data/provinces.json'
import { crops } from '../data/crops'
import { ILLER } from '../data/iller'
import { isOpen } from '../data/kilit'
import { useGame } from '../sim/store'
import { Paint, usePalette } from './kit'
import { centroid, lifts, type Province } from './TurkeyMap'

type V = [number, number, number]

function Blob({ at, r, color }: { at: V; r: number; color: string }) {
  return (
    <mesh position={at} castShadow>
      <icosahedronGeometry args={[r, 1]} />
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </mesh>
  )
}

function Ball({ at, r, color }: { at: V; r: number; color: string }) {
  return (
    <mesh position={at}>
      <sphereGeometry args={[r, 8, 6]} />
      <Paint color={color} />
    </mesh>
  )
}

function Trunk({ h = 0.22, r = 0.03, lean = 0 }: { h?: number; r?: number; lean?: number }) {
  const p = usePalette()
  return (
    <mesh position={[lean * 0.5, h / 2 + 0.05, 0]} rotation-z={-lean} castShadow>
      <cylinderGeometry args={[r * 0.8, r, h, 6]} />
      <Paint color={p.trunk} />
    </mesh>
  )
}

/** Meyve ağacı: üç kümeli taç, dallarda meyve. */
function FruitTree({ leaf, fruit, s = 1, wide = false }: { leaf: string; fruit?: string; s?: number; wide?: boolean }) {
  const w = wide ? 1.3 : 1
  return (
    <group scale={s}>
      
      <Trunk h={0.2} />
      <Blob at={[0, 0.36, 0]} r={0.17 * w} color={leaf} />
      <Blob at={[0.12 * w, 0.3, 0.06]} r={0.12 * w} color={leaf} />
      <Blob at={[-0.11 * w, 0.31, -0.05]} r={0.12 * w} color={leaf} />
      {fruit &&
        ([[0.13, 0.36, 0.12], [-0.12, 0.4, 0.1], [0.05, 0.26, 0.16], [-0.04, 0.47, 0.05], [0.16, 0.24, -0.06]] as V[]).map((q, i) => <Ball key={i} at={[q[0] * w, q[1], q[2] * w]} r={0.035} color={fruit} />)}
    </group>
  )
}

function Olive() {
  return (
    <group>
      
      <Trunk h={0.2} r={0.04} lean={0.25} />
      <Blob at={[0.04, 0.32, 0]} r={0.15} color="#93a067" />
      <Blob at={[0.17, 0.28, 0.05]} r={0.11} color="#7f8e58" />
      <Blob at={[-0.1, 0.3, -0.04]} r={0.11} color="#a3ae7a" />
      {([[0.1, 0.28, 0.13], [-0.06, 0.36, 0.1], [0.2, 0.33, -0.04]] as V[]).map((q, i) => <Ball key={i} at={q} r={0.025} color="#3d3a2a" />)}
    </group>
  )
}

/** Başaklar: ince saplar, uçta dolgun başak. */
function Grain({ color, head }: { color: string; head: string }) {
  const pts: [number, number][] = [[-0.14, -0.06], [-0.05, -0.12], [0.05, -0.04], [0.14, -0.1], [-0.1, 0.07], [0.02, 0.09], [0.12, 0.06]]
  return (
    <group>
      {pts.map(([x, z], i) => (
        <group key={i} position={[x, 0.05, z]} rotation-z={(i % 3 - 1) * 0.12}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.015, 0.24, 0.015]} />
            <Paint color={color} />
          </mesh>
          <mesh position={[0, 0.27, 0]} scale={[1, 2.2, 1]}>
            <sphereGeometry args={[0.03, 6, 5]} />
            <Paint color={head} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Sunflower() {
  return (
    <group>
      {([[-0.12, 0.3, 0], [0.1, 0.36, -0.06], [0.02, 0.26, 0.12]] as V[]).map((q, i) => (
        <group key={i} position={[q[0], 0, q[2]]}>
          <mesh position={[0, q[1] / 2 + 0.05, 0]}>
            <cylinderGeometry args={[0.012, 0.015, q[1], 5]} />
            <Paint color="#6f8a3e" />
          </mesh>
          <group position={[0, q[1] + 0.06, 0.02]} rotation-x={Math.PI / 2.6}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
              <Paint color="#e8c23a" />
            </mesh>
            <mesh position={[0, 0.012, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.02, 10]} />
              <Paint color="#5a3d22" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

function Cotton() {
  return (
    <group>
      {([[-0.12, 0, -0.04], [0.1, 0, 0.05], [0, 0, -0.12]] as V[]).map((q, i) => (
        <group key={i} position={q}>
          <Blob at={[0, 0.14, 0]} r={0.09} color="#6f7a45" />
          <Ball at={[0.06, 0.2, 0.04]} r={0.04} color="#fbf8f0" />
          <Ball at={[-0.05, 0.22, 0.02]} r={0.035} color="#fbf8f0" />
          <Ball at={[0.01, 0.25, -0.05]} r={0.035} color="#fbf8f0" />
        </group>
      ))}
    </group>
  )
}

function Corn() {
  return (
    <group>
      {([[-0.1, 0, 0], [0.1, 0, -0.04]] as V[]).map((q, i) => (
        <group key={i} position={q}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.42, 5]} />
            <Paint color="#7fae4e" />
          </mesh>
          {[0.15, 0.28].map((y, j) => (
            <mesh key={j} position={[j ? -0.06 : 0.06, y, 0]} rotation-z={j ? 0.9 : -0.9}>
              <boxGeometry args={[0.16, 0.012, 0.04]} />
              <Paint color="#8fbf5a" />
            </mesh>
          ))}
          <mesh position={[0.03, 0.23, 0.03]} rotation-z={-0.3}>
            <capsuleGeometry args={[0.025, 0.07, 3, 6]} />
            <Paint color="#e8c23a" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Bağ: iki direk, tel, yaprak bandı, mor salkımlar. */
function Vine() {
  const p = usePalette()
  return (
    <group>
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x, 0.17, 0]}>
          <boxGeometry args={[0.025, 0.26, 0.025]} />
          <Paint color={p.trunk} />
        </mesh>
      ))}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.38, 0.09, 0.09]} />
        <meshStandardMaterial color="#6f8a3e" roughness={0.9} flatShading />
      </mesh>
      {[-0.1, 0.02, 0.13].map((x, i) => (
        <mesh key={i} position={[x, 0.13, 0.05]} rotation-x={Math.PI}>
          <coneGeometry args={[0.035, 0.08, 6]} />
          <Paint color="#5b2a4f" />
        </mesh>
      ))}
    </group>
  )
}

/** Çay: yamaçta yuvarlak budanmış sıralar. */
function Tea() {
  return (
    <group>
      {[-0.13, 0, 0.13].map((z, i) => (
        <mesh key={z} position={[0, 0.11 + i * 0.03, z]} rotation-z={Math.PI / 2} castShadow>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
          <meshStandardMaterial color={['#4f8f3f', '#5a9a45', '#66a64c'][i]} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Rose() {
  return (
    <group>
      {([[-0.1, 0, 0], [0.11, 0, -0.03]] as V[]).map((q, i) => (
        <group key={i} position={q}>
          <Blob at={[0, 0.14, 0]} r={0.11} color="#5f7a45" />
          {([[0.07, 0.2, 0.05], [-0.06, 0.22, 0.04], [0.01, 0.25, -0.05], [0.08, 0.14, -0.05]] as V[]).map((f, j) => <Ball key={j} at={f} r={0.032} color="#d0566a" />)}
        </group>
      ))}
    </group>
  )
}

function Rice() {
  return (
    <group>
      {([[-0.12, -0.08], [0, -0.1], [0.12, -0.06], [-0.08, 0.06], [0.05, 0.05], [0.15, 0.1], [-0.15, 0.12]] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]}>
          <coneGeometry args={[0.035, 0.14, 5]} />
          <Paint color="#9cc76a" />
        </mesh>
      ))}
    </group>
  )
}

/** Sıralı tarla: sırtlar ve yaprak tutamları (patates, pancar, sebze…). */
function Ridges({ leaf, low = false }: { leaf: string; low?: boolean }) {
  return (
    <group>
      {[-0.12, 0, 0.12].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.06, z]}>
            <boxGeometry args={[0.44, 0.03, 0.06]} />
            <Paint color="#a5825c" />
          </mesh>
          {[-0.14, 0, 0.14].map((x) => <Blob key={x} at={[x, low ? 0.09 : 0.11, z]} r={low ? 0.045 : 0.06} color={leaf} />)}
        </group>
      ))}
    </group>
  )
}

function Tobacco() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.26) * 0.08, 0.1 + i * 0.035, Math.sin(i * 1.26) * 0.08]} rotation={[0.5, i * 1.26, 0]} castShadow>
          <boxGeometry args={[0.16, 0.012, 0.08]} />
          <Paint color="#7f9a4e" />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.012, 0.015, 0.3, 5]} />
        <Paint color="#6f8a3e" />
      </mesh>
    </group>
  )
}

function Poppy() {
  return (
    <group>
      {([[-0.13, -0.05, 0.24], [0, -0.1, 0.3], [0.12, 0.02, 0.26], [-0.04, 0.1, 0.22], [0.1, 0.12, 0.28]] as V[]).map(([x, z, h], i) => (
        <group key={i} position={[x, 0.05, z]}>
          <mesh position={[0, h / 2, 0]}>
            <cylinderGeometry args={[0.008, 0.01, h, 4]} />
            <Paint color="#7f9a5e" />
          </mesh>
          <mesh position={[0, h + 0.01, 0]} scale={[1, 0.5, 1]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <Paint color={i % 2 ? '#f3eef2' : '#e2b6c6'} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Sera: kemerli tünel, kaburgalar. */
function Tunnel({ banana = false }: { banana?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.17, 0.17, 0.46, 14, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color="#eef4ec" transparent opacity={0.75} side={2} roughness={0.3} />
      </mesh>
      {[-0.2, -0.07, 0.07, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.05, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.17, 0.008, 4, 16, Math.PI]} />
          <meshStandardMaterial color="#b9c0b4" />
        </mesh>
      ))}
      {banana ? <Blob at={[0, 0.13, 0]} r={0.08} color="#5f9a3e" /> : [-0.12, 0, 0.12].map((x) => <Ball key={x} at={[x, 0.09, 0]} r={0.035} color="#c8452f" />)}
    </group>
  )
}

function Hazel() {
  const p = usePalette()
  return (
    <group>
      
      {[-0.4, 0, 0.4].map((a, i) => (
        <mesh key={i} position={[a * 0.15, 0.13, 0]} rotation-z={a * 0.6}>
          <cylinderGeometry args={[0.012, 0.016, 0.18, 5]} />
          <Paint color={p.trunk} />
        </mesh>
      ))}
      <Blob at={[0, 0.27, 0]} r={0.15} color="#4f7a3e" />
      <Blob at={[0.13, 0.23, 0.04]} r={0.1} color="#5a8a45" />
      <Blob at={[-0.13, 0.24, -0.02]} r={0.1} color="#466f37" />
      {([[0.1, 0.2, 0.12], [-0.08, 0.22, 0.12], [0.02, 0.17, 0.15]] as V[]).map((q, i) => <Ball key={i} at={q} r={0.028} color="#a8743f" />)}
    </group>
  )
}

function Sheep() {
  return (
    <group>
      
      <group position={[0, 0.05, 0]} rotation-y={0.5}>
        {([[-0.07, -0.05], [0.07, -0.05], [-0.07, 0.05], [0.07, 0.05]] as [number, number][]).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.05, z]}>
            <boxGeometry args={[0.025, 0.1, 0.025]} />
            <Paint color="#3b3530" />
          </mesh>
        ))}
        <mesh position={[0, 0.15, 0]} scale={[1.25, 0.9, 0.95]} castShadow>
          <icosahedronGeometry args={[0.12, 1]} />
          <meshStandardMaterial color="#f1ece0" roughness={1} flatShading />
        </mesh>
        <mesh position={[0.16, 0.18, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.07]} />
          <Paint color="#3b3530" />
        </mesh>
      </group>
      <Blob at={[-0.18, 0.07, 0.12]} r={0.05} color="#7fa34e" />
    </group>
  )
}

function Hive() {
  const p = usePalette()
  return (
    <group>
      
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.24, 0.04, 0.2]} />
        <Paint color={p.trunk} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0.15 + i * 0.1, 0]} castShadow>
          <boxGeometry args={[0.22, 0.09, 0.18]} />
          <Paint color={i ? '#e9cf94' : p.hive} />
        </mesh>
      ))}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.26, 0.04, 0.22]} />
        <Paint color={p.hiveLid} />
      </mesh>
      {([[0.18, 0.36, 0.1], [-0.15, 0.3, 0.14]] as V[]).map((q, i) => <Ball key={i} at={q} r={0.02} color="#e8b923" />)}
    </group>
  )
}

/** Ürünün harita simgesi. */
function Mini({ id }: { id: string }) {
  switch (id) {
    case 'zeytin': return <Olive />
    case 'incir': return <FruitTree leaf="#5f8a45" fruit="#6b3f5a" wide />
    case 'narenciye': return <FruitTree leaf="#3f6e36" fruit="#ef9a2a" />
    case 'seftali': return <FruitTree leaf="#7aa556" fruit="#f08a5d" />
    case 'kayisi': return <FruitTree leaf="#7f9a58" fruit="#e8913a" />
    case 'elma': return <FruitTree leaf="#6f9a4e" fruit="#c8322b" />
    case 'kiraz': return <FruitTree leaf="#5f8a45" fruit="#8b1e2b" />
    case 'nar': return <FruitTree leaf="#6f8a4a" fruit="#b5203a" s={0.9} />
    case 'fistik': return <FruitTree leaf="#8c9a5b" fruit="#c98a8a" s={0.9} wide />
    case 'ceviz': return <FruitTree leaf="#4f7a3e" s={1.15} wide />
    case 'kestane': return <FruitTree leaf="#4f7a3e" fruit="#7a4a2a" s={1.1} wide />
    case 'findik': return <Hazel />
    case 'cay': return <Tea />
    case 'uzum': return <Vine />
    case 'gul': return <Rose />
    case 'domates': return <Tunnel />
    case 'sera': return <Tunnel />
    case 'muz': return <Tunnel banana />
    case 'bugday': return <Grain color="#d8b45a" head="#e7c86e" />
    case 'aycicegi': return <Sunflower />
    case 'pamuk': return <Cotton />
    case 'misir': return <Corn />
    case 'celtik': return <Rice />
    case 'pancar': return <Ridges leaf="#4f8a3e" />
    case 'patates': return <Ridges leaf="#6a8f4a" />
    case 'sebze': return <Ridges leaf="#6f9a4e" />
    case 'yerfistigi': return <Ridges leaf="#8fae5a" low />
    case 'mercimek': return <Ridges leaf="#b5a76a" low />
    case 'nohut': return <Ridges leaf="#a8a36a" low />
    case 'tutun': return <Tobacco />
    case 'hashas': return <Poppy />
    case 'mera': return <Sheep />
    case 'bal': return <Hive />
  }
  return null
}

export function IlBadges(_: { done?: number[] }) {
  const p = usePalette()
  const subeler = useGame((g) => g.s.subeler)
  const placed = useMemo(() => {
    const taken = new Set(crops.map((c) => c.province))
    return (provinces as Province[])
      .filter((pr) => !taken.has(pr.name) && ILLER[pr.name]?.products.length)
      .map((pr) => {
        const [x, z] = centroid(pr)
        return { name: pr.name, urun: ILLER[pr.name].products[0], pos: [x, pr.region === 'ege' ? 0.22 : 0.12, z] as [number, number, number] }
      })
  }, [])
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    placed.forEach((b, i) => {
      const g = refs.current[i]
      if (g) g.position.y = b.pos[1] + (lifts[b.name] ?? 0)
    })
  })
  return (
    <>
      {placed.map((b, i) => {
        const open = isOpen(b.name, subeler)
        return (
          <group key={b.name} ref={(el) => (refs.current[i] = el)} position={b.pos} scale={1} raycast={() => null}>
            <Mini id={b.urun} />
            {open && (
              <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
                <ringGeometry args={[0.3, 0.36, 24]} />
                <meshBasicMaterial color={p.accent} />
              </mesh>
            )}
          </group>
        )
      })}
    </>
  )
}
