// Ay sonu olay kartları: tüccar teklifi, üyenin derdi, arıza, don uyarısı, kriz…
// Her kartın seçenekleri sonucunu açıkça yazar; şans varsa ihtimali söylenir. Kartlar tekrar eder,
// rakam ve karakter değişir: bölümlerde öğrenilen dersler oyunda tekrar karşına çıkar.
import { INVEST, LOAN_STEP, type InvestId } from './config'

const EMERGENCY_FEE = 0.08 // 🎲 acil kredi: dosya masrafı + yüksek faiz farkı (planlı krediden pahalı)
import { NAMES, branchValue, canInsure, insureBranch, rand, setBulkFeed, tarsimPremium, type ProducerId, type State } from './engine'
import { HAY_AUTUMN, HAY_NEED, HAY_WINTER, WINTER_MONTHS, decaresFor, IADE_CHANCE, IADE_PRICE, ITU_COST, VEG, DROUGHT_GUARDED, DROUGHT_GUARD_COST, DROUGHT_LOSS, FACTORY, FROST_GUARDED, FROST_GUARD_COST, FROST_LOSS, FRUIT, GRAIN, TARSIM_COVER, TARSIM_SUPPORT, riskMonths, urunName } from '../data/aileler'

export type EvOption = { label: string; detail: string; apply: (s: State) => State }
export type EvView = { id: string; who: string; title: string; text: string; options: EvOption[]; term?: string }
type Inst = State['events'][number]

const tl = (n: number) => (n < 0 ? '−₺' : '₺') + Math.abs(Math.round(n)).toLocaleString('tr-TR')
const clone = (s: State): State => structuredClone(s)
const r1000 = (n: number) => Math.round(n / 1000) * 1000
const later = (s: State, months: number, amount: number, label: string) => s.receivables.push({ amount, due: s.month + months - 1, label })
const note = (s: State, text: string) => s.log.push({ month: s.month, text })

const NEEDS: Record<ProducerId, string> = {
  ayse: 'Gübre parası yetişmedi, bayi kapıya dayandı.',
  fatma: 'İnek hastalandı; veteriner ve ilaç parası lazım.',
  mehmet: 'Kovanlara ilaç ve kışlık şeker almam lazım.',
  hasan: 'Fide ve su parasını ödeyemedim.',
}

/** Kartın ekrandaki hâli ve seçenekleri. */
export function view(s: State, e: Inst): EvView {
  const k = s.costIdx
  switch (e.id) {
    case 'kriz': {
      // kriz yolları sınırlı ve pahalı: önceden planlamak (panelden kredi) her zaman daha ucuz kalsın
      const opts: EvOption[] = []
      if (!s.evDone.includes('kriz-kredi'))
        opts.push({
          label: 'Acil kredi al (yılda bir)',
          detail: `+${tl(LOAN_STEP)} · masraf ve yüksek faiz farkı ${tl(LOAN_STEP * EMERGENCY_FEE)} · güven −10`,
          apply: (s0) => {
            const s = clone(s0)
            s.cash += LOAN_STEP * (1 - EMERGENCY_FEE)
            s.debt += LOAN_STEP
            s.trust = Math.max(0, s.trust - 10)
            s.evDone.push('kriz-kredi')
            note(s, 'Krizde acil kredi alındı')
            return s
          },
        })
      const owned = (Object.keys(INVEST) as InvestId[]).filter((id) => s.invest[id])
      for (const id of owned)
        opts.push({
          label: `${INVEST[id].name} sat`,
          detail: `+${tl(INVEST[id].cost * 0.5)} (alışın yarısı) · o iş durur`,
          apply: (s0) => {
            const s = clone(s0)
            s.cash += INVEST[id].cost * 0.5
            s.invest[id] = false
            note(s, `${INVEST[id].name} satıldı`)
            return s
          },
        })
      if (s.members.length && !s.evDone.includes('kriz-ertele')) {
        const x = r1000(Math.min(200_000, -s.cash + 50_000))
        opts.push({
          label: 'Üyelere ödemeyi bir ay ertele',
          detail: `+${tl(x)} şimdi, gelecek ay geri · güven −20`,
          apply: (s0) => {
            const s = clone(s0)
            s.cash += x
            later(s, 1, -x, 'Ertelenen üye ödemesi')
            s.trust = Math.max(0, s.trust - 20)
            s.evDone.push('kriz-ertele')
            note(s, 'Üye ödemeleri ertelendi')
            return s
          },
        })
      }
      if (!opts.length)
        opts.push({ label: 'Kurtaracak yol kalmadı', detail: 'Gelecek ay kasa hâlâ eksideyse kooperatif batar', apply: (s0) => ({ ...clone(s0), events: s0.events.filter((x) => x.id !== 'kriz'), crisisGiveUp: true } as State) })
      return { id: e.id, who: 'Kasa', title: 'Kasa eksiye düştü', text: `Kasa ${tl(s.cash)}. Bu ay kapatılmazsa gelecek ay kooperatif batar.`, options: opts, term: 'isletme-sermayesi' }
    }
    case 'guven': {
      const who = e.who!
      return {
        id: e.id,
        who: NAMES[who],
        title: `${NAMES[who]} ayrılıyor`,
        text: 'Ödemeler gecikti, sözler tutulmadı. "Tüccar hiç değilse parayı zamanında veriyordu."',
        options: [
          {
            label: 'Anladım',
            detail: 'Üye sayısı bir azalır',
            apply: (s0) => {
              const s = clone(s0)
              s.members = s.members.filter((m) => m !== who)
              s.trust = Math.min(100, s.trust + 15)
              note(s, `${NAMES[who]} güvensizlikten ayrıldı`)
              return s
            },
          },
        ],
      }
    }
    case 'onodeme': {
      const now = r1000(150_000 * k)
      const back = r1000(now * 1.35)
      return {
        id: e.id,
        who: 'Tüccar',
        title: 'Tüccar hasattan önce para veriyor',
        text: 'Şimdi peşin para; karşılığında hasatta yağın bir kısmını o alacak. Köyde çok yaygın.',
        term: 'faiz',
        options: [
          {
            label: 'Kabul et',
            detail: `şimdi +${tl(now)} · Ocak sonunda −${tl(back)} (iki ayda %35)`,
            apply: (s0) => {
              const s = clone(s0)
              s.cash += now
              s.receivables.push({ amount: -back, due: 3, label: 'Tüccara ön ödemenin karşılığı' })
              note(s, 'Tüccardan ön ödeme alındı')
              return s
            },
          },
          { label: 'Reddet', detail: 'Kasa olduğu gibi kalır', apply: (s) => s },
        ],
      }
    }
    case 'avans': {
      const who = e.who!
      const a = e.amount!
      return {
        id: e.id,
        who: NAMES[who],
        title: `${NAMES[who]} avans istiyor`,
        text: NEEDS[who],
        term: 'avans',
        options: [
          {
            label: 'Ver',
            detail: `−${tl(a)} şimdi, 3 ay sonra geri · güven +10`,
            apply: (s0) => {
              const s = clone(s0)
              s.cash -= a
              later(s, 3, a, `${NAMES[who]} avansı geri ödedi`)
              s.trust = Math.min(100, s.trust + 10)
              return s
            },
          },
          {
            label: 'Şimdi olmaz',
            detail: 'Kasa korunur · güven −15',
            apply: (s0) => {
              const s = clone(s0)
              s.trust = Math.max(0, s.trust - 15)
              return s
            },
          },
        ],
      }
    }
    case 'ariza': {
      const x = e.amount!
      return {
        id: e.id,
        who: 'Depo',
        title: 'Soğuk hava deposunun kompresörü yandı',
        text: 'Kışın hep bir şey bozulur. Tamir şart; nasıl ödeneceği senin kararın.',
        term: 'ihtiyat',
        options: [
          { label: 'Yetkili servis', detail: `−${tl(x)} şimdi, iş biter`, apply: (s0) => ({ ...clone(s0), cash: s0.cash - x }) },
          {
            label: 'Ucuz usta',
            detail: `−${tl(x * 0.4)} şimdi · 2 ay sonra yine bozulur: −${tl(x * 0.8)}`,
            apply: (s0) => {
              const s = clone(s0)
              s.cash -= x * 0.4
              later(s, 2, -x * 0.8, 'Kompresör yine bozuldu')
              return s
            },
          },
        ],
      }
    }
    case 'don': {
      const loss = r1000(120_000 * k)
      const guard = r1000(25_000 * k)
      return {
        id: e.id,
        who: 'Meteoroloji',
        title: 'Zirai don uyarısı',
        text: 'Bu gece don bekleniyor. Meteoroloji gelme ihtimaline %40 diyor.',
        options: [
          { label: 'Önlem al (sisleme, örtü)', detail: `−${tl(guard)} kesin`, apply: (s0) => ({ ...clone(s0), cash: s0.cash - guard }) },
          {
            label: 'Riske gir',
            detail: `%40 ihtimalle −${tl(loss)}, %60 hiçbir şey`,
            apply: (s0) => {
              const s = clone(s0)
              const hit = rand(s) < 0.4
              if (hit) s.cash -= loss
              s.events.unshift({ id: 'don-sonuc', amount: hit ? loss : 0 })
              return s
            },
          },
        ],
      }
    }
    case 'don-sonuc':
      return {
        id: e.id,
        who: 'Sabah',
        title: e.amount ? 'Don geldi' : 'Don gelmedi',
        text: e.amount ? `Çiçekler yandı; ürün kaybı ${tl(e.amount)}. Beklenen kayıp ${tl(e.amount * 0.4)} idi, önlem bundan ucuzdu.` : 'Şanslıydın. Ama beklenen kayıp önlemin bedelinden yüksekti; her yıl böyle oynamak sonunda pahalıya gelir.',
        options: [{ label: 'Tamam', detail: '', apply: (s) => s }],
      }
    case 'yem': {
      const extra = r1000(4000 * 0.65 * 23.4 * 0.1 * k)
      return {
        id: e.id,
        who: 'Fatma Abla',
        title: 'Yeme %10 zam geldi',
        text: 'Süt fiyatı aynı, yem pahalandı. Tek başına alınca pazarlık gücün yok.',
        term: 'olcek',
        options: [
          { label: 'Ortak yem alımına geç', detail: 'Dört çiftlik birlikte alır, indirim', apply: (s) => setBulkFeed(s, true) },
          { label: 'Şimdilik böyle', detail: `Fatma Abla'ya ayda yaklaşık −${tl(extra)}`, apply: (s0) => ({ ...clone(s0), trust: Math.max(0, s0.trust - 5), memberExtra: s0.memberExtra - extra * (12 - s0.month) }) },
        ],
      }
    }
    case 'tarsim': {
      const b = s.subeler.find((x) => x.il === e.il)!
      const prem = tarsimPremium(s, b)
      const grain = !!GRAIN[b.urun]
      return {
        id: e.id,
        who: `${e.il} şubesi`,
        title: 'TARSİM başvuru dönemi',
        text: grain
          ? `${urunName(b.urun)} tarlaları için devlet destekli gelir koruma sigortası. Primin yarısını devlet öder; kuraklıkta verim düşerse kaybın çoğu karşılanır.`
          : `${urunName(b.urun)} bahçeleri için don dahil devlet destekli sigorta. Primin yarısını devlet öder; don olursa kaybın çoğu karşılanır.`,
        term: 'tarsim',
        options: [
          { label: 'Sigorta yaptır', detail: `−${tl(prem)} (devlet payı düşülmüş, %${TARSIM_SUPPORT * 100} destek)`, apply: (s0) => insureBranch(s0, b.il) },
          { label: 'Gerek yok', detail: `Prim cepte kalır; ${grain ? 'kuraklık' : 'don'} gelirse kayıp kooperatifin`, apply: (s) => s },
        ],
      }
    }
    case 'meyve-don': {
      const b = s.subeler.find((x) => x.il === e.il)!
      const f = FRUIT[b.urun]
      const val = branchValue(s, b)
      const guard = r1000(val * FROST_GUARD_COST)
      const roll = (s0: State, loss: number, paid: number) => {
        const s = clone(s0)
        s.cash -= paid
        const hit = rand(s) < f.frost.chance
        const br = s.subeler.find((x) => x.il === b.il)!
        const lost = hit ? val * loss : 0
        if (hit) br.kayip = loss
        if (hit && br.sigorta) later(s, 1, lost * TARSIM_COVER, `${b.il}: TARSİM hasar ödemesi`)
        s.events.unshift({ id: 'meyve-don-sonuc', il: b.il, amount: Math.round(lost) })
        return s
      }
      return {
        id: e.id,
        who: `${e.il} · Meteoroloji`,
        title: `${f.name} bahçelerine don uyarısı`,
        text: `Bu gece zirai don bekleniyor; gelme ihtimali %${Math.round(f.frost.chance * 100)}. Bahçeler ${b.sigorta ? 'TARSİM sigortalı.' : 'sigortasız.'}`,
        term: 'tarsim',
        options: [
          { label: 'Önlem al (sisleme, rüzgâr makinesi)', detail: `−${tl(guard)} · don gelirse kayıp %${FROST_GUARDED * 100}`, apply: (s0) => roll(s0, FROST_GUARDED, guard) },
          {
            label: 'Riske gir',
            detail: `don gelirse ürünün %${FROST_LOSS * 100}'ı gider (≈ −${tl(val * FROST_LOSS)})${b.sigorta ? `; sigorta %${TARSIM_COVER * 100}'ini öder` : ''}`,
            apply: (s0) => roll(s0, FROST_LOSS, 0),
          },
        ],
      }
    }
    case 'kontenjan': {
      const b = s.subeler.find((x) => x.il === e.il)!
      const F = FACTORY[b.urun]
      return {
        id: e.id,
        who: `${e.il} · ${F.kurum}`,
        title: 'Kontenjan düşürüldü',
        text: `${F.kurum} günlük alımı kısıtladı (çayda dekarda günlük 50 kilodan 30 kiloya indi). Kotaya sığmayan ürün ya özel alıcıya ucuza gidecek ya da bekleyecek.`,
        term: 'kontenjan',
        options: [
          { label: `Fazlayı özel alıcıya ver`, detail: `${F.ozelPrice} ₺/kg, peşin · bu yıl kurumun payı %25 azalır`, apply: (s0) => setCut(s0, b.il, 0.25, 0) },
          { label: 'Bekle, kotada sıraya gir', detail: 'Hepsi kuruma gider ama bekleyen yaprak kalınlaşır: %12 kalite kesintisi', apply: (s0) => setCut(s0, b.il, 0, 0.12) },
        ],
      }
    }
    case 'kuraklik': {
      const b = s.subeler.find((x) => x.il === e.il)!
      const G = GRAIN[b.urun]
      const val = branchValue(s, b)
      const guard = r1000(val * DROUGHT_GUARD_COST)
      const roll = (s0: State, loss: number, paid: number) => {
        const s = clone(s0)
        s.cash -= paid
        const hit = rand(s) < G.drought.chance
        const br = s.subeler.find((x) => x.il === b.il)!
        const lost = hit ? val * loss : 0
        if (hit) br.kayip = loss
        if (hit && br.sigorta) later(s, 2, lost * TARSIM_COVER, `${b.il}: TARSİM gelir koruma ödemesi`)
        s.events.unshift({ id: 'kuraklik-sonuc', il: b.il, amount: Math.round(lost) })
        return s
      }
      return {
        id: e.id,
        who: `${e.il} · Meteoroloji`,
        title: 'Bahar yağmuru gecikti',
        text: `Toprakta nem az. Yağmur gelmezse ${G.name.toLocaleLowerCase('tr')} başak bağlarken kurur; ihtimal %${Math.round(G.drought.chance * 100)}. Tarlalar ${b.sigorta ? 'TARSİM sigortalı.' : 'sigortasız.'}`,
        term: 'tarsim',
        options: [
          { label: 'Can suyu ver (yağmurlama)', detail: `−${tl(guard)} mazot ve elektrik · kuraklık gelirse kayıp %${DROUGHT_GUARDED * 100}`, apply: (s0) => roll(s0, DROUGHT_GUARDED, guard) },
          {
            label: 'Yağmuru bekle',
            detail: `kuraklık gelirse ürünün %${DROUGHT_LOSS * 100}'i gider (≈ −${tl(val * DROUGHT_LOSS)})${b.sigorta ? `; sigorta %${TARSIM_COVER * 100}'ini öder` : ''}`,
            apply: (s0) => roll(s0, DROUGHT_LOSS, 0),
          },
        ],
      }
    }
    case 'kalinti': {
      const b = s.subeler.find((x) => x.il === e.il)!
      const V = VEG[b.urun]
      const cost = r1000(branchValue(s, b) * ITU_COST)
      return {
        id: e.id,
        who: `${e.il} · ${V.alici}`,
        title: 'Kalıntı analizi',
        text: `${V.alici[0].toLocaleUpperCase('tr')}${V.alici.slice(1)} partiyi alıcı ülkede analize sokacak. İlaçla hasat arasındaki bekleme süresine uyulmazsa kalıntı çıkar, parti geri döner.`,
        term: 'kalinti',
        options: [
          {
            label: 'Bekleme sürelerine uy, ön analiz yaptır',
            detail: `−${tl(cost)} eğitim ve analiz · parti dönmez`,
            apply: (s0) => {
              const s = clone(s0)
              s.cash -= cost
              const br = s.subeler.find((x) => x.il === b.il)!
              br.itu = true
              note(s, `${b.il}: iyi tarım eğitimi ve ön analiz`)
              return s
            },
          },
          {
            label: 'Gerek yok',
            detail: `%${Math.round(IADE_CHANCE * 100)} ihtimalle parti döner: o yıl sipariş ${IADE_PRICE} ₺/kg'a iç piyasaya gider`,
            apply: (s0) => {
              const s = clone(s0)
              const br = s.subeler.find((x) => x.il === b.il)!
              if (rand(s) < IADE_CHANCE) br.iade = true
              s.events.unshift({ id: 'kalinti-sonuc', il: b.il, amount: br.iade ? 1 : 0 })
              return s
            },
          },
        ],
      }
    }
    case 'kis': {
      const b = s.subeler.find((x) => x.il === e.il)!
      const heads = decaresFor(b.urun)
      const now = r1000(heads * HAY_NEED * 6 * HAY_AUTUMN * k)
      const avg = Object.entries(WINTER_MONTHS).reduce((a, [w, p]) => a + Number(w) * p, 0)
      return {
        id: e.id,
        who: `${e.il} · ahır`,
        title: 'Kış kapıda',
        text: `${heads} hayvan altı ay ahırda kalacak; kış uzun da gelebilir. Kışlık ot şimdi ucuz, şubatta pahalı.`,
        term: 'kislik',
        options: [
          {
            label: 'Şimdi altı aylık ot al',
            detail: `−${tl(now)} bugün · ${HAY_AUTUMN.toLocaleString('tr-TR')} ₺/kg`,
            apply: (s0) => {
              const s = clone(s0)
              s.cash -= now
              note(s, `${b.il}: kışlık ot stoklandı`)
              return s
            },
          },
          {
            label: 'Kışın ihtiyaç oldukça al',
            detail: `şubatta ${HAY_WINTER.toLocaleString('tr-TR')} ₺/kg · ortalama ≈ −${tl(heads * HAY_NEED * avg * HAY_WINTER * k)}, kış uzarsa fazlası`,
            apply: (s0) => {
              const s = clone(s0)
              let u = rand(s)
              let w = 6
              for (const [m, p] of Object.entries(WINTER_MONTHS)) if ((u -= p) < 0) { w = Number(m); break }
              later(s, 4, -r1000(heads * HAY_NEED * w * HAY_WINTER * k), `${b.il}: kışın alınan ot (${w} ay sürdü)`)
              return s
            },
          },
        ],
      }
    }
    case 'kalinti-sonuc': {
      const hit = (e.amount ?? 0) > 0
      return {
        id: e.id,
        who: `${e.il} · gümrük`,
        title: hit ? 'Parti geri döndü' : 'Parti geçti',
        text: hit
          ? 'Analizde izin verilen sınırın üstünde kalıntı çıktı. Bu yılın ihracat partileri iç piyasaya ucuza gidecek.'
          : 'Bu sefer analiz temiz çıktı. Ama her parti yeniden analize girer.',
        term: 'kalinti',
        options: [{ label: 'Tamam', detail: '', apply: (s) => s }],
      }
    }
    case 'kuraklik-sonuc': {
      const b = s.subeler.find((x) => x.il === e.il)
      const lost = e.amount ?? 0
      return {
        id: e.id,
        who: `${e.il} · hasat öncesi`,
        title: lost ? 'Kuraklık vurdu' : 'Yağmur geldi',
        text: lost
          ? `Başaklar cılız kaldı: ürün kaybı ${tl(lost)}.${b?.sigorta ? ` TARSİM iki ay içinde ${tl(lost * TARSIM_COVER)} ödeyecek.` : ' Sigorta olmadığı için kayıp kooperatifin ve üreticinin.'}`
          : 'Mayıs yağmurları yetişti. Ama kurak yıl her zaman yakın.',
        options: [{ label: 'Tamam', detail: '', apply: (s) => s }],
      }
    }
    case 'meyve-don-sonuc': {
      const b = s.subeler.find((x) => x.il === e.il)
      const lost = e.amount ?? 0
      return {
        id: e.id,
        who: `${e.il} · sabah`,
        title: lost ? 'Don geldi' : 'Don gelmedi',
        text: lost
          ? `Çiçeklerin bir kısmı yandı: ürün kaybı ${tl(lost)}.${b?.sigorta ? ` TARSİM gelecek ay ${tl(lost * TARSIM_COVER)} ödeyecek.` : ' Sigorta olmadığı için kayıp kooperatifin ve üreticinin.'}`
          : 'Bu gece şans yaver gitti. Ama her bahar bu soru yeniden gelecek.',
        options: [{ label: 'Tamam', detail: '', apply: (s) => s }],
      }
    }
  }
  return { id: e.id, who: '', title: e.id, text: '', options: [{ label: 'Tamam', detail: '', apply: (s) => s }] }
}

function setCut(s0: State, il: string, cut: number, kesinti: number): State {
  const s = clone(s0)
  const b = s.subeler.find((x) => x.il === il)
  if (b) Object.assign(b, { kotaCut: cut, kesinti })
  return s
}

/** Ay sonunda bu ayın kartlarını seçer (endMonth'tan sonra çağrılır). */
export function drawEvents(s0: State): State {
  const s = clone(s0)
  s.events = []
  if (s.over) return s
  const m = s.month // önümüzdeki ay
  if (s.cash < 0) s.events.push({ id: 'kriz' })
  if (s.trust < 35 && s.members.length > 1) s.events.push({ id: 'guven', who: s.members[s.members.length - 1] })
  const once = (id: string) => !s.evDone.includes(id)
  const pool: { id: string; when: boolean; p: number; inst: () => Inst }[] = [
    { id: 'onodeme', when: once('onodeme') && s.members.includes('ayse') && m === 1 /* Kasım başı, hasattan önce */, p: 0.6, inst: () => ({ id: 'onodeme' }) },
    { id: 'don', when: once('don') && (s.members.includes('ayse') || s.members.includes('hasan')) && [5, 6].includes(m % 12), p: 0.7, inst: () => ({ id: 'don' }) },
    { id: 'yem', when: once('yem') && s.members.includes('fatma') && !s.bulkFeed, p: 0.5, inst: () => ({ id: 'yem' }) },
    { id: 'ariza', when: once('ariza') && m >= 2, p: 0.18, inst: () => ({ id: 'ariza', amount: r1000(60_000 * s.costIdx) }) },
    {
      id: 'avans',
      when: s.members.length > 0,
      p: 0.25,
      inst: () => ({ id: 'avans', who: s.members[Math.floor(rand(s) * s.members.length)], amount: r1000(40_000 * s.costIdx) }),
    },
  ]
  // şube kartları: zamanı gelince kesin gelir (meyvede TARSİM başvurusu ve don uyarısı yıllık ders)
  for (const b of s.subeler) {
    const F = FACTORY[b.urun]
    if (F && b.kanal === 'kurum' && F.kota < 1) {
      const first = Math.min(...Object.keys(F.harvest).map(Number))
      if (m === first && once(`kontenjan-${b.il}`)) {
        s.events.push({ id: 'kontenjan', il: b.il })
        s.evDone.push(`kontenjan-${b.il}`)
      }
    }
    const risk = riskMonths(b.urun)
    if (risk && m === Math.min(...risk) - 2 && canInsure(s, b) && once(`tarsim-${b.il}`)) {
      s.events.push({ id: 'tarsim', il: b.il })
      s.evDone.push(`tarsim-${b.il}`)
    }
    if (b.urun === 'mera' && m === 1 && once(`kis-${b.il}`)) {
      s.events.push({ id: 'kis', il: b.il })
      s.evDone.push(`kis-${b.il}`)
    }
    const V = VEG[b.urun]
    if (V && b.kanal === 'kurum' && m === Math.min(...Object.keys(V.harvest).map(Number)) && once(`kalinti-${b.il}`)) {
      s.events.push({ id: 'kalinti', il: b.il })
      s.evDone.push(`kalinti-${b.il}`)
    }
    const G = GRAIN[b.urun]
    if (G && G.drought.months.includes(m % 12) && once(`kuraklik-${b.il}`)) {
      s.events.push({ id: 'kuraklik', il: b.il })
      s.evDone.push(`kuraklik-${b.il}`)
    }
    const f = FRUIT[b.urun]
    if (!f) continue
    if (f.frost.months.includes(m % 12) && once(`don-${b.il}`)) {
      s.events.push({ id: 'meyve-don', il: b.il })
      s.evDone.push(`don-${b.il}`)
    }
  }
  for (const c of pool) {
    if (s.events.length >= 2) break
    if (c.when && rand(s) < c.p) {
      s.events.push(c.inst())
      if (c.id !== 'avans') s.evDone.push(c.id)
    }
  }
  return s
}

/** Oyuncu bir seçenek seçti. Kriz kartı, kasa hâlâ eksiyse açık kalır. */
export function resolve(s0: State, index: number, option: number): State {
  const e = s0.events[index]
  if (!e) return s0
  const v = view(s0, e)
  const base = clone(s0)
  base.events = base.events.filter((_, i) => i !== index)
  let s = v.options[option].apply(base)
  const giveUp = (s as State & { crisisGiveUp?: boolean }).crisisGiveUp
  if (giveUp) delete (s as State & { crisisGiveUp?: boolean }).crisisGiveUp
  if (e.id === 'kriz' && s.cash < 0 && !giveUp) s = { ...s, events: [{ id: 'kriz' }, ...s.events] }
  if (s.cash >= 0 && e.id === 'kriz') s = { ...s, crisis: 0 }
  return s
}
