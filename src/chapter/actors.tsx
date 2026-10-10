import { useEffect, useRef, type ReactNode } from 'react'
import { coin, pop } from '../fx/audio'
import { useFrame } from '@react-three/fiber'
import { Html } from '../scene/Html'
import * as THREE from 'three'
import { Paint } from '../scene/kit'
import { useDeclutter, useLabelRef } from './declutter'
import { CoopDepot } from '../scene/buildings'

type V3 = [number, number, number]

/** Köylü: gövde, baş, isteğe bağlı başörtüsü ya da kasket. anim: dur, topla, yürü, otur, sohbet. */
export function Person({
  position,
  shirt = '#b5603f',
  scarf,
  anim = 'idle',
  phase = 0,
  rot = 0,
  carry = false,
  pole = false,
  cap,
}: {
  position: V3
  shirt?: string
  scarf?: string
  anim?: 'idle' | 'pick' | 'cheer' | 'walk' | 'sit' | 'chat'
  phase?: number
  rot?: number
  carry?: boolean
  pole?: boolean // zeytin silkme sırığı
  cap?: string // kasket rengi
}) {
  const g = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Mesh>(null)
  const legR = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    const t = clock.elapsedTime * (anim === 'pick' ? 5 : anim === 'cheer' ? 8 : anim === 'walk' ? 9 : 1.6) + phase
    const swing = anim === 'walk' ? Math.sin(t) * 0.6 : 0
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
    if (anim === 'walk') {
      el.position.y = position[1] + Math.abs(Math.sin(t)) * 0.03
      el.rotation.x = 0
      el.rotation.z = 0
    } else if (anim === 'pick') {
      el.rotation.x = Math.max(0, Math.sin(t)) * 0.5
      el.position.y = position[1]
    } else if (anim === 'sit') {
      // alçak tabureye oturmuş (kalça yerden 0,07; çağıran grubu indirir): ara ara öne eğilir
      el.rotation.x = 0.08 + Math.max(0, Math.sin(t * 0.7)) ** 6 * 0.25
      el.rotation.z = 0
      el.position.y = position[1]
    } else if (anim === 'chat') {
      // ayakta sohbet: başını sallar, hafif döner
      el.rotation.x = Math.max(0, Math.sin(t * 2.2)) ** 3 * 0.12
      el.rotation.z = Math.sin(t * 0.9) * 0.05
      el.rotation.y = rot + Math.sin(t * 0.35) * 0.3
      el.position.y = position[1]
    } else if (anim === 'cheer') {
      el.position.y = position[1] + Math.abs(Math.sin(t)) * 0.15
      el.rotation.x = 0
    } else {
      el.rotation.x = 0
      el.rotation.z = Math.sin(t) * 0.04
      el.position.y = position[1]
    }
  })
  return (
    <group ref={g} position={position} rotation-y={rot}>
      {/* bacaklar */}
      {anim === 'sit' ? (
        [-0.045, 0.045].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.15, 0.08]} rotation-x={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.16, 6]} />
              <Paint color="#4a4038" />
            </mesh>
            <mesh position={[x, 0.11, 0.15]}>
              <cylinderGeometry args={[0.028, 0.028, 0.08, 6]} />
              <Paint color="#4a4038" />
            </mesh>
          </group>
        ))
      ) : (
        <>
          <mesh ref={legL} position={[-0.045, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.16, 6]} />
            <Paint color="#4a4038" />
          </mesh>
          <mesh ref={legR} position={[0.045, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.16, 6]} />
            <Paint color="#4a4038" />
          </mesh>
        </>
      )}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.32, 8]} />
        <Paint color={shirt} />
      </mesh>
      {pole && (
        <mesh position={[0.1, 0.75, -0.18]} rotation-x={-0.55}>
          <cylinderGeometry args={[0.012, 0.012, 1.0, 5]} />
          <Paint color="#8a6440" />
        </mesh>
      )}
      {carry && (
        <mesh position={[0, 0.72, 0]} castShadow>
          <boxGeometry args={[0.26, 0.16, 0.18]} />
          <Paint color="#b98a55" />
        </mesh>
      )}
      <mesh position={[0, 0.54, 0]} castShadow>
        <sphereGeometry args={[0.1, 10, 8]} />
        <Paint color="#e2b48c" />
      </mesh>
      {cap && (
        <group position={[0, 0.615, 0]}>
          <mesh>
            <cylinderGeometry args={[0.095, 0.1, 0.04, 10]} />
            <Paint color={cap} />
          </mesh>
          <mesh position={[0, -0.012, 0.08]} scale={[1, 0.25, 0.6]}>
            <sphereGeometry args={[0.07, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Paint color={cap} />
          </mesh>
        </group>
      )}
      {scarf && (
        <mesh position={[0, 0.57, -0.01]} scale={[1.12, 1, 1.12]}>
          <sphereGeometry args={[0.1, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <Paint color={scarf} />
        </mesh>
      )}
    </group>
  )
}

/** Kamyon: kabin + kasa; yol üzerinde verilen konumda ve yönde. */
export function Truck({ position, yaw, color, cargo = 0 }: { position: V3; yaw: number; color: string; cargo?: number }) {
  const wheels = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const dust = useRef<THREE.Group>(null)
  const last = useRef<THREE.Vector3 | null>(null)
  const speed = useRef(0)
  useFrame(({ clock }, dt) => {
    const p = new THREE.Vector3(...position)
    const moved = last.current ? p.distanceTo(last.current) : 0
    last.current = p
    speed.current = THREE.MathUtils.damp(speed.current, dt > 0 ? moved / dt : 0, 6, dt)
    wheels.current?.children.forEach((w) => (w.rotation.y -= moved / 0.1))
    if (body.current) body.current.position.y = speed.current > 0.2 ? Math.sin(clock.elapsedTime * 22) * 0.012 : 0
    // arkadan toz: hareket ederken bulutlar kabarır ve söner
    dust.current?.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 1.4 + i / 5) % 1
      const on = Math.min(1, speed.current / 3)
      c.position.set(-0.9 - k * 0.9, 0.08 + k * 0.25, (i % 2 ? 0.15 : -0.15) * (1 + k))
      c.scale.setScalar((0.4 + k) * on + 0.001)
      ;((c as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.45 * (1 - k) * on
    })
  })
  return (
    <group position={position} rotation-y={yaw}>
      <group ref={dust}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.12, 7, 5]} />
            <meshStandardMaterial color="#d8c6a2" transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <group ref={body}>
      <mesh position={[0.55, 0.32, 0]} castShadow>
        <boxGeometry args={[0.5, 0.46, 0.62]} />
        <Paint color={color} />
      </mesh>
      <mesh position={[0.62, 0.42, 0]}>
        <boxGeometry args={[0.36, 0.2, 0.64]} />
        <Paint color="#cfe2e6" />
      </mesh>
      <mesh position={[-0.25, 0.22, 0]} castShadow>
        <boxGeometry args={[1.1, 0.12, 0.66]} />
        <Paint color="#6b6258" />
      </mesh>
      {Array.from({ length: cargo }, (_, i) => (
        <mesh key={i} position={[-0.6 + (i % 4) * 0.22, 0.4 + Math.floor(i / 8) * 0.2, (Math.floor(i / 4) % 2) * 0.26 - 0.13]} castShadow>
          <boxGeometry args={[0.18, 0.2, 0.2]} />
          <Paint color="#c9b64a" />
        </mesh>
      ))}
      </group>
      <group ref={wheels}>
        {[[0.55, 0.36], [0.55, -0.36], [-0.5, 0.36], [-0.5, -0.36]].map(([x, z], i) => (
          <group key={i} position={[x, 0.1, z]} rotation-x={Math.PI / 2}>
            <mesh>
              <cylinderGeometry args={[0.1, 0.1, 0.08, 10]} />
              <Paint color="#3b3530" />
            </mesh>
            <mesh position={[0.05, 0, 0]}>
              <boxGeometry args={[0.04, 0.09, 0.03]} />
              <Paint color="#8c8478" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** Kooperatif deposu: sıkım ve şişeleme burada. */
export function Depot({ position }: { position: V3 }) {
  return <CoopDepot position={position} />
}

/** Bidon ya da teneke, sıra sıra. */
export function Bidons({ position, n, color = '#c9b64a' }: { position: V3; n: number; color?: string }) {
  return (
    <group position={position}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[(i % 6) * 0.2, 0.1 + Math.floor(i / 12) * 0.2, (Math.floor(i / 6) % 2) * 0.22]} castShadow>
          <boxGeometry args={[0.16, 0.2, 0.16]} />
          <Paint color={color} />
        </mesh>
      ))}
    </group>
  )
}

/** Şişe kasaları: koyu yeşil şişe tepeleri görünen kasalar. */
export function BottleCrates({ position, n }: { position: V3; n: number }) {
  return (
    <group position={position}>
      {Array.from({ length: n }, (_, i) => {
        const x = (i % 5) * 0.26
        const z = (Math.floor(i / 5) % 2) * 0.26
        const y = Math.floor(i / 10) * 0.16
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.07, 0]} castShadow>
              <boxGeometry args={[0.24, 0.14, 0.24]} />
              <Paint color="#b98a55" />
            </mesh>
            {[[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]].map(([bx, bz], k) => (
              <mesh key={k} position={[bx, 0.18, bz]}>
                <cylinderGeometry args={[0.025, 0.03, 0.12, 6]} />
                <Paint color="#3d5a2a" />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

/** Hasat kasası yığını. */
export function Crates({ position, n }: { position: V3; n: number }) {
  return (
    <group position={position}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[(i % 3) * 0.3, 0.1 + Math.floor(i / 3) * 0.2, 0]} castShadow>
          <boxGeometry args={[0.28, 0.2, 0.2]} />
          <Paint color="#b98a55" />
        </mesh>
      ))}
    </group>
  )
}

/** Konuşma balonu: kısa cümle, karakterin üstünde. */
export function Bubble({ position, children, onTap }: { position: V3; children: ReactNode; onTap?: () => void }) {
  useEffect(() => pop(), [])
  const [box, setBox] = useLabelRef()
  useDeclutter(box, 0)
  return (
    <Html position={position} center zIndexRange={[20, 0]}>
      <div ref={setBox}>
      <div
        onClick={onTap}
        style={{
          position: 'relative',
          transform: 'translateY(-50%)',
          maxWidth: 220,
          width: 'max-content',
          padding: '9px 13px',
          borderRadius: 18,
          background: '#fffaf1',
          color: '#3a2a1c',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.3,
          boxShadow: '0 6px 18px rgba(60,40,20,0.18)',
          cursor: onTap ? 'pointer' : 'default',
          animation: 'balon 280ms ease-out both',
          userSelect: 'none',
        }}
      >
        {children}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -7,
            width: 14,
            height: 14,
            background: '#fffaf1',
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />
      </div>
      </div>
    </Html>
  )
}

/** Yükselip kaybolan para yazısı. */
export function FloatMoney({ position, amount, big }: { position: V3; amount: number; big?: boolean }) {
  useEffect(() => coin(amount >= 0), [amount])
  const txt = (amount < 0 ? '−₺' : '+₺') + Math.abs(Math.round(amount)).toLocaleString('tr-TR')
  return (
    <Html position={position} center zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 800,
          fontSize: big ? 26 : 18,
          color: amount < 0 ? '#e5533d' : '#1d6b67',
          textShadow: '0 2px 0 #fffaf1, 0 0 10px rgba(255,250,241,0.9)',
          whiteSpace: 'nowrap',
          animation: 'para 2.6s ease-out both',
        }}
      >
        {txt}
      </div>
    </Html>
  )
}

/** Kamyon üstü fiyat etiketi. */
export function PriceTag({ position, text }: { position: V3; text: string }) {
  const [box, setBox] = useLabelRef()
  useDeclutter(box, 1)
  return (
    <Html position={position} center zIndexRange={[25, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={setBox}>
      <div
        style={{
          padding: '5px 10px',
          borderRadius: 8,
          background: '#3a2a1c',
          color: '#fffaf1',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 800,
          fontSize: 16,
          whiteSpace: 'nowrap',
          animation: 'balon 280ms ease-out both',
        }}
      >
        {text}
      </div>
      </div>
    </Html>
  )
}

/** Kooperatifin kasası: altın yığını. Eksiye düşerse kırmızı boş tabak. */
export function CoinStack({ position, amount }: { position: V3; amount: number }) {
  const n = Math.max(0, Math.min(24, Math.round(amount / 50_000)))
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.32, 0.34, 0.04, 20]} />
        <Paint color={amount < 0 ? '#e5533d' : '#7a6248'} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[(i % 3) * 0.16 - 0.16, 0.06 + Math.floor(i / 3) * 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 14]} />
          <Paint color="#e2b23a" />
        </mesh>
      ))}
    </group>
  )
}

/** Yem çuvalları. */
export function Sacks({ position, n, color = '#d9c89a' }: { position: V3; n: number; color?: string }) {
  return (
    <group position={position}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[(i % 4) * 0.24, 0.1 + Math.floor(i / 8) * 0.17, (Math.floor(i / 4) % 2) * 0.22]} scale={[1, 0.75, 0.8]} castShadow>
          <sphereGeometry args={[0.13, 8, 6]} />
          <Paint color={color} />
        </mesh>
      ))}
    </group>
  )
}

/** Yay çizerek uçan altın paralar (kaynaktan hedefe). Bağlandığı an başlar. */
export function CoinFlight({ from, to, n = 8, color = '#e2b23a' }: { from: V3; to: V3; n?: number; color?: string }) {
  const g = useRef<THREE.Group>(null)
  const t0 = useRef<number | null>(null)
  useFrame(({ clock }) => {
    if (t0.current === null) t0.current = clock.elapsedTime
    const el = g.current
    if (!el) return
    const dist = Math.hypot(to[0] - from[0], to[2] - from[2])
    el.children.forEach((c, i) => {
      const k = Math.min(1, Math.max(0, (clock.elapsedTime - t0.current! - i * 0.07) / 0.85))
      const e = k * k * (3 - 2 * k)
      c.position.set(
        from[0] + (to[0] - from[0]) * e,
        from[1] + (to[1] - from[1]) * e + Math.sin(Math.PI * e) * (0.8 + dist * 0.15),
        from[2] + (to[2] - from[2]) * e,
      )
      c.rotation.y = clock.elapsedTime * 8 + i
      c.visible = k > 0 && k < 1
    })
  })
  return (
    <group ref={g}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} rotation-x={Math.PI / 2} visible={false}>
          <cylinderGeometry args={[0.07, 0.07, 0.025, 14]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.35} emissive={color} emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  )
}

/** İki nokta arasında gidip gelen işçi: dolu giderken kasa taşır. */
export function Walker({ from, to, shirt, phase = 0, speed = 0.7 }: { from: V3; to: V3; shirt: string; phase?: number; speed?: number }) {
  const g = useRef<THREE.Group>(null)
  const carry = useRef(true)
  const inner = useRef<THREE.Group>(null)
  const box = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    const len = Math.hypot(to[0] - from[0], to[2] - from[2])
    const T = (len / speed) * 2
    const u = ((clock.elapsedTime + phase) % T) / T
    const going = u < 0.5
    const k = going ? u * 2 : (1 - u) * 2
    el.position.set(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k)
    const yaw = Math.atan2(to[0] - from[0], to[2] - from[2]) + (going ? 0 : Math.PI)
    if (inner.current) inner.current.rotation.y = yaw
    carry.current = going
    if (box.current) box.current.visible = going
  })
  return (
    <group ref={g}>
      <group ref={inner} scale={1.3}>
        <Person position={[0, 0, 0]} shirt={shirt} anim="walk" phase={phase} />
        <mesh ref={box} position={[0, 0.74, 0]} castShadow>
          <boxGeometry args={[0.26, 0.16, 0.18]} />
          <Paint color="#b98a55" />
        </mesh>
      </group>
    </group>
  )
}

/** Silkelenen daldan brandaya düşen zeytin taneleri (döngü). */
export function FallingOlives({ position, n = 10 }: { position: V3; n?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    el.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 0.9 + i / n) % 1
      const sx = Math.sin(i * 7.1) * 0.35
      const sz = Math.cos(i * 3.7) * 0.3
      c.position.set(sx, 0.95 - k * k * 0.95, sz)
      c.visible = k < 0.97
    })
  })
  return (
    <group ref={g} position={position}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.03, 6, 5]} />
          <Paint color="#4a3048" />
        </mesh>
      ))}
    </group>
  )
}
