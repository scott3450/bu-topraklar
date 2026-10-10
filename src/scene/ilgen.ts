// İl sahnesi üretici: il verisinden (arazi tipi, kıyı, ürünler, bölge) bir arazi tarifi ve
// üstüne konacak bahçe/tarla/köy planı çıkarır. Her il kendi adından tohumlanır.
import provinces from '../data/provinces.json'
import { ILLER } from '../data/iller'
import { URUNLER, type Look } from '../data/urunler'
import { REGIONS } from './regions'
import { distToPolyline, extendLine, type Parcel, type Recipe } from './landgen'
import type { HouseStyle } from './village'
import type { Land } from '../theme/palettes'
import { vivid, vividLand } from '../theme/vivid'

export type Plot = { x: number; z: number; w: number; d: number; urun: string; look: Look }
export type IlPlan = {
  name: string
  region: string
  recipe: Recipe
  land: Land
  background: string
  climate: string
  style: HouseStyle
  village: [number, number]
  plots: Plot[]
  forest: { minH: number; density: number; kind: 'pine' | 'round' }
}

// İklim: bölge + kıyı/iç ayrımı (genel bilgi)
const CLIMATE: Record<string, { coast: string; inland: string }> = {
  marmara: {
    coast: 'Geçiş iklimi: yazlar sıcak, kışlar ılık ve yağışlı. Verimli kıyı ovaları.',
    inland: 'Marmara\'nın iç kesimi: kışlar daha soğuk, yazlar sıcak; tepelik tarım arazileri.',
  },
  ege_ova: { coast: '', inland: 'Ege\'nin iç ovaları: Akdeniz iklimi içeri sokulur; yazlar sıcak ve kurak, kışlar ılık ve yağışlı.' },
  akdeniz_ova: { coast: '', inland: 'Çukurova\'nın iç kesimi: yazlar çok sıcak, kışlar ılık; sulanan verimli ovalar.' },
  ege: {
    coast: 'Akdeniz iklimi: yazlar sıcak ve kurak, kışlar ılık ve yağışlı. Dağlar denize dik uzanır, ovalar içeri girer.',
    inland: 'Ege\'nin iç yaylaları: kışlar soğuk ve karlı, yazlar sıcak ve kurak; karasala yakın.',
  },
  akdeniz: {
    coast: 'Yazlar sıcak ve kurak, kışlar ılık ve yağışlı. Toroslar ile deniz arasındaki ovalarda kış boyu tarım.',
    inland: 'Toros yaylaları ve göller bölgesi: kışlar soğuk ve karlı, yazlar kurak; meyvecilik güçlü.',
  },
  icanadolu: {
    coast: '',
    inland: 'Karasal iklim: yazlar sıcak ve kurak, kışlar soğuk ve karlı. Geniş ovalarda kuru tarım ve nadas.',
  },
  karadeniz: {
    coast: 'Her mevsim yağışlı ve ılıman. Dağlar denize dik iner; tarım yamaçlarda ve teraslarda.',
    inland: 'Karadeniz\'in iç kesimi: daha az yağış, daha sert kış; vadilerde meyve ve tahıl.',
  },
  doguanadolu: {
    coast: '',
    inland: 'Türkiye\'nin en yüksek ve en soğuk bölgesi; kışlar uzun ve sert. Yaz aylarında yaylalarda hayvancılık.',
  },
  guneydogu: {
    coast: '',
    inland: 'Yazlar çok sıcak ve kurak, kışlar ılık. GAP sulamasıyla ovalar canlandı; kurak tepelerde fıstık ve bağ.',
  },
}

const regionOf = new Map((provinces as { name: string; region: string }[]).map((p) => [p.name, p.region]))

function rng(seedText: string) {
  let h = 2166136261
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const FIELD_SOIL: Record<string, string> = { orchard: '#b8a070', rows: '#a88a62', hazel: '#8fa866', greenhouse: '#c9b48e', pasture: '#98b56a', hives: '#a9b67a' }

export function ilPlan(name: string): IlPlan {
  const il = ILLER[name]
  const region = regionOf.get(name) ?? 'icanadolu'
  const R = REGIONS[region] ?? REGIONS.icanadolu
  const r = rng(name)
  const W = 34
  const D = 28

  // arazi
  const hills: Recipe['hills'] = []
  const big = il.relief === 'd' ? 4.2 : il.relief === 'y' ? 2.4 : il.relief === 't' ? 1.7 : 1.0
  const n = il.relief === 'o' ? 2 : 3
  for (let i = 0; i < n; i++) {
    const side = i === 0 ? -1 : i === 1 ? 1 : r() < 0.5 ? -1 : 1
    hills.push({ x: side * (6 + r() * 8), z: -8 - r() * 5, rx: 6 + r() * 5, rz: 4 + r() * 3, h: big * (0.75 + r() * 0.4) })
  }
  if (il.relief === 'd') hills.push({ x: (r() < 0.5 ? -1 : 1) * 14, z: 2, rx: 5, rz: 6, h: big * 0.6 })
  const roadZ = 1.2 + r() * 1.2
  const road: [number, number][] = [-17.2, -9, -2, 5, 11, 17.2].map((x) => [x, roadZ + (r() - 0.5) * 1.4])
  const sx = (r() - 0.5) * 10
  const stream: [number, number][] = il.relief === 'o' && !il.coast && r() < 0.4 ? [] : [[sx, -14.2], [sx + (r() - 0.5) * 6, -6], [sx + (r() - 0.5) * 8, 2], [sx + (r() - 0.5) * 8, 14.2]]
  const village: [number, number] = [-8 + (r() - 0.5) * 3, il.coast ? 4.6 : 5.5]
  const flatW = il.relief === 'o' ? 30 : il.relief === 'y' ? 26 : 20
  const recipe: Recipe = {
    size: [W, D],
    seed: Math.floor(r() * 1000),
    undulation: il.relief === 'o' ? 0.2 : il.relief === 'y' ? 0.35 : il.relief === 't' ? 0.55 : 0.75,
    hills,
    backRise: il.relief === 'o' ? 0.3 : 0.8,
    stream,
    streamDepth: 0.4,
    road,
    flat: [
      { x: 0, z: 2.5, w: flatW, d: 11, soft: 3 },
      { x: village[0], z: village[1], w: 7, d: 5, soft: 1.5 },
      { x: 0, z: roadZ, w: 34, d: 1.2, soft: 0.8 },
    ],
    grove: { x: 0, z: 0, w: 0, d: 0, soft: 0.1 },
    parcels: [],
    groves: [],
    sea: il.coast ? { z: 9, level: -0.3 } : undefined,
    terrace: region === 'karadeniz' && il.relief === 'd' ? { min: 0.9, step: 0.38 } : undefined,
    snowLine: region === 'doguanadolu' && il.relief !== 'o' ? 3.4 : undefined,
  }

  // ürün parselleri: ilk ürün baskın
  const weights = il.products.map((_, i) => (i === 0 ? 3 : i === 1 ? 2 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  const pick = () => {
    let t = r() * total
    for (let i = 0; i < weights.length; i++) if ((t -= weights[i]) < 0) return il.products[i]
    return il.products[0]
  }
  const plots: Plot[] = []
  const streamLine = stream.length > 1 ? extendLine(stream) : []
  const STREAM_GAP = 1.3 // yatak + kıyı (oyulma ~0.95'e kadar sürer)
  // köyün içine girmesin: parselin köye en yakın noktası köy alanının dışında kalsın
  const clearOfVillage = (x: number, z: number, w: number, d: number) => {
    const nx = Math.max(x - w / 2, Math.min(village[0], x + w / 2))
    const nz = Math.max(z - d / 2, Math.min(village[1], z + d / 2))
    return Math.hypot(nx - village[0], nz - village[1]) > 2.6
  }
  const clearOfStream = (x: number, z: number, w: number, d: number) => {
    if (!streamLine.length) return true
    for (let i = 0; i <= 4; i++)
      for (let j = 0; j <= 4; j++) if (distToPolyline(x - w / 2 + (w * i) / 4, z - d / 2 + (d * j) / 4, streamLine) < STREAM_GAP) return false
    return true
  }
  const rows = il.coast ? [-4.4, -0.4, 4.4] : [-4.4, -0.4, 4.6, 8.4]
  let first = true
  for (const z of rows) {
    if (Math.abs(z - roadZ) < 1.6) continue
    for (let x = -13; x <= 13; x += 5.1) {
      const px = x + (r() - 0.5) * 0.8
      const pz = z + (r() - 0.5) * 0.6
      const w = 4.2 + r() * 0.6
      const d = 3.1 + r() * 0.4
      // dereye taşmasın: yatağa yakınsa parseli yana kaydır, olmazsa daralt, o da olmazsa atla
      const fit = [0, -1.2, 1.2].map((dx) => ({ x: px + dx, w })).concat([{ x: px, w: w * 0.6 }]).find((c) => clearOfStream(c.x, pz, c.w, d) && clearOfVillage(c.x, pz, c.w, d))
      if (!fit) continue
      const urun = first ? il.products[0] : pick() // ilk parsel her zaman baskın ürün
      first = false
      const look = URUNLER[urun].look
      plots.push({ x: fit.x, z: pz, w: fit.w, d, urun, look })
    }
  }
  recipe.parcels = plots.map<Parcel>((p) => ({
    x: p.x,
    z: p.z,
    w: p.w,
    d: p.d,
    kind: p.urun,
    color: p.look.type === 'field' ? p.look.color : FIELD_SOIL[p.look.type],
  }))

  const style: HouseStyle =
    name === 'Şanlıurfa' ? 'kumbet' : region === 'karadeniz' ? 'karadeniz' : region === 'icanadolu' || region === 'guneydogu' ? 'kerpic' : region === 'doguanadolu' ? 'tas' : 'ege'
  const forest =
    region === 'karadeniz'
      ? { minH: 1.6, density: 0.55, kind: 'pine' as const }
      : il.relief === 'd'
        ? { minH: 2.0, density: 0.45, kind: (region === 'marmara' ? 'round' : 'pine') as 'pine' | 'round' }
        : region === 'marmara'
          ? { minH: 1.3, density: 0.3, kind: 'round' as const }
          : { minH: 99, density: 0, kind: 'round' as const }

  return { name, region, recipe, land: vividLand(R.land), background: vivid(R.background, 0.08, 0.02), climate:
      (il.coast ? CLIMATE[region]?.coast : '') ||
      ((il.relief === 'o' || il.relief === 't') && CLIMATE[region + '_ova'] ? CLIMATE[region + '_ova'].inland : '') ||
      CLIMATE[region]?.inland ||
      R.climate, style, village, plots, forest }
}
