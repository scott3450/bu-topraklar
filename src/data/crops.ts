// Haritadaki ürünler: nerede, ne kadar, neden orada.
// Her rakamın yanında kaynak ve yıl var. "kesinlik: düşük" olanlar kaynaklar arasında çelişen
// ya da ikincil kaynaktan gelen rakamlar; oyunda "yaklaşık" diye gösterilir.
// Araştırma: 2026-10-05.

export type Crop = {
  id: string
  name: string
  province: string // figürün durduğu il
  fact: string
  why: string
  confidence: 'yüksek' | 'düşük'
  source: { label: string; url: string }
}

export const crops: Crop[] = [
  {
    id: 'zeytin',
    name: 'Zeytin',
    province: 'Aydın',
    fact: 'Yağlık zeytinde ilk üç: İzmir %17,9, Manisa %16,9, Aydın %14,1 (2024).',
    why: 'Kışı ılık, yazı sıcak ve kurak Akdeniz iklimi. Zeytin sert dona dayanamaz; bu yüzden kıyıdan içeri, yüksek ve soğuk platolara çıkmaz.',
    confidence: 'yüksek',
    source: {
      label: 'TEPGE Zeytin Ürün Raporu 2024',
      url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2024%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/Zeytin%20%C3%9Cr%C3%BCn%20Raporu%20425-2024%20TEPGE.pdf',
    },
  },
  {
    id: 'cambali',
    name: 'Çam balı',
    province: 'Muğla',
    fact: 'Dünya çam balının yaklaşık %90\'ı Türkiye\'de, Türkiye\'ninkinin yaklaşık %80\'i Muğla\'da.',
    why: 'Çam balı çiçekten değil, kızılçam ağacında yaşayan bir böceğin (basra) salgısından yapılır. Muğla kıyılarının geniş kızılçam ormanları bu yüzden belirleyici.',
    confidence: 'düşük',
    source: {
      label: 'Ege İhracatçı Birlikleri',
      url: 'https://www.eib.org.tr/Sayfa.Asp?SI_Id=5A02DF31AF&HID=4882292A9F234817A5FAEAC28B5ED185',
    },
  },
  {
    id: 'sut',
    name: 'Süt',
    province: 'İzmir',
    fact: 'Süt sığırı sayısında ilk sıralar İzmir, Konya ve Erzurum (2025). Türkiye 2024\'te 22,5 milyon ton çiğ süt üretti; %93,6\'sı inek sütü.',
    why: 'Süt ineği bol ve ucuz yem ister. Konya ovası yem bitkisi (mısır silajı, yonca) ekiyor; İzmir ve Balıkesir\'de ise köklü bir süt sığırcılığı ve kooperatif geleneği var.',
    confidence: 'yüksek',
    source: {
      label: 'TEPGE Süt ve Süt Ürünleri Durum Tahmin Raporu 2025',
      url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Durum-Tahmin%20Raporlar%C4%B1/2025%20Durum-Tahmin%20Raporlar%C4%B1/S%C3%BCt%20ve%20S%C3%BCt%20%C3%9Cr%C3%BCnleri%20Durum%20Tahmin%20Raporu%202025-423.pdf',
    },
  },
  {
    id: 'domates',
    name: 'Domates',
    province: 'Antalya',
    fact: 'Antalya 2,63 milyon ton, Bursa 1,72, Manisa 1,25, İzmir 1,11 milyon ton (2024).',
    why: 'Antalya\'nın ılık kışı sayesinde seralarda kışın da domates yetişir. Bursa ve Manisa\'daki açık tarlalar yazın salçalık domates verir.',
    confidence: 'yüksek',
    source: {
      label: 'TEPGE Domates Ürün Raporu 2024',
      url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2024%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/Domates%20%C3%9Cr%C3%BCn%20Raporu%202024-396%20TEPGE.pdf',
    },
  },
  {
    id: 'findik',
    name: 'Fındık',
    province: 'Ordu',
    fact: 'Ordu 199 bin tonla ilk sırada; Türkiye toplamı 650 bin ton (2023) — yaklaşık üçte biri.',
    why: 'Bol yağışlı, ılıman ve nemli Karadeniz kıyısı. Fındık dik yamaçlarda da yetişir; makine giremeyen arazinin değerlendirilmesini sağlar.',
    confidence: 'yüksek',
    source: {
      label: 'Tarım ve Orman Bakanlığı, TÜİK 2023',
      url: 'https://www.tarimorman.gov.tr/BUGEM/Belgeler/Tar%C4%B1m%20Havzalar%C4%B1/2024_31.pdf',
    },
  },
  {
    id: 'cay',
    name: 'Çay',
    province: 'Rize',
    fact: 'Yaş çayın %68\'i Rize\'de; Trabzon %19, Artvin %11, Giresun %2 (2024).',
    why: 'Çay çok yağış (Rize yılda 2.000 mm\'yi aşar) ve asitli toprak ister. Türkiye\'de bu ikisi yalnız Doğu Karadeniz kıyısında bir arada.',
    confidence: 'yüksek',
    source: {
      label: 'TEPGE Çay Ürün Raporu 2025',
      url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2025%20%C3%9Cr%C3%BCn%20Raporu/%C3%87ay%20%C3%9Cr%C3%BCn%20Raporu%202025-414%20TEPGE.pdf',
    },
  },
  {
    id: 'kayisi',
    name: 'Kayısı',
    province: 'Malatya',
    fact: 'Kayısı üretiminin %54,4\'ü Malatya\'da (2024/25); kuru kayısıda pay çok daha yüksek.',
    why: 'Sıcak, kuru ve güneşli yazlar meyveyi tatlandırır ve açıkta kurutmayı mümkün kılar. En büyük risk ilkbahar dondur: çiçek donarsa o yıl hasat çöker.',
    confidence: 'yüksek',
    source: {
      label: 'TEPGE Kayısı Ürün Raporu 2024',
      url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/2024%20%C3%9Cr%C3%BCn%20Raporlar%C4%B1/Kay%C4%B1s%C4%B1%20%C3%9Cr%C3%BCn%20Raporu%202024-401%20TEPGE.pdf',
    },
  },
  {
    id: 'bugday',
    name: 'Buğday',
    province: 'Konya',
    fact: 'Konya buğdayın yaklaşık %10\'u ile ilk sırada, ardından Şanlıurfa %7,7 ve Ankara %4,9 (2022/23).',
    why: 'Buğday az suyla yetişir ve geniş, düz ovada makineyle ekilip biçilir. Karasal İç Anadolu\'nun kuru tarımı için en uygun ürün.',
    confidence: 'yüksek',
    source: {
      label: 'TEPGE Buğday Durum Tahmin Raporu 2024',
      url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Durum-Tahmin%20Raporlar%C4%B1/2024%20Durum-Tahmin%20Raporlar%C4%B1/Bu%C4%9Fday%20Durum%20Tahmin%20Raporu%202024-410%20TEPGE.pdf',
    },
  },
  {
    id: 'pamuk',
    name: 'Pamuk',
    province: 'Şanlıurfa',
    fact: 'Pamuk 21 ilde ekiliyor; alanın %86\'sı Şanlıurfa, Diyarbakır, Aydın, Hatay, Adana ve İzmir\'de. İlk sırada Şanlıurfa.',
    why: 'Pamuk uzun ve çok sıcak bir yaz ister, ama çok da su içer. Harran Ovası GAP barajlarıyla sulanmaya başlayınca Türkiye\'nin pamuk merkezi oldu.',
    confidence: 'yüksek',
    source: {
      label: 'TEPGE Pamuk Durum Tahmin Raporu 2024',
      url: 'https://arastirma.tarimorman.gov.tr/tepge/Belgeler/PDF%20Durum-Tahmin%20Raporlar%C4%B1/2024%20Durum-Tahmin%20Raporlar%C4%B1/Pamuk%20Durum%20Tahmin%20Raporu%202024-411%20TEPGE.pdf',
    },
  },
  {
    id: 'fistik',
    name: 'Antep fıstığı',
    province: 'Gaziantep',
    fact: 'En geniş alan ve en yüksek üretim Şanlıurfa\'da (2023: 60 bin ton); Gaziantep ürünün adını taşıyor.',
    why: 'Fıstık ağacı kuraklığa dayanıklıdır, sıcak ve kuru yaz ister ama kışın soğuğa da ihtiyaç duyar. Güneydoğu\'nun kurak, taşlık arazisinde yetişir.',
    confidence: 'yüksek',
    source: {
      label: 'Tarım ve Orman Bakanlığı, TÜİK 2023',
      url: 'https://www.tarimorman.gov.tr/BUGEM/Belgeler/Tar%C4%B1m%20Havzalar%C4%B1/2024_31.pdf',
    },
  },
]
