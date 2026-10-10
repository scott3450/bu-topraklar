import { describe, expect, it } from 'vitest'
import * as E from '../src/sim/engine'
import { ilDurum, ilYonelme } from '../src/data/kilit'

const yearOf = (s: E.State) => {
  while (!s.over) s = E.endMonth(s)
  return s
}

describe('yıl sonu ve köy', () => {
  it('yeni yıl: kasa, üyeler, yatırım ve borç devam eder; takvim ve kayıtlar sıfırlanır', () => {
    let s = E.newGame()
    s = E.invite(s, 'ayse').state
    s = E.buy(s, 'analiz')
    s = E.borrow(s)
    s = yearOf(s)
    expect(s.over).toBe('yil-bitti')
    const n = E.newYear(s)
    expect(n.year).toBe(2)
    expect(n.month).toBe(0)
    expect(n.over).toBeNull()
    expect(n.cash).toBe(s.cash)
    expect(n.members).toEqual(s.members)
    expect(n.invest.analiz).toBe(true)
    expect(n.debt).toBe(s.debt)
    expect(n.history).toEqual([])
    expect(n.prevValue).toBeCloseTo(E.valueCreated(s))
    expect(n.receivables.every((r) => r.due < 12)).toBe(true)
    // ikinci yıl da oynanır ve biter
    expect(yearOf(n).over).not.toBeNull()
  })
  it('köy oyunun durumuyla büyür', () => {
    let s = E.newGame()
    expect(E.growth(s)).toEqual([1]) // Ayşe Teyze baştan üye: depo var
    s = E.invite(s, 'ayse').state
    s = E.buy(s, 'dolum')
    expect(E.growth(s)).toEqual(expect.arrayContaining([1, 6]))
    expect(E.growth({ ...s, trust: 90, members: ['ayse', 'fatma'] })).toContain(7)
  })
  it('yıl sonu illeri sırayla açılır; il adına doğru yönelme eki', () => {
    for (const [il, ek] of [['Malatya', "Malatya'ya"], ['Rize', "Rize'ye"], ['Ordu', "Ordu'ya"], ['Muş', "Muş'a"], ['Erzurum', "Erzurum'a"], ['İzmir', "İzmir'e"]]) expect(ilYonelme(il)).toBe(ek)
    expect(ilDurum('Malatya', [], 0).kind).toBe('kilitli-yil')
    expect(ilDurum('Malatya', [], 1).kind).toBe('acik')
    expect(ilDurum('Rize', [], 1).kind).toBe('kilitli-yil')
    expect(ilDurum('Rize', [], 2).kind).toBe('acik')
    expect(ilDurum('Aydın', [], 0).kind).toBe('acik')
    expect(ilDurum('Konya', [], 3).kind).toBe('kilitli-yil')
    expect(ilDurum('Konya', [], 4).kind).toBe('acik')
    expect(ilDurum('Antalya', [], 5).kind).toBe('acik')
    expect(ilDurum('Şanlıurfa', [], 6).kind).toBe('acik')
    expect(ilDurum('Erzurum', [], 7).kind).toBe('acik')
    expect(ilDurum('Kars', [], 7).kind).toBe('kesif')
  })
})

import { bolgeler, finalReady, regionOf } from '../src/data/final'
import { ILLER } from '../src/data/iller'

describe('bölge hedefi ve final', () => {
  it('her ilin bölgesi var; final yedi bölgede kooperatif olunca açılır (Aydın merkez Ege sayılır)', () => {
    for (const il of Object.keys(ILLER)) expect(regionOf(il), il).toBeTruthy()
    expect(bolgeler([]).filter((b) => b.iller.length).map((b) => b.id)).toEqual(['ege'])
    const six = ['Konya', 'Antalya', 'Rize', 'Erzurum', 'Şanlıurfa']
    expect(finalReady(six)).toBe(false) // Marmara eksik
    expect(finalReady([...six, 'Balıkesir'])).toBe(true)
  })
})
