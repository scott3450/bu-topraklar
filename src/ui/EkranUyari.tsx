// Telefon: oyun yatay ekran için. Dikey tutulunca "yan çevir"; başka sitede küçük bir çerçevede
// açılmışsa (Orqova sayfası telefonda ~375×234) tam ekran bağlantısı. Masaüstünde hiç görünmez.
import { useEffect, useState } from 'react'
import type { Palette } from '../theme/palettes'

function useScreen() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [s, setS] = useState(read)
  useEffect(() => {
    const on = () => setS(read())
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => (window.removeEventListener('resize', on), window.removeEventListener('orientationchange', on))
  }, [])
  return s
}

function inFrame() {
  try {
    return window.self !== window.top
  } catch {
    return true // başka alan adındaki çerçeve
  }
}

export function EkranUyari({ p, bg }: { p: Palette; bg: string }) {
  const { w, h } = useScreen()
  const portrait = h > w && w < 600
  const tiny = !portrait && inFrame() && (h < 320 || w < 520)
  if (!portrait && !tiny) return null
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: bg,
        display: 'grid',
        placeItems: 'center',
        alignContent: 'center',
        gap: tiny ? 10 : 22,
        fontFamily: p.ui.font,
        color: p.ui.text,
        textAlign: 'center',
        padding: 16,
      }}
    >
      {portrait ? (
        <>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ animation: 'cevir 2.6s ease-in-out infinite' }} aria-hidden>
            <rect x="20" y="6" width="24" height="52" rx="5" fill="none" stroke={p.ui.text} strokeWidth="3.5" />
            <circle cx="32" cy="51" r="2.2" fill={p.ui.text} />
          </svg>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Telefonu yan çevir</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Bu Topraklar</div>
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener"
            style={{ background: p.accent, color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 15, padding: '10px 18px', borderRadius: 999 }}
          >
            Tam ekranda oyna ↗
          </a>
        </>
      )}
    </div>
  )
}
