import { describe, expect, it } from 'vitest'
import { CHAPTERS, OZEL } from '../src/chapter/chapters'
import { bestOf, defaults, type ChapterDef, type Params } from '../src/chapter/engine'

const ALL = [...CHAPTERS, ...OZEL] // Aydın kampanyası + illerin özel bölümleri
const ch = (id: number) => CHAPTERS.find((c) => c.id === id)!
const stars = (id: number, p: Params) => ch(id).result('karar', p).stars

/** Şansa bağlı değerlerin bütün 0/1 bileşimleri (iyi yıl/kötü yıl, don geldi mi × sert mi, kalıntı çıktı mı). */
const rolls = (c: ChapterDef): Params[] =>
  Object.keys(c.decision.roll?.() ?? {}).reduce<Params[]>((acc, k) => acc.flatMap((p) => [{ ...p, [k]: 0 }, { ...p, [k]: 1 }]), [{}])
/** Kontrollerin bütün değer bileşimleri (şans değerleri dahil). */
function every(c: ChapterDef): Params[] {
  const out: Params[] = []
  const walk = (i: number, p: Params) => {
    if (i === c.decision.controls.length) {
      out.push(...rolls(c).map((r) => ({ ...p, ...r })))
      return
    }
    const k = c.decision.controls[i]
    for (let v = k.min; v <= k.max + 1e-9; v += k.step) walk(i + 1, { ...p, [k.id]: Math.round(v * 1000) / 1000 })
  }
  walk(0, {})
  return out
}

describe('bölümler', () => {
  it('her bölümde 3 yıldızlı bir ayar var; varsayılan ayar 3 yıldız değil', () => {
    for (const c of ALL) {
      const all = every(c)
      expect(all.some((p) => c.result('karar', p).stars === 3), c.title).toBe(true)
      expect(c.result('karar', defaults(c.decision)).stars, `${c.title}: varsayılan`).toBeLessThan(3)
      expect(Number.isFinite(bestOf(c.decision, (p) => c.result('karar', p).stars ?? 0)), c.title).toBe(true)
    }
  })
  it('her ayarda akış sonuca ulaşır; her adımın kamera planı ve ayı var', () => {
    for (const c of ALL) {
      expect(c.flow.intro, `${c.title}: akış intro ile başlamalı`).toBeTruthy()
      for (const step of Object.keys(c.flow)) {
        expect(c.shot[step] ?? c.shot.intro, `${c.title}: ${step}`).toBeTruthy()
        expect(c.month[step], `${c.title}: ${step} ayı`).toBeTruthy()
      }
      for (const p of every(c)) {
        let step = c.decision.next(p)
        for (let i = 0; i < 20 && step !== 'result'; i++) {
          const f = c.flow[step]
          expect(f, `${c.title}: ${step} akışta yok (${JSON.stringify(p)})`).toBeTruthy()
          step = typeof f.next === 'function' ? f.next('karar', p) : f.next
        }
        expect(step, `${c.title}: ${JSON.stringify(p)}`).toBe('result')
      }
    }
  })
  it('yıldız şansa değil karara bağlı: aynı karar her şans değerinde aynı yıldızı alır', () => {
    for (const c of ALL.filter((x) => x.decision.roll)) {
      for (const p of every(c)) {
        const set = new Set(rolls(c).map((r) => c.result('karar', { ...p, ...r }).stars))
        expect(set.size, `${c.title} ${JSON.stringify(p)}`).toBe(1)
      }
    }
  })
  it('kararların bilinen sonuçları', () => {
    // 1: hepsi markete fazla, hiç markete gitmemek tüccar fiyatı; en iyisi arada
    expect(stars(1, { market: 70 })).toBe(3)
    expect(stars(1, { market: 100 })).toBeLessThan(2)
    expect(stars(1, { market: 0 })).toBe(0)
    // 2: tam avans kasayı boşaltır, az avans üyeyi kaçırır, kredisiz orta yol en iyisi
    expect(stars(2, { avans: 50, kredi: 0 })).toBe(3)
    expect(stars(2, { avans: 100, kredi: 0 })).toBe(0)
    expect(stars(2, { avans: 30, kredi: 0 })).toBe(0)
    expect(stars(2, { avans: 100, kredi: 1 })).toBeLessThan(3)
    // 3: üç ay; dört ayda yem bozulur, beş ayda kasa yetmez
    expect(stars(3, { ay: 3 })).toBe(3)
    expect(stars(3, { ay: 4 })).toBeLessThan(2)
    expect(stars(3, { ay: 5 })).toBe(0)
    // 4: analiz tek arıcıya pahalı; dört arıcı alıcının sınırına tam oturur
    expect(stars(4, { arici: 4, analiz: 1 })).toBe(3)
    expect(stars(4, { arici: 1, analiz: 1 })).toBe(0)
    expect(stars(4, { arici: 4, analiz: 0 })).toBe(0)
    // 5: kötü yılda borcu ödeyecek kadar sözleşme; fazlası iyi yılın kazancını kısar
    for (const iyi of [0, 1]) {
      expect(stars(5, { soz: 50, iyi })).toBe(3)
      expect(stars(5, { soz: 0, iyi })).toBe(0)
      expect(stars(5, { soz: 100, iyi })).toBe(1)
    }
  })
})

describe('deneme bedeli ve tahmin', () => {
  it('3 yıldız yalnız ilk denemede; sonra en fazla 2, bölüm hep geçilebilir', async () => {
    const { capStars } = await import('../src/chapter/engine')
    expect(capStars(3, 1)).toBe(3)
    expect(capStars(3, 2)).toBe(2)
    expect(capStars(3, 9)).toBe(2)
    expect(capStars(1, 5)).toBe(1)
  })
  it('bölüm 2: tahminin doğru cevabı kasanın Ocak durumudur; zincir sonucu anlatır', () => {
    const c = ch(2)
    expect(c.decision.predict!.answer({ avans: 50, kredi: 0 })).toBe(true)
    expect(c.decision.predict!.answer({ avans: 80, kredi: 0 })).toBe(false)
    const r = c.result('karar', { avans: 80, kredi: 0 })
    expect(r.chain!.some((l) => l.ok === false && l.label.includes('tamir'))).toBe(true)
  })
})

describe('her bölümde tahmin ve neden-sonuç zinciri', () => {
  it('bütün ayarlarda tahmin cevaplanır ve zincir sonucu anlatır', () => {
    for (const c of ALL) {
      expect(c.decision.predict, `${c.title}: tahmin`).toBeTruthy()
      for (const p of every(c)) {
        expect(typeof c.decision.predict!.answer(p), c.title).toBe('boolean')
        const r = c.result('karar', p)
        expect(r.chain?.length ?? 0, `${c.title} ${JSON.stringify(p)}`).toBeGreaterThan(0)
        for (const l of r.chain!) expect(l.value.includes('NaN') || l.value.includes('undefined'), `${c.title}: ${l.label}`).toBe(false)
      }
    }
  })
  it('tahminin doğru cevabı ayara göre değişir (ezbere evet/hayır yok)', () => {
    for (const c of ALL) {
      const answers = new Set(every(c).map((p) => c.decision.predict!.answer(p)))
      expect(answers.size, c.title).toBe(2)
    }
  })
})
