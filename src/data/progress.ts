import { create } from 'zustand'

// Serbest oyunda bitirilen yıl sayısı (yeni iller bununla açılır). Tarayıcıda saklanır.
const KEY = 'bu-topraklar-yillar'
function load() {
  try {
    return Number(localStorage.getItem(KEY) ?? 0) || 0
  } catch {
    return 0
  }
}

export const useProgress = create<{ years: number; finishYear: (y: number) => void }>((set, get) => ({
  years: load(),
  finishYear: (y) => {
    if (y <= get().years) return
    try {
      localStorage.setItem(KEY, String(y))
    } catch {
      /* gizli pencere */
    }
    set({ years: y })
  },
}))
