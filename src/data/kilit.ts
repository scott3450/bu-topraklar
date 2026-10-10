import komsular from './komsular.json'
import { ILLER } from './iller'
import { FAMILY_NAMES, FAMILY_OF, READY, SUBE_COST, branchProduct } from './aileler'

// Hangi ilde ne zaman oynanır: her il gezilebilir; karakterinin bölümü bitince oynanabilir olur.
// Aydın baştan açık (kampanya orada). Diğerleri ileride yıl sonlarında açılacak.
export const UNLOCKS: Record<string, number> = {
  Aydın: 0,
  İzmir: 3, // Fatma Abla, Tire: süt
  Muğla: 4, // Mehmet Amca: çam balı
  Manisa: 5, // Hasan Dayı: domates
}

/** Serbest oyunda her yıl sonunda yeni bir il açılır; her ilin kendi dersi var. */
export const YEAR_UNLOCKS: { il: string; ders: string }[] = [
  { il: 'Malatya', ders: 'Kayısının başkenti. En büyük risk ilkbahar donu: sigorta (TARSİM) ve önlem.' },
  { il: 'Rize', ders: 'Çay: devletin alım kotası ve ÇAYKUR fiyatı, özel sektörle fark.' },
  { il: 'Ordu', ders: 'Fındık: TMO alım fiyatı mı, tüccar mı? İhracatın büyük kısmı buradan.' },
  { il: 'Konya', ders: 'Buğdayın ambarı. Hasatta fiyat düşer: TMO, tüccar ya da lisanslı depo.' },
  { il: 'Antalya', ders: 'Seranın başkenti. Hal mi ihracat mı; ihracatta ilacın kalıntısı partiyi geri çevirir.' },
  { il: 'Şanlıurfa', ders: 'GAP suyu Harran\'ı pamuğun başkenti yaptı. Fazla su ise toprağı tuzlandırıyor.' },
  { il: 'Erzurum', ders: 'Kış altı ay sürer. Kaç hayvan kışa girecek, ne kadar ot stoklanacak?' },
]

export type IlDurum = { kind: 'kesif' } | { kind: 'kilitli'; chapter: number } | { kind: 'kilitli-yil'; year: number } | { kind: 'acik' }

export function ilDurum(name: string, done: number[], years = 0): IlDurum {
  const y = YEAR_UNLOCKS.findIndex((u) => u.il === name)
  if (y >= 0) return years > y ? { kind: 'acik' } : { kind: 'kilitli-yil', year: y + 1 }
  const ch = UNLOCKS[name]
  if (ch === undefined) return { kind: 'kesif' }
  if (ch === 0 || done.includes(ch)) return { kind: 'acik' }
  return { kind: 'kilitli', chapter: ch }
}

/** "Bölüm 3'ü", "Bölüm 5'i" (belirtme hâli eki). */
export const bolumu = (n: number) => `Bölüm ${n}'${({ 1: 'i', 2: 'yi', 3: 'ü', 4: 'ü', 5: 'i', 6: 'yı' } as Record<number, string>)[n] ?? 'i'}`

const NB = komsular as Record<string, string[]>
export type Sart = { label: string; ok: boolean; text: string }
export type SubeDurum =
  | { kind: 'merkez' }
  | { kind: 'sube' }
  | { kind: 'yakinda'; aile: string } // ürün ailesi henüz oynanabilir değil
  | { kind: 'uzak' } // komşusunda şube yok
  | { kind: 'acilabilir'; urun: string; sartlar: Sart[]; uygun: boolean; davet: boolean }

type Lite = { members: string[]; trust: number; cash: number; costIdx: number; subeler: { il: string }[] }

/** Bir ilde şube açılabilir mi: komşuluk (ya da yıl sonu daveti), ürün ailesi ve kooperatifin durumu. */
export function subeDurumu(il: string, s: Lite, years = 0): SubeDurum {
  if (il === 'Aydın') return { kind: 'merkez' }
  if (s.subeler.some((b) => b.il === il)) return { kind: 'sube' }
  const products = ILLER[il]?.products ?? []
  const urun = branchProduct(products)
  if (!urun) {
    const fam = products.map((p) => FAMILY_OF[p]).find((f) => f && !READY.includes(f))
    return { kind: 'yakinda', aile: fam ? FAMILY_NAMES[fam] : 'Bu ürün' }
  }
  const yakin = ['Aydın', ...s.subeler.map((b) => b.il)].some((x) => NB[x]?.includes(il))
  const davet = YEAR_UNLOCKS.slice(0, years).some((u) => u.il === il)
  if (!yakin && !davet) return { kind: 'uzak' }
  const cost = Math.round(SUBE_COST * s.costIdx)
  const sartlar: Sart[] = [
    { label: 'En az 2 üye', ok: s.members.length >= 2, text: `${s.members.length} üye` },
    { label: 'Güven en az 60', ok: s.trust >= 60, text: String(s.trust) },
    { label: `Kasada ₺${cost.toLocaleString('tr-TR')}`, ok: s.cash >= cost, text: `₺${Math.round(s.cash).toLocaleString('tr-TR')}` },
  ]
  return { kind: 'acilabilir', urun, sartlar, uygun: sartlar.every((x) => x.ok), davet: davet && !yakin }
}

/** Haritada açık halka: merkez ya da şube. */
export const isOpen = (il: string, subeler: { il: string }[]) => il === 'Aydın' || subeler.some((b) => b.il === il)

/** Yönelme hâli: "Malatya'ya", "Rize'ye", "Ordu'ya", "Konya'ya", "Muş'a", "Van'a", "Çorum'a". */
export function ilYonelme(il: string) {
  const vowels = 'aıoueiöü'
  const low = il.toLocaleLowerCase('tr')
  const last = [...low].reverse().find((c) => vowels.includes(c)) ?? 'a'
  const back = 'aıou'.includes(last)
  const endsVowel = vowels.includes(low[low.length - 1])
  return `${il}'${endsVowel ? 'y' : ''}${back ? 'a' : 'e'}`
}
