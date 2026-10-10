// Pazar tezgâhı canlılığı: arazi renklerine ölçülü doygunluk ve aydınlık eklenir.
// Kaynak renkler (regions.ts, season.ts) olduğu gibi kalır; ayar buradan tek yerden yapılır.
import * as THREE from 'three'
import type { Land } from './palettes'

const SAT = 0.14 // doygunluk artışı (0–1)
const LIGHT = 0.03 // aydınlık artışı

export function vivid(hex: string, sat = SAT, light = LIGHT) {
  const c = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, Math.min(1, hsl.s + sat), Math.min(0.92, hsl.l + light))
  return '#' + c.getHexString()
}

const cache = new Map<Land, Land>()
export function vividLand(land: Land): Land {
  const hit = cache.get(land)
  if (hit) return hit
  const out = Object.fromEntries(Object.entries(land).map(([k, v]) => [k, k === 'road' ? vivid(v, 0.06, 0.02) : vivid(v)])) as Land
  cache.set(land, out)
  return out
}
