import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePalette } from './kit'
import { distTo, extendLine, makeHeight, noise, smooth, zoneWeight, type Recipe } from './landgen'
import type { Palette } from '../theme/palettes'
import { tier, useSettings } from '../fx/settings'

const SEG = 4 // iç arazi: dünya birimi başına ızgara
export const OUTER = 170 // dış arazinin kenarı (kadraja hiç girmez)

type H = ReturnType<typeof makeHeight>

function plane(w: number, d: number, seg: number, height: H, drop = 0) {
  const g = new THREE.PlaneGeometry(w, d, Math.round(w * seg), Math.round(d * seg))
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)) - drop)
  g.computeVertexNormals()
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3))
  return g
}

/** Bir yüzeyi mevsim paletine göre boyar. */
function paint(g: THREE.BufferGeometry, recipe: Recipe, p: Palette, inner: boolean) {
  const pos = g.attributes.position
  const nor = g.attributes.normal
  const col = g.attributes.color as THREE.BufferAttribute
  const L = p.land ?? { grass: p.field, dry: p.terrace, scrub: '#8d9563', road: p.road, ground: p.ground, bank: '#93a86e', crop: p.field }
  const C = (h: string) => new THREE.Color(h)
  const grass = C(L.grass), dry = C(L.dry), ground = C(L.ground), road = C(L.road), scrub = C(L.scrub)
  const roadEdge = C(L.road).lerp(C(L.grass), 0.5)
  const rock = C('#b9ad97'), bank = C(L.bank), soil = C('#b3926a'), snow = C('#f4f3ee'), sand = C('#e3d3a8')
  const KIND: Record<string, THREE.Color> = {
    ekin: C(L.crop), yonca: C('#7fa95a'), nadas: C('#ad8c63'), aycicegi: C('#e8c23a'), pamuk: C('#e9e4d4'),
    mera: C('#98b56a'), sera: C('#c9b48e'), cay: C('#5f8f45'), findik: C('#6f9850'), narenciye: C('#7f9a58'),
    fistik: C('#c4ad7e'),
  }
  const stream = extendLine(recipe.stream)
  const roadLine = extendLine(recipe.road)
  const [W, D] = recipe.size
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const h = pos.getY(i)
    const slope = 1 - nor.getY(i)
    c.copy(ground).lerp(grass, 0.45 + 0.4 * noise(x * 0.45, z * 0.45, 9))
    c.lerp(dry, smooth(0.04, 0.22, slope) * 0.8)
    c.lerp(scrub, smooth(1.1, 2.0, h) * 0.75)
    c.lerp(rock, smooth(0.3, 0.55, slope) * 0.6)
    if (inner) {
      if (recipe.grove.w > 0) c.lerp(soil, zoneWeight(x, z, recipe.grove) * 0.32)
      for (const gz of recipe.groves) c.lerp(soil, zoneWeight(x, z, gz) * 0.28)
      for (const pc of recipe.parcels) {
        const w = zoneWeight(x, z, { ...pc, soft: 0.12 })
        if (w > 0) c.lerp(pc.color ? C(pc.color) : KIND[pc.kind] ?? soil, w * 0.7)
      }
    } else if (Math.abs(x) > W / 2 - 1 || Math.abs(z) > D / 2 - 1) {
      // dışarıda parsel dokusu kendiliğinden devam eder: soluk, iri yamalar
      const px = Math.floor(x / 4.6)
      const pz = Math.floor(z / 3.8)
      const r = noise(px * 7.1, pz * 3.3, 31)
      const edge = Math.min(Math.abs(x / 4.6 - px - 0.5), Math.abs(z / 3.8 - pz - 0.5))
      if (h < 1.2 && r > 0.5 && edge < 0.44) c.lerp(r > 0.78 ? KIND.nadas : r > 0.64 ? KIND.yonca : KIND.ekin, 0.5)
    }
    if (recipe.snowLine) c.lerp(snow, smooth(recipe.snowLine, recipe.snowLine + 0.6, h) * (1 - smooth(0.45, 0.7, slope) * 0.5))
    if (recipe.sea) c.lerp(sand, 1 - smooth(recipe.sea.level + 0.05, recipe.sea.level + 0.35, h))
    const ds = stream.length > 1 ? distTo(x, z, stream) : Infinity
    c.lerp(bank, (1 - smooth(0.3, 1.4, ds)) * 0.55)
    const dr = distTo(x, z, roadLine)
    c.lerp(roadEdge, 1 - smooth(0.42, 0.62, dr))
    c.lerp(road, 1 - smooth(0.26, 0.4, dr))
    const k = 0.95 + 0.1 * noise(x * 1.7, z * 1.7, 4)
    col.setXYZ(i, c.r * k, c.g * k, c.b * k)
  }
  col.needsUpdate = true
}

/** Arazi: ayrıntılı iç alan + ufka kadar devam eden dış alan, dere ve deniz. */
export function Terrain({ recipe, height }: { recipe: Recipe; height: H }) {
  const p = usePalette()
  const [W, D] = recipe.size
  const outerSeg = tier(useSettings((s) => s.quality)).outerSeg

  const surface = useMemo(() => plane(W, D, SEG, height), [W, D, height])
  // dış alan biraz alçakta: iç alanın altında kalır, kenarda dikiş görünmez
  const outer = useMemo(() => plane(OUTER, OUTER, outerSeg, height, 0.04), [height, outerSeg])

  useMemo(() => paint(surface, recipe, p, true), [surface, recipe, p])
  useMemo(() => paint(outer, recipe, p, false), [outer, recipe, p])

  // dere: yatağı izleyen ince su şeridi (uçları dışarı uzar)
  const water = useMemo(() => {
    const line = extendLine(recipe.stream)
    if (line.length < 2) return null
    const verts: number[] = []
    const uvs: number[] = []
    const idx: number[] = []
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = line[i]
      const [bx, bz] = line[i + 1]
      const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.4))
      for (let s = 0; s < n; s++) pts.push(new THREE.Vector3(ax + ((bx - ax) * s) / n, 0, az + ((bz - az) * s) / n))
    }
    pts.push(new THREE.Vector3(...([line[line.length - 1][0], 0, line[line.length - 1][1]] as const)))
    pts.forEach((q, s) => {
      const nxt = pts[Math.min(s + 1, pts.length - 1)]
      const prv = pts[Math.max(s - 1, 0)]
      const dir = new THREE.Vector3().subVectors(nxt, prv).normalize()
      const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.32)
      // kenarlar da kıyının üstünde kalsın (ızgara aradeğerlemesi merkezden yüksek olabilir)
      const hc = height(q.x, q.z)
      const hl = height(q.x + side.x * 1.4, q.z + side.z * 1.4)
      const hr = height(q.x - side.x * 1.4, q.z - side.z * 1.4)
      const y = Math.max(hc + 0.16, Math.min(hl, hr) + 0.1)
      verts.push(q.x + side.x, y, q.z + side.z, q.x - side.x, y, q.z - side.z)
      uvs.push(s * 0.4, 0, s * 0.4, 1)
      if (s < pts.length - 1) {
        const a = s * 2
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
      }
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [recipe, height])

  // akış dokusu: açık renkli kısa çizgiler aşağı doğru kayar
  const flow = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 32
    const g = c.getContext('2d')!
    g.fillStyle = '#7fb2b4'
    g.fillRect(0, 0, 64, 32)
    g.fillStyle = 'rgba(255,255,255,0.35)'
    for (let i = 0; i < 6; i++) g.fillRect(Math.random() * 64, 4 + Math.random() * 24, 10 + Math.random() * 10, 2)
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useFrame((_, dt) => {
    flow.offset.x -= dt * 0.35
  })

  return (
    <group>
      <mesh geometry={outer} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      <mesh geometry={surface} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      {water && (
        <mesh geometry={water}>
          <meshStandardMaterial map={flow} roughness={0.35} transparent opacity={0.88} side={THREE.DoubleSide} />
        </mesh>
      )}
      {recipe.sea && (
        <mesh position={[0, recipe.sea.level, recipe.sea.z - 1 + OUTER / 4]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[OUTER, OUTER / 2]} />
          <meshStandardMaterial color="#6fa7b3" roughness={0.3} transparent opacity={0.92} />
        </mesh>
      )}
    </group>
  )
}
