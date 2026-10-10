import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import provinces from '../data/provinces.json'
import { crops, type Crop } from '../data/crops'
import { Paint, usePalette } from './kit'
import { Cow, Hive, OliveTree, Pine } from './Valley'
import { centroid, lifts, type Province } from './TurkeyMap'

// Haritadaki ürün figürleri. Vadi parçalarıyla aynı dil, küçültülmüş.

const GOLD = '#d9b44a'
const ORANGE = '#e8913a'
const WHITE = '#f7f3ea'
const LEAF = '#6f8a4a'

function Figure({ id }: { id: string }) {
  const p = usePalette()
  switch (id) {
    case 'zeytin':
      return (
        <>
          <OliveTree position={[-0.3, 0, 0]} />
          <OliveTree position={[0.35, 0, 0.2]} scale={0.85} />
        </>
      )
    case 'cambali':
      return (
        <>
          <Pine position={[-0.3, 0, -0.1]} />
          <Hive position={[0.35, 0, 0.15]} />
        </>
      )
    case 'sut':
      return <Cow position={[0, 0, 0]} rotation={0.6} />
    case 'domates':
      return (
        <>
          <mesh position={[0, 0.38, 0]} scale={[1, 0.85, 1]} castShadow>
            <sphereGeometry args={[0.38, 16, 12]} />
            <Paint color={p.tomato} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <coneGeometry args={[0.16, 0.12, 6]} />
            <Paint color={LEAF} />
          </mesh>
        </>
      )
    case 'findik':
      return (
        <>
          {([[-0.25, 0.35, 0], [0.25, 0.4, 0.05], [0, 0.6, -0.1]] as const).map((q, i) => (
            <mesh key={i} position={[...q]} castShadow>
              <icosahedronGeometry args={[0.32, 0]} />
              <Paint color={p.pine} />
            </mesh>
          ))}
          <mesh position={[0.15, 0.2, 0.35]} castShadow>
            <sphereGeometry args={[0.1, 10, 8]} />
            <Paint color={p.crate} />
          </mesh>
        </>
      )
    case 'cay':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.12 + i * 0.16, 0.3 - i * 0.3]} castShadow>
              <boxGeometry args={[0.9, 0.22, 0.22]} />
              <Paint color={LEAF} />
            </mesh>
          ))}
        </>
      )
    case 'kayisi':
      return (
        <>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 0.5, 6]} />
            <Paint color={p.trunk} />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <icosahedronGeometry args={[0.42, 0]} />
            <Paint color={p.olive} />
          </mesh>
          {([[0.3, 0.6, 0.2], [-0.25, 0.75, 0.25], [0.1, 0.95, 0.25], [-0.1, 0.55, 0.35]] as const).map(
            (q, i) => (
              <mesh key={i} position={[...q]}>
                <sphereGeometry args={[0.08, 8, 6]} />
                <Paint color={ORANGE} />
              </mesh>
            ),
          )}
        </>
      )
    case 'bugday':
      return (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const a = (i / 7) * Math.PI * 2
            return (
              <group key={i} position={[Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1]} rotation={[Math.sin(a) * 0.15, 0, Math.cos(a) * 0.15]}>
                <mesh position={[0, 0.35, 0]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.7, 4]} />
                  <Paint color={GOLD} />
                </mesh>
                <mesh position={[0, 0.78, 0]} scale={[1, 2.2, 1]}>
                  <sphereGeometry args={[0.06, 6, 6]} />
                  <Paint color={GOLD} />
                </mesh>
              </group>
            )
          })}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.06, 10]} />
            <Paint color={p.trunk} />
          </mesh>
        </>
      )
    case 'pamuk':
      return (
        <>
          {([[-0.25, 0], [0.2, 0.15], [0.05, -0.25]] as const).map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.025, 0.03, 0.5, 4]} />
                <Paint color={p.trunk} />
              </mesh>
              <mesh position={[0, 0.55, 0]} castShadow>
                <icosahedronGeometry args={[0.15, 1]} />
                <Paint color={WHITE} />
              </mesh>
            </group>
          ))}
        </>
      )
    case 'fistik':
      return (
        <>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 0.4, 6]} />
            <Paint color={p.trunk} />
          </mesh>
          <mesh position={[0, 0.6, 0]} scale={[1.2, 0.7, 1.2]} castShadow>
            <icosahedronGeometry args={[0.4, 0]} />
            <Paint color={p.olive} />
          </mesh>
          {([[0.3, 0.5, 0.25], [-0.3, 0.55, 0.2], [0, 0.45, 0.4]] as const).map((q, i) => (
            <mesh key={i} position={[...q]}>
              <sphereGeometry args={[0.07, 8, 6]} />
              <Paint color="#c98a8a" />
            </mesh>
          ))}
        </>
      )
  }
  return null
}

function Pickable({
  children,
  province,
  selected,
  onPick,
}: {
  children: ReactNode
  province: string
  selected: boolean
  onPick: () => void
}) {
  const p = usePalette()
  const [hover, setHover] = useState(false)
  const g = useRef<THREE.Group>(null)
  // ilinle birlikte yüksel; il canlanınca figür de salınsın
  useFrame(({ clock }, dt) => {
    const el = g.current
    if (!el) return
    const lift = lifts[province] ?? 0
    el.position.y = lift / 0.72 // figür grubu 0.72 ölçekli
    const excite = Math.min(1, lift / 0.12)
    const t = clock.elapsedTime
    el.rotation.z = Math.sin(t * 5) * 0.09 * excite
    el.rotation.x = Math.sin(t * 3.7) * 0.05 * excite
    const sc = hover || selected ? 1.18 : 1 + 0.08 * excite
    el.scale.setScalar(THREE.MathUtils.damp(el.scale.x, sc, 10, dt))
  })
  return (
    <group
      ref={g}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = 'default'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onPick()
      }}
    >
      {selected && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
          <ringGeometry args={[0.55, 0.65, 32]} />
          <meshBasicMaterial color={p.accent} />
        </mesh>
      )}
      {children}
    </group>
  )
}

export function CropFigures({
  selected,
  onSelect,
}: {
  selected: Crop | null
  onSelect: (c: Crop) => void
}) {
  const placed = useMemo(() => {
    const byName = new Map((provinces as Province[]).map((p) => [p.name, p]))
    return crops.map((c) => {
      const prov = byName.get(c.province)!
      const [x, z] = centroid(prov)
      const y = prov.region === 'ege' ? 0.22 : 0.12
      return { c, pos: [x, y, z] as [number, number, number] }
    })
  }, [])

  return (
    <>
      {placed.map(({ c, pos }) => (
        <group key={c.id} position={pos} scale={0.72}>
          <Pickable province={c.province} selected={selected?.id === c.id} onPick={() => onSelect(c)}>
            <Figure id={c.id} />
          </Pickable>
        </group>
      ))}
    </>
  )
}
