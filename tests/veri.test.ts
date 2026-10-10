import { describe, expect, it } from 'vitest'
import provinces from '../src/data/provinces.json'
import { FACTS, ILLER } from '../src/data/iller'
import { URUNLER } from '../src/data/urunler'
import { SIMGELI } from '../src/ui/UrunSimge'
import { ilPlan } from '../src/scene/ilgen'

const names = (provinces as { name: string }[]).map((p) => p.name)

describe('il verisi', () => {
  it('81 ilin hepsi haritadaki adla eşleşir', () => {
    expect(names).toHaveLength(81)
    for (const n of names) expect(ILLER[n], n).toBeTruthy()
    expect(Object.keys(ILLER)).toHaveLength(81)
  })
  it('her ürün katalogda var ve simgesi var', () => {
    for (const [il, d] of Object.entries(ILLER)) for (const u of d.products) expect(URUNLER[u], `${il}: ${u}`).toBeTruthy()
    for (const id of Object.keys(URUNLER)) expect(SIMGELI, `${id} simgesi`).toContain(id)
  })
  it('kaynaklı her rakam o ilin ürün listesindeki bir ürüne ait (yoksa kartta görünmez)', () => {
    for (const [il, d] of Object.entries(FACTS)) {
      expect(ILLER[il], il).toBeTruthy()
      for (const [u, f] of Object.entries(d)) {
        expect(ILLER[il].products, `${il}: ${u}`).toContain(u)
        expect(f.url.startsWith('https://'), `${il}/${u} kaynak linki`).toBe(true)
      }
    }
  })
  it('81 ilin sahne planı üretilir; baskın ürün sahnede var', () => {
    for (const n of names) {
      const p = ilPlan(n)
      expect(p.plots.length, n).toBeGreaterThan(3)
      expect(p.plots.some((q) => q.urun === ILLER[n].products[0]), n).toBe(true)
      expect(p.climate.length, n).toBeGreaterThan(20)
    }
  })
})

describe('iklim yazıları', () => {
  it('iç ova illerine yayla yazısı düşmez', () => {
    expect(ilPlan('Manisa').climate).not.toMatch(/yayla/)
    expect(ilPlan('Osmaniye').climate).not.toMatch(/yayla/)
    expect(ilPlan('Isparta').climate).toMatch(/yayla/)
  })
})
