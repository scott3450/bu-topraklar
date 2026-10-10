import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

type Controls = { target: THREE.Vector3; update: () => void; enabled: boolean }

/**
 * Sahneyi ekrana sığdırır. Açılışta `from` katından başlayıp hedefe süzülür
 * (1'den küçük: uzaktan yaklaşır, büyük: yakından geri çekilir). Süzülme bitince
 * kontrol kullanıcıya geçer.
 */
export function FitZoom({ width, height, from = 1 }: { width: number; height: number; from?: number }) {
  const { size, camera } = useThree()
  const target = useRef(1)
  const settling = useRef(true)

  useEffect(() => {
    target.current = Math.min(size.width / width, size.height / height)
    camera.userData.fit = target.current
    if (settling.current) camera.zoom = target.current * from
    else camera.zoom = target.current
    camera.updateProjectionMatrix()
    // yalnız boyut değişince çalışır; from bilerek bağımlılıkta yok
  }, [size, camera, width, height])

  useFrame((_, dt) => {
    camera.userData.settling = settling.current
    if (!settling.current) return
    camera.zoom = THREE.MathUtils.damp(camera.zoom, target.current, 3.2, dt)
    camera.updateProjectionMatrix()
    if (Math.abs(camera.zoom - target.current) < target.current * 0.004) {
      camera.zoom = target.current
      camera.updateProjectionMatrix()
      settling.current = false
    }
  })
  return null
}

/** Kamerayı bir noktaya doğru kaydırıp yakınlaştırır; bitince onDone. */
export function FlyTo({
  to,
  zoomBy = 3.2,
  duration = 0.9,
  onFade,
  onDone,
}: {
  to: [number, number]
  zoomBy?: number
  duration?: number
  onFade: () => void
  onDone: () => void
}) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as unknown as Controls | null
  const start = useRef<{ pos: THREE.Vector3; tgt: THREE.Vector3; zoom: number } | null>(null)
  const t = useRef(0)
  const faded = useRef(false)
  const done = useRef(false)

  useFrame((_, dt) => {
    if (done.current) return
    if (!start.current) {
      start.current = {
        pos: camera.position.clone(),
        tgt: controls ? controls.target.clone() : new THREE.Vector3(),
        zoom: camera.zoom,
      }
      if (controls) controls.enabled = false
    }
    t.current = Math.min(1, t.current + dt / duration)
    const k = t.current * t.current * (3 - 2 * t.current) // yumuşak başla, yumuşak bitir
    const s = start.current
    const shift = new THREE.Vector3(to[0] - s.tgt.x, 0, to[1] - s.tgt.z).multiplyScalar(k)
    camera.position.copy(s.pos).add(shift)
    if (controls) {
      controls.target.copy(s.tgt).add(shift)
      controls.update()
    }
    camera.zoom = s.zoom * (1 + (zoomBy - 1) * k)
    camera.updateProjectionMatrix()
    if (t.current > 0.65 && !faded.current) {
      faded.current = true
      onFade()
    }
    if (t.current >= 1) {
      done.current = true
      onDone()
    }
  })
  return null
}

/**
 * Kamera sınırı: hedef nokta kutunun içinde kalır, uzaklaşma "sığdır" düzeyinin altına inmez.
 * Böylece sahnenin kenarı ve boşluk kadraja girmez.
 */
export function Bounds({
  x,
  z,
  zoomIn = 4,
  zoomOut = 1,
  fixed = false,
}: {
  x: [number, number]
  z: [number, number]
  zoomIn?: number
  zoomOut?: number
  fixed?: boolean // true: kaydırma kutusu yakınlıktan bağımsız
}) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as unknown as Controls | null
  useFrame(() => {
    if (!controls || !controls.enabled || camera.userData.settling) return
    const fit = (camera.userData.fit as number) || camera.zoom
    const zmin = fit * zoomOut
    const zmax = fit * zoomIn
    if (camera.zoom < zmin || camera.zoom > zmax) {
      camera.zoom = THREE.MathUtils.clamp(camera.zoom, zmin, zmax)
      camera.updateProjectionMatrix()
    }
    // yakınlaştıkça kaydırma alanı genişler (kenarlar yine dışarıda kalır)
    const slack = fixed ? 1 : 1 - zmin / camera.zoom
    const cx = (x[0] + x[1]) / 2
    const cz = (z[0] + z[1]) / 2
    const hx = ((x[1] - x[0]) / 2) * slack
    const hz = ((z[1] - z[0]) / 2) * slack
    const t = controls.target
    const nx = THREE.MathUtils.clamp(t.x, cx - hx, cx + hx)
    const nz = THREE.MathUtils.clamp(t.z, cz - hz, cz + hz)
    if (nx !== t.x || nz !== t.z) {
      camera.position.x += nx - t.x
      camera.position.z += nz - t.z
      t.x = nx
      t.z = nz
      controls.update()
    }
  })
  return null
}
