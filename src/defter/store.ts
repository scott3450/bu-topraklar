import { create } from 'zustand'

const KEY = 'bu-topraklar-defter'
const onScreen = new Map<string, number>() // terim ekranda kaç yerde görünüyor
function load(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

type S = {
  seen: string[] // Defter'e girmiş terimler, karşılaşma sırasıyla
  open: { id: string; auto: boolean } | null // şu an açık terim kartı (tek seferde bir tane)
  queue: string[] // kart açıkken ilk kez görülen terimler sırayla açılır
  meet: (id: string) => void // terim ilk kez ekrana geldi: kartı bir kez kendiliğinden aç
  show: (id: string) => void
  close: () => void
  mount: (id: string) => () => void
}

export const useDefter = create<S>((set, get) => ({
  seen: load(),
  open: null,
  queue: [],
  meet: (id) => {
    if (get().seen.includes(id)) return
    const seen = [...get().seen, id]
    try {
      localStorage.setItem(KEY, JSON.stringify(seen))
    } catch {
      /* gizli pencere */
    }
    if (get().open) set({ seen, queue: [...get().queue, id] })
    else set({ seen, open: { id, auto: true } })
  },
  show: (id) => set({ open: get().open?.id === id ? null : { id, auto: false } }),
  close: () => {
    const [next, ...later] = get().queue.filter((q) => onScreen.get(q)) // ekrandan çıkmış terim sırada beklemez
    set({ open: next ? { id: next, auto: true } : null, queue: later })
  },
  mount: (id) => {
    onScreen.set(id, (onScreen.get(id) ?? 0) + 1)
    return () => {
      onScreen.set(id, (onScreen.get(id) ?? 1) - 1)
      if (!onScreen.get(id) && get().open?.id === id) get().close()
    }
  },
}))
