// Prosedürel arazi: yükseklik ve renk. 3D'den bağımsız, saf fonksiyonlar.
// Bir bölge "tarifi" (tepe, dere, düzleştirilen alanlar) verilir; aynı üretici başka iller için
// başka tariflerle kullanılabilir.

export type Zone = { x: number; z: number; w: number; d: number; soft: number }
export type ParcelKind =
  | 'ekin' | 'yonca' | 'nadas' | 'aycicegi' | 'pamuk' | 'mera' // yalnız renk
  | 'sera' | 'cay' | 'findik' | 'narenciye' | 'fistik' // renk + nesne
export type Parcel = { x: number; z: number; w: number; d: number; kind: ParcelKind | string; color?: string }

export type Recipe = {
  parcels: Parcel[] // ova parselleri (yalnız renk)
  groves: Zone[] // dekoratif zeytinlikler
  size: [number, number] // genişlik (x), derinlik (z)
  seed: number
  undulation: number // genel dalgalanma yüksekliği
  hills: { x: number; z: number; rx: number; rz: number; h: number }[]
  backRise: number // arkaya doğru yükselme
  stream: [number, number][] // dere çizgisi
  streamDepth: number
  road: [number, number][]
  flat: Zone[] // binaların ve tarlaların oturduğu düz alanlar
  grove: Zone // zeytinlik
  sea?: { z: number; level: number } // bu z'den sonra deniz
  terrace?: { min: number; step: number } // bu yükseklikten sonra basamaklı yamaç
  snowLine?: number // bu yükseklikten sonra kar
}

export const EGE_VALLEY: Recipe = {
  size: [34, 28],
  seed: 3,
  undulation: 0.55,
  hills: [
    { x: -6.6, z: -5.0, rx: 5.4, rz: 4.2, h: 2.0 },
    { x: 7.6, z: -6.4, rx: 3.2, rz: 2.4, h: 0.9 },
    { x: -13, z: -9.5, rx: 7, rz: 5, h: 2.8 },
    { x: 1.5, z: -12, rx: 8, rz: 3.6, h: 2.0 },
    { x: 13.5, z: -9, rx: 5.5, rz: 5, h: 2.4 },
    { x: -14, z: 4, rx: 4, rz: 6, h: 1.3 },
    { x: 14.5, z: 6.5, rx: 4, rz: 5, h: 1.0 },
  ],
  backRise: 0.7,
  stream: [[-1.5, -14.2], [0.6, -7.2], [2.4, -5.6], [4.6, -4.9], [6.8, -4.3], [9.2, -3.7], [12.5, -2.6], [17.2, -1.6]],
  streamDepth: 0.42,
  road: [[-17.2, 2.6], [-12, 3.3], [-9.2, 3.2], [-5, 3.7], [-1, 3.5], [3, 3.9], [6.5, 3.4], [9.2, 3.6], [13, 4.4], [17.2, 4.0]],
  parcels: [
    { x: -9.6, z: 7.6, w: 3.4, d: 2.6, kind: 'ekin' },
    { x: -5.8, z: 8.6, w: 3.6, d: 2.4, kind: 'yonca' },
    { x: -1.6, z: 8.4, w: 4.2, d: 2.8, kind: 'nadas' },
    { x: 2.6, z: 9.4, w: 3.2, d: 2.6, kind: 'ekin' },
    { x: 7.4, z: 8.6, w: 3.8, d: 2.2, kind: 'yonca' },
    { x: 10.6, z: 6.4, w: 2.6, d: 3, kind: 'ekin' },
    { x: -8.4, z: 11.2, w: 4, d: 2.2, kind: 'nadas' },
    { x: -2.6, z: 11.6, w: 3.4, d: 2.2, kind: 'ekin' },
    { x: 3.4, z: 12.2, w: 4.4, d: 2.2, kind: 'yonca' },
    { x: 9.6, z: 11.0, w: 3.4, d: 2.6, kind: 'nadas' },
    { x: -12.6, z: 0.4, w: 3, d: 3.2, kind: 'yonca' },
    { x: 11.6, z: 0.6, w: 3.2, d: 2.6, kind: 'ekin' },
  ],
  groves: [
    { x: -11.2, z: -3.2, w: 3.6, d: 2.6, soft: 0.5 },
    { x: 10.8, z: -5.6, w: 3, d: 2.4, soft: 0.5 },
    { x: 13.4, z: 2.6, w: 2.6, d: 2.2, soft: 0.5 },
  ],
  flat: [
    { x: -0.4, z: 0.8, w: 7.6, d: 5.8, soft: 1.6 }, // zeytinlik
    { x: 5.5, z: -2.2, w: 4.6, d: 3.4, soft: 1.2 }, // ahır
    { x: 5.5, z: 0.6, w: 4.4, d: 2.8, soft: 1.0 }, // mera
    { x: 4.5, z: 5.6, w: 4.2, d: 2.8, soft: 1.0 }, // domates tarlası
    { x: -3.1, z: 5.9, w: 3.6, d: 1.8, soft: 1.0 }, // köy evleri
    { x: 0, z: 3.6, w: 18, d: 1.2, soft: 0.8 }, // yol boyu
  ],
  grove: { x: -0.4, z: 0.8, w: 7.2, d: 5.4, soft: 0.6 },
}

// ── gürültü ────────────────────────────────────────────────
function hash(x: number, y: number, seed: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  return s - Math.floor(s)
}
export function noise(x: number, y: number, seed = 0) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, seed)
  const b = hash(xi + 1, yi, seed)
  const c = hash(xi, yi + 1, seed)
  const d = hash(xi + 1, yi + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number, seed: number) {
  let sum = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < 4; i++) {
    sum += (noise(x * f, y * f, seed + i) - 0.5) * amp
    amp *= 0.5
    f *= 2
  }
  return sum
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
export const smooth = (a: number, b: number, t: number) => {
  const k = clamp01((t - a) / (b - a))
  return k * k * (3 - 2 * k)
}

export function distToPolyline(x: number, z: number, line: [number, number][]) {
  let best = Infinity
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i]
    const [bx, bz] = line[i + 1]
    const dx = bx - ax
    const dz = bz - az
    const t = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)))
  }
  return best
}

export function zoneWeight(x: number, z: number, zn: Zone) {
  const out = Math.max(Math.abs(x - zn.x) - zn.w / 2, Math.abs(z - zn.z) - zn.d / 2)
  return 1 - smooth(0, zn.soft, out)
}

// ── yükseklik ──────────────────────────────────────────────
function baseHeight(r: Recipe, x: number, z: number) {
  let h = 0.3 + fbm(x * 0.17, z * 0.17, r.seed) * r.undulation * 2
  for (const hl of r.hills) {
    const d = Math.hypot((x - hl.x) / hl.rx, (z - hl.z) / hl.rz)
    if (d < 1) h += hl.h * (1 - d * d) * (1 - d * d)
  }
  h += r.backRise * smooth(-2, -r.size[1] / 2, z)
  // oyun alanının dışında kendiliğinden yükselen tepeler (denize doğru değil)
  const d = Math.max(Math.abs(x) / (r.size[0] / 2), Math.abs(z) / (r.size[1] / 2))
  if (d > 0.9 && !(r.sea && z > r.sea.z)) {
    h += 2.6 * smooth(0.95, 2.8, d) * (0.45 + 0.9 * noise(x * 0.05 + 3, z * 0.05 + 7, r.seed + 5))
  }
  return h
}

/** Çizginin iki ucunu dışarı uzatır: dere ve yol oyun alanının kenarında bitmesin. */
export function extendLine(line: [number, number][], by = 70): [number, number][] {
  if (line.length < 2) return line
  const ext = (a: [number, number], b: [number, number]): [number, number] => {
    const dx = a[0] - b[0]
    const dz = a[1] - b[1]
    const l = Math.hypot(dx, dz) || 1
    return [a[0] + (dx / l) * by, a[1] + (dz / l) * by]
  }
  return [ext(line[0], line[1]), ...line, ext(line[line.length - 1], line[line.length - 2])]
}

export function makeHeight(r: Recipe) {
  const stream = extendLine(r.stream)
  const targets = r.flat.map((zn) => baseHeight(r, zn.x, zn.z) * 0.6 + 0.12)
  return (x: number, z: number) => {
    let h = baseHeight(r, x, z)
    r.flat.forEach((zn, i) => {
      const w = zoneWeight(x, z, zn)
      if (w > 0) h += (targets[i] - h) * w
    })
    const ds = stream.length > 1 ? distToPolyline(x, z, stream) : Infinity
    h -= r.streamDepth * (1 - smooth(0.15, 0.95, ds))
    if (r.terrace && h > r.terrace.min) {
      const st = r.terrace.step
      const q = Math.floor(h / st) * st
      const terr = q + st * smooth(0.78, 1, (h - q) / st)
      h = h + (terr - h) * smooth(r.terrace.min, r.terrace.min + 0.4, h)
    }
    if (r.sea) h -= 1.4 * smooth(r.sea.z - 2.5, r.sea.z + 1, z)
    return h
  }
}

export const distTo = distToPolyline

/** Oyun alanının dışına dağınık orman noktaları (yüksek yerlere daha sık). */
export function scatterOutside(
  height: (x: number, z: number) => number,
  size: [number, number],
  radius: number,
  step: number,
  minH: number,
  seed: number,
): [number, number][] {
  const out: [number, number][] = []
  const [W, D] = size
  for (let x = -radius; x < radius; x += step)
    for (let z = -radius; z < radius; z += step) {
      if (Math.abs(x) < W / 2 + 0.5 && Math.abs(z) < D / 2 + 0.5) continue
      const jx = x + (noise(x * 3.1, z * 3.1, seed) - 0.5) * step * 0.8
      const jz = z + (noise(x * 2.7, z * 2.7, seed + 1) - 0.5) * step * 0.8
      const h = height(jx, jz)
      // iri ölçekte kümeler ve açıklıklar, küçük ölçekte seyreklik
      const cluster = noise(jx * 0.09, jz * 0.09, seed + 3)
      const fine = noise(jx * 0.6, jz * 0.6, seed + 2)
      const want = h > minH ? 0.35 : h > minH * 0.6 ? 0.62 : 0.85
      if (cluster > 0.42 && fine > want) out.push([jx, jz])
    }
  return out
}
