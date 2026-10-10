// Bölge manzaraları: her bölge için arazi tarifi, toprak renkleri ve kısa iklim bilgisi.
// Ege oyunun kendisi (Valley); diğerleri şimdilik keşif.
import type { Land } from '../theme/palettes'
import type { Recipe } from './landgen'

export type Region = {
  id: string
  name: string
  climate: string
  background: string
  land: Land
  recipe: Recipe
  forest: { minH: number; density: number; kind: 'pine' | 'round' }
  villages: { x: number; z: number; n: number }[]
  animals?: { x: number; z: number; n: number }[]
}

const empty = { x: 0, z: 0, w: 0, d: 0, soft: 0.1 }

export const REGIONS: Record<string, Region> = {
  karadeniz: {
    id: 'karadeniz',
    name: 'Karadeniz',
    climate: 'Her mevsim yağışlı ve ılıman. Dağlar denize dik iner; tarım yamaçlarda, teraslarda yapılır.',
    background: '#e3e8dc',
    land: { grass: '#7fae58', dry: '#8fb25e', scrub: '#4f7d44', road: '#a8916c', ground: '#86ad5e', bank: '#6f9e52', crop: '#9cbc62' },
    recipe: {
      size: [34, 28],
      seed: 21,
      undulation: 0.9,
      hills: [
        { x: -9, z: -6, rx: 10, rz: 8, h: 4.2 },
        { x: 8, z: -7, rx: 11, rz: 7, h: 4.6 },
        { x: 0, z: -13, rx: 16, rz: 4, h: 3 },
        { x: -14, z: 4, rx: 5, rz: 6, h: 2.6 },
        { x: 14, z: 3, rx: 5, rz: 6, h: 2.4 },
      ],
      backRise: 1.2,
      stream: [[1, -14.2], [0.4, -8], [-0.6, -2], [0.4, 3], [0.2, 8]],
      streamDepth: 0.5,
      road: [[-17, 7], [-8, 6.6], [0, 6.9], [8, 6.5], [17, 7.1]],
      flat: [{ x: 0, z: 6.8, w: 34, d: 1.4, soft: 1 }],
      grove: empty,
      parcels: [
        { x: -9, z: -1, w: 5, d: 4, kind: 'cay' },
        { x: -4.5, z: -4.5, w: 4, d: 3.5, kind: 'cay' },
        { x: 6, z: -2, w: 5, d: 3.5, kind: 'cay' },
        { x: 10.5, z: -5, w: 4, d: 3, kind: 'cay' },
        { x: -12.5, z: 3.5, w: 3.5, d: 3, kind: 'findik' },
        { x: 12, z: 2.6, w: 3.6, d: 3, kind: 'findik' },
        { x: -3.5, z: 2.4, w: 4, d: 2.6, kind: 'findik' },
        { x: 4.2, z: 3, w: 3.4, d: 2.4, kind: 'findik' },
      ],
      groves: [],
      sea: { z: 9, level: -0.35 },
      terrace: { min: 0.9, step: 0.38 },
    },
    forest: { minH: 3.2, density: 0.5, kind: 'pine' },
    villages: [{ x: -6, z: 5.6, n: 4 }, { x: 7, z: 5.2, n: 3 }],
  },

  icanadolu: {
    id: 'icanadolu',
    name: 'İç Anadolu',
    climate: 'Karasal iklim: yazlar sıcak ve kurak, kışlar soğuk ve karlı. Geniş düz ovalarda kuru tarım; tarla bir yıl ekilir, bir yıl nadasa bırakılır.',
    background: '#efe6d2',
    land: { grass: '#c9bd84', dry: '#d8c792', scrub: '#9a9a68', road: '#b39468', ground: '#d6c895', bank: '#9db071', crop: '#e0c46e' },
    recipe: {
      size: [34, 28],
      seed: 33,
      undulation: 0.18,
      hills: [
        { x: -12, z: -12, rx: 9, rz: 3, h: 1.4 },
        { x: 10, z: -12.5, rx: 10, rz: 2.5, h: 1.1 },
      ],
      backRise: 0.3,
      stream: [],
      streamDepth: 0,
      road: [[-17, 1.5], [-6, 1.8], [4, 1.2], [17, 1.6]],
      flat: [],
      grove: empty,
      parcels: Array.from({ length: 30 }, (_, i) => {
        const col = i % 6
        const row = Math.floor(i / 6)
        const kinds = ['ekin', 'nadas', 'ekin', 'ekin', 'nadas', 'yonca'] as const
        return {
          x: -13.5 + col * 5.4 + (row % 2) * 0.8,
          z: -9 + row * 4.6,
          w: 4.8,
          d: 3.9,
          kind: kinds[(i * 7) % 6],
        }
      }),
      groves: [],
    },
    forest: { minH: 99, density: 0, kind: 'round' },
    villages: [{ x: -2, z: 3.6, n: 6 }],
  },

  akdeniz: {
    id: 'akdeniz',
    name: 'Akdeniz',
    climate: 'Yazlar sıcak ve kurak, kışlar ılık ve yağışlı. Toroslar ile deniz arasındaki kıyı ovalarında kış boyu seracılık ve narenciye.',
    background: '#efe7d6',
    land: { grass: '#a9b670', dry: '#cdbb84', scrub: '#6c8a4d', road: '#b8956a', ground: '#c4bd88', bank: '#87a964', crop: '#c9bd78' },
    recipe: {
      size: [34, 28],
      seed: 44,
      undulation: 0.35,
      hills: [
        { x: -8, z: -11, rx: 12, rz: 5, h: 5 },
        { x: 9, z: -11, rx: 11, rz: 5, h: 5.4 },
        { x: 0, z: -13, rx: 6, rz: 3, h: 3.5 },
      ],
      backRise: 0.8,
      stream: [[2, -14.2], [1.2, -6], [-0.4, 0], [0.4, 8]],
      streamDepth: 0.4,
      road: [[-17, 4.6], [-6, 4.2], [4, 4.8], [17, 4.4]],
      flat: [{ x: 0, z: 1.5, w: 30, d: 10, soft: 2 }],
      grove: empty,
      parcels: [
        { x: -11, z: 1, w: 5, d: 3.4, kind: 'sera' },
        { x: -5, z: 2, w: 4.4, d: 3, kind: 'sera' },
        { x: 5.2, z: 1.2, w: 5, d: 3.4, kind: 'sera' },
        { x: 11.5, z: 2.2, w: 4, d: 3, kind: 'sera' },
        { x: -8.4, z: -3.2, w: 5, d: 3, kind: 'narenciye' },
        { x: 7.8, z: -3, w: 5.4, d: 3, kind: 'narenciye' },
        { x: -1.8, z: -2.6, w: 3.4, d: 2.6, kind: 'narenciye' },
      ],
      groves: [],
      sea: { z: 8.5, level: -0.3 },
    },
    forest: { minH: 2.2, density: 0.55, kind: 'pine' },
    villages: [{ x: 0, z: 6, n: 5 }],
  },

  marmara: {
    id: 'marmara',
    name: 'Marmara',
    climate: 'Geçiş iklimi: Karadeniz, Akdeniz ve karasal iklim burada buluşur. Yumuşak tepeler ve verimli ovalar; Trakya\'da ayçiçeği ve buğday.',
    background: '#ebe9d8',
    land: { grass: '#a5bb6c', dry: '#c7c188', scrub: '#6f8c50', road: '#b39468', ground: '#bcc184', bank: '#88aa62', crop: '#d9c470' },
    recipe: {
      size: [34, 28],
      seed: 55,
      undulation: 0.5,
      hills: [
        { x: -10, z: -10, rx: 8, rz: 4, h: 1.6 },
        { x: 9, z: -9, rx: 7, rz: 4, h: 1.4 },
      ],
      backRise: 0.4,
      stream: [[-6, -14.2], [-4, -6], [-1, 1], [0.5, 9]],
      streamDepth: 0.35,
      road: [[-17, 5], [-4, 5.4], [6, 4.8], [17, 5.2]],
      flat: [],
      grove: empty,
      parcels: [
        { x: -12, z: -2, w: 5, d: 4, kind: 'aycicegi' },
        { x: -6.6, z: -3.4, w: 4.4, d: 3.6, kind: 'ekin' },
        { x: 4, z: -3, w: 5, d: 4, kind: 'aycicegi' },
        { x: 10, z: -2.4, w: 5, d: 3.6, kind: 'ekin' },
        { x: -9, z: 2.4, w: 5, d: 3, kind: 'ekin' },
        { x: 7, z: 2, w: 5, d: 3, kind: 'aycicegi' },
        { x: 12.6, z: 2.8, w: 3.4, d: 3, kind: 'yonca' },
        { x: 2.4, z: 2.6, w: 3, d: 2.6, kind: 'nadas' },
      ],
      groves: [],
      sea: { z: 9, level: -0.3 },
    },
    forest: { minH: 1.4, density: 0.35, kind: 'round' },
    villages: [{ x: -2, z: 6, n: 4 }],
  },

  doguanadolu: {
    id: 'doguanadolu',
    name: 'Doğu Anadolu',
    climate: 'Türkiye\'nin en yüksek ve en soğuk bölgesi; kışlar uzun ve sert. Yaz aylarında yaylalarda hayvancılık.',
    background: '#e6e7e1',
    land: { grass: '#98b36a', dry: '#b5b07f', scrub: '#7d8a5c', road: '#a58e6c', ground: '#a9b67a', bank: '#7fa560', crop: '#b9b878' },
    recipe: {
      size: [34, 28],
      seed: 66,
      undulation: 0.45,
      hills: [
        { x: -11, z: -9, rx: 8, rz: 6, h: 5.6 },
        { x: 9, z: -10, rx: 9, rz: 5, h: 6.4 },
        { x: -14, z: 5, rx: 5, rz: 7, h: 3.6 },
        { x: 14, z: 5, rx: 5, rz: 6, h: 3.4 },
      ],
      backRise: 1,
      stream: [[-2, -14.2], [-1, -6], [1, 0], [0, 6], [1.5, 14.2]],
      streamDepth: 0.45,
      road: [[-17, 2], [-6, 2.4], [6, 1.8], [17, 2.2]],
      flat: [{ x: 0, z: 2, w: 20, d: 12, soft: 3 }],
      grove: empty,
      parcels: [
        { x: -5.5, z: 0, w: 6, d: 5, kind: 'mera' },
        { x: 5.5, z: 0.4, w: 6, d: 5, kind: 'mera' },
        { x: -4, z: 6.6, w: 5, d: 3, kind: 'yonca' },
        { x: 5, z: 6.6, w: 5, d: 3, kind: 'ekin' },
      ],
      groves: [],
      snowLine: 3.6,
    },
    forest: { minH: 99, density: 0, kind: 'round' },
    villages: [{ x: 0, z: 3.4, n: 4 }],
    animals: [{ x: -5.5, z: 0, n: 9 }, { x: 5.5, z: 0.4, n: 7 }],
  },

  guneydogu: {
    id: 'guneydogu',
    name: 'Güneydoğu Anadolu',
    climate: 'Yazlar çok sıcak ve kurak. Harran gibi düz ovalar GAP barajlarıyla sulanınca pamuk merkezi oldu; kurak tepelerde Antep fıstığı.',
    background: '#f1e5cf',
    land: { grass: '#c7b57a', dry: '#dcc690', scrub: '#a29a66', road: '#bc9a6b', ground: '#d8c28c', bank: '#94ac66', crop: '#dcc46c' },
    recipe: {
      size: [34, 28],
      seed: 77,
      undulation: 0.15,
      hills: [
        { x: -11, z: -10, rx: 7, rz: 4, h: 1.5 },
        { x: 11, z: -11, rx: 7, rz: 3.5, h: 1.3 },
      ],
      backRise: 0.3,
      // sulama kanalı: dümdüz
      stream: [[-17.2, -1], [17.2, -1]],
      streamDepth: 0.3,
      road: [[-17, 4], [17, 4.2]],
      flat: [],
      grove: empty,
      parcels: [
        ...Array.from({ length: 12 }, (_, i) => ({
          x: -14 + (i % 6) * 5.6,
          z: i < 6 ? 2 : 8,
          w: 5,
          d: 4,
          kind: (i % 3 === 1 ? 'ekin' : 'pamuk') as 'ekin' | 'pamuk',
        })),
        { x: -11, z: -6, w: 6, d: 4, kind: 'fistik' },
        { x: 10, z: -6.5, w: 6, d: 4, kind: 'fistik' },
      ],
      groves: [],
    },
    forest: { minH: 99, density: 0, kind: 'round' },
    villages: [{ x: 0, z: -4.5, n: 5 }],
  },
}
