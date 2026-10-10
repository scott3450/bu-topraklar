// Dünya canlı dursun: gezinen koyun sürüsü (çoban ve köpekle), ekim yapan traktör, dolaşan köylüler.
// Hepsi kendi saatleriyle döner; sahnenin geri kalanından bağımsız.
import React, { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Person } from '../chapter/actors'
import { Paint } from './kit'
import { Tractor } from './village'
import { useSettings } from '../fx/settings'

type V3 = [number, number, number]
type At = (x: number, z: number, dy?: number) => V3

function rand(seed: number) {
  let s = seed * 9301 + 49297
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
}

const WOOL = new THREE.Color('#f1ece0')
const FACE = new THREE.Color('#3b3530')

/**
 * Koyun sürüsü: sürünün merkezi yavaşça dolaşır, her koyun kendi yerine yürür, varınca otlar (başı iner).
 * Arkada çoban yürür, köpek sürünün çevresinde döner.
 */
export function Flock({ center, n = 14, roam = 1.2, at, seed = 1, shepherd = true }: { center: [number, number]; n?: number; roam?: number; at: At; seed?: number; shepherd?: boolean }) {
  const calm = useSettings((s) => s.calm)
  const body = useRef<THREE.InstancedMesh>(null)
  const head = useRef<THREE.InstancedMesh>(null)
  const legs = useRef<THREE.InstancedMesh>(null)
  const man = useRef<THREE.Group>(null)
  const dog = useRef<THREE.Group>(null)
  const sheep = useMemo(() => {
    const r = rand(seed)
    return Array.from({ length: n }, () => {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * 0.75
      const home = [Math.cos(a) * d, Math.sin(a) * d * 0.7] as [number, number]
      return { home, x: center[0] + home[0], z: center[1] + home[1], tx: 0, tz: 0, wait: r() * 4, yaw: r() * 6, graze: 0, size: 0.85 + r() * 0.3, r }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, seed, center[0], center[1]])
  const m = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const speed = calm ? 0.4 : 1
    // sürünün merkezi: yavaş bir sekiz çizer
    const cx = center[0] + Math.sin(t * 0.05 * speed + seed) * roam
    const cz = center[1] + Math.sin(t * 0.1 * speed + seed) * roam * 0.5
    sheep.forEach((s, i) => {
      if (s.wait > 0) {
        s.wait -= dt
        s.graze = Math.min(1, s.graze + dt * 2)
        if (s.wait <= 0) {
          // yeni hedef: merkezin çevresinde kendi yeri, biraz oynatılmış
          s.tx = cx + s.home[0] + (s.r() - 0.5) * 0.5
          s.tz = cz + s.home[1] + (s.r() - 0.5) * 0.4
        }
      } else {
        s.graze = Math.max(0, s.graze - dt * 3)
        const dx = s.tx - s.x
        const dz = s.tz - s.z
        const d = Math.hypot(dx, dz)
        if (d < 0.05) s.wait = 1.5 + s.r() * 5
        else {
          const v = Math.min(d, 0.32 * speed * dt)
          s.x += (dx / d) * v
          s.z += (dz / d) * v
          const want = Math.atan2(dx, dz)
          s.yaw += Math.atan2(Math.sin(want - s.yaw), Math.cos(want - s.yaw)) * Math.min(1, dt * 5)
        }
      }
      const walking = s.wait <= 0
      const [x, y, z] = at(s.x, s.z)
      const bob = walking ? Math.abs(Math.sin(t * 9 + i)) * 0.02 : 0
      m.position.set(x, y + 0.17 + bob, z)
      m.rotation.set(0, s.yaw, 0)
      m.scale.setScalar(s.size)
      m.updateMatrix()
      body.current?.setMatrixAt(i, m.matrix)
      // baş: gövdenin önünde, otlarken aşağıda
      const hx = Math.sin(s.yaw) * 0.17 * s.size
      const hz = Math.cos(s.yaw) * 0.17 * s.size
      m.position.set(x + hx, y + 0.2 - s.graze * 0.1 + bob, z + hz)
      m.rotation.set(s.graze * 0.6, s.yaw, 0)
      m.updateMatrix()
      head.current?.setMatrixAt(i, m.matrix)
      m.position.set(x, y + 0.05, z)
      m.rotation.set(0, s.yaw, 0)
      m.updateMatrix()
      legs.current?.setMatrixAt(i, m.matrix)
    })
    for (const r of [body, head, legs]) if (r.current) r.current.instanceMatrix.needsUpdate = true
    // çoban sürünün arkasından gelir; köpek çevresinde döner
    if (man.current) {
      const back = t * 0.05 * speed + seed - 0.6
      const mx = center[0] + Math.sin(back) * roam - 0.9
      const mz = center[1] + Math.sin(back * 2) * roam * 0.5 + 0.5
      const [x, y, z] = at(mx, mz)
      const px = man.current.position.x
      const pz = man.current.position.z
      man.current.position.set(x, y, z)
      if (Math.hypot(x - px, z - pz) > 1e-4) man.current.rotation.y = Math.atan2(x - px, z - pz)
    }
    if (dog.current) {
      const a = t * 0.6 * speed + seed
      const dx = cx + Math.cos(a) * 1.05
      const dz = cz + Math.sin(a) * 0.75
      const [x, y, z] = at(dx, dz)
      dog.current.position.set(x, y + Math.abs(Math.sin(t * 12)) * 0.03, z)
      dog.current.rotation.y = -a
    }
  })

  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, n]} castShadow frustumCulled={false}>
        <icosahedronGeometry args={[0.15, 1]} />
        <meshStandardMaterial color={WOOL} roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry args={[0.08, 0.09, 0.11]} />
        <meshStandardMaterial color={FACE} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={legs} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry args={[0.14, 0.1, 0.16]} />
        <meshStandardMaterial color={FACE} roughness={1} />
      </instancedMesh>
      {shepherd && (
        <>
          <group ref={man} scale={1.2}>
            <Person position={[0, 0, 0]} shirt="#6a5a3f" anim="walk" phase={seed} pole />
          </group>
          <group ref={dog}>
            <mesh position={[0, 0.12, 0]} castShadow>
              <boxGeometry args={[0.1, 0.09, 0.24]} />
              <Paint color="#e8dcc6" />
            </mesh>
            <mesh position={[0, 0.17, 0.13]}>
              <boxGeometry args={[0.08, 0.08, 0.09]} />
              <Paint color="#e8dcc6" />
            </mesh>
            <mesh position={[0, 0.17, 0.18]}>
              <boxGeometry args={[0.05, 0.04, 0.05]} />
              <Paint color="#3b3530" />
            </mesh>
          </group>
        </>
      )}
    </group>
  )
}

/**
 * Ekim: traktör tarlada sıra sıra gider, geçtiği sıra koyulaşır ve tohum noktaları belirir; ekilen
 * sıralarda filizler zamanla büyür. Traktörün arkasında martılar dolanır. Tur bitince yeni sezon.
 */
export function SowingField({ x, z, w, d, at, rows = 6, period = 70 }: { x: number; z: number; w: number; d: number; at: At; rows?: number; period?: number }) {
  const calm = useSettings((s) => s.calm)
  const tractor = useRef<THREE.Group>(null)
  const birds = useRef<THREE.Group>(null)
  const [sown, setSown] = useState(0) // kaç sıra ekildi (kesirli değil, yeniden çizimi azaltır)
  const [growth, setGrowth] = useState(0) // 0–1 filiz boyu (adımlı)
  const rowZ = (i: number) => z - d / 2 + (d / rows) * (i + 0.5)
  const drive = 0.72 // turun bu kadarı ekim, kalanı büyüme
  useFrame(({ clock }) => {
    const u = (clock.elapsedTime / (calm ? period * 1.6 : period)) % 1
    const k = Math.min(1, u / drive)
    const pos = k * rows
    const row = Math.min(rows - 1, Math.floor(pos))
    const f = pos - row
    const dir = row % 2 === 0 ? 1 : -1
    const tx = x + (dir > 0 ? -w / 2 + f * w : w / 2 - f * w)
    const tz = rowZ(row)
    const parked = u >= drive
    const px = parked ? x + w / 2 + 0.5 : tx
    const pz = parked ? z + d / 2 - 0.2 : tz
    if (tractor.current) {
      const [ax, ay, az] = at(px, pz)
      tractor.current.position.set(ax, ay, az)
      tractor.current.rotation.y = parked ? Math.PI / 2 : dir > 0 ? 0 : Math.PI
    }
    if (birds.current) {
      birds.current.visible = !parked
      birds.current.children.forEach((b, i) => {
        const a = clock.elapsedTime * (1.4 + i * 0.3) + i * 2
        const [bx, by, bz] = at(tx - dir * (0.5 + 0.15 * Math.sin(a)), tz)
        b.position.set(bx + Math.cos(a) * 0.25, by + 0.5 + Math.sin(a * 1.7) * 0.12, bz + Math.sin(a) * 0.25)
        b.rotation.z = Math.sin(clock.elapsedTime * 14 + i) * 0.5
      })
    }
    const s = parked ? rows : row + (f > 0.98 ? 1 : 0)
    if (s !== sown) setSown(s)
    const g = parked ? Math.round(((u - drive) / (1 - drive)) * 6) / 6 : 0
    if (g !== growth) setGrowth(g)
  })
  const cols = Math.max(4, Math.round(w / 0.32))
  return (
    <group>
      {Array.from({ length: rows }, (_, i) => {
        const done = i < sown
        const [rx, ry, rz] = at(x, rowZ(i), 0.03)
        return (
          <group key={i}>
            <mesh position={[rx, ry, rz]} receiveShadow>
              <boxGeometry args={[w, 0.04, (d / rows) * 0.6]} />
              <Paint color={done ? '#6f5236' : '#a5825c'} />
            </mesh>
            {done &&
              Array.from({ length: cols }, (_, j) => {
                const cx = x - w / 2 + (w / cols) * (j + 0.5)
                const [sx, sy, sz] = at(cx, rowZ(i), 0.06)
                const h = 0.02 + growth * 0.16
                return (
                  <mesh key={j} position={[sx, sy + h / 2, sz]} scale={[1, h / 0.1, 1]}>
                    <boxGeometry args={[growth > 0 ? 0.06 : 0.03, 0.1, growth > 0 ? 0.06 : 0.03]} />
                    <Paint color={growth > 0 ? '#7fae4e' : '#e2c98e'} />
                  </mesh>
                )
              })}
          </group>
        )
      })}
      <group ref={tractor}>
        <Tractor position={[0, 0, 0]} rot={0} />
      </group>
      <group ref={birds}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <boxGeometry args={[0.16, 0.015, 0.05]} />
            <meshStandardMaterial color="#f7f4ee" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Köylü: bir yol boyunca yürür, uçlarda bir süre durur (çeşme başı, kahvehane önü). */
function Stroller({ path, at, shirt, scarf, phase }: { path: [number, number][]; at: At; shirt: string; scarf?: string; phase: number }) {
  const g = useRef<THREE.Group>(null)
  const [walking, setWalking] = useState(true)
  const seg = useMemo(() => {
    const lens = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]))
    return { lens, total: lens.reduce((a, b) => a + b, 0) }
  }, [path])
  const SPEED = 0.35
  const PAUSE = 4
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    const walkT = seg.total / SPEED
    const T = 2 * (walkT + PAUSE)
    let u = (clock.elapsedTime + phase) % T
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
    const [x, y, z] = at(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)
    el.position.set(x, y, z)
    if (moving) el.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]) + (back ? Math.PI : 0)
  })
  return (
    <group ref={g} scale={1.25}>
      <Person position={[0, 0, 0]} shirt={shirt} scarf={scarf} anim={walking ? 'walk' : 'idle'} phase={phase} />
    </group>
  )
}

const SHIRTS = ['#5f7a4a', '#8a5a3f', '#3f6b8a', '#a0583f', '#6a5a7a', '#7a6a3f']
const SCARVES = [undefined, '#c04e3a', undefined, '#d8c26a', undefined, '#4f7a6a']

/** Tek tük dolaşan köylüler. */
export function Strollers({ paths, at }: { paths: [number, number][][]; at: At }) {
  return (
    <group>
      {paths.map((p, i) => (
        <Stroller key={i} path={p} at={at} shirt={SHIRTS[i % SHIRTS.length]} scarf={SCARVES[i % SCARVES.length]} phase={i * 3.7} />
      ))}
    </group>
  )
}

/** Yeni yapı belirince zıplayarak büyür (köy büyüdü hissi). Sakin harekette anında görünür. */
export function Grow({ children, at: pivot }: { children: React.ReactNode; at: V3 }) {
  const calm = useSettings((s) => s.calm)
  const g = useRef<THREE.Group>(null)
  const t0 = useRef<number | null>(null)
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    if (calm) return void el.scale.setScalar(1)
    if (t0.current === null) t0.current = clock.elapsedTime
    const k = Math.min(1, (clock.elapsedTime - t0.current) / 0.7)
    // aşıp geri oturan yay
    const s = k >= 1 ? 1 : 1 - Math.cos(k * Math.PI * 2.5) * Math.pow(1 - k, 2.2)
    el.scale.set(s, Math.max(0.01, s), s)
  })
  return (
    <group position={pivot}>
      <group ref={g} scale={calm ? 1 : 0.01}>
        <group position={[-pivot[0], -pivot[1], -pivot[2]]}>{children}</group>
      </group>
    </group>
  )
}
