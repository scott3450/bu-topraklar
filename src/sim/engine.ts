// Simülasyon: düz TypeScript, 3D'den bağımsız. Durum değişmez; her işlem yeni durum döndürür.
import { HAL_CUT, HAL_CUT_COOP, HAL_SWING, IADE_PRICE, VEG, vegDecares, DEPO_MONTHS, DEPO_RENT, ELUS_LOAN, FACTORY, FRUIT, GRAIN, RENT_SUPPORT, SUBE_COST, SUBE_FIXED, TARSIM_RATE, TARSIM_SUPPORT, decaresOf, factoryDecares, grainDecares, riskMonths } from '../data/aileler'
import {
  ADVANCE, BULK_PREMIUM, COOP_FEE, MILK_BULK, COST_INFLATION, DEPRECIATION, DIRECT_MONTHLY, DIRECT_SHIP, FIXED_MONTHLY, HONEY, INVEST, LOAN_RATE, LOAN_STEP, MILK, OLIVE,
  START_CASH, TOMATO, TRADER_INFLATION, type InvestId,
} from './config'

export type ProducerId = 'ayse' | 'mehmet' | 'fatma' | 'hasan'
export type OilChannel = 'tuccar' | 'market' | 'dogrudan'
export type HoneyChannel = 'tuccar' | 'kooperatif' | 'dogrudan'
export type TomatoChannel = 'hal' | 'fabrika'

export type Line = { label: string; amount: number }
/** Komşu ilde açılan şube: tek kasa, ürün ailesinin kuralları (data/aileler.ts). */
export type Branch = {
  il: string
  urun: string
  kanal: 'tuccar' | 'tesis' | 'kurum' | 'ozel' | 'depo' | 'hal' // meyve: tüccar/tesis · fabrika: kurum/özel · tahıl: tüccar/kurum/depo · sebze: hal/kurum
  tesis: boolean
  sigorta: boolean
  kayip: number
  kotaCut?: number // bu yıl kurumun kontenjanını düşürdüğü pay
  kesinti?: number // bu yıl kalite kesintisi (geç toplanan yaprak)
  iade?: boolean // bu yıl ihracat partisi kalıntıdan döner (sebze)
  itu?: boolean // bu yıl iyi tarım ve ön analiz yapıldı
}
export type Receivable = { amount: number; due: number; label: string; payout?: Line }

export type State = {
  month: number // 0 = Ekim … 11 = Eylül
  cash: number
  debt: number
  members: ProducerId[]
  asked: ProducerId[]
  invest: Record<InvestId, boolean>
  bulkFeed: boolean
  contract: boolean
  oilChannel: OilChannel
  honeyChannel: HoneyChannel
  stock: { oil: number; honey: number } // kg, kooperatif deposunda
  owed: { oil: number; honey: number } // TL, üyeye satıştan sonra ödenecek kalan
  receivables: Receivable[]
  costIdx: number
  traderIdx: number
  memberExtra: number // üyelere doğrudan geçen ek kazanç (ucuz yem, sözleşme farkı)
  seed: number
  lastReport: { month: number; lines: Line[]; notes: string[]; profit?: number; cashDelta?: number; fee?: number } | null
  sold: number // bu yıl kooperatif üzerinden satılan ürünün tutarı (yıl hedefi için)
  cardsSeen: string[]
  newCards: string[]
  history: number[] // her ay sonu kasa
  log: { month: number; text: string }[] // önemli kararlar
  over: null | 'iflas' | 'yil-bitti'
  trust: number // üyelerin kooperatife güveni, 0–100; düşerse üye ayrılır
  crisis: number // kasa üst üste kaç aydır eksi (2 olunca iflas)
  events: { id: string; who?: ProducerId; amount?: number; il?: string }[] // ay sonu olay kartları (sim/events.ts)
  subeler: Branch[]
  evDone: string[] // yılda bir kez gelen olaylar
  year: number // kaçıncı yıl (1'den)
  prevValue: number // önceki yılların sonunda yaratılmış toplam değer (bu yılın payını ayırmak için)
}

export function newGame(seed = 7): State {
  return {
    month: 0,
    cash: START_CASH,
    debt: 0,
    members: ['ayse'], // Bölüm 1'den tanışıyorsunuz: ilk üye baştan var
    asked: ['ayse'],
    invest: { dolum: false, tank: false, analiz: false },
    bulkFeed: false,
    contract: false,
    oilChannel: 'tuccar',
    honeyChannel: 'tuccar',
    stock: { oil: 0, honey: 0 },
    owed: { oil: 0, honey: 0 },
    receivables: [],
    costIdx: 1,
    traderIdx: 1,
    memberExtra: 0,
    seed,
    lastReport: null,
    cardsSeen: [],
    newCards: ['araci-farki'],
    history: [],
    log: [],
    over: null,
    trust: 70,
    crisis: 0,
    events: [],
    evDone: [],
    year: 1,
    prevValue: 0,
    subeler: [],
    sold: 0,
  }
}

const clone = (s: State): State => structuredClone(s)
const isMember = (s: State, id: ProducerId) => s.members.includes(id)
const note = (s: State, text: string) => s.log.push({ month: s.month, text })

export const NAMES: Record<ProducerId, string> = {
  ayse: 'Ayşe Teyze',
  mehmet: 'Mehmet Amca',
  fatma: 'Fatma Abla',
  hasan: 'Hasan Dayı',
}

// deterministik rastgele (mulberry32)
export function rand(s: State) {
  let t = (s.seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// ── Kararlar ───────────────────────────────────────────────

export const CONDITIONS: Record<ProducerId, string> = {
  ayse: '',
  mehmet: 'Sahte balla aynı fiyata satmaktan bıktım. Balım analizli satılırsa girerim.',
  fatma: 'Yem beni bitiriyor. Yemi topluca, ucuza alırsanız girerim.',
  hasan: 'Halde domates para etmiyor. Mart ya da Nisan\'da fabrikayla sözleşme yaparsanız girerim.',
}

function conditionMet(s: State, id: ProducerId) {
  if (id === 'mehmet') return s.invest.analiz
  if (id === 'fatma') return s.bulkFeed
  if (id === 'hasan') return s.contract
  return true
}

/** Davet: şart sağlanıyorsa üye olur; değilse şartını söyler. */
export function invite(s0: State, id: ProducerId): { state: State; joined: boolean; reply: string } {
  const s = clone(s0)
  if (!s.asked.includes(id)) s.asked.push(id)
  if (conditionMet(s, id)) {
    if (!isMember(s, id)) {
      s.members.push(id)
      note(s, `${NAMES[id]} kooperatife katıldı`)
    }
    return { state: s, joined: true, reply: 'Hayırlı olsun, varım.' }
  }
  return { state: s, joined: false, reply: CONDITIONS[id] }
}

// Şartı sonradan sağlanan, daha önce sorulmuş üretici kendiliğinden katılır.
function autoJoin(s: State) {
  for (const id of s.asked)
    if (!isMember(s, id) && conditionMet(s, id)) {
      s.members.push(id)
      note(s, `${NAMES[id]} şartı sağlanınca katıldı`)
    }
}

export function buy(s0: State, id: InvestId): State {
  const s = clone(s0)
  if (s.invest[id]) return s
  s.cash -= Math.round(INVEST[id].cost * s.costIdx)
  s.invest[id] = true
  note(s, `${INVEST[id].name} alındı`)
  if (id === 'tank') s.newCards.push('soguk-zincir')
  if (id === 'analiz') s.newCards.push('guven')
  autoJoin(s)
  return s
}

export function setBulkFeed(s0: State, on: boolean): State {
  const s = clone(s0)
  s.bulkFeed = on
  note(s, on ? 'Ortak yem alımı başladı' : 'Ortak yem alımı durdu')
  if (on) s.newCards.push('toplu-alim')
  autoJoin(s)
  return s
}

export function canSignContract(s: State) {
  return !s.contract && TOMATO.contractMonths.includes(s.month)
}

export function signContract(s0: State): State {
  const s = clone(s0)
  if (!canSignContract(s)) return s
  s.contract = true
  note(s, 'Fabrikayla domates sözleşmesi imzalandı')
  s.newCards.push('sozlesmeli')
  if (!s.asked.includes('hasan')) s.asked.push('hasan')
  autoJoin(s)
  return s
}

export function setOilChannel(s0: State, c: OilChannel): State {
  if (s0.oilChannel === c) return s0
  const s = clone(s0)
  s.oilChannel = c
  note(s, `Yağ kanalı: ${({ tuccar: 'tüccar', market: 'market', dogrudan: 'doğrudan' } as const)[c]}`)
  return s
}

export function setHoneyChannel(s0: State, c: HoneyChannel): State {
  if (s0.honeyChannel === c) return s0
  const s = clone(s0)
  s.honeyChannel = c
  note(s, `Bal kanalı: ${({ tuccar: 'tüccar', kooperatif: 'analizli toplu', dogrudan: 'doğrudan' } as const)[c]}`)
  return s
}

// ── Şubeler ────────────────────────────────────────────────

export const branchValue = (s: State, b: Branch) => {
  const f = FRUIT[b.urun]
  if (f) return decaresOf(f) * f.kgPerDecare * f.trader * s.traderIdx
  const G = GRAIN[b.urun]
  if (G) return grainDecares(G) * G.kgPerDecare * G.tuccar * s.traderIdx
  const V = VEG[b.urun]
  if (V) return vegDecares(V) * V.kgPerDecare * V.hal * (1 - HAL_CUT) * s.traderIdx
  const F = FACTORY[b.urun]
  return factoryDecares(F) * F.kgPerDecare * F.ozelPrice * s.traderIdx
}
export const tarsimPremium = (s: State, b: Branch) => Math.round(branchValue(s, b) * TARSIM_RATE * (1 - TARSIM_SUPPORT))
/** TARSİM başvurusu don aylarından önce yapılır. */
export const canInsure = (s: State, b: Branch) => {
  const risk = riskMonths(b.urun)
  return !!risk && !b.sigorta && s.month < Math.min(...risk)
}

export function openBranch(s0: State, il: string, urun: string): State {
  if (s0.subeler.some((b) => b.il === il)) return s0
  const s = clone(s0)
  s.cash -= Math.round(SUBE_COST * s.costIdx)
  s.subeler.push({ il, urun, kanal: FACTORY[urun] || GRAIN[urun] ? 'kurum' : VEG[urun] ? 'hal' : 'tuccar', tesis: false, sigorta: false, kayip: 0 })
  note(s, `${il} şubesi açıldı`)
  return s
}

export function setBranch(s0: State, il: string, patch: Partial<Pick<Branch, 'kanal'>>): State {
  const s = clone(s0)
  const b = s.subeler.find((x) => x.il === il)
  if (b) Object.assign(b, patch)
  return s
}

export function buyBranchTesis(s0: State, il: string): State {
  const s = clone(s0)
  const b = s.subeler.find((x) => x.il === il)
  if (!b || b.tesis) return s0
  s.cash -= Math.round(FRUIT[b.urun].tesis.cost * s.costIdx)
  b.tesis = true
  b.kanal = 'tesis'
  note(s, `${il}: ${FRUIT[b.urun].tesis.name} kuruldu`)
  return s
}

export function insureBranch(s0: State, il: string): State {
  const s = clone(s0)
  const b = s.subeler.find((x) => x.il === il)
  if (!b || !canInsure(s, b)) return s0
  s.cash -= tarsimPremium(s, b)
  b.sigorta = true
  note(s, `${il}: TARSİM sigortası yapıldı`)
  return s
}

export function borrow(s0: State): State {
  const s = clone(s0)
  s.cash += LOAN_STEP
  s.debt += LOAN_STEP
  note(s, `${LOAN_STEP.toLocaleString('tr-TR')} TL kredi alındı`)
  s.newCards.push('faiz')
  return s
}

export function repay(s0: State): State {
  const s = clone(s0)
  const amt = Math.min(LOAN_STEP, s.debt)
  if (amt <= 0 || s.cash < amt) return s
  s.cash -= amt
  s.debt -= amt
  note(s, `${amt.toLocaleString('tr-TR')} TL kredi ödendi`)
  return s
}

// ── Ay sonu ────────────────────────────────────────────────

/** Bu ayın domates hal fiyatı: oynaklık + aynı ay satılan miktara göre doygunluk. */
function halPrice(s: State, tons: number) {
  const swing = 1 + (rand(s) * 2 - 1) * TOMATO.halSwing
  return halExpected(s, tons) * swing
}
/** Oynaklıksız hal fiyatı: sözleşmenin değeri buna göre ölçülür (sözleşmenin işi oynaklıktan korumak). */
function halExpected(s: State, tons: number) {
  const sat = Math.max(0.25, 1 - Math.floor(tons / TOMATO.halSaturationTons) * TOMATO.halSaturationDrop)
  return TOMATO.halPrice * s.costIdx * sat
}

export function endMonth(s0: State): State {
  const s = clone(s0)
  const m = s.month
  const lines: Line[] = []
  const notes: string[] = []
  const add = (label: string, amount: number) => {
    if (Math.round(amount) !== 0) lines.push({ label, amount: Math.round(amount) })
    s.cash += amount
  }
  const cards = (id: string) => s.newCards.push(id)
  // depodan kg satılınca üyeye kalan payın orantılı kısmı
  const settle = (kind: 'oil' | 'honey', kg: number): number => {
    const pay = s.stock[kind] > 0 ? (s.owed[kind] * kg) / s.stock[kind] : 0
    s.owed[kind] -= pay
    return pay
  }

  const v0 = valueCreated(s0) - s0.memberExtra // ayın kârı: kooperatifin değerindeki değişim
  let fee = 0
  /** Toplu satış: tüccar fazla öder, kooperatif hizmet payını alır, kalanı üyeye. Döndürdüğü: üyeye ek. */
  const bulk = (label: string, kgValue: number) => {
    const sale = kgValue * (1 + BULK_PREMIUM)
    add(label, sale)
    const f = sale * COOP_FEE
    fee += f
    s.sold += sale
    const extra = sale - f - kgValue // üyeye tüccarın tek tek vereceğinden fazlası
    s.memberExtra += extra
    return extra
  }
  // vadesi gelen alacaklar
  const due = s.receivables.filter((r) => r.due <= m)
  s.receivables = s.receivables.filter((r) => r.due > m)
  for (const r of due) {
    add(r.label, r.amount)
    if (r.payout) add(r.payout.label, r.payout.amount)
  }

  // sabit giderler ve faiz
  add('Depo kirası ve muhasebe', -FIXED_MONTHLY * s.costIdx)
  if (s.debt > 0) add('Kredi faizi', -s.debt * LOAN_RATE)

  // ── Zeytin
  const oliveShare = OLIVE.harvest[m] ?? 0
  if (oliveShare > 0 && isMember(s, 'ayse')) {
    const olive = OLIVE.decares * OLIVE.kgPerDecare * oliveShare
    const oil = olive * OLIVE.oilYield
    const value = oil * OLIVE.traderPrice * s.traderIdx
    add(`Ayşe Teyze'ye yağ avansı (${Math.round(oil)} kg)`, -value * ADVANCE)
    s.owed.oil += value * (1 - ADVANCE)
    s.stock.oil += oil
  }
  if (s.stock.oil > 0) {
    let ch = s.oilChannel
    if ((ch === 'market' || ch === 'dogrudan') && !s.invest.dolum) {
      ch = 'tuccar'
      notes.push('Dolum hattı olmadan yağ şişelenemez; tüccara verildi.')
    }
    if (ch === 'tuccar') {
      const extra = bulk(`Yağ tüccara, toplu (${Math.round(s.stock.oil)} kg)`, s.stock.oil * OLIVE.traderPrice * s.traderIdx)
      add("Ayşe Teyze'ye kalan ödeme", -(settle('oil', s.stock.oil) + extra))
      s.stock.oil = 0
    } else if (ch === 'market') {
      const kg = s.stock.oil
      add(`Şişeleme (${Math.round(kg)} kg)`, -kg * OLIVE.bottlingCost * s.costIdx)
      s.receivables.push({
        amount: kg * OLIVE.chainPrice * s.costIdx,
        due: m + OLIVE.chainDelay,
        label: `Marketten yağ tahsilatı (${Math.round(kg)} kg)`,
        payout: { label: "Ayşe Teyze'ye kalan ödeme", amount: -settle('oil', kg) },
      })
      s.stock.oil = 0
      cards('vade')
    } else {
      const kg = Math.min(s.stock.oil, OLIVE.directCap)
      add(`Yağ doğrudan satış (${Math.round(kg)} kg)`, kg * (OLIVE.directPrice - OLIVE.bottlingCost - DIRECT_SHIP) * s.costIdx)
      add("Ayşe Teyze'ye kalan ödeme", -settle('oil', kg))
      s.stock.oil -= kg
      if (s.stock.oil > 0) notes.push(`Depoda ${Math.round(s.stock.oil)} kg yağ bekliyor.`)
    }
  }

  // ── Bal
  const honeyShare = HONEY.harvest[m] ?? 0
  if (honeyShare > 0 && isMember(s, 'mehmet')) {
    const kg = HONEY.hives * HONEY.kgPerHive * honeyShare
    const value = kg * HONEY.traderPrice * s.traderIdx
    add(`Mehmet Amca'ya bal avansı (${Math.round(kg)} kg)`, -value * ADVANCE)
    s.owed.honey += value * (1 - ADVANCE)
    s.stock.honey += kg
  }
  if (s.stock.honey > 0) {
    let ch = s.honeyChannel
    if (ch === 'kooperatif' && !s.invest.analiz) {
      ch = 'tuccar'
      notes.push('Analizsiz bal toplu alıcıya satılamaz; tüccara verildi.')
    }
    if (ch === 'tuccar') {
      const extra = bulk(`Bal tüccara, toplu (${Math.round(s.stock.honey)} kg)`, s.stock.honey * HONEY.traderPrice * s.traderIdx)
      add("Mehmet Amca'ya kalan ödeme", -(settle('honey', s.stock.honey) + extra))
      s.stock.honey = 0
    } else if (ch === 'kooperatif') {
      add(`Analizli bal toplu satış (${Math.round(s.stock.honey)} kg)`, s.stock.honey * HONEY.coopPrice * s.traderIdx)
      add("Mehmet Amca'ya kalan ödeme", -settle('honey', s.stock.honey))
      s.stock.honey = 0
    } else {
      const kg = Math.min(s.stock.honey, HONEY.directCap)
      add(`Bal doğrudan satış (${Math.round(kg)} kg)`, kg * (HONEY.directPrice - HONEY.packCost - DIRECT_SHIP) * s.costIdx)
      add("Mehmet Amca'ya kalan ödeme", -settle('honey', kg))
      s.stock.honey -= kg
      if (s.stock.honey > 0) notes.push(`Depoda ${Math.round(s.stock.honey)} kg bal bekliyor.`)
    }
  }

  // ── Süt (her ay)
  if (isMember(s, 'fatma')) {
    const litres = (MILK.cows * MILK.kgPerCowYear) / 12
    add(`Fatma Abla'ya süt ödemesi (${Math.round(litres)} lt)`, -litres * MILK.price)
    s.receivables.push({ amount: litres * MILK.price * (1 + MILK_BULK), due: m + 1, label: 'Süt fabrikasından tahsilat (birlik primiyle)' })
    fee += litres * MILK.price * MILK_BULK
    s.sold += litres * MILK.price
    if (s.invest.tank) add('Soğutmalı toplama primi', litres * MILK.tankPremium)
    if (s.bulkFeed) {
      s.memberExtra += litres * MILK.costPerLitre * s.costIdx * MILK.feedShare * MILK.bulkFeedDiscount
    }
  }

  // ── Domates
  const tomShare = TOMATO.harvest[m] ?? 0
  if (tomShare > 0 && isMember(s, 'hasan')) {
    const kg = TOMATO.decares * TOMATO.kgPerDecare * tomShare
    const handling = kg * (TOMATO.pickCost + TOMATO.haulCost) * s.costIdx
    const hp = halPrice(s, kg / 1000)
    const halNet = kg * halExpected(s, kg / 1000) * (1 - TOMATO.commission - TOMATO.halFee - TOMATO.withholding) - handling
    if (s.contract) {
      const factoryNet = kg * TOMATO.factoryPrice - handling
      s.memberExtra += factoryNet - halNet
      notes.push(
        `Domates fabrikaya gitti (${Math.round(kg / 1000)} t). Halde bu ay kilo ${hp.toFixed(2)} TL olacaktı.`,
      )
    }
    if (hp < TOMATO.halPrice * 0.5) cards('doygunluk')
    cards('hal-kesintileri')
  }

  // doğrudan satış kanalı açıksa sabit pazarlama gideri
  const directOn =
    (s.oilChannel === 'dogrudan' && s.invest.dolum && (s.stock.oil > 0 || isMember(s, 'ayse'))) ||
    (s.honeyChannel === 'dogrudan' && (s.stock.honey > 0 || isMember(s, 'mehmet')))
  if (directOn) add('Doğrudan satış: tezgâh, internet, reklam', -DIRECT_MONTHLY * s.costIdx)

  // ── Şubeler
  for (const b of s.subeler) {
    add(`${b.il} şubesi gideri`, -SUBE_FIXED * s.costIdx)
    const V = VEG[b.urun]
    if (V) {
      // sebze ailesi: komisyoncu halde satar (oynak, kesintili, ay sonra öder); alıcı sabit fiyatla siparişini alır, 60 günde öder
      const share = V.harvest[m] ?? 0
      if (share <= 0) continue
      const kg = vegDecares(V) * V.kgPerDecare * share
      const kgA = b.kanal === 'kurum' ? kg * V.kota : 0
      const kgH = kg - kgA
      const halNet = V.hal * (1 + (rand(s) * 2 - 1) * HAL_SWING) * (1 - HAL_CUT_COOP) * s.traderIdx
      const base = kg * V.hal * (1 - HAL_CUT) * s.traderIdx // üyenin tek başına haldeki beklenen geliri
      if (kgH > 0) {
        const value = kgH * halNet
        s.receivables.push({ amount: value, due: m + 1, label: `${b.il}: komisyoncudan hal satışı (${Math.round(kgH / 1000)} t)`, payout: { label: `${b.il}: üreticilere ödeme`, amount: -value * (1 - COOP_FEE) } })
        fee += value * COOP_FEE
        s.sold += value
      }
      if (kgA > 0) {
        const price = b.iade ? IADE_PRICE * s.traderIdx : V.aliciPrice * s.costIdx
        const value = kgA * price
        const adv = kgA * V.hal * (1 - HAL_CUT) * s.traderIdx * ADVANCE
        add(`${b.il}: üreticilere avans (${Math.round(kgA / 1000)} t, ${V.alici})`, -adv)
        s.receivables.push({ amount: value, due: m + 2, label: b.iade ? `${b.il}: kalıntıdan dönen parti, iç piyasa` : `${b.il}: ${V.alici} ödemesi`, payout: { label: `${b.il}: üreticilere kalan`, amount: -(value * (1 - COOP_FEE) - adv) } })
        fee += value * COOP_FEE
        s.sold += value
        if (b.iade) notes.push(`${b.il}: parti kalıntı analizinden döndü, iç piyasaya ucuza gitti.`)
      }
      // üyeye: kooperatifin satışı ile tek başına haldeki beklenen gelir arasındaki fark (hal şansı dahil)
      s.memberExtra += (kgH * halNet + kgA * (b.iade ? IADE_PRICE * s.traderIdx : V.aliciPrice * s.costIdx)) * (1 - COOP_FEE) - base
      continue
    }
    const G = GRAIN[b.urun]
    if (G) {
      // tahıl ailesi: tüccar harmanda ucuz ve peşin; TMO iyi fiyat, 45 günde; lisanslı depo: ELÜS kredisi hemen, satış 3 ay sonra
      const share = G.harvest[m] ?? 0
      if (share <= 0) continue
      const kg = grainDecares(G) * G.kgPerDecare * share * (1 - b.kayip)
      const t = Math.round(kg / 1000)
      const tuc = kg * G.tuccar * s.traderIdx // tüccarın tek tek vereceği
      if (b.kanal === 'kurum') {
        const value = kg * G.kurumPrice * s.costIdx
        const adv = tuc * ADVANCE
        add(`${b.il}: üreticilere avans (${t} t, ${G.kurum})`, -adv)
        s.receivables.push({ amount: value, due: m + G.delay, label: `${b.il}: ${G.kurum} ödemesi`, payout: { label: `${b.il}: üreticilere kalan`, amount: -(value * (1 - COOP_FEE) - adv) } })
        fee += value * COOP_FEE
        s.sold += value
        s.memberExtra += value * (1 - COOP_FEE) - tuc
      } else if (b.kanal === 'depo') {
        const value = kg * G.depoPrice * s.costIdx
        const loan = kg * G.kurumPrice * s.costIdx * ELUS_LOAN
        const rent = kg * DEPO_RENT * (1 - RENT_SUPPORT) * DEPO_MONTHS * s.costIdx
        add(`${b.il}: ELÜS kredisi (${t} t lisanslı depoda)`, loan)
        add(`${b.il}: üreticilere avans (ELÜS kredisinden)`, -loan)
        s.receivables.push({
          amount: value - loan - rent,
          due: m + DEPO_MONTHS,
          label: `${b.il}: depodan satış (kredi ve kira düşüldü)`,
          payout: { label: `${b.il}: üreticilere kalan`, amount: -(value * (1 - COOP_FEE) - loan - rent) },
        })
        fee += value * COOP_FEE
        s.sold += value
        s.memberExtra += value * (1 - COOP_FEE) - rent - tuc
        cards('elus')
      } else {
        const extra = bulk(`${b.il}: ${G.name.toLocaleLowerCase('tr')} tüccara, harmanda (${t} t)`, tuc)
        add(`${b.il}: üreticilere ödeme`, -(tuc + extra))
      }
      if (b.kayip > 0) notes.push(`${b.il}: kuraklıkta ürünün %${Math.round(b.kayip * 100)}'i gitti.`)
      continue
    }
    const F = FACTORY[b.urun]
    if (F) {
      // fabrika ailesi: kotası kadarı kuruma (iyi fiyat, geç ödeme), kalanı özel alıcıya (ucuz, peşin)
      const share = F.harvest[m] ?? 0
      if (share <= 0) continue
      const kg = factoryDecares(F) * F.kgPerDecare * share
      const kota = b.kanal === 'kurum' ? Math.max(0, F.kota - (b.kotaCut ?? 0)) : 0
      const kgK = kg * kota
      const kgO = kg - kgK
      if (kgK > 0) {
        const kurumValue = kgK * F.kurumPrice * s.costIdx * (1 - (b.kesinti ?? 0))
        const adv = kgK * F.ozelPrice * s.traderIdx * ADVANCE
        add(`${b.il}: üreticilere avans (${Math.round(kgK / 1000)} t, ${F.kurum})`, -adv)
        s.receivables.push({
          amount: kurumValue,
          due: m + F.delay,
          label: `${b.il}: ${F.kurum} ödemesi`,
          payout: { label: `${b.il}: üreticilere kalan`, amount: -(kurumValue * (1 - COOP_FEE) - adv) },
        })
        fee += kurumValue * COOP_FEE
        s.sold += kurumValue
        s.memberExtra += kurumValue * (1 - COOP_FEE) - kgK * F.ozelPrice * s.traderIdx // üyenin özel alıcıya göre fazlası
        if (b.kesinti) notes.push(`${b.il}: geç toplanan yaprakta %${Math.round(b.kesinti * 100)} kalite kesintisi.`)
      }
      if (kgO > 0) {
        const value = kgO * F.ozelPrice * s.traderIdx
        const extra = bulk(`${b.il}: ${F.ozelName} · peşin (${Math.round(kgO / 1000)} t)`, value)
        add(`${b.il}: üreticilere ödeme`, -(value + extra))
      }
      continue
    }
    const f = FRUIT[b.urun]
    const share = f.harvest[m] ?? 0
    if (share <= 0) continue
    const kg = decaresOf(f) * f.kgPerDecare * share * (1 - b.kayip)
    const value = kg * f.trader * s.traderIdx
    if (b.kanal === 'tesis' && b.tesis) {
      add(`${b.il}: ${f.name} avansı (${Math.round(kg / 1000)} t)`, -value * ADVANCE)
      add(`${b.il}: ${f.tesis.name.toLocaleLowerCase('tr')}`, -kg * f.proc * s.costIdx)
      s.receivables.push({
        amount: kg * f.coop * s.costIdx,
        due: m + 2,
        label: `${b.il}: ${f.name.toLocaleLowerCase('tr')} satışı (tesisten)`,
        payout: { label: `${b.il}: üreticilere kalan`, amount: -value * (1 - ADVANCE) },
      })
      cards('vade')
    } else {
      const extra = bulk(`${b.il}: ${f.name.toLocaleLowerCase('tr')} tüccara, toplu (${Math.round(kg / 1000)} t)`, value)
      add(`${b.il}: üreticilere ödeme`, -(value + extra))
    }
    if (b.kayip > 0) notes.push(`${b.il}: donda ürünün %${Math.round(b.kayip * 100)}'i gitti.`)
  }

  // ── Enflasyon
  s.costIdx *= 1 + COST_INFLATION
  s.traderIdx *= 1 + TRADER_INFLATION
  if (m === 2) cards('enflasyon')

  // kasa eksiye düşünce oyun bitmez: kriz kartı gelir (sim/events.ts); üst üste ikinci ay eksiyse iflas
  if (s.cash < 0) {
    s.crisis += 1
    if (s.crisis === 1) s.trust = Math.max(0, s.trust - 10) // ödemeler aksayınca üyeler duyar
    if (s.crisis >= 2) s.over = 'iflas'
  } else s.crisis = 0
  if (lines.some((l) => l.amount < 0) && s.cash < 150_000 && s.receivables.length > 0) cards('vade')

  s.history.push(Math.round(s.cash))
  s.sold += lines.filter((l) => l.amount > 0 && /satış|Market/.test(l.label)).reduce((x, l) => x + l.amount, 0)
  s.lastReport = { month: m, lines, notes, profit: Math.round(valueCreated(s) - s.memberExtra - v0), cashDelta: Math.round(s.cash - s0.cash), fee: Math.round(fee) }
  s.newCards = [...new Set(s.newCards)].filter((c) => !s.cardsSeen.includes(c))
  s.month += 1
  if (s.month >= 12 && !s.over) s.over = 'yil-bitti'
  return s
}

/** Kartları okundu say. */
export function seeCards(s0: State): State {
  const s = clone(s0)
  s.cardsSeen.push(...s.newCards)
  s.newCards = []
  return s
}

const branchAssets = (s: State) => s.subeler.filter((b) => b.tesis && FRUIT[b.urun]).reduce((a, b) => a + FRUIT[b.urun].tesis.cost * (1 - DEPRECIATION), 0)

export function valueParts(s: State) {
  const receivable = s.receivables.reduce((a, r) => a + r.amount, 0)
  const owed = s.owed.oil + s.owed.honey + s.receivables.reduce((a, r) => a - (r.payout?.amount ?? 0), 0)
  const stock = s.stock.oil * OLIVE.traderPrice * s.traderIdx + s.stock.honey * HONEY.traderPrice * s.traderIdx
  const investments = (Object.keys(INVEST) as InvestId[])
    .filter((k) => s.invest[k])
    .reduce((a, k) => a + INVEST[k].cost * (1 - DEPRECIATION), 0)
  return [
    { label: 'Kasadaki değişim', amount: s.cash - START_CASH },
    { label: 'Gelecek tahsilatlar', amount: receivable },
    { label: 'Depodaki ürün', amount: stock },
    { label: 'Yatırımların kalan değeri', amount: investments + branchAssets(s) },
    { label: 'Üyelere borç ve kredi', amount: -owed - s.debt },
    { label: 'Üyelere doğrudan geçen (yem, sözleşme)', amount: s.memberExtra },
  ].filter((x) => Math.round(x.amount) !== 0)
}

/** Kooperatifin yarattığı değer: kasa, alacak, stok, yatırımların kalan değeri, eksi borçlar; artı üyelere doğrudan geçen. */
export function valueCreated(s: State) {
  const receivable = s.receivables.reduce((a, r) => a + r.amount, 0)
  const stock = s.stock.oil * OLIVE.traderPrice * s.traderIdx + s.stock.honey * HONEY.traderPrice * s.traderIdx
  const investments = (Object.keys(INVEST) as InvestId[])
    .filter((k) => s.invest[k])
    .reduce((a, k) => a + INVEST[k].cost * (1 - DEPRECIATION), 0)
  const owed = s.owed.oil + s.owed.honey + s.receivables.reduce((a, r) => a - (r.payout?.amount ?? 0), 0)
  return s.cash + receivable + stock + investments + branchAssets(s) - owed - s.debt - START_CASH + s.memberExtra
}

/** Serbest yılda köyde görünen kalıcı izler (Valley "upgrades" kimlikleri). */
export const GROWTH_NAMES: Record<number, string> = {
  1: 'Kooperatif deposu',
  2: 'Kooperatif tabelası',
  3: 'Süt tankı ve silo',
  4: 'Analizli bal tabelası',
  5: 'Sözleşmeli kamyon',
  6: 'Şişeleme atölyesi',
  7: 'Köy şenlendi',
}
export function growth(s: State): number[] {
  const u: number[] = []
  if (s.members.length >= 1) u.push(1)
  if (s.members.length >= 3) u.push(2)
  if (s.invest.tank) u.push(3)
  if (s.invest.analiz) u.push(4)
  if (s.contract) u.push(5)
  if (s.invest.dolum) u.push(6)
  if (s.trust >= 80 && s.members.length >= 2) u.push(7)
  return u
}

/** Yeni yıl: kooperatif kasası, üyeleri, yatırımları, borcu ve güveniyle devam eder; takvim başa döner. */
export function newYear(s0: State): State {
  const s = clone(s0)
  s.prevValue = valueCreated(s0)
  s.year += 1
  s.month = 0
  s.over = null
  s.crisis = 0
  s.history = []
  s.log = []
  s.evDone = []
  s.events = []
  s.newCards = []
  s.lastReport = null
  s.contract = false // sözleşme yıllık
  s.sold = 0
  s.subeler = s.subeler.map((b) => ({ ...b, sigorta: false, kayip: 0, kotaCut: 0, kesinti: 0, iade: false, itu: false })) // sigorta yıllık, kayıp ve kota yılın
  s.receivables = s.receivables.map((r) => ({ ...r, due: r.due - 12 })) // vadeler yeni takvime taşınır
  return s
}
