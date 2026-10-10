// Ürün aileleri: 81 il, ürününün ailesinin kurallarıyla oynanır (Plan v3). Hazır olanlar READY'de.
// Rakamlar: ✅ kaynaklı · ≈ tahmini (Faz 7'de doğrulanacak) · 🎲 oyun ayarı.

export type Family = 'meyve' | 'tahil' | 'sebze' | 'fabrika' | 'findik' | 'zeytin' | 'hayvan'

export const FAMILY_OF: Record<string, Family> = {
  kayisi: 'meyve', kiraz: 'meyve', elma: 'meyve', seftali: 'meyve', narenciye: 'meyve', incir: 'meyve', nar: 'meyve', ceviz: 'meyve', kestane: 'meyve',
  bugday: 'tahil', mercimek: 'tahil', nohut: 'tahil', misir: 'tahil', celtik: 'tahil', aycicegi: 'tahil',
  domates: 'sebze', sera: 'sebze', sebze: 'sebze', patates: 'sebze', muz: 'sebze', yerfistigi: 'sebze',
  cay: 'fabrika', pancar: 'fabrika', tutun: 'fabrika', hashas: 'fabrika', pamuk: 'fabrika', gul: 'fabrika',
  findik: 'findik', fistik: 'findik',
  zeytin: 'zeytin', uzum: 'zeytin',
  mera: 'hayvan', bal: 'hayvan',
}

export const FAMILY_NAMES: Record<Family, string> = {
  meyve: 'Meyve', tahil: 'Tahıl ve bakliyat', sebze: 'Sebze ve hal', fabrika: 'Fabrikaya giden ürünler', findik: 'Fındık ve fıstık', zeytin: 'Zeytin ve bağ', hayvan: 'Hayvancılık',
}

/** Oynanabilir aileler (her faz biri eklenir). */
export const READY: Family[] = ['meyve', 'fabrika', 'findik', 'tahil', 'sebze', 'hayvan', 'zeytin']

export type Fruit = {
  name: string
  harvest: Record<number, number> // ay (0 = Ekim) → hasadın payı
  kgPerDecare: number // ≈ yaş ürün
  trader: number // ≈ tüccarın bahçede verdiği ₺/kg
  coop: number // ≈ tesisle (kurutma, soğuk depo, ihracat paketi) satınca ₺/kg
  proc: number // ≈ tesiste işleme ₺/kg
  tesis: { name: string; cost: number } // 🎲
  frost: { months: number[]; chance: number } // ≈ don uyarısı gelince gerçekleşme ihtimali
}

export const FRUIT: Record<string, Fruit> = {
  // ✅ Malatya 2026 yaş kayısı bahçede silme 50–60 ₺, seçme 70–80 ₺ (İHA, Haziran 2026); ✅ kuru kayısı FOB 7,9–8,3 €/kg
  // (Eylül 2026), ✅ 4 kg yaştan 1 kg kuru → kurutup ihracata yaş başına ~75 ₺ ≈; kurutma işçiliği ≈
  kayisi: { name: 'Kayısı', harvest: { 9: 0.6, 10: 0.4 }, kgPerDecare: 900, trader: 55, coop: 80, proc: 10, tesis: { name: 'Kurutma ve paketleme tesisi', cost: 180_000 }, frost: { months: [5, 6], chance: 0.4 } },
  // ✅ 2026 ihracatlık kiraz bahçede 60 ₺ (Sultandağı), sezonda 15–60 ₺; ihracat paketiyle 80 ₺ ≈
  kiraz: { name: 'Kiraz', harvest: { 8: 1 }, kgPerDecare: 700, trader: 45, coop: 80, proc: 10, tesis: { name: 'Ön soğutma ve ihracat paketleme', cost: 210_000 }, frost: { months: [5, 6], chance: 0.3 } },
  // ✅ Eğirdir 2025 dalında sofralık 30–40 ₺, meyve suyuna 5 ₺; ✅ soğuk depo 5 ₺/kg; 2026'da ~1 milyon t bolluk → ≈ 25 ₺
  elma: { name: 'Elma', harvest: { 11: 0.5, 0: 0.5 }, kgPerDecare: 3000, trader: 25, coop: 40, proc: 5, tesis: { name: 'Soğuk hava deposu', cost: 240_000 }, frost: { months: [6], chance: 0.25 } },
  seftali: { name: 'Şeftali', harvest: { 9: 1 }, kgPerDecare: 2000, trader: 14, coop: 24, proc: 4, tesis: { name: 'Ön soğutma ve paketleme', cost: 180_000 }, frost: { months: [5, 6], chance: 0.3 } },
  narenciye: { name: 'Narenciye', harvest: { 1: 0.4, 2: 0.4, 3: 0.2 }, kgPerDecare: 3000, trader: 8, coop: 14, proc: 3, tesis: { name: 'Paketleme evi', cost: 180_000 }, frost: { months: [3], chance: 0.15 } },
  // ✅ Tariş 2026/27 kuru incir A1 250 ₺ … A11 80 ₺; ≈ 3 kg yaştan 1 kg kuru → yaş başına ~50 ₺, tüccar ≈
  incir: { name: 'İncir', harvest: { 10: 0.7, 11: 0.3 }, kgPerDecare: 600, trader: 30, coop: 55, proc: 8, tesis: { name: 'Kurutma ve eleme tesisi', cost: 180_000 }, frost: { months: [6], chance: 0.15 } },
  nar: { name: 'Nar', harvest: { 0: 0.6, 1: 0.4 }, kgPerDecare: 2000, trader: 15, coop: 26, proc: 4, tesis: { name: 'Soğuk hava deposu', cost: 210_000 }, frost: { months: [6], chance: 0.15 } },
  ceviz: { name: 'Ceviz', harvest: { 11: 0.6, 0: 0.4 }, kgPerDecare: 150, trader: 90, coop: 140, proc: 15, tesis: { name: 'Kırma ve paketleme tesisi', cost: 180_000 }, frost: { months: [6], chance: 0.25 } },
  // Zeytin ve bağ (meyve kalıbıyla: tüccara dane/yaş ya da kooperatifin tesisinde işleyip vadeli satış).
  // ✅ dekarda 195 kg zeytin, ✅ sıkım 9 ₺/kg (ÇTSO 2026), ≈ yağ verimi %22 × sızma 275 ₺/kg ✅ → dane başına ~60 ₺;
  // ≈ yağlık dane 40 ₺ (Marmarabirlik 2024/25'te 45 ₺ ✅; 2026'da toptan yağ ~200 ₺/lt'ye geriledi ✅)
  zeytin: { name: 'Zeytin', harvest: { 1: 0.3, 2: 0.45, 3: 0.25 }, kgPerDecare: 195, trader: 40, coop: 60, proc: 9, tesis: { name: 'Zeytinyağı sıkımhanesi', cost: 240_000 }, frost: { months: [3], chance: 0.1 } },
  // ✅ TMO 2026 çekirdeksiz kuru üzüm 85–100 ₺/kg; ≈ 4 kg yaştan 1 kg kuru → yaş başına ~23 ₺; ≈ yaş üzüm tüccarı 15 ₺
  // (Alaşehir'de yaş üzüm 2026'da geçen yılın yarısına düştü ✅), ≈ verim 1.800 kg/da
  uzum: { name: 'Üzüm', harvest: { 10: 0.6, 11: 0.4 }, kgPerDecare: 1800, trader: 15, coop: 23, proc: 3, tesis: { name: 'Kurutma ve eleme tesisi', cost: 180_000 }, frost: { months: [6], chance: 0.2 } },
  kestane: { name: 'Kestane', harvest: { 0: 0.7, 1: 0.3 }, kgPerDecare: 400, trader: 40, coop: 70, proc: 8, tesis: { name: 'Soğuk hava deposu', cost: 180_000 }, frost: { months: [6], chance: 0.15 } },
}

/** Fabrikaya giden ürünler: devlet kurumu ya da sözleşmeli fabrika iyi fiyat verir ama kotası vardır ve geç öder;
 *  kotaya girmeyen ürün özel alıcıya ucuz ve peşin gider. */
export type Factory = {
  name: string
  kurum: string // alıcının adı
  harvest: Record<number, number>
  kgPerDecare: number
  kurumPrice: number // ₺/kg
  ozelPrice: number // ₺/kg
  kota: number // kurumun aldığı pay (kontenjan)
  delay: number // kurumun ödeme gecikmesi (ay)
  ozelName: string
  unit?: string // dönüm yerine (hayvancılık: inek, kovan); kgPerDecare o zaman birim başına yıllık ürün
}

export const FACTORY: Record<string, Factory> = {
  // ✅ 2026 yaş çay alım fiyatı 35 ₺/kg (Habertürk); ✅ kotaya giremeyen çay özel sektöre ~27 ₺ (Cumhuriyet, 4.6.2026);
  // ✅ kontenjan dekarda günlük 50 → 30 kg (Dünya); ≈ kota payı, ≈ verim ve ödeme gecikmesi
  cay: { name: 'Yaş çay', kurum: 'ÇAYKUR', harvest: { 7: 0.45, 9: 0.3, 11: 0.25 }, kgPerDecare: 1100, kurumPrice: 35, ozelPrice: 27, kota: 0.65, delay: 1, ozelName: 'özel çay fabrikası' },
  // ✅ pancar 3.100 ₺/t, kota tamamlama primiyle (Bakanlık, 2025/26; 2026/27 fiyatı Ekim 2026'da henüz açıklanmadı); kota dışı fiyat ≈
  pancar: { name: 'Şeker pancarı', kurum: 'şeker fabrikası (sözleşmeli kota)', harvest: { 0: 0.6, 1: 0.4 }, kgPerDecare: 7000, kurumPrice: 3.1, ozelPrice: 2, kota: 0.8, delay: 2, ozelName: 'kota dışı alıcı' },
  // ✅ 2026 sözleşmeli tütün 260 ₺/kg ("İzmir tütünü", 2025'te 230; Medyascope 17.5.2026); serbest tüccar ≈
  tutun: { name: 'Tütün', kurum: 'sözleşmeli tütün firması', harvest: { 10: 0.6, 11: 0.4 }, kgPerDecare: 120, kurumPrice: 260, ozelPrice: 200, kota: 0.75, delay: 2, ozelName: 'serbest tüccar' },
  // ✅ TMO 2026'da ilk kez haşhaş tohumu alıyor, 140 ₺/kg; kapsül teslim edenden, kapsülün %10 fazlasına kadar (Bloomberg HT, 8.2026);
  // kapsül fiyatı, tohum verimi ve özel alıcı ≈
  hashas: { name: 'Haşhaş', kurum: 'TMO (izinli üretim)', harvest: { 9: 1 }, kgPerDecare: 70, kurumPrice: 140, ozelPrice: 110, kota: 0.9, delay: 1, ozelName: 'tohum alıcısı' },
  // ✅ Çukobirlik 2025/26 ön alım 44 randıman kütlü 31 ₺/kg; ✅ dekarda 400–450 kg (Söke 2026); çırçır fiyatı, kota, gecikme ≈
  pamuk: { name: 'Pamuk', kurum: 'Çukobirlik', harvest: { 11: 0.5, 0: 0.5 }, kgPerDecare: 450, kurumPrice: 31, ozelPrice: 28, kota: 0.9, delay: 2, ozelName: 'çırçır fabrikası' },
  // ✅ TMO 2026/27 Levant 250 ₺/kg, Giresun 255 ₺ (%50 randıman esaslı); ✅ serbest piyasa ~200 ₺; ✅ TMO 21 gün içinde öder
  findik: { name: 'Fındık', kurum: 'TMO', harvest: { 10: 0.6, 11: 0.4 }, kgPerDecare: 100, kurumPrice: 250, ozelPrice: 200, kota: 1, delay: 1, ozelName: 'serbest tüccar' }, // verim ≈
  // ✅ Gaziantep borsası kabuklu 609–650 ₺/kg, ortalama 623 (Ağustos 2026); ihracatçı üst uçtan, tüccar ortalamanın altı ≈
  fistik: { name: 'Antep fıstığı', kurum: 'sözleşmeli ihracatçı', harvest: { 10: 0.5, 11: 0.5 }, kgPerDecare: 120, kurumPrice: 650, ozelPrice: 600, kota: 0.7, delay: 2, ozelName: 'tüccar' },
  // Hayvancılık: fabrika kalıbıyla. ✅ USK çiğ süt 24,3 ₺/lt (Mayıs 2026) + soğutma ve nakliyeyi örgüt üstlenince 1,8 ₺;
  // ✅ inek başına yılda ~3.160 lt (USK 2021, en güncel); ✅ köyde üretici sütü tavsiyenin 1–2 ₺ altına verir (Köy-Koop İzmir,
  // Ocak 2026: tavsiye 22,2 iken 20–21 ₺) → mandıra 22 ₺ ≈; ✅ bal tüccar 163 ₺/kg, analizli kooperatif alımı 196 ₺/kg (config HONEY)
  mera: { name: 'Süt', unit: 'inek', kurum: 'süt fabrikası', harvest: { 6: 0.06, 7: 0.1, 8: 0.12, 9: 0.12, 10: 0.12, 11: 0.1, 0: 0.08, 1: 0.07, 2: 0.06, 3: 0.06, 4: 0.05, 5: 0.06 }, kgPerDecare: 3200, kurumPrice: 26.1, ozelPrice: 22, kota: 1, delay: 1, ozelName: 'köy mandırası' },
  bal: { name: 'Bal', unit: 'kovan', kurum: 'analizli bal alıcısı', harvest: { 11: 0.3, 0: 0.45, 1: 0.25 }, kgPerDecare: 12.5, kurumPrice: 196, ozelPrice: 163, kota: 1, delay: 1, ozelName: 'tüccar' },
  // ✅ Gülbirlik 2026 taban fiyatı 80 ₺/kg, ödeme hasat sonunda (DHA, 5.2026); özel fabrika ≈
  gul: { name: 'Yağ gülü', kurum: 'Gülbirlik', harvest: { 7: 0.6, 8: 0.4 }, kgPerDecare: 600, kurumPrice: 80, ozelPrice: 70, kota: 0.8, delay: 1, ozelName: 'özel gül yağı fabrikası' },
}
export const factoryDecares = (f: Factory) => Math.round(FIRST_YEAR_VALUE / (f.kgPerDecare * f.ozelPrice))

/** Tahıl ve bakliyat: hasatta tüccar ucuz ve peşin alır (herkes aynı anda satar); TMO iyi fiyat verir, 45 günde öder;
 *  lisanslı depoya konan ürün ELÜS olur: karşılığında kredi hemen, ürün fiyat yükselince satılır. */
export type Grain = {
  name: string
  harvest: Record<number, number>
  kgPerDecare: number
  tuccar: number // ₺/kg, harmanda peşin
  kurum: string
  kurumPrice: number // ₺/kg
  delay: number // kurumun ödeme gecikmesi (ay)
  depoPrice: number // ₺/kg, depoda DEPO_MONTHS ay bekleyince
  drought: { months: number[]; chance: number } // kuraklık uyarısı gelince gerçekleşme ihtimali ≈
}

export const GRAIN: Record<string, Grain> = {
  // ✅ TMO 2026 ekmeklik buğday 16.500 ₺/t, 45 gün içinde öder (Tarım ve Orman Bakanlığı, 2026); ✅ TMO Ekim satışı 18.500 ₺/t
  // (piyasanın tavanı); ✅ Konya kuru tarımda 200–250 kg/da, yağışlı yılda 450–500 (Karatay Ziraat Odası 2026);
  // ≈ harman fiyatı 14,8 ₺, ≈ 3 ay sonra 18,3 ₺, ≈ verim 350
  bugday: { name: 'Buğday', harvest: { 9: 1 }, kgPerDecare: 350, tuccar: 14.8, kurum: 'TMO', kurumPrice: 16.5, delay: 2, depoPrice: 18.3, drought: { months: [6], chance: 0.3 } },
  // ✅ TMO 2026 yeşil mercimek 32.000 ₺/t (CNBC-e); kalanı ≈
  mercimek: { name: 'Mercimek', harvest: { 8: 1 }, kgPerDecare: 120, tuccar: 28, kurum: 'TMO', kurumPrice: 32, delay: 2, depoPrice: 34, drought: { months: [6], chance: 0.3 } },
  nohut: { name: 'Nohut', harvest: { 9: 1 }, kgPerDecare: 150, tuccar: 30, kurum: 'TMO', kurumPrice: 35, delay: 2, depoPrice: 37, drought: { months: [7], chance: 0.3 } }, // ≈
  // ✅ TMO 2025 mısır 11.300 ₺/t; 2026'da piyasa üreticinin lehine diye fiyat açıklamadı; 2026 rakamları ≈
  misir: { name: 'Mısır', harvest: { 11: 0.5, 0: 0.5 }, kgPerDecare: 1100, tuccar: 11, kurum: 'TMO', kurumPrice: 12.5, delay: 2, depoPrice: 13.3, drought: { months: [9], chance: 0.2 } },
  // ✅ TMO 2026 Osmancık çeltik 32.000 ₺/t (Bengütürk); kalanı ≈
  celtik: { name: 'Çeltik', harvest: { 11: 0.5, 0: 0.5 }, kgPerDecare: 800, tuccar: 28, kurum: 'TMO', kurumPrice: 32, delay: 2, depoPrice: 34, drought: { months: [9], chance: 0.15 } },
  // ✅ Trakya Birlik 2026 ön alım %44 yağlı 37.000 ₺/t (2025 kesin 33 ₺/kg; Cumhuriyet 18.9.2026); tüccar ve depo sonrası ≈
  aycicegi: { name: 'Ayçiçeği', harvest: { 10: 0.6, 11: 0.4 }, kgPerDecare: 250, tuccar: 33, kurum: 'yağ fabrikası (birlik)', kurumPrice: 37, delay: 2, depoPrice: 39, drought: { months: [8], chance: 0.25 } },
}
/** Sebze ve hal: komisyoncu halde satar (fiyat günden güne oynar, %8 komisyon + %1 rüsum + %2 stopaj kesilir);
 *  ihracatçı ya da zincir market sabit fiyatla sipariş kadarını alır, 60 günde öder, kalıntı analizi ister. */
export type Veg = {
  name: string
  harvest: Record<number, number>
  kgPerDecare: number
  hal: number // ₺/kg, halde beklenen satış fiyatı (kesintilerden önce)
  alici: string
  aliciPrice: number // ₺/kg, sözleşmeli
  kota: number // alıcının siparişi, ürünün payı
}

export const VEG: Record<string, Veg> = {
  // ✅ Antalya'da 176 bin dekarda 2,68 milyon t domates (2025) → dekarda ~15 t; ✅ Antalya hali Eylül 2026 domates 20–45 ₺;
  // ≈ ihracatçı fiyatı ve sipariş payı
  sera: { name: 'Sera domatesi', harvest: { 1: 0.15, 2: 0.15, 3: 0.15, 4: 0.15, 5: 0.2, 6: 0.2 }, kgPerDecare: 15_000, hal: 30, alici: 'ihracatçı', aliciPrice: 35, kota: 0.6 },
  domates: { name: 'Domates', harvest: { 9: 0.3, 10: 0.45, 11: 0.25 }, kgPerDecare: 10_000, hal: 12.5, alici: 'zincir market', aliciPrice: 13.5, kota: 0.5 }, // ✅ verim ve hal (config TOMATO), alıcı ≈
  sebze: { name: 'Sebze', harvest: { 8: 0.3, 9: 0.4, 10: 0.3 }, kgPerDecare: 3000, hal: 18, alici: 'zincir market', aliciPrice: 19, kota: 0.5 }, // ≈
  // ≈ Niğde-Nevşehir güz fiyatı bulunamadı (Adana'da baharda tarlada 30 → 20 ₺, NTV 2026)
  patates: { name: 'Patates', harvest: { 10: 0.5, 11: 0.5 }, kgPerDecare: 4000, hal: 12, alici: 'cips fabrikası', aliciPrice: 12, kota: 0.6 },
  // ✅ Manavgat sera çıkışı 1. kalite 20–25 ₺, 10 ₺'ye kadar düştü (Temmuz 2026); Anamur bahçede 27–30 ₺ (2024); hal ≈
  muz: { name: 'Muz', harvest: { 0: 0.3, 1: 0.4, 2: 0.3 }, kgPerDecare: 4000, hal: 28, alici: 'zincir market', aliciPrice: 30, kota: 0.5 },
  // ✅ Kadirli 2026 kabuklu tarlada 50–60 ₺, iyi kalite peşin 45–50 ₺ (Cumhuriyet, Eylül 2026); fabrika ≈
  yerfistigi: { name: 'Yer fıstığı', harvest: { 11: 0.5, 0: 0.5 }, kgPerDecare: 450, hal: 58, alici: 'kavurma fabrikası', aliciPrice: 62, kota: 0.6 },
}
export const HAL_CUT = 0.08 + 0.01 + 0.02 // ✅ komisyon en fazla %8 (5957 s. Kanun), rüsum %1, stopaj %2
export const HAL_CUT_COOP = 0.05 + 0.01 + 0.02 // ≈ toplu sevkiyatta komisyoncuyla pazarlık: %5
export const HAL_SWING = 0.3 // ≈ ay ay hal fiyatının oynaması (Eylül 2026'da aynı gün 20–45 ₺)
export const IADE_PRICE = 12 // ≈ analizde dönen partinin iç piyasada eline geçen ₺/kg (iade nakliyesi düşülmüş)
export const IADE_CHANCE = 0.3 // ≈ bekleme süresine uyulmayan yılda partinin dönme ihtimali
export const ITU_COST = 0.02 // ≈ iyi tarım eğitimi ve ön analiz, ürün değerinin payı
export const vegDecares = (v: Veg) => Math.round((FIRST_YEAR_VALUE / (v.kgPerDecare * v.hal * (1 - HAL_CUT))) * 10) / 10

export const grainDecares = (g: Grain) => Math.round(FIRST_YEAR_VALUE / (g.kgPerDecare * g.tuccar))
export const DEPO_MONTHS = 3 // 🎲 lisanslı depoda bekleme
export const DEPO_RENT = 85.5 / 1000 // ✅ 2026 lisanslı depo tarifesi buğday 85,5 ₺/ton/ay (30.1.2026)
export const RENT_SUPPORT = 0.75 // ✅ kiranın %75'i devletten (Tarım ve Orman Bakanlığı, 2025–2027 destek modeli; 2024'te %60)
export const ELUS_LOAN = 0.75 // ✅ ELÜS değerinin %75'ine kadar kredi (Ziraat, Tarım Kredi); faizsiz olması ≈
export const DROUGHT_LOSS = 0.45 // ≈ kurak yılda verim 450 → 250 kg/da civarı
export const DROUGHT_GUARDED = 0.2 // ≈ can suyu (yağmurlama) ile kayıp
export const DROUGHT_GUARD_COST = 0.04 // ≈ can suyu bedeli (mazot, elektrik), ürün değerinin payı

// Kışlık yem (Erzurum): ✅ hayvan 6 ay ahırda; ≈ baş başına günde 11 kg kuru ot; ✅ çayır otu balyası ~100 ₺ (Horasan),
// ✅ saman Eylül'den kışa %20+ pahalanır; ≈ kışın alınan ot 6,5 ₺/kg
export const HAY_NEED = 330 // ≈ kg / baş / ay
export const HAY_AUTUMN = 4.5 // ≈ ₺/kg, sonbaharda stoklarken
export const HAY_WINTER = 6.5 // ≈ ₺/kg, kışın ihtiyaç oldukça
export const WINTER_MONTHS: Record<number, number> = { 5: 0.25, 6: 0.5, 7: 0.25 } // ✅ ortalama 6 ay; ≈ uzun/kısa kış ihtimali

export const SUBE_COST = 120_000 // 🎲 şube açılışı: depo kirası, kantar, ilk personel (denge 10-06: 250 bin iken ilk yıl iflas)
export const SUBE_FIXED = 5_000 // 🎲 şubenin aylık gideri
export const FIRST_YEAR_VALUE = 450_000 // 🎲 şubenin ilk yıl üreticilerinin tüccar fiyatıyla ürün değeri (dönümü buna göre)
export const TARSIM_RATE = 0.06 // ≈ meyvede don dahil prim oranı, ürün değerinin yüzdesi
export const TARSIM_SUPPORT = 0.5 // ✅ devlet prim desteği %50 (5363 sayılı Tarım Sigortaları Kanunu uygulaması)
export const TARSIM_COVER = 0.8 // ≈ hasarın ödenen kısmı (muafiyet sonrası)
export const FROST_LOSS = 0.6 // ≈ önlemsiz bahçede don kaybı
export const FROST_GUARDED = 0.15 // ≈ sisleme, rüzgâr makinesi, örtüyle kayıp
export const FROST_GUARD_COST = 0.05 // ≈ önlem bedeli, ürün değerinin payı

export const decaresOf = (f: Fruit) => Math.round(FIRST_YEAR_VALUE / (f.kgPerDecare * f.trader))

/** Bir ilde şubenin ürünü: o ilin ürünleri arasında hazır bir ailenin ilk ürünü. */
export function branchProduct(products: string[]): string | null {
  return products.find((p) => FRUIT[p] || FACTORY[p] || GRAIN[p] || VEG[p]) ?? null
}

/** Şubenin ürün yılı değeri (ilk yıl dönümü buna göre). */
export const decaresFor = (urun: string) => (FRUIT[urun] ? decaresOf(FRUIT[urun]) : GRAIN[urun] ? grainDecares(GRAIN[urun]) : VEG[urun] ? vegDecares(VEG[urun]) : factoryDecares(FACTORY[urun]))
/** Ürünün adı (hangi ailede olursa). */
export const urunName = (urun: string) => (FRUIT[urun] ?? FACTORY[urun] ?? GRAIN[urun] ?? VEG[urun]).name
/** Sigortalanabilir risk: meyvede don, tahılda kuraklık. */
export const riskMonths = (urun: string) => FRUIT[urun]?.frost.months ?? GRAIN[urun]?.drought.months ?? null
