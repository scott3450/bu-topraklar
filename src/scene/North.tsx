// Sağa-sola döndürme yardımcısı: harita ya da sahne dönükse sağ üstte pusula çıkar, basınca kuzeye döner.
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { create } from 'zustand'
import type { Palette } from '../theme/palettes'

type Controls = { target: THREE.Vector3; update: () => void; getAzimuthalAngle: () => number }

const useNorth = create<{ angle: number; reset: number; set: (a: number) => void; home: () => void }>((set, get) => ({
  angle: 0,
  reset: 0,
  set: (a) => set({ angle: a }),
  home: () => set({ reset: get().reset + 1 }),
}))

/** Sahnenin içinde: dönüş açısını bildirir, "kuzeye dön" gelince yumuşakça geri döndürür. */
export function NorthKeeper() {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as unknown as Controls | null
  const home = useRefOnce()
  useFrame((_, dt) => {
    if (!controls) return
    const base = home.base ?? (home.base = controls.getAzimuthalAngle())
    const a = controls.getAzimuthalAngle()
    let d = Math.atan2(Math.sin(a - base), Math.cos(a - base))
    const { reset, angle, set } = useNorth.getState()
    if (reset !== home.seen) {
      home.seen = reset
      home.going = true
    }
    if (home.going) {
      const step = -d * Math.min(1, dt * 6)
      const off = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), step)
      camera.position.copy(controls.target).add(off)
      controls.update()
      d += step
      if (Math.abs(d) < 0.003) home.going = false
    }
    const r = Math.round(d * 100) / 100
    if (r !== angle) set(r)
  })
  return null
}

// sahne yeniden kurulunca (Canvas key değişince) başlangıç açısı yeniden öğrenilir
function useRefOnce() {
  const r = useThree((s) => s.scene)
  const key = r.uuid
  const store = refs.get(key) ?? { base: undefined as number | undefined, seen: useNorth.getState().reset, going: false }
  refs.set(key, store)
  return store
}
const refs = new Map<string, { base: number | undefined; seen: number; going: boolean }>()

/** Dönükken görünen pusula düğmesi. */
export function NorthButton({ p }: { p: Palette }) {
  const angle = useNorth((s) => s.angle)
  const home = useNorth((s) => s.home)
  if (Math.abs(angle) < 0.05) return null
  return (
    <button
      onClick={home}
      aria-label="Kuzeye dön"
      title="Kuzeye dön"
      style={{ position: 'absolute', top: 64, right: 16, width: 40, height: 40, borderRadius: 20, border: 'none', background: p.ui.card, boxShadow: '0 6px 24px rgba(60,40,20,0.12)', cursor: 'pointer', display: 'grid', placeItems: 'center', zIndex: 5 }}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden style={{ transform: `rotate(${(-angle * 180) / Math.PI}deg)` }}>
        <path d="M11 2 15 11H7z" fill="#c43a2f" />
        <path d="M11 20 7 11h8z" fill={p.ui.muted} />
      </svg>
    </button>
  )
}
