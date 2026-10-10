import { create } from 'zustand'
import * as E from './engine'
import { drawEvents, resolve } from './events'

type Store = {
  s: E.State
  reply: { id: E.ProducerId; text: string } | null
  showReport: boolean
  passing: boolean // ay geçiyor: sahne oynuyor, düğme kilitli
  act: (f: (s: E.State) => E.State) => void
  invite: (id: E.ProducerId) => void
  endMonth: () => void
  closeReport: () => void
  choose: (index: number, option: number) => void
  openReport: () => void
  restart: () => void
  nextYear: () => void
}

const SAVE = 'bu-topraklar-oyun'
const SAVE_V = 1
function loadGame(): E.State | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE) ?? 'null')
    if (!raw || raw.v !== SAVE_V) return null
    return { ...E.newGame(), ...raw.s } // sonradan eklenen alanlar varsayılanla dolar
  } catch {
    return null
  }
}
const saved = loadGame()

export const useGame = create<Store>((set, get) => ({
  s: saved ?? E.newGame(),
  reply: null,
  showReport: !saved, // açılışta ilk kart (kayıttan dönülünce gösterilmez)
  passing: false,
  act: (f) => set({ s: f(get().s) }),
  invite: (id) => {
    const r = E.invite(get().s, id)
    set({ s: r.state, reply: { id, text: r.reply } })
  },
  // ay biter: önce sahne birkaç saniye oynar (mevsim ve ışık değişir), sonra rapor ve olay kartları
  endMonth: () => {
    if (get().passing) return
    set({ s: drawEvents(E.endMonth(get().s)), showReport: false, reply: null, passing: true })
    setTimeout(() => set({ showReport: true, passing: false }), 2200)
  },
  choose: (index, option) => set({ s: resolve(get().s, index, option) }),
  closeReport: () => set({ s: E.seeCards(get().s), showReport: false }),
  openReport: () => set({ showReport: true }),
  restart: () => set({ s: E.newGame(), reply: null, showReport: false }),
  nextYear: () => set({ s: E.newYear(get().s), reply: null, showReport: false }),
}))

// her değişiklikte kaydet (küçük bir durum, JSON yeterli)
useGame.subscribe((st, prev) => {
  if (st.s === prev.s) return
  try {
    localStorage.setItem(SAVE, JSON.stringify({ v: SAVE_V, s: st.s }))
  } catch {
    /* gizli pencere */
  }
})

/** "Ayı bitir"e basılırsa kasa ne olur: aynı motoru kopya üzerinde çalıştırır. */
export function projectedCash(s: E.State) {
  return E.endMonth(s).cash
}
