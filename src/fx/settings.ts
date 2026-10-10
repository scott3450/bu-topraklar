import { create } from 'zustand'

// Grafik kalitesi ve hareket ayarı: yavaş cihazda oyunu bozmak yerine ayarı düşür.
export type Quality = 'yuksek' | 'orta' | 'dusuk'
const KEY = 'bu-topraklar-ayar'

type S = { quality: Quality; calm: boolean; set: (p: Partial<{ quality: Quality; calm: boolean }>) => void }

function load(): { quality: Quality; calm: boolean } {
  const narrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 720px), (max-height: 500px), (pointer: coarse)').matches // telefon ve tablet: orta
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (v && ['yuksek', 'orta', 'dusuk'].includes(v.quality)) return { quality: v.quality, calm: !!v.calm }
  } catch {
    /* yok say */
  }
  return { quality: narrow ? 'orta' : 'yuksek', calm: false }
}

export const useSettings = create<S>((set, get) => ({
  ...load(),
  set: (p) => {
    const next = { quality: p.quality ?? get().quality, calm: p.calm ?? get().calm }
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* yok say */
    }
    set(next)
  },
}))

/** Kaliteye göre sayılar. */
export function tier(q: Quality) {
  return {
    shadows: q !== 'dusuk',
    shadowMap: q === 'yuksek' ? 2048 : 1024,
    dpr: (q === 'yuksek' ? [1, 2] : q === 'orta' ? [1, 1.5] : [1, 1]) as [number, number],
    outerSeg: q === 'yuksek' ? 1.1 : q === 'orta' ? 0.8 : 0.5,
    outerTrees: q === 'yuksek' ? 1 : q === 'orta' ? 1.5 : 2.4, // dış orman adım çarpanı (büyük = seyrek)
    ambience: q !== 'dusuk',
    clouds: q === 'yuksek',
  }
}
