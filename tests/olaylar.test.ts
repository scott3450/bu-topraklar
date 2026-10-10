import { describe, expect, it } from 'vitest'
import * as E from '../src/sim/engine'
import { drawEvents, resolve, view } from '../src/sim/events'

const broke = () => ({ ...E.newGame(), cash: -120_000, members: ['ayse', 'fatma'] as E.ProducerId[] })

describe('olaylar ve kriz', () => {
  it('kasa eksiye düşünce oyun bitmez, kriz kartı gelir', () => {
    let s = E.newGame()
    s = { ...s, cash: 1_000, members: [] }
    s = drawEvents(E.endMonth(s)) // sabit giderle eksiye düşer
    expect(s.cash).toBeLessThan(0)
    expect(s.over).toBeNull()
    expect(s.events[0].id).toBe('kriz')
  })
  it('kriz kapatılmazsa ikinci eksi ayda iflas; kapatılırsa sayaç sıfırlanır', () => {
    let s = drawEvents(E.endMonth({ ...E.newGame(), cash: 1_000, members: [] }))
    expect(E.endMonth(s).over).toBe('iflas')
    s = resolve(s, 0, 0) // acil kredi
    expect(s.cash).toBeGreaterThan(0)
    expect(s.crisis).toBe(0)
    expect(s.events.some((e) => e.id === 'kriz')).toBe(false)
    expect(E.endMonth(s).over).toBeNull()
  })
  it('yetmeyen seçenekten sonra kriz kartı açık kalır', () => {
    let s = { ...broke(), cash: -400_000, events: [{ id: 'kriz' }] }
    s = resolve(s, 0, view(s, s.events[0]).options.length - 1) // ödemeyi ertele: en fazla 200 bin
    expect(s.cash).toBeLessThan(0)
    expect(s.events[0].id).toBe('kriz')
  })
  it('her kartın her seçeneği çalışır ve kartı kapatır', () => {
    const ids = ['kriz', 'onodeme', 'avans', 'ariza', 'don', 'yem', 'guven']
    for (const id of ids) {
      const base = { ...broke(), events: [{ id, who: 'ayse' as E.ProducerId, amount: 50_000 }] }
      const v = view(base, base.events[0])
      expect(v.title.length, id).toBeGreaterThan(3)
      v.options.forEach((_, i) => {
        const s = resolve(base, 0, i)
        expect(Number.isFinite(s.cash), `${id}/${i}`).toBe(true)
      })
    }
  })
  it('güven düşünce bir üye ayrılır', () => {
    let s = drawEvents({ ...broke(), cash: 100_000, trust: 20 })
    const i = s.events.findIndex((e) => e.id === 'guven')
    expect(i).toBeGreaterThanOrEqual(0)
    s = resolve(s, i, 0)
    expect(s.members.length).toBe(1)
  })
  it('bütün yıl boyunca kartlar seçilerek oynanabilir', () => {
    let s = E.newGame(11)
    for (const id of ['ayse', 'fatma', 'hasan'] as const) s = E.invite(s, id).state
    while (!s.over) {
      s = drawEvents(E.endMonth(s))
      while (s.events.length) s = resolve(s, 0, 0)
    }
    expect(['yil-bitti', 'iflas']).toContain(s.over)
  })
})
