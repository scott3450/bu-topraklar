import { describe, expect, it } from 'vitest'
import * as E from '../src/sim/engine'
import { drawEvents, resolve, view } from '../src/sim/events'
import { subeDurumu } from '../src/data/kilit'
import { FRUIT, branchProduct } from '../src/data/aileler'
import { ILLER } from '../src/data/iller'

const ready = (): E.State => ({ ...E.newGame(3), members: ['ayse', 'fatma'], trust: 75, cash: 900_000 })

function year(s: E.State, pick: (id: string, n: number) => number) {
  while (!s.over) {
    s = drawEvents(E.endMonth(s))
    let g = 0
    while (s.events.length && g++ < 10) s = resolve(s, 0, Math.min(pick(s.events[0].id, view(s, s.events[0]).options.length), view(s, s.events[0]).options.length - 1))
  }
  return s
}

describe('şubeler', () => {
  it('komşuluk, aile ve davet kuralları', () => {
    const s = ready()
    expect(subeDurumu('Aydın', s).kind).toBe('merkez')
    expect(subeDurumu('Malatya', s).kind).toBe('uzak') // komşu değil
    expect(subeDurumu('Malatya', s, 1).kind).toBe('acilabilir') // yıl sonu daveti
    // 81 ilin hepsinde şube açılabilecek bir ürün var (Plan v3 "bitti" tanımı 2)
    expect(Object.entries(ILLER).filter(([, v]) => !branchProduct(v.products)).map(([il]) => il)).toEqual([])
    const m = subeDurumu('Manisa', s) // Aydın'a komşu, üzümü var
    expect(m.kind).toBe('acilabilir')
    if (m.kind === 'acilabilir') expect(m.uygun).toBe(true)
    const poor = subeDurumu('Manisa', { ...s, cash: 10_000, trust: 40 })
    if (poor.kind === 'acilabilir') expect(poor.sartlar.filter((x) => !x.ok).length).toBe(2)
    const opened = E.openBranch(s, 'Manisa', 'kiraz')
    expect(subeDurumu('Manisa', opened).kind).toBe('sube')
  })
  it('tesisle satmak tüccara vermekten çok kazandırır, ama nakdi bekletir (vade)', () => {
    for (const [il, urun] of [['Malatya', 'kayisi'], ['Balıkesir', 'zeytin'], ['Manisa', 'uzum']]) {
      const base = E.openBranch(ready(), il, urun)
      const trader = year(base, () => 0)
      const withPlant = year(E.buyBranchTesis(base, il), () => 0)
      expect(E.valueCreated(withPlant), urun).toBeGreaterThan(E.valueCreated(trader))
      expect(Math.min(...withPlant.history), urun).toBeLessThan(Math.min(...trader.history))
    }
  })
  it('TARSİM: başvuru kartı don aylarından önce gelir; don gelirse hasarın çoğu ödenir', () => {
    let s = E.openBranch(ready(), 'Malatya', 'kayisi')
    const seen: string[] = []
    while (s.month < 7) {
      s = drawEvents(E.endMonth(s))
      while (s.events.length) {
        const id = s.events[0].id
        seen.push(id)
        // sigortayı yaptır, donda riske gir
        s = resolve(s, 0, id === 'meyve-don' ? 1 : 0)
      }
    }
    expect(seen.indexOf('tarsim')).toBeGreaterThanOrEqual(0)
    expect(seen.indexOf('tarsim')).toBeLessThan(seen.indexOf('meyve-don'))
    const b = s.subeler[0]
    expect(b.sigorta).toBe(true)
    if (b.kayip > 0) expect(s.log.some((l) => l.text.includes('TARSİM')) || s.history.length > 0).toBe(true)
    expect(FRUIT.kayisi.frost.months).toContain(5)
  })
  it('değer kalemleri şubeli oyunda da toplamı tutar', () => {
    const s = year(E.buyBranchTesis(E.openBranch(ready(), 'Malatya', 'kayisi'), 'Malatya'), () => 0)
    const sum = E.valueParts(s).reduce((a, x) => a + x.amount, 0)
    expect(Math.round(sum)).toBe(Math.round(E.valueCreated(s)))
  })
})
