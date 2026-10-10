// Defter: oyunda geçen terimler. Tanım tek cümle, örnek oyunun kendi rakamıyla.
// Metinde [[id|görünen]] yazılır (ör. '[[vade|vadeyle]]'); bkz. rich() in Term.tsx.
import { HONEY, INVEST, LOAN_RATE, LOAN_STEP, MILK, OLIVE, TOMATO } from '../sim/config'
import { tl } from '../chapter/engine'
import { SHELF_PER_LT } from '../chapter/ch1'

export type Terim = { id: string; name: string; def: string; example: string; source?: string }

const pct = (n: number) => `%${(n * 100).toLocaleString('tr-TR')}`
const tin = (perKg: number) => (Math.round((perKg * 27) / 100) * 100).toLocaleString('tr-TR')

export const TERIMLER: Record<string, Terim> = {
  araci: {
    id: 'araci',
    name: 'Aracı',
    def: 'Üreticiyle son alıcı arasında malı alıp satan kişi ya da firma: tüccar, komisyoncu. Fiyatı çoğu zaman o koyar.',
    example: `Ayşe Teyze'nin yağına tüccar kilosu ${OLIVE.traderPrice} ₺ veriyor; aynı yağın market rafında litresi ${SHELF_PER_LT} ₺.`,
  },
  vade: {
    id: 'vade',
    name: 'Vade',
    def: 'Malın teslim edildiği günle parasının ödendiği gün arasındaki süre.',
    example: `Tüccar peşin öder, market ${OLIVE.chainDelay * 30} gün sonra. Bu sürede para lazımsa başka yerden bulunmalı.`,
    source: 'Tarımsal üreticiye vade en fazla 60 gün (TTK m.1530)',
  },
  'deger-zinciri': {
    id: 'deger-zinciri',
    name: 'Değer zinciri',
    def: 'Ürünün tarladan rafa giden yolu. Her halka (sıkım, şişeleme, satış) fiyata bir değer ekler.',
    example: `Ayşe Teyze yalnız ilk halkada kalırsa kilosuna ${OLIVE.traderPrice} ₺ alır. Şişelemeyi ve satışı kooperatif yapınca sonraki halkaların payı da üreticiye kalır.`,
  },
  // Bölüm 2
  avans: {
    id: 'avans',
    name: 'Avans',
    def: 'Ürünün parası gelmeden üreticiye önceden ödenen kısım.',
    example: `Kooperatif üyeye yağı teslim alınca avans öder; market parayı ${OLIVE.chainDelay * 30} gün sonra yollar. Arada o para kasadan çıkar.`,
  },
  'isletme-sermayesi': {
    id: 'isletme-sermayesi',
    name: 'İşletme sermayesi',
    def: 'Günlük işi döndürmek için kasada duran para: avans, maaş, tamir. Kâr etmek kasada para olduğu anlamına gelmez.',
    example: 'Bölüm 2\'de yıl sonunda kâr var ama Ocak\'ta kasa boşalabiliyor.',
  },
  ihtiyat: {
    id: 'ihtiyat',
    name: 'İhtiyat payı',
    def: 'Beklenmedik bir gider için kenarda tutulan para.',
    example: 'Ocak\'ta traktör tamiri ₺120.000 çıkıyor; kasada pay bırakmayan kooperatif o ay batıyor.',
  },
  faiz: {
    id: 'faiz',
    name: 'Faiz',
    def: 'Borç alınan paranın kullanım bedeli.',
    example: `${tl(LOAN_STEP)} kredinin aylık faizi ${pct(LOAN_RATE)}: iki ayda ${tl(LOAN_STEP * LOAN_RATE * 2)}.`,
    source: 'TL ticari kredi yıllık %49,3 (TCMB, Eylül 2026)',
  },
  // Bölüm 3
  olcek: {
    id: 'olcek',
    name: 'Ölçek ekonomisi',
    def: 'Çok alıp çok üretince birim maliyetin düşmesi. Sınırı da vardır: fazlası depoda bozulur, kasayı bağlar.',
    example: `Yem, sütün maliyetinin yaklaşık ${pct(MILK.feedShare)}'i. Dört çiftlik birlikte alınca indirim artıyor.`,
  },
  pesin: {
    id: 'pesin',
    name: 'Peşin',
    def: 'Malın parasının teslimde, hemen ödenmesi.',
    example: 'Toptancı toplu yem indirimini peşin ödemeye veriyor; kasa yetmezse indirim de yok.',
  },
  // Bölüm 4
  belge: {
    id: 'belge',
    name: 'Kalite belgesi',
    def: 'Ürünün ne olduğunu bağımsız bir laboratuvarın kanıtlaması. Alıcı gerçeği sahteden ayırabildiği için fazla öder.',
    example: `Analizli çam balının tenekesi ${tin(HONEY.coopPrice)} ₺, analizsizi ${tin(HONEY.traderPrice)} ₺.`,
    source: 'Teneke fiyatları: Türkiye Gazetesi, 2026',
  },
  'sabit-masraf': {
    id: 'sabit-masraf',
    name: 'Sabit masraf',
    def: 'Ne kadar ürettiğinden bağımsız ödenen masraf. Paylaşan çoğaldıkça kişi başına düşen azalır.',
    example: `Analiz ${tl(INVEST.analiz.cost)}: tek arıcıya ağır, dört arıcıya bölününce kişi başı ${tl(INVEST.analiz.cost / 4)}.`,
  },
  // Bölüm 5
  hal: {
    id: 'hal',
    name: 'Hal',
    def: 'Sebze ve meyvenin toptan alınıp satıldığı pazar yeri. Fiyat her gün gelen mala ve talebe göre değişir.',
    example: 'Herkes domatesini aynı ay hale getirince hal doyar, fiyat düşer.',
    source: 'Manisa hali salçalık domates 10–15 ₺/kg (2026)',
  },
  sozlesmeli: {
    id: 'sozlesmeli',
    name: 'Sözleşmeli üretim',
    def: 'Ekmeden önce alıcıyla fiyatın ve miktarın yazıya bağlanması.',
    example: `Fabrika ${TOMATO.factoryPrice.toLocaleString('tr-TR')} ₺/kg sabit veriyor: hal çökse de değişmez, yükselse de.`,
  },
  'fiyat-riski': {
    id: 'fiyat-riski',
    name: 'Fiyat riski',
    def: 'Ürün satılana kadar fiyatın düşebilme ihtimali. Korunmanın bedeli, iyi yılda kazancın bir kısmından vazgeçmektir.',
    example: `Domates ekilirken hal ${TOMATO.halPrice.toLocaleString('tr-TR')} ₺; yazın 4'e de inebilir, 11'e de çıkabilir.`,
  },
  komisyon: {
    id: 'komisyon',
    name: 'Komisyon',
    def: 'Halde malı satan komisyoncunun satış tutarından aldığı pay.',
    example: `${pct(TOMATO.commission)}: 100 ₺'lik domatesin ${TOMATO.commission * 100} ₺'si komisyoncunun.`,
    source: 'En fazla %8 (5957 sayılı Kanun)',
  },
  rusum: {
    id: 'rusum',
    name: 'Rüsum',
    def: 'Halde yapılan satıştan alınan harç.',
    example: `Halde satışta ${pct(TOMATO.halFee)}: 100 ₺'lik domatesten ${TOMATO.halFee * 100} ₺.`,
    source: 'Hal rüsumu, 5957 sayılı Kanun',
  },
  stopaj: {
    id: 'stopaj',
    name: 'Stopaj',
    def: 'Alıcının üreticiye öderken kesip üretici adına devlete yatırdığı vergi.',
    example: `Borsaya tescilli bitkisel üründe ${pct(TOMATO.withholding)}: 100 ₺'lik satıştan ${TOMATO.withholding * 100} ₺ kesilir.`,
    source: 'Müstahsil stopajı, GVK m.94',
  },
  // Meyve ailesi
  tarsim: {
    id: 'tarsim',
    name: 'TARSİM (tarım sigortası)',
    def: 'Devlet destekli tarım sigortası: üretici küçük bir prim öder, don, dolu, sel gibi afette kaybın büyük kısmı karşılanır.',
    example: 'Primin yarısını devlet öder. Meyvede en büyük risk ilkbahar donu: çiçek açtıktan sonra tek gece bütün yılın ürününü götürebilir.',
    source: 'Prim desteği %50 (5363 sayılı Tarım Sigortaları Kanunu uygulaması)',
  },
  // Fabrika ailesi
  kontenjan: {
    id: 'kontenjan',
    name: 'Kontenjan (kota)',
    def: 'Alıcının bir üreticiden ya da bir dönümden alacağı en fazla miktar. Kotayı aşan ürün başka alıcıya, genelde ucuza gider.',
    example: 'ÇAYKUR 2026\'da yaş çaya kilo başına 35 ₺ veriyor; kotaya sığmayan çay özel fabrikaya 27 ₺ civarında gidiyor.',
    source: 'Fiyat: Habertürk 2026; özel sektör: Cumhuriyet, 4.6.2026; kontenjan dekarda günlük 50→30 kg: Dünya',
  },
  // Fındık ailesi
  randiman: {
    id: 'randiman',
    name: 'Randıman',
    def: 'Kabuklu fındıktan çıkan sağlam iç oranı. Alıcı fiyatı buna göre verir; boş ve çürük fındık randımanı düşürür.',
    example: 'TMO 2026\'da %50 randımanlı Levant fındığa 250 ₺ veriyor; her fazla puan için kilo başına 5 ₺ ekliyor.',
    source: 'TMO 2026/27 alım fiyatları (Hürriyet, Haber Gazetesi derlemesi)',
  },
  // Tahıl ailesi
  elus: {
    id: 'elus',
    name: 'Lisanslı depo ve ELÜS',
    def: 'Devletin denetlediği depo. Teslim edilen ürün için elektronik ürün senedi (ELÜS) verilir; senet borsada satılır ya da bankada teminat olur, ürün beklerken para gelir.',
    example: 'Buğday hasatta tüccara 14,8 ₺ civarına gider; TMO 2026\'da 16,5 ₺ verir, Ekim\'de kendisi 18,5 ₺\'ye satar. Depoda bekleyen buğday için değerinin %75\'ine kadar kredi alınır, kiranın %75\'ini devlet öder.',
    source: 'TMO 2026 alım ve satış fiyatları (Tarım ve Orman Bakanlığı); lisanslı depo tarifesi 85,5 ₺/ton/ay (2026); kira desteği: TÜRİB',
  },
  // Sebze ailesi
  kalinti: {
    id: 'kalinti',
    name: 'Kalıntı ve bekleme süresi',
    def: 'İlacın üründe kalan izi. Her ilacın etiketinde son ilaçlamayla hasat arasında beklenecek gün yazar; beklenmezse kalıntı yasal sınırı aşar.',
    example: 'İhracatta parti alıcı ülkede analize girer; sınır aşılırsa geri döner ve iç piyasada çok ucuza gider. Bekleme süresine uymak tek yoldur.',
    source: 'Bitki koruma ürünleri etiket kuralı (hasat aralığı); ihracatta analiz: Ticaret Bakanlığı Rusya pazar bilgileri 2026',
  },
  // Şanlıurfa
  tuzlanma: {
    id: 'tuzlanma',
    name: 'Tuzlanma',
    def: 'Fazla sulanan, suyu akıp gitmeyen toprakta su buharlaşır, tuz yüzeyde kalır. Yıllar içinde verim düşer, sonunda tarla ekilemez olur.',
    example: "Harran Ovası'nda yaklaşık 30 bin hektar tuzdan terk edildi. Salmada suyun yarısı boşa gider; damla %45 az su kullanır, tarlaya giren tuzu yarıya indirir.",
    source: 'Harran Ovası tuzlanma çalışmaları (DergiPark); sulama randımanları: Bayer, Türktarım; damla hibesi %50: Kırsal Kalkınma 2026/10',
  },
  // Hayvancılık
  kislik: {
    id: 'kislik',
    name: 'Kışlık yem (stok)',
    def: 'Hayvanın kış boyunca yiyeceği ot ve saman. Yazın biçilip ya da sonbaharda ucuzken alınıp depolanır; kışın alınan ot hem pahalı hem kıt olur.',
    example: "Erzurum'da hayvanlar altı ay ahırda kalır. Saman Eylül'den kışa %20'den fazla pahalanır. Az stokla giren, şubatta ya pahalı ot alır ya hayvanını ucuza satar.",
    source: 'Erzurum besleme çalışmaları (Atatürk Üniv.); saman fiyatları 2026: Köyden Haber, Bolu Olay',
  },
}
