// İllerin özel bölümleri ve ürün ailelerinin şubeleri. Akış, kamera, tahmin, zincir ve "yıldız şansa bağlı değil"
// kontrolleri bütün bölümler için ortak: tests/bolumler.test.ts. Burada yalnız her ilin bilinen sonuçları.
import { describe, expect, it } from 'vitest'
import { OZEL, ozelOf } from '../src/chapter/chapters'
import type { Params } from '../src/chapter/engine'
import { malatyaModel } from '../src/chapter/chMalatya'
import { rizeModel } from '../src/chapter/chRize'
import { orduModel } from '../src/chapter/chOrdu'
import { konyaModel } from '../src/chapter/chKonya'
import { antalyaModel } from '../src/chapter/chAntalya'
import { sanliurfaModel } from '../src/chapter/chSanliurfa'
import { erzurumModel } from '../src/chapter/chErzurum'
import * as E from '../src/sim/engine'
import { drawEvents, resolve } from '../src/sim/events'

const stars = (il: string, p: Params) => ozelOf(il)!.result('karar', p).stars ?? 0
/** İki kontrolün bütün bileşimlerinden 3 yıldız alanlar (en az bir tane olmalı). */
function threeStar(il: string, a: [string, number, number, number], b: [string, number, number, number], extra: Params = {}) {
  const out: Params[] = []
  for (let x = a[1]; x <= a[2]; x += a[3]) for (let y = b[1]; y <= b[2]; y += b[3]) if (stars(il, { [a[0]]: x, [b[0]]: y, ...extra }) === 3) out.push({ [a[0]]: x, [b[0]]: y })
  expect(out.length, il).toBeGreaterThan(0)
  return out
}

describe('özel bölümler: bilinen sonuçlar (en iyi karar ortada, uçlar 3 yıldız almaz)', () => {
  it('her özel bölüm kendi ilinde oynar', () => {
    for (const c of OZEL) expect(c.il && ozelOf(c.il), c.title).toBe(c)
  })

  it('Malatya, Don gecesi: sigorta ile önlemin karışımı; bütçeyi aşan güvenli değil', () => {
    for (const p of threeStar('Malatya', ['sigorta', 0, 100, 10], ['onlem', 0, 100, 10], { don: 1, sert: 1 })) {
      expect(p.sigorta, JSON.stringify(p)).toBeGreaterThan(0)
      expect(p.onlem, JSON.stringify(p)).toBeGreaterThan(0)
    }
    expect(stars('Malatya', { sigorta: 100, onlem: 0, don: 1, sert: 1 })).toBeLessThan(3)
    expect(stars('Malatya', { sigorta: 0, onlem: 100, don: 0, sert: 0 })).toBeLessThan(3)
    expect(stars('Malatya', { sigorta: 0, onlem: 0, don: 0, sert: 0 })).toBe(0) // şans yaver gitse de karar kötü
    expect(malatyaModel({ sigorta: 100, onlem: 100 }).safe).toBe(false)
  })

  it("Rize, Çay kotası: elle toplanan kadarını kotaya kadar ÇAYKUR'a", () => {
    for (const p of threeStar('Rize', ['el', 0, 100, 10], ['caykur', 0, 100, 10])) {
      expect(Math.abs(p.el - p.caykur), JSON.stringify(p)).toBeLessThanOrEqual(10)
      expect(rizeModel(p).returned, JSON.stringify(p)).toBe(0)
    }
    expect(stars('Rize', { el: 100, caykur: 100 })).toBeLessThan(2)
    expect(stars('Rize', { el: 0, caykur: 0 })).toBe(0)
    expect(stars('Rize', { el: 0, caykur: 60 })).toBeLessThan(2) // makaslı yaprak kesinti yer
    const r = ozelOf('Rize')!.decision.predict!
    expect(r.answer({ el: 60, caykur: 60 })).toBe(false)
    expect(r.answer({ el: 60, caykur: 90 })).toBe(true) // kotadan fazlası geri döner
  })

  it('Ordu, Randıman: orta ayıklama ve borç kadarı peşin; TMO fiyatı randımana göre', () => {
    for (const p of threeStar('Ordu', ['ayikla', 0, 100, 20], ['tuccar', 0, 100, 10])) {
      expect(p.ayikla, JSON.stringify(p)).toBeGreaterThan(0)
      expect(p.ayikla, JSON.stringify(p)).toBeLessThan(80)
      expect(orduModel(p).safe).toBe(true)
    }
    expect(stars('Ordu', { ayikla: 0, tuccar: 40 })).toBeLessThan(3) // ayıklamamak primi kaçırır
    expect(stars('Ordu', { ayikla: 100, tuccar: 40 })).toBeLessThan(2) // fazla ayıklamak pahalı
    expect(stars('Ordu', { ayikla: 40, tuccar: 0 })).toBe(0) // borç ödenemez
    expect(stars('Ordu', { ayikla: 0, tuccar: 100 })).toBe(0)
    expect(orduModel({ ayikla: 0 }).tmoPrice).toBeLessThan(250)
    expect(orduModel({ ayikla: 40 }).tmoPrice).toBeGreaterThan(250)
  })

  it("Konya, Harman fiyatı: borç kadarı hemen TMO'ya, kalanı ELÜS kredisiyle birkaç ay depoda", () => {
    for (const p of threeStar('Konya', ['hemen', 0, 100, 10], ['ay', 0, 9, 1])) {
      expect(p.hemen, JSON.stringify(p)).toBeGreaterThan(0)
      expect(p.hemen, JSON.stringify(p)).toBeLessThan(50)
      expect(p.ay, JSON.stringify(p)).toBeGreaterThan(2)
      expect(p.ay, JSON.stringify(p)).toBeLessThan(8)
    }
    expect(stars('Konya', { hemen: 100, ay: 0 })).toBeLessThan(2) // güvenli ama fiyat artışı kaçar
    expect(stars('Konya', { hemen: 20, ay: 9 })).toBeLessThan(3) // bahar fiyatı düşer, kira desteği biter
    expect(stars('Konya', { hemen: 0, ay: 5 })).toBe(0) // ELÜS kredisi tek başına borca yetmez
    expect(konyaModel({ hemen: 20, ay: 5 }).loan).toBeGreaterThan(0)
  })

  it('Antalya, Kalıntı: etiketteki gün kadar bekle, siparişi doldur; kalıntı yalnız beklemeyince', () => {
    for (const p of threeStar('Antalya', ['gun', 0, 7, 1], ['ihracat', 0, 60, 10], { u: 0.5 })) {
      expect(p.gun, JSON.stringify(p)).toBe(3)
      expect(p.ihracat, JSON.stringify(p)).toBeGreaterThan(30)
    }
    expect(stars('Antalya', { gun: 0, ihracat: 0, u: 0.99 })).toBeLessThan(2) // hepsi hale
    expect(stars('Antalya', { gun: 0, ihracat: 60, u: 0.99 })).toBe(0) // beklemeden ihracat, şans yaver gitse bile
    expect(stars('Antalya', { gun: 7, ihracat: 60, u: 0.99 })).toBeLessThan(2) // domates dalda kaybolur
    expect(antalyaModel({ gun: 0, ihracat: 60, u: 0.5 }).hit).toBe(true)
    expect(antalyaModel({ gun: 3, ihracat: 60, u: 0.5 }).hit).toBe(false)
  })

  it('Şanlıurfa, Su: kasanın yettiği kadar damla, salmada ihtiyaç kadar su; fazla su tuz getirir', () => {
    for (const p of threeStar('Şanlıurfa', ['damla', 0, 100, 10], ['su', 60, 160, 10])) {
      expect(p.damla, JSON.stringify(p)).toBeGreaterThan(30)
      expect(p.su, JSON.stringify(p)).toBeGreaterThanOrEqual(90)
      expect(p.su, JSON.stringify(p)).toBeLessThanOrEqual(110)
    }
    expect(stars('Şanlıurfa', { damla: 0, su: 150 })).toBe(0) // ovanın alışkanlığı
    expect(stars('Şanlıurfa', { damla: 0, su: 100 })).toBeLessThan(2)
    expect(stars('Şanlıurfa', { damla: 50, su: 60 })).toBe(0) // susuz pamuk
    expect(stars('Şanlıurfa', { damla: 100, su: 100 })).toBe(0) // kasa yetmez
    expect(sanliurfaModel({ damla: 0, su: 150 }).drop).toBeGreaterThan(sanliurfaModel({ damla: 0, su: 100 }).drop)
    expect(sanliurfaModel({ damla: 50, su: 100 }).drop).toBeLessThan(sanliurfaModel({ damla: 0, su: 100 }).drop)
  })

  it('Erzurum, Uzun kış: uzun kışı da karşılayan stok, hepsi değil çoğu hayvan kışa', () => {
    for (const p of threeStar('Erzurum', ['kis', 40, 100, 10], ['stok', 0, 250, 25], { u: 0.5 })) {
      expect(p.kis, JSON.stringify(p)).toBeGreaterThan(50)
      expect(p.kis, JSON.stringify(p)).toBeLessThan(100)
      expect(p.stok, JSON.stringify(p)).toBeGreaterThan(100)
    }
    expect(stars('Erzurum', { kis: 100, stok: 0, u: 0.5 })).toBe(0) // stoksuz kış
    expect(stars('Erzurum', { kis: 40, stok: 75, u: 0.5 })).toBeLessThan(3) // çoğunu sonbaharda ucuza satmak
    expect(stars('Erzurum', { kis: 100, stok: 175, u: 0.5 })).toBeLessThan(3) // kısa kışta iyi, uzun kışta zorla satış
    expect(erzurumModel({ kis: 100, stok: 175, u: 0.99 }).forced).toBeGreaterThan(0) // yedi ay
    expect(erzurumModel({ kis: 100, stok: 175, u: 0.01 }).forced).toBe(0) // beş ay
  })
})

// ── Aile şubeleri ───────────────────────────────────────────

const ready = (seed: number): E.State => ({ ...E.newGame(seed), members: ['ayse', 'fatma'], trust: 75, cash: 900_000 })
/** Şubeli bir ya da daha çok yıl; kartlarda ilk seçenek seçilir. Görülen kartları da döndürür. */
function play(s: E.State, years = 1) {
  const seen: string[] = []
  for (let y = 0; y < years; y++) {
    if (y > 0) s = E.newYear(s)
    while (!s.over) {
      s = drawEvents(E.endMonth(s))
      while (s.events.length) {
        seen.push(s.events[0].id)
        s = resolve(s, 0, 0)
      }
    }
  }
  return { s, seen }
}
const branch = (seed: number, il: string, urun: string, kanal?: E.Branch['kanal']) => {
  const s = E.openBranch(ready(seed), il, urun)
  return kanal ? E.setBranch(s, il, { kanal }) : s
}
const partsAddUp = (s: E.State) => expect(Math.round(E.valueParts(s).reduce((a, x) => a + x.amount, 0))).toBe(Math.round(E.valueCreated(s)))

describe('aile şubeleri', () => {
  it('fabrika: kuruma (kota + geç ödeme) satmak özel alıcıya peşinden çok kazandırır; kontenjan kartı gelir', () => {
    const kurum = play(branch(5, 'Rize', 'cay', 'kurum'))
    const ozel = play(branch(5, 'Rize', 'cay', 'ozel'))
    expect(kurum.seen).toContain('kontenjan')
    expect(ozel.seen).not.toContain('kontenjan')
    expect(E.valueCreated(kurum.s)).toBeGreaterThan(E.valueCreated(ozel.s))
    partsAddUp(kurum.s)
  })

  it('tahıl: Konya buğday; depo > TMO > tüccar; TARSİM kartı kuraklıktan önce gelir', () => {
    expect(branch(7, 'Konya', 'bugday').subeler[0].kanal).toBe('kurum')
    const t = play(branch(7, 'Konya', 'bugday', 'tuccar'), 2) // depodaki satış yeni yıla sarkar
    const k = play(branch(7, 'Konya', 'bugday', 'kurum'), 2)
    const d = play(branch(7, 'Konya', 'bugday', 'depo'), 2)
    expect(E.valueCreated(k.s)).toBeGreaterThan(E.valueCreated(t.s))
    expect(E.valueCreated(d.s)).toBeGreaterThan(E.valueCreated(k.s))
    expect(k.seen.indexOf('tarsim')).toBeGreaterThanOrEqual(0)
    expect(k.seen.indexOf('tarsim')).toBeLessThan(k.seen.indexOf('kuraklik'))
    partsAddUp(d.s)
  })

  it('hayvancılık: Erzurum süt; fabrikaya satmak mandıradan çok kazandırır; kış kartında stok, kışın almaktan ucuz', () => {
    expect(branch(13, 'Erzurum', 'mera').subeler[0].kanal).toBe('kurum')
    const fab = play(branch(13, 'Erzurum', 'mera', 'kurum'))
    const man = play(branch(13, 'Erzurum', 'mera', 'ozel'))
    expect(fab.seen).toContain('kis')
    expect(E.valueCreated(fab.s)).toBeGreaterThan(E.valueCreated(man.s))
    partsAddUp(fab.s)
    const late = (() => {
      let s = branch(13, 'Erzurum', 'mera', 'kurum')
      while (!s.over) {
        s = drawEvents(E.endMonth(s))
        while (s.events.length) s = resolve(s, 0, s.events[0].id === 'kis' ? 1 : 0)
      }
      return s
    })()
    expect(E.valueCreated(late)).toBeLessThan(E.valueCreated(fab.s))
  })

  it('sebze: Antalya sera; ihracatçı halden çok kazandırır, kalıntı kartı yalnız ihracatta; parti dönerse haldan kötü', () => {
    expect(branch(11, 'Antalya', 'sera').subeler[0].kanal).toBe('hal')
    const hal = play(branch(11, 'Antalya', 'sera', 'hal'))
    const ihr = play(branch(11, 'Antalya', 'sera', 'kurum'))
    expect(hal.seen).not.toContain('kalinti')
    expect(ihr.seen).toContain('kalinti')
    expect(E.valueCreated(ihr.s)).toBeGreaterThan(E.valueCreated(hal.s))
    partsAddUp(ihr.s)
    let s = branch(11, 'Antalya', 'sera', 'kurum')
    s = { ...s, subeler: s.subeler.map((b) => ({ ...b, iade: true })), evDone: ['kalinti-Antalya'] }
    while (!s.over) s = E.endMonth(s)
    expect(E.valueCreated(s)).toBeLessThan(E.valueCreated(hal.s))
  })
})
