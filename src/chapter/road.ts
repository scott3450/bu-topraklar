import { at, height } from '../scene/Valley'
import { EGE_VALLEY, extendLine } from '../scene/landgen'

type V3 = [number, number, number]

// Vadinin yolu üstünde x'e göre konum
const ROAD = extendLine(EGE_VALLEY.road)
export function roadZ(x: number) {
  for (let i = 0; i < ROAD.length - 1; i++) {
    const [ax, az] = ROAD[i]
    const [bx, bz] = ROAD[i + 1]
    if (x >= Math.min(ax, bx) && x <= Math.max(ax, bx)) return az + ((x - ax) / (bx - ax)) * (bz - az)
  }
  return 3.6
}
export const onRoad = (x: number, dy = 0.02): V3 => [x, height(x, roadZ(x)) + dy, roadZ(x)]
export const above = (p: V3, dy: number): V3 => [p[0], p[1] + dy, p[2]]
export const FAR = 28
export { at }
