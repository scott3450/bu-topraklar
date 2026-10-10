import { useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { clock, nextOf, useChapter, type ChapterDef } from './engine'

const OFFSET = [-0.5, 0, -2.2] // vadinin sahnedeki kayması (App ile aynı)
type Controls = { target: THREE.Vector3; update: () => void }

function Director({ def, step, since }: { def: ChapterDef; step: string; since: number }) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as unknown as Controls | null
  useFrame(({ clock: c }, dt) => {
    if (!controls || camera.userData.settling) return
    // karar ve sonuçta kamera kısa süre sonra oyuncuya bırakılır
    if (c.elapsedTime - since > 2.6 && (step === 'choose' || step === 'result')) return
    const shot = def.shot[step] ?? def.shot.intro
    const off = def.offset ?? [OFFSET[0], OFFSET[2]]
    const tx = shot.f[0] + off[0]
    const tz = shot.f[1] + off[1]
    const t = controls.target
    const nx = THREE.MathUtils.damp(t.x, tx, 2.2, dt)
    const nz = THREE.MathUtils.damp(t.z, tz, 2.2, dt)
    camera.position.x += nx - t.x
    camera.position.z += nz - t.z
    t.x = nx
    t.z = nz
    controls.update()
    const fit = (camera.userData.fit as number) || camera.zoom
    camera.zoom = THREE.MathUtils.damp(camera.zoom, fit * shot.z, 2, dt)
    camera.updateProjectionMatrix()
  })
  return null
}

/** Bölümü oynatır: adımları ilerletir, kamerayı yönetir, sahneyi adım ilerlemesiyle çizer. */
export function ChapterRunner({ def }: { def: ChapterDef }) {
  const { step, since, path, params, go } = useChapter()
  const [k, setK] = useState(0)
  useFrame(({ clock: c }) => {
    clock.now = c.elapsedTime
    if (since < 0) {
      go('intro', c.elapsedTime)
      return
    }
    const f = def.flow[step]
    if (f && c.elapsedTime - since > f.dur) go(nextOf(def, step, path, params)!, c.elapsedTime)
    const nk = f ? Math.min(1, (c.elapsedTime - since) / f.dur) : 1
    if (Math.abs(nk - k) > 0.01 || (nk === 1 && k !== 1)) setK(nk)
  })
  const Scene = def.Scene
  return (
    <group>
      <Director def={def} step={step} since={since} />
      <Scene step={step} k={k} path={path} params={params} />
    </group>
  )
}
