import { useEffect, useState } from 'react'

/** Telefon mu? (720 px altı genişlik ya da 500 px altı yükseklik: yatay telefon) */
export function useNarrow() {
  const q = '(max-width: 720px), (max-height: 500px)' // dar ya da yatay telefon (kısa)
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setNarrow(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return narrow
}

/** Telefonda alttan açılan çekmece, geniş ekranda sağ üst kart konumu. */
export function sheet(narrow: boolean, width = 300): React.CSSProperties {
  return narrow
    ? { position: 'absolute', left: 10, right: 10, bottom: 84, maxWidth: 460, maxHeight: '55%', overflow: 'auto' }
    : { position: 'absolute', top: 76, right: 16, width, maxHeight: 'calc(100% - 180px)', overflow: 'auto' }
}

/** Yatay telefon (kısa ekran): alttaki kartlarla çakışmasın diye panel sağ yanda, üst çubuğun altında. */
export function sideSheet(): React.CSSProperties | null {
  const short = typeof window !== 'undefined' && window.innerHeight < 500 && window.innerWidth > window.innerHeight
  return short ? { position: 'absolute', top: 64, right: 10, width: 'min(300px, 38%)', maxHeight: 'calc(100% - 74px)', overflow: 'auto' } : null
}
