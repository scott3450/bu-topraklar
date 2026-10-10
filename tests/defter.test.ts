import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TERIMLER } from '../src/defter/terimler'
import { plain } from '../src/defter/Term'

describe('defter', () => {
  it('metinlerdeki her [[terim|…]] işaretinin Defter karşılığı var', () => {
    const dir = new URL('../src/chapter/', import.meta.url)
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
      for (const m of readFileSync(new URL(f, dir), 'utf8').matchAll(/\[\[([\w-]+)\|/g)) expect(TERIMLER[m[1]], `${f}: ${m[1]}`).toBeTruthy()
    }
  })
  it('her terimin tanımı ve oyundan örneği var', () => {
    for (const t of Object.values(TERIMLER)) {
      expect(t.def.length, t.id).toBeGreaterThan(20)
      expect(t.example.length, t.id).toBeGreaterThan(20)
    }
    expect(plain('Market [[vade|vadeyle]] öder')).toBe('Market vadeyle öder')
  })
})

describe('terim kartı sırası', () => {
  it('kart açıkken gelen terim sıraya girer, kapanınca açılır; ekrandan çıkan atlanır', async () => {
    const { useDefter } = await import('../src/defter/store')
    const d = () => useDefter.getState()
    const offA = d().mount('araci')
    d().meet('araci')
    expect(d().open).toEqual({ id: 'araci', auto: true })
    const offV = d().mount('vade')
    d().meet('vade')
    const offZ = d().mount('deger-zinciri')
    d().meet('deger-zinciri')
    expect(d().open?.id).toBe('araci')
    offZ() // değer zinciri ekrandan çıktı
    d().close()
    expect(d().open).toEqual({ id: 'vade', auto: true })
    d().close()
    expect(d().open).toBeNull()
    expect(d().seen).toEqual(['araci', 'vade', 'deger-zinciri'])
    d().meet('vade') // ikinci görüşte kendiliğinden açılmaz
    expect(d().open).toBeNull()
    d().show('vade')
    expect(d().open).toEqual({ id: 'vade', auto: false })
    offV() // açık kartın terimi ekrandan çıkınca kart kapanır
    expect(d().open).toBeNull()
    offA()
  })
})
