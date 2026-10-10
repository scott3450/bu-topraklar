import { describe, expect, it } from 'vitest'
import * as E from '../src/sim/engine'
import { drawEvents, resolve, view } from '../src/sim/events'

type Plan = (s: E.State) => E.State
type Pick = (s: E.State, id: string, n: number) => number

const plans: Record<string, Plan> = {
  pasif: (s) => s,
  duz: (s) => (s.month === 0 ? E.invite(E.setBulkFeed(s, true), 'fatma').state : s),
  tuccar: (s) => (s.month === 0 ? E.invite(s, 'ayse').state : s),
  akilli_kredi: (s) => {
    if (s.month === 0) {
      s = E.borrow(s); s = E.buy(s, 'dolum'); s = E.buy(s, 'analiz'); s = E.setBulkFeed(s, true)
      for (const id of ['ayse', 'mehmet', 'fatma', 'hasan'] as const) s = E.invite(s, id).state
      s = E.setOilChannel(s, 'market'); s = E.setHoneyChannel(s, 'kooperatif')
    }
    if (s.month === 5) s = E.signContract(s)
    return s
  },
  akilli_zamanli: (s) => {
    // krediyi ihtiyaç ayında al, market parası gelince öde
    if (s.month === 0) {
      s = E.buy(s, 'dolum'); s = E.buy(s, 'analiz'); s = E.setBulkFeed(s, true)
      for (const id of ['ayse', 'mehmet', 'fatma', 'hasan'] as const) s = E.invite(s, id).state
      s = E.setOilChannel(s, 'market'); s = E.setHoneyChannel(s, 'kooperatif')
    }
    if (s.month === 5) s = E.signContract(s)
    if (s.debt === 0 && E.endMonth(s).cash < 60_000) s = E.borrow(s)
    if (s.debt > 0 && s.cash > 450_000) s = E.repay(s)
    return s
  },
  akilli_kredisiz: (s) => {
    if (s.month === 0) {
      s = E.buy(s, 'dolum'); s = E.buy(s, 'analiz'); s = E.setBulkFeed(s, true)
      for (const id of ['ayse', 'mehmet', 'fatma', 'hasan'] as const) s = E.invite(s, id).state
      s = E.setOilChannel(s, 'market'); s = E.setHoneyChannel(s, 'kooperatif')
    }
    if (s.month === 5) s = E.signContract(s)
    return s
  },
  hepsini_al: (s) => {
    if (s.month === 0) {
      s = E.buy(s, 'dolum'); s = E.buy(s, 'tank'); s = E.buy(s, 'analiz')
      for (const id of ['ayse', 'mehmet', 'fatma'] as const) s = E.invite(s, id).state
      s = E.setOilChannel(s, 'market')
    }
    return s
  },
}

let rnd = 1
const rand = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647)
const picks: Record<string, Pick> = {
  ilk: () => 0,
  son: (_s, _id, n) => n - 1,
  rastgele: (_s, _id, n) => Math.floor(rand() * n),
  akilli: (s, id, n) => {
    if (id === 'avans') return s.cash > 250_000 ? 0 : 1
    if (id === 'onodeme') return 1
    if (id === 'ariza') return 0
    if (id === 'don') return 0
    if (id === 'yem') return 0
    if (id === 'kriz') return 0
    return Math.min(0, n - 1)
  },
}

function play(plan: Plan, pick: Pick, seed: number) {
  let s = E.newGame(seed)
  let crises = 0
  while (!s.over) {
    s = drawEvents(E.endMonth(plan(s)))
    let guard = 0
    while (s.events.length && guard++ < 10) {
      const e = s.events[0]
      if (e.id === 'kriz') crises++
      const n = view(s, e).options.length
      s = resolve(s, 0, Math.min(pick(s, e.id, n), n - 1))
    }
  }
  return { over: s.over, value: E.valueCreated(s), minCash: Math.min(...s.history), crises, trust: s.trust, members: s.members.length }
}

const avg = (plan: string, pick: string, n = 30) => {
  const R = Array.from({ length: n }, (_, i) => play(plans[plan], picks[pick], i + 1))
  const v = R.map((r) => r.value)
  return { mean: v.reduce((a, b) => a + b, 0) / n, min: Math.min(...v), max: Math.max(...v), crisis: R.filter((r) => r.crises > 0).length / n }
}

// Denge sözleşmesi (10-06 denge turu): oyunun öğrettiği sıralama bozulmasın.
describe('denge', () => {
  const zamanli = avg('akilli_zamanli', 'akilli')
  const kredisiz = avg('akilli_kredisiz', 'akilli')
  const pasif = avg('pasif', 'akilli')
  const hepsi = avg('hepsini_al', 'akilli')
  it('planlı kredi > krizde kurtarma > hiçbir şey yapmamak > her şeyi birden almak', () => {
    expect(zamanli.mean).toBeGreaterThan(kredisiz.mean)
    expect(kredisiz.mean).toBeGreaterThan(pasif.mean)
    expect(pasif.mean).toBeGreaterThan(hepsi.mean)
    expect(zamanli.crisis).toBe(0)
  })
  it('iyi oyun şansa çok bağlı değil: en kötü tohumda bile artıda, yayılım sınırlı', () => {
    expect(zamanli.min).toBeGreaterThan(0)
    expect(zamanli.max - zamanli.min).toBeLessThan(250_000)
  })
  it('düz oyun (iki üye, tüccara toplu satış) hafif kârla biter; hiçbir şey yapmamak hafif zarar', () => {
    const duz = avg('duz', 'akilli')
    expect(duz.mean).toBeGreaterThan(0)
    expect(pasif.mean).toBeLessThan(0)
    expect(pasif.mean).toBeGreaterThan(-200_000)
  })
  it('kartlarda düşünerek seçmek, ilk seçeneği seçmekten iyi', () => {
    expect(zamanli.mean).toBeGreaterThan(avg('akilli_zamanli', 'ilk').mean)
  })
})
