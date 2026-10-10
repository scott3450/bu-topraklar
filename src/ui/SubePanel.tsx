import type { CSSProperties } from 'react'
import type { Palette } from '../theme/palettes'
import { useGame } from '../sim/store'
import * as E from '../sim/engine'
import { UrunSimge } from './UrunSimge'
import { HAL_CUT_COOP, VEG, DEPO_MONTHS, ELUS_LOAN, FACTORY, FRUIT, GRAIN, decaresOf, decaresFor, urunName } from '../data/aileler'
import { subeDurumu } from '../data/kilit'
import { useProgress } from '../data/progress'
import { useChapter } from '../chapter/engine'
import { CHAPTERS } from '../chapter/chapters'
import { useNarrow } from './useNarrow'
import { Head } from './Head'
import { rich } from '../defter/Term'

const tl = (n: number) => (n < 0 ? '−₺' : '₺') + Math.abs(Math.round(n)).toLocaleString('tr-TR')

/** İl sahnesinde şube kartı: açılmamışsa şartlar ve "Şube aç", açılmışsa satış yolu, tesis ve sigorta. */
export function SubePanel({ p, il }: { p: Palette; il: string }) {
  const { s, act } = useGame()
  const years = useProgress((g) => g.years)
  const done = useChapter((c) => c.done)
  const narrow = useNarrow()
  const free = CHAPTERS.every((c) => done.includes(c.id)) // serbest oyun açık mı
  const d = subeDurumu(il, s, years)
  if (d.kind === 'merkez' || d.kind === 'uzak' || d.kind === 'yakinda') return null

  const pad = 16
  const card: CSSProperties = {
    position: 'absolute',
    left: narrow ? 10 : 16,
    right: narrow ? 10 : undefined,
    bottom: narrow ? 10 : 16,
    width: narrow ? undefined : 300,
    maxWidth: 400, // yatay telefonda ekranı boydan boya kaplamasın, sağdaki bilgi paneline değmesin
    padding: pad,
    borderRadius: p.ui.radius,
    background: p.ui.card,
    color: p.ui.text,
    fontFamily: p.ui.font,
    boxShadow: '0 6px 24px rgba(50,35,20,0.14)',
    overflow: 'hidden',
    zIndex: 3,
  }
  const btn = (on: boolean, primary = false): CSSProperties => ({
    padding: '9px 12px',
    borderRadius: 10,
    border: primary ? 'none' : `1px solid ${on ? p.accent : p.groundSide}`,
    background: primary ? (on ? p.ui.button : '#d8cdb9') : on ? p.ui.chip : 'transparent',
    color: primary ? (on ? p.ui.buttonText : p.ui.muted) : p.ui.text,
    fontWeight: 700,
    fontSize: 14,
    cursor: on ? 'pointer' : 'default',
    fontFamily: p.ui.font,
    textAlign: 'left',
  })

  if (d.kind === 'acilabilir') {
    const f = { name: urunName(d.urun) }
    return (
      <div style={card}>
        <Head color={p.ui.warm} pad={pad}>
          <span>{d.davet ? 'DAVET' : 'ŞUBE AÇILABİLİR'}</span>
          <span style={{ opacity: 0.95, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: '#fffaf1', borderRadius: 999, padding: 2, display: 'flex' }}>
              <UrunSimge id={d.urun} size={16} />
            </span>
            {f.name}
          </span>
        </Head>
        <div style={{ fontSize: 14, lineHeight: 1.4, marginBottom: 10 }}>
          {d.davet ? `${il}'dan üreticiler kooperatif istiyor.` : `Komşu ilde şube açıp ${f.name.toLocaleLowerCase('tr')} üreticilerini örgütle.`}
        </div>
        {!free ? (
          <div style={{ fontSize: 13, color: p.ui.muted }}>Şube açmak için önce Aydın'daki beş bölümü bitir.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 4, fontSize: 13, marginBottom: 12 }}>
              {d.sartlar.map((x) => (
                <div key={x.label} style={{ display: 'grid', gridTemplateColumns: '16px 1fr auto', gap: 6 }}>
                  <b style={{ color: x.ok ? p.ui.good : p.ui.alert }}>{x.ok ? '✓' : '✗'}</b>
                  <span style={{ color: p.ui.muted }}>{x.label}</span>
                  <b style={{ color: x.ok ? p.ui.text : p.ui.alert }}>{x.text}</b>
                </div>
              ))}
            </div>
            <button disabled={!d.uygun} onClick={() => act((st) => E.openBranch(st, il, d.urun))} style={btn(d.uygun, true)}>
              Şube aç
            </button>
          </>
        )}
      </div>
    )
  }

  const b = s.subeler.find((x) => x.il === il)!
  const F = FACTORY[b.urun]
  const MONTHS = ['Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül']
  const sigorta = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <span>
        {rich('[[tarsim|TARSİM]]')}: <b style={{ color: b.sigorta ? p.ui.good : p.ui.text }}>{b.sigorta ? 'sigortalı' : 'yok'}</b>
      </span>
      {E.canInsure(s, b) && (
        <button onClick={() => act((st) => E.insureBranch(st, il))} style={{ ...btn(true), padding: '6px 10px', fontSize: 13 }}>
          Yaptır · {tl(E.tarsimPremium(s, b))}
        </button>
      )}
    </div>
  )
  const V = VEG[b.urun]
  if (V) {
    return (
      <div style={card}>
        <Head color={p.accent} pad={pad}>
          <span>{il.toLocaleUpperCase('tr')} ŞUBESİ</span>
          <span style={{ opacity: 0.95, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: '#fffaf1', borderRadius: 999, padding: 2, display: 'flex' }}>
              <UrunSimge id={b.urun} size={16} />
            </span>
            {V.name}
          </span>
        </Head>
        <div style={{ fontSize: 13, color: p.ui.muted, marginBottom: 10 }}>
          {decaresFor(b.urun).toLocaleString('tr-TR')} dönüm · hasat {Object.keys(V.harvest).map((m) => MONTHS[Number(m)]).join(', ')} · ürün değeri ≈ {tl(E.branchValue(s, b))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, color: p.ui.muted, marginBottom: 6 }}>NEREYE SATILSIN</div>
        <div style={{ display: 'grid', gap: 6 }}>
          <button onClick={() => act((st) => E.setBranch(st, il, { kanal: 'hal' }))} style={btn(b.kanal === 'hal')}>
            {rich('[[hal|Hal]]')} · ≈ {V.hal} ₺/kg, oynak, {rich('[[komisyon|kesintiler]]')} %{Math.round(HAL_CUT_COOP * 100)}
          </button>
          <button onClick={() => act((st) => E.setBranch(st, il, { kanal: 'kurum' }))} style={btn(b.kanal === 'kurum')}>
            {V.alici[0].toLocaleUpperCase('tr') + V.alici.slice(1)} · {V.aliciPrice} ₺/kg sabit, sipariş %{Math.round(V.kota * 100)}, 2 ay sonra
          </button>
        </div>
        {b.kanal === 'kurum' && <div style={{ fontSize: 12, color: p.ui.muted, marginTop: 8 }}>Siparişe sığmayan kısım hale gider. Parti {rich('[[kalinti|kalıntı]]')} analizinden geçmeli.</div>}
      </div>
    )
  }
  const G = GRAIN[b.urun]
  if (G) {
    return (
      <div style={card}>
        <Head color={p.accent} pad={pad}>
          <span>{il.toLocaleUpperCase('tr')} ŞUBESİ</span>
          <span style={{ opacity: 0.95, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: '#fffaf1', borderRadius: 999, padding: 2, display: 'flex' }}>
              <UrunSimge id={b.urun} size={16} />
            </span>
            {G.name}
          </span>
        </Head>
        <div style={{ fontSize: 13, color: p.ui.muted, marginBottom: 10 }}>
          {decaresFor(b.urun)} dönüm · hasat {Object.keys(G.harvest).map((m) => MONTHS[Number(m)]).join(', ')} · ürün değeri ≈ {tl(E.branchValue(s, b))}
          {b.kayip > 0 && <b style={{ color: p.ui.alert }}> · kuraklıkta %{Math.round(b.kayip * 100)} kayıp</b>}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, color: p.ui.muted, marginBottom: 6 }}>NEREYE SATILSIN</div>
        <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
          <button onClick={() => act((st) => E.setBranch(st, il, { kanal: 'tuccar' }))} style={btn(b.kanal === 'tuccar')}>
            Tüccara · harmanda {G.tuccar.toLocaleString('tr-TR')} ₺/kg, peşin
          </button>
          <button onClick={() => act((st) => E.setBranch(st, il, { kanal: 'kurum' }))} style={btn(b.kanal === 'kurum')}>
            {G.kurum} · {G.kurumPrice.toLocaleString('tr-TR')} ₺/kg, {G.delay} ay sonra
          </button>
          <button onClick={() => act((st) => E.setBranch(st, il, { kanal: 'depo' }))} style={btn(b.kanal === 'depo')}>
            {rich('[[elus|Lisanslı depo]]')} · %{ELUS_LOAN * 100} kredi hemen, {DEPO_MONTHS} ay sonra ≈ {G.depoPrice.toLocaleString('tr-TR')} ₺/kg
          </button>
        </div>
        {sigorta}
      </div>
    )
  }
  if (F) {
    const kota = Math.max(0, F.kota - (b.kotaCut ?? 0))
    return (
      <div style={card}>
        <Head color={p.accent} pad={pad}>
          <span>{il.toLocaleUpperCase('tr')} ŞUBESİ</span>
          <span style={{ opacity: 0.95, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: '#fffaf1', borderRadius: 999, padding: 2, display: 'flex' }}>
              <UrunSimge id={b.urun} size={16} />
            </span>
            {F.name}
          </span>
        </Head>
        <div style={{ fontSize: 13, color: p.ui.muted, marginBottom: 10 }}>
          {decaresFor(b.urun)} {F.unit ?? 'dönüm'} · {Object.keys(F.harvest).length >= 12 ? 'yıl boyu' : `hasat ${Object.keys(F.harvest).map((m) => MONTHS[Number(m)]).join(', ')}`} · ürün değeri ≈ {tl(E.branchValue(s, b))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, color: p.ui.muted, marginBottom: 6 }}>NEREYE SATILSIN</div>
        <div style={{ display: 'grid', gap: 6 }}>
          <button onClick={() => act((st) => E.setBranch(st, il, { kanal: 'kurum' }))} style={btn(b.kanal === 'kurum')}>
            {F.kurum} · {F.kurumPrice} ₺/kg · {rich('[[kontenjan|kota]]')} %{Math.round(kota * 100)}, {F.delay} ay sonra
          </button>
          <button onClick={() => act((st) => E.setBranch(st, il, { kanal: 'ozel' }))} style={btn(b.kanal === 'ozel')}>
            Hepsi {F.ozelName} · {F.ozelPrice} ₺/kg, peşin
          </button>
        </div>
        {b.kanal === 'kurum' && <div style={{ fontSize: 12, color: p.ui.muted, marginTop: 8 }}>Kotaya sığmayan kısım peşin, {F.ozelPrice} ₺/kg ile özel alıcıya gider.</div>}
      </div>
    )
  }
  const f = FRUIT[b.urun]
  const val = E.branchValue(s, b)
  const harvestMonths = Object.keys(f.harvest).map(Number)
  return (
    <div style={card}>
      <Head color={p.accent} pad={pad}>
        <span>{il.toLocaleUpperCase('tr')} ŞUBESİ</span>
        <span style={{ opacity: 0.95, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: '#fffaf1', borderRadius: 999, padding: 2, display: 'flex' }}>
              <UrunSimge id={b.urun} size={16} />
            </span>
            {f.name}
          </span>
      </Head>
      <div style={{ fontSize: 13, color: p.ui.muted, marginBottom: 10 }}>
        {decaresOf(f)} dönüm · hasat {harvestMonths.map((m) => MONTHS[m]).join('–')} · ürün değeri ≈ {tl(val)}
        {b.kayip > 0 && <b style={{ color: p.ui.alert }}> · donda %{Math.round(b.kayip * 100)} kayıp</b>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, color: p.ui.muted, marginBottom: 6 }}>NEREYE SATILSIN</div>
      <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
        <button onClick={() => act((st) => E.setBranch(st, il, { kanal: 'tuccar' }))} style={btn(b.kanal === 'tuccar')}>
          Tüccara · bahçede {f.trader} ₺/kg, hemen
        </button>
        {b.tesis ? (
          <button onClick={() => act((st) => E.setBranch(st, il, { kanal: 'tesis' }))} style={btn(b.kanal === 'tesis')}>
            Tesisten · {f.coop} ₺/kg, 60 gün {rich('[[vade|vadeli]]')}
          </button>
        ) : (
          <button onClick={() => act((st) => E.buyBranchTesis(st, il))} style={btn(true)}>
            {f.tesis.name} kur · {tl(f.tesis.cost * s.costIdx)}
          </button>
        )}
      </div>
      {sigorta}
    </div>
  )
}
