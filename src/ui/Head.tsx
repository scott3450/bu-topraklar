import type { ReactNode } from 'react'

/** Kart başlık şeridi (Pazar tezgâhı): kartın üstüne yapışık renkli bant. pad = kartın iç boşluğu. */
export function Head({ color, pad, children, radius = 18 }: { color: string; pad: number; children: ReactNode; radius?: number }) {
  return (
    <div
      style={{
        background: color,
        color: '#ffffff',
        margin: `-${pad}px -${pad}px 12px`,
        padding: `10px ${pad}px`,
        borderRadius: `${radius}px ${radius}px 0 0`,
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 0.8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
    </div>
  )
}
