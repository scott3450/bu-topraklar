import type { ReactElement } from 'react'
import { create } from 'zustand'

// Bölüm motoru: her bölüm bir tanımdır. Adımlar kendiliğinden ilerler, 'choose' adımında oyuncu
// kaydırıcılarla karar verir, 'result' adımında sonuç ve 0–3 yıldız gösterilir.

export type Icon = 'truck' | 'bottle' | 'coins' | 'loan' | 'sack' | 'bigtruck' | 'jar' | 'lab' | 'hal' | 'contract'
export type Params = Record<string, number>
/** Kaydırıcı ya da aç/kapa (min 0, max 1, step 1). */
export type Control = { id: string; label: string; min: number; max: number; step: number; def: number; format: (v: number) => string; toggle?: boolean }
/** ok yoksa gösterge tarafsızdır: bilgi verir, doğru/yanlış söylemez. */
export type Meter = { label: string; ok?: boolean; text: string }
export type Decision = {
  question: string
  controls: Control[]
  meters: (p: Params) => Meter[] // canlı göstergeler: sınırlar, toplam kazanç değil
  next: (p: Params) => string
  roll?: () => Params // karar anında şansa bağlı değerler (ör. iyi yıl / kötü yıl)
  predict?: { question: string; answer: (p: Params) => boolean } // karardan sonra oyuncu sonucu tahmin eder
}
/** Neden-sonuç zincirinin bir halkası: "Avans %100 → kasa −193 bin → tamir ödenemedi". */
export type Link = { label: string; value: string; ok?: boolean }
export type Bar = { label: string; value: number; max: number; unit: string; on: boolean }
export type Result = {
  good: boolean // hedefe ulaşıldı mı (yıldız ≥ 2)
  stars?: number // 0–3
  caption: string // büyük rakamın üstündeki küçük yazı
  value: string // büyük rakam
  compare: string // tek satır karşılaştırma
  bars: Bar[]
  chain?: Link[]
  barsNote?: string
  lesson?: string // "Bunun adı: …"
}
export type SceneProps = { step: string; k: number; path: string | null; params: Params }
export type ChapterDef = {
  id: number
  title: string
  goal: string
  crop: string // menü kartı alt yazısı
  flow: Record<string, { next: string | ((path: string | null, params: Params) => string); dur: number }>
  month: Record<string, string>
  shot: Record<string, { f: [number, number]; z: number }>
  valleyMonth?: (step: string) => number // vadi mevsimini adım belirlesin (0 = Ekim)
  il?: string // özel il bölümü: Aydın vadisi yerine o ilin sahnesinde oynar
  offset?: [number, number] // sahnenin dünyadaki kayması (vadi: [-0.5, -2.2], il sahnesi: [0, 0])
  night?: (step: string) => number // 0 gündüz … 1 gece (ışık kısılır, maviye döner)
  lesson: string // kampanya özetinde bölümün dersi
  icon: Icon
  decision: Decision
  result: (path: string, params?: Params) => Result
  Scene: (p: SceneProps) => ReactElement
}

/** Sahne saati: sahne her karede günceller, arayüz buradan okur. */
export const clock = { now: 0 }

const KEY = 'bu-topraklar-bolumler'
const STARS_KEY = 'bu-topraklar-yildiz'
function load<T>(key: string, empty: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? empty
  } catch {
    return empty
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* gizli pencere vb. */
  }
}

type Store = {
  chapter: number | null
  step: string
  since: number
  path: string | null
  params: Params
  tries: number // bu bölümde kaçıncı deneme (1'den başlar); her yeniden deneme en yüksek yıldızı bir düşürür
  done: number[]
  stars: Record<number, number> // bölüm başına en iyi yıldız
  start: (id: number) => void
  go: (step: string, now: number) => void
  decide: (params: Params, next: string, now: number) => void
  retry: (now: number) => void
  restart: () => void
  complete: (id: number, stars: number) => void
  leave: () => void
}

export const useChapter = create<Store>((set, get) => ({
  chapter: null,
  step: 'intro',
  since: -1,
  path: null,
  params: {},
  tries: 1,
  done: load<number[]>(KEY, []),
  stars: load<Record<number, number>>(STARS_KEY, {}),
  start: (id) => set({ chapter: id, step: 'intro', since: -1, path: null, params: {}, tries: 1 }),
  go: (step, now) => set({ step, since: now }),
  decide: (params, next, now) => set({ path: 'karar', params, step: next, since: now }),
  // kararı değiştirip yeniden dene: hikâyeyi baştan izletmeden karar anına dön (son ayar korunur)
  retry: (now) => set({ path: null, step: 'choose', since: now, tries: get().tries + 1 }),
  restart: () => set({ step: 'intro', since: -1, path: null, params: {}, tries: get().tries + 1 }),
  complete: (id, stars) => {
    const prev = get().stars[id] ?? 0
    if (stars > prev) {
      const st = { ...get().stars, [id]: stars }
      save(STARS_KEY, st)
      set({ stars: st })
    }
    if (stars < 2 || get().done.includes(id)) return
    const d = [...get().done, id]
    save(KEY, d)
    set({ done: d })
  },
  leave: () => set({ chapter: null }),
}))

export const ease = (k: number) => k * k * (3 - 2 * k)
export const seg = (k: number, a: number, b: number) => Math.min(1, Math.max(0, (k - a) / (b - a)))
export const tl = (n: number) => (n < 0 ? '−₺' : '₺') + Math.abs(Math.round(n)).toLocaleString('tr-TR')

/** Akıştaki sonraki adım (yola göre dallanabilir). */
export function nextOf(def: ChapterDef, step: string, path: string | null, params: Params = {}) {
  const f = def.flow[step]
  if (!f) return null
  return typeof f.next === 'function' ? f.next(path, params) : f.next
}

/** Kontrollerin varsayılan değerleri. */
export function defaults(d: Decision): Params {
  return Object.fromEntries(d.controls.map((c) => [c.id, c.def]))
}

/** Tüm kontrol değerlerini tarayıp en iyi skoru bulur (yıldız hesabı için). */
export function bestOf(d: Decision, score: (p: Params) => number) {
  let best = -Infinity
  const walk = (i: number, p: Params) => {
    if (i === d.controls.length) {
      best = Math.max(best, score(p))
      return
    }
    const c = d.controls[i]
    for (let v = c.min; v <= c.max + 1e-9; v += c.step) walk(i + 1, { ...p, [c.id]: Math.round(v * 1000) / 1000 })
  }
  walk(0, {})
  return best
}

/** Yeniden deneme bedeli: 3 yıldız yalnız ilk denemede; sonra en fazla 2 (bölüm hep geçilebilir kalır). */
export const capStars = (stars: number, tries: number) => Math.min(stars, tries > 1 ? 2 : 3)

/** Skoru en iyiye göre yıldıza çevirir. */
export function starsFor(score: number, best: number, floor: number) {
  if (score <= floor) return 0
  const r = (score - floor) / (best - floor)
  return r >= 0.97 ? 3 : r >= 0.8 ? 2 : r >= 0.4 ? 1 : 0
}
