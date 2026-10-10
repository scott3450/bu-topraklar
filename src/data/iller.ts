// 81 il: arazi tipi, kıyı, başlıca ürünler (önce gelen daha baskın).
// Ürün listeleri genel bilgiden derlendi; 10-05'te 25+ ürünün lider illeri kaynakla kontrol edilip
// listeler düzeltildi (Konya mısır/ayçiçeği, İzmir incir, Burdur gül…). Kalanı ≈.
// Kaynaklı rakamlar FACTS'te; kartta "yaklaşık" yerine rakam ve kaynak gösterilir.
// Arazi: o = ova, t = tepelik, y = yayla, d = dağlık. Araştırma: 2026-10-05.

export type Il = { relief: 'o' | 't' | 'y' | 'd'; coast: boolean; products: string[] }

export const ILLER: Record<string, Il> = {
  // Marmara
  İstanbul: { relief: 't', coast: true, products: ['sebze', 'aycicegi', 'mera'] },
  Edirne: { relief: 'o', coast: true, products: ['celtik', 'aycicegi', 'bugday'] },
  Kırklareli: { relief: 't', coast: true, products: ['aycicegi', 'bugday', 'mera'] },
  Tekirdağ: { relief: 'o', coast: true, products: ['aycicegi', 'bugday', 'uzum'] },
  Çanakkale: { relief: 't', coast: true, products: ['seftali', 'zeytin', 'domates'] },
  Balıkesir: { relief: 't', coast: true, products: ['zeytin', 'mera', 'bugday'] },
  Bursa: { relief: 'o', coast: true, products: ['seftali', 'domates', 'zeytin'] },
  Bilecik: { relief: 't', coast: false, products: ['bugday', 'mera'] },
  Kocaeli: { relief: 't', coast: true, products: ['sebze', 'mera'] },
  Sakarya: { relief: 'o', coast: true, products: ['findik', 'misir', 'sebze'] },
  Yalova: { relief: 't', coast: true, products: ['sera', 'sebze'] },
  // Ege
  İzmir: { relief: 't', coast: true, products: ['zeytin', 'incir', 'uzum', 'narenciye', 'mera'] },
  Manisa: { relief: 'o', coast: false, products: ['uzum', 'zeytin', 'domates', 'tutun', 'kiraz'] },
  Aydın: { relief: 'o', coast: false, products: ['zeytin', 'incir', 'pamuk', 'kestane'] },
  Denizli: { relief: 't', coast: false, products: ['uzum', 'tutun', 'nar', 'ceviz', 'hashas'] },
  Muğla: { relief: 'd', coast: true, products: ['zeytin', 'narenciye', 'bal', 'nar'] },
  Uşak: { relief: 'y', coast: false, products: ['bugday', 'hashas', 'mera'] },
  Kütahya: { relief: 'y', coast: false, products: ['bugday', 'pancar', 'mera'] },
  Afyonkarahisar: { relief: 'y', coast: false, products: ['hashas', 'kiraz', 'patates', 'mera'] },
  // Akdeniz
  Antalya: { relief: 'd', coast: true, products: ['sera', 'domates', 'muz', 'narenciye', 'nar'] },
  Isparta: { relief: 'y', coast: false, products: ['elma', 'gul', 'kiraz'] },
  Burdur: { relief: 'y', coast: false, products: ['mera', 'gul', 'hashas', 'bugday'] },
  Mersin: { relief: 'd', coast: true, products: ['narenciye', 'muz', 'uzum', 'seftali', 'kayisi'] },
  Adana: { relief: 'o', coast: true, products: ['narenciye', 'misir', 'yerfistigi', 'pamuk', 'bal'] },
  Osmaniye: { relief: 'o', coast: false, products: ['yerfistigi', 'misir', 'narenciye'] },
  Hatay: { relief: 'o', coast: true, products: ['narenciye', 'zeytin', 'pamuk'] },
  Kahramanmaraş: { relief: 'd', coast: false, products: ['bugday', 'ceviz', 'pamuk', 'mera'] },
  // İç Anadolu
  Ankara: { relief: 'y', coast: false, products: ['bugday', 'pancar', 'mera'] },
  Konya: { relief: 'o', coast: false, products: ['bugday', 'pancar', 'misir', 'aycicegi', 'patates'] },
  Karaman: { relief: 'y', coast: false, products: ['elma', 'nohut', 'bugday'] },
  Aksaray: { relief: 'o', coast: false, products: ['bugday', 'patates'] },
  Niğde: { relief: 'y', coast: false, products: ['patates', 'elma'] },
  Nevşehir: { relief: 'y', coast: false, products: ['patates', 'uzum'] },
  Kırşehir: { relief: 'y', coast: false, products: ['nohut', 'bugday'] },
  Kırıkkale: { relief: 'y', coast: false, products: ['bugday', 'mera'] },
  Kayseri: { relief: 'y', coast: false, products: ['pancar', 'bugday', 'mera'] },
  Sivas: { relief: 'y', coast: false, products: ['bugday', 'mera'] },
  Yozgat: { relief: 'y', coast: false, products: ['nohut', 'bugday', 'pancar'] },
  Çankırı: { relief: 'y', coast: false, products: ['bugday', 'mera'] },
  Eskişehir: { relief: 'y', coast: false, products: ['pancar', 'bugday'] },
  // Karadeniz
  Zonguldak: { relief: 'd', coast: true, products: ['findik', 'mera'] },
  Bartın: { relief: 'd', coast: true, products: ['findik', 'mera'] },
  Karabük: { relief: 'd', coast: false, products: ['bugday', 'mera'] },
  Düzce: { relief: 't', coast: true, products: ['findik', 'misir'] },
  Bolu: { relief: 'd', coast: false, products: ['patates', 'mera'] },
  Kastamonu: { relief: 'd', coast: true, products: ['bugday', 'kestane', 'mera'] },
  Sinop: { relief: 't', coast: true, products: ['kestane', 'bugday', 'mera'] },
  Samsun: { relief: 'o', coast: true, products: ['celtik', 'findik', 'tutun', 'sebze'] },
  Çorum: { relief: 'y', coast: false, products: ['bugday', 'nohut'] },
  Amasya: { relief: 't', coast: false, products: ['elma', 'kiraz'] },
  Tokat: { relief: 't', coast: false, products: ['domates', 'kiraz', 'bugday'] },
  Ordu: { relief: 'd', coast: true, products: ['findik', 'bal'] },
  Giresun: { relief: 'd', coast: true, products: ['findik'] },
  Trabzon: { relief: 'd', coast: true, products: ['cay', 'findik'] },
  Rize: { relief: 'd', coast: true, products: ['cay'] },
  Artvin: { relief: 'd', coast: true, products: ['cay', 'bal'] },
  Gümüşhane: { relief: 'd', coast: false, products: ['mera', 'elma'] },
  Bayburt: { relief: 'y', coast: false, products: ['bugday', 'mera'] },
  // Doğu Anadolu
  Erzurum: { relief: 'y', coast: false, products: ['mera', 'bugday'] },
  Erzincan: { relief: 'd', coast: false, products: ['kayisi', 'bugday', 'mera'] },
  Kars: { relief: 'y', coast: false, products: ['mera'] },
  Ardahan: { relief: 'y', coast: false, products: ['mera'] },
  Iğdır: { relief: 'o', coast: false, products: ['kayisi', 'pamuk'] },
  Ağrı: { relief: 'y', coast: false, products: ['mera', 'bugday'] },
  Van: { relief: 'y', coast: false, products: ['mera', 'bugday'] },
  Muş: { relief: 'y', coast: false, products: ['bugday', 'pancar', 'mera'] },
  Bitlis: { relief: 'd', coast: false, products: ['mera'] },
  Bingöl: { relief: 'd', coast: false, products: ['mera', 'bal'] },
  Tunceli: { relief: 'd', coast: false, products: ['mera', 'ceviz'] },
  Elazığ: { relief: 't', coast: false, products: ['kayisi', 'uzum'] },
  Malatya: { relief: 't', coast: false, products: ['kayisi'] },
  Hakkâri: { relief: 'd', coast: false, products: ['mera'] },
  // Güneydoğu Anadolu
  Gaziantep: { relief: 't', coast: false, products: ['fistik', 'zeytin', 'uzum'] },
  Kilis: { relief: 't', coast: false, products: ['zeytin', 'uzum'] },
  Adıyaman: { relief: 't', coast: false, products: ['tutun', 'fistik', 'mercimek'] },
  Şanlıurfa: { relief: 'o', coast: false, products: ['pamuk', 'fistik', 'mercimek', 'misir'] },
  Diyarbakır: { relief: 'o', coast: false, products: ['pamuk', 'mercimek', 'bugday'] },
  Mardin: { relief: 't', coast: false, products: ['mercimek', 'uzum'] },
  Batman: { relief: 't', coast: false, products: ['mercimek', 'bugday', 'pamuk'] },
  Siirt: { relief: 'd', coast: false, products: ['fistik', 'mercimek'] },
  Şırnak: { relief: 'd', coast: false, products: ['mera'] },
}

/** Kaynaklı il-ürün bilgileri (kartta rakamla gösterilir). */
const BASE_FACTS: Record<string, Record<string, { fact: string; source: string; url: string }>> = {
  Adana: { narenciye: { fact: 'Mandalinanın %44\'ü Adana\'da (2024).', source: 'TÜİK 2024, haber derlemesi', url: 'https://www.milliyet.com.tr/egitim/haritalar/turkiye-mandalina-uretim-haritasi-mandalina-nerelerde-yetisir-il-il-en-cok-mandalina-yetistirilen-bolgeler-6309226' } },
  Hatay: { narenciye: { fact: 'Mandalinanın %26\'sı Hatay\'da (2024).', source: 'TÜİK 2024, haber derlemesi', url: 'https://www.milliyet.com.tr/egitim/haritalar/turkiye-mandalina-uretim-haritasi-mandalina-nerelerde-yetisir-il-il-en-cok-mandalina-yetistirilen-bolgeler-6309226' } },
  Mersin: {
    narenciye: { fact: 'Mandalinanın %16\'sı Mersin\'de (2024).', source: 'TÜİK 2024, haber derlemesi', url: 'https://www.milliyet.com.tr/egitim/haritalar/turkiye-mandalina-uretim-haritasi-mandalina-nerelerde-yetisir-il-il-en-cok-mandalina-yetistirilen-bolgeler-6309226' },
    muz: { fact: 'Muz üretim alanının %50,5\'i Mersin\'de (2024).', source: 'TÜİK 2024, haber derlemesi', url: 'https://tr.wikipedia.org/wiki/T%C3%BCrkiye%27de_muz_%C3%BCretimi' },
  },
  İzmir: {
    narenciye: { fact: 'Mandalinanın %8\'i İzmir\'de (2024).', source: 'TÜİK 2024, haber derlemesi', url: 'https://www.milliyet.com.tr/egitim/haritalar/turkiye-mandalina-uretim-haritasi-mandalina-nerelerde-yetisir-il-il-en-cok-mandalina-yetistirilen-bolgeler-6309226' },
    zeytin: { fact: 'Yağlık zeytinin %17,9\'u İzmir\'de; Türkiye birincisi (2024).', source: 'TEPGE Zeytin Ürün Raporu 2024', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2024%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/Zeytin%20%C3%9Cr%C3%BCn%20Raporu%20425-2024%20TEPGE.pdf' },
  },
  Manisa: { zeytin: { fact: 'Yağlık zeytinin %16,9\'u Manisa\'da (2024).', source: 'TEPGE Zeytin Ürün Raporu 2024', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2024%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/Zeytin%20%C3%9Cr%C3%BCn%20Raporu%20425-2024%20TEPGE.pdf' } },
  Antalya: {
    muz: { fact: 'Muz üretim alanının %45,4\'ü Antalya\'da (2024).', source: 'TÜİK 2024, haber derlemesi', url: 'https://tr.wikipedia.org/wiki/T%C3%BCrkiye%27de_muz_%C3%BCretimi' },
    domates: { fact: 'Antalya 2,63 milyon tonla domateste birinci (2024).', source: 'TEPGE Domates Ürün Raporu 2024', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2024%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/Domates%20%C3%9Cr%C3%BCn%20Raporu%202024-396%20TEPGE.pdf' },
  },
  Çanakkale: { seftali: { fact: 'Şeftalide Türkiye birincisi (TÜİK, 2025).', source: 'TÜİK 2025, haber derlemesi', url: 'https://www.haberler.com/ekonomi/canakkale-58-tarimsal-urunde-turkiye-ilk-10-unda-19953036-haberi/' } },
  Bursa: {
    seftali: { fact: 'Her yıl ortalama 170–200 bin ton şeftali.', source: 'Dergi Bursa', url: 'https://www.dergibursa.com.tr/seftaliler-yariliyor-almayana-dariliyor/' },
    domates: { fact: '1,72 milyon tonla domateste ikinci (2024).', source: 'TEPGE Domates Ürün Raporu 2024', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2024%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/Domates%20%C3%9Cr%C3%BCn%20Raporu%202024-396%20TEPGE.pdf' },
  },
  Isparta: { elma: { fact: 'Elmanın %23,1\'i Isparta\'da; Türkiye birincisi (2024).', source: 'TÜİK 2024, haber derlemesi', url: 'https://www.haber32.com.tr/turkiyede-en-cok-elma-nerede-yetisiyor' } },
  Karaman: { elma: { fact: 'Elmada Isparta\'dan sonra ikinci (%15,5, 2023).', source: 'Karaman yatırım ajansı', url: 'https://www.karamandayatirim.gov.tr/assets/upload/dosyalar/karaman-elmasi.pdf' } },
  Konya: { bugday: { fact: 'Buğdayın yaklaşık %10\'u Konya\'da; birinci (2022/23).', source: 'TEPGE Buğday Durum Tahmin 2024', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Durum-Tahmin%20Raporlar%C4%B1/2024%20Durum-Tahmin%20Raporlar%C4%B1/Bu%C4%9Fday%20Durum%20Tahmin%20Raporu%202024-410%20TEPGE.pdf' } },
  Ordu: { findik: { fact: 'Fındıkta 199 bin tonla birinci (2023).', source: 'Tarım ve Orman Bakanlığı', url: 'https://www.tarimorman.gov.tr/BUGEM/Belgeler/Tar%C4%B1m%20Havzalar%C4%B1/2024_31.pdf' } },
  Rize: { cay: { fact: 'Yaş çayın %68\'i Rize\'de (2024).', source: 'TEPGE Çay Ürün Raporu 2025', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/%C3%87ay%20%C3%9Cr%C3%BCn%20Raporu%202025-414%20TEPGE.pdf' } },
  Trabzon: { cay: { fact: 'Yaş çayın %19\'u Trabzon\'da (2024).', source: 'TEPGE Çay Ürün Raporu 2025', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/%C3%87ay%20%C3%9Cr%C3%BCn%20Raporu%202025-414%20TEPGE.pdf' } },
  Artvin: { cay: { fact: 'Yaş çayın %11\'i Artvin\'de (2024).', source: 'TEPGE Çay Ürün Raporu 2025', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/%C3%87ay%20%C3%9Cr%C3%BCn%20Raporu%202025-414%20TEPGE.pdf' } },
  Malatya: { kayisi: { fact: 'Kayısının %54,4\'ü Malatya\'da (2024/25).', source: 'TEPGE Kayısı Ürün Raporu 2024', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2024%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/Kay%C4%B1s%C4%B1%20%C3%9Cr%C3%BCn%20Raporu%202024-401%20TEPGE.pdf' } },
  Şanlıurfa: {
    pamuk: { fact: 'Pamuk alanının en büyük kısmı; ilk sırada.', source: 'TEPGE Pamuk Durum Tahmin 2024', url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Durum-Tahmin%20Raporlar%C4%B1/2024%20Durum-Tahmin%20Raporlar%C4%B1/Pamuk%20Durum%20Tahmin%20Raporu%202024-411%20TEPGE.pdf' },
    fistik: { fact: 'Antep fıstığında en geniş alan ve üretim (2023: 60 bin ton).', source: 'Tarım ve Orman Bakanlığı', url: 'https://www.tarimorman.gov.tr/BUGEM/Belgeler/Tar%C4%B1m%20Havzalar%C4%B1/2024_31.pdf' },
  },
}

/** 10-05 doğrulaması: lider iller (her satır kaynaklı). */
const MORE: [string, string, string, string, string][] = [
  ['Aydın', 'incir', 'Kuru incirin %55,9\'u Aydın\'da (2024/25).', 'TEPGE İncir Piyasa Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1/2025-Temmuz%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Raporu/%C4%B0ncir%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1%20Raporu%20Temmuz-2025.pdf'],
  ['Aydın', 'kestane', 'Kestanenin %30\'dan fazlası Aydın\'da; birinci.', 'ZMO Kestane Raporu', 'https://www.zmo.org.tr/icerik/kestane-raporu-2019-28418'],
  ['İzmir', 'incir', 'İncirin %22\'si İzmir\'de (2024/25).', 'TEPGE İncir Piyasa Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1/2025-Temmuz%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Raporu/%C4%B0ncir%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1%20Raporu%20Temmuz-2025.pdf'],
  ['Manisa', 'uzum', 'Çekirdeksiz kuru üzümün %87,5\'i Manisa\'da (2024).', 'Manisa İl Tarım Müdürlüğü brifingi 2024', 'https://manisa.tarimorman.gov.tr/Belgeler/Brifing%202024/Brifing2024.pdf'],
  ['Manisa', 'tutun', 'Tütünde yaklaşık 16 bin tonla ön sıralarda (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.turkishtobacco.net/2024-denizli-tutun-uretimi-ve-piyasasi'],
  ['Niğde', 'patates', 'Patatesin %13,3\'ü Niğde\'de; birinci (2024).', 'TEPGE Patates Ürün Raporu', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/Patates%20%C3%9Cr%C3%BCn%20Raporu%202025-415%20TEPGE.pdf'],
  ['Şanlıurfa', 'mercimek', 'Kırmızı mercimeğin %43,2\'si Şanlıurfa\'da (2025).', 'TEPGE Mercimek Piyasa Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1/2025-Temmuz%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Raporu/Mercimek%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1%20Raporu%20Temmuz-2025.pdf'],
  ['Diyarbakır', 'mercimek', 'Kırmızı mercimeğin %28,2\'si Diyarbakır\'da (2025).', 'TEPGE Mercimek Piyasa Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1/2025-Temmuz%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Raporu/Mercimek%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1%20Raporu%20Temmuz-2025.pdf'],
  ['Siirt', 'mercimek', 'Kırmızı mercimeğin %12,2\'si Siirt\'te (2025).', 'TEPGE Mercimek Piyasa Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1/2025-Temmuz%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Raporu/Mercimek%20Tar%C4%B1m%20%C3%9Cr%C3%BCnleri%20Piyasalar%C4%B1%20Raporu%20Temmuz-2025.pdf'],
  ['Adana', 'yerfistigi', 'Yer fıstığının yarıdan fazlası Adana\'da (113 bin ton).', 'Para Dergi, 2024', 'https://www.paradergi.com.tr/sektorler/2024/10/28/uretimi-cukurovanin-disina-tasti'],
  ['Adana', 'bal', 'Balın %12,1\'i Adana\'da; ikinci (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.turkgun.com/ekonomi/2024-yili-bal-uretiminde-zirvede-olan-il-belli-oldu-ordu/269159'],
  ['Osmaniye', 'yerfistigi', 'Yer fıstığında 53,5 bin tonla ikinci; ürünün çoğu burada işlenir.', 'Para Dergi, 2024', 'https://www.paradergi.com.tr/sektorler/2024/10/28/uretimi-cukurovanin-disina-tasti'],
  ['Afyonkarahisar', 'hashas', 'Haşhaşın %31,3\'ü Afyonkarahisar\'da; birinci.', 'BAKA Haşhaş Fizibilite Raporu 2024', 'https://baka.gov.tr/assets/upload/dosyalar/hashas.pdf'],
  ['Denizli', 'hashas', 'Haşhaşın %13,5\'i Denizli\'de.', 'BAKA Haşhaş Fizibilite Raporu 2024', 'https://baka.gov.tr/assets/upload/dosyalar/hashas.pdf'],
  ['Denizli', 'tutun', 'Tütünde 15,3 bin tonla Ege birincisi (2024).', 'Denizli İl Tarım Müdürlüğü', 'https://denizli.tarimorman.gov.tr/Haber/931/Denizlide-Tutun-Uretimi'],
  ['Denizli', 'ceviz', 'Ceviz alanı ve üretiminde ilk sırada.', 'TEPGE Sert Kabuklu Meyveler Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/Sert%20Kabuklu%20Meyveler%20%C3%9Cr%C3%BCn%20Raporu%202025-420%20TEPGE.pdf'],
  ['Burdur', 'gul', 'Yağlık gülün %8,3\'ü Burdur\'da (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.uyan32.com/her-100-gulun-87si-ispartadan-peki-kalanlar-nerede-uretiliyor'],
  ['Isparta', 'gul', 'Yağlık gülün %87\'si Isparta\'da (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.uyan32.com/her-100-gulun-87si-ispartadan-peki-kalanlar-nerede-uretiliyor'],
  ['Adıyaman', 'tutun', 'Tütünde 23,1 bin tonla birinci (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.turkishtobacco.net/2024-denizli-tutun-uretimi-ve-piyasasi'],
  ['Muğla', 'bal', 'Balın %7,4\'ü Muğla\'da; çam balının merkezi (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.turkgun.com/ekonomi/2024-yili-bal-uretiminde-zirvede-olan-il-belli-oldu-ordu/269159'],
  ['Ordu', 'bal', 'Balın %13,6\'sı Ordu\'da; birinci (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.turkgun.com/ekonomi/2024-yili-bal-uretiminde-zirvede-olan-il-belli-oldu-ordu/269159'],
  ['Antalya', 'nar', 'Narda Türkiye birincisi; ardından Muğla, Mersin.', 'Milliyet nar üretim haritası', 'https://www.milliyet.com.tr/egitim/haritalar/turkiye-nar-uretim-haritasi-nar-nerelerde-yetisir-il-il-en-cok-nar-yetistirilen-bolgeler-6308334'],
  ['Konya', 'pancar', 'Şeker pancarında 5,7 milyon tonla birinci (2024).', 'TEPGE Şeker Pancarı Ürün Raporu', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2023%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/%C5%9Eeker%20Pancar%C4%B1%20ve%20%C5%9Eeker%20%C3%9Cr%C3%BCn%20Raporu%20388-2023%20TEPGE.pdf'],
  ['Konya', 'misir', 'Mısırın %22,7\'si Konya\'da; birinci.', 'TÜİK, haber derlemesi', 'https://www.gazeteipekyol.com/haber/9270652/en-cok-misir-uretimi-yapilan'],
  ['Konya', 'aycicegi', 'Ayçiçeğinde 263 bin tonla birinci (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.milliyet.com.tr/egitim/haritalar/turkiye-aycicegi-uretim-haritasi-aycicegi-nerelerde-yetisir-il-il-aycicek-yaginin-en-cok-yapildigi-bolgeler-6307423'],
  ['Tekirdağ', 'aycicegi', 'Ayçiçeğinde 211 bin tonla ikinci (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.milliyet.com.tr/egitim/haritalar/turkiye-aycicegi-uretim-haritasi-aycicegi-nerelerde-yetisir-il-il-aycicek-yaginin-en-cok-yapildigi-bolgeler-6307423'],
  ['Edirne', 'aycicegi', 'Ayçiçeğinde 175 bin tonla üçüncü (2024).', 'TÜİK 2024, haber derlemesi', 'https://www.milliyet.com.tr/egitim/haritalar/turkiye-aycicegi-uretim-haritasi-aycicegi-nerelerde-yetisir-il-il-aycicek-yaginin-en-cok-yapildigi-bolgeler-6307423'],
  ['Samsun', 'findik', 'Fındıkta ikinci (112 bin ton).', 'TEPGE Sert Kabuklu Meyveler Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/Sert%20Kabuklu%20Meyveler%20%C3%9Cr%C3%BCn%20Raporu%202025-420%20TEPGE.pdf'],
  ['Sakarya', 'findik', 'Fındıkta üçüncü (98 bin ton).', 'TEPGE Sert Kabuklu Meyveler Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/Sert%20Kabuklu%20Meyveler%20%C3%9Cr%C3%BCn%20Raporu%202025-420%20TEPGE.pdf'],
  ['Giresun', 'findik', 'Fındıkta dördüncü (92 bin ton).', 'TEPGE Sert Kabuklu Meyveler Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/Sert%20Kabuklu%20Meyveler%20%C3%9Cr%C3%BCn%20Raporu%202025-420%20TEPGE.pdf'],
  ['Düzce', 'findik', 'Fındığın %11\'i Düzce\'de.', 'TEPGE Sert Kabuklu Meyveler Raporu 2025', 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/Sert%20Kabuklu%20Meyveler%20%C3%9Cr%C3%BCn%20Raporu%202025-420%20TEPGE.pdf'],
]

export const FACTS: typeof BASE_FACTS = (() => {
  const f: typeof BASE_FACTS = structuredClone(BASE_FACTS)
  for (const [il, urun, fact, source, url] of MORE) (f[il] ??= {})[urun] = { fact, source, url }
  return f
})()
