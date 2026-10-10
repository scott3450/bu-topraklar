import { createContext, useContext, useMemo } from 'react'
import * as THREE from 'three'
import type { Palette } from '../theme/palettes'

/** İki rengi karıştır (t: 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number) {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()
}

export const PaletteContext = createContext<Palette | null>(null)

export function usePalette() {
  const p = useContext(PaletteContext)
  if (!p) throw new Error('PaletteContext yok')
  return p
}

// Bir mesh'in boyası.
export function Paint({ color, opacity }: { color: string; opacity?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.85}
      transparent={opacity !== undefined}
      opacity={opacity}
    />
  )
}

// Beşik çatı: üçgen kesitin uzunlamasına çekilmiş hâli.
export function Roof({
  width,
  depth,
  height,
  color,
}: {
  width: number
  depth: number
  height: number
  color: string
}) {
  const geometry = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-width / 2, 0)
    s.lineTo(width / 2, 0)
    s.lineTo(0, height)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
    g.translate(0, 0, -depth / 2)
    return g
  }, [width, depth, height])
  return (
    <mesh geometry={geometry} castShadow>
      <Paint color={color} />
    </mesh>
  )
}
