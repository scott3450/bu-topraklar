import type { Land, Palette } from './palettes'
import { vivid, vividLand } from './vivid'

// Ege'de mevsim: kış yağışlı ve yeşil, yaz kurak ve sarı. Ay 0 = Ekim.
export type Season = 'sonbahar' | 'kis' | 'ilkbahar' | 'yaz'

export function seasonOf(month: number): Season {
  const m = month % 12
  if (m <= 1 || m === 11) return 'sonbahar' // Eylül, Ekim, Kasım
  if (m <= 4) return 'kis' // Aralık–Şubat
  if (m <= 7) return 'ilkbahar' // Mart–Mayıs
  return 'yaz' // Haziran–Ağustos
}

type Over = Partial<Pick<Palette, 'background' | 'ground' | 'terrace' | 'field' | 'road'>> & {
  light: string
  lightIntensity: number
  land: Land
}

const OVER: Record<Season, Over> = {
  sonbahar: {
    light: '#ffe2bd',
    lightIntensity: 1.5,
    land: { grass: '#b7b878', dry: '#d6c08a', scrub: '#7d9155', road: '#b48e62', ground: '#cdbb8c', bank: '#8fa866', crop: '#d2bf88' },
  },
  kis: {
    background: '#e6e6df',
    ground: '#dcdccb',
    terrace: '#d2d3bd',
    field: '#b9c79a',
    road: '#c4b89e',
    light: '#e4ecf5',
    lightIntensity: 1.15,
    land: { grass: '#9dbd78', dry: '#bcc597', scrub: '#6b8a58', road: '#a88d6a', ground: '#b4bd8e', bank: '#7fa36a', crop: '#a3c27a' },
  },
  ilkbahar: {
    background: '#ecebdb',
    ground: '#e2e0c2',
    terrace: '#d8d6b0',
    field: '#a9c27e',
    light: '#fff3dc',
    lightIntensity: 1.5,
    land: { grass: '#8ebd60', dry: '#c3cd88', scrub: '#6a9150', road: '#b39468', ground: '#a8c478', bank: '#78a85a', crop: '#86b85a' },
  },
  yaz: {
    background: '#f2e5cc',
    ground: '#ecdbb8',
    terrace: '#e4cfa2',
    field: '#dcc98c',
    road: '#d4ba8c',
    light: '#ffe9c4',
    lightIntensity: 1.85,
    land: { grass: '#cbbd6c', dry: '#dfc78a', scrub: '#869356', road: '#b98f5c', ground: '#d9c58c', bank: '#8eaa62', crop: '#e2c56a' },
  },
}

export function seasonal(p: Palette, month: number): Palette & { light: string; lightIntensity: number } {
  const o = OVER[seasonOf(month)]
  return { ...p, ...o, land: vividLand(o.land), background: vivid(o.background ?? p.background, 0.08, 0.02) }
}

export const SEASON_NAMES: Record<Season, string> = {
  sonbahar: 'Sonbahar',
  kis: 'Kış',
  ilkbahar: 'İlkbahar',
  yaz: 'Yaz',
}
