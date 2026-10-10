// Ürün simgeleri: il bilgisi ve kartlarda ürün adının yanında. Düz renk, 24'lük kare, oyunun
// sıcak tonlarıyla; her ürün tek tanınır şekil.
import type { ReactNode } from 'react'

const LEAF = '#5f8a45'
const STEM = '#6b4a2e'

/** Yaprağıyla yuvarlak meyve. */
const fruit = (c: string, extra?: ReactNode) => (
  <>
    <circle cx="12" cy="14" r="7" fill={c} />
    <path d="M12 7 L12.6 4" stroke={STEM} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M12.6 5.5 C15 3 18 4 18.5 5.5 C16 7 13.8 6.8 12.6 5.5Z" fill={LEAF} />
    {extra}
  </>
)

const ICONS: Record<string, ReactNode> = {
  elma: fruit('#c8322b', <circle cx="9.5" cy="12" r="1.6" fill="#fff" opacity="0.35" />),
  seftali: fruit('#f6b48a', (
    <>
      <path d="M12.5 8.5 C18.5 9 19.5 16 15 20 C12.5 21.5 11.5 18 12.2 14 C12.6 11.5 12 9.5 12.5 8.5Z" fill="#e0574a" opacity="0.85" />
      <path d="M12 8 C10 11 10 16 12 21" stroke="#d96c45" strokeWidth="1" fill="none" />
    </>
  )),
  kayisi: fruit('#e8913a', <path d="M12 8 C10.5 11 10.5 16 12 21" stroke="#c9742a" strokeWidth="1" fill="none" />),
  narenciye: fruit('#ef9a2e', (
    <>
      <circle cx="9.5" cy="12" r="0.7" fill="#d97f1a" />
      <circle cx="14" cy="16" r="0.7" fill="#d97f1a" />
      <circle cx="10.5" cy="17" r="0.7" fill="#d97f1a" />
    </>
  )),
  nar: (
    <>
      <circle cx="12" cy="14" r="7" fill="#b5203a" />
      <path d="M9.5 7.8 L10.5 5 L12 7 L13.5 5 L14.5 7.8Z" fill="#8e1830" />
      <circle cx="9.5" cy="12" r="1.5" fill="#fff" opacity="0.3" />
    </>
  ),
  kiraz: (
    <>
      <path d="M8 15 C9 10 12 6 15 4 M16 14 C15.5 9 15 6 15 4" stroke={STEM} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M15 4 C17 2.5 19.5 3.5 20 5 C18 6 16 5.6 15 4Z" fill={LEAF} />
      <circle cx="8" cy="17" r="4" fill="#8b1e2b" />
      <circle cx="16.5" cy="16.5" r="4" fill="#a3243a" />
    </>
  ),
  incir: (
    <>
      <path d="M12 5 C9 8 6 12 6.5 16 C7 20 17 20 17.5 16 C18 12 15 8 12 5Z" fill="#6b3f5e" />
      <path d="M11 5 L13 5 L12.6 3.5 L11.4 3.5Z" fill={LEAF} />
      <circle cx="12" cy="17.5" r="1.2" fill="#c9708e" />
    </>
  ),
  zeytin: (
    <>
      <path d="M5 8 C8 3 15 3 19 6 C15 8 9 9 5 8Z" fill="#8c9a5b" />
      <ellipse cx="9.5" cy="15" rx="4" ry="5" fill="#556b2f" transform="rotate(-20 9.5 15)" />
      <ellipse cx="16" cy="15.5" rx="3.6" ry="4.6" fill="#3a3a2a" transform="rotate(15 16 15.5)" />
    </>
  ),
  ceviz: (
    <>
      <circle cx="12" cy="13" r="7.5" fill="#a07a4f" />
      <path d="M12 5.5 C10 9 14 12 12 20.5" stroke="#7a5a36" strokeWidth="1.3" fill="none" />
      <path d="M7 11 C9 12 9 15 7 16 M17 11 C15 12 15 15 17 16" stroke="#7a5a36" strokeWidth="1" fill="none" />
    </>
  ),
  kestane: (
    <>
      <path d="M12 4 C17 6 20 12 18.5 16 L5.5 16 C4 12 7 6 12 4Z" fill="#7a4a2a" />
      <path d="M5.5 16 C6 19.5 18 19.5 18.5 16Z" fill="#d9b98a" />
      <path d="M12 4 L12 2.8" stroke="#7a4a2a" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  findik: (
    <>
      <path d="M12 7 C17 7 19 13 17 17 C15.5 20 8.5 20 7 17 C5 13 7 7 12 7Z" fill="#a0683a" />
      <path d="M5.5 9 C7 4 17 4 18.5 9 C16 7.5 8 7.5 5.5 9Z" fill="#8a9a4a" />
      <circle cx="10" cy="12.5" r="1.3" fill="#fff" opacity="0.3" />
    </>
  ),
  fistik: (
    <>
      <path d="M12 4 C17 6 18 14 12 20 C6 14 7 6 12 4Z" fill="#e6d3b0" />
      <path d="M12 6 C14.5 8 15 13 12 17 C9 13 9.5 8 12 6Z" fill="#9cb04a" />
      <path d="M12 4 C10 9 10 15 12 20" stroke="#c9b48c" strokeWidth="0.8" fill="none" />
    </>
  ),
  cay: (
    <>
      <path d="M12 21 L12 12" stroke={STEM} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 13 C6 13 4 8 5 4 C10 4 12.5 8 12 13Z" fill="#53903f" />
      <path d="M12 13 C18 12 20 7 19 3 C14 4 11.5 8 12 13Z" fill="#6aa84f" />
      <path d="M12 13 C9 10 7 7 5.5 4.8 M12 13 C15 10 17 6 18.6 3.8" stroke="#3f6e2e" strokeWidth="0.8" fill="none" />
    </>
  ),
  uzum: (
    <>
      <path d="M12 6 L12.5 3" stroke={STEM} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12.5 4 C15 2 18 3 18.5 4.5 C16 6 14 5.5 12.5 4Z" fill={LEAF} />
      {[[9, 8], [12, 8], [15, 8], [10.5, 11], [13.5, 11], [7.5, 11], [16.5, 11], [9, 14], [12, 14], [15, 14], [10.5, 17], [13.5, 17], [12, 20]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.9" fill={i % 3 === 0 ? '#7a3f7a' : '#8e4b8e'} />
      ))}
    </>
  ),
  gul: (
    <>
      <path d="M12 20 L12 14" stroke={LEAF} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 18 C9 18 7.5 16.5 7 15 C9 14.5 11 15.5 12 18Z" fill={LEAF} />
      <circle cx="12" cy="9.5" r="6" fill="#d0566a" />
      <path d="M12 6 C14.5 6 15.5 8.5 14 10.5 C12.5 12 9.5 11 9.8 8.6 C10 7.2 11 6.6 12 7.4" stroke="#a83a4f" strokeWidth="1.1" fill="none" />
    </>
  ),
  domates: (
    <>
      <circle cx="12" cy="14" r="7.5" fill="#c8452f" />
      <path d="M12 7.5 L10 5.5 L11.5 8 L8 7.5 L11 9 L12 10 L13 9 L16 7.5 L12.5 8 L14 5.5Z" fill="#4f8a3e" />
      <circle cx="9" cy="12.5" r="1.5" fill="#fff" opacity="0.3" />
    </>
  ),
  muz: (
    <>
      <path d="M5 8 C5 16 11 20 19 18 C19.5 17 19 16.3 18 16.3 C12 17 8 13.5 7.5 7.5 C7 6.5 5.5 6.5 5 8Z" fill="#e8c23a" />
      <path d="M5.2 8 L5 6 L7 6.4 Z" fill={STEM} />
    </>
  ),
  sera: (
    <>
      <path d="M3 19 L3 11 C3 6 21 6 21 11 L21 19Z" fill="#cfe3e0" stroke="#7fa8a4" strokeWidth="1.2" />
      <path d="M8 19 L8 8 M12 19 L12 7 M16 19 L16 8" stroke="#7fa8a4" strokeWidth="1" />
      <circle cx="10" cy="16" r="1.6" fill="#c8452f" />
      <circle cx="14" cy="15.5" r="1.6" fill="#c8452f" />
    </>
  ),
  sebze: (
    <>
      <path d="M8 9 C11 9 13 10 12 12 L6 21 C5 21.5 4.5 21 5 20 Z" fill="#e8822f" transform="rotate(10 9 15)" />
      <path d="M9 9 C8 6 9 4 10 3 M10 9 C11 6 13 5 14 5" stroke="#4f8a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M15 10 C19 10 20 13 19.5 16 C19 19 16 20 14.5 18 C13 16 13 11 15 10Z" fill="#4f8a3e" />
      <path d="M16 10 L16.5 8" stroke="#3f6e2e" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  patates: (
    <>
      <ellipse cx="12" cy="13" rx="8" ry="6" fill="#c49a62" transform="rotate(-15 12 13)" />
      <circle cx="9" cy="12" r="0.8" fill="#8a6a3e" />
      <circle cx="14" cy="10.5" r="0.8" fill="#8a6a3e" />
      <circle cx="15" cy="15" r="0.8" fill="#8a6a3e" />
    </>
  ),
  bugday: (
    <>
      <path d="M12 21 L12 5" stroke="#c9a24a" strokeWidth="1.4" strokeLinecap="round" />
      {[6, 9, 12, 15].map((y) => (
        <g key={y}>
          <ellipse cx="9.8" cy={y + 1} rx="1.6" ry="2.6" fill="#e0b94e" transform={`rotate(-30 9.8 ${y + 1})`} />
          <ellipse cx="14.2" cy={y + 1} rx="1.6" ry="2.6" fill="#e0b94e" transform={`rotate(30 14.2 ${y + 1})`} />
        </g>
      ))}
      <ellipse cx="12" cy="4.5" rx="1.4" ry="2.4" fill="#e0b94e" />
    </>
  ),
  aycicegi: (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx="12" cy="4.5" rx="1.8" ry="3.2" fill="#e8c23a" transform={`rotate(${i * 30} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="4.4" fill="#6b4a2e" />
      <circle cx="12" cy="12" r="2.4" fill="#4f3520" />
    </>
  ),
  pamuk: (
    <>
      <path d="M6 16 L12 21 L18 16 C15 18 9 18 6 16Z" fill="#7a5a36" />
      <circle cx="9" cy="11" r="4" fill="#f4efe4" stroke="#d8d0bf" strokeWidth="0.8" />
      <circle cx="15" cy="11" r="4" fill="#f4efe4" stroke="#d8d0bf" strokeWidth="0.8" />
      <circle cx="12" cy="7.5" r="4" fill="#fbf8f1" stroke="#d8d0bf" strokeWidth="0.8" />
      <circle cx="12" cy="14" r="4" fill="#fbf8f1" stroke="#d8d0bf" strokeWidth="0.8" />
    </>
  ),
  pancar: (
    <>
      <path d="M10 8 C7 5 6 3 7 2 C9 3 11 5 11 8Z M14 8 C17 5 18 3 17 2 C15 3 13 5 13 8Z M12 8 C11 5 11.5 3 12 2 C12.5 3 13 5 12 8Z" fill="#4f8a3e" />
      <path d="M12 8 C17 8 18.5 12 16 16 C14.5 18.5 13 20 12 22 C11 20 9.5 18.5 8 16 C5.5 12 7 8 12 8Z" fill="#e9dcc3" stroke="#c9b893" strokeWidth="0.8" />
    </>
  ),
  misir: (
    <>
      <path d="M12 3 C15.5 5 16 13 14 19 L10 19 C8 13 8.5 5 12 3Z" fill="#f0c53a" />
      <path d="M10.5 7 L13.5 7 M10 10 L14 10 M10 13 L14 13 M10.5 16 L13.5 16" stroke="#d9a72a" strokeWidth="0.9" />
      <path d="M10 19 C6 17 5 12 6 8 C8 11 9.5 15 12 19Z M14 19 C18 17 19 12 18 8 C16 11 14.5 15 12 19Z" fill="#7fae4e" />
    </>
  ),
  celtik: (
    <>
      <path d="M7 21 C7 14 9.5 8 15.5 4" stroke="#6f9a3e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {[[14, 6], [11.8, 8], [10.2, 10.6], [9.2, 13.4], [16.6, 7.6], [14.8, 10.2], [13, 12.8], [11.8, 15.6]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1.5" ry="2.5" fill={i < 4 ? '#d9b960' : '#e6c977'} transform={`rotate(40 ${x} ${y})`} />
      ))}
    </>
  ),
  mercimek: (
    <>
      {[[8, 10], [14, 9], [11, 14], [16.5, 14], [7.5, 16], [13, 18.5]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="3" ry="2.3" fill={i % 2 ? '#d9662e' : '#e57a3a'} />
      ))}
    </>
  ),
  nohut: (
    <>
      {[[9, 10], [15, 11], [11.5, 16]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.8" fill="#e3c98f" stroke="#c4a86a" strokeWidth="0.8" />
          <path d={`M${x} ${y - 3.8} L${x + 1} ${y - 5}`} stroke="#c4a86a" strokeWidth="1" />
        </g>
      ))}
    </>
  ),
  tutun: (
    <>
      <path d="M12 21 C5 18 3 10 6 3 C12 4 18 9 18 15 C18 18 15.5 20.5 12 21Z" fill="#7f9a4e" />
      <path d="M12 21 C11 15 9 9 6 3 M11 14 L15 12 M9.5 10 L13.5 8.5 M10.7 17 L15.5 16.5" stroke="#5e7a36" strokeWidth="0.9" fill="none" />
    </>
  ),
  hashas: (
    <>
      <path d="M12 21 L12 15" stroke="#8aa36a" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="12" cy="10.5" rx="5.5" ry="5" fill="#b9c79a" />
      <path d="M7.5 6.5 L16.5 6.5 L15 5 L12 6 L9 5Z" fill="#8a9a6a" />
      <path d="M10 7 C9 9.5 9 12 10 14.5 M14 7 C15 9.5 15 12 14 14.5" stroke="#9aab7a" strokeWidth="0.8" fill="none" />
    </>
  ),
  yerfistigi: (
    <>
      <path d="M8 4 C12 3.5 13 7 12 9.5 C11.5 11 12.5 12.5 13 14 C14 17.5 12 20.5 9 20.5 C5.5 20.5 4.5 17 5.5 14.5 C6.2 12.8 6.5 11.5 5.8 9.5 C5 7 5.5 4.3 8 4Z" fill="#d8b47a" transform="rotate(-30 9 12)" />
      <path d="M7 8 L10 8 M6.5 15 L10.5 15" stroke="#b8935a" strokeWidth="0.8" transform="rotate(-30 9 12)" />
    </>
  ),
  mera: (
    <>
      <path d="M6 7 L9 7 L9 20 L6 20Z M15 7 L18 7 L18 20 L15 20Z" fill="#c9ccc8" />
      <path d="M7 5 L17 5 L18 8 L18 20 L6 20 L6 8Z" fill="#d9dcd8" stroke="#a8aca6" strokeWidth="1" />
      <rect x="9" y="3" width="6" height="2.5" rx="0.8" fill="#a8aca6" />
      <rect x="6" y="11" width="12" height="3" fill="#2f6f8f" />
    </>
  ),
  bal: (
    <>
      {[[12, 6.5], [8, 9], [16, 9], [12, 11.5], [8, 14], [16, 14], [12, 16.5]].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x - 2.6} ${y} L${x - 1.3} ${y - 2.25} L${x + 1.3} ${y - 2.25} L${x + 2.6} ${y} L${x + 1.3} ${y + 2.25} L${x - 1.3} ${y + 2.25}Z`}
          fill={i === 3 ? '#e8a23a' : '#e2b23a'}
          stroke="#c48a2a"
          strokeWidth="0.7"
        />
      ))}
    </>
  ),
}

// haritadaki ürün kartlarında (data/crops) farklı adla geçenler
const ALIAS: Record<string, string> = { cambali: 'bal', sut: 'mera' }

export function UrunSimge({ id, size = 22 }: { id: string; size?: number }) {
  const icon = ICONS[ALIAS[id] ?? id]
  if (!icon) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0, display: 'block' }}>
      {icon}
    </svg>
  )
}

export const SIMGELI = Object.keys(ICONS)
