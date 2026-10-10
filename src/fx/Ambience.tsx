import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { windTime } from './wind'

/** Rüzgâr saatini ilerletir; bulut gölgeleri ve kuş sürüsü. */
export function Ambience({ birds = true, clouds = true }: { birds?: boolean; clouds?: boolean }) {
  useFrame((_, dt) => {
    windTime.value += dt
  })
  return (
    <>
      {clouds && <CloudShadows />}
      {birds && <Birds />}
    </>
  )
}

function CloudShadows() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')!
    g.clearRect(0, 0, 256, 256)
    for (let i = 0; i < 9; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const r = 30 + Math.random() * 45
      const grd = g.createRadialGradient(x, y, 0, x, y, r)
      grd.addColorStop(0, 'rgba(0,0,0,0.9)')
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = grd
      g.fillRect(0, 0, 256, 256)
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2, 2)
    return t
  }, [])
  useFrame((_, dt) => {
    tex.offset.x += dt * 0.006
    tex.offset.y += dt * 0.003
  })
  return (
    <mesh position={[0, 6, 0]} rotation-x={-Math.PI / 2} renderOrder={5}>
      <planeGeometry args={[140, 140]} />
      <meshBasicMaterial map={tex} transparent opacity={0.1} depthWrite={false} color="#2a2a3a" />
    </mesh>
  )
}

function Birds() {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    const T = 26
    const u = (clock.elapsedTime % T) / T
    el.position.set(-30 + 60 * u, 5.5 + Math.sin(u * 6) * 0.3, -10 + 18 * u)
    el.children.forEach((b, i) => {
      const flap = Math.sin(clock.elapsedTime * 10 + i) * 0.5
      b.children[0].rotation.z = flap
      b.children[1].rotation.z = -flap
    })
  })
  const spots: [number, number, number][] = [[0, 0, 0], [-0.5, 0.1, 0.4], [-0.5, -0.05, -0.4], [-1, 0.05, 0.8], [-1, 0, -0.8]]
  return (
    <group ref={g} rotation-y={-0.55}>
      {spots.map((q, i) => (
        <group key={i} position={q}>
          <mesh position={[0, 0, 0.12]}>
            <boxGeometry args={[0.06, 0.01, 0.24]} />
            <meshBasicMaterial color="#3b3530" />
          </mesh>
          <mesh position={[0, 0, -0.12]}>
            <boxGeometry args={[0.06, 0.01, 0.24]} />
            <meshBasicMaterial color="#3b3530" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
