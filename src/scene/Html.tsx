// drei <Html>'in burada kullanılan kısmı (position, center, zIndexRange, style).
// drei kendi React kökünü Canvas commit'i sırasında senkron unmount ediyor; sahne değişince her
// etiket için "synchronously unmount a root" uyarısı ve ara sıra removeChild hatası veriyordu.
// Burada unmount commit bittikten sonra (mikro görev) yapılır, kap öğesi her kurulumda yenidir.
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()

type Props = {
  position: [number, number, number]
  center?: boolean
  zIndexRange?: [number, number]
  style?: CSSProperties
  children: ReactNode
}

export function Html({ position, center, zIndexRange = [16777271, 0], style, children }: Props) {
  const { gl, camera, size, events } = useThree()
  const group = useRef<THREE.Group>(null)
  const host = useRef<{ el: HTMLDivElement; root: Root } | null>(null)
  const last = useRef({ x: Infinity, y: Infinity, visible: true })
  const target = (events.connected as HTMLElement | undefined) || gl.domElement.parentNode

  useLayoutEffect(() => {
    if (!target) return
    const el = document.createElement('div')
    el.style.cssText = 'position:absolute;top:0;left:0;transform-origin:0 0;visibility:hidden;'
    target.appendChild(el)
    const h = { el, root: createRoot(el) }
    host.current = h
    last.current = { x: Infinity, y: Infinity, visible: true }
    return () => {
      if (host.current === h) host.current = null
      queueMicrotask(() => {
        h.root.unmount()
        h.el.remove()
      })
    }
  }, [target])

  useLayoutEffect(() => {
    host.current?.root.render(
      <div style={{ position: 'absolute', transform: center ? 'translate3d(-50%,-50%,0)' : 'none', ...style }}>{children}</div>,
    )
  })

  useFrame(() => {
    const h = host.current
    const g = group.current
    if (!h || !g) return
    camera.updateMatrixWorld()
    g.updateWorldMatrix(true, false)
    const obj = v1.setFromMatrixPosition(g.matrixWorld)
    const cam = v2.setFromMatrixPosition(camera.matrixWorld)
    const visible = v3.copy(obj).sub(cam).angleTo(camera.getWorldDirection(v4)) <= Math.PI / 2
    if (visible !== last.current.visible) {
      h.el.style.display = visible ? 'block' : 'none'
      last.current.visible = visible
    }
    const dist = obj.distanceTo(cam)
    const pc = camera as THREE.PerspectiveCamera
    const A = (zIndexRange[1] - zIndexRange[0]) / (pc.far - pc.near)
    h.el.style.zIndex = `${Math.round(A * dist + zIndexRange[1] - A * pc.far)}`
    obj.project(camera)
    const x = obj.x * (size.width / 2) + size.width / 2
    const y = -(obj.y * (size.height / 2)) + size.height / 2
    if (Math.abs(x - last.current.x) > 0.001 || Math.abs(y - last.current.y) > 0.001) {
      h.el.style.transform = `translate3d(${x}px,${y}px,0)`
      h.el.style.visibility = ''
      last.current.x = x
      last.current.y = y
    }
  })

  return <group ref={group} position={position} />
}
