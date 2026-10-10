import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNarrow } from '../ui/useNarrow'
import { palette } from '../theme/palettes'
import { TERIMLER, type Terim } from './terimler'
import { useDefter } from './store'

const AUTO_MS = 7000 // kendiliğinden açılan kart bu süre sonra kapanır

/** Tanım kartı: terimin altında açılır. */
export function TermCard({ t, onClose, up = false }: { t: Terim; onClose: () => void; up?: boolean }) {
  const p = palette
  const narrow = useNarrow()
  return (
    <span
      role="dialog"
      aria-label={t.name}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        ...(up ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
        left: narrow ? '50%' : 0,
        transform: narrow ? 'translateX(-50%)' : undefined,
        width: 'min(280px, 80vw)',
        display: 'grid',
        gap: 6,
        padding: 14,
        borderRadius: 12,
        background: p.ui.card,
        color: p.ui.text,
        fontFamily: p.ui.font,
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.4,
        textAlign: 'left',
        whiteSpace: 'normal',
        letterSpacing: 0,
        boxShadow: '0 8px 28px rgba(40,30,20,0.22)',
        border: `1px solid ${p.accent}`,
        zIndex: 50,
        cursor: 'default',
        animation: 'giris 200ms ease-out both',
      }}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <b style={{ fontSize: 15, color: p.accent }}>{t.name}</b>
        <button onClick={onClose} aria-label="Kapat" style={{ border: 'none', background: 'none', color: p.ui.muted, fontSize: 16, cursor: 'pointer', padding: 0 }}>
          ×
        </button>
      </span>
      <span>{t.def}</span>
      <span style={{ color: p.ui.muted }}>{t.example}</span>
      {t.source && <span style={{ fontSize: 12, color: p.ui.muted }}>✅ {t.source}</span>}
    </span>
  )
}

/** Metin içindeki terim: altı noktalı; dokununca tanım açılır, ilk görüşte kendiliğinden açılır. */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const t = TERIMLER[id]
  const open = useDefter((s) => s.open)
  const { meet, show, close, mount } = useDefter()
  const mine = open?.id === id
  const ref = useRef<HTMLSpanElement>(null)
  const [up, setUp] = useState(false)
  // ekranın alt yarısındaki terimin kartı yukarı açılır
  useEffect(() => {
    if (mine && ref.current) setUp(ref.current.getBoundingClientRect().top > window.innerHeight * 0.55)
  }, [mine])
  useEffect(() => {
    if (!t) return
    const off = mount(id)
    meet(id)
    return off
  }, [id, t, meet, mount])
  useEffect(() => {
    if (!mine || !open?.auto) return
    const tm = setTimeout(close, AUTO_MS)
    return () => clearTimeout(tm)
  }, [mine, open?.auto, close])
  if (!t) return <>{children}</>
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline' }}>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => (e.stopPropagation(), show(id))}
        onKeyDown={(e) => e.key === 'Enter' && show(id)}
        style={{ textDecoration: `underline dotted ${palette.accent}`, textUnderlineOffset: 3, textDecorationThickness: 2, cursor: 'help' }}
      >
        {children}
      </span>
      {mine && <TermCard t={t} onClose={close} up={up} />}
    </span>
  )
}

const MARK = /\[\[([\w-]+)\|([^\]]+)\]\]/g

/** '[[vade|vadeyle]] öder' → metin + <Term>. */
export function rich(text: string): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(MARK)) {
    out.push(text.slice(last, m.index))
    out.push(
      <Term key={m.index} id={m[1]}>
        {m[2]}
      </Term>,
    )
    last = m.index! + m[0].length
  }
  out.push(text.slice(last))
  return <Fragment>{out}</Fragment>
}

/** İşaretsiz düz metin (menü, düğme içi). */
export const plain = (text: string) => text.replace(MARK, '$2')
