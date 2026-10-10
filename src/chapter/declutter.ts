// Sahnedeki yazılar üst üste binmesin: balon ve etiketler ekranda çakışırsa
// sonradan gelen yukarı kayar. Balonlar önceliklidir (konuşma okunsun), etiketler onlara yer açar.
import { useCallback, useEffect, useRef, type RefObject } from 'react'

// ref → öncelik (küçük olan yerinde kalır; < 0: ekrandaki kart, hiç kaymaz). Eleman değil ref tutulur:
// sahne etiketi (Html) sonradan açılır ya da yeniden kurulur, her turda o anki eleman okunur.
const items = new Map<RefObject<HTMLElement | null>, number>()
let timer: number | null = null
const TOP_BAR = 60 // üstteki çip ve düğme şeridi (HUD)

function solve() {
  const list = [...items.entries()]
    .map(([ref, pr]) => [ref.current, pr] as const)
    .filter((e): e is readonly [HTMLElement, number] => !!e[0]?.isConnected)
    .map(([el, pr]) => {
      if (pr >= 0 && !el.style.transition) el.style.transition = 'transform 200ms ease-out, opacity 200ms'
      const off = Number(el.dataset.off || 0)
      const r = el.getBoundingClientRect()
      // geçiş sürerken ölçülen konum hedef konum değildir: o anki gerçek kaymayı geri al
      const tf = getComputedStyle(el).transform
      const cur = tf && tf !== 'none' ? new DOMMatrix(tf).m42 : 0
      return { el, pr, off, top: r.top - cur, bottom: r.bottom - cur, left: r.left, right: r.right }
    })
    .filter((x) => x.right - x.left > 0)
    .sort((a, b) => a.pr - b.pr || b.bottom - a.bottom)
  const placed: { top: number; bottom: number; left: number; right: number }[] = []
  for (const x of list) {
    if (x.pr < 0) {
      placed.push({ top: x.top, bottom: x.bottom, left: x.left, right: x.right }) // sabit engel
      continue
    }
    let off = 0
    for (let tries = 0; tries < 6; tries++) {
      const top = x.top - off
      const bottom = x.bottom - off
      const hit = placed.find((p) => x.left < p.right + 4 && x.right > p.left - 4 && top < p.bottom + 4 && bottom > p.top - 4)
      if (!hit) break
      off += bottom - hit.top + 6
    }
    if (Math.abs(off - x.off) > 1) {
      x.el.dataset.off = String(off)
      x.el.style.transform = `translateY(${-off}px)`
    }
    // kayınca üst çubuğa (çipler, düğmeler) ya da ekran dışına çıkıyorsa gizle: söylediği kartta zaten var
    const hidden = x.top - off < TOP_BAR
    x.el.style.opacity = hidden ? '0' : ''
    if (hidden) continue
    placed.push({ top: x.top - off, bottom: x.bottom - off, left: x.left, right: x.right })
  }
}

/** Elemanı düzenleyiciye kaydeder; eleman sonradan açılsa ya da değişse de izler. priority < 0: sabit kart. */
export function useDeclutter(ref: RefObject<HTMLElement | null>, priority: number) {
  useEffect(() => {
    items.set(ref, priority)
    if (timer === null) timer = window.setInterval(solve, 150)
    return () => {
      items.delete(ref)
      if (!items.size && timer !== null) {
        clearInterval(timer)
        timer = null
      }
    }
  }, [ref, priority])
}

/**
 * Sahne etiketi (Html) için ref: eski etiket kökü bir mikro görev sonra sökülür (scene/Html.tsx) ve
 * düz ref'i yeni kökün elemanı yerleştikten sonra boşaltırdı. Bu ref yalnız kendi elemanı sökülünce boşalır.
 */
export function useLabelRef() {
  const ref = useRef<HTMLDivElement | null>(null)
  const set = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    ref.current = el
    return () => {
      if (ref.current === el) ref.current = null
    }
  }, [])
  return [ref, set] as const
}
