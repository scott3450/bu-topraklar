import { it, expect } from 'vitest'
import { ilPlan } from '../src/scene/ilgen'
import { ILLER } from '../src/data/iller'
import { distToPolyline, extendLine } from '../src/scene/landgen'
it('hiçbir ilde parsel dere yatağına taşmaz', () => {
  let bad = 0
  let plots = 0
  for (const name of Object.keys(ILLER)) {
    const p = ilPlan(name)
    const line = p.recipe.stream.length > 1 ? extendLine(p.recipe.stream) : []
    plots += p.plots.length
    expect(p.plots.length, `${name}: parsel kalmadı`).toBeGreaterThan(2)
    if (!line.length) continue
    for (const q of p.plots)
      for (let i = 0; i <= 4; i++)
        for (let j = 0; j <= 4; j++) if (distToPolyline(q.x - q.w / 2 + (q.w * i) / 4, q.z - q.d / 2 + (q.d * j) / 4, line) < 1.2) bad++
  }
  expect(bad).toBe(0)
  expect(plots).toBeGreaterThan(81 * 5)
})

it('hiçbir ilde parsel köy evlerinin içine girmez', () => {
  for (const name of Object.keys(ILLER)) {
    const p = ilPlan(name)
    const [vx, vz] = p.village
    for (const q of p.plots) {
      const nx = Math.max(q.x - q.w / 2, Math.min(vx, q.x + q.w / 2))
      const nz = Math.max(q.z - q.d / 2, Math.min(vz, q.z + q.d / 2))
      expect(Math.hypot(nx - vx, nz - vz), `${name}`).toBeGreaterThan(2.4)
    }
  }
})

it('köy evleri birbirine, cami, okul, kahvehaneye ve tarlaya girmez', async () => {
  const { villageLayout, onPlot } = await import('../src/scene/village')
  for (const name of Object.keys(ILLER)) {
    const p = ilPlan(name)
    const [cx, cz] = p.village
    const line = p.recipe.stream.length > 1 ? extendLine(p.recipe.stream) : []
    const H = villageLayout(p.village, 6, (p.recipe.seed % 7) + 1, true, (x, z) => (line.length > 0 && distToPolyline(x, z, line) < 1.2) || onPlot(p.plots, x, z))
    for (const h of H) if (line.length) expect(distToPolyline(h.x, h.z, line), `${name} ev dere`).toBeGreaterThanOrEqual(1.2)
    for (const h of H) expect(onPlot(p.plots, h.x, h.z), `${name} ev tarlada`).toBe(false)
    expect(H.length, name).toBeGreaterThanOrEqual(4) // sığmayan ev konmaz (tarlaya, dereye girmesin)
    const fixed = [[cx - 0.2, cz - 0.2, 1.05], [cx + 1.6, cz + 1.4, 1.6], [cx + 2.9, cz + 2.7, 0.8], [cx - 2.6, cz + 2.0, 1.1], [cx + 0.6, cz + 1.0, 0.4], [cx - 0.05, cz + 1.35, 0.45], [cx + 2.6, cz - 0.6, 0.55]]
    H.forEach((h, i) => {
      for (const [x, z, r] of fixed) expect(Math.hypot(h.x - x, h.z - z), `${name} ev ${i}`).toBeGreaterThanOrEqual(r + 0.78 - 1e-6)
      H.forEach((g, j) => j > i && expect(Math.hypot(h.x - g.x, h.z - g.z), `${name} ev ${i}-${j}`).toBeGreaterThanOrEqual(1.56 - 1e-6))
    })
  }
})
