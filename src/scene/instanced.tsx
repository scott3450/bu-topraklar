// Çok tekrarlanan bitkiler tek çizimle (instancing): telefonda akıcılık için.
import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { mix, usePalette } from './kit'
import { windify } from '../fx/wind'

type V3 = [number, number, number]

function Layer({
  points,
  offset,
  scale = [1, 1, 1],
  color,
  children,
  wind = 0,
}: {
  points: V3[]
  offset: V3
  scale?: V3
  color: string
  children: React.ReactNode
  wind?: number // taç: rüzgârda sallanır
}) {
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
    return wind ? windify(m, wind) : m
  }, [color, wind])
  if (!points.length) return null
  return (
    <Instances limit={points.length} castShadow>
      {children}
      <primitive object={mat} attach="material" />
      {points.map((q, i) => (
        <Instance key={i} position={[q[0] + offset[0], q[1] + offset[1], q[2] + offset[2]]} scale={scale} />
      ))}
    </Instances>
  )
}

export function PineForest({ points }: { points: V3[] }) {
  const p = usePalette()
  return (
    <>
      <Layer points={points} offset={[0, 0.3, 0]} color={p.trunk}>
        <cylinderGeometry args={[0.06, 0.09, 0.6, 6]} />
      </Layer>
      <Layer points={points} offset={[0, 0.9, 0]} scale={[1, 0.85, 1]} color={p.pine} wind={0.04}>
        <sphereGeometry args={[0.44, 10, 8]} />
      </Layer>
      <Layer points={points} offset={[0, 1.35, 0]} color={mix(p.pine, '#8fae6e', 0.2)} wind={0.07}>
        <coneGeometry args={[0.34, 0.75, 10]} />
      </Layer>
    </>
  )
}

export function RoundTrees({ points }: { points: V3[] }) {
  const p = usePalette()
  return (
    <>
      <Layer points={points} offset={[0, 0.25, 0]} color={p.trunk}>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
      </Layer>
      <Layer points={points} offset={[0, 0.8, 0]} color="#6f9a4e" wind={0.06}>
        <sphereGeometry args={[0.42, 10, 8]} />
      </Layer>
    </>
  )
}

/** Zeytin ve fıstık gibi küçük yuvarlak taçlı ağaçlar (sade sürüm). */
export function SmallOrchard({ points, s = 0.8, leaf }: { points: V3[]; s?: number; leaf?: string }) {
  const p = usePalette()
  return (
    <>
      <Layer points={points} offset={[0, 0.3 * s, 0]} scale={[s, s, s]} color={p.trunk}>
        <cylinderGeometry args={[0.08, 0.12, 0.6, 6]} />
      </Layer>
      <Layer points={points} offset={[0, 0.95 * s, 0]} scale={[s, s * 0.82, s]} color={leaf ?? p.olive} wind={0.05}>
        <sphereGeometry args={[0.5, 10, 8]} />
      </Layer>
      <Layer points={points} offset={[0.22 * s, 1.1 * s, -0.12 * s]} scale={[s, s * 0.82, s]} color={mix(leaf ?? p.olive, '#b4bb92', 0.35)}>
        <sphereGeometry args={[0.3, 8, 7]} />
      </Layer>
    </>
  )
}

export function TeaRows({ points }: { points: V3[] }) {
  return (
    <Layer points={points} offset={[0, 0.08, 0]} scale={[1, 0.7, 1]} color="#53903f">
      <sphereGeometry args={[0.17, 7, 5]} />
    </Layer>
  )
}

export function Hazel({ points }: { points: V3[] }) {
  return (
    <>
      <Layer points={points} offset={[-0.15, 0.3, 0]} color="#557f3f">
        <sphereGeometry args={[0.24, 8, 6]} />
      </Layer>
      <Layer points={points} offset={[0.16, 0.34, 0.05]} color="#668f4a">
        <sphereGeometry args={[0.24, 8, 6]} />
      </Layer>
      <Layer points={points} offset={[0, 0.5, -0.08]} color="#7aa25a">
        <sphereGeometry args={[0.24, 8, 6]} />
      </Layer>
    </>
  )
}

export function Citrus({ points }: { points: V3[] }) {
  return (
    <>
      <Layer points={points} offset={[0, 0.15, 0]} color="#7a6248">
        <cylinderGeometry args={[0.04, 0.05, 0.3, 5]} />
      </Layer>
      <Layer points={points} offset={[0, 0.45, 0]} color="#3f6e36">
        <sphereGeometry args={[0.3, 9, 7]} />
      </Layer>
      <Layer points={points} offset={[0.2, 0.5, 0.15]} color="#ef9a2a">
        <sphereGeometry args={[0.05, 6, 5]} />
      </Layer>
      <Layer points={points} offset={[-0.18, 0.42, 0.18]} color="#ef9a2a">
        <sphereGeometry args={[0.05, 6, 5]} />
      </Layer>
    </>
  )
}

export function Greenhouses({ points }: { points: V3[] }) {
  if (!points.length) return null
  return (
    <Instances limit={points.length}>
      <cylinderGeometry args={[0.38, 0.38, 1.05, 12, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color="#eef1ea" roughness={0.4} transparent opacity={0.85} />
      {points.map((q, i) => (
        <Instance key={i} position={q} rotation={[0, 0, Math.PI / 2]} />
      ))}
    </Instances>
  )
}

/** Genel meyve bahçesi: gövde, yuvarlak taç, isteğe bağlı meyve noktaları. */
export function Orchard({ points, leaf, fruit, size = 0.85 }: { points: V3[]; leaf: string; fruit?: string; size?: number }) {
  const p = usePalette()
  const s = size
  return (
    <>
      <Layer points={points} offset={[0, 0.25 * s, 0]} scale={[s, s, s]} color={p.trunk}>
        <cylinderGeometry args={[0.07, 0.1, 0.5, 6]} />
      </Layer>
      <Layer points={points} offset={[0, 0.72 * s, 0]} scale={[s, s * 0.9, s]} color={leaf} wind={0.05}>
        <sphereGeometry args={[0.42, 10, 8]} />
      </Layer>
      {fruit &&
        ([[0.3, 0.68, 0.22], [-0.26, 0.8, 0.24], [0.06, 1.0, 0.26], [-0.12, 0.58, 0.34]] as V3[]).map((q, i) => (
          <Layer key={i} points={points} offset={[q[0] * s, q[1] * s, q[2] * s]} color={fruit}>
            <sphereGeometry args={[0.055 * s, 6, 5]} />
          </Layer>
        ))}
    </>
  )
}

/** Sıra bitkileri: bağ, gül, domates, sebze; bağda direkler. */
export function RowCrop({ points, color, post = false }: { points: V3[]; color: string; post?: boolean }) {
  return (
    <>
      <Layer points={points} offset={[0, 0.12, 0]} scale={[1.6, 0.8, 0.9]} color={color} wind={0.02}>
        <sphereGeometry args={[0.14, 7, 5]} />
      </Layer>
      {post && (
        <Layer points={points} offset={[0, 0.16, 0]} color="#8a6440">
          <cylinderGeometry args={[0.012, 0.012, 0.32, 4]} />
        </Layer>
      )}
    </>
  )
}
