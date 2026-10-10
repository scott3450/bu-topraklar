import { describe, expect, it } from 'vitest'
import * as E from '../src/sim/engine'

function play(plan: (s: E.State) => E.State) {
  let s = E.newGame()
  while (!s.over) s = E.seeCards(E.endMonth(plan(s)))
  return s
}

describe('simülasyon dengesi', () => {
  it('hiçbir şey yapmayan kooperatif eriyerek yılı bitirir', () => {
    const s = play((s) => s)
    expect(s.over).toBe('yil-bitti')
    expect(E.valueCreated(s)).toBeLessThan(0)
  })
  it('akıllı oyun + kredi yılı artıda bitirir', () => {
    const s = play((s) => {
      if (s.month === 0) {
        s = E.borrow(s)
        s = E.buy(s, 'dolum')
        s = E.buy(s, 'analiz')
        s = E.setBulkFeed(s, true)
        for (const id of ['ayse', 'mehmet', 'fatma', 'hasan'] as const) s = E.invite(s, id).state
        s = E.setOilChannel(s, 'market')
        s = E.setHoneyChannel(s, 'kooperatif')
      }
      if (s.month === 5) s = E.signContract(s)
      return s
    })
    expect(s.over).toBe('yil-bitti')
    expect(E.valueCreated(s)).toBeGreaterThan(100_000)
  })
  it('kredisiz agresif oyun nakitsiz kalır (vade dersi); kriz oyunu hemen bitirmez', () => {
    const s = play((s) => {
      if (s.month === 0) {
        s = E.buy(s, 'dolum')
        s = E.buy(s, 'analiz')
        s = E.setBulkFeed(s, true)
        for (const id of ['ayse', 'mehmet', 'fatma'] as const) s = E.invite(s, id).state
        s = E.setOilChannel(s, 'market')
      }
      return s
    })
    expect(Math.min(...s.history)).toBeLessThan(0) // kâr gelecek ama kasa bir ara eksiye düşer
    const firstNeg = s.history.findIndex((c) => c < 0)
    expect(s.history.length).toBeGreaterThan(firstNeg + 1) // ilk eksi ayda oyun bitmedi
  })
  it('değer kalemlerinin toplamı yaratılan değere eşit', () => {
    const s = play((s) => s)
    const sum = E.valueParts(s).reduce((a, x) => a + x.amount, 0)
    expect(Math.round(sum)).toBe(Math.round(E.valueCreated(s)))
  })
})
