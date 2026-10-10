// Oyunun bütün rakamları burada. İşaretler:
//   ✅ kaynaklı gerçek rakam (kaynak yanında)
//   ≈  tahmini, doğrulanacak
//   🎲 oyun ayarı, gerçek değil; denge için
// Fiyatlar TL, Ekim 2026 başı.

export const MONTHS = [
  'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart',
  'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül',
] as const

export const START_CASH = 750_000 // 🎲 senin birikimin + kuruluş payları
export const FIXED_MONTHLY = 5_000 // 🎲 köyde küçük depo + muhasebe (denge 10-06: 12 bin iken düz oyun hep zarardaydı)
export const ADVANCE = 0.6 // ≈ kooperatif teslimde avans öder, kalanı ürün satılınca
export const COOP_FEE = 0.05 // 🎲 kooperatifin her satıştan aldığı hizmet payı
export const BULK_PREMIUM = 0.08 // 🎲 toplu satışta tüccardan alınan fazla fiyat: pazarlık gücü
export const MILK_BULK = 0.04 // 🎲 süt birlik hâlinde satılınca fabrikanın verdiği prim
export const COST_INFLATION = 0.025 // 🎲 aylık; maliyetler ve perakende
export const TRADER_INFLATION = 0.01 // 🎲 aylık; aracı/tüccar fiyatı geriden gelir
export const DEPRECIATION = 0.2 // 🎲 yatırımlar yılda %20 değer kaybeder
export const DIRECT_MONTHLY = 25_000 // 🎲 doğrudan satış: pazar tezgâhı, internet, reklam
export const DIRECT_SHIP = 35 // ≈ kargo, TL/kg
export const LOAN_STEP = 250_000 // 🎲
export const LOAN_RATE = 0.041 // ✅ TL ticari kredi yıllık %49,3 (Eylül 2026, TCMB verisi) ≈ aylık %4,1

export const INVEST = {
  dolum: { name: 'Şişeleme ve dolum hattı', cost: 350_000 }, // 🎲
  tank: { name: 'Soğutmalı süt tankı', cost: 450_000 }, // 🎲
  analiz: { name: 'Bal analiz anlaşması', cost: 60_000 }, // 🎲 laboratuvarla yıllık anlaşma
} as const
export type InvestId = keyof typeof INVEST

// ── Zeytin (Ayşe Teyze, Aydın) ─────────────────────────────
export const OLIVE = {
  decares: 40, // 🎲
  kgPerDecare: 195, // ✅ Türkiye ortalaması (arama özeti; birincil kaynakla doğrulanacak)
  oilYield: 0.22, // ≈ erken hasat soğuk sıkım %18–22, ticari ortalama %23–27 (ikincil kaynak)
  pressCostPerKgOlive: 9, // ✅ ÇTSO 2026: zeytin kilosu 9 TL'den, verime göre 12–14 TL (üye öder, kasaya girmez)
  harvest: { 1: 0.3, 2: 0.45, 3: 0.25 } as Record<number, number>, // Kasım–Ocak
  traderPrice: 275, // ✅ borsa sızma 250–300 TL/kg (Aydın, Edremit TB, 2026); Tariş 0,3 asit 320 TL/kg (2025/26)
  chainPrice: 520, // ≈ markete şişeli satış; raf fiyatı 810–900 TL/lt ✅
  chainDelay: 2, // ✅ TTK m.1530: tedarikçi tarımsal üretici/KOBİ ise vade en fazla 60 gün
  directPrice: 750, // ≈ doğrudan (pazar, internet) şişeli
  directCap: 100, // 🎲 kg/ay
  bottlingCost: 40, // 🎲 şişe + etiket, TL/kg
}

// ── Bal (Mehmet Amca, Muğla) ───────────────────────────────
export const HONEY = {
  hives: 120, // 🎲
  kgPerHive: 12.5, // ✅ TEPGE Arıcılık Ürün Raporu
  harvest: { 11: 0.3, 0: 0.45, 1: 0.25 } as Record<number, number>, // Eylül–Kasım
  traderPrice: 163, // ✅ tüccar 4.300–4.500 TL / 27 kg teneke (Türkiye Gazetesi, 2026)
  coopPrice: 196, // ✅ kooperatif alımı 5.300 TL / 27 kg (aynı haber); analiz şartı 🎲
  directPrice: 600, // ✅ perakende 500–700 TL/kg
  directCap: 40, // 🎲 kg/ay
  packCost: 30, // 🎲 kavanoz + etiket
}

// ── Süt (Fatma Abla, Tire) ─────────────────────────────────
export const MILK = {
  cows: 15, // 🎲
  kgPerCowYear: 3200, // ≈ Türkiye ortalaması (arama özeti)
  price: 24.3, // ✅ USK tavsiye, Mayıs 2026'dan beri; Ekim 2026'da devam
  costPerLitre: 23.4, // ≈ USK Mayıs 2026: 22,18 ✅; TÜSEDAD Ağustos 2026: 28,50 (sıcak süt) — kaynaklar ayrışıyor
  feedShare: 0.65, // ✅ yem maliyetin %62–70'i (TÜSEDAD hesabı %62,1)
  bulkFeedDiscount: 0.12, // 🎲 ortak yem alımı
  tankPremium: 1.2, // ≈ soğutmalı toplama primi, TL/lt (USK: soğutma gideri ilave ödenir ✅)
}

// ── Domates (Hasan Dayı, Manisa) ───────────────────────────
export const TOMATO = {
  decares: 30, // 🎲
  kgPerDecare: 10_000, // ✅ Saruhanlı ortalaması dekara 10 ton (haberler.com, 2026)
  harvest: { 9: 0.3, 10: 0.45, 11: 0.25 } as Record<number, number>, // Temmuz–Eylül
  halPrice: 12.5, // ✅ Manisa hali salçalık, 10–15 TL/kg (2026)
  halSwing: 0.2, // 🎲 ± oynaklık (0,5 iken sonuç karardan çok şansa bağlıydı; denge turu 10-06)
  halSaturationTons: 15, // 🎲 aynı ay her 15 tonda fiyat düşer
  halSaturationDrop: 0.12, // 🎲
  factoryPrice: 4.25, // ✅ fabrika alımı 3,5–5 TL/kg (2026)
  factoryDelay: 2, // ≈
  pickCost: 1, // ✅ toplama ~1 TL/kg
  haulCost: 0.35, // ✅ nakliye 30–40 kuruş
  commission: 0.08, // ✅ komisyoncu en fazla %8 (5957 sayılı Kanun)
  halFee: 0.01, // ✅ hal rüsumu, halde satış %1
  withholding: 0.02, // ✅ müstahsil stopajı, bitkisel, borsaya tescilli %2
  contractMonths: [5, 6], // 🎲 sözleşme Mart–Nisan imzalanır
}
