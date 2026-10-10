import { useMemo, type ReactElement } from 'react'
import { Terrain } from './Terrain'
import { distToPolyline, extendLine, makeHeight, noise, scatterOutside, zoneWeight } from './landgen'
import { Citrus, Greenhouses, Hazel, Orchard, PineForest, RowCrop, RoundTrees, SmallOrchard } from './instanced'
import { Cow, Hive } from './Valley'
import { onPlot, PowerPole, Village } from './village'
import { Flock, SowingField, Strollers } from './life'
import { tier, useSettings } from '../fx/settings'
import type { IlPlan, Plot } from './ilgen'

type V3 = [number, number, number]

function cells(p: Plot, dx: number, dz: number, jitter = 0) {
  const out: [number, number][] = []
  for (let x = p.x - p.w / 2 + dx / 2; x < p.x + p.w / 2; x += dx)
    for (let z = p.z - p.d / 2 + dz / 2; z < p.z + p.d / 2; z += dz)
      out.push([x + (noise(x * 5, z * 5, 3) - 0.5) * jitter, z + (noise(x * 4, z * 6, 4) - 0.5) * jitter])
  return out
}

/** Bir ilin sahnesi: arazi, ürün parselleri, orman, Türk köyü. */
export function IlScene({ plan }: { plan: IlPlan }) {
  const step = tier(useSettings((s) => s.quality)).outerTrees
  const height = useMemo(() => makeHeight(plan.recipe), [plan])
  const at = (x: number, z: number, dy = 0): V3 => [x, height(x, z) + dy, z]
  const r = plan.recipe

  const groups = useMemo(() => {
    type G = { key: string; render: (pts: V3[]) => ReactElement; pts: V3[] }
    const map = new Map<string, G>()
    const add = (key: string, render: G['render'], pts: [number, number][]) => {
      const g = map.get(key) ?? { key, render, pts: [] }
      g.pts.push(...pts.map(([x, z]) => [x, height(x, z), z] as V3))
      map.set(key, g)
    }
    const pasture: [number, number][] = []
    const hives: [number, number][] = []
    for (const p of plan.plots) {
      const L = p.look
      if (L.type === 'orchard') {
        if (p.urun === 'narenciye') add('citrus', (pts) => <Citrus points={pts} />, cells(p, 0.95, 0.9, 0.12))
        else if (L.crown === 'olive') add(`olive-${p.urun}`, (pts) => <SmallOrchard points={pts} s={L.size ?? 0.75} leaf={L.leaf} />, cells(p, 1.1, 1.0, 0.2))
        else add(`orch-${p.urun}`, (pts) => <Orchard points={pts} leaf={L.leaf} fruit={L.fruit} size={L.size} />, cells(p, 1.15 * (L.size ?? 0.85), 1.05 * (L.size ?? 0.85), 0.15))
      } else if (L.type === 'rows') add(`rows-${p.urun}`, (pts) => <RowCrop points={pts} color={L.color} post={L.post} />, cells(p, 0.5, 0.42, 0.03))
      else if (L.type === 'hazel') add('hazel', (pts) => <Hazel points={pts} />, cells(p, 0.95, 0.9, 0.3))
      else if (L.type === 'greenhouse') add('gh', (pts) => <Greenhouses points={pts} />, cells(p, 1.25, 0.9))
      else if (L.type === 'pasture')
        // sürüler: seyrek noktalar, her birinde birkaç hayvan
        for (const [x, z] of cells(p, 2.3, 1.9, 0.6)) pasture.push([x, z], [x + 0.32, z + 0.12], [x - 0.18, z + 0.3], [x + 0.1, z - 0.28])
      else if (L.type === 'hives') hives.push(...cells(p, 0.7, 0.6, 0.15))
    }
    // dağ ve tepe ormanı (parsellerin ve köyün dışında)
    const forest: [number, number][] = []
    if (plan.forest.density > 0) {
      const [W, D] = r.size
      for (let x = -W / 2 + 0.6; x < W / 2 - 0.6; x += 0.85)
        for (let z = -D / 2 + 0.6; z < D / 2 - 0.6; z += 0.85) {
          const jx = x + (noise(x * 3.1, z * 3.1, 11) - 0.5) * 0.7
          const jz = z + (noise(x * 2.7, z * 2.7, 12) - 0.5) * 0.7
          const busy = r.parcels.some((pc) => zoneWeight(jx, jz, { ...pc, soft: 0.4 }) > 0) || Math.hypot(jx - plan.village[0], jz - plan.village[1]) < 4.5
          const h = height(jx, jz)
          if (!busy && h > plan.forest.minH && (!r.snowLine || h < r.snowLine) && noise(jx * 1.3, jz * 1.3, 13) > 1 - plan.forest.density) forest.push([jx, jz])
        }
      forest.push(...scatterOutside(height, r.size, 48, 1.5 * step, plan.forest.minH * 0.8, 43).filter(([x, z]) => !r.snowLine || height(x, z) < r.snowLine))
    } else {
      forest.push(...scatterOutside(height, r.size, 48, 2.2 * step, 1.8, 47).filter(([x, z]) => !r.snowLine || height(x, z) < r.snowLine))
    }
    // denizde ağaç olmaz
    const dry = r.sea ? forest.filter(([x, z]) => height(x, z) > r.sea!.level + 0.3) : forest
    return { list: [...map.values()], pasture, hives, forest: dry }
  }, [plan, height, r, step])

  // köy evleri dere yatağına ve denize girmesin
  const streamLine = useMemo(() => (r.stream.length > 1 ? extendLine(r.stream) : []), [r])
  const avoidWater = (x: number, z: number) => (streamLine.length > 0 && distToPolyline(x, z, streamLine) < 1.2) || (!!r.sea && height(x, z) < r.sea.level + 0.25)
  const pastures = plan.plots.filter((p) => p.look.type === 'pasture').slice(0, 3)
  const field = plan.plots.find((p) => p.look.type === 'field')
  const [vx, vz] = plan.village
  const poles = [-15, -10, -5, 0, 5, 10, 15]
  const roadZ = (x: number) => {
    const L = r.road
    for (let i = 0; i < L.length - 1; i++) if (x >= L[i][0] && x <= L[i + 1][0]) return L[i][1] + ((x - L[i][0]) / (L[i + 1][0] - L[i][0])) * (L[i + 1][1] - L[i][1])
    return L[0][1]
  }

  const rz = (x: number) => roadZ(x) + 0.55
  const strolls: [number, number][][] = [
    [[vx - 2, vz + 0.6], [vx, vz + 1.3], [vx + 2, vz + 0.4]],
    [[vx - 1.2, vz - 1.4], [vx + 1.6, vz - 1.1]],
    [[vx - 3, rz(vx - 3)], [vx + 4, rz(vx + 4)]],
  ]

  return (
    <group>
      <Terrain recipe={r} height={height} />
      {groups.list.map((g) => (
        <group key={g.key}>{g.render(g.pts)}</group>
      ))}
      {plan.forest.kind === 'pine' ? (
        <PineForest points={groups.forest.map(([x, z]) => at(x, z, -0.02))} />
      ) : (
        <RoundTrees points={groups.forest.map(([x, z]) => at(x, z, -0.02))} />
      )}
      {/* mera: birkaç inek; koyunlar çobanı ve köpeğiyle gezen sürüler */}
      {groups.pasture.filter((_, i) => i % 24 === 0).slice(0, 6).map(([x, z], i) => (
        <Cow key={i} position={at(x, z)} rotation={i * 1.3} />
      ))}
      {pastures.map((p, i) => (
        <Flock key={i} center={[p.x, p.z]} n={12 + (i % 2) * 4} roam={Math.min(p.w, p.d) * 0.3} at={at} seed={i + 2} shepherd={i === 0} />
      ))}
      {field && <SowingField x={field.x} z={field.z} w={field.w * 0.8} d={field.d * 0.75} at={at} />}
      <Strollers at={at} paths={strolls} />
      {groups.hives.map(([x, z], i) => (
        <Hive key={i} position={at(x, z)} />
      ))}
      <Village center={plan.village} style={plan.style} at={at} seed={plan.recipe.seed % 7 + 1} avoid={(x, z) => avoidWater(x, z) || onPlot(plan.plots, x, z)} />
      {poles.map((x) => (
        <PowerPole key={x} position={at(x, roadZ(x) + 0.85)} />
      ))}
    </group>
  )
}
