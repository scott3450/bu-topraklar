import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import { Html } from './Html'
import * as THREE from 'three'
import provinces from '../data/provinces.json'
import neighbors from '../data/neighbors.json'
import { usePalette } from './kit'
import { CropFigures } from './Crops'
import { IlBadges } from './IlBadges'
import { useSettings } from '../fx/settings'
import { YEAR_UNLOCKS } from '../data/kilit'
import { useProgress } from '../data/progress'
import type { Crop } from '../data/crops'

// İl sınırları: geoBoundaries TUR ADM1 (OpenStreetMap, CC BY-SA 2.0), tools/build_map.py ile sadeleştirildi.

export type Province = { name: string; iso: string; region: string; shapes: number[][][] }

export const REGION_NAMES: Record<string, string> = {
  marmara: 'Marmara',
  ege: 'Ege',
  akdeniz: 'Akdeniz',
  icanadolu: 'İç Anadolu',
  karadeniz: 'Karadeniz',
  doguanadolu: 'Doğu Anadolu',
  guneydogu: 'Güneydoğu Anadolu',
}

// Pazar tezgâhı: bölgeler ürünlerinin rengini taşır, aşırıya kaçmadan canlı
const REGION_COLORS: Record<string, string> = {
  marmara: '#a9c57c', // taze yeşil, ayçiçeği ve sebze
  ege: '#c8b863', // zeytin altını
  akdeniz: '#f0ab62', // narenciye turuncusu
  icanadolu: '#f1d483', // buğday sarısı
  karadeniz: '#6fb07a', // fındık ve çay yeşili
  doguanadolu: '#c59b80', // yayla toprağı
  guneydogu: '#e5b36f', // fıstık ve mercimek
}

const PLAYABLE = new Set(['ege'])
export const SEA = '#a7d3cf'

function provinceGeometry(p: Province, depth: number) {
  const shapes = p.shapes.map((ring) => {
    const s = new THREE.Shape()
    ring.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)))
    s.closePath()
    return s
  })
  const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  return g
}

export function centroid(p: Province): [number, number] {
  // en büyük parçanın köşe ortalaması; etiket için yeterli
  const ring = p.shapes.reduce((a, b) => (b.length > a.length ? b : a))
  const x = ring.reduce((s, q) => s + q[0], 0) / ring.length
  const z = ring.reduce((s, q) => s + q[1], 0) / ring.length
  return [x, z]
}

/** Bir ilin orta noktası. */
export function provinceCenter(name: string): [number, number] {
  const p = (provinces as Province[]).find((q) => q.name === name)
  return p ? centroid(p) : [0, 0]
}

/** Bir bölgenin orta noktası (illerin orta noktalarının ortalaması). */
export function regionCenter(region: string): [number, number] {
  const ps = (provinces as Province[]).filter((p) => p.region === region).map(centroid)
  return [ps.reduce((a, q) => a + q[0], 0) / ps.length, ps.reduce((a, q) => a + q[1], 0) / ps.length]
}

// Her ilin anlık yüksekliği; ürün figürleri ilinle birlikte yükselmek için buradan okur.
export const lifts: Record<string, number> = {}

const RISE = 0.24 // üstüne gelinen il
const REGION_RISE = 0.05 // oynanabilir bölgenin geri kalanı
const UP = 14 // yükselirken hızlı…
const DOWN = 3.2 // …inerken yavaş: imlecin arkasında iz kalır

function ProvinceMesh({
  p,
  hovered,
  regionHovered,
  onHover,
  onPick,
}: {
  p: Province
  hovered: boolean
  regionHovered: boolean
  onHover: (name: string | null) => void
  onPick: (name: string) => void
}) {
  const pal = usePalette()
  const playable = PLAYABLE.has(p.region)
  const depth = playable ? 0.22 : 0.12
  const geometry = useMemo(() => provinceGeometry(p, depth), [p, depth])
  const [cx, cz] = useMemo(() => centroid(p), [p])
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const colors = useMemo(() => {
    const base = new THREE.Color(REGION_COLORS[p.region])
    // her il kendi tonunda (mozaik): adına bağlı küçük aydınlık ve renk sapması, bölge yine okunur
    let h = 0
    for (const ch of p.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    base.offsetHSL(((h % 7) - 3) * 0.004, ((h >> 3) % 5 - 2) * 0.02, ((h >> 6) % 7 - 3) * 0.018)
    return {
      base,
      lit: base.clone().lerp(new THREE.Color('#fff6e4'), 0.28),
      soft: base.clone().lerp(new THREE.Color('#fff6e4'), 0.12),
      accent: new THREE.Color(pal.accent),
      accentLit: new THREE.Color(pal.accent).lerp(new THREE.Color('#fff6e4'), 0.3),
    }
  }, [p.region, pal.accent])

  useFrame((_, dt) => {
    const g = group.current
    const m = mat.current
    if (!g || !m) return
    const target = hovered ? RISE : regionHovered ? (playable ? REGION_RISE : REGION_RISE * 0.6) : 0
    const y = g.position.y
    g.position.y = THREE.MathUtils.damp(y, target, target > y ? UP : DOWN, dt)
    lifts[p.name] = g.position.y
    const want =
      hovered && playable
        ? colors.accentLit
        : regionHovered && playable
          ? colors.accent
          : hovered
            ? colors.lit
            : regionHovered
              ? colors.soft
              : colors.base
    m.color.lerp(want, 1 - Math.exp(-(target > y ? UP : DOWN) * dt))
  })

  return (
    <group ref={group}>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(p.name)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(null)
          document.body.style.cursor = 'default'
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta > 8) return // haritayı kaydırmaktı (parmak ya da fare sürükledi), ile girme
          onPick(p.name)
        }}
      >
        <meshStandardMaterial ref={mat} color={REGION_COLORS[p.region]} roughness={0.9} />
        <Edges color={pal.groundSide} threshold={30} />
      </mesh>
      {hovered && (
        <Html position={[cx, depth + 0.2, cz]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              whiteSpace: 'nowrap',
              padding: '5px 10px',
              borderRadius: 8,
              background: pal.ui.card,
              color: pal.ui.text,
              fontFamily: pal.ui.font,
              fontSize: 13,
              boxShadow: '0 4px 14px rgba(60,40,20,0.15)',
              animation: 'etiket 260ms ease-out 140ms both',
            }}
          >
            <b>{p.name}</b>
            <span style={{ color: pal.ui.muted }}> · {REGION_NAMES[p.region]}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

// Haritanın üstünde imleci izleyen sıcak lamba.
function CursorLamp({ at }: { at: React.RefObject<THREE.Vector3 | null> }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame((_, dt) => {
    const l = light.current
    if (!l) return
    const p = at.current
    const on = p !== null
    if (p) {
      l.position.x = THREE.MathUtils.damp(l.position.x, p.x, 10, dt)
      l.position.z = THREE.MathUtils.damp(l.position.z, p.z, 10, dt)
    }
    l.intensity = THREE.MathUtils.damp(l.intensity, on ? 9 : 0, 6, dt)
  })
  return <pointLight ref={light} position={[0, 1.1, 0]} color="#ffcf8a" intensity={0} distance={3.5} decay={2} />
}

// Komşu ülkeler: Natural Earth (kamu malı). Soluk, tıklanmaz; harita boşlukta yüzmesin.
type Country = { name: string; a3: string; shapes: number[][][]; label: number[] | null }
const LABELED = new Set(['GRC', 'BGR', 'GEO', 'ARM', 'AZE', 'IRN', 'IRQ', 'SYR', 'CYP', 'ROU', 'UKR', 'RUS'])
const SEAS: { name: string; at: [number, number] }[] = [
  { name: 'Karadeniz', at: [0.5, -4.1] },
  { name: 'Akdeniz', at: [-1.5, 3.8] },
  { name: 'Ege Denizi', at: [-8.3, 0.4] },
]

function Neighbors() {
  const pal = usePalette()
  const geos = useMemo(
    () =>
      (neighbors as Country[]).map((c) => {
        const shapes = c.shapes.map((ring) => {
          const sh = new THREE.Shape()
          ring.forEach(([x, z], i) => (i === 0 ? sh.moveTo(x, -z) : sh.lineTo(x, -z)))
          sh.closePath()
          return sh
        })
        const g = new THREE.ExtrudeGeometry(shapes, { depth: 0.05, bevelEnabled: false })
        g.rotateX(-Math.PI / 2)
        const ring = c.shapes.reduce((a, b) => (b.length > a.length ? b : a))
        const label = c.label ?? [ring.reduce((s, q) => s + q[0], 0) / ring.length, ring.reduce((s, q) => s + q[1], 0) / ring.length]
        return { c, g, label }
      }),
    [],
  )
  const tag = (text: string, italic = false) => (
    <div
      style={{
        whiteSpace: 'nowrap',
        fontFamily: pal.ui.font,
        fontSize: italic ? 13 : 11,
        letterSpacing: italic ? 1 : 1.5,
        fontStyle: italic ? 'italic' : 'normal',
        color: italic ? '#3d7f7b' : '#8a7d68',
        textTransform: italic ? 'none' : 'uppercase',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {text}
    </div>
  )
  return (
    <group>
      {geos.map(({ c, g }) => (
        <mesh key={c.a3} geometry={g} receiveShadow raycast={() => null}>
          <meshStandardMaterial color="#eee5d1" roughness={1} />
        </mesh>
      ))}
      {geos
        .filter(({ c }) => LABELED.has(c.a3))
        .map(({ c, label }) => (
          <Html key={c.a3} position={[label[0], 0.1, label[1]]} center zIndexRange={[0, 0]}>
            {tag(c.name)}
          </Html>
        ))}
      {SEAS.map((s) => (
        <Html key={s.name} position={[s.at[0], 0.02, s.at[1]]} center zIndexRange={[0, 0]}>
          {tag(s.name, true)}
        </Html>
      ))}
    </group>
  )
}

/** Kampanyanın Aydın'da olduğunu gösteren kalıcı etiket. */
function CampaignTag({ start, onPick }: { start: boolean; onPick: (r: string) => void }) {
  const pal = usePalette()
  const calm = useSettings((s) => s.calm)
  const ay = (provinces as Province[]).find((p) => p.name === 'Aydın')!
  const [x, z] = centroid(ay)
  return (
    <Html position={[x, 0.5, z + 0.25]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
      <div
        onClick={() => onPick('Aydın')}
        style={{
          whiteSpace: 'nowrap',
          padding: start ? '6px 12px' : '3px 8px',
          borderRadius: 999,
          background: pal.accent,
          color: '#fffaf1',
          fontFamily: pal.ui.font,
          fontSize: start ? 13 : 11,
          fontWeight: 800,
          boxShadow: '0 3px 10px rgba(30,60,60,0.25)',
          cursor: 'pointer',
          animation: start && !calm ? 'nabiz 1.6s ease-in-out infinite' : undefined,
        }}
      >
        {start ? 'Buradan başla ›' : 'Aydın · Kampanya'}
      </div>
    </Html>
  )
}

/** Serbest oyunda son açılan il: "Yeni" etiketi, tıklayınca o ile gider. */
function NewIlTag({ onPick }: { onPick: (r: string) => void }) {
  const pal = usePalette()
  const years = useProgress((g) => g.years)
  const u = YEAR_UNLOCKS[Math.min(years, YEAR_UNLOCKS.length) - 1]
  const pr = u && (provinces as Province[]).find((p) => p.name === u.il)
  if (!pr) return null
  const [x, z] = centroid(pr)
  return (
    <Html position={[x, 0.6, z + 0.25]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
      <div onClick={() => onPick(u.il)} style={{ whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: 999, background: '#e8c23a', color: '#3a2a1c', fontFamily: pal.ui.font, fontSize: 12, fontWeight: 800, boxShadow: '0 3px 10px rgba(30,60,60,0.25)', cursor: 'pointer' }}>
        Yeni · {u.il}
      </div>
    </Html>
  )
}

/** Aydın'da bitirilen bölüm kadar kademeli yükselen turkuaz bayrak. */
function AydinFlag({ done }: { done: number }) {
  const pal = usePalette()
  const ay = (provinces as Province[]).find((p) => p.name === 'Aydın')!
  const [x, z] = centroid(ay)
  const h = 0.35 + done * 0.09
  return (
    <group position={[x + 0.35, 0.22, z - 0.15]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, h, 6]} />
        <meshStandardMaterial color="#5a4632" />
      </mesh>
      <mesh position={[0.11, h - 0.07, 0]}>
        <boxGeometry args={[0.22, 0.13, 0.01]} />
        <meshStandardMaterial color={pal.accent} />
      </mesh>
    </group>
  )
}

export function TurkeyMap({
  onPick,
  selected,
  onSelect,
  done = 0,
  doneList = [],
}: {
  onPick: (region: string) => void
  selected: Crop | null
  onSelect: (c: Crop) => void
  done?: number // Aydın'da bitirilen bölüm sayısı
  doneList?: number[]
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const hoveredRegion = (provinces as Province[]).find((p) => p.name === hovered)?.region
  const cursor = useRef<THREE.Vector3 | null>(null)

  return (
    <group
      onPointerMove={(e) => (cursor.current = e.point.clone())}
      onPointerLeave={() => (cursor.current = null)}
    >
      <CursorLamp at={cursor} />
      <Neighbors />
      {/* deniz */}
      <mesh position={[0, -0.01, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={SEA} roughness={1} />
      </mesh>
      {(provinces as Province[]).map((p) => (
        <ProvinceMesh
          key={p.iso}
          p={p}
          hovered={hovered === p.name}
          regionHovered={hoveredRegion === p.region}
          onHover={setHovered}
          onPick={onPick}
        />
      ))}
      <CropFigures selected={selected} onSelect={onSelect} />
      <IlBadges done={doneList} />
      {done > 0 && <AydinFlag done={done} />}
      <CampaignTag start={done === 0} onPick={onPick} />
      <NewIlTag onPick={onPick} />
    </group>
  )
}
