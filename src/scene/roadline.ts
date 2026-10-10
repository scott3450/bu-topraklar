import { EGE_VALLEY, extendLine } from './landgen'

// Aydın vadisinin yolunda x'e göre z (direkler, kamyonlar için)
const ROAD = extendLine(EGE_VALLEY.road)
export function roadZAt(x: number, line: [number, number][] = ROAD) {
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i]
    const [bx, bz] = line[i + 1]
    if (x >= Math.min(ax, bx) && x <= Math.max(ax, bx)) return az + ((x - ax) / (bx - ax)) * (bz - az)
  }
  return line[0]?.[1] ?? 0
}
