import type { CSSProperties } from 'react'
import { UrunSimge } from './UrunSimge'
import { sheet, useNarrow } from './useNarrow'
import type { Palette } from '../theme/palettes'
import type { Crop } from '../data/crops'

function cardStyle(p: Palette): CSSProperties {
  return {
    background: p.ui.card,
    color: p.ui.text,
    fontFamily: p.ui.font,
    borderRadius: 18,
    boxShadow: '0 6px 24px rgba(60,40,20,0.10)',
    backdropFilter: 'blur(8px)',
  }
}

export function TopBar({ p }: { p: Palette }) {
  return (
    <div style={{ position: 'absolute', top: 16, left: 16 }}>
      <div style={{ ...cardStyle(p), padding: '10px 16px', fontWeight: 700, fontSize: 17 }}>Bu Topraklar</div>
    </div>
  )
}

export function CropCard({ p, crop, onClose }: { p: Palette; crop: Crop; onClose: () => void }) {
  const narrow = useNarrow()
  return (
    <div style={{ ...cardStyle(p), ...sheet(narrow, 320), bottom: narrow ? 10 : undefined, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 1, color: p.accent, fontWeight: 700 }}>
            {crop.province.toLocaleUpperCase('tr')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
            <UrunSimge id={crop.id} size={26} />
            {crop.name}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Kapat"
          style={{ border: 'none', background: 'none', fontSize: 18, color: p.ui.muted, cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.45, margin: '12px 0' }}>
        {crop.confidence === 'düşük' && (
          <span
            style={{
              marginRight: 6,
              padding: '2px 8px',
              borderRadius: 999,
              background: p.ui.chip,
              color: p.ui.chipText,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            yaklaşık
          </span>
        )}
        <b>{crop.fact}</b>
      </div>
      <div style={{ fontSize: 12, letterSpacing: 1, color: p.ui.muted, fontWeight: 700 }}>NEDEN BURADA</div>
      <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 4 }}>{crop.why}</div>
      <a
        href={crop.source.url}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'block', marginTop: 12, fontSize: 13, color: p.ui.muted }}
      >
        Kaynak: {crop.source.label}
      </a>
    </div>
  )
}
