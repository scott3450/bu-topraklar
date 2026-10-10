// Sürpriz olayın sonucu kart gelmeden önce kısa bir görüntüyle oynar (Plan-v3 Faz 6): don, kuraklık,
// ihracatta kalıntı. Göster, anlatma: tek büyük başlık, ayrıntı ardından gelen kartta. Dokununca geçer;
// sakin harekette hiç oynamaz.
import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'

export type SinematikTur = 'don' | 'kuraklik' | 'kalinti'

export const SINEMATIK: Record<string, SinematikTur> = {
  'don-sonuc': 'don',
  'meyve-don-sonuc': 'don',
  'kuraklik-sonuc': 'kuraklik',
  'kalinti-sonuc': 'kalinti',
}

const SURE = 2800

function rnd(i: number) {
  const s = Math.sin((i + 1) * 91.17) * 43758.5453
  return s - Math.floor(s)
}

const full: CSSProperties = { position: 'absolute', inset: 0 }

function Don({ hit }: { hit: boolean }) {
  const flakes = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ x: rnd(i) * 100, d: 1.6 + rnd(i + 50) * 1.4, w: 0.4 + rnd(i + 90) * 1.2, s: 8 + rnd(i + 7) * 14 })), [])
  return (
    <>
      <div style={{ ...full, background: hit ? 'linear-gradient(#0f1d33, #23466b)' : 'linear-gradient(#1a2a44 0%, #3c5d86 55%, #f2b26b 100%)' }} />
      {!hit && <div style={{ ...full, background: 'radial-gradient(circle at 50% 110%, rgba(255,214,140,0.9), transparent 55%)', animation: `sin-belir ${SURE}ms ease-out both` }} />}
      {flakes.map((f, i) => (
        <div
          key={i}
          style={{ position: 'absolute', left: `${f.x}%`, top: -30, color: '#e8f3ff', fontSize: f.s, opacity: hit ? 0.9 : 0.35, animation: `sin-dus ${f.d}s linear ${f.w * -1}s infinite` }}
        >
          ✻
        </div>
      ))}
      {/* çiçekli dal: don gelirse çiçekler kararır */}
      <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '34%' }}>
        <path d="M-10 110 C80 90 140 70 220 72 C290 74 340 50 410 30 M150 74 C170 50 190 40 215 34 M260 70 C270 92 300 104 330 108" stroke="#3a2a22" strokeWidth="7" fill="none" strokeLinecap="round" />
        {[[40, 96], [95, 84], [150, 74], [180, 52], [215, 34], [230, 70], [270, 78], [300, 100], [330, 108], [320, 58], [370, 42], [120, 78], [200, 72]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-6" rx="4.5" ry="6.5" transform={`rotate(${a})`} style={{ fill: '#f6c9d4', animation: hit ? `sin-yan ${SURE}ms ease-in ${200 + (i % 5) * 120}ms both` : undefined }} />
            ))}
            <circle r="2.6" fill="#d98a3a" />
          </g>
        ))}
      </svg>
      {hit && (
        <div
          style={{
            ...full,
            background: 'radial-gradient(ellipse at center, transparent 45%, rgba(220,238,255,0.85) 100%)',
            animation: `sin-belir ${SURE}ms ease-out both`,
          }}
        />
      )}
    </>
  )
}

function Kuraklik({ hit }: { hit: boolean }) {
  const cracks = 'M50 0 L46 18 L54 30 L44 52 L52 70 L47 100 M46 18 L30 26 L22 44 M54 30 L72 36 L80 58 M44 52 L26 62 L14 80 M52 70 L68 78 L74 100 M22 44 L6 50 M80 58 L96 62'
  const drops = useMemo(() => Array.from({ length: 60 }, (_, i) => ({ x: rnd(i) * 100, d: 0.5 + rnd(i + 30) * 0.4, w: rnd(i + 70) })), [])
  if (!hit)
    return (
      <>
        <div style={{ ...full, background: 'linear-gradient(#5d6f7e, #8fa3a8 60%, #b7a77e)' }} />
        {drops.map((d, i) => (
          <div key={i} style={{ position: 'absolute', left: `${d.x}%`, top: -40, width: 2, height: 26, borderRadius: 2, background: 'rgba(230,240,248,0.7)', transform: 'rotate(12deg)', animation: `sin-dus ${d.d}s linear ${-d.w}s infinite` }} />
        ))}
      </>
    )
  return (
    <>
      <div style={{ ...full, background: 'linear-gradient(#f2c46b, #d9894a 55%, #b8733f)' }} />
      <div style={{ position: 'absolute', left: '50%', top: '14%', width: 120, height: 120, marginLeft: -60, borderRadius: '50%', background: '#fff2c4', boxShadow: '0 0 80px 30px rgba(255,236,170,0.8)', animation: `sin-nabiz 1.4s ease-in-out infinite` }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '48%' }}>
        <rect width="100" height="100" fill="#a8693a" />
        <path d={cracks} stroke="#5e3a1e" strokeWidth="3" fill="none" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: `sin-ciz ${SURE * 0.7}ms ease-out 300ms forwards` }} vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  )
}

function Kalinti({ hit }: { hit: boolean }) {
  return (
    <>
      <div style={{ ...full, background: 'linear-gradient(#cfe3ea, #e9e1cf 62%, #b9a785 62%)' }} />
      {/* gümrük kapısı */}
      <div style={{ position: 'absolute', right: '18%', bottom: '38%', width: 10, height: 90, background: '#6b5a48' }} />
      <div style={{ position: 'absolute', right: '18%', bottom: 'calc(38% + 70px)', width: 120, height: 8, background: hit ? '#c0392b' : '#3f8a4f', transformOrigin: '0 50%', animation: hit ? undefined : `sin-kalk ${SURE}ms ease-out both` }} />
      {/* kamyon */}
      <div style={{ position: 'absolute', bottom: '38%', left: 0, animation: `${hit ? 'sin-don' : 'sin-gec'} ${SURE}ms ease-in-out both` }}>
        <svg width="120" height="64" viewBox="0 0 120 64">
          <rect x="0" y="8" width="78" height="40" rx="3" fill="#e9e4d4" stroke="#8a7e66" />
          <rect x="6" y="14" width="66" height="28" fill="#c8452f" opacity="0.85" />
          <rect x="80" y="20" width="32" height="28" rx="4" fill="#1f8a8c" />
          <rect x="88" y="24" width="18" height="10" fill="#cfe3ea" />
          <circle cx="20" cy="52" r="9" fill="#2f2a26" />
          <circle cx="62" cy="52" r="9" fill="#2f2a26" />
          <circle cx="98" cy="52" r="9" fill="#2f2a26" />
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '30%',
          transform: 'translate(-50%, -50%) rotate(-8deg)',
          padding: '8px 22px',
          border: `5px solid ${hit ? '#c0392b' : '#3f8a4f'}`,
          color: hit ? '#c0392b' : '#3f8a4f',
          borderRadius: 10,
          fontWeight: 900,
          fontSize: 44,
          letterSpacing: 4,
          animation: `sin-damga ${SURE}ms ease-out both`,
        }}
      >
        {hit ? 'İADE' : 'GEÇTİ'}
      </div>
    </>
  )
}

export function Sinematik({ tur, hit, title, il, onDone }: { tur: SinematikTur; hit: boolean; title: string; il?: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, SURE)
    return () => clearTimeout(t)
  }, [onDone])
  const dark = tur === 'don'
  const scene: ReactNode = tur === 'don' ? <Don hit={hit} /> : tur === 'kuraklik' ? <Kuraklik hit={hit} /> : <Kalinti hit={hit} />
  return (
    <div onClick={onDone} style={{ ...full, zIndex: 40, overflow: 'hidden', cursor: 'pointer', animation: `sin-kapan ${SURE}ms ease-in-out both` }}>
      {scene}
      {tur !== 'kalinti' && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '42%',
            textAlign: 'center',
            color: dark ? '#f4f8ff' : '#3a2412',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: dark ? '0 2px 20px rgba(0,0,0,0.5)' : '0 2px 16px rgba(255,240,200,0.7)',
            animation: `giris 500ms ease-out 250ms both`,
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 900 }}>{title}</div>
          {il && <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.85, marginTop: 4 }}>{il}</div>}
        </div>
      )}
    </div>
  )
}
