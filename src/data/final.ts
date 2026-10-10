// Faz 5: bölge hedefi ve final. Her bölgeden en az bir ilde kooperatif (merkez ya da şube) olunca final açılır.
// Harita tamamen doldurulabilir, zorunlu değil (Plan v3 "bitti" tanımı 4).
import provinces from './provinces.json'
import { REGION_NAMES } from '../scene/TurkeyMap'

const REGION_OF: Record<string, string> = Object.fromEntries((provinces as { name: string; region: string }[]).map((p) => [p.name, p.region]))
export const MERKEZ = 'Aydın'
export const regionOf = (il: string) => REGION_OF[il]
export const REGIONS = Object.keys(REGION_NAMES)

/** Bölge bölge kooperatifin olduğu iller (merkez dahil). */
export function bolgeler(subeIller: string[]) {
  const iller = [MERKEZ, ...subeIller]
  return REGIONS.map((r) => ({ id: r, name: REGION_NAMES[r], iller: iller.filter((il) => regionOf(il) === r) }))
}
export const finalReady = (subeIller: string[]) => bolgeler(subeIller).every((b) => b.iller.length > 0)
